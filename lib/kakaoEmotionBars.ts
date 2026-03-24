/**
 * 브리핑/상세페이지와 동일 9축 라벨 — 막대 **높이만** 대화·키워드로 개인화.
 */
import { DELIVERED_EMOTION_BARS } from "@/lib/reunionDeliveredReportKo";

const LABEL_HINTS: Record<string, string[]> = {
  "회피·거리두기": [
    "회피",
    "거리",
    "늦",
    "읽씹",
    "잠수",
    "부담",
    "쉬",
    "연락",
    "답",
    "안 읽",
  ],
  "그리움·미련": [
    "그립",
    "보고",
    "미련",
    "추억",
    "다시",
    "그때",
    "옛",
    "생각",
    "보고싶",
  ],
  "분노·좌절": [
    "화",
    "짜증",
    "열받",
    "미쳐",
    "싫",
    "그만",
    "답답",
    "왜",
    "좌절",
  ],
  "자존심·방어": [
    "자존",
    "방어",
    "선",
    "굽",
    "안",
    "싫어",
    "거절",
    "냉",
    "짧",
  ],
  "불안·의심": [
    "불안",
    "의심",
    "걱정",
    "진짜",
    "맞",
    "확인",
    "거짓",
    "믿",
  ],
  "애착·의존": [
    "애착",
    "의존",
    "붙",
    "매일",
    "계속",
    "항상",
    "놓",
    "없",
    "헤어",
  ],
  "죄책감·후회": [
    "미안",
    "후회",
    "내가",
    "잘못",
    "그때",
    "죄",
    "미안해",
  ],
  "질투·비교": [
    "질투",
    "비교",
    "다른",
    "걔",
    "쟤",
    "여자",
    "남자",
    "친구",
  ],
  "희망·열린결말 욕구": [
    "희망",
    "나중",
    "언젠가",
    "그때",
    "다시",
    "기회",
    "만나",
    "보자",
  ],
};

function simpleHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 동일 9개 라벨 유지 + 고객별 막대 높이(18~92%).
 */
export function buildPersonalizedEmotionBars(
  keywords: string[],
  chatText: string,
): { heightPct: number; label: string }[] {
  const corpus = `${chatText}\n${keywords.join(" ")}`.toLowerCase();

  return DELIVERED_EMOTION_BARS.map((bar) => {
    const hints = LABEL_HINTS[bar.label] ?? [];
    let hitScore = 0;
    for (const h of hints) {
      const hl = h.toLowerCase();
      if (hl.length >= 2 && corpus.includes(hl)) hitScore += 1;
    }
    const normHit = hints.length
      ? Math.min(1, hitScore / Math.max(3, hints.length * 0.4))
      : 0.35;

    let kwBoost = 0;
    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (k.length < 2) continue;
      for (const h of hints) {
        if (k.includes(h.slice(0, Math.min(3, h.length))) || h.includes(k.slice(0, 2))) {
          kwBoost += 0.12;
          break;
        }
      }
    }
    kwBoost = Math.min(0.35, kwBoost);

    const seed = simpleHash(`${bar.label}|${corpus.slice(0, 800)}`);
    const jitter = (seed % 47) / 100;

    const raw = Math.min(1, normHit * 0.62 + kwBoost + jitter * 0.38);
    const heightPct = Math.round(18 + 74 * raw);
    return {
      label: bar.label,
      heightPct: Math.min(92, Math.max(18, heightPct)),
    };
  });
}
