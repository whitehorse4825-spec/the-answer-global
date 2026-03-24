/**
 * 브리핑·리포트의 RitualPremiumCalendar(1~28일 샘플 그리드)와 동일한 규칙.
 * 2단계 타로 날짜 점지가 미리보기 UI와 맞도록 서버·LLM에 전달한다.
 */
export const RITUAL_PREVIEW_CALENDAR_GRID_MAX = 28;

/** 미리보기·브리핑 캘린더에서 불꽃(운명일)로 고정 표시되는 일자 */
export const RITUAL_PREVIEW_CALENDAR_FATE_DAY = 17;

/** '오늘' 링으로 강조되는 일자 — 그리드는 1~28만 표시 */
export function getRitualPreviewCalendarTodayDom(now = new Date()): number {
  return Math.min(Math.max(now.getDate(), 1), RITUAL_PREVIEW_CALENDAR_GRID_MAX);
}
