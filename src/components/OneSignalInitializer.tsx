'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalInitializer() {
    useEffect(() => {
        // 서버 사이드 렌더링 시 실행 방지
        if (typeof window === 'undefined') return;

        const runOneSignal = async () => {
            try {
                // 중복 실행 방지
                // @ts-ignore
                if (window.OneSignal && window.OneSignal.initialized) return;

                await OneSignal.init({
                    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
                    // 로컬 테스트 및 다양한 환경 지원 (http localhost 허용)
                    allowLocalhostAsSecureOrigin: true,
                    // 알림 권한 요청 슬라이드다운 UI 자동 표시 설정
                    promptOptions: {
                        slidedown: {
                            prompts: [
                                {
                                    type: "push" as const,
                                    autoPrompt: true,
                                    text: {
                                        actionMessage: "약 복용 시간을 놓치지 않도록 알림을 받아보세요!",
                                        acceptButton: "알림 켜기",
                                        cancelButton: "나중에",
                                    },
                                },
                            ],
                        },
                    } as any,
                });

                // PWA 및 모바일 환경 호환성을 위해 명시적 호출
                OneSignal.Slidedown.promptPush();

                console.log('OneSignal Initialized Successfully (v16)');
            } catch (error) {
                console.error('OneSignal Init Error:', error);
            }
        };

        runOneSignal();
    }, []);

    return null; // 화면에 아무것도 그리지 않음
}
