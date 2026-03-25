import {
  nicepayWebhookOkResponse,
  verifyNicepayWebhookFullPackagePaid,
  type NicepayWebhookPayload,
} from "@/lib/nicepayWebhook";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * 나이스페이 웹훅(URL 통보) — 본문 JSON 검증 후 반드시 HTTP 200 + body `OK`(text/html).
 * @see https://github.com/nicepayments/nicepay-manual/blob/main/api/hook.md
 *
 * 관리자 등록 URL 예: `https://<도메인>/api/payment/nicepay/webhook`
 *
 * 등록·URL 검증 시 GET/HEAD로 두드리는 경우가 있어 동일하게 200+OK를 반환합니다.
 */
export function GET(): Response {
  return nicepayWebhookOkResponse();
}

/** URL 존재 확인용 — 본문 없이 200 */
export function HEAD(): Response {
  return new Response(null, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: Request): Promise<Response> {
  let payload: NicepayWebhookPayload;
  try {
    const text = await req.text();
    payload = text ? (JSON.parse(text) as NicepayWebhookPayload) : {};
  } catch {
    payload = {};
  }

  const checked = verifyNicepayWebhookFullPackagePaid(payload);
  if (checked.ok) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.info("[nicepay/webhook] full package paid ack", {
        orderId: payload.orderId,
        tid: payload.tid,
        payMethod: payload.payMethod,
      });
    }
    // TODO: Supabase 등 서버 영수증·중복 방지 저장
  } else if (
    checked.reason !== "not_paid_success" &&
    checked.reason !== "order_not_fullpkg"
  ) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[nicepay/webhook] verify skip or fail", checked.reason, {
        orderId: payload.orderId,
        status: payload.status,
        resultCode: payload.resultCode,
      });
    }
  }

  return nicepayWebhookOkResponse();
}
