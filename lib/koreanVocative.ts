/**
 * 한국어 호격 조사: 이름 **마지막 글자** 받침 유무 → '아' / '야'
 * - 받침 있음 → 아 (예: 김유선 → 김유선아 — 마지막 글자 ‘선’에 받침 ㄴ)
 * - 받침 없음 → 야 (예: 무녀 → 무녀야)
 */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

export function isHangulSyllable(char: string): boolean {
  if (char.length !== 1) return false;
  const c = char.charCodeAt(0);
  return c >= HANGUL_BASE && c <= HANGUL_END;
}

/** 한 음절에 받침(종성)이 있는지 — ㄱ, ㄴ, … ㅎ, 없으면 0 */
export function hasBatchim(char: string): boolean {
  if (!isHangulSyllable(char)) return false;
  const code = char.charCodeAt(0) - HANGUL_BASE;
  const jong = code % 28;
  return jong !== 0;
}

/**
 * 이름 뒤에 붙는 호격 조사 '아' 또는 '야' (이름 제외)
 */
export function koreanVocativeParticle(name: string): "아" | "야" {
  const t = name.trim();
  if (!t) return "야";
  const last = t[t.length - 1]!;
  if (!isHangulSyllable(last)) return "야";
  return hasBatchim(last) ? "아" : "야";
}

/**
 * "유선아", "무녀야" 형태 — 부르는 호칭
 */
export function koreanVocativeCall(name: string): string {
  const t = name.trim();
  if (!t) return `익명${koreanVocativeParticle("익명")}`;
  return `${t}${koreanVocativeParticle(t)}`;
}

/** 목적어 조사 을/를 — 받침 있음 → 을, 없음 → 를 */
export function koreanEulReul(name: string): "을" | "를" {
  const t = name.trim();
  if (!t) return "을";
  const last = t[t.length - 1]!;
  if (!isHangulSyllable(last)) return "를";
  return hasBatchim(last) ? "을" : "를";
}
