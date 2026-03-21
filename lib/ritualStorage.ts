/**
 * 재회 비방실 — 클라이언트 전용 저장소 (Hydration: 읽기/쓰기는 effect 안에서만)
 */
export const RITUAL_INTAKE_KEY = "ritual:intake";
export const RITUAL_PAID_PREFIX = "ritual:paid:";

export type RitualRelation = "reunion" | "crush" | "crisis";

export type RitualIntake = {
  userName: string;
  relation: RitualRelation;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: string;
  updatedAt: number;
};

export type RitualProductId = "kakao" | "tarot" | "persona";

export function readRitualIntake(): RitualIntake | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RITUAL_INTAKE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RitualIntake;
  } catch {
    return null;
  }
}

export function writeRitualIntake(data: RitualIntake): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RITUAL_INTAKE_KEY, JSON.stringify(data));
}

export function ritualPaidKey(product: RitualProductId): string {
  return `${RITUAL_PAID_PREFIX}${product}`;
}

export function isRitualPaid(product: RitualProductId): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ritualPaidKey(product)) === "1";
}

export function setRitualPaid(product: RitualProductId, paid = true): void {
  if (typeof window === "undefined") return;
  if (paid) window.localStorage.setItem(ritualPaidKey(product), "1");
  else window.localStorage.removeItem(ritualPaidKey(product));
}

export const RITUAL_PRICES: Record<RitualProductId, number> = {
  kakao: 19_900,
  tarot: 19_900,
  persona: 19_900,
};
