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
    initialSlot?: TimeSlot;
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

export function AlarmPicker({ isOpen, onClose, alarmSettings, onSave, initialSlot = 'dawn' }: AlarmPickerProps) {
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot>(initialSlot);
    const [amPm, setAmPm] = useState<'오전' | '오후'>('오전');
    const [hour, setHour] = useState(7);
    const [minute, setMinute] = useState(0);
    const [localSettings, setLocalSettings] = useState(alarmSettings);

    // 모달 열릴 때 현재 설정 로드
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(alarmSettings);
            setSelectedSlot(initialSlot);
            parseTimeToStateOfSlot(alarmSettings[initialSlot].time);
        }
    }, [isOpen, alarmSettings, initialSlot]);

    // 특정 시간 문자열을 상태로 변환
    const parseTimeToStateOfSlot = (timeStr: string) => {
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

    // 상태를 시간 문자열로 변환 (오전/오후 독립 - 자동 변환 없음)
    const stateToTimeString = (currentAmPm: '오전' | '오후', currentHour: number, currentMinute: number): string => {
        let h = currentHour;

        // 오후 12시 -> 12시, 오후 1시~11시 -> 13시~23시
        if (currentAmPm === '오후') {
            if (currentHour !== 12) {
                h = currentHour + 12;
            }
        }
        // 오전 12시 -> 0시, 오전 1시~11시 -> 1시~11시
        else {
            if (currentHour === 12) {
                h = 0;
            }
        }

        return `${String(h).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    };

    // 슬롯 변경 시 해당 시간으로 업데이트
    const handleSlotChange = (slot: TimeSlot) => {
        // 현재 선택된 슬롯의 변경사항을 localSettings에 임시 저장
        const currentTime = stateToTimeString(amPm, hour, minute);
        const updatedSettings = {
            ...localSettings,
            [selectedSlot]: { ...localSettings[selectedSlot], time: currentTime }
        };
        setLocalSettings(updatedSettings);

        // 새 슬롯으로 전환 및 해당 슬롯의 시간 로드
        setSelectedSlot(slot);
        parseTimeToStateOfSlot(updatedSettings[slot].time);
    };

    // 알람 On/Off 토글
    const handleToggle = (slot: TimeSlot, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalSettings(prev => ({
            ...prev,
            [slot]: { ...prev[slot], isOn: !prev[slot].isOn }
        }));
    };

    // 저장
    const handleSave = () => {
        const currentTime = stateToTimeString(amPm, hour, minute);
        const finalSettings = {
            ...localSettings,
            [selectedSlot]: { ...localSettings[selectedSlot], time: currentTime }
        };
        onSave(finalSettings);
        onClose();
    };

    if (!isOpen) return null;

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
        <div className="alarm-picker-overlay" onClick={onClose}>
            <div className="alarm-picker-modal" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="alarm-picker-header">
                    <h3>알림 설정</h3>
                    <button className="alarm-picker-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* 그룹 선택 목록 */}
                <div className="alarm-picker-slots">
                    {TIME_SLOTS.map((slot) => (
                        <div
                            key={slot.id}
                            className={`alarm-slot-row ${selectedSlot === slot.id ? 'active' : ''}`}
                            onClick={() => handleSlotChange(slot.id)}
                        >
                            <span className="slot-name">{SLOT_LABELS[slot.id]}</span>
                            <span className="slot-time-display">
                                {localSettings[slot.id].isOn ? localSettings[slot.id].time : '--:--'}
                            </span>
                            <button
                                className={`slot-switch ${localSettings[slot.id].isOn ? 'on' : ''}`}
                                onClick={(e) => handleToggle(slot.id, e)}
                            >
                                {localSettings[slot.id].isOn ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* 독립 제어 피커 영역 */}
                <div className="alarm-picker-time">
                    <div className="picker-title">
                        <span>[ {SLOT_LABELS[selectedSlot]} ]</span> 시간 설정
                    </div>
                    <div className="picker-wheels">
                        <div className="picker-wheel">
                            <span className="wheel-label">오전/오후</span>
                            <select
                                value={amPm}
                                onChange={(e) => setAmPm(e.target.value as '오전' | '오후')}
                                className="wheel-select"
                            >
                                <option value="오전">오전</option>
                                <option value="오후">오후</option>
                            </select>
                        </div>

                        <div className="picker-wheel">
                            <span className="wheel-label">시</span>
                            <select
                                value={hour}
                                onChange={(e) => setHour(Number(e.target.value))}
                                className="wheel-select"
                            >
                                {hours.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>

                        <div className="picker-wheel">
                            <span className="wheel-label">분</span>
                            <select
                                value={minute}
                                onChange={(e) => setMinute(Number(e.target.value))}
                                className="wheel-select"
                            >
                                {minutes.map(m => (
                                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 완료 버튼 */}
                <div className="alarm-picker-footer">
                    <button className="alarm-done-btn" onClick={handleSave}>
                        설정 완료
                    </button>
                </div>
            </div>
        </div>
    );
}
