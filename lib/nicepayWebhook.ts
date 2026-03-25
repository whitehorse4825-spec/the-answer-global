import {
  getNicepayCredentialsFromEnv,
  verifyNicepayPaidResponseSignature,
} from "@/lib/nicepayApprove";
import { FULL_PACKAGE_PRICE_WON } from "@/lib/ritualStorage";

export type NicepayWebhookPayload = {
  resultCode?: string;
  resultMsg?: string;
  tid?: string;
  orderId?: string;
  ediDate?: string;
  signature?: string;
  status?: string;
  payMethod?: string;
  amount?: number;
  goodsName?: string;
  mallReserved?: string | null;
};

/** 나이스 웹훅 정상 응답 — 본문이 정확히 `OK`, Content-Type text/html */
export function nicepayWebhookOkResponse(): Response {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * 웹훅 본문 검증(서명·금액·풀패키지 주문) — 통과 시에만 후속 처리(대사·DB 등)하면 됨.
 * 서명이 없으면 검증 스킵(명세상 일부 건은 미포함 가능).
 */
export function verifyNicepayWebhookFullPackagePaid(
  body: NicepayWebhookPayload,
): { ok: true } | { ok: false; reason: string } {
  const cred = getNicepayCredentialsFromEnv();
  if (!cred) {
    return { ok: false, reason: "missing_nicepay_credentials" };
  }

  const resultCode = String(body.resultCode ?? "");
  const status = String(body.status ?? "");
  if (resultCode !== "0000" || status !== "paid") {
    return { ok: false, reason: "not_paid_success" };
  }

  const orderId = String(body.orderId ?? "");
  if (!orderId.startsWith("fullpkg_")) {
    return { ok: false, reason: "order_not_fullpkg" };
  }

  const amount = Number(body.amount);
  if (amount !== FULL_PACKAGE_PRICE_WON) {
    return { ok: false, reason: "amount_mismatch" };
  }

  const tid = String(body.tid ?? "");
  const ediDate = typeof body.ediDate === "string" ? body.ediDate : "";
  const signature = typeof body.signature === "string" ? body.signature : "";

  if (signature && ediDate) {
    const sigOk = verifyNicepayPaidResponseSignature({
      tid,
      amount,
      ediDate,
      secretKey: cred.secretKey,
      receivedSignature: signature,
    });
    if (!sigOk) {
      return { ok: false, reason: "signature_mismatch" };
    }
  }

  return { ok: true };
}
