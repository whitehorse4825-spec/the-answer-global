import type { ReactNode } from "react";

/** 브리핑·전달본 공통 — 무의식 뇌 지도 SVG */
export function BrainMapSvg({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "relative h-[76px] rounded-xl border border-violet-400/25 bg-gradient-to-br from-[#2a1535]/95 via-[#180d22]/90 to-black/92 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(139,92,246,0.12)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        viewBox="0 0 200 60"
        className="h-full w-full opacity-[0.96]"
        aria-hidden
      >
        <path
          d="M100 8 L40 38 L100 52 L160 38 Z"
          fill="none"
          stroke="rgba(168,85,247,0.55)"
          strokeWidth="1.2"
        />
        <circle cx="100" cy="18" r="6" fill="rgba(191,149,63,0.9)" />
        <circle cx="48" cy="40" r="5" fill="rgba(197,48,48,0.65)" />
        <circle cx="152" cy="40" r="5" fill="rgba(43,108,176,0.65)" />
        <line
          x1="100"
          y1="24"
          x2="48"
          y2="36"
          stroke="rgba(241,229,172,0.28)"
          strokeWidth="0.8"
        />
        <line
          x1="100"
          y1="24"
          x2="152"
          y2="36"
          stroke="rgba(241,229,172,0.28)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}

type BarItem = { heightPct: number; label: string };

/** 막대 트랙 높이(px) — % 대신 픽셀로 계산해 레이아웃 깨짐 방지 */
const EMOTION_BAR_TRACK_PX = 92;

/** 감정 막대 — SVG 베이스라인 + CSS 막대 (고급 톤) */
export function EmotionBarChartPremium({
  bars,
  className = "",
}: {
  bars: readonly BarItem[];
  className?: string;
}) {
  return (
    <div
      className={[
        "ritual-emotion-bar-chart relative mt-3 overflow-hidden rounded-2xl border border-rose-500/[0.18] bg-gradient-to-b from-[#1c0a10]/95 via-black/55 to-[#080306] px-3 pb-2.5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-x-4 bottom-7 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
        aria-hidden
      />
      <div
        className="flex justify-between gap-[3px] sm:gap-1.5"
        style={{ height: EMOTION_BAR_TRACK_PX }}
      >
        {bars.map((b) => {
          const pct = Math.min(100, Math.max(6, b.heightPct));
          const hPx = Math.round((EMOTION_BAR_TRACK_PX * pct) / 100);
          return (
            <div
              key={b.label}
              className="group flex min-h-0 min-w-0 flex-1 flex-col justify-end"
              title={`${b.label} (${pct}%)`}
            >
              <div
                className="w-full max-w-[100%] rounded-t-[5px] bg-gradient-to-t from-[#7f1d1d] via-[#c53030] to-[#fecaca] shadow-[0_0_14px_rgba(244,63,94,0.22)] ring-1 ring-white/[0.08] transition group-hover:brightness-110"
                style={{
                  height: hPx,
                  minHeight: 4,
                }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-[0.62rem] leading-[1.85] tracking-[0.02em] text-white/38 sm:text-[0.68rem]">
        {bars.map((b) => b.label).join(" · ")}
      </p>
    </div>
  );
}

type CalendarMode = "teaser" | "full";

/** 애플·프리미엄 스타일 미니 캘린더 — 불꽃(또는 티저 ?)만 강조 */
export function RitualPremiumCalendar({
  mode,
  todayDom,
  fateDay = 17,
  caption,
  /** 브리핑 등: 오늘 강조 없이 물음표(운명일)만 크게 강조 */
  mysteryOnlyTeaser = false,
}: {
  mode: CalendarMode;
  todayDom: number;
  fateDay?: number;
  caption: ReactNode;
  mysteryOnlyTeaser?: boolean;
}) {
  const todayInGrid = Math.min(Math.max(todayDom, 1), 28);

  return (
    <div className="ritual-premium-calendar mx-auto w-full max-w-[min(100%,320px)] rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-black/55 p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="grid grid-cols-7 gap-x-0.5 gap-y-1 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <span
            key={d}
            className="pb-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white/28 sm:text-[0.62rem]"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-x-1 gap-y-1.5">
        {Array.from({ length: 28 }, (_, n) => n + 1).map((d) => {
          const isFate = d === fateDay;
          const isToday = !mysteryOnlyTeaser && d === todayInGrid;
          const showTeaserMystery =
            mode === "teaser" && isFate && (mysteryOnlyTeaser || !isToday);
          const showFullFire = mode === "full" && isFate;

          const baseCell =
            "relative flex aspect-square min-h-[2.15rem] max-h-[2.75rem] items-center justify-center rounded-2xl text-[0.62rem] font-medium tabular-nums transition sm:min-h-[2.35rem] sm:text-[0.68rem]";

          if (showFullFire) {
            return (
              <div
                key={d}
                className={`${baseCell} border border-orange-400/25 bg-gradient-to-br from-orange-600/35 via-red-950/50 to-black/80 shadow-[0_0_28px_rgba(251,146,60,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]`}
              >
                <span
                  className="text-[1.15rem] leading-none drop-shadow-[0_0_16px_rgba(251,146,60,0.95)] sm:text-[1.25rem]"
                  aria-hidden
                >
                  🔥
                </span>
              </div>
            );
          }

          if (showTeaserMystery) {
            return (
              <div
                key={d}
                className={[
                  baseCell,
                  mysteryOnlyTeaser
                    ? "z-[1] scale-[1.06] border-2 border-[#F5D083]/70 bg-gradient-to-br from-amber-500/30 via-amber-950/45 to-black/85 text-amber-50 shadow-[0_0_40px_rgba(251,191,36,0.55),0_0_80px_rgba(212,175,55,0.22),inset_0_0_0_1px_rgba(255,236,160,0.35)]"
                    : "border border-dashed border-amber-400/25 bg-black/40 text-amber-100/80",
                ].join(" ")}
              >
                <span
                  className="font-black drop-shadow-[0_0_18px_rgba(251,191,36,0.9)]"
                  style={{
                    fontSize: mysteryOnlyTeaser ? "1.1rem" : "0.85rem",
                  }}
                >
                  ?
                </span>
              </div>
            );
          }

          const muted = !isToday && !isFate;
          const subtle =
            !isToday && !isFate && [7, 12, 21].includes(d)
              ? "border border-white/[0.06] bg-white/[0.03]"
              : "bg-white/[0.02]";

          return (
            <div
              key={d}
              className={`${baseCell} ${subtle} ${
                isToday
                  ? "ring-1 ring-emerald-400/55 ring-offset-2 ring-offset-[#0a0a0c] bg-emerald-500/[0.12] text-emerald-100/95 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                  : muted
                    ? "text-white/[0.28]"
                    : "text-white/45"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[0.65rem] leading-[1.9] text-[#F1E5AC]/72 sm:text-[0.7rem]">
        {caption}
      </p>
    </div>
  );
}
