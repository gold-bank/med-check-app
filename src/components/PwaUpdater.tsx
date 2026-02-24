'use client';

import { useEffect } from 'react';

export function PwaUpdater() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const handleControllerChange = () => {
                if (window.confirm('새 버전이 준비되었습니다. 업데이트하시겠습니까?')) {
                    window.location.reload();
                }
            };

            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

            return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            };
        }
    }, []);

    return null;
}
