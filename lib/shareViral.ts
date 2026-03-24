import type { FiveElements } from "./saju";
import { getSpicyOneLiner } from "./atlasSpicyLine";

/** 공유 링크에 UTM 부착 */
export function withShareUtm(
  baseUrl: string,
  medium: string = "share",
): string {
  try {
    const u = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    u.searchParams.set("utm_source", "share");
    u.searchParams.set("utm_medium", medium);
    return u.toString();
  } catch {
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}utm_source=share&utm_medium=${medium}`;
  }
}

export function pickViralShareText(
  tone: "ko" | "en" | "ja",
  five: FiveElements,
  seed: number,
): string {
  const spicy = getSpicyOneLiner(tone, five, seed);
  const idx = Math.abs(seed + 11) % 3;
  if (tone === "ko") {
    const tails = [
      `무녀 팩폭: ${spicy} 장난 아님 🌙`,
      `${spicy} 미래 인연 얼굴은 유료라던데… 고민 중 💸`,
      `토 ${five.earth}% 실화? ${spicy} #무녀`,
    ];
    return tails[idx] ?? tails[0];
  }
  if (tone === "en") {
    const tails = [
      `Wol-a roast: ${spicy} Hits different.`,
      `${spicy} Face of your match? Behind paywall 💸`,
      `Earth ${five.earth}%? ${spicy}`,
    ];
    return tails[idx] ?? tails[0];
  }
  const tails = [
    `ウォラ: ${spicy} 手加減なし。`,
    `${spicy} 相性の顔は課金って言われた 💸`,
    `土${five.earth}%？ ${spicy}`,
  ];
  return tails[idx] ?? tails[0];
}
