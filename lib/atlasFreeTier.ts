import type { SajuProfile } from "./saju";
import type { Tone } from "./lifetimeAtlasCopy";
import { buildMerchantLowestPunch } from "./dynamicAtlasNarrative";

/**
 * 인생 도감 무료 구간 — 오행 수치 + 최저 오행 장사꾼 모드 팩폭(4줄).
 * 명식·대운·키워드 등은 노출하지 않음.
 */
export function buildFreeAtlasChapter1Text(
  tone: Tone,
  args: {
    name: string;
    five: SajuProfile["five"];
    pillarsLine: string;
    dayMasterGan: string;
    birthDate: string;
    birthTime: string;
    k1: string;
    k2: string;
    k3: string;
    age: number;
    saju: SajuProfile;
    seed: number;
  },
): string {
  const { five, seed } = args;
  const num = `목 ${five.wood}% · 화 ${five.fire}% · 토 ${five.earth}% · 금 ${five.metal}% · 수 ${five.water}%`;
  const tTone = tone === "ko" ? "ko" : tone === "ja" ? "ja" : "en";
  const nm =
    (typeof args.name === "string" ? args.name : "").trim() || "익명";
  const merchant = buildMerchantLowestPunch(nm, five, tTone);
  void seed;
  void args.pillarsLine;
  void args.dayMasterGan;
  void args.birthDate;
  void args.birthTime;
  void args.k1;
  void args.k2;
  void args.k3;
  void args.age;
  void args.saju;

  if (tone === "ko") {
    return (
      `[미리보기 — 여기까지]\n${num}\n\n` +
      `[팩폭 · 최저 오행 — 이것 때문에 인연줄이 꼬이는 거야]\n${merchant}`
    );
  }

  if (tone === "en") {
    return (
      `[Free preview — stops here]\n${num}\n\n` +
      `[Lowest element — why your life knots]\n${merchant}`
    );
  }

  return (
    `[無料公開 — ここまで]\n${num}\n\n` +
    `[最薄い五行 — 人生が絡まる理由]\n${merchant}`
  );
}
