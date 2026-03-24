import { NextResponse } from "next/server";

import { getKakaoSessionPaid } from "@/lib/server/kakaoPaymentStore";

/** 무통장 입금 승인 여부(DB) — 새로고침·폴링용 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ error: "session_required" }, { status: 400 });
  }
  const isPaid = await getKakaoSessionPaid(sessionId);
  return NextResponse.json({ isPaid });
}
