/** 카톡 전문 봉인 해제 — 서버(DB)와 매칭되는 세션 ID (sessionStorage, 결제 플래그 아님) */
const SESSION_KEY = "ritual:kakao:paymentSessionId";

export function newKakaoPaymentSessionId(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ks_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_KEY, id);
    } catch {
      /* noop */
    }
  }
  return id;
}

export function clearKakaoPaymentSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function readKakaoPaymentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
