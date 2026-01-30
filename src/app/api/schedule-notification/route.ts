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
    try {
        const body = await request.json();
        const { action, token, time, heading, content, notificationId } = body;

        // 1. 알림 예약 (Schedule)
        if (action === 'schedule') {
            if (!token || !time) {
                return NextResponse.json({ error: 'Missing token or time' }, { status: 400 });
            }

            const scheduledDate = new Date(time);
            const now = new Date();
            // 초 단위 delay 계산 (최소 0초)
            const delay = Math.max(0, Math.floor((scheduledDate.getTime() - now.getTime()) / 1000));

            console.log(`[Schedule] Time: ${time}, Delay: ${delay}s`);

            // Upstash에 메시지 예약 발행
            // 예약된 시간이 되면 QStash가 이 API를 'execute-send' 액션으로 다시 호출함
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

            // Upstash Message ID를 반환 (취소 시 사용)
            return NextResponse.json({ success: true, notificationId: result.messageId });
        }

        // 2. 알림 실행 (Execute Send - Called by QStash)
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
            console.log('[Execute] FCM Sent:', response);
            return NextResponse.json({ success: true, messageId: response });
        }

        // 3. 알림 취소 (Cancel)
        else if (action === 'cancel') {
            if (!notificationId) {
                return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
            }

            try {
                await qstashClient.messages.delete(notificationId);
                console.log('[Cancel] QStash Message deleted:', notificationId);
                return NextResponse.json({ success: true });
            } catch (e) {
                console.error('[Cancel] Failed to delete QStash message:', e);
                // 이미 실행되었거나 없는 경우도 성공으로 처리
                return NextResponse.json({ success: true, warning: 'Message not found or already executed' });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
