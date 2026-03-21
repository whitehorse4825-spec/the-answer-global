"use client";

import type { FiveElements } from "@/lib/saju";

const LABELS: { key: keyof FiveElements; label: string; angle: number }[] = [
  { key: "wood", label: "木", angle: -Math.PI / 2 },
  { key: "fire", label: "火", angle: -Math.PI / 2 + (Math.PI * 2) / 5 },
  { key: "earth", label: "土", angle: -Math.PI / 2 + (2 * (Math.PI * 2)) / 5 },
  { key: "metal", label: "金", angle: -Math.PI / 2 + (3 * (Math.PI * 2)) / 5 },
  { key: "water", label: "水", angle: -Math.PI / 2 + (4 * (Math.PI * 2)) / 5 },
];

/**
 * 오행 5각형 레이더 — 수치(0–100)에 따라 꼭짓점 거리가 변함
 * viewBox 여유를 두어 한자·% 라벨이 잘리지 않게 함
 */
export default function FiveElementPentagon({ five }: { five: FiveElements }) {
  /** 넉넉한 viewBox·labelR로 한자·% 라벨이 잘리지 않게 함 */
  const W = 400;
  const cx = W / 2;
  const cy = W / 2;
  const rMax = 72;
  const ringSteps = [0.25, 0.5, 0.75, 1];
  const labelR = rMax + 48;

  const points = LABELS.map(({ key, angle }) => {
    const v = Math.min(100, Math.max(0, five[key])) / 100;
    const r = rMax * v;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, label: LABELS.find((L) => L.key === key)?.label ?? "" };
  });

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="mt-4 w-full overflow-visible px-2 pb-5 sm:px-4">
      <svg
        viewBox={`0 0 ${W} ${W}`}
        className="mx-auto block w-full max-w-[min(100%,400px)] drop-shadow-[0_0_24px_rgba(212,175,55,0.12)]"
        style={{ overflow: "visible" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {ringSteps.map((step) => (
          <polygon
            key={step}
            points={LABELS.map(({ angle }) => {
              const r = rMax * step;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={polyPoints}
          fill="rgba(212,175,55,0.18)"
          stroke="rgba(212,175,55,0.95)"
          strokeWidth="2"
          className="transition-[points] duration-700 ease-out"
        />
        {LABELS.map(({ key, angle, label }) => {
          const vx = five[key];
          const r = rMax * (Math.min(100, Math.max(0, vx)) / 100);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          return (
            <g key={key}>
              <circle cx={x} cy={y} r={3.2} fill="rgba(255,245,200,0.95)" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: "rgba(255,253,208,0.92)" }}
              >
                <tspan
                  x={lx}
                  dy="-0.45em"
                  style={{ fontSize: 16, fontFamily: "inherit" }}
                  className="font-serif"
                >
                  {label}
                </tspan>
                <tspan
                  x={lx}
                  dy="1.15em"
                  style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
                >
                  {vx}%
                </tspan>
              </text>
            </g>
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="rgba(7,11,24,0.9)"
          stroke="rgba(212,175,55,0.45)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
