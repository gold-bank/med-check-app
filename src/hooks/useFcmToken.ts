import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../lib/firebase';

export default function useFcmToken() {
    const [token, setToken] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = useState('');

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    const messaging = getMessaging(app);

                    // 권한 요청
                    const permission = await Notification.requestPermission();
                    setNotificationPermission(permission);

                    if (permission === 'granted') {
                        const currentToken = await getToken(messaging, {
                            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                        });
                        if (currentToken) {
                            console.log('FCM Token:', currentToken); // 디버깅용
                            setToken(currentToken);
                        } else {
                            console.warn('No registration token available.');
                        }

                        // 포그라운드 메시지 수신 리스너
                        onMessage(messaging, (payload) => {
                            console.log('Foreground Message received:', payload);
                            // 간단한 알림 표시 (선택 사항)
                            // alert(`알림: ${payload.notification?.title}\n${payload.notification?.body}`);
                        });
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, []);

    return { fcmToken: token, notificationPermission };
}
