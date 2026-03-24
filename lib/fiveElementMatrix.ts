/**
 * 명리학 오행 매트릭스 — 리딩은 이 수치 구간·문장만 사용 (모순 금지).
 * 결핍 <10% · 적정 15~35% · 과다 ≥40%
 * 경계: 10~14% = 결핍에 가까움, 36~39% = 과다 직전
 */

import type { FiveElements } from "./saju";
import { koreanVocativeCall } from "./koreanVocative";

export type ElementKey = keyof FiveElements;

export type FiveBand =
  | "deficiency" // <10%
  | "borderLow" // 10~14%
  | "adequate" // 15~35%
  | "borderHigh" // 36~39%
  | "excess"; // ≥40%

const LABEL_KO: Record<ElementKey, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

/** 사용자 제공 매트릭스 — 결핍·과다 문구는 이 텍스트만 사용 */
export const MATRIX_KO = {
  deficiency: {
    wood: "시작이 두렵고 의욕이 없음. 무기력함.",
    fire: "말주변 없음. 낯가림 심함. 존재감 제로.",
    earth: "끈기 제로. 주거 불안정. 이직 잦음.",
    metal: "결단력 부족. 우유부단. 맺고 끊기 못함.",
    water: "유연함 부족. 고정관념 강함. 생각이 막힘.",
  },
  excess: {
    wood: "고집불통. 일단 저지르고 수습 못 함. 번아웃 주의.",
    fire: "감정 조절 장애. 화를 못 참음. 허풍과 과시욕.",
    earth: "미련 곰탱이. 변화 거부. 생각만 하다 기회 놓침.",
    metal: "냉혈한. 칼 같은 성격으로 주변 사람 다 쳐냄.",
    water: "생각이 너무 많아 불면증. 음침함. 의심 많음.",
  },
  /** 적정(15~35%): 건강·유연 사용 — 강점/무기 */
  adequate: {
    wood: "목의 기운을 건강하게 씀. 방향만 잡으면 뻗어 나가는 힘이 무기.",
    fire: "화를 무기로 쓰기 좋은 밸런스. 말과 존재감을 과하지 않게 쓸 수 있음.",
    earth: "토가 적당히 받쳐 줌. 끈기·정리·저축을 습관으로 굴리기 좋은 구간.",
    metal: "금으로 잣대 세우기 좋음. 맺고 끊기에 망설임이 적은 편.",
    water: "수로 읽고 흐르기 좋게. 유연함·직감을 과잉 없이 쓸 수 있음.",
  },
} as const;

export function bandFor(p: number): FiveBand {
  if (p < 10) return "deficiency";
  if (p < 15) return "borderLow";
  if (p <= 35) return "adequate";
  if (p < 40) return "borderHigh";
  return "excess";
}

function bandLabelKo(b: FiveBand): string {
  switch (b) {
    case "deficiency":
      return "결핍";
    case "borderLow":
      return "결핍 경계";
    case "adequate":
      return "적정";
    case "borderHigh":
      return "과다 직전";
    case "excess":
      return "과다";
    default:
      return "";
  }
}

/** 한 오행에 대한 한 줄 팩폭 (수치·상태·매트릭스 문장만) */
export function lineForElementKo(key: ElementKey, p: number): string {
  const label = LABEL_KO[key];
  const b = bandFor(p);
  if (b === "deficiency") {
    return `${label} ${p}% · ${bandLabelKo(b)} — ${MATRIX_KO.deficiency[key]}`;
  }
  if (b === "borderLow") {
    return `${label} ${p}% · ${bandLabelKo(b)} — 아직 15% 미만이라 결핍에 가깝다고 보면 돼. (${MATRIX_KO.deficiency[key]})`;
  }
  if (b === "adequate") {
    return `${label} ${p}% · ${bandLabelKo(b)} — ${MATRIX_KO.adequate[key]}`;
  }
  if (b === "borderHigh") {
    return `${label} ${p}% · ${bandLabelKo(b)} — 40% 넘기 전에 과다 기운이 올라오기 시작했어. (${MATRIX_KO.excess[key]})`;
  }
  return `${label} ${p}% · ${bandLabelKo(b)} — ${MATRIX_KO.excess[key]}`;
}

