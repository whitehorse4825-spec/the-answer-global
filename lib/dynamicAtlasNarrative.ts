/**
 * 고정 문장 리스트에서 '골라 쓰기'가 아니라,
 * 오행 %·대운 스코어를 재료로 매번 문장을 조합한다 (클라이언트 생성형).
 */

import type { ElementKey, FiveElements, SajuProfile } from "./saju";
import { koreanVocativeCall } from "./koreanVocative";

export type AtlasNarrativeTone = "ko" | "en" | "ja";

const LABEL_KO: Record<ElementKey, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

/** 1% 단위 뉘앙스 (구간을 촘촘히) */
function nuanceKo(p: number): string {
  if (p <= 4) return "거의 바닥이라 인생이 제자리를 못 잡는";
  if (p <= 9) return "심하게 부족해서 루틴이 안 붙는";
  if (p <= 14) return "아직 15% 밑이라 결핍에 가까운";
  if (p <= 19) return "평균보다 살짝 모자라는";
  if (p <= 24) return "적정 하단에서 버티는";
  if (p <= 35) return "적정 구간에서 무난히 쓰이는";
  if (p <= 39) return "적정 상단—이제 과다 직전인";
  if (p <= 44) return "40% 넘어서기 시작한 과다 기운이 올라오는";
  if (p <= 55) return "과다 구간에서 힘이 세게 밀어붙이는";
  if (p <= 69) return "꽤 세게 쏠린";
  if (p <= 84) return "과하게 쏠려서 주변을 압박하는";
  return "거의 한쪽으로 쏠려서 밸런스가 무너지기 쉬운";
}

function nuanceEn(p: number): string {
  if (p <= 4) return "near-zero—life won’t dock";
  if (p <= 9) return "severely thin—routines won’t stick";
  if (p <= 14) return "still under 15%—leaning deficiency";
  if (p <= 19) return "below the 20% comfort line";
  if (p <= 35) return "in the healthy mid-band";
  if (p <= 39) return "borderline before excess";
  if (p <= 55) return "entering excess pressure";
  if (p <= 84) return "heavily skewed";
  return "extreme skew—balance is fragile";
}

function nuanceJa(p: number): string {
  if (p <= 4) return "ほぼゼロで定着しにくい";
  if (p <= 9) return "かなり薄くて習慣が続きにくい";
  if (p <= 14) return "まだ15%未満寄り";
  if (p <= 19) return "20%ラインを少し下回る";
  if (p <= 35) return "中庸帯で使いやすい";
  if (p <= 39) return "過多手前";
  if (p <= 55) return "過多側に入り始めた";
  return "かなり偏った";
}

/** 가장 눈에 띄는 불균형: 20% 기준 편차가 큰 쪽 */
export function getExtremeElement(five: FiveElements): {
  key: ElementKey;
  p: number;
  delta: number;
} {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  let best = { key: keys[0]!, p: five[keys[0]!], delta: 0 };
  for (const k of keys) {
    const p = five[k];
    const delta = Math.abs(p - 20);
    if (delta > best.delta) best = { key: k, p, delta };
  }
  return best;
}

/** 수치 최저 오행 — '장사꾼 모드' 무료 팩폭용 */
export function getLowestElement(five: FiveElements): {
  key: ElementKey;
  p: number;
} {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  let best = { key: keys[0]!, p: five[keys[0]!] };
  for (const k of keys) {
    if (five[k] < best.p) best = { key: k, p: five[k] };
  }
  return best;
}

/** 무료 · 최저 오행만 3줄 이상 팩폭 (결제 유도) */
export function buildMerchantLowestPunchKo(
  name: string,
  five: FiveElements,
): string {
  const low = getLowestElement(five);
  const L = LABEL_KO[low.key];
  const p = low.p;
  const call = koreanVocativeCall(name);
  return (
    `${call}, 지금 이 표에서 제일 망가져 있는 축은 ${L} ${p}%야.\n` +
    `바로 이거 때문에 인연줄·말·마음·체력이 한 줄로 꼬이는 거야—‘성격 탓’이 아니라 데이터가 이렇게 찍혀 있어.\n` +
    `${L}가 ${p}%면 루틴·경계·저축이 동시에 무너지기 쉬워. 의지가 아니라 표가 먼저야.\n` +
    `무녀의 방에서 이 축만 먼저 메우는 액션·타임라인·처방까지 숫자로 박아줄게.`
  );
}

