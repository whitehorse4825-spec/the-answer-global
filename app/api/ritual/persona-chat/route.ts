import { NextResponse } from "next/server";

import { generatePersonaStage3WithOpenAI } from "@/lib/openaiPersonaStage3";
import type { PersonaStage3Context } from "@/lib/personaStage3Prompt";
import { RITUAL_LLM_NOT_CONFIGURED_MESSAGE } from "@/lib/ritualLlmEnv";
import {
  normalizeRitualRelation,
  type RitualRelation,
} from "@/lib/ritualStorage";

export const maxDuration = 120;

type Msg = { role: "user" | "assistant"; content: string };

const DEFAULT_MAX_TURNS = 10;

function relationKorean(rel?: RitualRelation | string): string | undefined {
  const r = rel ? normalizeRitualRelation(rel) : undefined;
  switch (r) {
    case "reunion_emergency":
      return "막 이별한 지 얼마 안 된 긴급 재회";
    case "reunion_revival":
      return "헤어진 지 오래된 인연의 부활";
    case "reunion_blocked":
      return "차단·연락 두절";
    default:
      return undefined;
  }
}

export async function POST(req: Request) {
  let body: {
    messages?: Msg[];
    userName?: string;
    relation?: RitualRelation;
    /** 상대 호칭 (1단계 targetName) */
    targetName?: string;
    selfBubbleColorHint?: string;
    otherBubbleColorHint?: string;
    /** 1단계 리포트/간보기 발췌 (선택) */
    stage1Excerpt?: string;
    maxUserTurns?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const messages = body.messages?.filter((m) => m.content?.trim()) ?? [];
  const last = messages.filter((m) => m.role === "user").pop();
  if (!last?.content?.trim()) {
    return NextResponse.json({ error: "no user message" }, { status: 400 });
  }

  const rel = normalizeRitualRelation(body.relation ?? "reunion_emergency");
  const maxUserTurns =
    typeof body.maxUserTurns === "number" && body.maxUserTurns > 0
      ? Math.min(20, Math.floor(body.maxUserTurns))
      : DEFAULT_MAX_TURNS;

  const context: PersonaStage3Context = {
    userName: body.userName?.trim(),
    targetName: body.targetName?.trim(),
    relationLabel: relationKorean(rel),
    relation: rel,
    selfBubbleColorHint: body.selfBubbleColorHint?.trim(),
    otherBubbleColorHint: body.otherBubbleColorHint?.trim(),
    stage1Excerpt: body.stage1Excerpt?.trim(),
  };

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

  try {
    const model = process.env.OPENAI_MODEL?.trim();
    const reply = await generatePersonaStage3WithOpenAI({
      apiKey,
      model,
      messages,
      context,
      maxUserTurns,
    });
    return NextResponse.json({
      reply,
      mode: "llm" as const,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "llm_failed";
    return NextResponse.json(
      { error: "persona_chat_failed", message },
      { status: 502 },
    );
  }
}
