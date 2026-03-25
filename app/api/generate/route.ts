import { NextResponse } from "next/server";

/**
 * 카카오 분석 파이프라인 안내.
 * - 시스템·유저 프롬프트: `lib/kakaoChatAnalysisPrompt.ts`
 * - 실제 생성: `POST /api/ritual/analyze-chat`
 *
 * 요청 JSON에 **`targetName`?(string)** 를 넣으면 LLM이 그 값을 상대 호칭으로 쓰고,
 * 없거나 비면 본문에서는 **「이 사람」**, **「상대방」**만 사용하도록 프롬프트에 심어 둔다.
 */
export async function GET() {
  return NextResponse.json({
    promptModule: "lib/kakaoChatAnalysisPrompt.ts",
    analyzeEndpoint: "POST /api/ritual/analyze-chat",
    llmDirectiveKo:
      "애기씨만·엘라·거절 금지. 마이선/마이성. 용어 대괄호 섹션당 1회+무녀 풀이; 로그 인용+타임스탬프·답장 간격(있을 때만)으로 3,000자 스토리텔링.",
    bodyFields: {
      targetName:
        "optional string — 유저 입력 상대 호칭; 없으면 '이 사람'·'상대방' 자동 치환 규칙",
      text: "대화 본문",
      mode: "preview | full",
    },
    payButtonCopyKo:
      "단일 풀패키지(금액: ritualStorage) — NEXT_PUBLIC_RITUAL_FULL_PACKAGE_PAY_URL 또는 무통장 모달",
  });
}
