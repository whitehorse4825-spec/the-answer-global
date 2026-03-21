/**
 * 잠금 섹션: 본문 첫 문장(또는 첫 구절)만 노출할 때 사용.
 */
export function splitFirstSentence(
  text: string,
  maxLen = 200,
): { teaser: string; rest: string } {
  const t = text.trim();
  if (!t) return { teaser: "", rest: "" };

  const searchIn = t.slice(0, Math.min(t.length, 800));
  let best = -1;
  for (const d of ["。", ".", "!", "?", "？", "！", "\n"]) {
    const i = searchIn.indexOf(d);
    if (i > 0 && (best < 0 || i < best)) best = i;
  }

  if (best >= 0) {
    const end = best + 1;
    return {
      teaser: t.slice(0, end).trim(),
      rest: t.slice(end).trim(),
    };
  }

  if (t.length > maxLen) {
    const cut = t.lastIndexOf(" ", maxLen);
    const at = cut > 40 ? cut : maxLen;
    return {
      teaser: t.slice(0, at).trim() + "…",
      rest: t.slice(at).trim(),
    };
  }

  return { teaser: t, rest: "" };
}
