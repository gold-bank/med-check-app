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

    // 휠 변경 시 즉시 상태 및 localSettings 업데이트
    const updateTimeSettings = (newAmPm: '오전' | '오후', newHour: number, newMinute: number) => {
        setAmPm(newAmPm);
        setHour(newHour);
        setMinute(newMinute);

        const currentTime = stateToTimeString(newAmPm, newHour, newMinute);
        setLocalSettings(prev => ({
            ...prev,
            [selectedSlot]: { ...prev[selectedSlot], time: currentTime }
        }));
    };

    // 슬롯 변경 시 해당 슬롯의 시간 로드 (별도 저장 없음 - 이미 실시간 저장됨)
    const handleSlotChange = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        parseTimeToStateOfSlot(localSettings[slot].time);
    };

    // 알람 On/Off 토글
    const handleToggle = (slot: TimeSlot, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalSettings(prev => ({
            ...prev,
            [slot]: { ...prev[slot], isOn: !prev[slot].isOn }
        }));
    };

    const [isSaving, setIsSaving] = useState(false);

    // 저장
    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaving) return;
        setIsSaving(true);

        // 이미 localSettings가 최신 상태이므로 그대로 저장
        onSave(localSettings);
        // onClose는 부모에서 처리되는 시간에 따라 달라질 수 있으므로 약간의 지연 후 실행하거나 즉시 실행
        // 여기서는 상위 로직이 비동기일 수 있으므로 close만 호출
        onClose();

        // 짧은 타임아웃으로 더블 클릭 방지 해제 (모달이 닫히면 어차피 언마운트됨)
        setTimeout(() => setIsSaving(false), 500);
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
                            <span className={`slot-time-display ${!localSettings[slot.id].isOn ? 'dimmed' : ''}`}>
                                {localSettings[slot.id].time}
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
                                onChange={(e) => updateTimeSettings(e.target.value as '오전' | '오후', hour, minute)}
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
                                onChange={(e) => updateTimeSettings(amPm, Number(e.target.value), minute)}
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
                                onChange={(e) => updateTimeSettings(amPm, hour, Number(e.target.value))}
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
                    <button
                        className="alarm-done-btn"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.7 : 1 }}
                    >
                        {isSaving ? '저장 중...' : '설정 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
}
