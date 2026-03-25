"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { requestNicepayFullPackagePayment } from "@/lib/nicepayClient";
import type { RitualProductId } from "@/lib/ritualStorage";
import { RITUAL_PRICES, readRitualIntake } from "@/lib/ritualStorage";

type Props = {
  locale: string;
  product: RitualProductId;
  label: string;
  orderName: string;
  className?: string;
};

export default function RitualPayButton({
  locale,
  product,
  label,
  orderName,
  className = "",
}: Props) {
  void orderName;
  const t = useTranslations("Ritual");
  const [busy, setBusy] = useState(false);
  const amount = RITUAL_PRICES[product];
  const redirectTarget =
    product === "kakao"
      ? "kakao"
      : product === "tarot"
        ? "tarot"
        : "persona";

  const displayLabel = label.includes("{amount}")
    ? label.replace("{amount}", amount.toLocaleString("ko-KR"))
    : label;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (busy) return;
        setBusy(true);
        void (async () => {
          let leaveBusy = false;
          try {
            const intake = readRitualIntake();
            const result = await requestNicepayFullPackagePayment({
              locale,
              buyerName: intake?.userName?.trim() || "고객",
              redirectTarget,
            });
            if (!result.ok) {
              if (!result.cancelled) {
                alert(result.message ?? t("roadmapPortonePayFail"));
              }
              return;
            }
            leaveBusy = true;
          } catch (e) {
            alert(
              `${t("roadmapPortoneLoadError")}${e instanceof Error ? `\n${e.message}` : ""}`,
            );
          } finally {
            if (!leaveBusy) setBusy(false);
          }
        })();
      }}
      className={[
        "w-full rounded-2xl border border-danchung-gold/55 bg-gradient-to-b from-[#e8c96a]/35 to-[#6b4f0a]/40 py-4 text-sm font-black tracking-wide text-[#1a1204] shadow-[0_0_28px_rgba(212,175,55,0.35)] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {busy ? "…" : displayLabel}
    </button>
  );
}
