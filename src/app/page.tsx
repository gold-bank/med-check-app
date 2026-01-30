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

// (서버에서 시간 계산을 수행하므로 getNextAlarmDate 함수는 더 이상 프론트엔드에서 사용하지 않음)

export default function MedicineSchedule() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllCheckedRef = useRef(false);
  const isSavingRef = useRef(false); // 전역 저장 락 (중복 호출 방지)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<TimeSlot>('dawn');
  const { fcmToken, requestToken } = useFcmToken();
  const [processingSlots, setProcessingSlots] = useState<Set<string>>(new Set());

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

        // 데이터 검증: 필수 키(time, isOn)가 있는지 확인
        const isValid = Object.values(parsed).every((item: any) =>
          typeof item === 'object' && 'time' in item && 'isOn' in item
        );

        if (isValid) {
          setAlarmSettings(parsed);
        } else {
          console.warn('저장된 알람 설정 형식이 올바르지 않아 초기화합니다.');
          safeClear(); // 혹시 모를 꼬임 방지
        }
      } catch (e) {
        console.error('알람 설정 로드 실패 (초기화):', e);
        // 파싱 에러 시 무시하고 기본값 사용
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
    // 이미 처리 중이면 중복 실행 방지
    if (processingSlots.has(slot)) {
      console.warn(`[Frontend] Slot ${slot} is already processing. Ignoring click.`);
      return;
    }

    const currentSetting = alarmSettings[slot];
    const newIsOn = !currentSetting.isOn;

    // 알람을 끄려고 하는데 ID가 없다? -> 서버 예약 자체가 안 된 상태이므로 UI만 끄고 종료
    if (!newIsOn && !currentSetting.notificationId) {
      console.log('[Frontend] 취소할 알림 ID가 없어 API 호출 없이 UI만 끔.');
      setAlarmSettings((prev) => {
        const updated = {
          ...prev,
          [slot]: { ...prev[slot], isOn: false, notificationId: undefined },
        };
        safeSetItem('alarmSettings', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // 처리 상태 시작
    setProcessingSlots((prev) => new Set(prev).add(slot));

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
      // FCM 토큰 검증 및 재시도
      let tokenToSend = fcmToken;
      if (!tokenToSend && newIsOn) {
        console.log('Token missing, attempting to retrieve...');
        tokenToSend = await requestToken();

        if (!tokenToSend) {
          alert('알림 권한을 먼저 허용해주세요.');
          setAlarmSettings((prev) => {
            const reverted = {
              ...prev,
              [slot]: { ...prev[slot], isOn: !newIsOn }
            };
            safeSetItem('alarmSettings', JSON.stringify(reverted));
            return reverted;
          });
          return;
        }
      }

      // (방어적 코드) 취소 시 notificationId가 없어도 API 호출을 진행하여 서버에서 처리하도록 함

      // 서버에서 기준 시간(KST)으로 정확히 계산하도록 원본 시간 문자열("HH:mm") 전송
      const payload = {
        action: newIsOn ? 'schedule' : 'cancel',
        token: tokenToSend,
        time: currentSetting.time, // "HH:mm" 예: "07:00"
        slotId: slot,
        heading: `${currentSetting.time} 약 복용 알림`,
        content: '약 드실 시간입니다! 잊지 말고 챙겨주세요.',
        notificationId: currentSetting.notificationId || '', // 없는 경우 빈 문자열 전송
      };

      console.log("[Frontend] Sending payload (Raw Time):", payload);

      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        console.log(`[Frontend] 알림 ${newIsOn ? '예약' : '취소'} 성공. Noti ID:`, result.notificationId);
      } else {
        console.error('[Frontend Error] 알람 API 처리 실패. 응답:', result);

        // API 실패 시 UI 원복
        setAlarmSettings((prev) => {
          const reverted = {
            ...prev,
            [slot]: { ...prev[slot], isOn: !newIsOn }
          };
          safeSetItem('alarmSettings', JSON.stringify(reverted));
          return reverted;
        });
        alert('알림 설정에 실패했습니다. (API Error)');
      }
    } catch (error) {
      console.error('[Frontend Critical Error] 알람 토글 중 fetch 오류 발생:', error);
      // 에러 발생 시 UI 원복
      setAlarmSettings((prev) => {
        const reverted = {
          ...prev,
          [slot]: { ...prev[slot], isOn: !newIsOn }
        };
        safeSetItem('alarmSettings', JSON.stringify(reverted));
        return reverted;
      });
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      // 처리 상태 해제
      setProcessingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    }
  }, [alarmSettings, fcmToken, processingSlots]);

  // 알람 설정 저장 (모달에서 '저장' 클릭 시)
  const handleAlarmSave = useCallback(async (newSettings: Record<TimeSlot, { time: string; isOn: boolean }>) => {
    // 중복 실행 방지
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    // 1. 낙관적 업데이트 (UI 즉시 반영)
    // 기존 설정 보존(notificationId 등)하면서 새로운 시간/ON-OFF 상태 병합
    setAlarmSettings((prev) => {
      const merged: any = {};
      (Object.keys(newSettings) as TimeSlot[]).forEach((slot) => {
        merged[slot] = {
          ...prev[slot],
          time: newSettings[slot].time,
          isOn: newSettings[slot].isOn,
        };
      });
      safeSetItem('alarmSettings', JSON.stringify(merged));
      return merged;
    });

    // 2. 변경 사항 감지 및 API 호출 (비동기 처리)
    for (const slotKey in newSettings) {
      const slot = slotKey as TimeSlot;
      const newSetting = newSettings[slot];
      const oldSetting = alarmSettings[slot];

      // 변경사항이 없으면 패스
      if (newSetting.isOn === oldSetting.isOn && newSetting.time === oldSetting.time) {
        continue;
      }

      // 처리 중 상태 표시 (중복 방지)
      setProcessingSlots((prev) => new Set(prev).add(slot));

      try {
        // Case A: 켜짐 -> 꺼짐 (Cancel)
        if (oldSetting.isOn && !newSetting.isOn) {
          if (oldSetting.notificationId) {
            await fetch('/api/schedule-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'cancel',
                notificationId: oldSetting.notificationId,
              }),
            });
          }
          // ID 제거 업데이트
          setAlarmSettings(prev => ({
            ...prev,
            [slot]: { ...prev[slot], notificationId: undefined }
          }));
        }

        // Case B: 꺼짐 -> 켜짐 OR 시간 변경 (Schedule / Reschedule)
        // 시간 변경 시에는 기존 것 취소 후 재예약 필요 (단, ID가 있으면 취소 시도)
        if (newSetting.isOn) {
          // 토큰 확인 및 재시도
          let tokenToSend = fcmToken;
          if (!tokenToSend) {
            tokenToSend = await requestToken();
            if (!tokenToSend) {
              alert('알림 권한을 먼저 허용해주세요.');
              // UI 원복 (OFF로)
              setAlarmSettings(prev => {
                const reverted = { ...prev, [slot]: { ...prev[slot], isOn: false } };
                safeSetItem('alarmSettings', JSON.stringify(reverted));
                return reverted;
              });
              continue;
            }
          }

          // 재예약인 경우 기존 ID로 취소 먼저 시도 (API 내부적으로 처리하거나 여기서 명시적 호출)
          if (oldSetting.isOn && oldSetting.notificationId) {
            await fetch('/api/schedule-notification', {
              method: 'POST',
              body: JSON.stringify({ action: 'cancel', notificationId: oldSetting.notificationId }),
            });
          }

          // 새 예약
          const payload = {
            action: 'schedule',
            token: tokenToSend,
            time: newSetting.time,
            slotId: slot,
            heading: `${newSetting.time} 약 복용 알림`,
            content: '약 드실 시간입니다! 잊지 말고 챙겨주세요.',
          };

          const res = await fetch('/api/schedule-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await res.json();

          if (result.success) {
            setAlarmSettings(prev => {
              const updated = {
                ...prev,
                [slot]: { ...prev[slot], notificationId: result.notificationId }
              };
              safeSetItem('alarmSettings', JSON.stringify(updated));
              return updated;
            });
          } else {
            // 실패 시 OFF 처리
            console.error(`[Modal Save] Failed to schedule ${slot}:`, result);
            setAlarmSettings(prev => {
              const reverted = { ...prev, [slot]: { ...prev[slot], isOn: false } };
              safeSetItem('alarmSettings', JSON.stringify(reverted));
              return reverted;
            });
          }
        }
      } catch (e) {
        console.error(`[Modal Save] Error processing ${slot}:`, e);
      } finally {
        setProcessingSlots((prev) => {
          const next = new Set(prev);
          next.delete(slot);
          return next;
        });
      }
    }

    console.log('알람 설정 일괄 저장 및 동기화 완료');
    // 약간의 딜레이 후 락 해제 (마지막 비동기 처리가 끝난 후 안전하게)
    setTimeout(() => { isSavingRef.current = false; }, 1000);
  }, [alarmSettings, fcmToken, requestToken]);

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
