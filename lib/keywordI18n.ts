/**
 * Destiny Card 해시태그 — 내부 소스는 항상 한국어(canonical key), 화면·이미지·리포트는 locale로 변환.
 * 동적/AI 생성 시에도 동일 canonical을 쓰고 translateKeyword만 통과시킬 것.
 */

export type KeywordLocale = "ko" | "en" | "ja";

type Triple = { ko: string; en: string; ja: string };

/** 서비스 전 해시태그 단어 매핑 (KO 문자열 = canonical id) */
export const KEYWORD_TRIPLETS: Record<string, Triple> = {
  솔로: { ko: "솔로", en: "Solo", ja: "ソロ" },
  여유: { ko: "여유", en: "At Ease", ja: "余裕" },
  리듬: { ko: "리듬", en: "Rhythm", ja: "リズム" },
  재회: { ko: "재회", en: "Reunion", ja: "再会" },
  정렬: { ko: "정렬", en: "Alignment", ja: "整列" },
  타이밍: { ko: "타이밍", en: "Timing", ja: "タイミング" },
  짝사랑: { ko: "짝사랑", en: "Crush", ja: "片思い" },
  심장: { ko: "심장", en: "Heart", ja: "心臓" },
  파동: { ko: "파동", en: "Wave", ja: "波動" },
  썸: { ko: "썸", en: "Flirt", ja: "スム" },
  흔들림: { ko: "흔들림", en: "Tremor", ja: "揺れ" },
  연결: { ko: "연결", en: "Connection", ja: "つながり" },
  커플: { ko: "커플", en: "Couple", ja: "カップル" },
  동행: { ko: "동행", en: "Companion", ja: "同行" },
  성장: { ko: "성장", en: "Growth", ja: "成長" },
  이직: { ko: "이직", en: "Job Change", ja: "転職" },
  전환: { ko: "전환", en: "Shift", ja: "転換" },
  기술: { ko: "기술", en: "Skill", ja: "技術" },
  합격: { ko: "합격", en: "Pass", ja: "合格" },
  완성: { ko: "완성", en: "Completion", ja: "完成" },
  자격: { ko: "자격", en: "Qualification", ja: "資格" },
  창업: { ko: "창업", en: "Startup", ja: "起業" },
  불꽃: { ko: "불꽃", en: "Spark", ja: "火花" },
  확장: { ko: "확장", en: "Expansion", ja: "拡張" },
  투자: { ko: "투자", en: "Investment", ja: "投資" },
  기회: { ko: "기회", en: "Opportunity", ja: "機会" },
  재물운: { ko: "재물운", en: "Wealth Luck", ja: "財運" },
  안정: { ko: "안정", en: "Stability", ja: "安定" },
  축적: { ko: "축적", en: "Accumulation", ja: "蓄積" },
  평생: { ko: "평생", en: "Lifetime", ja: "一生" },
  도감: { ko: "도감", en: "Codex", ja: "図鑑" },
  패턴: { ko: "패턴", en: "Pattern", ja: "パターン" },
  강아지: { ko: "강아지", en: "Dog", ja: "犬" },
  충성: { ko: "충성", en: "Loyalty", ja: "忠誠" },
  보호: { ko: "보호", en: "Protection", ja: "保護" },
  고양이: { ko: "고양이", en: "Cat", ja: "猫" },
  독립: { ko: "독립", en: "Independence", ja: "独立" },
  정화: { ko: "정화", en: "Purify", ja: "浄化" },
  기타: { ko: "기타", en: "Other", ja: "その他" },
  교감: { ko: "교감", en: "Bond", ja: "交感" },
  치유: { ko: "치유", en: "Healing", ja: "癒し" },
  소울: { ko: "소울", en: "Soul", ja: "ソウル" },
  본드: { ko: "본드", en: "Bond", ja: "絆" },
  결속: { ko: "결속", en: "Ties", ja: "結束" },
  전생: { ko: "전생", en: "Past Life", ja: "前世" },
  기억: { ko: "기억", en: "Memory", ja: "記憶" },
  흔적: { ko: "흔적", en: "Trace", ja: "痕跡" },
  유대: { ko: "유대", en: "Bond", ja: "絆" },
  연애: { ko: "연애", en: "Romance", ja: "恋愛" },
  재물: { ko: "재물", en: "Wealth", ja: "財" },
  시그널: { ko: "시그널", en: "Signal", ja: "シグナル" },
  오늘: { ko: "오늘", en: "Today", ja: "今日" },
  징조: { ko: "징조", en: "Omen", ja: "兆し" },
  운명: { ko: "운명", en: "Destiny", ja: "運命" },
  데이터: { ko: "데이터", en: "Data", ja: "データ" },
  빛: { ko: "빛", en: "Light", ja: "光" },
};

/**
 * canonical 한국어 키 → 현재 locale 표시 문자열
 * 매핑 없으면 원문 유지(폴백) — 신규 태그 추가 시 KEYWORD_TRIPLETS에 반드시 추가.
 */
export function translateKeyword(
  canonicalKo: string,
  locale: string,
): string {
  const row = KEYWORD_TRIPLETS[canonicalKo];
  if (!row) return canonicalKo;
  if (locale === "en") return row.en;
  if (locale === "ja") return row.ja;
  return row.ko;
}

/** 해시태그 배열(한국어 소스) → 표시용 배열 */
export function translateKeywords(
  canonicalKorean: string[],
  locale: string,
): string[] {
  return canonicalKorean.map((k) => translateKeyword(k, locale));
}

/**
 * AI/동적 생성용: 반드시 아래 규칙을 시스템 프롬프트에 포함할 것.
 * - 해시태그 후보는 KEYWORD_TRIPLETS의 **해당 locale 컬럼** 단어만 사용.
 * - 임의 한국어 신조어 금지(매핑 테이블에 없으면 UI에서 폴백 깨짐).
 */
export const AI_KEYWORD_LOCALE_RULE = [
  "Before emitting any hashtag/keyword list: read the user's current UI locale (ko, en, or ja).",
  "Output keywords ONLY in that locale, using words from KEYWORD_TRIPLETS (see lib/keywordI18n.ts) for that locale column.",
  "Do not output Korean when locale is en/ja; do not output English when locale is ko/ja unless locale is en.",
  "If you invent a new concept, map it to the closest existing triplet or ask to extend KEYWORD_TRIPLETS—never leave untranslated Korean in non-ko locales.",
].join(" ");
