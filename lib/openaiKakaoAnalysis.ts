import {
  KAKAO_ANALYSIS_SYSTEM_PROMPT,
  KAKAO_PREVIEW_SYSTEM_PROMPT,
  buildKakaoAnalysisUserPrompt,
} from "@/lib/kakaoChatAnalysisPrompt";
import { sanitizeMaiSunNicknameInReport } from "@/lib/kakaoChatReportSanitize";
import type { KakaoAnalysisContext } from "@/lib/kakaoAnalysisContext";
import type { RitualRelation } from "@/lib/ritualStorage";

export type KakaoImagePayload = {
  mimeType: string;
  /** 순수 base64 (data: 접두사 없음) */
  dataBase64: string;
};

export type KakaoAnalysisMode = "preview" | "full";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function normalizeMime(m: string): string {
  const x = m.toLowerCase().split(";")[0]?.trim() ?? "";
  if (x === "image/jpg") return "image/jpeg";
  return x;
}

function buildUserContent(
  userText: string,
  images: KakaoImagePayload[],
  imageDetail: "low" | "high" | "auto" = "high",
): Array<
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "low" | "high" | "auto" };
    }
> {
  const userContent: Array<
    | { type: "text"; text: string }
    | {
        type: "image_url";
        image_url: { url: string; detail?: "low" | "high" | "auto" };
      }
  > = [{ type: "text", text: userText }];

  for (const img of images) {
    const mime = normalizeMime(img.mimeType);
    if (!ALLOWED_MIME.has(mime)) continue;
    const b64 = img.dataBase64.replace(/\s/g, "");
    if (!b64) continue;
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${mime};base64,${b64}`,
        detail: imageDetail,
      },
    });
  }
  return userContent;
}

export async function generateKakaoChatWithOpenAI(opts: {
  apiKey: string;
  model?: string;
  mode: KakaoAnalysisMode;
  chatText: string;
  images: KakaoImagePayload[];
  userName?: string;
  relationLabel?: string;
  birthDate?: string;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  calendar?: "solar" | "lunar";
  gender?: string;
  analysisContext?: KakaoAnalysisContext;
  targetName?: string;
  selfBubbleColorHint?: string;
  otherBubbleColorHint?: string;
  relation?: RitualRelation;
}): Promise<string> {
  const model = opts.model?.trim() || "gpt-4o";
  const userText = buildKakaoAnalysisUserPrompt({
    chatText: opts.chatText,
    imageCount: opts.images.length,
    userName: opts.userName,
    relationLabel: opts.relationLabel,
    birthDate: opts.birthDate,
    birthTime: opts.birthTime,
    birthTimeUnknown: opts.birthTimeUnknown,
    calendar: opts.calendar,
    gender: opts.gender,
    analysisContext: opts.analysisContext,
    targetName: opts.targetName,
    selfBubbleColorHint: opts.selfBubbleColorHint,
    otherBubbleColorHint: opts.otherBubbleColorHint,
    relation: opts.relation,
  });

  const system =
    opts.mode === "preview"
      ? KAKAO_PREVIEW_SYSTEM_PROMPT
      : KAKAO_ANALYSIS_SYSTEM_PROMPT;

  /** gpt-4o 계열 출력 상한(약 16k) 초과 시 API 400 → 여유 있게 캡 */
  const max_tokens = opts.mode === "preview" ? 900 : 16_000;
  const temperature = opts.mode === "preview" ? 0.82 : 0.86;

  /**
   * 화자 = 말풍선 색 매칭이 핵심이다. `detail: low`는 채색·경계를 흐려 **ME/PARTNER 구분 실패**로 이어진다.
   * 이미지가 있으면 항상 `high` (유저가 My/Partner를 지정했든 아니든 동일).
   */
  const imageDetail: "low" | "high" | "auto" =
    opts.images.length > 0 ? "high" : "auto";

  const userContent = buildUserContent(userText, opts.images, imageDetail);

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });

  const raw = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  if (!res.ok) {
    const msg = raw.error?.message ?? res.statusText;
    throw new Error(`OpenAI API 오류 (${res.status}): ${msg}`);
  }

  const text = raw.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI 응답에 본문이 없습니다.");
  }
  return sanitizeMaiSunNicknameInReport(
    opts.chatText,
    opts.targetName,
    text,
  );
}

/** @deprecated 단일 모드 호환 */
export async function generateKakaoChatReportWithOpenAI(opts: {
  apiKey: string;
  model?: string;
  chatText: string;
  images: KakaoImagePayload[];
  userName?: string;
  relationLabel?: string;
}): Promise<string> {
  return generateKakaoChatWithOpenAI({ ...opts, mode: "full" });
}