export function buildMerchantLowestPunchEn(
  name: string,
  five: FiveElements,
): string {
  const low = getLowestElement(five);
  const L =
    low.key === "wood"
      ? "Wood"
      : low.key === "fire"
        ? "Fire"
        : low.key === "earth"
          ? "Earth"
          : low.key === "metal"
            ? "Metal"
            : "Water";
  const p = low.p;
  return (
    `${name}, the thinnest band on your chart is ${L} at ${p}%.\n` +
    `That’s the thread that knots money, work, love, and stamina—it’s not “weak will,” it’s the data.\n` +
    `At ${p}%, routines, boundaries, and savings slip together. Premium maps the exact fix and timeline.\n` +
    `Unlock to read the plug-in list with numbers, not vibes.`
  );
}

export function buildMerchantLowestPunchJa(
  name: string,
  five: FiveElements,
): string {
  const low = getLowestElement(five);
  const Lj =
    low.key === "wood"
      ? "木"
      : low.key === "fire"
        ? "火"
        : low.key === "earth"
          ? "土"
          : low.key === "metal"
            ? "金"
            : "水";
  const p = low.p;
  return (
    `${name}、今の表で一番薄いのは${Lj} ${p}%。\n` +
    `ここが金運・仕事・恋・体力を一本に絡ませる原因——根性のせいじゃなく数値がそう出てる。\n` +
    `${p}%だと習慣・境界・貯金が同時に抜けやすい。意志よりデータが先。\n` +
    `プレミアムでこの帯を塞ぐ行動・タイムライン・処方まで数値で出す。`
  );
}

export function buildMerchantLowestPunch(
  name: string,
  five: FiveElements,
  tone: "ko" | "en" | "ja",
): string {
  if (tone === "ko") return buildMerchantLowestPunchKo(name, five);
  if (tone === "en") return buildMerchantLowestPunchEn(name, five);
  return buildMerchantLowestPunchJa(name, five);
}

/** 무료 1팩폭 — 수치를 문장에 강제 삽입 */
export function buildFreeDataPunchline(
  name: string,
  five: FiveElements,
  tone: "ko" | "en" | "ja",
): string {
  const ex = getExtremeElement(five);
  const { key, p } = ex;

  if (tone === "ko") {
    const call = koreanVocativeCall(name);
    const L = LABEL_KO[key];
    const spread = Math.max(
      five.wood,
      five.fire,
      five.earth,
      five.metal,
      five.water,
    ) - Math.min(
      five.wood,
      five.fire,
      five.earth,
      five.metal,
      five.water,
    );
    if (p < 20) {
      return (
        `${call}, 네 사주에 ${L}가 ${p}%밖에 안 되는데 어떻게 한 자리에 진득하게 붙어 있겠니? ` +
        `${nuanceKo(p)} 상태야. 끈기·정착이 흔들리는 건 수치에 이미 찍혀 있어. ` +
        `지금 오행 편차는 최대 ${spread}%까지 벌어져 있어—가장 튀는 한 축만 먼저 채우자.`
      );
    }
    return (
      `${call}, ${L}가 ${p}%로 ${nuanceKo(p)} 편이야. ` +
      `20% 기준선에서 ${Math.abs(p - 20).toFixed(0)}%만큼 밀려 있어. ` +
      `전체 편차 ${spread}%—이걸 무시하고 ‘운 없어’라고만 하면 데이터가 울거든.`
    );
  }

  const L =
    key === "wood"
      ? "Wood"
      : key === "fire"
        ? "Fire"
        : key === "earth"
          ? "Earth"
          : key === "metal"
            ? "Metal"
            : "Water";

  if (tone === "en") {
    return (
      `${name}, ${L} sits at ${p}% — ${nuanceEn(p)}. ` +
      `That’s ${Math.abs(p - 20).toFixed(0)} points off the 20% reference. ` +
      `Fix the skew before you blame “luck.”`
    );
  }

  const Lj =
    key === "wood"
      ? "木"
      : key === "fire"
        ? "火"
        : key === "earth"
          ? "土"
          : key === "metal"
            ? "金"
            : "水";
  return (
    `${name}、${Lj}が${p}%——${nuanceJa(p)}。20%から${Math.abs(p - 20).toFixed(0)}ポイントズレてる。運のせいにする前に数値を見ろ。`
  );
}

