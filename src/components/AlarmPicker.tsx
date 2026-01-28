'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TimeSlot } from '@/lib/medicines';
import { TIME_SLOTS } from '@/lib/medicines';

interface AlarmPickerProps {
    isOpen: boolean;
    onClose: () => void;
    alarmSettings: Record<TimeSlot, { time: string; isOn: boolean }>;
    onSave: (settings: Record<TimeSlot, { time: string; isOn: boolean }>) => void;
}

// 시간대 라벨 맵
const SLOT_LABELS: Record<TimeSlot, string> = {
    dawn: '기상 직후',
    morning: '아침 식사',
    noon: '점심 식사',
    snack: '오후 간식',
    evening: '저녁 식사',
    night: '식후 30분',
};

export function AlarmPicker({ isOpen, onClose, alarmSettings, onSave }: AlarmPickerProps) {
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('dawn');
    const [amPm, setAmPm] = useState<'오전' | '오후'>('오전');
    const [hour, setHour] = useState(7);
    const [minute, setMinute] = useState(0);
    const [localSettings, setLocalSettings] = useState(alarmSettings);

    // 모달 열릴 때 현재 설정 로드
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(alarmSettings);
            // 첫 번째 슬롯의 시간으로 초기화
            parseTimeToState(alarmSettings.dawn.time);
        }
    }, [isOpen, alarmSettings]);

    // 시간 문자열을 상태로 변환
    const parseTimeToState = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        if (h >= 12) {
            setAmPm('오후');
            setHour(h === 12 ? 12 : h - 12);
        } else {
            setAmPm('오전');
            setHour(h === 0 ? 12 : h);
        }
        setMinute(m);
    };

    // 상태를 시간 문자열로 변환
    const stateToTimeString = (): string => {
        let h = hour;
        if (amPm === '오후' && hour !== 12) {
            h = hour + 12;
        } else if (amPm === '오전' && hour === 12) {
            h = 0;
        }
        return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    // 슬롯 변경 시 해당 시간으로 업데이트
    const handleSlotChange = (slot: TimeSlot) => {
        // 현재 슬롯 시간 저장
        const currentTime = stateToTimeString();
        setLocalSettings(prev => ({
            ...prev,
            [selectedSlot]: { ...prev[selectedSlot], time: currentTime }
        }));

        // 새 슬롯으로 전환
        setSelectedSlot(slot);
        parseTimeToState(localSettings[slot].time);
    };

    // 알람 On/Off 토글
    const handleToggle = (slot: TimeSlot) => {
        setLocalSettings(prev => ({
            ...prev,
            [slot]: { ...prev[slot], isOn: !prev[slot].isOn }
        }));
    };

    // 저장
    const handleSave = () => {
        // 현재 편집 중인 슬롯 시간도 저장
        const currentTime = stateToTimeString();
        const finalSettings = {
            ...localSettings,
            [selectedSlot]: { ...localSettings[selectedSlot], time: currentTime }
        };
        onSave(finalSettings);
        onClose();
    };

    if (!isOpen) return null;

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    return (
        <div className="alarm-picker-overlay" onClick={onClose}>
            <div className="alarm-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="alarm-picker-header">
                    <h3>알림 시간 설정</h3>
                    <button className="alarm-picker-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* 그룹 선택 */}
                <div className="alarm-picker-slots">
                    {TIME_SLOTS.map((slot) => (
                        <button
                            key={slot.id}
                            className={`alarm-slot-btn ${selectedSlot === slot.id ? 'active' : ''} ${localSettings[slot.id].isOn ? 'on' : 'off'}`}
                            onClick={() => handleSlotChange(slot.id)}
                        >
                            <span className="slot-label">{SLOT_LABELS[slot.id]}</span>
                            <span className="slot-time">{localSettings[slot.id].time}</span>
                            <button
                                className={`slot-toggle ${localSettings[slot.id].isOn ? 'on' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleToggle(slot.id); }}
                            >
                                {localSettings[slot.id].isOn ? 'ON' : 'OFF'}
                            </button>
                        </button>
                    ))}
                </div>

                {/* 시간 피커 */}
                <div className="alarm-picker-time">
                    <div className="picker-label">시간 선택: {SLOT_LABELS[selectedSlot]}</div>
                    <div className="picker-wheels">
                        {/* 오전/오후 */}
                        <div className="picker-column">
                            <div className="picker-column-label">오전/오후</div>
                            <select
                                value={amPm}
                                onChange={(e) => setAmPm(e.target.value as '오전' | '오후')}
                                className="picker-select"
                            >
                                <option value="오전">오전</option>
                                <option value="오후">오후</option>
                            </select>
                        </div>

                        {/* 시 */}
                        <div className="picker-column">
                            <div className="picker-column-label">시</div>
                            <select
                                value={hour}
                                onChange={(e) => setHour(Number(e.target.value))}
                                className="picker-select"
                            >
                                {hours.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>

                        {/* 분 */}
                        <div className="picker-column">
                            <div className="picker-column-label">분</div>
                            <select
                                value={minute}
                                onChange={(e) => setMinute(Number(e.target.value))}
                                className="picker-select"
                            >
                                {minutes.map(m => (
                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="alarm-picker-actions">
                    <button className="alarm-save-btn" onClick={handleSave}>
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
