"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  href: string;
  label: string;
  /** 은은하게 숨 쉬는 듯한 골드 글로우 (랜딩 CTA 등) */
  breathingGlow?: boolean;
};

export default function ArchiveButton({
  href,
  label,
  breathingGlow = false,
}: Props) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <>
      {leaving ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[200] bg-[#050505]/90 backdrop-blur-sm"
          style={{ opacity: 1, transition: "opacity 240ms ease" }}
        />
      ) : null}

      <button
        type="button"
        disabled={leaving}
        className={[
          "group relative z-[1] w-full overflow-visible border backdrop-blur-md",
          breathingGlow
            ? "max-w-[min(100%,32rem)] rounded-[2rem] border-[rgba(212,175,55,0.65)] bg-white/[0.08] px-10 py-7 shadow-[0_0_0_1px_rgba(212,175,55,0.55),0_0_28px_rgba(212,175,55,0.42),0_0_56px_rgba(191,149,63,0.22),inset_0_0_0_1px_rgba(212,175,55,0.18)]"
            : "max-w-[420px] rounded-3xl border-white/15 bg-white/6 px-7 py-5 shadow-[0_0_80px_rgba(0,0,0,0.25)]",
          "transition-transform duration-300 hover:-translate-y-[1px] active:translate-y-[0px]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-danchung-gold/50",
          leaving ? "pointer-events-none" : "",
        ].join(" ")}
        onClick={() => {
          setLeaving(true);
          window.setTimeout(() => router.push(href), 260);
        }}
      >
        {breathingGlow ? (
          <span
            aria-hidden="true"
            className="landing-cta-breathe-glow pointer-events-none absolute -inset-[12px] z-0 rounded-[2.15rem]"
          />
        ) : null}

        {/* Flower embroidery texture */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-3xl opacity-40 transition-opacity duration-300 group-hover:opacity-70 group-active:opacity-70"
          style={{
            backgroundImage: "url('/pattern_danchung.jpg')",
            backgroundSize: "230% auto",
            backgroundPosition: "center 40%",
            filter: "saturate(1.2) contrast(1.1)",
            mixBlendMode: "screen",
          }}
        />

        {/* O-bang glow (hover/touch) */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
          style={{
            backgroundImage:
              "conic-gradient(from 180deg, rgba(197,48,48,0.65), rgba(43,108,176,0.55), rgba(212,175,55,0.70), rgba(197,48,48,0.65))",
            filter: "blur(14px)",
          }}
        />

        {/* Sheen */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.18))",
          }}
        />

        <span className="relative z-20 flex items-center justify-center">
          <span
            className={[
              "font-semibold tracking-wide text-white transition-colors group-hover:text-white",
              breathingGlow
                ? "text-[clamp(1.12rem,3.2vw,1.55rem)]"
                : "text-[clamp(1.04rem,2.6vw,1.35rem)]",
            ].join(" ")}
          >
            {label}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
          style={{
            boxShadow:
              "0 0 0 1px rgba(212,175,55,0.22), 0 0 28px rgba(212,175,55,0.28), 0 0 60px rgba(197,48,48,0.20), 0 0 90px rgba(43,108,176,0.18)",
          }}
        />
      </button>
    </>
  );
}

