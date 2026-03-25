import { hasLocale } from "next-intl";

import {
  getNicepayCredentialsFromEnv,
  nicepayApprovePayment,
  verifyNicepayAuthCallbackSignature,
} from "@/lib/nicepayApprove";
import { routing } from "@/i18n/routing";
import {
  RITUAL_FULL_PACKAGE_PORTONE_UNLOCK_KEY,
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
  const pathJson = JSON.stringify(redirectPath);
  const pathAttr = escapeHtml(redirectPath);
  const body = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="0;url=${pathAttr}"/>
<title>결제 완료</title>
<style>
body{margin:0;background:#0f0f12;color:#e8e4dc;font-family:system-ui,sans-serif}
.wrap{padding:1.25rem;max-width:28rem;margin:4vh auto}
a{color:#c9a962}
</style>
</head>
<body>
<div class="wrap">
<script>
(function(){
  var k=${keyJson};
  var path=${pathJson};
  try { sessionStorage.setItem(k, "1"); } catch (e) {}
  try {
    var t = window.top;
    if (t && t !== window) { t.location.replace(path); return; }
  } catch (e1) {}
  try { location.replace(path); } catch (e2) { location.href = path; }
})();
</script>
<p>결제 처리 중입니다. 자동으로 넘어가지 않으면 <a href="${pathAttr}">여기를 눌러 이동</a>하세요.</p>
<noscript><p><a href="${pathAttr}">이동</a></p></noscript>
</div>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** 인앱 웹뷰가 4xx를 빈 화면으로 처리하는 경우가 있어 본문은 항상 보이게 200으로 둠 */
function htmlError(locale: string, message: string): Response {
  const safe = escapeHtml(message);
  const path = `/${locale}/ritual/menu?stay=1`;
  const href = escapeHtml(path);
  const body = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>결제 안내</title>
<style>
body{margin:0;background:#0f0f12;color:#e8e4dc;font-family:system-ui,sans-serif}
.wrap{padding:1.25rem;max-width:28rem;margin:4vh auto}
a{color:#c9a962}
</style>
</head>
<body>
<div class="wrap">
<p>${safe}</p>
<p><a href="${href}">메뉴로 돌아가기</a></p>
</div>
</body>
</html>`;
  return new Response(body, {
    status: 200,
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

  try {
    const cred = getNicepayCredentialsFromEnv();
    if (!cred) {
      return htmlError(
        locale,
        "서버에 NICEPAY_SECRET_KEY / CLIENT_ID 설정이 없습니다.",
      );
    }

    let params: URLSearchParams;
    try {
      const raw = await req.text();
      params = new URLSearchParams(raw);
    } catch {
      return htmlError(locale, "결제 결과를 읽지 못했습니다.");
    }

    const get = (k: string) => params.get(k)?.trim() ?? "";

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
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "결제 처리 중 알 수 없는 오류가 났습니다.";
    return htmlError(locale, msg);
  }
}
