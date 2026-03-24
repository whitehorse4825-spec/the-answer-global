/**
 * 카톡 분석 전 '상황 제보' — 관계 / 분위기 / 조언 톤
 */

export type KakaoBond = "some" | "lover" | "ex" | "business";
export type KakaoAtmosphere = "sweet" | "fight" | "ghosted";
export type KakaoAdviceStyle = "roast" | "comfort" | "strategy";

export type KakaoAnalysisContext = {
  bond: KakaoBond;
  atmosphere: KakaoAtmosphere;
  adviceStyle: KakaoAdviceStyle;
};

export const DEFAULT_KAKAO_ANALYSIS_CONTEXT: KakaoAnalysisContext = {
  bond: "some",
  atmosphere: "sweet",
  adviceStyle: "roast",
};

const BONDS = new Set<KakaoBond>(["some", "lover", "ex", "business"]);
const ATMOSPHERES = new Set<KakaoAtmosphere>(["sweet", "fight", "ghosted"]);
const ADVICE = new Set<KakaoAdviceStyle>(["roast", "comfort", "strategy"]);

export function parseKakaoAnalysisContext(
  raw: unknown
): KakaoAnalysisContext {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_KAKAO_ANALYSIS_CONTEXT };
  }
  const o = raw as Record<string, unknown>;
  const bond = o.bond === "some" || o.bond === "lover" || o.bond === "ex" || o.bond === "business"
    ? o.bond
    : DEFAULT_KAKAO_ANALYSIS_CONTEXT.bond;
  const atmosphere =
    o.atmosphere === "sweet" || o.atmosphere === "fight" || o.atmosphere === "ghosted"
      ? o.atmosphere
      : DEFAULT_KAKAO_ANALYSIS_CONTEXT.atmosphere;
  const adviceStyle =
    o.adviceStyle === "roast" || o.adviceStyle === "comfort" || o.adviceStyle === "strategy"
      ? o.adviceStyle
      : DEFAULT_KAKAO_ANALYSIS_CONTEXT.adviceStyle;

  return {
    bond: BONDS.has(bond) ? bond : DEFAULT_KAKAO_ANALYSIS_CONTEXT.bond,
    atmosphere: ATMOSPHERES.has(atmosphere)
      ? atmosphere
      : DEFAULT_KAKAO_ANALYSIS_CONTEXT.atmosphere,
    adviceStyle: ADVICE.has(adviceStyle)
      ? adviceStyle
      : DEFAULT_KAKAO_ANALYSIS_CONTEXT.adviceStyle,
  };
}

/** LLM user 메시지 앞에 붙는 제보 블록 */
export function formatKakaoUserContextBlock(c: KakaoAnalysisContext): string {
  const bondKo: Record<KakaoBond, string> = {
    some: "썸",
    lover: "연인",
    ex: "전남친·전여친(헤어진 사이)",
    business: "비즈니스·업무",
  };
  const moodKo: Record<KakaoAtmosphere, string> = {
    sweet: "달달함",
    fight: "싸움 중",
    ghosted: "읽씹·냉각(답 지연)",
  };
  const adviceKo: Record<KakaoAdviceStyle, string> = {
    roast: "팩폭(날카로운 직설)",
    comfort: "위로(뼈 있는 공감)",
    strategy: "전략(행동·타이밍·문장)",
  };

  const bondHint = (() => {
    switch (c.bond) {
      case "lover":
        return "연인 프레임: 하트·애칭·보고 싶다는 말은 **정서적 유대**로 읽되, 그림자로 **애착 불안·과잉 확인** 가능성도 짚어라.";
      case "ex":
        return "헤어진 사이: 미련·권력역학·죄책 유발·재회 압·끊기 실패를 중시하고, 연애 달달 프레임으로만 포장하지 마라.";
      case "business":
        return "비즈니스: 감정 로맨스 추측은 최소화하고, 경계·의도·신뢰·리스크 중심으로 읽어라.";
      default:
        return "썸: 애매함·시험·거리두기·밀당·확인 욕구를 중시해라.";
    }
  })();

  const moodHint = (() => {
    switch (c.atmosphere) {
      case "sweet":
        return "분위기 달달: 애정·유대 가능성을 먼저 인정할 여지를 두되, 그림자(집착·과잉 의존)를 반드시 대비해라.";
      case "fight":
        return "싸움 중: 방어·반박·침묵·말 던지기의 **기능**(자존 방어 vs 관계 파괴)을 읽어라.";
      default:
        return "읽씹·냉각: 답장 지연·말줄임·읽음 표시와 맞물려 **권력·회피·무관심 위장**을 의심해라.";
    }
  })();

  const adviceHint = (() => {
    switch (c.adviceStyle) {
      case "comfort":
        return "조언은 **뼈 있는 위로**로. 뻔한 칭찬·무마만 금지, 진실은 말하되 유저 편에서 찌른다.";
      case "strategy":
        return "조언은 감정 나열이 아니라 **언제·무엇을·어떻게 말할지** 전술 중심으로 꽉 채워라.";
      default:
        return "조언 톤은 **팩폭·직설**을 기본으로 하되, 유저 제보 맥락에 맞게 날을 세밀하게 조절해라.";
    }
  })();

  return [
    "--- 유저 제보 맥락 (분석 전 질문 답변) ---",
    `· 상대방과의 관계: ${bondKo[c.bond]}`,
    `· 지금 대화 분위기: ${moodKo[c.atmosphere]}`,
    `· 원하는 조언: ${adviceKo[c.adviceStyle]}`,
    "",
    "【맥락별 해석 힌트 — 반드시 반영】",
    `· ${bondHint}`,
    `· ${moodHint}`,
    `· ${adviceHint}`,
    "",
    "【말흐름·이모티콘 대조】",
    "대화 **앞부분 vs 뒷부분**의 톤 차이, 문장 길이 변화, **이모티콘 사용 빈도·종류의 변화**를 대조해 '분위기 전환'을 데이터로 짚어라. (예: 예전엔 이모티콘이 많다가 줄었다면 냉각 신호 **가능성** — 반드시 본문 근거로 써라.)",
    "",
  ].join("\n");
}
