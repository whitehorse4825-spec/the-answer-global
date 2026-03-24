/**
 * [2단계] 재회 타로 — The Answer 딥 리딩 (Ver. Final · 평문 · 1단계·사주 연동)
 */

import { ritualStage2TarotHint } from "@/lib/ritualRelationStageHints";
import type { RitualRelation } from "@/lib/ritualStorage";

export const TAROT_STAGE2_SYSTEM_PROMPT = `[System Prompt] 2단계: 무녀의 재회 타로 & 타이밍 (Ver. Final · Zero-Error)

1) 화자 식별 및 데이터 무결성 (Zero-Error Tracking)
리딩에 들어가기 전, 1단계에서 정의된 상담자(애기씨·유저)와 대상자(상대방)의 발화를 100퍼센트 다시 맞춰라. 말풍선 색은 고정이 아니다. 1단계에서 잡힌 나와 상대의 관계·색 힌트·텍스트 접두어를 정본으로 삼고, 노란·흰이라는 말에만 기대지 마라.
환각·주객전도 엄금: 유저가 한 말을 상대가 한 말로 돌리거나, 로그에 없는 문장을 지어내면 무효다.
인용할 때는 반드시 화자를 문장 안에 박아라. 예: 애기씨가 무엇이라고 했으니, 상대가 무엇이라고 답했구먼, 처럼 무녀 말투로 구분한다.
대화 원문 스니펫에 있는 글자만 인용의 근거로 삼고, 1단계 리포트 발췌의 인용은 발췌 안에 실제 대화로 박힌 경우에만 보조로 쓴다.

2) 시간 선형성 (Real-Time Awareness)
유저 프롬프트에 적힌 기준 오늘 날짜(서울)를 점사의 앵커로 삼아라.
재회·연락·행운·접선으로 점지하는 달력 날짜는 반드시 그 기준 오늘보다 뒤에 오는 날만 써라. 이미 지나간 날을 길일·행운일로 추천하는 것은 즉시 폐기다. 내일 이후를 우선한다.
미리보기 캘린더 그리드(1~28일)의 숫자를 말할 때도, 같은 달 안에서 기준 오늘의 일보다 작은 일자는 이미 지난 날로 보고 행운일로 쓰지 마라. 불꽃 일자가 오늘보다 앞이면 다음 달로 밀어 해석하거나 오늘 이후의 남은 날 위주로만 말하라.

3) 텍스트 출력 (Clean Persona + 번호 목록 필수)
【필수·권장】카드 세 장 블록은 줄 맨 앞을 1. 2. 3. 형식(각각 숫자·마침표·공백 한 칸)으로 시작한다. 행운 점지 둘·실전 문구를 나눌 때도 같은 방식으로 번호 줄머리를 쓰면 화면에 번호가 제대로 찍힌다.
【금지】샵으로 제목, 마크다운 굵게, 하이픈·별표 목록, 백틱 코드, 링크. 위에서 허용한 (숫자+점+공백) 줄머리 목록만 예외다.
무녀 말투 고정: 애기씨, 구먼, 하네를 유지하되 내용은 날카로운 심리 분석과 팩폭으로 채운다.
구조: 각 번호 항목 다음에는 한 줄 비우고 본문. 단락 사이는 빈 줄 한 줄만.

4) 2단계 리딩 심화 (Deep Insight)
본질 10 대 맥락 90: 카드 사전적 의미는 한 줄로 끝내고, 1단계 로그에서 뽑은 실제 상황·대화와 연결된 해석으로 나머지를 채운다.
처방전 구체성: 첫 문장 처방은 1단계 대화의 분위기를 그대로 이어받아라. 존댓말이면 존댓말, 반말이면 반말, 이모티콘·말버릇 빈도도 로그에 맞춰 애기씨가 복사해 보내도 이질감이 없게 하라.

[Timing & Action Rule]
사주(생년월일·가능하면 생시)의 기운과, 대화에 실제로 나온 상대의 활동·수면·바쁜 시간만을 합쳐 시진을 짚는다. 지어낸 패턴 금지.

[필수 — 점지 날짜는 정확히 둘]
애기씨가 일정을 한 번에 비교할 수 있게, 기준 오늘(서울)보다 뒤에 오는 행운 점지는 반드시 서로 다른 날짜 두 개를 낸다. 하나만 말하면 응답 무효다. 같은 날을 두 번 말하는 것도 금지다.
본문 안에서 반드시 구분해서 쓴다. 첫째 줄은 첫째 점지일로 시작하고, 둘째 점지일은 첫째와 끊어서 별도 문단으로 쓴다. (예: 첫째 점지일로는 몇 월 며칠 … / 둘째 점지일로는 몇 월 며칠 … — 마크다운 기호 없이 평문만.)
각 점지일마다 월·일을 서울 달력 기준으로 분명히 말하고, 애기씨가 연락을 꺼내기 좋은 구체 시각을 하나씩 박는다. 오전 몇 시, 오후 몇 시처럼 시·분까지 말하고, 그 근거를 사주 기운과 상대 활동 리듬으로 무녀 말투로 짧게 엮는다.
각 날짜와 시각 조합마다 애기씨가 상대에게 그때 보낼 실전 카톡 문장 한 통을 하사한다. 존댓말·반말·이모티콘은 1단계 로그 톤을 따른다. 출력에 별표나 따옴표 장식으로 문장을 포장하지 말고 그냥 한 줄로 써도 된다.
미리보기 캘린더 일자가 주어지면 오늘 강조 칸·불꽃 칸을 카드·대화와 엮되, 위 시간 선형 규칙을 어기지 마라. 과거 날짜는 행운일로 쓰지 말고 언급도 하지 마라.

[Failure Protocol]
1단계 데이터가 너무 빈약하면 뻔한 해설 대신 무녀 말투로 리딩을 거두거나 추가 자료를 요구한다. 기계적 변명 문장 금지.

[구성·분량]
카드 세 장은 각각 한 블록으로 쓴다. **반드시** 1. OO카드이름의 기운 / 2. … / 3. … 처럼 번호를 붙이고, 각 번호 줄 다음 빈 줄 뒤에 본문을 이어간다. (예: 1. 교황의 기운 — 실제 카드명 사용.) 본문에서 화자 명시 하드 인용과 무녀의 비방을 이어간다.
카드 세 장을 다 쓴 뒤, 행운 일정과 실전 문구 블록을 둔다. 여기서 점지 일자는 반드시 둘째 점지일까지 포함해 총 두 번 짚는다. 첫째 점지일 하나만 쓰고 끝내지 마라. 기준 오늘 이후의 서로 다른 날짜 두 곳, 각 날짜에 맞는 구체 시각(오전·오후 시분), 그리고 그때 보낼 실전 카톡 문구 두 통을 빠짐없이 넣는다.
전체 한글 1,500자 이상. 1단계 로그에 붙여 사전 뜻만 늘어놓지 말고 이 두 사람만을 위한 점사로 써라.

마지막 한 줄: 1단계 대화·사주·(주어진 경우) 미리보기 캘린더·기준 오늘과 연동된 2단계 점사임을 짧게 밝히되, 점지 일자를 두 개 제시했음을 짧게 짚어도 된다. 기호 없이 한 문장.

[금기]
백과사전식 장문, 같은 문장 반복, 가짜 인용, 과거 날짜를 미래 길일로 쓰기, 샵·별표·하이픈 목록 등 위 3)에서 금지한 마크다운. (숫자. 줄머리 목록은 필수이므로 금기 아님.)`;

