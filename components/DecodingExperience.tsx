"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DecodingVisualBackdrop from "@/components/decoding/DecodingVisualBackdrop";

/** 연출 길이 고정 4초 */
const DECODING_MS = 4000;
/** 빛 폭발 시작 (100% 표시 후 · 약 0.42s 뒤 4초 시점에 라우팅) */
const BURST_AT_MS = 3680;

type Props = {
  locale: string;
};

export default function DecodingExperience({ locale }: Props) {
  const router = useRouter();
  const t = useTranslations("Decoding");
  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const [progress, setProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const [layerIn, setLayerIn] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      queueMicrotask(() => setLayerIn(true));
      return;
    }
    const id = requestAnimationFrame(() => setLayerIn(true));
    return () => cancelAnimationFrame(id);
  }, [reduceMotion]);

  /* 4초 동안 0% -> 100% 부드러운 로딩 바 */
  useEffect(() => {
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / DECODING_MS) * 100);
      setProgress(Math.round(pct));
      if (elapsed < DECODING_MS) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  /* 종료 직전 빛 폭발 */
  useEffect(() => {
    const id = window.setTimeout(() => setBurst(true), BURST_AT_MS);
    return () => window.clearTimeout(id);
  }, []);

  /* 정확히 4초 후 결과 */
  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace(`/${locale}/result`);
    }, DECODING_MS);
    return () => window.clearTimeout(id);
  }, [locale, router]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050505]">
      <DecodingVisualBackdrop reduceMotion={reduceMotion} particleCycleMs={DECODING_MS} />

      {/* 중앙 카피 — 입장 시 페이드로 이전 화면과 자연스럽게 연결 */}
      <div
        className={[
          "relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ease-out",
          layerIn ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <p
          className={[
            "max-w-[22rem] sm:max-w-xl font-[300] leading-relaxed tracking-wide",
            "text-[clamp(1rem,3.8vw,1.35rem)]",
            reduceMotion ? "text-[#FFFDD0]/90" : "decoding-text-cycle text-[#FFFDD0]",
          ].join(" ")}
          style={{
            textShadow:
              "0 0 28px rgba(212,175,55,0.42), 0 0 72px rgba(43,108,176,0.22), 0 0 96px rgba(197,48,48,0.12)",
            WebkitTextStroke: "0.35px rgba(212,175,55,0.55)",
          }}
        >
          {t("status")}
        </p>
      </div>

      {/* 하단 골드 로딩 바 */}
      <div
        className={[
          "pointer-events-none absolute left-1/2 bottom-10 z-10 w-[min(520px,92vw)] -translate-x-1/2 px-6 transition-opacity duration-700 ease-out",
          layerIn ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-danchung-gold/35 via-danchung-gold to-danchung-gold/85"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 18px rgba(212,175,55,0.55), 0 0 40px rgba(43,108,176,0.18)",
            }}
          />
        </div>
      </div>

      {/* 빛 폭발 → 4초 시점에 라우팅 */}
      {burst ? (
        <div
          className="decoding-burst-layer fixed inset-0 z-[120] flex items-center justify-center"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(255,252,235,0.9) 10%, rgba(212,175,55,0.65) 26%, rgba(43,108,176,0.34) 46%, rgba(197,48,48,0.18) 64%, transparent 80%)",
            }}
          />
          <div
            className="absolute h-[200vmax] w-[200vmax] rounded-full opacity-90"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0.98), rgba(212,175,55,0.55), rgba(43,108,176,0.48), rgba(197,48,48,0.35), rgba(255,255,255,0.9))",
              filter: "blur(2.6px)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
