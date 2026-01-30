'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { TimeCard } from '@/components/TimeCard';
import { MedicineItem } from '@/components/MedicineItem';
import { AlertSection } from '@/components/AlertSection';
import { Confetti } from '@/components/Confetti';
import { AlarmPicker } from '@/components/AlarmPicker';
import { safeGetItem, safeSetItem, safeClear } from '@/lib/storage';
import { BASE_MEDICINES, TIME_SLOTS, type TimeSlot, type Medicine } from '@/lib/medicines';
import useFcmToken from '@/hooks/useFcmToken';


// 알림 시간 기본값
const DEFAULT_ALARM_TIMES: Record<TimeSlot, string> = {
  dawn: '07:00',
  morning: '08:00',
  noon: '12:00',
  snack: '15:00',
  evening: '18:00',
  night: '22:00',
};

// D3 사이클 계산
function calculateD3Status(cycleStart: string, cyclePeriod: number): { isActive: boolean; badge: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(cycleStart);
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const remainder = diffDays % cyclePeriod;
  const daysLeft = (cyclePeriod - remainder) % cyclePeriod;

  if (remainder === 0) {
    return { isActive: true, badge: 'TODAY' };
  }
  return { isActive: false, badge: `D-${daysLeft}` };
}

// MTX 사이클 계산
function calculateMTXStatus(targetDay: number): { isActive: boolean; badge: string } {
  const today = new Date();
  const currentDay = today.getDay();

  if (currentDay === targetDay) {
    return { isActive: true, badge: 'TODAY' };
  }

  const diff = (targetDay + 7 - currentDay) % 7;
  return { isActive: false, badge: `D-${diff}` };
}

// 알람 계산 (오늘 또는 내일의 해당 시간)
const getNextAlarmDate = (timeStr: string): string => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);

  // 이미 시간이 지났으면 내일로 설정
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled.toISOString();
};