/**
 * 무료 미리보기 2번째 줄 — 극단 오행 1개를 돈·일 또는 연애·사람 축에 연결 (수치 강제 삽입).
 * 화·수 → 연애·사람, 목·토·금 → 돈·일.
 */
export function buildFreeDomainTeaserLine(
  name: string,
  five: FiveElements,
  tone: "ko" | "en" | "ja",
  seed: number,
): string {
  const ex = getExtremeElement(five);
  const { key, p } = ex;
  const loveDomain = key === "fire" || key === "water";
  void seed;

  if (tone === "ko") {
    const call = koreanVocativeCall(name);
    const L = LABEL_KO[key];
    if (loveDomain) {
      const angle =
        key === "fire"
          ? p > 34
            ? "말·열이 먼저 가고 경계가 늦게 따라붙는 패턴"
            : "열·시선·말 속도가 관계 온도를 흔드는 패턴"
          : p > 34
            ? "끌림·번복이 길어져 정리가 미뤄지는 패턴"
            : "감정·흐름 데이터가 먼저 반응하는 패턴";
      return `${call}, ${L}가 ${p}%인 지금으로 보면 상대의 진심 줄에서 ‘${angle}’이야—무녀가 이 줄까지 끝까지 읽어줄게.`;
    }
    const angle =
      key === "earth"
        ? p < 15
          ? "저축·정착 축이 너무 얇아 지갑이 새기 쉬운 신호"
          : p > 34
            ? "정착·루틴이 과해서 전환·이직이 더뎌지는 신호"
            : "토(土) 데이터가 재회 타이밍의 바닥(버티는 힘)을 가리키는 신호"
        : key === "metal"
          ? p < 15
            ? "기준·선이 흐려 약속·마음이 뒤로 밀리는 신호"
            : "잘라내기·기준이 세서 재회 타이밍에서 선이 먼저 보이는 신호"
          : p < 15
            ? "확장·시작 축이 얇아 연락·진전이 늦게 붙는 신호"
            : "성장·확장 속도가 재회 타이밍에 먼저 닿는 신호";
    return `${call}, ${L}가 ${p}%인 지금으론 재회 타이밍 축에서 ‘${angle}’—무녀가 마음의 빗장까지 숫자로 열어 줄게.`;
  }

  const Len =
    key === "wood"
      ? "Wood"
      : key === "fire"
        ? "Fire"
        : key === "earth"
          ? "Earth"
          : key === "metal"
            ? "Metal"
            : "Water";
  const Lj =
    key === "wood"
      ? "木"
      : key === "fire"
        ? "火"
        : key === "earth"
          ? "土"
          : key === "metal"
            ? "金"
            : "水";

  if (tone === "en") {
    if (loveDomain) {
      const angle =
        key === "fire"
          ? p > 34
            ? "heat and words run before boundaries settle"
            : "tone and visibility shake relationship temperature first"
          : p > 34
            ? "pull and flip-flop stretch before closure"
            : "emotion and flow react first";
      return `${name} — ${Len} at ${p}% reads on love/people as: ${angle}. Premium finishes the thread with your numbers.`;
    }
    const angle =
      key === "earth"
        ? p < 15
          ? "vault and anchoring are thin—money leaks easily"
          : p > 34
            ? "anchoring is heavy—pivots slow on money/work"
            : "Earth band points to your money/work floor"
        : key === "metal"
          ? p < 15
            ? "standards and closing get fuzzy—cash and contracts slip"
            : "cuts and standards show up first in money/work"
          : p < 15
            ? "growth/start is thin—career and income attach late"
            : "expansion velocity hits the money/work timeline first";
    return `${name} — ${Len} at ${p}% on money/work: ${angle}. Premium plugs the leak with precision data.`;
  }

  if (loveDomain) {
    const angle =
      key === "fire"
        ? p > 34
          ? "熱と言葉が先に走り境界が後追い"
          : "視線・言葉の速度が関係温度を揺らす"
        : p > 34
          ? "引き寄せと揺り戻しで決着が遅れる"
          : "感情・流れが先に反応";
    return `${name}、${Lj}${p}%は恋・人の帯で「${angle}」。プレミアムで数値まで読み切る。`;
  }
  const angle =
    key === "earth"
      ? p < 15
        ? "貯めと定着が薄く財布が漏れやすい"
        : p > 34
          ? "定着が強く転換が遅い"
          : "土のデータが仕事・お金の土台を指す"
      : key === "metal"
        ? p < 15
          ? "基準と締めが甘く現金・契約が後ろ倒し"
          : "切断と基準が先に立つ"
        : p < 15
          ? "拡張が薄くキャリアと収入が遅れて乗る"
          : "成長の速度がタイムラインに先に触れる";
  return `${name}、${Lj}${p}%は金運・仕事帯で「${angle}」。プレミアムで穴を数値で塞ぐ。`;
}

