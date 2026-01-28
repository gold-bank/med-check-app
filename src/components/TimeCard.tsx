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
    const handleClockClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 그룹 토글 방지
        if (onAlarmToggle) {
            onAlarmToggle();
        }
    };

    return (
        <div className="time-card">
            <div
                className="card-visual"
                onClick={onGroupToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onGroupToggle();
                    }
                }}
            >
                <div className={`picto-box ${allChecked ? 'checked' : ''}`}>
                    <Icon name={iconName as IconName} />
                </div>
                <div className="visual-time">{label}</div>
                {alarmTime && (
                    <div
                        className={`visual-clock ${isAlarmOn ? 'active' : 'off'}`}
                        onClick={handleClockClick}
                        title={isAlarmOn ? '알림 켜짐 - 클릭하여 끄기' : '알림 꺼짐 - 클릭하여 켜기'}
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
