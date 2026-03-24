import { NextResponse } from "next/server";

import { setKakaoSessionPaid } from "@/lib/server/kakaoPaymentStore";

type Body = { sessionId?: string };

/**
 * 관리자 승인 — `?admin=true` UI에서만 호출.
 * 별도 토큰 없음(운영 시 네트워크·IP 제한 권장).
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ error: "session_required" }, { status: 400 });
  }

  const ok = await setKakaoSessionPaid(sessionId, true);
  if (!ok) {
    return NextResponse.json(
      { error: "persist_failed", message: "DB 업데이트에 실패했습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