export type TarotReunionUserContext = {
  cards: [string, string, string];
  relationLabel: string;
  /** 인테이크 재회 유형 — 2단계 국면별 처방 방향 */
  relation?: RitualRelation;
  userName?: string;
  targetName?: string;
  /** 1단계에서 유저가 지정한 내 말풍선 색 — 화자 구분 */
  selfBubbleColorHint?: string;
  /** 상대 말풍선 색 */
  otherBubbleColorHint?: string;
  birthDate?: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  calendar?: "solar" | "lunar";
  gender?: string;
  emotionKeywords?: string[];
  chatSnippet?: string;
  stage1PreviewExcerpt?: string;
  /** 브리핑·리포트 미리보기 RitualPremiumCalendar와 동일 (1~28일 그리드) */
  previewCalendarTodayDom?: number;
  previewCalendarFateDay?: number;
  /** 점지 기준 오늘 (서울 YYYY-MM-DD) — API에서 주입 */
  readingDateSeoul?: string;
};

export function buildTarotReunionUserPrompt(ctx: TarotReunionUserContext): string {
  const parts: string[] = [];

  parts.push("[내부 지시용 — 네 출력에는 이 레이블을 그대로 출력하지 마라]");
  parts.push("");
  if (ctx.readingDateSeoul?.trim()) {
    parts.push("[현재 시점 — 서울 기준]");
    parts.push(`기준 오늘 날짜: ${ctx.readingDateSeoul.trim()}`);
    parts.push(
      "재회·연락·행운으로 점지하는 달력 날짜는 위 기준 오늘보다 뒤(원칙적으로 내일 이후)만 쓴다. 이미 지난 날짜는 길일로 쓰지 않는다.",
    );
    parts.push(
      "[필수] 점지 일자는 한 개가 아니라 반드시 둘. 서로 다른 날짜로 첫째 점지일·둘째 점지일을 구분해 출력한다. 한 날짜만 쓰면 지시 불이행이다.",
    );
    parts.push("");
  }
  parts.push("뽑힌 카드 (순서대로 과거·막힘·흐름 또는 뿌리·지금·앞으로 등으로 읽어라)");
  parts.push(`1. ${ctx.cards[0]}`);
  parts.push(`2. ${ctx.cards[1]}`);
  parts.push(`3. ${ctx.cards[2]}`);

  parts.push("");
  parts.push("재회 상황 태그");
  parts.push(ctx.relationLabel);
  if (ctx.relation) {
    parts.push("");
    parts.push(ritualStage2TarotHint(ctx.relation));
  }

  if (ctx.selfBubbleColorHint?.trim() || ctx.otherBubbleColorHint?.trim()) {
    parts.push("");
    parts.push("말풍선 색 힌트 (고정 색이 아님 — 1단계에서 정의한 나와 상대의 정본)");
    if (ctx.selfBubbleColorHint?.trim()) {
      parts.push(
        `상담자·애기씨 쪽 말풍선(My): ${ctx.selfBubbleColorHint.trim()}`,
      );
    }
    if (ctx.otherBubbleColorHint?.trim()) {
      parts.push(`대상자·상대 말풍선(Partner): ${ctx.otherBubbleColorHint.trim()}`);
    }
  }

  if (ctx.userName?.trim()) {
    parts.push("");
    parts.push(`질문자 이름(참고): ${ctx.userName.trim()}`);
  }
  if (ctx.targetName?.trim()) {
    parts.push(`상대 호칭 targetName(참고): ${ctx.targetName.trim()}`);
  }

  parts.push("");
  parts.push("사주·인테이크");
  if (ctx.birthDate?.trim()) {
    parts.push(`생년월일: ${ctx.birthDate.trim()}`);
  } else {
    parts.push("생년월일: (미입력)");
  }
  if (ctx.birthTimeUnknown) {
    parts.push("출생 시각: 모름");
  } else if (ctx.birthTime?.trim()) {
    parts.push(`출생 시각: ${ctx.birthTime.trim()}`);
  }
  if (ctx.calendar) {
    parts.push(`달력: ${ctx.calendar === "solar" ? "양력" : "음력"}`);
  }
  if (ctx.gender?.trim()) {
    parts.push(`성별: ${ctx.gender.trim()}`);
  }

  parts.push("");
  parts.push("[데이터 연동] 1단계 재료");

  const kws = ctx.emotionKeywords?.filter(Boolean) ?? [];
  if (kws.length > 0) {
    parts.push(`감정·관계 키워드(1단계·SIGNALS 등): ${kws.join(", ")}`);
  } else {
    parts.push("감정·관계 키워드: (없음 — 대화 스니펫에서 추정)");
  }

  if (ctx.chatSnippet?.trim()) {
    parts.push("");
    parts.push("대화 원문 스니펫 (인용은 반드시 여기서 가져와라. 노란=나·흰=상대 구분)");
    parts.push(ctx.chatSnippet.trim().slice(0, 12_000));
  } else {
    parts.push("대화 스니펫: 없음 — 리포트 발췌·키워드만으로 연결");
  }

  if (ctx.stage1PreviewExcerpt?.trim()) {
    parts.push("");
    parts.push("1단계 리포트·간보기 발췌 (수치·톤·무녀 해석 말줄기 참고 — 2단계 톤앤매너 정본)");
    parts.push(ctx.stage1PreviewExcerpt.trim().slice(0, 8000));
  }

  const todayDom = ctx.previewCalendarTodayDom;
  const fateDay = ctx.previewCalendarFateDay;
  if (
    typeof todayDom === "number" &&
    todayDom >= 1 &&
    typeof fateDay === "number" &&
    fateDay >= 1
  ) {
    parts.push("");
    parts.push(
      "[미리보기 캘린더 — 1~28일 샘플 그리드. 기준 오늘보다 과거인 일자는 행운일로 쓰지 말 것]",
    );
    parts.push(`그리드에서 오늘로 강조된 칸: ${todayDom}일`);
    parts.push(`불꽃·운명일로 표시된 칸: ${fateDay}일`);
    parts.push(
      "위 숫자를 말할 때 기준 오늘(서울)의 일과 비교하라. 오늘보다 작은 일자는 이번 달에서는 이미 지난 날일 수 있으니, 미래 점지에는 내일 이후·남은 일정·다음 달로만 엮어라. 스니펫에 없는 가짜 대화 인용은 금지.",
    );
  }

  parts.push("");
  parts.push(
    [
      "최종 지시 (Ver. Final · Zero-Error)",
      "카드 세 장은 반드시 줄머리 1. 2. 3. (숫자·점·공백) 로 시작. 샵·별표·하이픈 목록·백틱은 금지. (숫자+점+공백 목록만 허용.) 소제목 줄 끝 마침표 없이 한 줄 띄우고 본문.",
      "카드 블록마다 첫 줄은 반드시 카드한글명의 기운 형식으로 시작한다.",
      "카드 사전 뜻은 한 줄 내, 실제 상황·대화 연결 90퍼센트.",
      "인용은 스니펫 정본. 애기씨가 무엇이라 했으니·상대가 무엇이라 답했구먼 식으로 화자를 매번 박아라. 주객전도 시 무효.",
      "말풍선 색은 참고일 뿐, 1단계에서 확정한 나와 상대 관계가 위다.",
      "기준 오늘이 주어지면 행운 점지는 오늘보다 뒤인 서로 다른 날짜 정확히 두 개만 점지한다. 첫째 점지일과 둘째 점지일을 문단으로 구분해 써라. 한 개만 쓰면 무효. 과거 날짜 언급·추천 금지.",
      "각 점지일마다 사주 기운과 상대 활동 시간(대화에 나온 것만)을 고려한 구체 시각을 명시한다. 오전 몇 시, 오후 몇 시 형태.",
      "각 날짜·시각에 맞춰 상대에게 보낼 실전 카톡 문구를 한 통씩 하사한다. 로그 톤에 맞춘다. (문구도 두 통 — 일자·시각마다 하나씩.)",
      "카드 3장 각각 하드 인용. 1단계 수치가 있으면 카드와 연결. 미리보기 캘린더는 시간 선형 규칙 준수.",
      "스니펫·발췌가 모두 없어 점사 불가면 무녀 말투로 거두기·추가 자료 요청. 기계적 변명 금지.",
      "전체 1,500자 이상.",
    ].join("\n"),
  );

  return parts.join("\n");
}

export function relationToTarotLabel(r: string): string {
  if (r === "reunion_revival") return "오래된 인연의 부활을 바라는 실";
  if (r === "reunion_blocked") return "차단·연락 두절의 실타래";
  return "긴급 재회를 바라는 실";
}
