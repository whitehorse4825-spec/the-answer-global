"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { mergeEmotionKeywords } from "@/lib/kakaoReportSignals";
import { buildPersonalizedEmotionBars } from "@/lib/kakaoEmotionBars";
import { DELIVERED_BAR_DEEP_ANALYSIS } from "@/lib/reunionDeliveredReportKo";

import {
  BrainMapSvg,
  EmotionBarChartPremium,
} from "@/components/ritual/premiumReportVisuals";

type Props = {
  emotionKeywords: string[];
  chatLogSnippet: string;
  variant?: "full" | "teaser";
};

export default function KakaoStage1ReportVisuals({
  emotionKeywords,
  chatLogSnippet,
  variant = "full",
}: Props) {
  const t = useTranslations("Ritual");
  const [deepOpen, setDeepOpen] = useState(true);

  const displayKeywords = useMemo(
    () => mergeEmotionKeywords(emotionKeywords, chatLogSnippet, 3),
    [emotionKeywords, chatLogSnippet],
  );

  const bars = useMemo(
    () => buildPersonalizedEmotionBars(displayKeywords, chatLogSnippet),
    [displayKeywords, chatLogSnippet],
  );

  const topThreeByHeight = useMemo(() => {
    return [...bars].sort((a, b) => b.heightPct - a.heightPct).slice(0, 3);
  }, [bars]);

  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#1a0f16] via-[#0d080c] to-[#050304] shadow-[0_0_48px_rgba(168,85,247,0.14)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-3">
        <h3 className="kakao-report-heading-text text-left font-bold text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]">
          {t("kakaoStage1VisualsCardTitle")}
        </h3>
        <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-200/90">
          {variant === "full" ? "LIVE" : "PREVIEW"}
        </span>
      </header>

      <div className="space-y-4 px-4 py-4">
        <p className="kakao-report-body-text leading-relaxed text-white/55">
          {t("kakaoStage1VisualsIntro")}
        </p>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
            {t("briefingBrainMapLabel")}
          </p>
          <div className="mt-2">
            <BrainMapSvg />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300/85">
            {t("briefingEmotionGraphLabel")}
          </p>
          <p className="kakao-report-body-text mt-1 font-medium text-[#F1E5AC]/80">
            {t("deliveredEmotionGraphDynamic", {
              k1: displayKeywords[0] ?? "—",
              k2: displayKeywords[1] ?? "—",
              k3: displayKeywords[2] ?? "—",
            })}
          </p>
          <EmotionBarChartPremium
            bars={bars}
            className="mt-2 !border-rose-500/20 !bg-black/50"
          />
        </div>

        <div>
          <p className="kakao-report-heading-text font-semibold text-[#F1E5AC]/95">
            {t("deliveredUnconsciousLeadDynamic")}
          </p>
          <div className="kakao-keyword-row mt-2">
            {displayKeywords.map((kw) => (
              <span
                key={kw}
                className="kakao-keyword-pill kakao-report-body-text rounded-md border border-[#BF953F]/55 bg-[#BF953F]/10 px-2.5 py-1 font-bold text-[#BF953F] shadow-[0_0_12px_rgba(191,149,63,0.2)]"
              >
                [{kw}]
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#BF953F]/30 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="kakao-report-heading-text flex w-full items-center justify-between gap-2 px-3 py-3.5 text-left font-bold text-[#F1E5AC] transition hover:bg-white/[0.04]"
            onClick={() => setDeepOpen((v) => !v)}
            aria-expanded={deepOpen}
          >
            <span className="[text-shadow:0_0_10px_rgba(191,149,63,0.35)]">
              {t("kakaoStage1VisualsDeepAccordion", {
                l1: topThreeByHeight[0]?.label ?? "—",
                l2: topThreeByHeight[1]?.label ?? "—",
                l3: topThreeByHeight[2]?.label ?? "—",
              })}
            </span>
            <span className="text-danchung-gold/80">{deepOpen ? "▲" : "▼"}</span>
          </button>
          {deepOpen ? (
            <div className="space-y-4 border-t border-white/10 px-3 pb-5 pt-3">
              {topThreeByHeight.map((b) => (
                <div
                  key={b.label}
                  className="min-h-[6.5rem] rounded-lg border border-white/10 border-l-2 border-l-rose-400/35 bg-black/45 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                >
                  <p className="kakao-report-heading-text font-bold text-rose-200/90">
                    {b.label} · {b.heightPct}%
                  </p>
                  <p className="kakao-report-body-text mt-3 whitespace-pre-line leading-[2] text-white/80">
                    {DELIVERED_BAR_DEEP_ANALYSIS[b.label] ?? ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className="text-[10px] leading-relaxed text-white/40">
          {t("kakaoStage1VisualsFootnote")}
        </p>
      </div>
    </article>
  );
}
