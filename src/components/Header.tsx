'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';

interface HeaderProps {
    onReset: () => void;
    onAlarmSettingClick?: () => void;
}

export function Header({ onReset, onAlarmSettingClick }: HeaderProps) {
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
                <div className="reset-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    {/* 왼쪽: 종 아이콘 (피크토박스 스타일) */}
                    {onAlarmSettingClick && (
                        <div
                            className="picto-box"
                            onClick={onAlarmSettingClick}
                            title="알림 설정"
                            style={{
                                width: '34px',
                                height: '34px',
                                marginBottom: 0,
                                cursor: 'pointer',
                                background: '#f8f9fa',
                            }}
                        >
                            <Bell size={18} color="#555" />
                        </div>
                    )}
                    {!onAlarmSettingClick && <div />}

                    {/* 오른쪽: 초기화 버튼 */}
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
