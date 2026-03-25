import crypto from "crypto";

import { resolveNicepayApiBase } from "@/lib/nicepayEndpoints";
import { FULL_PACKAGE_PRICE_WON } from "@/lib/ritualStorage";

/** 인증 결과 signature: hex(sha256(authToken + clientId + amount + SecretKey)) */
export function verifyNicepayAuthCallbackSignature(input: {
  authToken: string;
  clientId: string;
  amount: string;
  receivedSignature: string;
  secretKey: string;
}): boolean {
  const plain =
    input.authToken + input.clientId + input.amount + input.secretKey;
  const expected = crypto.createHash("sha256").update(plain).digest("hex");
  return expected.toLowerCase() === input.receivedSignature.toLowerCase();
}

/** 승인 응답 signature: hex(sha256(tid + amount + ediDate + SecretKey)) */
export function verifyNicepayPaidResponseSignature(input: {
  tid: string;
  amount: number;
  ediDate: string;
  secretKey: string;
  receivedSignature: string;
}): boolean {
  const plain =
    input.tid + String(input.amount) + input.ediDate + input.secretKey;
  const expected = crypto.createHash("sha256").update(plain).digest("hex");
  return expected.toLowerCase() === input.receivedSignature.toLowerCase();
}

export type NicepayApproveResult =
  | { ok: true; orderId: string; tid: string; amount: number }
  | { ok: false; message: string };

export async function nicepayApprovePayment(input: {
  tid: string;
  amount: number;
  clientId: string;
  secretKey: string;
  apiBaseOverride?: string | null;
}): Promise<NicepayApproveResult> {
  const apiBase = resolveNicepayApiBase(
    input.clientId,
    input.apiBaseOverride,
  );
  const credentials = Buffer.from(
    `${input.clientId}:${input.secretKey}`,
    "utf8",
  ).toString("base64");

  const res = await fetch(`${apiBase}/v1/payments/${encodeURIComponent(input.tid)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ amount: input.amount }),
  });

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "승인 응답을 해석하지 못했습니다." };
  }

  if (!res.ok) {
    const msg =
      typeof json.resultMsg === "string" ? json.resultMsg : `HTTP ${res.status}`;
    return { ok: false, message: msg };
  }

  const resultCode = String(json.resultCode ?? "");
  const status = String(json.status ?? "");

  if (resultCode !== "0000" || status !== "paid") {
    const msg =
      typeof json.resultMsg === "string"
        ? json.resultMsg
        : "결제 승인에 실패했습니다.";
    return { ok: false, message: msg };
  }

  const tid = String(json.tid ?? input.tid);
  const amt = Number(json.amount);
  const ediDate = typeof json.ediDate === "string" ? json.ediDate : "";
  const sig = typeof json.signature === "string" ? json.signature : "";

  if (sig && ediDate) {
    const sigOk = verifyNicepayPaidResponseSignature({
      tid,
      amount: amt,
      ediDate,
      secretKey: input.secretKey,
      receivedSignature: sig,
    });
    if (!sigOk) {
      return { ok: false, message: "승인 응답 서명 검증에 실패했습니다." };
    }
  }

  if (amt !== FULL_PACKAGE_PRICE_WON) {
    return { ok: false, message: "승인 금액이 주문과 일치하지 않습니다." };
  }

  return {
    ok: true,
    orderId: String(json.orderId ?? ""),
    tid,
    amount: amt,
  };
}

export function getNicepayCredentialsFromEnv(): {
  clientId: string;
  secretKey: string;
  apiBaseOverride: string | undefined;
} | null {
  const secretKey = process.env.NICEPAY_SECRET_KEY?.trim();
  const clientId =
    process.env.NICEPAY_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID?.trim();
  const apiBaseOverride = process.env.NICEPAY_API_BASE?.trim();
  if (!secretKey || !clientId) return null;
  return { clientId, secretKey, apiBaseOverride };
}