/** 결핍: 이게 없어서 힘들지? / 과다: 이것 때문에 발목 */
export function explainKo(key: ElementKey, p: number): string {
  const b = bandFor(p);
  const label = LABEL_KO[key];
  if (b === "deficiency" || b === "borderLow") {
    return `→ ${label}이(가) 약하니까, 이게 없어서 힘들지? ${MATRIX_KO.deficiency[key]}`;
  }
  if (b === "excess" || b === "borderHigh") {
    return `→ ${label}이(가) 과하면, 이것 때문에 네가 발목 잡히는 거야. ${MATRIX_KO.excess[key]}`;
  }
  return `→ ${label}은(는) 적정 구간—${MATRIX_KO.adequate[key]}`;
}

/** 전체 매트릭스 블록 (필수 출력 형식) */
export function buildMatrixBlockKo(five: FiveElements): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lines = keys.map((k) => {
    const p = five[k];
    return `· ${lineForElementKo(k, p)}\n  ${explainKo(k, p)}`;
  });
  return (
    `[무녀의 오행 매트릭스 — lunar 계산 수치 그대로]\n` +
    `목 ${five.wood}% · 화 ${five.fire}% · 토 ${five.earth}% · 금 ${five.metal}% · 수 ${five.water}%\n\n` +
    `${lines.join("\n\n")}`
  );
}

/** 도입 훅: 결핍·과다가 있으면 그걸 먼저 짚음 (모순 없음) */
export function buildMatrixOpeningKo(
  name: string,
  five: FiveElements,
  k1: string,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const def: ElementKey[] = [];
  const exc: ElementKey[] = [];
  for (const k of keys) {
    const b = bandFor(five[k]);
    if (b === "deficiency" || b === "borderLow") def.push(k);
    if (b === "excess" || b === "borderHigh") exc.push(k);
  }

  const call = koreanVocativeCall(name);
  if (def.length && exc.length) {
    const d = def[0]!;
    const e = exc[0]!;
    return (
      `${call}, 일단 이것부터. ${LABEL_KO[d]}은(는) ${five[d]}%로 결핍 쪽이고, ${LABEL_KO[e]}은(는) ${five[e]}%로 과다 쪽이야. ` +
      `결핍은 「${MATRIX_KO.deficiency[d]}」처럼 느껴지고, 과다는 「${MATRIX_KO.excess[e]}」로 네 발목을 잡을 수 있어. ` +
      `아래 매트릭스를 한 줄씩만 따라와. 사람들은 ${k1} 같은 말로 너를 포장하지만, 무녀는 숫자만 본다.`
    );
  }
  if (def.length) {
    const d = def[0]!;
    return (
      `${call}, ${LABEL_KO[d]}이(가) ${five[d]}%야—결핍이지. 이게 없어서 힘들지? ${MATRIX_KO.deficiency[d]} ` +
      `자책 말고, 아래 매트릭스대로만 채워 넣자.`
    );
  }
  if (exc.length) {
    const e = exc[0]!;
    return (
      `${call}, ${LABEL_KO[e]}이(가) ${five[e]}%로 과다야. 이것 때문에 발목 잡히는 거야. ${MATRIX_KO.excess[e]} ` +
      `적정 밸런스는 아래 표에 다 있어.`
    );
  }
  return (
    `${call}, 다섯 기운이 전부 적정~경계 안에 모여 있네. 그래도 ${k1} 같은 꼬리표 뒤에 숨은 습관은 아래 매트릭스로 한 번 더 확인해.`
  );
}

/* ─── EN (Oracle Wol-a) — same bands, translated matrix ─── */

const LABEL_EN: Record<ElementKey, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
};

const MATRIX_EN = {
  deficiency: {
    wood: "Afraid to start; low drive; listless.",
    fire: "No small talk; shy; near-zero presence.",
    earth: "Zero stick-to-it-ness; housing instability; frequent job hops.",
    metal: "Weak decisiveness; can’t commit or cut clean.",
    water: "Low flexibility; rigid; mental blocks.",
  },
  excess: {
    wood: "Stubborn; acts first, can’t finish; burnout risk.",
    fire: "Emotional dysregulation; can’t hold anger; bluff and show-off.",
    earth: "Clingy; resists change; overthinks until chances pass.",
    metal: "Cold; cuts people with a blade-like edge.",
    water: "Overthinking, insomnia; gloomy; suspicious.",
  },
  adequate: {
    wood: "Wood used well—direction plus growth as a weapon.",
    fire: "Fire as a tool—voice and presence without excess.",
    earth: "Earth supports—routine, save, stack steadily.",
    metal: "Metal for clean standards—cut/keep with less hesitation.",
    water: "Water flows—intuition and adaptability without flooding.",
  },
} as const;

