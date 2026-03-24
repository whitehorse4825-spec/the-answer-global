/**
 * 페이액션 실제 페이로드 필드명은 대시보드/문서에 맞게 조정.
 * sessionId 가 오면 **해당 상담 세션만** 승인 (sender/amount 는 선택 검증).
 */
export function parsePayActionSessionId(
  body: Record<string, unknown>,
): string | null {
  const raw =
    body.sessionId ??
    body.session_id ??
    body.orderId ??
    body.order_id ??
    body.merchant_uid ??
    body.merchantUid ??
    body.customId ??
    body.custom_id ??
    body.kakaoSessionId ??
    body.depositSessionId;
  const s = String(raw ?? "").trim();
  return s || null;
}

export function parsePayActionSender(body: Record<string, unknown>): string {
  const senderRaw =
    body.sender ??
    body.depositor ??
    body.depositorName ??
    body.name ??
    body.inquirerName ??
    body.입금자 ??
    body.customerName;
  return String(senderRaw ?? "").trim();
}

export function parsePayActionAmount(
  body: Record<string, unknown>,
): number | null {
  const amountRaw =
    body.amount ??
    body.paymentAmount ??
    body.price ??
    body.money ??
    body.입금액 ??
    body.depositAmount;

  if (typeof amountRaw === "number" && Number.isFinite(amountRaw)) {
    return Math.round(amountRaw);
  }
  const digits = String(amountRaw ?? "").replace(/[^\d]/g, "");
  const amount = parseInt(digits, 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/** sender + amount 둘 다 있을 때만 (이름·금액 매칭 모드) */
export function parsePayActionSenderAndAmount(
  body: Record<string, unknown>,
): { sender: string; amount: number } | null {
  const sender = parsePayActionSender(body);
  const amount = parsePayActionAmount(body);
  if (!sender || amount == null) return null;
  return { sender, amount };
}

export function verifyPayActionWebhookSecret(req: Request): boolean {
  const expected = process.env.PAYACTION_WEBHOOK_SECRET?.trim();
  if (!expected) return true;

  const header =
    req.headers.get("x-payaction-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      ?.trim();

  return Boolean(header && header === expected);
}
