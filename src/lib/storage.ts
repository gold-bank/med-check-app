/**
 * Safari Private Mode 안전 localStorage 유틸리티
 * Safari 개인 정보 보호 모드에서 QuotaExceededError 방지
 */

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage 읽기 불가 (개인 모드):', e);
  }
  return null;
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
      return true;
    }
  } catch (e) {
    console.warn('localStorage 저장 불가 (개인 모드):', e);
  }
  return false;
}

export function safeRemoveItem(key: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
      return true;
    }
  } catch (e) {
    console.warn('localStorage 삭제 불가 (개인 모드):', e);
  }
  return false;
}

export function safeClear(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
      return true;
    }
  } catch (e) {
    console.warn('localStorage 초기화 불가 (개인 모드):', e);
  }
  return false;
}
