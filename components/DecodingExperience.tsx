"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

  const particles = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const angle = (i / 72) * Math.PI * 2;
        const radiusVmin = 42 + (i % 9) * 3.2;
        const delayS = (i % 16) * 0.05; // 0 ~ 0.75s
        const durS = Math.max(1.8, DECODING_MS / 1000 - delayS); // 항상 4초 안에 수렴
        const spinDeg = (i / 72) * 720 + (i % 7) * 22;
        return {
          id: i,
          angle,
          radiusVmin,
          delayS,
          durS,
          spinDeg,
          size: 1.5 + (i % 4) * 0.85,
        };
      }),
    []
  );

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
      {/* ① 선녀 월아 · 달빛 아래 배경 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/goddess_the_answer.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center bottom",
          opacity: 0.42,
          filter: "blur(16px) saturate(1.08) brightness(0.95)",
        }}
      />
      <div className="lux-moonlight-overlay absolute inset-0" aria-hidden />
      <div className="lux-mist-layer absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]/95"
      />

      {/* ② 팔괘 느낌 기하 링 (느린 회전) */}
      {!reduceMotion ? (
        <>
          <div
            className="decoding-bagua-ring pointer-events-none absolute left-1/2 top-1/2 h-[min(125vmin,96vw)] w-[min(125vmin,96vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.28]"
            style={{
              background: `conic-gradient(
                from 0deg,
                rgba(212,175,55,0.35) 0deg 22.5deg,
                rgba(5,5,5,0.1) 22.5deg 45deg,
                rgba(43,108,176,0.28) 45deg 67.5deg,
                rgba(5,5,5,0.08) 67.5deg 90deg,
                rgba(197,48,48,0.25) 90deg 112.5deg,
                rgba(5,5,5,0.1) 112.5deg 135deg,
                rgba(212,175,55,0.22) 135deg 157.5deg,
                rgba(5,5,5,0.08) 157.5deg 180deg,
                rgba(43,108,176,0.22) 180deg 202.5deg,
                rgba(5,5,5,0.1) 202.5deg 225deg,
                rgba(197,48,48,0.2) 225deg 247.5deg,
                rgba(5,5,5,0.08) 247.5deg 270deg,
                rgba(212,175,55,0.3) 270deg 292.5deg,
                rgba(5,5,5,0.1) 292.5deg 315deg,
                rgba(43,108,176,0.25) 315deg 337.5deg,
                rgba(5,5,5,0.08) 337.5deg 360deg
              )`,
              mixBlendMode: "screen",
              boxShadow:
                "inset 0 0 60px rgba(212,175,55,0.12), 0 0 80px rgba(43,108,176,0.08)",
            }}
          />
          <div
            className="decoding-bagua-inner pointer-events-none absolute left-1/2 top-1/2 h-[min(95vmin,78vw)] w-[min(95vmin,78vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-danchung-gold/25 opacity-40"
            style={{
              background:
                "repeating-conic-gradient(from 22.5deg, rgba(212,175,55,0.15) 0deg 11.25deg, transparent 11.25deg 22.5deg)",
              mixBlendMode: "overlay",
            }}
          />
        </>
      ) : null}

      {/* ③ 단청 만화경 (천천히 겹침) */}
      {!reduceMotion ? (
        <>
          <div
            className="decoding-kaleido-a absolute left-1/2 top-1/2 opacity-[0.2]"
            style={{
              width: "230vmin",
              height: "230vmin",
              marginLeft: "-115vmin",
              marginTop: "-115vmin",
              backgroundImage: "url('/pattern_danchung.jpg')",
              backgroundSize: "440px",
              backgroundRepeat: "repeat",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="decoding-kaleido-b absolute left-1/2 top-1/2 opacity-[0.16]"
            style={{
              width: "210vmin",
              height: "210vmin",
              marginLeft: "-105vmin",
              marginTop: "-105vmin",
              backgroundImage: "url('/pattern_danchung.jpg')",
              backgroundSize: "380px",
              backgroundRepeat: "repeat",
              mixBlendMode: "color-dodge",
              filter: "hue-rotate(18deg) saturate(1.15)",
            }}
          />
          <div
            className="decoding-kaleido-c absolute left-1/2 top-1/2 opacity-[0.22]"
            style={{
              width: "175vmin",
              height: "175vmin",
              marginLeft: "-87.5vmin",
              marginTop: "-87.5vmin",
              background:
                "conic-gradient(from 0deg, rgba(197,48,48,0.28), rgba(43,108,176,0.28), rgba(212,175,55,0.35), rgba(197,48,48,0.28))",
              mixBlendMode: "overlay",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: "url('/pattern_danchung.jpg')",
            backgroundSize: "280px",
            backgroundRepeat: "repeat",
          }}
        />
      )}

      {/* ④ 블랙홀형 데이터 입자 */}
      {!reduceMotion ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(70vmin,70%)] w-[min(70vmin,70%)] rounded-full decoding-blackhole-core"
            style={{
              background:
                "radial-gradient(circle, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.62) 38%, transparent 72%)",
              boxShadow:
                "inset 0 0 160px rgba(212,175,55,0.08), inset 0 0 90px rgba(43,108,176,0.05)",
            }}
          />
          <div className="absolute inset-0" aria-hidden>
            {particles.map((p) => {
              const tx = Math.cos(p.angle) * p.radiusVmin;
              const ty = Math.sin(p.angle) * p.radiusVmin;
              return (
                <span
                  key={p.id}
                  className="decoding-particle absolute rounded-full"
                  style={
                    {
                      width: p.size,
                      height: p.size,
                      left: "50%",
                      top: "50%",
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      "--tx": `${tx}vmin`,
                      "--ty": `${ty}vmin`,
                      "--delay": `${p.delayS}s`,
                      "--dur": `${p.durS}s`,
                      "--spin": `${p.spinDeg}deg`,
                      background:
                        "radial-gradient(circle, rgba(255,252,230,1) 0%, rgba(212,175,55,0.60) 40%, rgba(43,108,176,0.25) 68%, transparent 100%)",
                      boxShadow:
                        "0 0 14px rgba(212,175,55,0.65), 0 0 26px rgba(43,108,176,0.25)",
                    } as CSSProperties
                  }
                />
              );
            })}
          </div>
        </>
      ) : null}

      {/* 비네팅 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 48%, transparent 0%, rgba(5,5,5,0.25) 42%, rgba(5,5,5,0.88) 100%)",
        }}
      />

      {/* 중앙 카피 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
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
      <div className="pointer-events-none absolute left-1/2 bottom-10 z-10 w-[min(520px,92vw)] -translate-x-1/2 px-6">
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
