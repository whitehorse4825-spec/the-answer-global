/**
 * 재회 비방실 — 클라이언트 전용 저장소 (Hydration: 읽기/쓰기는 effect 안에서만)
 */
import { clearKakaoAnalysisDraft } from "@/lib/kakaoPayResumeDraft";
import { clearKakaoPaymentSessionId } from "@/lib/kakaoPaymentSession";

export const RITUAL_INTAKE_KEY = "ritual:intake";
/** 하위 호환·명시용. 결제 여부는 브라우저에 저장하지 않는다. */
export const RITUAL_PAID_PREFIX = "ritual:paid:";

/** 카카오 분석 — 유저 입력 상대 호칭 targetName (값 없으면 프롬프트에서 '이 사람'·'상대방'으로 치환) */
export const RITUAL_KAKAO_TARGET_NAME_KEY = "ritual:kakao:counterpartDisplayName";

/** 재회 상황 세분화 (구: reunion/crush/crisis → 마이그레이션됨) */
export type RitualRelation =
  | "reunion_emergency"
  | "reunion_revival"
  | "reunion_blocked";

/** 구 저장값 → 신규 타입 */
export function normalizeRitualRelation(
  raw: unknown,
): RitualRelation {
  if (
    raw === "reunion_emergency" ||
    raw === "reunion_revival" ||
    raw === "reunion_blocked"
  ) {
    return raw;
  }
  if (raw === "reunion") return "reunion_emergency";
  if (raw === "crush") return "reunion_revival";
  if (raw === "crisis") return "reunion_blocked";
  return "reunion_emergency";
}

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
    const parsed = JSON.parse(raw) as RitualIntake;
    return {
      ...parsed,
      relation: normalizeRitualRelation(parsed.relation),
    };
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

/**
 * 결제 완료를 localStorage/Cookie에 쓰지 않는다.
 * `setRitualPaid`도 no-op — **브라우저에 결제 여부를 절대 남기지 않는다.**
 * 예전 코드·외부 참조 호환용 — 호출될 때마다 항상 미결제(false).
 */
export function isRitualPaid(_product: RitualProductId): boolean {
  void _product;
  return false;
}

/**
 * 결제 플래그 영속화 금지. 호환용 no-op.
 */
export function setRitualPaid(_product: RitualProductId, _paid = true): void {
  void _product;
  void _paid;
}

export function readKakaoTargetDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(RITUAL_KAKAO_TARGET_NAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeKakaoTargetDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const t = name.trim();
  if (t) window.localStorage.setItem(RITUAL_KAKAO_TARGET_NAME_KEY, t);
  else window.localStorage.removeItem(RITUAL_KAKAO_TARGET_NAME_KEY);
}

/** 기획 단일가: 인연 종결 풀패키지 (개별 만·천 단가 UI는 제거) */
export const RITUAL_PRICES: Record<RitualProductId, number> = {
  kakao: 35_000,
  tarot: 35_000,
  persona: 35_000,
};

/** 인연 종결 풀패키지 — 나이스·무통장 등 복채·승인 검증 기준 금액 */
export const FULL_PACKAGE_PRICE_WON = 35_000;

/**
 * 포트원 테스트/데모: 메뉴 로드맵 봉인 해제 UI용 플래그.
 * **서버 승인이 아닌 클라이언트 전용** — 프로덕션에서는 imp_uid 검증 API로 대체 권장.
 */
export const RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY =
  "ritual:fullPackage:portoneUnlocked";

export function readFullPackagePortoneUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFullPackagePortoneUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    // 결제 상태는 브라우저 세션 동안만 유지(영구 저장 금지).
    window.sessionStorage.setItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY, "1");
    window.localStorage.removeItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY);
  } catch {
    /* noop */
  }
}

/** 메인(홈) 등으로 돌아올 때 — 동일 PC에서도 다시 결제 UX가 맞도록 세션 잠금 해제 */
export function clearFullPackageSessionUnlock(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY);
  } catch {
    /* noop */
  }
}

/** 새 상담·이름 변경 시: 카톡 draft·결제 세션·상대 호칭만 제거 (의식 intake 유지) */
export function clearKakaoConsultBrowserData(): void {
  if (typeof window === "undefined") return;
  clearKakaoAnalysisDraft();
  clearKakaoPaymentSessionId();
  writeKakaoTargetDisplayName("");
}

/** 개발용 전체 초기화 — intake 포함 */
export function clearAllRitualBrowserDataForDev(): void {
  if (typeof window === "undefined") return;
  clearKakaoConsultBrowserData();
  try {
    window.sessionStorage.removeItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY);
    window.localStorage.removeItem(RITUAL_INTAKE_KEY);
    window.localStorage.removeItem(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY);
    const keys = Object.keys(window.localStorage);
    for (const k of keys) {
      if (k.startsWith(RITUAL_PAID_PREFIX)) window.localStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
}
