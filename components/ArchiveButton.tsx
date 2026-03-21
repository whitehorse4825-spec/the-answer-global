"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  href: string;
  label: string;
};

export default function ArchiveButton({ href, label }: Props) {
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
          "group relative w-full max-w-[420px] rounded-3xl border border-white/15",
          "bg-white/6 px-7 py-5 shadow-[0_0_80px_rgba(0,0,0,0.25)] backdrop-blur-md",
          "transition-transform duration-300 hover:-translate-y-[1px] active:translate-y-[0px]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-danchung-gold/50",
          leaving ? "pointer-events-none" : "",
        ].join(" ")}
        onClick={() => {
          setLeaving(true);
          window.setTimeout(() => router.push(href), 260);
        }}
      >
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
          className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
          style={{
            backgroundImage:
              "conic-gradient(from 180deg, rgba(197,48,48,0.65), rgba(43,108,176,0.55), rgba(212,175,55,0.70), rgba(197,48,48,0.65))",
            filter: "blur(14px)",
          }}
        />

        {/* Sheen */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.18))",
          }}
        />

        <span className="relative z-10 flex items-center justify-center">
          <span className="text-[clamp(1.04rem,2.6vw,1.35rem)] font-semibold tracking-wide text-white transition-colors group-hover:text-white">
            {label}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
          style={{
            boxShadow:
              "0 0 0 1px rgba(212,175,55,0.22), 0 0 28px rgba(212,175,55,0.28), 0 0 60px rgba(197,48,48,0.20), 0 0 90px rgba(43,108,176,0.18)",
          }}
        />
      </button>
    </>
  );
}

