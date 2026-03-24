/**
 * 1단계 카톡 분석 맥락 — 2단계 타로 API로 전달 (draft 삭제 후에도 유지)
 */
const KEY = "ritual:tarot:stage1Bridge";

export type TarotStage1Bridge = {
  emotionKeywords?: string[];
  chatSnippet?: string;
  stage1PreviewExcerpt?: string;
  targetName?: string;
  /** 1단계 카톡 — 나/상대 말풍선 색 (2단계 화자 인용용) */
  selfBubbleColorHint?: string;
  otherBubbleColorHint?: string;
  /**
   * 1단계 분석 직후 미리보기 캘린더에 쓰인 값(과거 세션 복원용).
   * 없으면 타로 요청 시점에 동일 함수로 보정한다.
   */
  previewCalendarTodayDom?: number;
  previewCalendarFateDay?: number;
  updatedAt: number;
};

export function saveTarotStage1Bridge(
  data: Omit<TarotStage1Bridge, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...data, updatedAt: Date.now() } satisfies TarotStage1Bridge),
    );
  } catch {
    /* quota */
  }
}

export function readTarotStage1Bridge(): TarotStage1Bridge | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TarotStage1Bridge;
    if (typeof v.updatedAt !== "number") return null;
    return v;
  } catch {
    return null;
  }
}
