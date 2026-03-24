import { NextResponse } from "next/server";

/**
 * 카카오·메신저 분석 API — LLM system/user 프롬프트는 `lib/kakaoChatAnalysisPrompt.ts`에서 수정한다.
 * (일반적인 `api/generate/route.ts` 대신 이 엔드포인트 + OpenAI 래퍼를 사용한다.)
 *
 * 정책 요약: 애기씨만·엘라 금지 · 마이선/마이성 · KAKAO_UNIVERSAL_FINAL_BLOCK(X-pos·역학·9축·금기) · 캡처는 우측=나·좌측=상대
 */
import { parseKakaoAnalysisContext } from "@/lib/kakaoAnalysisContext";
import { RITUAL_LLM_NOT_CONFIGURED_MESSAGE } from "@/lib/ritualLlmEnv";
import {
  mergeEmotionKeywords,
  stripAndParseSignals,
} from "@/lib/kakaoReportSignals";
import { generateKakaoChatWithOpenAI } from "@/lib/openaiKakaoAnalysis";
import type { KakaoAnalysisMode } from "@/lib/openaiKakaoAnalysis";
import {
  normalizeRitualRelation,
  type RitualRelation,
} from "@/lib/ritualStorage";

export const maxDuration = 120;

const MAX_TEXT = 100_000;
const MAX_IMAGES = 4;
/** base64 문자열 길이 상한 (약 4MB 디코딩 전제의 보수적 제한) */
const MAX_B64_PER_IMAGE = 5_500_000;

type Body = {
  text?: string;
  hasImage?: boolean;
  images?: Array<{ mimeType?: string; dataBase64?: string }>;
  userName?: string;
  /** 유저 입력 상대 호칭 **targetName** (선택). 없으면 LLM은 '상대방'·'이 사람'만 사용 */
  targetName?: string;
  /** 내(나) 말풍선 색 힌트 — 예: 노란색 */
  selfBubbleColorHint?: string;
  /** 상대 말풍선 색 힌트 — 예: 흰색 */
  otherBubbleColorHint?: string;
  relation?: RitualRelation;
  birthDate?: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  calendar?: "solar" | "lunar" | string;
  gender?: string;
  /** 카톡 분석 전 제보: 관계·분위기·조언 톤 */
  analysisContext?: unknown;
  /** preview = 무료 간보기, full = 유료 전체 리포트 */
  mode?: KakaoAnalysisMode;
};

function relationKorean(rel?: RitualRelation | string): string | undefined {
  const r = rel ? normalizeRitualRelation(rel) : undefined;
  switch (r) {
    case "reunion_emergency":
      return "막 이별한 지 얼마 안 된 긴급 재회 (심리 분석 위주)";
    case "reunion_revival":
      return "헤어진 지 오래된 인연의 부활 (타이밍·비방 위주)";
    case "reunion_blocked":
      return "차단·연락 두절 (강력 비방·우회 전략 위주)";
    default:
      return undefined;
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const mode: KakaoAnalysisMode =
    body.mode === "full" ? "full" : "preview";

  const text = (body.text ?? "").trim().slice(0, MAX_TEXT);
  const images = (body.images ?? [])
    .slice(0, MAX_IMAGES)
    .map((im) => ({
      mimeType: String(im.mimeType ?? "image/jpeg"),
      dataBase64: String(im.dataBase64 ?? "").replace(/\s/g, ""),
    }))
    .filter((im) => im.dataBase64.length > 0);

  for (const im of images) {
    if (im.dataBase64.length > MAX_B64_PER_IMAGE) {
      return NextResponse.json(
        { error: "image_too_large", message: "이미지 용량이 너무 큽니다." },
        { status: 413 }
      );
    }
  }

  if (text.length < 20 && images.length === 0) {
    return NextResponse.json(
      {
        error: "input_required",
        message: "대화를 20자 이상 붙여 넣거나, 이미지를 1장 이상 올려 주세요.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "llm_not_configured",
        message: RITUAL_LLM_NOT_CONFIGURED_MESSAGE,
      },
      { status: 503 }
    );
  }

  const model = process.env.OPENAI_MODEL?.trim();
  const analysisContext = parseKakaoAnalysisContext(body.analysisContext);
  const relation = normalizeRitualRelation(body.relation ?? "reunion_emergency");

  try {
    const markdown = await generateKakaoChatWithOpenAI({
      apiKey,
      model: model || undefined,
      mode,
      chatText: text,
      images,
      userName: body.userName?.trim() || undefined,
      targetName: body.targetName?.trim() || undefined,
      selfBubbleColorHint: body.selfBubbleColorHint?.trim() || undefined,
      otherBubbleColorHint: body.otherBubbleColorHint?.trim() || undefined,
      relation,
      relationLabel: relationKorean(relation),
      birthDate: body.birthDate?.trim() || undefined,
      birthTime: body.birthTime?.trim() || undefined,
      birthTimeUnknown: body.birthTimeUnknown === true,
      calendar:
        body.calendar === "solar" || body.calendar === "lunar"
          ? body.calendar
          : undefined,
      gender: body.gender?.trim() || undefined,
      analysisContext,
    });

    const { body: mdBody, signals } = stripAndParseSignals(markdown);
    const emotionKeywords = mergeEmotionKeywords(signals, text, 3);

    if (mode === "preview") {
      return NextResponse.json({
        mode: "preview",
        preview: mdBody,
        emotionKeywords,
      });
    }
    return NextResponse.json({
      mode: "full",
      report: mdBody,
      emotionKeywords,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "분석에 실패했습니다.";
    return NextResponse.json(
      { error: "llm_failed", message },
      { status: 502 }
    );
  }
}