function lineForElementKo(k: ElementKey, p: number): string {
  const L = LABEL_KO[k];
  const d = p - 20;
  const deltaStr = `${d >= 0 ? "+" : ""}${d.toFixed(0)}`;
  const cross =
    k === "wood" || k === "fire"
      ? "확장·시작 축"
      : k === "earth"
        ? "저축·끈기 축"
        : k === "metal"
          ? "잘라내기·기준 축"
          : "흐름·직감 축";
  return `· ${L} ${p}% (20% 대비 ${deltaStr}%p) — ${cross}에서 ${nuanceKo(p)} 톤으로 작동 중.`;
}

/** 프리미엄 s1 본문: 5행 상호작용(교차) 문장까지 조합 */
export function buildDynamicMatrixNarrativeKo(
  name: string,
  five: FiveElements,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lines = keys.map((k) => lineForElementKo(k, five[k]));
  const w = five.wood,
    f = five.fire,
    e = five.earth,
    m = five.metal,
    wa = five.water;
  const cross =
    e < 12 && f > 32
      ? `토 ${e}%가 바닥인데 화 ${f}%가 높으면—말·감정은 나가는데 땅(실속)이 안 받쳐줘서 프로젝트가 허공에 뜰 수 있어.`
      : wa > 38 && m < 15
        ? `수 ${wa}%가 넘치고 금 ${m}%가 얇으면—생각은 많은데 잣대로 끊질 못 해서 기회만 스쳐 지나갈 수 있어.`
        : w > 36 && e < 14
          ? `목 ${w}%는 올라갔는데 토 ${e}%가 낮아—시작은 많고 끝맺음은 약한 그래프야.`
          : `목·화·토·금·수가 서로 ${(Math.max(w, f, e, m, wa) - Math.min(w, f, e, m, wa)).toFixed(0)}%만큼 벌어져 있어서, 한 축만 고치면 나머지가 연쇄로 따라올 수 있어.`;

  const call = koreanVocativeCall(name);
  return (
    `[무녀 · 인연줄 해독 · 실시간 매트릭스 — 수치 그대로]\n` +
    `목 ${w}% · 화 ${f}% · 토 ${e}% · 금 ${m}% · 수 ${wa}%\n\n` +
    `${lines.join("\n")}\n\n` +
    `교차 읽기: ${cross}\n\n` +
    `${call}, 일간 한 글자로 성격을 단정하지 마. 위 %가 ${name}의 인연줄·말·마음에 미치는 무게를 결정해.`
  );
}

