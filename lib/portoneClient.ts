"use client";

import {
  EasyPayProvider,
  PaymentPayMethod,
  requestPayment,
} from "@portone/browser-sdk/v2";

import { FULL_PACKAGE_PRICE_WON } from "@/lib/ritualStorage";

/** 브라우저 공개 — 포트원 콘솔 Store ID */
const STORE_ID =
  process.env.NEXT_PUBLIC_PORTONE_STORE_ID?.trim() ??
  "store-bec16329-a127-4021-8408-11a59ff42d27";

/**
 * 결제 채널 키 — 토스페이먼츠 V2 채널 키
 * 콘솔: 연동 관리 → 채널에서 발급된 `channelKey`
 */
const CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY?.trim() ??
  "channel-key-554aec12-cd50-427e-be5a-ea246358573f";

const PRODUCT_NAME = "인연 종결 풀패키지";

/** 모바일은 PG가 리디렉션 방식인 경우가 많아 redirectUrl이 필요함. PC는 반환값(Promise) 방식이 안정적임. */
function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function resolveEasyPayProvider(): (typeof EasyPayProvider)[keyof typeof EasyPayProvider] {
  const raw =
    process.env.NEXT_PUBLIC_PORTONE_EASY_PAY_PROVIDER?.trim().toUpperCase() ??
    "";
  if (raw === "TOSSPAY") return EasyPayProvider.TOSSPAY;
  return EasyPayProvider.KAKAOPAY;
}

export type FullPackagePayOptions = {
  buyerName: string;
  buyerEmail?: string;
  buyerTel?: string;
};

export type FullPackagePaymentResult =
  | { ok: true; paymentId: string }
  | { ok: false; cancelled?: boolean; message?: string };

/**
 * 인연 종결 풀패키지(5만 원) — 포트원 V2 `requestPayment`
 * 서버 검증: API Secret + PortOne 결제 조회 API (별도 라우트에서 처리 권장)
 */
export async function requestFullPackagePortonePayment(
  opts: FullPackagePayOptions,
): Promise<FullPackagePaymentResult> {
  const paymentId = `fullpkg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const search =
    typeof window !== "undefined" ? window.location.search : "";

  const useRedirectUrl =
    typeof window !== "undefined" && isMobileBrowser() && Boolean(origin);

  // 디버깅용(민감정보 아님): 포트원에 전달되는 핵심 식별자 확인
  // - 결제창 오류는 대개 storeId/channelKey/payMethod 불일치에서 발생
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[PortOne] requestPayment", {
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY,
      payMethod: PaymentPayMethod.EASY_PAY,
      easyPayProvider: resolveEasyPayProvider(),
      paymentId,
    });
  }

  // 1) 먼저 EASY_PAY(일체형 통합) 시도
  const rsp = await requestPayment({
    storeId: STORE_ID,
    paymentId,
    orderName: PRODUCT_NAME,
    totalAmount: FULL_PACKAGE_PRICE_WON,
    currency: "KRW",
    channelKey: CHANNEL_KEY,
    payMethod: PaymentPayMethod.EASY_PAY,
    easyPay: {
      easyPayProvider: resolveEasyPayProvider(),
    },
    customer: {
      fullName: opts.buyerName.trim() || "고객",
      email: opts.buyerEmail?.trim() || "guest@theanswer.local",
      phoneNumber: (opts.buyerTel?.trim() || "01000000000").replace(
        /\D/g,
        "",
      ),
    },
    redirectUrl: useRedirectUrl ? `${origin}${pathname}${search}` : undefined,
    locale: "KO_KR",
  });

  if (rsp === undefined) {
    return { ok: false, cancelled: true, message: "결제 창이 닫혔습니다." };
  }

  if (rsp.code) {
    // 채널이 EASY_PAY 자체를 지원하지 않으면( NOT_SUPPORTED_EASYPAY_METHOD ) CARD로 폴백
    if (rsp.code === "NOT_SUPPORTED_EASYPAY_METHOD") {
      const rsp2 = await requestPayment({
        storeId: STORE_ID,
        paymentId,
        orderName: PRODUCT_NAME,
        totalAmount: FULL_PACKAGE_PRICE_WON,
        currency: "KRW",
        channelKey: CHANNEL_KEY,
        payMethod: PaymentPayMethod.CARD,
        customer: {
          fullName: opts.buyerName.trim() || "고객",
          email: opts.buyerEmail?.trim() || "guest@theanswer.local",
          phoneNumber: (opts.buyerTel?.trim() || "01000000000").replace(
            /\D/g,
            "",
          ),
        },
        redirectUrl: useRedirectUrl ? `${origin}${pathname}${search}` : undefined,
        locale: "KO_KR",
      });
      if (rsp2 === undefined) {
        return { ok: false, cancelled: true, message: "결제 창이 닫혔습니다." };
      }
      if (rsp2.code) {
        return { ok: false, message: rsp2.message ?? rsp2.code };
      }
      if (rsp2.paymentId) {
        return { ok: true, paymentId: rsp2.paymentId };
      }
    }

    return { ok: false, message: rsp.message ?? rsp.code };
  }

  if (rsp.paymentId) {
    return { ok: true, paymentId: rsp.paymentId };
  }

  return {
    ok: false,
    message: "결제 응답을 확인할 수 없습니다.",
  };
}

export { STORE_ID, CHANNEL_KEY, PRODUCT_NAME };
