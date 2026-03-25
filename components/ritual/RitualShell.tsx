import type { ReactNode } from "react";

const HERO = "/goddess_the_answer.png";

export default function RitualShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-[#030306] text-white">
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: `url(${HERO})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "center bottom",
            filter: "blur(14px) saturate(1.05)",
          }}
        />
        <div className="lux-moonlight-overlay absolute inset-0" />
        <div className="lux-mist-layer absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.14), transparent 55%), linear-gradient(to bottom, transparent, rgba(3,3,6,0.92))",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-lg px-5 pb-28 pt-14">
        {children}
      </div>
    </main>
  );
}
