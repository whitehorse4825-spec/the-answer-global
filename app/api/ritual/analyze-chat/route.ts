import { NextResponse } from "next/server";

function hashLen(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function POST(req: Request) {
  let body: { text?: string; hasImage?: boolean };
  try {
    body = (await req.json()) as { text?: string; hasImage?: boolean };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text = (body.text ?? "").trim().slice(0, 50_000);
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const seed = hashLen(text);
  const attachment = body.hasImage ? 7 : 0;
  const anxious = 42 + (seed % 35) + attachment;
  const avoidant = 100 - anxious + (seed % 8);
  const warmth = 35 + ((seed >> 3) % 50);
  const report = `【애착 성향 지표】
· 불안형 추정: ${Math.min(99, anxious)}%
· 회피형 추정: ${Math.min(99, avoidant)}%
· 정서적 온기(호감 신호): ${Math.min(99, warmth)}%

【무녀의 한마디】
말줄기 안에 '기다림'과 '서두름'이 동시에 엉켜 있구나. 짧은 답이 반복되면 마음이 닫힌 게 아니라 숨 고르는 중일 수도 있고, 이모티콘 밀도가 높으면 말로 못 하는 애정이 마음의 빗장 틈으로 새는 것일 수도 있다.
${body.hasImage ? "\n(캡처 이미지도 함께 올렸구나. 글자와 톤을 겹쳐 보면 숫자가 조금 더 기운을 탄다.)\n" : ""}
【실무 비방】
한 번에 여러 감정을 쏟지 말고, 한 줄 질문 하나·공감 한 줄로 호흡을 맞춰라. 답이 늦을수록 네 문장은 더 짧게, 마침표는 아껴 써라.

※ 데모 응답입니다. 실서비스에서는 LLM·OCR을 연동하거라.`;

  return NextResponse.json({ report });
}
