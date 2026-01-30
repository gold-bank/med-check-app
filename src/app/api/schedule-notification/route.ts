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

            // --- KST 시간 계산 (서버 시간 기반) ---
            // 1. 현재 한국 시간 구하기 (UTC + 9시간)
            const now = new Date();
            const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));

            // 2. 목표 시간 파싱 ("HH:mm")
            const [targetHour, targetMinute] = time.split(':').map(Number);

            // 3. 목표 한국 시간 객체 생성
            const kstTarget = new Date(kstNow);
            kstTarget.setHours(targetHour, targetMinute, 0, 0);

            // 4. 이미 지났으면 내일로 설정
            if (kstTarget.getTime() <= kstNow.getTime()) {
                kstTarget.setDate(kstTarget.getDate() + 1);
            }

            // 5. Delay 계산 (초 단위)
            const diffMs = kstTarget.getTime() - kstNow.getTime();
            const delay = Math.floor(diffMs / 1000);

            // 로그 출력 (디버깅용)
            // .toISOString()은 끝에 'Z'를 붙여 UTC로 표시하지만, 여기서는 값이 KST로 시프트된 상태임
            // 헷갈리지 않게 문자열 치환하여 KST로 표기
            const formatEpocToKstString = (dateObj: Date) => dateObj.toISOString().replace('Z', ' KST');

            console.log('='.repeat(40));
            console.log(`[Time Calc] Input Time: ${time}`);
            console.log(`[Time Calc] Current KST: ${formatEpocToKstString(kstNow)}`);
            console.log(`[Time Calc] Target  KST: ${formatEpocToKstString(kstTarget)}`);
            console.log(`[Time Calc] Delay (sec): ${delay}`);
            console.log('='.repeat(40));

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
                retries: 0, // 중복 방지를 위해 재시도 제한
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
