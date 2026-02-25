import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Client } from "@upstash/qstash";

// FCM Init
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin Initialized.');
    } catch (error) {
        console.error('Firebase Admin Init Failed:', error);
    }
}

// QStash Init
const qstashClient = new Client({
    token: process.env.QSTASH_TOKEN || '',
});

export async function POST(request: Request) {
    // 0. 요청 수신 로그
    console.log('[API] /api/schedule-notification called');

    try {
        const body = await request.json();
        const { action, token, time, heading, content, notificationId, deviceId, slotId } = body;
        console.log(`[API] Received action: ${action}, Time: ${time}`);

        // 1. 환경 변수 체크
        if (!process.env.QSTASH_TOKEN) {
            console.error('[API Error] QSTASH_TOKEN is missing!');
            return NextResponse.json({ error: 'Server config error: Missing QSTASH_TOKEN' }, { status: 500 });
        }

        // 2. 알림 예약 (Schedule)
        if (action === 'schedule') {
            if (!token || !time || !deviceId || !slotId) {
                console.error('[API Error] Missing token, time, deviceId, or slotId for schedule');
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            // --- KST 시간을 UTC CRON으로 변환 ---
            const [targetHour, targetMinute] = time.split(':').map(Number);
            let utcHour = targetHour - 9;
            if (utcHour < 0) {
                utcHour += 24;
            }
            const cronString = `${targetMinute} ${utcHour} * * *`;

            console.log('='.repeat(40));
            console.log(`[Time Calc] Input Time (KST): ${time}`);
            console.log(`[Time Calc] CRON (UTC): ${cronString}`);
            console.log('='.repeat(40));

            console.log('[Upstash] Attempting to create schedule...');

            // Upstash에 매일 반복 예약(CRON)
            const result = await qstashClient.schedules.create({
                destination: `${process.env.APP_URL}/api/schedule-notification`,
                body: JSON.stringify({
                    action: 'execute-send',
                    token,
                    heading,
                    content,
                    deviceId,
                    slotId
                }),
                cron: cronString,
            });

            console.log('[Upstash] Success! Schedule ID:', result.scheduleId);
            return NextResponse.json({ success: true, notificationId: result.scheduleId });
        }

        // 3. 알림 실행 (Execute Send - Called by QStash)
        else if (action === 'execute-send') {
            console.log('[Execute] Sending actual FCM notification...');

            // DB 체킹(도장 확인)
            if (deviceId && slotId) {
                const nowKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
                const yyyy = nowKst.getUTCFullYear();
                const mm = String(nowKst.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(nowKst.getUTCDate()).padStart(2, '0');
                const todayDate = `${yyyy}${mm}${dd}`;

                const docId = `${deviceId}_${slotId}_${todayDate}`;
                const db = admin.firestore();

                try {
                    const docSnap = await db.collection('medicine_checks').doc(docId).get();
                    if (docSnap.exists && docSnap.data()?.checked) {
                        console.log(`[Execute] Skipped FCM! User (${deviceId}) already took ${slotId} medicine today.`);
                        return NextResponse.json({ success: true, message: 'Skipped - already checked' });
                    }
                } catch (e) {
                    console.error('[Execute DB Check Error]', e);
                    // 에러가 나더라도 알람은 발송되도록 계속 진행
                }
            }

            const message = {
                token: token,
                notification: {
                    title: heading || 'Medication Check',
                    body: content || 'Time to take your medicine!',
                },
                android: {
                    notification: {
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                        channelId: 'med_check_channel',
                    }
                },
                webpush: {
                    notification: {
                        icon: '/pill-icon.png',
                        badge: '/pill-icon.png',
                    }
                }
            };

            console.log('실제 FCM 발송 실행'); // 중복 호출 확인용 로그
            const response = await admin.messaging().send(message);
            console.log('[Execute] FCM Sent Result:', response);
            return NextResponse.json({ success: true, messageId: response });
        }

        // 4. 알림 취소 (Cancel)
        else if (action === 'cancel') {
            console.log(`[Cancel] Request to delete ID: ${notificationId}`);

            if (!notificationId) {
                console.log('[Cancel] No notificationId provided. Skipping QStash deletion, but returning success.');
                return NextResponse.json({ success: true, message: 'No ID to cancel, skipping' });
            }

            try {
                if (notificationId.startsWith('msg_')) {
                    // 구버전(단일 메시지) 삭제
                    await qstashClient.messages.delete(notificationId);
                } else {
                    // 신버전(CRON 스케줄) 삭제
                    await qstashClient.schedules.delete(notificationId);
                }
                console.log('[Cancel] QStash resource deleted successfully:', notificationId);
                return NextResponse.json({ success: true });
            } catch (e: any) {
                console.warn('[Cancel] Failed to delete QStash resource (might be already sent/deleted):', e.message);
                return NextResponse.json({ success: true, warning: 'Message not found or already executed' });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[API Critical Error]:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
