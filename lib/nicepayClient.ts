"use client";

/**
 * 나이스페이 **Server 승인 모델 + JS SDK** (`AUTHNICE.requestPay`).
 * 구형 ActiveX/MID·Amt hidden form 연동은 사용하지 않으며, 폼 input 전수 점검 대상도 아님.
 * @see https://github.com/nicepayments/nicepay-manual/blob/main/api/payment-window-server.md
 */
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

/**
 * PG·가맹점 관리자에 등록한 **공개 도메인**과 returnUrl origin을 맞출 때 사용.
 * (예: 항상 `https://www.example.com` 으로만 받도록.)
 * 비우면 `window.location.origin` 사용.
 */
function resolveNicepayReturnOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_NICEPAY_RETURN_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const normalized = raw.replace(/\/+$/, "");
    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalized);
    const withScheme = hasScheme
      ? normalized
      : normalized.startsWith("localhost") ||
          /^127(\.\d{1,3}){3}(:\d+)?$/.test(normalized)
        ? `http://${normalized}`
        : `https://${normalized}`;
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function validateReturnUrl(returnUrl: string): string | null {
  try {
    const u = new URL(returnUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    const path = u.pathname.replace(/\/$/, "") || "/";
    if (!path.endsWith("/api/payment/nicepay/return")) return null;
    if (!u.searchParams.get("locale")?.trim()) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function buildNicepayReturnUrl(
  locale: string,
  dest: NicepayFullPackageRedirectTarget = "menu",
): string {
  const envOrigin = typeof window !== "undefined" ? resolveNicepayReturnOrigin() : null;
  const origin =
    envOrigin ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "");
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
 * 결제 버튼 직전에 호출해 두면 첫 클릭 시 `await` 구간이 짧아져
 * 팝업/통합창이 사용자 제스처로 인식될 가능성이 높아집니다.
 */
export function prefetchNicepaySdk(): void {
  if (typeof window === "undefined" || window.self !== window.top) return;
  const clientId = getClientId();
  if (!clientId) return;
  const sdkUrl = resolveNicepaySdkUrl(
    clientId,
    process.env.NEXT_PUBLIC_NICEPAY_SDK_BASE?.trim(),
  );
  void loadNicepayScriptOnce(sdkUrl).catch(() => {});
}

/**
 * 인연 종결 풀패키지 — 나이스페이 Start(결제창) 후 returnUrl POST → 서버 승인.
 * 성공 시 전체 페이지가 return으로 이동하므로 Promise는 창 오픈 직전까지만 반환.
 */
export async function requestNicepayFullPackagePayment(
  opts: RequestNicepayFullPackageOptions,
): Promise<RequestNicepayFullPackageResult> {
  if (typeof window !== "undefined" && window.self !== window.top) {
    return {
      ok: false,
      message:
        "결제는 페이지가 최상위 창에서 열려 있어야 합니다. Cursor/미리보기·인앱 브라우저·iframe이면 카카오 인증 단계에서 오류가 날 수 있습니다. Chrome·Edge·Safari에서 localhost 또는 배포 URL을 직접 여세요.",
    };
  }

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
  const returnUrlOk = validateReturnUrl(returnUrl);
  if (!returnUrlOk) {
    return {
      ok: false,
      message:
        "결제 return URL이 올바르지 않습니다. NEXT_PUBLIC_NICEPAY_RETURN_ORIGIN(또는 SITE_URL)과 접속 도메인을 PG 등록 도메인과 맞추고, locale이 빠지지 않았는지 확인해 주세요.",
    };
  }

  const payMethod = resolveNicepayRequestMethod();

  /** rAF/추가 await 없이 바로 호출 — 사용자 클릭과 같은 태스크에 최대한 가깝게 두어 통합창 차단을 줄임 */
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
        returnUrl: returnUrlOk,
        buyerName: opts.buyerName,
        buyerTel: opts.buyerTel,
        buyerEmail: opts.buyerEmail,
        language: "KO",
        returnCharSet: "utf-8",
        mallReserved: `locale:${opts.locale}`,
        zIdxHigher: true,
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
