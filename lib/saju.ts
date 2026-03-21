import { Solar } from "lunar-javascript";

export type FiveElements = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type ElementKey = keyof FiveElements;

export type SajuProfile = {
  pillars: { year: string; month: string; day: string; time: string };
  /** 예: 庚午 · 丁亥 · 乙巳 · 乙酉 */
  pillarsLine: string;
  dayMasterGan: string;
  dayMasterElement: ElementKey;
  /** 계산된 오행 비율(합 100, 정수) */
  five: FiveElements;
  /** 토 점수가 완전히 0일 때(간지·장간 포함) */
  earthIsZero: boolean;
  monthZhi: string;
  daYun: Array<{
    index: number;
    ganZhi: string;
    ages: string;
    startAge: number;
    endAge: number;
    /** 타임라인용 0–100 */
    flowScore: number;
  }>;
  /** 게임 스탯 (10–99) */
  stats: {
    endurance: number;
    spark: number;
    moneyIQ: number;
    socialRadar: number;
    chill: number;
  };
  /** 리딩 생성 전 확정 요약(내부 팩트 체크용) */
  factSheet: string;
};

const GAN_ELEMENT: Record<string, ElementKey> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
};

const ZHI_ELEMENT: Record<string, ElementKey> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return {
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
  };
}

function parseHm(s: string): { h: number; mi: number } {
  const t = s.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return { h: 12, mi: 0 };
  return { h: Number(m[1]), mi: Number(m[2]) };
}

/**
 * 입력 시각을 한국(Asia/Seoul) 벽시계로 보고, 동경 135° 기준 시주 보정으로
 * **30분을 빼서** 만세력 시주에 넣습니다. (요청 스펙)
 * 날짜 경계는 실제 타임존 규칙으로 처리합니다.
 */
