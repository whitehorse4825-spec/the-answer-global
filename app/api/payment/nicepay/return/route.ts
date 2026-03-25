import { hasLocale } from "next-intl";

import {
  getNicepayCredentialsFromEnv,
  nicepayApprovePayment,
  verifyNicepayAuthCallbackSignature,
} from "@/lib/nicepayApprove";
import { routing } from "@/i18n/routing";
import {
  RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY,
  RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_COOKIE_NAME,
  FULL_PACKAGE_PRICE_WON,
} from "@/lib/ritualStorage";

export const runtime = "nodejs";
export const maxDuration = 60;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveNicepayRedirect(locale: string, destRaw: string): string {
  const d = destRaw.trim();
  if (d === "kakao" || d === "tarot" || d === "persona") {
    return `/${locale}/ritual/${d}`;
  }
  // 풀패키지(메뉴의 결제 버튼) 완료 후에는 다음 단계로 바로 이동해야 함.
  // `RitualMenu`는 ?stay=1이면 자동 리다이렉트를 막기 때문에 여기서는 stay를 쓰지 않음.
  return `/${locale}/ritual/kakao`;
}

function htmlSuccess(redirectPath: string): Response {
  const keyJson = JSON.stringify(RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY);
  const cookieNameJson = JSON.stringify(
    RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_COOKIE_NAME,
  );
  const pathJson = JSON.stringify(redirectPath);
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  const setCookie = `${RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_COOKIE_NAME}=1; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
  const body = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>결제 완료</title>
</head>
<body>
<script>
(function(){
  var k=${keyJson};
  var cookieName=${cookieNameJson};
  var path=${pathJson};
  try { sessionStorage.setItem(k, "1"); } catch (e) {}
  try { document.cookie = cookieName + "=1; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax"; } catch (e) {}
  location.replace(path);
})();
</script>
<p style="font-family:sans-serif;padding:1.5rem;">결제 처리 중입니다… <a href="${escapeHtml(redirectPath)}">이동</a></p>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": setCookie,
    },
  });
}

function htmlError(locale: string, message: string): Response {
  const safe = escapeHtml(message);
  const path = `/${locale}/ritual/menu?stay=1`;
  const body = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"/><title>결제 안내</title></head>
<body style="font-family:sans-serif;padding:1.5rem;">
<p>${safe}</p>
<p><a href="${escapeHtml(path)}">메뉴로 돌아가기</a></p>
</body>
</html>`;
  return new Response(body, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * 나이스페이 Server 승인 — 인증 완료 후 POST (application/x-www-form-urlencoded)
 */
export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const locRaw = url.searchParams.get("locale")?.trim() || "ko";
  const locale = hasLocale(routing.locales, locRaw) ? locRaw : routing.defaultLocale;
  const destParam = url.searchParams.get("dest")?.trim() ?? "";

  const cred = getNicepayCredentialsFromEnv();
  if (!cred) {
    return htmlError(
      locale,
      "서버에 NICEPAY_SECRET_KEY / CLIENT_ID 설정이 없습니다.",
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return htmlError(locale, "결제 결과를 읽지 못했습니다.");
  }

  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };

  const authResultCode = get("authResultCode");
  if (authResultCode !== "0000") {
    const msg = get("authResultMsg") || "카드 인증에 실패했습니다.";
    return htmlError(locale, msg);
  }

  const authToken = get("authToken");
  const clientIdFromNice = get("clientId");
  const orderId = get("orderId");
  const amountStr = get("amount");
  const signature = get("signature");
  const tid = get("tid");

  if (!authToken || !orderId || !amountStr || !signature || !tid) {
    return htmlError(locale, "인증 응답 필수 값이 없습니다.");
  }

  if (!orderId.startsWith("fullpkg_")) {
    return htmlError(locale, "주문 정보가 올바르지 않습니다.");
  }

  if (clientIdFromNice !== cred.clientId) {
    return htmlError(locale, "가맹점 식별 정보가 일치하지 않습니다.");
  }

  const amountNum = Number(amountStr);
  if (amountNum !== FULL_PACKAGE_PRICE_WON) {
    return htmlError(locale, "결제 금액이 주문과 일치하지 않습니다.");
  }

  const sigOk = verifyNicepayAuthCallbackSignature({
    authToken,
    clientId: cred.clientId,
    amount: amountStr,
    receivedSignature: signature,
    secretKey: cred.secretKey,
  });
  if (!sigOk) {
    return htmlError(locale, "인증 위변조 검증에 실패했습니다.");
  }

  const approved = await nicepayApprovePayment({
    tid,
    amount: amountNum,
    clientId: cred.clientId,
    secretKey: cred.secretKey,
    apiBaseOverride: cred.apiBaseOverride,
  });

  if (!approved.ok) {
    return htmlError(locale, approved.message);
  }

  if (approved.orderId !== orderId) {
    return htmlError(locale, "승인된 주문 번호가 일치하지 않습니다.");
  }

  const redirectPath = resolveNicepayRedirect(locale, destParam);
  return htmlSuccess(redirectPath);
}
