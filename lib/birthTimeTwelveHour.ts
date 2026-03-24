/**
 * 출생 시각 — UI(12시간제) ↔ 저장(HH:mm 24시간) 변환
 */

export type BirthTimeParts = {
  ampm: "AM" | "PM";
  /** 1–12 */
  hour12: number;
  /** 0–59 */
  minute: number;
};

/** "HH:mm" → 오전/오후 + 12시간제 시·분 */
export function birthTimeFrom24h(hhmm: string): BirthTimeParts {
  const [hs, ms] = hhmm.split(":");
  let h = parseInt(hs ?? "12", 10);
  const minute = Math.min(59, Math.max(0, parseInt(ms ?? "0", 10) || 0));
  if (Number.isNaN(h)) h = 12;
  h = ((h % 24) + 24) % 24;
  if (h === 0) return { ampm: "AM", hour12: 12, minute };
  if (h < 12) return { ampm: "AM", hour12: h, minute };
  if (h === 12) return { ampm: "PM", hour12: 12, minute };
  return { ampm: "PM", hour12: h - 12, minute };
}

/** 오전/오후 + 12시간제 → "HH:mm" */
export function birthTimeTo24h(
  ampm: BirthTimeParts["ampm"],
  hour12: number,
  minute: number,
): string {
  const m = Math.min(59, Math.max(0, minute));
  const h12 = Math.min(12, Math.max(1, hour12));
  let h24 = h12 % 12;
  if (ampm === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
