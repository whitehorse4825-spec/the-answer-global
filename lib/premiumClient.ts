/** 클라이언트 전용 — 프리미엄(결제 완료) 플래그 */
export const PREMIUM_STORAGE_KEY = "wola:premium";

export function readPremiumFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREMIUM_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePremiumToStorage(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(PREMIUM_STORAGE_KEY, "1");
    else window.localStorage.removeItem(PREMIUM_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** URL ?premium=1 이면 스토리지에 반영 (데모/결제 리턴용) */
export function syncPremiumFromUrl(): boolean {
  if (typeof window === "undefined") return readPremiumFromStorage();
  const q = window.location.search;
  const params = new URLSearchParams(q);
  if (params.get("premium") === "1") {
    writePremiumToStorage(true);
    return true;
  }
  return readPremiumFromStorage();
}
