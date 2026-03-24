/** 리딩·점지 기준일 — 한국 서비스 기본 타임존 (YYYY-MM-DD) */
export function getSeoulDateISO(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = (parts.find((p) => p.type === "month")?.value ?? "").padStart(2, "0");
  const d = (parts.find((p) => p.type === "day")?.value ?? "").padStart(2, "0");
  return `${y}-${m}-${d}`;
}
