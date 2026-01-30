import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 앱이 이미 초기화되었는지 확인 (중복 초기화 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 메시징 객체는 브라우저 환경에서만 초기화 (Next.js SSR 이슈 방지)
// isSupported()를 통해 지원되는 브라우저인지 확인 필요
const messaging = async () => {
    try {
        const isSupportedBrowser = await isSupported();
        if (isSupportedBrowser) {
            return getMessaging(app);
        }
        console.log('Firebase Messaging is not supported in this browser.');
        return null;
    } catch (err) {
        console.error('Error checking messaging support:', err);
        return null;
    }
};

export { app, messaging };
