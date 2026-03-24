import { NextResponse } from "next/server";

import { generateTarotReunionReadingWithOpenAI } from "@/lib/openaiTarotReunionReading";
import {
  relationToTarotLabel,
  type TarotReunionUserContext,
} from "@/lib/tarotReunionReadingPrompt";
import { getSeoulDateISO } from "@/lib/seoulDate";
import { RITUAL_LLM_NOT_CONFIGURED_MESSAGE } from "@/lib/ritualLlmEnv";
import {
  normalizeRitualRelation,
  type RitualRelation,
} from "@/lib/ritualStorage";

type Body = {
  cards?: string[];
  birthDate?: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  calendar?: "solar" | "lunar";
  gender?: string;
  relation?: RitualRelation;
  userName?: string;
  targetName?: string;
  /** 1단계 analyze-chat @SIGNALS·병합 키워드 */
  emotionKeywords?: string[];
  /** 카톡 붙여넣기 일부 */
  chatSnippet?: string;
  /** 1단계 마크다운 간보기/리포트 발췌 */
  stage1PreviewExcerpt?: string;
  selfBubbleColorHint?: string;
  otherBubbleColorHint?: string;
  /** 1~28일 미리보기 캘린더 — 오늘 강조 일자 */
  previewCalendarTodayDom?: number;
  /** 불꽃(운명일) 일자 */
  previewCalendarFateDay?: number;
};

const LLM_NOT_CONFIGURED_MSG =
  "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다. 배포 환경 변수를 확인하세요.";

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const cards = body.cards?.filter(Boolean) ?? [];
  if (cards.length !== 3) {
    return NextResponse.json({ error: "need 3 cards" }, { status: 400 });
  }

  const r = normalizeRitualRelation(body.relation ?? "reunion_emergency");
  const relationLabel = relationToTarotLabel(r);
  const readingDateSeoul = getSeoulDateISO();

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "llm_not_configured",
        message: RITUAL_LLM_NOT_CONFIGURED_MESSAGE,
      },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_MODEL?.trim();
  const ctx: TarotReunionUserContext = {
    cards: [cards[0], cards[1], cards[2]],
    relationLabel,
    relation: r,
    readingDateSeoul,
    userName: body.userName?.trim(),
    targetName: body.targetName?.trim(),
    selfBubbleColorHint: body.selfBubbleColorHint?.trim(),
    otherBubbleColorHint: body.otherBubbleColorHint?.trim(),
    birthDate: body.birthDate?.trim(),
    birthTime: body.birthTime?.trim(),
    birthTimeUnknown: body.birthTimeUnknown,
    calendar: body.calendar,
    gender: body.gender?.trim(),
    emotionKeywords: body.emotionKeywords,
    chatSnippet: body.chatSnippet?.trim(),
    stage1PreviewExcerpt: body.stage1PreviewExcerpt?.trim(),
    previewCalendarTodayDom:
      typeof body.previewCalendarTodayDom === "number"
        ? body.previewCalendarTodayDom
        : undefined,
    previewCalendarFateDay:
      typeof body.previewCalendarFateDay === "number"
        ? body.previewCalendarFateDay
        : undefined,
  };

  try {
    const reading = await generateTarotReunionReadingWithOpenAI({
      apiKey,
      model,
      context: ctx,
    });
    return NextResponse.json({ reading, mode: "llm" as const });
  } catch (e) {
    const message = e instanceof Error ? e.message : "llm_failed";
    return NextResponse.json(
      {
        error: "tarot_reading_failed",
        message,
      },
      { status: 502 },
    );
  }
}
