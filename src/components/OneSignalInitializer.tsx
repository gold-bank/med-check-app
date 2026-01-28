"use client";
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInitializer() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                // Init with strict security off for dev testing
                OneSignal.init({
                    appId: "3f3049b0-07a6-43ba-a2ca-959840f3c546",
                    allowLocalhostAsSecureOrigin: true,
                });
            } catch (error) {
                console.error("OneSignal init error:", error);
            }
        }
    }, []);
    return null;
}
