"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import DecodingVisualBackdrop from "@/components/decoding/DecodingVisualBackdrop";

type Props = {
  open: boolean;
};

const LINE_KEYS = [
  "kakaoLlmWait0",
  "kakaoLlmWait1",
  "kakaoLlmWait2",
  "kakaoLlmWait3",
  "kakaoLlmWait4",
] as const;

/**
 * 카톡 분석 중 — Decoding 화면과 동일한 비주얼 계열 + 실제 대기 시간에 맞춘 진행 느낌
 */
export default function KakaoAnalysisLoadingOverlay({ open }: Props) {
  const t = useTranslations("Ritual");
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const [layerIn, setLayerIn] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setLayerIn(false);
        setProgress(0);
        setLineIdx(0);
      });
      return;
    }
    if (reduceMotion) {
      queueMicrotask(() => setLayerIn(true));
    } else {
      const id = requestAnimationFrame(() => setLayerIn(true));
      return () => cancelAnimationFrame(id);
    }
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % LINE_KEYS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [open]);

  /* 천천히 0→~92% 수렴, 완료 시 부모가 unmount 하므로 100%는 선택 */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = performance.now();
    const targetMs = 95_000;
    let raf = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      const asymptotic = 92 * (1 - Math.exp(-elapsed / 28_000));
      const cap = Math.min(92, asymptotic + (elapsed / targetMs) * 8);
      setProgress(Math.round(Math.min(92, cap)));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [open]);

  if (!open) return null;

  const statusLine = t(LINE_KEYS[lineIdx]);

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#050505]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DecodingVisualBackdrop
        reduceMotion={reduceMotion}
        particleCycleMs={14000}
        goddessOpacity={0.1}
        goddessBlurPx={14}
      />

      <div
        className={[
          "relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center transition-opacity duration-700 ease-out",
          layerIn ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <p
          key={lineIdx}
          className={[
            "max-w-[22rem] sm:max-w-xl font-[300] leading-relaxed tracking-wide",
            "text-[clamp(1rem,3.8vw,1.28rem)] transition-opacity duration-500",
            reduceMotion ? "text-[#FFFDD0]/90" : "decoding-text-cycle text-[#FFFDD0]",
          ].join(" ")}
          style={{
            textShadow:
              "0 0 28px rgba(212,175,55,0.42), 0 0 72px rgba(43,108,176,0.22), 0 0 96px rgba(197,48,48,0.12)",
            WebkitTextStroke: "0.35px rgba(212,175,55,0.55)",
          }}
        >
          {statusLine}
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-danchung-gold/65">
          {t("kakaoLlmWaitSub")}
        </p>
      </div>

      <div
        className={[
          "pointer-events-none absolute left-1/2 bottom-10 z-10 w-[min(520px,92vw)] -translate-x-1/2 px-6 transition-opacity duration-700 ease-out",
          layerIn ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-danchung-gold/35 via-danchung-gold to-danchung-gold/85 transition-[width] duration-300 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(43,108,176,0.18)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
