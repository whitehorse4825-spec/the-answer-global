"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";

type Props = {
  reduceMotion: boolean;
  /** 입자·환상 주기(ms). 해독 화면은 4000, 카톡 분석 로딩은 더 길게 */
  particleCycleMs?: number;
  /** 무녀 히어로 레이어 투명도 (의식/브리핑과 통일 시 0.1 전후) */
  goddessOpacity?: number;
  goddessBlurPx?: number;
};

/**
 * goddess / 팔괘 / 만화경 / 입자 — DecodingExperience·카톡 분석 로딩 등에서 공유
 */
export default function DecodingVisualBackdrop({
  reduceMotion,
  particleCycleMs = 4000,
  goddessOpacity = 0.42,
  goddessBlurPx = 16,
}: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const angle = (i / 72) * Math.PI * 2;
        const radiusVmin = 42 + (i % 9) * 3.2;
        const delayS = (i % 16) * 0.05;
        const durS = Math.max(1.8, particleCycleMs / 1000 - delayS);
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
    [particleCycleMs]
  );

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/goddess_the_answer.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center bottom",
          opacity: goddessOpacity,
          filter: `blur(${goddessBlurPx}px) saturate(1.08) brightness(0.95)`,
        }}
      />
      <div className="lux-moonlight-overlay absolute inset-0" aria-hidden />
      <div className="lux-mist-layer absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]/95"
      />

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

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 48%, transparent 0%, rgba(5,5,5,0.25) 42%, rgba(5,5,5,0.88) 100%)",
        }}
      />
    </>
  );
}
