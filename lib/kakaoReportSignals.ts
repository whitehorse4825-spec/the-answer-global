/**
 * LLM 출력 끝의 `@SIGNALS:a|b|c` 메타줄 파싱·제거 + 대화 로그 빈도 기반 폴백 키워드
 */

const SIGNALS_LINE = /^@SIGNALS:(.+)$/i;

export function stripAndParseSignals(markdown: string): {
  body: string;
  signals: string[];
} {
  const trimmed = markdown.trimEnd();
  const lines = trimmed.split(/\n/);
  const lastLine = lines[lines.length - 1]?.trim() ?? "";
  const m = lastLine.match(SIGNALS_LINE);
  if (!m?.[1]) {
    return { body: markdown.trim(), signals: [] };
  }
  const signals = m[1]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length >= 1 && s.length <= 24)
    .slice(0, 5);
  const body = lines.slice(0, -1).join("\n").trimEnd();
  return { body, signals };
}

const STOP = new Set([
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "와",
  "과",
  "도",
  "만",
  "로",
  "으로",
  "하고",
  "그리고",
  "근데",
  "그래",
  "그냥",
  "이제",
  "우리",
  "너",
  "나",
  "나도",
  "좀",
  "더",
  "잘",
  "안",
  "아니",
  "진짜",
  "정말",
  "너무",
  "있어",
  "없어",
  "했어",
  "해요",
  "입니다",
  "그럼",
  "뭐",
  "음",
  "어",
  "오",
  "응",
  "---",
]);

/**
 * LLM 메타가 비었을 때 붙여넣기 대화에서 상위 토큰 3개 (한글·숫자·축약 혼합)
 */
export function extractFallbackKeywords(chatText: string, limit = 3): string[] {
  const raw = chatText.slice(0, 50_000);
  const tokens = raw.split(/[\s\n\r,./·…!?|[\]{}<>()'"`]+/g);
  const counts = new Map<string, number>();
  for (const t of tokens) {
    const w = t.trim();
    if (w.length < 2 || w.length > 14) continue;
    if (/^[\d:]+$/.test(w)) continue;
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, limit);
}

export function mergeEmotionKeywords(
  signals: string[],
  chatText: string,
  limit = 3,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of signals) {
    const k = s.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= limit) return out;
  }
  for (const f of extractFallbackKeywords(chatText, 12)) {
    if (seen.has(f)) continue;
    seen.add(f);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}
