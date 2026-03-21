/** 78장 라이더-웨이트 계열 식별자 (해석용 키) */
export type TarotCard = {
  id: number;
  nameKo: string;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
};

const MAJOR = [
  "바보",
  "마법사",
  "여교황",
  "여황제",
  "황제",
  "교황",
  "연인",
  "전차",
  "힘",
  "은둔자",
  "운명의 수레바퀴",
  "정의",
  "매달린 사람",
  "죽음",
  "절제",
  "악마",
  "탑",
  "별",
  "달",
  "태양",
  "심판",
  "세계",
] as const;

function minorNames(
  suit: TarotCard["suit"],
  koSuit: string,
): Omit<TarotCard, "id">[] {
  if (suit === "major") return [];
  const ranks = [
    "에이스",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "페이지",
    "나이트",
    "퀸",
    "킹",
  ];
  return ranks.map((r) => ({
    nameKo: `${koSuit} ${r}`,
    suit,
  }));
}

function buildDeck(): TarotCard[] {
  const out: TarotCard[] = [];
  let id = 0;
  for (const name of MAJOR) {
    out.push({ id: id++, nameKo: name, suit: "major" });
  }
  const minors: { suit: TarotCard["suit"]; ko: string }[] = [
    { suit: "wands", ko: "완드" },
    { suit: "cups", ko: "컵" },
    { suit: "swords", ko: "소드" },
    { suit: "pentacles", ko: "펜타클" },
  ];
  for (const m of minors) {
    for (const row of minorNames(m.suit, m.ko)) {
      out.push({ id: id++, nameKo: row.nameKo, suit: row.suit });
    }
  }
  return out;
}

export const TAROT_DECK_78: TarotCard[] = buildDeck();

export function shuffleDeck<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