export function buildDynamicMatrixNarrativeEn(
  name: string,
  five: FiveElements,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lab = (k: ElementKey) =>
    k === "wood"
      ? "Wood"
      : k === "fire"
        ? "Fire"
        : k === "earth"
          ? "Earth"
          : k === "metal"
            ? "Metal"
            : "Water";
  const lines = keys.map(
    (k) =>
      `· ${lab(k)} ${five[k]}% — Δ from 20%: ${(five[k] - 20).toFixed(0)}pp — ${nuanceEn(five[k])}`,
  );
  return (
    `[Oracle Wol-a · live-composed matrix]\n` +
    `Wood ${five.wood}% · Fire ${five.fire}% · Earth ${five.earth}% · Metal ${five.metal}% · Water ${five.water}%\n\n` +
    `${lines.join("\n")}\n\n` +
    `Cross-read: elements diverge by ${(Math.max(five.wood, five.fire, five.earth, five.metal, five.water) - Math.min(five.wood, five.fire, five.earth, five.metal, five.water)).toFixed(0)} points peak-to-trough—patch the worst gap first.\n\n` +
    `${name}: the day stem is a label, not a verdict—these percentages run the show.`
  );
}

export function buildDynamicMatrixNarrativeJa(
  name: string,
  five: FiveElements,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const lab = (k: ElementKey) =>
    k === "wood"
      ? "木"
      : k === "fire"
        ? "火"
        : k === "earth"
          ? "土"
          : k === "metal"
            ? "金"
            : "水";
  const lines = keys.map(
    (k) =>
      `· ${lab(k)} ${five[k]}% — 20%からの差 ${(five[k] - 20).toFixed(0)}pp — ${nuanceJa(five[k])}`,
  );
  return (
    `[ウォラ · ライブ生成マトリクス]\n` +
    `木${five.wood}%・火${five.fire}%・土${five.earth}%・金${five.metal}%・水${five.water}%\n\n` +
    `${lines.join("\n")}\n\n` +
    `${name}、日干はラベル。性格一語より上の%が生活の重みを決める。`
  );
}

function buildDynamicMoneyKo(five: FiveElements, name: string): string {
  const vault = (five.earth + five.metal) / 2;
  const burn = five.fire;
  const leak = five.water;
  return (
    `${name}의 재회 타이밍 축을 숫자로만 보면: 토·금 평균 ${vault.toFixed(1)}%가 ‘버팀·기준’ 방어력, 화 ${burn}%가 ‘말·열·밀어붙임 속도’, 수 ${leak}%가 ‘흘러감·번복’. ` +
    `방어력 ${vault.toFixed(0)}% 대비 화 ${burn}%가 ${burn > vault + 8 ? "더 크면—말과 감정이 먼저 나가고 마음의 빗장이 늦게 닫히기 쉬워." : "비슷하면—한 번에 한 가지 약속만 묶어두는 습관만 얹어도 인연줄이 선명해져."} ` +
    `수 ${leak}%가 높을수록 약속·답장이 미뤄지는 패턴을 의심해.`
  );
}

function buildDynamicLoveKo(five: FiveElements, name: string): string {
  const heat = five.fire;
  const cool = five.water;
  const edge = five.metal;
  return (
    `${name}의 상대의 진심 축: 화 ${heat}%는 ‘열·말·시선’, 수 ${cool}%는 ‘끌림·번복’, 금 ${edge}%는 ‘선·거절’. ` +
    `화 ${heat}%와 수 ${cool}% 격차가 ${Math.abs(heat - cool).toFixed(0)}%면—말은 뜨거운데 마음은 흔들리거나, 반대로 말은 짧은데 끌림만 길게 가는 식으로 갈라져. ` +
    `금 ${edge}%가 ${edge < 12 ? "너무 낮으면 경계가 물러서 상대 습관에 끌려가고," : "충분하면 ‘여기까지만’을 말로 박을 수 있어."}`
  );
}

