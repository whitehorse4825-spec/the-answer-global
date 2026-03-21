import LocaleSwitcher from "@/components/LocaleSwitcher";
import ArchiveButton from "@/components/ArchiveButton";

import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const WOLA_HERO = "/goddess_the_answer.png";

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });

  const destinyPointStyle = {
    color: "rgba(255,253,208,0.98)",
    WebkitTextStroke: "0.65px rgba(212,175,55,0.78)",
    textShadow:
      "0 0 12px rgba(212,175,55,0.20), 0 0 44px rgba(212,175,55,0.10), 0 0 70px rgba(197,48,48,0.08)",
  } as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Background: contain, non-stretched (mobile-optimized) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: "#050505",
          backgroundImage: `url(${WOLA_HERO})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center bottom",
        }}
      />

      <div className="lux-moonlight-overlay absolute inset-0" aria-hidden />
      <div className="lux-mist-layer absolute inset-0" aria-hidden />

      {/* Subtle depth + vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 18%, rgba(212,175,55,0.18), transparent 52%), linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.75))",
        }}
      />

      {/* Language switch (top-right) */}
      <div className="absolute top-4 right-4 z-30">
        <LocaleSwitcher />
      </div>

      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Text area (keep it away from the character face) */}
        <div className="pt-[clamp(30px,6vh,62px)] px-5 text-center">
          <h1
            className={[
              "mx-auto",
              "text-[clamp(1.7rem,7vw,2.7rem)] leading-[1.08]",
              locale === "en" ? "font-[300] tracking-tight" : "font-[700] tracking-[-0.02em]",
              "drop-shadow-[0_0_18px_rgba(212,175,55,0.08)]",
            ].join(" ")}
            style={{
              color: "#FFFDD0",
              WebkitTextStroke: "0.55px rgba(212,175,55,0.55)",
              textShadow: "0 0 16px rgba(212,175,55,0.12)",
            }}
          >
            {t("title")}
          </h1>

          {t("subtitle") ? (
            <p
              className={[
                "mx-auto mt-4 max-w-[30rem]",
                "text-[clamp(0.98rem,3.8vw,1.22rem)] leading-[1.6]",
                locale === "en" ? "font-[300]" : "font-[600]",
              ].join(" ")}
              style={{
                color: "rgba(255,253,208,0.92)",
                WebkitTextStroke: "0.4px rgba(212,175,55,0.35)",
                textShadow: "0 0 12px rgba(212,175,55,0.10)",
              }}
            >
              {t("subtitle")}
            </p>
          ) : (
            <p
              className={[
                "mx-auto mt-4 max-w-[30rem]",
                "text-[clamp(0.98rem,3.8vw,1.22rem)] leading-[1.6]",
                locale === "en" ? "font-[300]" : "font-[600]",
              ].join(" ")}
              style={{
                color: "rgba(255,253,208,0.92)",
                WebkitTextStroke: "0.4px rgba(212,175,55,0.35)",
                textShadow: "0 0 12px rgba(212,175,55,0.10)",
              }}
            >
              {t("subtitlePrefix")}
              <span style={destinyPointStyle}>{t("subtitleDestiny")}</span>
              {t("subtitleSuffix")}
            </p>
          )}
        </div>

        {/* Button area (bottom anchored) */}
        <div className="mt-auto px-5 pb-[clamp(22px,6vh,42px)] flex justify-center">
          <ArchiveButton href={`/${locale}/ritual`} label={t("button")} />
        </div>
      </div>
    </main>
  );
}