export function buildMatrixBlockEn(five: FiveElements): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lines = keys.map((k) => {
    const p = five[k];
    const b = bandFor(p);
    const lab = LABEL_EN[k];
    if (b === "deficiency")
      return `· ${lab} ${p}% — deficiency — ${MATRIX_EN.deficiency[k]}`;
    if (b === "borderLow")
      return `· ${lab} ${p}% — near-deficiency — ${MATRIX_EN.deficiency[k]}`;
    if (b === "adequate")
      return `· ${lab} ${p}% — adequate — ${MATRIX_EN.adequate[k]}`;
    if (b === "borderHigh")
      return `· ${lab} ${p}% — near-excess — ${MATRIX_EN.excess[k]}`;
    return `· ${lab} ${p}% — excess — ${MATRIX_EN.excess[k]}`;
  });
  return (
    `[Oracle Wol-a · Five-Element Matrix — computed %]\n` +
    `Wood ${five.wood}% · Fire ${five.fire}% · Earth ${five.earth}% · Metal ${five.metal}% · Water ${five.water}%\n\n` +
    lines.join("\n")
  );
}

export function buildMatrixOpeningEn(
  name: string,
  five: FiveElements,
  k1: string,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const def: ElementKey[] = [];
  const exc: ElementKey[] = [];
  for (const k of keys) {
    const b = bandFor(five[k]);
    if (b === "deficiency" || b === "borderLow") def.push(k);
    if (b === "excess" || b === "borderHigh") exc.push(k);
  }
  if (def.length && exc.length) {
    const d = def[0]!;
    const e = exc[0]!;
    return `${name}, Oracle Wol-a reads ${LABEL_EN[d]} at ${five[d]}% (deficiency) and ${LABEL_EN[e]} at ${five[e]}% (excess). Missing: ${MATRIX_EN.deficiency[d]} Excess drags you: ${MATRIX_EN.excess[e]} Follow the matrix—labels like “${k1}” are costume, not chart.`;
  }
  if (def.length) {
    const d = def[0]!;
    return `${name}, ${LABEL_EN[d]} is ${five[d]}%—deficiency. ${MATRIX_EN.deficiency[d]} Fill the gap per the matrix, not shame.`;
  }
  if (exc.length) {
    const e = exc[0]!;
    return `${name}, ${LABEL_EN[e]} is ${five[e]}%—excess. ${MATRIX_EN.excess[e]} That’s what snags your ankles.`;
  }
  return `${name}, all elements sit in adequate/border bands. Still audit habits behind tags like “${k1}”—matrix below.`;
}

/* ─── JA (月児ウォラ) ─── */

const LABEL_JA: Record<ElementKey, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const MATRIX_JA = {
  deficiency: {
    wood: "始めるのが怖く意欲がない。無気力。",
    fire: "話し下手・人見知り。存在感が薄い。",
    earth: "粘りゼロ。住まい不安定。転職が多い。",
    metal: "決断弱い。優柔不断。縁の切り方が曖昧。",
    water: "柔軟さ不足。固定観念。思考が詰まる。",
  },
  excess: {
    wood: "頑固。やってから失敗。燃え尽き注意。",
    fire: "感情コントロール難。怒り・見栄・誇示。",
    earth: "執着。変化拒否。考えすぎて機会損失。",
    metal: "冷血。刃物のように人を切る。",
    water: "考えすぎ不眠。陰気。疑い。",
  },
  adequate: {
    wood: "木を健全に使える。方向が決まれば伸びる。",
    fire: "火を武器にできる。言葉と熱のバランス。",
    earth: "土が支える。継続・整理・貯蓄に向く。",
    metal: "金で線引きできる。決断が速い。",
    water: "水で読み流せる。直感と柔軟さが過剰にならない。",
  },
} as const;

