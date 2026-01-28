'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInitializer() {
    const [initialized, setInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(true); // Default to true to hide button initially

    useEffect(() => {
        const initOneSignal = async () => {
            if (initialized) return;

            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

            if (!appId) {
                console.error('OneSignal App ID is not set');
                return;
            }

            try {
                await OneSignal.init({
                    appId: appId,
                    allowLocalhostAsSecureOrigin: true,
                });

                setInitialized(true);
                console.log('OneSignal initialized successfully');

                // Check subscription status
                const permission = await OneSignal.Notifications.permission;
                const subscribed = permission === true;
                setIsSubscribed(subscribed);

                // Listen for subscription changes
                OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
                    setIsSubscribed(permission);
                });
            } catch (error) {
                console.error('Error initializing OneSignal:', error);
            }
        };

        initOneSignal();
    }, [initialized]);

    const handleSubscribeClick = async () => {
        try {
            // Prompt the user to subscribe using the slidedown
            await OneSignal.Slidedown.promptPush();
        } catch (error) {
            console.error('Error prompting push subscription:', error);
        }
    };

    // Don't show the button if already subscribed
    if (isSubscribed) {
        return null;
    }

    return (
        <button
            onClick={handleSubscribeClick}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-bounce"
            aria-label="Subscribe to notifications"
            title="알림 구독하기"
        >
            {/* Bell Icon SVG */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>
        </button>
    );
}
