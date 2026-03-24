import { NextResponse } from "next/server";

/**
 * 페이액션(PayAction) 등 입금 알림 Webhook 수신용.
 * 배포 후 공개 URL 예: `https://<프로젝트>.vercel.app/api/payment/webhook`
 *
 * TODO: 페이액션 문서에 맞춰 서명 검증·본문 파싱·Supabase `is_paid` 갱신 연동.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: "invalid_json" };
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[payment/webhook] POST received", body);
  }

  /* 페이액션은 성공 시 2xx 기대 — 연동 전에도 200으로 응답해 URL 등록·테스트 가능 */
  return NextResponse.json({ ok: true, receivedAt: new Date().toISOString() });
}

/** 일부 대시보드에서 URL 존재 확인용 */
export async function GET() {
  return NextResponse.json({
    path: "/api/payment/webhook",
    methods: ["POST"],
    note: "PayAction webhook endpoint — POST with JSON body",
  });
}