export function buildMatrixBlockJa(five: FiveElements): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lines = keys.map((k) => {
    const p = five[k];
    const b = bandFor(p);
    const lab = LABEL_JA[k];
    if (b === "deficiency")
      return `· ${lab} ${p}% — 欠損 — ${MATRIX_JA.deficiency[k]}`;
    if (b === "borderLow")
      return `· ${lab} ${p}% — 欠損寄り — ${MATRIX_JA.deficiency[k]}`;
    if (b === "adequate")
      return `· ${lab} ${p}% — 適正 — ${MATRIX_JA.adequate[k]}`;
    if (b === "borderHigh")
      return `· ${lab} ${p}% — 過多手前 — ${MATRIX_JA.excess[k]}`;
    return `· ${lab} ${p}% — 過多 — ${MATRIX_JA.excess[k]}`;
  });
  return (
    `[月児ウォラ · 五行マトリクス — 計算値]\n` +
    `木${five.wood}%・火${five.fire}%・土${five.earth}%・金${five.metal}%・水${five.water}%\n\n` +
    lines.join("\n")
  );
}

export function buildMatrixOpeningJa(
  name: string,
  five: FiveElements,
  k1: string,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const def: ElementKey[] = [];
  const exc: ElementKey[] = [];
  for (const k of keys) {
    const b = bandFor(five[k]);
    if (b === "deficiency" || b === "borderLow") def.push(k);
    if (b === "excess" || b === "borderHigh") exc.push(k);
  }
  if (def.length && exc.length) {
    const d = def[0]!;
    const e = exc[0]!;
    return `${name}、${LABEL_JA[d]}${five[d]}%は欠損、${LABEL_JA[e]}${five[e]}%は過多。欠けると「${MATRIX_JA.deficiency[d]}」過ぎると「${MATRIX_JA.excess[e]}」。${k1}という飾りより下の表を辿って。`;
  }
  if (def.length) {
    const d = def[0]!;
    return `${name}、${LABEL_JA[d]}が${five[d]}%——欠損。${MATRIX_JA.deficiency[d]} 下のマトリクスで補え。`;
  }
  if (exc.length) {
    const e = exc[0]!;
    return `${name}、${LABEL_JA[e]}が${five[e]}%——過多。${MATRIX_JA.excess[e]} 足首を取られるのはここ。`;
  }
  return `${name}、五行は概ね適正帯。それでも${k1}の後ろの癖は表で確認を。`;
}

/** 돈·일: 토·금·수 매트릭스만 인용 */
export function buildMoneyCareerKo(five: FiveElements): string {
  const e = bandFor(five.earth);
  const m = bandFor(five.metal);
  const w = bandFor(five.water);
  let t = "";
  if (e === "deficiency" || e === "borderLow") {
    t += `토가 ${five.earth}%—결핍·경계면 정리·저축·끈기가 새기 쉬워. ${MATRIX_KO.deficiency.earth} 자동이체·고정비부터 박아.\n\n`;
  } else if (e === "excess" || e === "borderHigh") {
    t += `토가 ${five.earth}%—과다·직전이면 ${MATRIX_KO.excess.earth} 돈은 ‘모으는 고집’이 아니라 ‘갈아타기’로 풀어.\n\n`;
  } else {
    t += `토 ${five.earth}%는 적정—저축·반복에 쓰기 좋은 구간이야. 월 상한만 정해 두면 돼.\n\n`;
  }
  if (m === "deficiency" || m === "borderLow") {
    t += `금이 ${five.metal}%면 조건·해지·협상에서 ${MATRIX_KO.deficiency.metal} 계약서·환불 규정은 꼭 읽어.\n\n`;
  } else if (m === "excess" || m === "borderHigh") {
    t += `금이 ${five.metal}%면 ${MATRIX_KO.excess.metal} 일·돈에서 사람을 너무 잘라내지 말고, 한 줄 여유는 남겨.\n\n`;
  } else {
    t += `금 ${five.metal}% 적정—맺고 끊기 무기로 쓰기 좋아.\n\n`;
  }
  if (w === "deficiency" || w === "borderLow") {
    t += `수가 ${five.water}%면 정보·감으로만 움직이기 어려워. ${MATRIX_KO.deficiency.water} 숫자·영수증으로만 확인해.\n`;
  } else if (w === "excess" || w === "borderHigh") {
    t += `수가 ${five.water}%면 ${MATRIX_KO.excess.water} 투자 말 많이 듣지 말고, 잠부터 지켜.\n`;
  } else {
    t += `수 ${five.water}% 적정—시장·사람 읽기 무기로 써도 돼. 과잉 신뢰만 조심.\n`;
  }
  return t.trim();
}

