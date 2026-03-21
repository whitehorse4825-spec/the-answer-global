"use client";

import type { RitualProductId } from "@/lib/ritualStorage";
import { RITUAL_PRICES } from "@/lib/ritualStorage";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        opts: Record<string, unknown>,
      ) => Promise<void>;
    };
  }
}

const TOSS_SCRIPT = "https://js.tosspayments.com/v1/payment";

function loadTossScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.TossPayments) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = TOSS_SCRIPT;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("TossPayments script failed"));
    document.head.appendChild(el);
  });
}

export type TossPayOptions = {
  product: RitualProductId;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerKey?: string;
};

/**
 * 토스페이 결제 요청. `NEXT_PUBLIC_TOSS_CLIENT_KEY` 없으면 개발용 시뮬레이션만 수행.
 */
export async function requestTossPayment(opts: TossPayOptions): Promise<void> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
  const amount = RITUAL_PRICES[opts.product];
  const orderId = `ritual_${opts.product}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  if (!clientKey) {
    const ok = window.confirm(
      `[개발 모드] 토스 클라이언트 키가 없습니다.\n${amount.toLocaleString("ko-KR")}원 결제를 시뮬레이션할까요?`,
    );
    if (!ok) throw new Error("결제 취소");
    const url = new URL(opts.successUrl, window.location.origin);
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("amount", String(amount));
    url.searchParams.set("mock", "1");
    window.location.href = url.toString();
    return;
  }

  await loadTossScript();
  const TossPayments = window.TossPayments;
  if (!TossPayments) {
    throw new Error("TossPayments unavailable");
  }

  const toss = TossPayments(clientKey);
  await toss.requestPayment("카드", {
    amount,
    orderId,
    orderName: opts.orderName,
    successUrl: opts.successUrl,
    failUrl: opts.failUrl,
    customerName: opts.customerKey ?? "guest",
  });
}