export default function MedicineSchedule() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllCheckedRef = useRef(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<TimeSlot>('dawn');
  const { fcmToken } = useFcmToken();

  // 알람 상태 관리
  const [alarmSettings, setAlarmSettings] = useState<Record<TimeSlot, { time: string; isOn: boolean; notificationId?: string }>>({
    dawn: { time: DEFAULT_ALARM_TIMES.dawn, isOn: false },
    morning: { time: DEFAULT_ALARM_TIMES.morning, isOn: false },
    noon: { time: DEFAULT_ALARM_TIMES.noon, isOn: false },
    snack: { time: DEFAULT_ALARM_TIMES.snack, isOn: false },
    evening: { time: DEFAULT_ALARM_TIMES.evening, isOn: false },
    night: { time: DEFAULT_ALARM_TIMES.night, isOn: false },
  });

  // 화요일 규칙 적용
  const isTuesday = new Date().getDay() === 2;

  // 약 목록을 시간대별로 그룹화 (화요일 규칙 적용)
  const medicinesBySlot = useMemo(() => {
    const result: Record<TimeSlot, Medicine[]> = {
      dawn: [],
      morning: [],
      noon: [],
      snack: [],
      evening: [],
      night: [],
    };

    BASE_MEDICINES.forEach((med) => {
      // 화요일이면 엽산을 저녁으로 이동
      if (med.tuesdayEvening && isTuesday) {
        result.evening.push({ ...med, slot: 'evening' });
      } else {
        result[med.slot].push(med);
      }
    });

    // 각 시간대 내 정렬 (D3, MTX는 마지막에)
    Object.keys(result).forEach((slot) => {
      result[slot as TimeSlot].sort((a, b) => {
        if (a.cycleType && !b.cycleType) return 1;
        if (!a.cycleType && b.cycleType) return -1;
        return 0;
      });
    });

    return result;
  }, [isTuesday]);

  // localStorage에서 상태 로드
  useEffect(() => {
    const loadedState: Record<string, boolean> = {};
    BASE_MEDICINES.forEach((med) => {
      const value = safeGetItem(med.id);
      if (value !== null) {
        loadedState[med.id] = value === '1';
      }
    });
    setCheckedItems(loadedState);

    // 알람 설정 로드
    const savedAlarms = safeGetItem('alarmSettings');
    if (savedAlarms) {
      try {
        const parsed = JSON.parse(savedAlarms);
        setAlarmSettings(parsed);
      } catch (e) {
        console.error('알람 설정 로드 실패:', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // 알람 설정 버튼 클릭 (기본값으로 열기)
  const handleAlarmSettingClick = useCallback(() => {
    setInitialSlot('dawn');
    setIsPickerOpen(true);
  }, []);

  // 카드 내 시계 클릭 시 알람 간편 토글 (API 연동)
  const handleClockToggle = useCallback(async (slot: TimeSlot) => {
    const currentSetting = alarmSettings[slot];
    const newIsOn = !currentSetting.isOn;

    // 낙관적 업데이트 (UI 먼저 반영)
    setAlarmSettings((prev) => {
      const newSettings = {
        ...prev,
        [slot]: { ...prev[slot], isOn: newIsOn },
      };
      safeSetItem('alarmSettings', JSON.stringify(newSettings));
      return newSettings;
    });

    try {
      if (!fcmToken && newIsOn) {
        console.warn('알림 권한이 없거나 토큰 발급 실패');
        // 필요한 경우 권한 요청 로직 추가 또는 사용자 알림
      }

      const scheduleTime = getNextAlarmDate(currentSetting.time);

      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newIsOn ? 'schedule' : 'cancel',
          token: fcmToken,
          time: scheduleTime,
          slotId: slot,
          heading: `${currentSetting.time} 약 복용 알림`,
          content: '약 드실 시간입니다! 잊지 말고 챙겨주세요.',
          notificationId: currentSetting.notificationId, // 취소 시 필요
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 성공 시 notificationId 업데이트 (ON일 때 생성된 ID 저장, OFF일 때 제거)
        setAlarmSettings((prev) => {
          const updated = {
            ...prev,
            [slot]: {
              ...prev[slot],
              isOn: newIsOn, // 서버 응답에 따라 확실하게 설정
              notificationId: newIsOn ? result.notificationId : undefined
            },
          };
          safeSetItem('alarmSettings', JSON.stringify(updated));
          return updated;
        });
        console.log(`알람 ${newIsOn ? '예약' : '취소'} 성공:`, result);
      } else {
        console.error('알람 API 처리 실패:', result);
      }
    } catch (error) {
      console.error('알람 토글 중 오류 발생:', error);
    }
  }, [alarmSettings]);

  // 알람 설정 저장
  const handleAlarmSave = useCallback((newSettings: Record<TimeSlot, { time: string; isOn: boolean }>) => {
    setAlarmSettings(newSettings);
    safeSetItem('alarmSettings', JSON.stringify(newSettings));

    console.log('알람 설정 저장됨:', newSettings);
  }, []);

  // 체크 상태 변경 핸들러
  const handleMedicineChange = useCallback((id: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const newState = { ...prev, [id]: checked };
      safeSetItem(id, checked ? '1' : '0');
      return newState;
    });
  }, []);

  // 그룹 토글 핸들러
  const handleGroupToggle = useCallback((slot: TimeSlot) => {
    const medsInSlot = medicinesBySlot[slot];
    const enabledMeds = medsInSlot.filter((med) => {
      if (med.cycleType === 'D3' && med.cycleStart && med.cyclePeriod) {
        return calculateD3Status(med.cycleStart, med.cyclePeriod).isActive;
      }
      if (med.cycleType === 'MTX' && med.targetDay !== undefined) {
        return calculateMTXStatus(med.targetDay).isActive;
      }
      return true;
    });

    const allChecked = enabledMeds.every((med) => checkedItems[med.id]);
    const newCheckedValue = !allChecked;

    setCheckedItems((prev) => {
      const newState = { ...prev };
      enabledMeds.forEach((med) => {
        newState[med.id] = newCheckedValue;
        safeSetItem(med.id, newCheckedValue ? '1' : '0');
      });
      return newState;
    });
  }, [medicinesBySlot, checkedItems]);

  // 그룹 체크 상태 계산
  const isGroupChecked = useCallback((slot: TimeSlot): boolean => {
    const medsInSlot = medicinesBySlot[slot];
    const enabledMeds = medsInSlot.filter((med) => {
      if (med.cycleType === 'D3' && med.cycleStart && med.cyclePeriod) {
        return calculateD3Status(med.cycleStart, med.cyclePeriod).isActive;
      }
      if (med.cycleType === 'MTX' && med.targetDay !== undefined) {
        return calculateMTXStatus(med.targetDay).isActive;
      }
      return true;
    });

    if (enabledMeds.length === 0) return false;
    return enabledMeds.every((med) => checkedItems[med.id]);
  }, [medicinesBySlot, checkedItems]);

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    safeClear();
    setCheckedItems({});
    setShowConfetti(false);
    prevAllCheckedRef.current = false;
  }, []);

  // 모든 항목 체크 여부 확인 (Confetti 트리거)
  useEffect(() => {
    if (!isLoaded) return;

    const enabledMeds = BASE_MEDICINES.filter((med) => {
      if (med.cycleType === 'D3' && med.cycleStart && med.cyclePeriod) {
        return calculateD3Status(med.cycleStart, med.cyclePeriod).isActive;
      }
      if (med.cycleType === 'MTX' && med.targetDay !== undefined) {
        return calculateMTXStatus(med.targetDay).isActive;
      }
      return true;
    });

    const allChecked = enabledMeds.length > 0 && enabledMeds.every((med) => checkedItems[med.id]);

    if (allChecked && !prevAllCheckedRef.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }

    prevAllCheckedRef.current = allChecked;
  }, [checkedItems, isLoaded]);

  // 약 아이템 렌더링
  const renderMedicine = (med: Medicine) => {
    let isDisabled = false;
    let isActiveToday = false;
    let isDanger = false;
    let badge: string | undefined;

    if (med.cycleType === 'D3' && med.cycleStart && med.cyclePeriod) {
      const status = calculateD3Status(med.cycleStart, med.cyclePeriod);
      isDisabled = !status.isActive;
      isActiveToday = status.isActive;
      badge = status.badge;
    }

    if (med.cycleType === 'MTX' && med.targetDay !== undefined) {
      const status = calculateMTXStatus(med.targetDay);
      isDisabled = !status.isActive;
      isDanger = status.isActive;
      badge = status.badge;
    }

    // 화요일 엽산 특별 표시
    const showFolicWarning = med.tuesdayEvening && isTuesday;
    const forceWrap = showFolicWarning;

    return (
      <MedicineItem
        key={med.id}
        id={med.id}
        name={med.name}
        dose={med.dose}
        checked={checkedItems[med.id] || false}
        disabled={isDisabled}
        isActiveToday={isActiveToday}
        isDanger={isDanger}
        badge={badge}
        dayBadge={med.cycleType === 'MTX' ? '월요일' : undefined}
        showFolicWarning={showFolicWarning}
        forceWrap={forceWrap}
        onChange={handleMedicineChange}
      />
    );
  };

  if (!isLoaded) {
    return (
      <div className="main-container">
        <div style={{ padding: 20, textAlign: 'center' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <Confetti trigger={showConfetti} />
      <div className="main-container">
        <Header onReset={handleReset} onAlarmSettingClick={handleAlarmSettingClick} />

        <div className="schedule-flow">
          {TIME_SLOTS.map((slot) => (
            <TimeCard
              key={slot.id}
              slotId={slot.id}
              label={slot.label}
              iconName={slot.icon}
              notes={slot.notes}
              allChecked={isGroupChecked(slot.id)}
              onGroupToggle={() => handleGroupToggle(slot.id)}
              alarmTime={alarmSettings[slot.id].time}
              isAlarmOn={alarmSettings[slot.id].isOn}
              onAlarmToggle={() => handleClockToggle(slot.id)}
            >
              {medicinesBySlot[slot.id].map(renderMedicine)}
            </TimeCard>
          ))}
        </div>

        <AlertSection />
      </div>

      {/* 알람 피커 모달 */}
      <AlarmPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        alarmSettings={alarmSettings}
        onSave={handleAlarmSave}
        initialSlot={initialSlot}
      />
    </>
  );
}
