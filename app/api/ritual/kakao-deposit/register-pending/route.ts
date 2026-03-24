import { NextResponse } from "next/server";

import { registerKakaoPendingDeposit } from "@/lib/server/kakaoPaymentStore";

type Body = {
  sessionId?: string;
  depositorName?: string;
  amountWon?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  const depositorName = body.depositorName?.trim() ?? "";
  const amountWon =
    typeof body.amountWon === "number" ? body.amountWon : Number(body.amountWon);

  if (!sessionId || !depositorName) {
    return NextResponse.json(
      { error: "session_and_depositor_required" },
      { status: 400 },
    );
  }

  const ok = await registerKakaoPendingDeposit(
    sessionId,
    depositorName,
    amountWon,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "persist_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
