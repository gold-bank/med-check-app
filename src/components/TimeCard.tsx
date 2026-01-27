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
}

export function TimeCard({
    label,
    iconName,
    notes,
    allChecked,
    onGroupToggle,
    children,
}: TimeCardProps) {
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
