/**
 * 간보기 결과·payload를 sessionStorage에 잠깐 둔다(새로고침 복원).
 * **결제/입금 완료 플래그는 localStorage에 저장하지 않음.**
 */
import type { KakaoAnalysisContext } from "@/lib/kakaoAnalysisContext";

const KEY = "ritual:kakao:analysisDraft";

export type KakaoAnalysisDraftPayload = {
  text: string;
  images: { mimeType: string; dataBase64: string }[];
  analysisContext: KakaoAnalysisContext;
  targetName: string;
  /** 내(나) 말풍선 색 — 유저가 지정하면 LLM 화자 매핑에 반영 */
  selfBubbleColorHint?: string;
  /** 상대 말풍선 색 */
  otherBubbleColorHint?: string;
};

export type KakaoAnalysisDraft = {
  payload: KakaoAnalysisDraftPayload;
  previewMd: string;
  /** analyze-chat API — @SIGNALS 파싱·빈도 폴백 */
  emotionKeywords?: string[];
  /** 서버 입금 승인·폴링용 세션 ID (페이액션·웹훅 1:1 식별자) */
  sessionId?: string;
  /** 의식 2단계에서 저장한 본인 이름 — 바뀌면 이전 draft 는 폐기 */
  consultUserName?: string;
  /** 유저가 모달에서 「입금 완료」를 누른 뒤(관리자 승인 대기) */
  depositPending?: boolean;
};

export function saveKakaoAnalysisDraft(draft: KakaoAnalysisDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function readKakaoAnalysisDraft(): KakaoAnalysisDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as KakaoAnalysisDraft;
    if (!v?.payload || typeof v.previewMd !== "string") return null;
    if (v.sessionId !== undefined && typeof v.sessionId !== "string") {
      delete v.sessionId;
    }
    if (
      v.consultUserName !== undefined &&
      typeof v.consultUserName !== "string"
    ) {
      delete v.consultUserName;
    }
    return v;
  } catch {
    return null;
  }
}

export function clearKakaoAnalysisDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
