
import { NextResponse } from 'next/server';

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, playerId, time, slotId, heading, content, notificationId } = body;

        const apiKey = process.env.ONESIGNAL_REST_API_KEY;
        const appId = process.env.ONESIGNAL_APP_ID;

        if (!apiKey || !appId) {
            return NextResponse.json({ error: 'Missing OneSignal credentials' }, { status: 500 });
        }

        if (action === 'schedule') {
            if (!playerId || !time) {
                return NextResponse.json({ error: 'Missing playerId or time' }, { status: 400 });
            }

            // 알람 예약 (Create Notification)
            // time 포맷: ISO String 또는 그에 준하는 포맷
            const response = await fetch(ONESIGNAL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${apiKey}`,
                },
                body: JSON.stringify({
                    app_id: appId,
                    include_player_ids: [playerId], // 특정 사용자(기기)에게만 전송
                    headings: { en: heading || 'Medication Reminder', ko: heading || '약 복용 시간입니다!' },
                    contents: { en: content || 'It is time to take your medicine.', ko: content || '잊지 말고 약을 챙겨드세요.' },
                    send_after: time, // 예약 시간 (UTC ISO String 권장)
                    // 안드로이드/iOS 관련 설정 (필요 시 추가)
                    ios_sound: 'default',
                    android_sound: 'notification',
                }),
            });

            const data = await response.json();

            if (data.id) {
                return NextResponse.json({ success: true, notificationId: data.id });
            } else {
                return NextResponse.json({ success: false, error: data }, { status: 400 });
            }

        } else if (action === 'cancel') {
            if (!notificationId) {
                return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
            }

            // 예약 취소 (Cancel Notification)
            const cancelUrl = `${ONESIGNAL_API_URL}/${notificationId}?app_id=${appId}`;
            const response = await fetch(cancelUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                }
            });

            const data = await response.json();

            // OneSignal DELETE response format might vary, but usually returns success: true
            if (data.success) {
                return NextResponse.json({ success: true });
            } else {
                // 이미 전송되었거나 존재하지 않는 경우 등
                console.warn('Cancel failed or not found:', data);
                // 클라이언트 입장에서는 '취소됨'으로 처리해도 무방함
                return NextResponse.json({ success: true, warning: 'Notification not found or already sent' });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('API Error Details:', {
            message: error.message,
            stack: error.stack,
            envCheck: {
                hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY,
                hasAppId: !!process.env.ONESIGNAL_APP_ID
            }
        });
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
