"use client";

import { resolveNicepaySdkUrl } from "@/lib/nicepayEndpoints";
import { FULL_PACKAGE_PRICE_WON } from "@/lib/ritualStorage";

export const RITUAL_FULL_PACKAGE_GOODS_NAME = "인연 종결 풀패키지";

/**
 * 통합결제창 기본값 `cardAndEasyPay`(카드+간편결제).
 * 카드 단독만 필요할 때만 `NEXT_PUBLIC_NICEPAY_PAY_METHOD=card` (구 REQUEST_METHOD는 읽지 않음 — 실수로 card 박혀도 통합 유지)
 * @see 나이스 매뉴얼 payment-window-server.md
 */
function resolveNicepayRequestMethod(): string {
  const v = process.env.NEXT_PUBLIC_NICEPAY_PAY_METHOD?.trim();
  if (!v) return "cardAndEasyPay";
  return v;
}

export type NicepayFullPackageRedirectTarget =
  | "menu"
  | "kakao"
  | "tarot"
  | "persona";

export type RequestNicepayFullPackageOptions = {
  locale: string;
  buyerName: string;
  buyerTel?: string;
  buyerEmail?: string;
  /** 결제 완료 후 이동 경로 (서버 승인·unlock 후) */
  redirectTarget?: NicepayFullPackageRedirectTarget;
  sdkBaseOverride?: string | null;
};

export type RequestNicepayFullPackageResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message?: string };

function getClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID?.trim();
  return id || null;
}

export function buildNicepayReturnUrl(
  locale: string,
  dest: NicepayFullPackageRedirectTarget = "menu",
): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const u = new URL("/api/payment/nicepay/return", origin || "http://localhost");
  u.searchParams.set("locale", locale);
  if (dest !== "menu") u.searchParams.set("dest", dest);
  return u.toString();
}

function waitForAuthniceReady(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      if (window.AUTHNICE?.requestPay) {
        resolve();
        return;
      }
      if (Date.now() - t0 > timeoutMs) {
        reject(
          new Error(
            "나이스페이 SDK(AUTHNICE)가 준비되지 않았습니다. 스크립트 URL·차단기(광고)·네트워크를 확인해 주세요.",
          ),
        );
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function loadNicepayScriptOnce(sdkFolderUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window"));
      return;
    }
    if (window.AUTHNICE?.requestPay) {
      resolve();
      return;
    }
    const sid = "nicepay-sdk-js";
    const src = sdkFolderUrl.endsWith("/") ? sdkFolderUrl : `${sdkFolderUrl}/`;
    const existing = document.getElementById(sid) as HTMLScriptElement | null;
    if (existing) {
      void waitForAuthniceReady(15_000).then(resolve).catch(reject);
      return;
    }
    const s = document.createElement("script");
    s.id = sid;
    s.src = src;
    s.async = true;
    s.onload = () => {
      void waitForAuthniceReady(15_000).then(resolve).catch(reject);
    };
    s.onerror = () =>
      reject(new Error("나이스페이 결제 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(s);
  });
}

/**
 * 인연 종결 풀패키지 — 나이스페이 Start(결제창) 후 returnUrl POST → 서버 승인.
 * 성공 시 전체 페이지가 return으로 이동하므로 Promise는 창 오픈 직전까지만 반환.
 */
export async function requestNicepayFullPackagePayment(
  opts: RequestNicepayFullPackageOptions,
): Promise<RequestNicepayFullPackageResult> {
  const clientId = getClientId();
  if (!clientId) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_NICEPAY_CLIENT_ID가 설정되지 않았습니다.",
    };
  }

  const orderId = `fullpkg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const sdkUrl = resolveNicepaySdkUrl(
    clientId,
    opts.sdkBaseOverride ?? process.env.NEXT_PUBLIC_NICEPAY_SDK_BASE?.trim(),
  );

  try {
    await loadNicepayScriptOnce(sdkUrl);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "SDK 로드 실패",
    };
  }

  const AUTHNICE = window.AUTHNICE;
  if (!AUTHNICE?.requestPay) {
    return { ok: false, message: "나이스페이 SDK가 준비되지 않았습니다." };
  }

  const returnUrl = buildNicepayReturnUrl(
    opts.locale,
    opts.redirectTarget ?? "menu",
  );
  const payMethod = resolveNicepayRequestMethod();

  return await new Promise<RequestNicepayFullPackageResult>((resolve) => {
    let settled = false;
    const finish = (r: RequestNicepayFullPackageResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    try {
      AUTHNICE.requestPay({
        clientId,
        method: payMethod,
        orderId,
        amount: FULL_PACKAGE_PRICE_WON,
        goodsName: RITUAL_FULL_PACKAGE_GOODS_NAME,
        returnUrl,
        buyerName: opts.buyerName,
        buyerTel: opts.buyerTel,
        buyerEmail: opts.buyerEmail,
        language: "KO",
        mallReserved: `locale:${opts.locale}`,
        fnError: (err) => {
          const msg =
            typeof err?.errorMsg === "string" && err.errorMsg.trim()
              ? err.errorMsg.trim()
              : "결제가 취소되었거나 시작할 수 없습니다.";
          finish({ ok: false, cancelled: true, message: msg });
        },
      });
    } catch (e) {
      finish({
        ok: false,
        message:
          e instanceof Error
            ? e.message
            : "결제창을 열지 못했습니다. 브라우저 콘솔을 확인해 주세요.",
      });
      return;
    }

    queueMicrotask(() => {
      finish({ ok: true });
    });
  });
}
