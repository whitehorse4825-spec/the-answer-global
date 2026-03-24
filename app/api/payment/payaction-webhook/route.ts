import { NextResponse } from "next/server";

import {
  resolvePayActionWebhookBySessionId,
  resolvePayActionWebhookMatch,
} from "@/lib/server/kakaoPaymentStore";
import {
  parsePayActionAmount,
  parsePayActionSender,
  parsePayActionSenderAndAmount,
  parsePayActionSessionId,
  verifyPayActionWebhookSecret,
} from "@/lib/server/payactionWebhookParse";

/**
 * 페이액션 입금 알림 — `POST /api/payment/payaction-webhook`
 *
 * 우선순위:
 * 1) `sessionId`(또는 orderId 등) 있음 → **해당 행만** is_paid 처리 (현재 상담 1:1)
 * 2) 없으면 sender + amount 로 is_pending 행 매칭 (레거시)
 */
export async function POST(req: Request) {
  if (!verifyPayActionWebhookSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    const text = await req.text();
    raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = parsePayActionSessionId(raw);
  const senderOpt = parsePayActionSender(raw) || undefined;
  const amountOpt = parsePayActionAmount(raw) ?? undefined;

  if (sessionId) {
    const bySession = await resolvePayActionWebhookBySessionId(sessionId, {
      amountWon: amountOpt,
      sender: senderOpt,
    });

    if (process.env.NODE_ENV === "development") {
      console.info("[payaction-webhook] bySession", sessionId, bySession);
    }

    if (!bySession.ok && bySession.reason !== "already_paid") {
      return NextResponse.json({
        ok: false,
        mode: "sessionId",
        sessionId,
        reason: bySession.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "sessionId",
      sessionId,
      reason: bySession.reason,
    });
  }

  const parsed = parsePayActionSenderAndAmount(raw);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "session_or_sender_amount_missing",
        hint: "sessionId 권장. 없으면 sender + amount (KRW)",
      },
      { status: 400 },
    );
  }

  const result = await resolvePayActionWebhookMatch(
    parsed.sender,
    parsed.amount,
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[payaction-webhook] bySenderAmount", parsed, result);
  }

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      mode: "senderAmount",
      reason: result.reason,
      received: parsed,
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "senderAmount",
    sessionId: result.sessionId,
    matched: parsed,
  });
}

export async function GET() {
  return NextResponse.json({
    path: "/api/payment/payaction-webhook",
    methods: ["POST"],
    priority: [
      "1) sessionId (또는 orderId, merchant_uid …) → 해당 세션만 승인",
      "2) sender + amount → 대기 중인 행 매칭",
    ],
    headers: {
      optional:
        "PAYACTION_WEBHOOK_SECRET 일치 시 x-payaction-secret 또는 Authorization: Bearer",
    },
  });
}
