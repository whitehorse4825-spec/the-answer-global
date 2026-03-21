"use client";

import { useState } from "react";

import type { RitualProductId } from "@/lib/ritualStorage";
import { RITUAL_PRICES } from "@/lib/ritualStorage";
import { requestTossPayment } from "@/lib/tossPaymentClient";

type Props = {
  locale: string;
  product: RitualProductId;
  label: string;
  orderName: string;
};

export default function RitualPayButton({
  locale,
  product,
  label,
  orderName,
}: Props) {
  const [busy, setBusy] = useState(false);
  const amount = RITUAL_PRICES[product];
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const path = `/${locale}/ritual/${product === "kakao" ? "kakao" : product === "tarot" ? "tarot" : "persona"}`;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await requestTossPayment({
            product,
            orderName,
            successUrl: `${base}${path}?paymentSuccess=1`,
            failUrl: `${base}${path}?paymentFail=1`,
          });
        } catch {
          setBusy(false);
        }
      }}
      className="w-full rounded-2xl border border-danchung-gold/55 bg-gradient-to-b from-[#e8c96a]/35 to-[#6b4f0a]/40 py-4 text-sm font-black tracking-wide text-[#1a1204] shadow-[0_0_28px_rgba(212,175,55,0.35)] disabled:opacity-50"
    >
      {busy ? "…" : label.replace("{amount}", amount.toLocaleString("ko-KR"))}
    </button>
  );
}
