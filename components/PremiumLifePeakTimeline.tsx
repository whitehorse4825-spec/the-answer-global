"use client";

import { useId } from "react";

import type { SajuProfile } from "@/lib/saju";

type Props = {
  daYun: SajuProfile["daYun"];
  title: string;
  subtitle: string;
};

/**
 * 프리미엄 전용 — 인생 전성기 타임라인(대운 흐름) 화려한 그래프
 */
export default function PremiumLifePeakTimeline({
  daYun,
  title,
  subtitle,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rows = daYun.filter((r) => r.ganZhi).slice(0, 8);
  if (rows.length < 2) return null;

  const W = 560;
  const H = 220;
  const pad = { l: 36, r: 28, t: 28, b: 52 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const pts = rows.map((r, i) => {
    const x = pad.l + (i / Math.max(1, rows.length - 1)) * innerW;
    const y = pad.t + innerH - (r.flowScore / 100) * innerH;
    return { x, y, r };
  });

  const pathLine = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const baseY = pad.t + innerH;
  const areaPath = `M ${pts[0]!.x} ${baseY} ${pts.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${pts[pts.length - 1]!.x} ${baseY} Z`;

  const gidArea = `peak-area-${uid}`;
  const gidLine = `peak-line-${uid}`;
  const gidGlow = `peak-glow-${uid}`;

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-danchung-gold/35 bg-gradient-to-br from-[#0c1428]/95 via-[#070b18]/98 to-[#04060e] p-4 shadow-[0_0_48px_rgba(212,175,55,0.12)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.22), transparent 55%)",
        }}
      />
      <div className="relative">
        <div className="font-serif text-sm font-semibold tracking-wide text-danchung-gold sm:text-base">
          {title}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/55 sm:text-xs">
          {subtitle}
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-5 w-full"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={gidArea} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 236, 160, 0.35)" />
              <stop offset="45%" stopColor="rgba(212, 175, 55, 0.2)" />
              <stop offset="100%" stopColor="rgba(43, 108, 176, 0.04)" />
            </linearGradient>
            <linearGradient id={gidLine} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255, 248, 210, 0.95)" />
              <stop offset="40%" stopColor="rgba(212, 175, 55, 1)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.75)" />
            </linearGradient>
            <filter id={gidGlow} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const gy = pad.t + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={pad.l}
                y1={gy}
                x2={W - pad.r}
                y2={gy}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            );
          })}
          <path d={areaPath} fill={`url(#${gidArea})`} opacity="0.95" />
          <path
            d={pathLine}
            fill="none"
            stroke={`url(#${gidLine})`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${gidGlow})`}
            className="lux-line-draw"
          />
          {pts.map((p, i) => (
            <g key={`${p.r.ages}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={6}
                fill="rgba(7,11,24,0.85)"
                stroke="rgba(255,245,200,0.95)"
                strokeWidth="2"
              />
              <circle cx={p.x} cy={p.y} r={2.5} fill="rgba(212,175,55,0.95)" />
              <text
                x={p.x}
                y={H - 18}
                textAnchor="middle"
                fill="rgba(255,253,208,0.88)"
                style={{ fontSize: 9 }}
              >
                {p.r.ages}
              </text>
              <text
                x={p.x}
                y={H - 6}
                textAnchor="middle"
                fill="rgba(212,175,55,0.75)"
                style={{ fontSize: 8 }}
              >
                {p.r.flowScore}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
