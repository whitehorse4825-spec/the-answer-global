"use client";

import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: string;
};

/**
 * 하단 CTA에서만 열리는 결제 수단 선택 — 실제 PG 연동 전 팝업 동선
 */
export default function PaymentCheckoutModal({
  open,
  onClose,
  locale,
}: Props) {
  const t = useTranslations("Result");

  if (!open) return null;

  const openCheckout = (provider: "toss" | "kakao") => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const url = `${origin}/${locale}/result?premium=1&provider=${provider}`;
    window.open(
      url,
      "wola-payment",
      "noopener,noreferrer,width=520,height=720,scrollbars=yes",
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="lux-payment-modal-panel w-full max-w-md rounded-t-2xl border border-danchung-gold/35 bg-[#060a14]/96 p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="payment-modal-title"
          className="text-center font-serif text-lg font-semibold tracking-wide text-[#FFF8E7]"
        >
          {t("paymentModalTitle")}
        </h2>
        <p className="mt-2 text-center text-xs leading-relaxed text-white/55">
          {t("paymentModalNote")}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="lux-payment-modal-btn lux-payment-modal-btn--toss"
            onClick={() => openCheckout("toss")}
          >
            {t("paymentModalToss")}
          </button>
          <button
            type="button"
            className="lux-payment-modal-btn lux-payment-modal-btn--kakao"
            onClick={() => openCheckout("kakao")}
          >
            {t("paymentModalKakao")}
          </button>
        </div>
        <button
          type="button"
          className="mt-5 w-full rounded-lg border border-white/15 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
          onClick={onClose}
        >
          {t("paymentModalClose")}
        </button>
      </div>
    </div>
  );
}
