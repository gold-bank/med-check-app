'use client';

import type { ReactNode } from 'react';
import { Icon } from './Icons';
import type { TimeSlot } from '@/lib/medicines';

type IconName = 'dawn' | 'morning' | 'sun' | 'cookie' | 'moon' | 'wait';

interface TimeCardProps {
    slotId: TimeSlot;
    label: string;
    iconName: string;
    notes: string[];
    allChecked: boolean;
    onGroupToggle: () => void;
    children: ReactNode;
    alarmTime?: string;
    isAlarmOn?: boolean;
    onAlarmToggle?: () => void;
}

export function TimeCard({
    label,
    iconName,
    notes,
    allChecked,
    onGroupToggle,
    children,
    alarmTime,
    isAlarmOn = false,
    onAlarmToggle,
}: TimeCardProps) {
    // 아이콘(picto-box)만 클릭 시 그룹 토글
    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onGroupToggle();
    };

    // 시계 클릭 시 알람 토글 (부모 이벤트 차단)
    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); // 중복 터치/이벤트 방지
        if (onAlarmToggle) {
            onAlarmToggle();
        }
    };

    return (
        <div className="time-card">
            <div className="card-visual">
                {/* 아이콘(picto-box)만 클릭 시 그룹 토글 */}
                <div
                    className={`picto-box ${allChecked ? 'checked' : ''}`}
                    onClick={handleIconClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onGroupToggle();
                        }
                    }}
                >
                    <Icon name={iconName as IconName} />
                </div>
                {/* 라벨은 클릭 불가 */}
                <div className="visual-time">{label}</div>
                {/* 시계 - 단순 On/Off 토글 (부모 전파 방지) */}
                {alarmTime && (
                    <div
                        className={`visual-clock ${isAlarmOn ? 'active' : 'off'}`}
                        onClick={handleClockClick}
                        role="button"
                        tabIndex={0}
                        title={isAlarmOn ? '알람 끄기' : '알람 켜기'}
                    >
                        {alarmTime}
                    </div>
                )}
            </div>
            <div className="card-content">
                <div className="content-meds">
                    {children}
                </div>
                {notes.length > 0 && (
                    <div className="content-checks">
                        {notes.map((note, index) => {
                            const isHighlight = note.includes('X') || note.includes('1번만');
                            return (
                                <div key={index} className="check-item">
                                    <span className="check-bullet">▸</span>
                                    {isHighlight ? (
                                        <span>
                                            <span className="highlight">{note.split(' (')[0]}</span>
                                            {note.includes(' (') && ` (${note.split(' (')[1]}`}
                                        </span>
                                    ) : (
                                        <span>{note}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