/** 연애·사람: 화·수·금 중심 매트릭스 */
export function buildLovePeopleKo(five: FiveElements): string {
  const f = bandFor(five.fire);
  const w = bandFor(five.water);
  const m = bandFor(five.metal);
  let t = "";
  if (f === "deficiency" || f === "borderLow") {
    t += `화 ${five.fire}%—말·표현이 결핍 쪽이면 ${MATRIX_KO.deficiency.fire} 좋아한다는 말을 행동 한 번으로 바꿔 보는 연습부터.\n\n`;
  } else if (f === "excess" || f === "borderHigh") {
    t += `화 ${five.fire}%—과다면 ${MATRIX_KO.excess.fire} 말이 예쁜 사람한테만 끌리지 말고, 조용한 사람의 반복 행동을 봐.\n\n`;
  } else {
    t += `화 ${five.fire}% 적정—말과 열을 관계에 쓰기 좋은 밸런스야.\n\n`;
  }
  if (w === "deficiency" || w === "borderLow") {
    t += `수 ${five.water}%—${MATRIX_KO.deficiency.water} 상대 감정에 끌려가지 말고, 오늘 나의 피로부터 체크해.\n\n`;
  } else if (w === "excess" || w === "borderHigh") {
    t += `수 ${five.water}%—${MATRIX_KO.excess.water} 상대 해석을 줄이고, 잠 시간을 먼저 지켜.\n\n`;
  } else {
    t += `수 ${five.water}% 적정—공감은 무기, 빨아들이기만 하지 마.\n\n`;
  }
  if (m === "deficiency" || m === "borderLow") {
    t += `금 ${five.metal}%—${MATRIX_KO.deficiency.metal} 미련 남기면 네가 다 져. 끊을 타이밍은 캘린더에 박아.\n`;
  } else if (m === "excess" || m === "borderHigh") {
    t += `금 ${five.metal}%—${MATRIX_KO.excess.metal} 차갑게 끊기 전에, 한 마디만 부드럽게.\n`;
  } else {
    t += `금 ${five.metal}% 적정—경계 세우기 좋은 구간이야.\n`;
  }
  return t.trim();
}

export function buildMoneyCareerEn(five: FiveElements): string {
  const e = bandFor(five.earth);
  const m = bandFor(five.metal);
  const w = bandFor(five.water);
  const parts: string[] = [];
  if (e === "deficiency" || e === "borderLow") {
    parts.push(
      `Earth ${five.earth}% — cashflow leaks without structure. ${MATRIX_EN.deficiency.earth} Autopay first.`,
    );
  } else if (e === "excess" || e === "borderHigh") {
    parts.push(
      `Earth ${five.earth}% — excess: ${MATRIX_EN.excess.earth} Don’t miss pivots for stubbornness.`,
    );
  } else {
    parts.push(
      `Earth ${five.earth}% — adequate: stack savings with a monthly cap.`,
    );
  }
  if (m === "deficiency" || m === "borderLow") {
    parts.push(
      `Metal ${five.metal}% — ${MATRIX_EN.deficiency.metal} Read contracts; name your exit terms.`,
    );
  } else if (m === "excess" || m === "borderHigh") {
    parts.push(
      `Metal ${five.metal}% — ${MATRIX_EN.excess.metal} Soften one sentence when you cut.`,
    );
  } else {
    parts.push(`Metal ${five.metal}% — clean cuts are your edge.`);
  }
  if (w === "deficiency" || w === "borderLow") {
    parts.push(
      `Water ${five.water}% — ${MATRIX_EN.deficiency.water} Verify with numbers, not vibes.`,
    );
  } else if (w === "excess" || w === "borderHigh") {
    parts.push(
      `Water ${five.water}% — ${MATRIX_EN.excess.water} Sleep before more “research.”`,
    );
  } else {
    parts.push(`Water ${five.water}% — read the room; don’t drown in it.`);
  }
  return parts.join("\n\n");
}

