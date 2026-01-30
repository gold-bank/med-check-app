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
        const { action, token, time, heading, content, notificationId } = body;
        console.log(`[API] Received action: ${action}, Time: ${time}`);

        // 1. 환경 변수 체크
        if (!process.env.QSTASH_TOKEN) {
            console.error('[API Error] QSTASH_TOKEN is missing!');
            return NextResponse.json({ error: 'Server config error: Missing QSTASH_TOKEN' }, { status: 500 });
        }

        // 2. 알림 예약 (Schedule)
        if (action === 'schedule') {
            if (!token || !time) {
                console.error('[API Error] Missing token or time for schedule');
                return NextResponse.json({ error: 'Missing token or time' }, { status: 400 });
            }

            // 시간 계산 (KST 고려 불필요 - Date 객체 차이는 UTC 기반으로 자동 계산됨)
            // 단, 클라이언트가 보낸 time이 어떤 타임존인지가 중요함 (ISO String 권장)
            const scheduledDate = new Date(time);
            const now = new Date();
            const diffMs = scheduledDate.getTime() - now.getTime();

            // 초 단위 delay 계산 (최소 0초)
            const delay = Math.max(0, Math.floor(diffMs / 1000));

            console.log(`[Schedule Check] Scheduled: ${scheduledDate.toISOString()}, Now: ${now.toISOString()}`);
            console.log(`[Schedule Check] Diff(ms): ${diffMs}, Delay(s): ${delay}`);

            if (delay <= 0) {
                console.warn('[Schedule Warning] Scheduled time is in the past. Sending immediately or setting short delay.');
            }

            console.log('[Upstash] Attempting to publishJSON...');

            // Upstash에 메시지 예약 발행
            const result = await qstashClient.publishJSON({
                url: `${process.env.APP_URL}/api/schedule-notification`,
                body: {
                    action: 'execute-send',
                    token,
                    heading,
                    content
                },
                delay: delay,
            });

            console.log('[Upstash] Success! Message ID:', result.messageId);
            return NextResponse.json({ success: true, notificationId: result.messageId });
        }

        // 3. 알림 실행 (Execute Send - Called by QStash)
        else if (action === 'execute-send') {
            console.log('[Execute] Sending actual FCM notification...');

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

            const response = await admin.messaging().send(message);
            console.log('[Execute] FCM Sent Result:', response);
            return NextResponse.json({ success: true, messageId: response });
        }

        // 4. 알림 취소 (Cancel)
        else if (action === 'cancel') {
            console.log(`[Cancel] Request to delete Msg ID: ${notificationId}`);

            // ID가 없어도 에러 처리하지 않고 성공으로 간주 (방어적 코드)
            if (!notificationId) {
                console.log('[Cancel] No notificationId provided. Skipping QStash deletion, but returning success.');
                return NextResponse.json({ success: true, message: 'No ID to cancel, skipping' });
            }

            try {
                await qstashClient.messages.delete(notificationId);
                console.log('[Cancel] QStash Message deleted successfully:', notificationId);
                return NextResponse.json({ success: true });
            } catch (e: any) {
                // 이미 삭제되었거나 존재하지 않는 경우도 성공으로 처리
                console.warn('[Cancel] Failed to delete QStash message (might be already sent/deleted):', e.message);
                return NextResponse.json({ success: true, warning: 'Message not found or already executed' });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[API Critical Error]:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