function toSeoulAdjustedCalendar(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  subtractMinutes: number,
): { y: number; m: number; d: number; h: number; mi: number } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00+09:00`;
  const instant = Date.parse(iso);
  if (Number.isNaN(instant)) {
    return { y, m: mo, d, h, mi };
  }
  const adj = new Date(instant - subtractMinutes * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(adj);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    h: get("hour"),
    mi: get("minute"),
  };
}

function splitHideGan(s: string): string[] {
  if (!s) return [];
  return s
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function addScore(
  acc: Record<ElementKey, number>,
  el: ElementKey,
  w: number,
) {
  acc[el] += w;
}

/** 월지 계절 가중: 해당 지지가 가진 본기 오행에 소폭 부스트 */
function seasonBoost(monthZhi: string, el: ElementKey): number {
  const z = monthZhi;
  if (!z) return 1;
  // 겨울(亥子丑) → 수, 봄(寅卯辰) → 목, 여름(巳午未) → 화, 가을(申酉戌) → 금
  if (["亥", "子", "丑"].includes(z) && el === "water") return 1.22;
  if (["寅", "卯", "辰"].includes(z) && el === "wood") return 1.22;
  if (["巳", "午", "未"].includes(z) && el === "fire") return 1.18;
  if (["申", "酉", "戌"].includes(z) && el === "metal") return 1.18;
  if (["辰", "戌", "丑", "未"].includes(z) && el === "earth") return 1.12;
  return 1;
}

function normalizeFive(
  raw: Record<ElementKey, number>,
  monthZhi: string,
): FiveElements {
  const boosted: Record<ElementKey, number> = { ...raw };
  (Object.keys(boosted) as ElementKey[]).forEach((k) => {
    boosted[k] *= seasonBoost(monthZhi, k);
  });
  const sum = Object.values(boosted).reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 };
  }
  const order: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const floats = order.map((k) => (boosted[k] / sum) * 100);
  const ints = floats.map((v) => Math.floor(v));
  let diff = 100 - ints.reduce((a, b) => a + b, 0);
  // 나머지는 가장 큰 소수부부터 +1
  const frac = floats.map((v, i) => ({ i, f: v - Math.floor(v) }));
  frac.sort((a, b) => b.f - a.f);
  for (let k = 0; k < diff; k++) {
    ints[frac[k % order.length].i] += 1;
  }
  return {
    wood: ints[0],
    fire: ints[1],
    earth: ints[2],
    metal: ints[3],
    water: ints[4],
  };
}

function hashToRange(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const span = max - min + 1;
  return min + (Math.abs(h) % span);
}

/** 대운 기둥 → 타임라인 점수(상대적 흐름; 만세력 기반 결정론) */
function flowScoreForDaYun(ganZhi: string, dayGan: string): number {
  if (!ganZhi || ganZhi.length < 2) return 55;
  const g = ganZhi[0] ?? "";
  const z = ganZhi[1] ?? "";
  const dg = GAN_ELEMENT[dayGan] ?? "wood";
  const gg = GAN_ELEMENT[g] ?? "wood";
  const zg = ZHI_ELEMENT[z] ?? "earth";
  let score = 52;
  if (gg === dg) score += 10;
  if (zg === dg) score += 6;
  // 간단 상생 보너스
  const cycle: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const idx = (e: ElementKey) => cycle.indexOf(e);
  if ((idx(gg) + 1) % 5 === idx(dg)) score += 5;
  if ((idx(zg) + 1) % 5 === idx(dg)) score += 4;
  score += hashToRange(ganZhi + dayGan, -6, 8);
  return Math.min(96, Math.max(28, score));
}

function genderToYunCode(gender: string | undefined): 0 | 1 {
  if (gender === "female") return 1;
  return 0;
}

export function computeSajuProfile(input: {
  birthDate: string;
  birthTime: string;
  birthTimeUnknown?: boolean;
  gender?: string;
  /** 기본 true: 한국 출생 가정 시 30분 시주 보정 */
  koreaMeridianCorrectionMinutes?: number;
}): SajuProfile {
  const ymdFixed = parseYmd(input.birthDate) ?? { y: 1995, m: 1, d: 1 };
  const { y, m, d } = ymdFixed;

  let h = 12;
  let mi = 0;
  if (!input.birthTimeUnknown) {
    const p = parseHm(input.birthTime || "12:00");
    h = p.h;
    mi = p.mi;
  }

  const subMin = input.koreaMeridianCorrectionMinutes ?? 30;
  const cal = toSeoulAdjustedCalendar(y, m, d, h, mi, subMin);

  const solar = Solar.fromYmdHms(cal.y, cal.m, cal.d, cal.h, cal.mi, 0);
  const ec = solar.getLunar().getEightChar();

  const year = ec.getYear();
  const month = ec.getMonth();
  const day = ec.getDay();
  const time = ec.getTime();

  const yG = ec.getYearGan();
  const yZ = ec.getYearZhi();
  const mG = ec.getMonthGan();
  const mZ = ec.getMonthZhi();
  const dG = ec.getDayGan();
  const dZ = ec.getDayZhi();
  const tG = ec.getTimeGan();
  const tZ = ec.getTimeZhi();

  const dayMasterGan = dG;
  const dayMasterElement: ElementKey = GAN_ELEMENT[dayMasterGan] ?? "wood";

  const acc: Record<ElementKey, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const stemW = { y: 0.85, m: 1.05, d: 2.1, t: 0.95 };
  const branchW = { y: 0.75, m: 1.35, d: 1.05, t: 0.85 };
  const hideW = [0.38, 0.28, 0.18] as const;

  addScore(acc, GAN_ELEMENT[yG]!, stemW.y);
  addScore(acc, ZHI_ELEMENT[yZ]!, branchW.y);
  splitHideGan(String(ec.getYearHideGan())).forEach((g, i) => {
    const el = GAN_ELEMENT[g];
    if (el) addScore(acc, el, hideW[i] ?? hideW[2]!);
  });

  addScore(acc, GAN_ELEMENT[mG]!, stemW.m);
  addScore(acc, ZHI_ELEMENT[mZ]!, branchW.m);
  splitHideGan(String(ec.getMonthHideGan())).forEach((g, i) => {
    const el = GAN_ELEMENT[g];
    if (el) addScore(acc, el, hideW[i] ?? hideW[2]!);
  });

  addScore(acc, GAN_ELEMENT[dG]!, stemW.d);
  addScore(acc, ZHI_ELEMENT[dZ]!, branchW.d);
  splitHideGan(String(ec.getDayHideGan())).forEach((g, i) => {
    const el = GAN_ELEMENT[g];
    if (el) addScore(acc, el, hideW[i] ?? hideW[2]!);
  });

  addScore(acc, GAN_ELEMENT[tG]!, stemW.t);
  addScore(acc, ZHI_ELEMENT[tZ]!, branchW.t);
  splitHideGan(String(ec.getTimeHideGan())).forEach((g, i) => {
    const el = GAN_ELEMENT[g];
    if (el) addScore(acc, el, hideW[i] ?? hideW[2]!);
  });

  const five = normalizeFive(acc, mZ);
  const earthIsZero = five.earth === 0;
  /** 리딩·표시 전역: 토 비율은 five.earth 정수%와 항상 일치해야 함 */
  if (earthIsZero !== (five.earth === 0)) {
    throw new Error(
      `Saju invariant: earthIsZero (${earthIsZero}) must equal five.earth===0 (earth=${five.earth})`,
    );
  }

  const yun = ec.getYun(genderToYunCode(input.gender));
  const rawDaYun = yun.getDaYun(9);
  const daYun = rawDaYun.map((row, index) => {
    const gz = row.getGanZhi();
    const flowScore = gz
      ? flowScoreForDaYun(gz, dG)
      : 42 + (index % 5) * 3;
    return {
      index,
      ganZhi: gz,
      ages: `${row.getStartAge()}-${row.getEndAge()}세`,
      startAge: row.getStartAge(),
      endAge: row.getEndAge(),
      flowScore,
    };
  });

  const f = five;
  const endurance = Math.round(18 + f.earth * 0.55 + f.wood * 0.22);
  const spark = Math.round(22 + f.fire * 0.62 + f.metal * 0.12);
  const moneyIQ = Math.round(20 + f.metal * 0.45 + f.water * 0.28);
  const socialRadar = Math.round(18 + f.fire * 0.25 + f.water * 0.42);
  const chill = Math.round(16 + f.water * 0.5 + f.wood * 0.2);

  const clampStat = (n: number) => Math.min(99, Math.max(10, n));

  const pillarsLine = [year, month, day, time].join(" · ");

  const factSheet = [
    `팔자(간지): ${pillarsLine}`,
    `일간(타고난 기준 간문자): ${dayMasterGan} → ${dayMasterElement}`,
    `오행 비율(계절가중 후 정수%): 목${five.wood} 화${five.fire} 토${five.earth} 금${five.metal} 수${five.water}`,
    earthIsZero ? "토(흙) 에너지 스코어 0% — 리딩에서 흙을 ‘있다’고 서술하면 안 됨." : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    pillars: { year, month, day, time },
    pillarsLine,
    dayMasterGan,
    dayMasterElement,
    five,
    earthIsZero,
    monthZhi: mZ,
    daYun,
    stats: {
      endurance: clampStat(endurance),
      spark: clampStat(spark),
      moneyIQ: clampStat(moneyIQ),
      socialRadar: clampStat(socialRadar),
      chill: clampStat(chill),
    },
    factSheet,
  };
}
