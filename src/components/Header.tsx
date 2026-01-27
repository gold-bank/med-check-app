'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HeaderProps {
    onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    const handleForceUpdate = () => {
        setIsUpdating(true);

        setTimeout(() => {
            const baseUrl = window.location.href.split('?')[0];
            window.location.replace(`${baseUrl}?v=${Date.now()}`);
        }, 300);
    };

    const handleReset = () => {
        onReset();
    };

    return (
        <div className="art-header">
            <div className="header-top-bar">
                <div className="top-left-group">
                    <div
                        className="update-btn-wrapper"
                        onClick={handleForceUpdate}
                        title="즉시 업데이트"
                    >
                        <Image
                            src="/update-icon.png"
                            alt="update"
                            width={20}
                            height={20}
                            className={`header-icon ${isUpdating ? 'icon-spin' : ''}`}
                        />
                    </div>
                    <span
                        id="update-msg"
                        className={`update-status-text ${isUpdating ? 'visible' : ''}`}
                    >
                        업데이트 중...
                    </span>
                </div>
                <div className="header-date">Updated: {dateString}</div>
            </div>
            <div className="header-title-area">
                <h1>약복용 스케줄</h1>
                <p>오늘도 건강한 하루 보내세요!</p>
                <div className="reset-wrapper">
                    <button
                        type="button"
                        className="reset-btn"
                        onClick={handleReset}
                    >
                        ↻ 초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