export function buildDynamicMoneyCareer(
  tone: AtlasNarrativeTone,
  five: FiveElements,
  name: string,
): string {
  if (tone === "ko") return buildDynamicMoneyKo(five, name);
  if (tone === "en") {
    const vault = (five.earth + five.metal) / 2;
    return (
      `${name} — money/work from numbers: Earth+Metal avg ${vault.toFixed(1)}% = vault/discipline; Fire ${five.fire}% = spend/talk speed; Water ${five.water}% = drift. ` +
      `Gap Fire−Vault = ${(five.fire - vault).toFixed(1)} points—if positive, plug leaks before chasing more income.`
    );
  }
  const vault = (five.earth + five.metal) / 2;
  return (
    `${name} — 金銭・仕事: 土+金平均${vault.toFixed(1)}%が防衛、火${five.fire}%が支出の速さ、水${five.water}%が流れ。差${(five.fire - vault).toFixed(1)}。`
  );
}

export function buildDynamicLovePeople(
  tone: AtlasNarrativeTone,
  five: FiveElements,
  name: string,
): string {
  if (tone === "ko") return buildDynamicLoveKo(five, name);
  if (tone === "en") {
    return (
      `${name} — love/people: Fire ${five.fire}% (heat/talk), Water ${five.water}% (pull/flux), Metal ${five.metal}% (boundaries). ` +
      `Spread ${Math.abs(five.fire - five.water).toFixed(0)} between Fire and Water shapes how you fight vs. melt in bonds.`
    );
  }
  return (
    `${name} — 恋・人: 火${five.fire}%・水${five.water}%・金${five.metal}%。火と水の差${Math.abs(five.fire - five.water).toFixed(0)}が距離感に効く。`
  );
}

const LABEL_JA_SHORT: Record<ElementKey, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

export function buildDynamicOpening(
  tone: AtlasNarrativeTone,
  name: string,
  five: FiveElements,
  k1: string,
): string {
  const ex = getExtremeElement(five);
  if (tone === "ko") {
    const call = koreanVocativeCall(name);
    return (
      `${call}, 지금 표에서 제일 시끄러운 건 ${LABEL_KO[ex.key]} ${ex.p}%야. ` +
      `20% 기준에서 ${ex.delta.toFixed(1)}만큼 튀어 있어. ` +
      `사람들은 「${k1}」 같은 말로 너를 포장하지만, 무녀는 이 숫자만 보고 인연줄을 잇는다.`
    );
  }
  if (tone === "en") {
    return (
      `${name}, the loudest band is ${ex.key} at ${ex.p}% — ${ex.delta.toFixed(1)} points off the 20% line. ` +
      `Tags like “${k1}” are costume; the chart is the costume department.`
    );
  }
  return (
    `${name}、いちばん騒がしいのは${LABEL_JA_SHORT[ex.key]} ${ex.p}%。20%から${ex.delta.toFixed(1)}ズレ。${k1}はラベル。`
  );
}

/** 현재 대운 한 줄 (첫 대운 행) */
export function buildCurrentDaewoonLine(
  saju: SajuProfile,
  tone: AtlasNarrativeTone,
): string {
  const row = saju.daYun.find((r) => r.ganZhi);
  if (!row) return "";
  if (tone === "ko") {
    return `지금 타임라인 구간: ${row.ages} ${row.ganZhi} — 전성기 흐름 점수 ${row.flowScore} (100 만점 스케일).`;
  }
  if (tone === "en") {
    return `Current decade: ${row.ages} ${row.ganZhi} — flow score ${row.flowScore}/100.`;
  }
  return `現在の大運: ${row.ages} ${row.ganZhi} — フロー${row.flowScore}/100。`;
}