export function buildLovePeopleEn(five: FiveElements): string {
  const f = bandFor(five.fire);
  const w = bandFor(five.water);
  const m = bandFor(five.metal);
  const parts: string[] = [];
  if (f === "deficiency" || f === "borderLow") {
    parts.push(
      `Fire ${five.fire}% — ${MATRIX_EN.deficiency.fire} Trade one bold action for pretty words.`,
    );
  } else if (f === "excess" || f === "borderHigh") {
    parts.push(
      `Fire ${five.fire}% — ${MATRIX_EN.excess.fire} Watch charm without follow-through.`,
    );
  } else {
    parts.push(`Fire ${five.fire}% — presence without scorching others.`);
  }
  if (w === "deficiency" || w === "borderLow") {
    parts.push(
      `Water ${five.water}% — ${MATRIX_EN.deficiency.water} Guard your sleep first.`,
    );
  } else if (w === "excess" || w === "borderHigh") {
    parts.push(
      `Water ${five.water}% — ${MATRIX_EN.excess.water} Less mind-reading; more rest.`,
    );
  } else {
    parts.push(`Water ${five.water}% — empathy is a tool, not a sponge.`);
  }
  if (m === "deficiency" || m === "borderLow") {
    parts.push(
      `Metal ${five.metal}% — ${MATRIX_EN.deficiency.metal} Name the exit date, not the fantasy.`,
    );
  } else if (m === "excess" || m === "borderHigh") {
    parts.push(
      `Metal ${five.metal}% — ${MATRIX_EN.excess.metal} Leave warmth in the last line.`,
    );
  } else {
    parts.push(`Metal ${five.metal}% — boundaries without freezing love.`);
  }
  return parts.join("\n\n");
}

export function buildMoneyCareerJa(five: FiveElements): string {
  const e = bandFor(five.earth);
  const m = bandFor(five.metal);
  const w = bandFor(five.water);
  const parts: string[] = [];
  if (e === "deficiency" || e === "borderLow") {
    parts.push(
      `土${five.earth}% 欠損寄り — ${MATRIX_JA.deficiency.earth} 自動振込から。`,
    );
  } else if (e === "excess" || e === "borderHigh") {
    parts.push(`土${five.earth}% 過多寄り — ${MATRIX_JA.excess.earth} 固執をほどく。`);
  } else {
    parts.push(`土${five.earth}% 適正 — 積み上げに向く。上限を決める。`);
  }
  if (m === "deficiency" || m === "borderLow") {
    parts.push(`金${five.metal}% — ${MATRIX_JA.deficiency.metal} 契約を読む。`);
  } else if (m === "excess" || m === "borderHigh") {
    parts.push(`金${five.metal}% — ${MATRIX_JA.excess.metal} 一刀両断に一言余白。`);
  } else {
    parts.push(`金${five.metal}% 適正 — 線引きが武器。`);
  }
  if (w === "deficiency" || w === "borderLow") {
    parts.push(`水${five.water}% — ${MATRIX_JA.deficiency.water} 数字で確認。`);
  } else if (w === "excess" || w === "borderHigh") {
    parts.push(`水${five.water}% — ${MATRIX_JA.excess.water} 睡眠優先。`);
  } else {
    parts.push(`水${five.water}% 適正 — 読みは強み、溺れない。`);
  }
  return parts.join("\n\n");
}

export function buildLovePeopleJa(five: FiveElements): string {
  const f = bandFor(five.fire);
  const w = bandFor(five.water);
  const m = bandFor(five.metal);
  const parts: string[] = [];
  if (f === "deficiency" || f === "borderLow") {
    parts.push(`火${five.fire}% — ${MATRIX_JA.deficiency.fire} 行動一回で示す。`);
  } else if (f === "excess" || f === "borderHigh") {
    parts.push(`火${five.fire}% — ${MATRIX_JA.excess.fire} 言葉の華だけ見ない。`);
  } else {
    parts.push(`火${five.fire}% 適正 — 熱のコントロール可。`);
  }
  if (w === "deficiency" || w === "borderLow") {
    parts.push(`水${five.water}% — ${MATRIX_JA.deficiency.water} 自分の疲れを先に。`);
  } else if (w === "excess" || w === "borderHigh") {
    parts.push(`水${five.water}% — ${MATRIX_JA.excess.water} 解釈を減らす。`);
  } else {
    parts.push(`水${five.water}% 適正 — 共感は道具。`);
  }
  if (m === "deficiency" || m === "borderLow") {
    parts.push(`金${five.metal}% — ${MATRIX_JA.deficiency.metal} 終わりの日を決める。`);
  } else if (m === "excess" || m === "borderHigh") {
    parts.push(`金${five.metal}% — ${MATRIX_JA.excess.metal} 一刀の前に温度。`);
  } else {
    parts.push(`金${five.metal}% 適正 — 境界が運。`);
  }
  return parts.join("\n\n");
}
