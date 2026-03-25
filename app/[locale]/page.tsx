import LocaleSwitcher from "@/components/LocaleSwitcher";
import ArchiveButton from "@/components/ArchiveButton";
import RitualUnlockResetOnLanding from "@/components/RitualUnlockResetOnLanding";

import { Noto_Sans_KR, Song_Myung } from "next/font/google";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

/** 메인 비주얼: 한복 인물 캐릭터 (`public/goddess_the_answer.png`) */
const WOLA_HERO = "/goddess_the_answer.png";

/** 메인: 프리미엄 명조 톤 (묵직한 금박 부적 느낌) */
const landingTitleKo = Song_Myung({
  weight: "400",
});

/** 서브: 가독성 좋은 고딕 */
const landingSubKo = Noto_Sans_KR({
  weight: ["400", "500"],
  subsets: ["latin"],
});

const CHAMPAGNE_GOLD = "#F1E5AC";

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });

  const destinyPointStyle = {
    color: "rgba(255,253,208,0.98)",
    WebkitTextStroke: "0.65px rgba(212,175,55,0.78)",
    textShadow:
      "0 0 12px rgba(212,175,55,0.20), 0 0 44px rgba(212,175,55,0.10), 0 0 70px rgba(197,48,48,0.08)",
  } as const;

  const heroTagline = t("heroTagline").trim();
  const verticalHanja = t("verticalHanja").trim();
  const footerNote = t("footerNote").trim();
  const subtitleDirect = t("subtitle").trim();
  const hasLegacySubtitle =
    Boolean(subtitleDirect) ||
    Boolean(
      t("subtitlePrefix") || t("subtitleDestiny") || t("subtitleSuffix"),
    );

  const isKoLuxury = locale === "ko";

  const mainTitleStyle = !isKoLuxury
    ? ({
        color: "#FFFDD0",
        WebkitTextStroke: "0.55px rgba(212,175,55,0.55)",
        textShadow: "0 0 16px rgba(212,175,55,0.12)",
      } as const)
    : null;

  /** 한국 서브: 샴페인 골드 + 그림자로 배경 분리 */
  const taglineStyleKo = {
    color: CHAMPAGNE_GOLD,
    textShadow:
      "0 0 1px rgba(0,0,0,0.9), 0 2px 14px rgba(0,0,0,0.75), 0 0 24px rgba(241,229,172,0.12)",
  } as const;

  const taglineStyle = !isKoLuxury
    ? ({
        color: "rgba(255,253,208,0.92)",
        WebkitTextStroke: "0.4px rgba(212,175,55,0.35)",
        textShadow: "0 0 12px rgba(212,175,55,0.10)",
      } as const)
    : taglineStyleKo;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <RitualUnlockResetOnLanding />
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

      {/* 고서 느낌 세로 한자 (재회기원) */}
      {verticalHanja ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[clamp(6px,2.2vw,18px)] top-1/2 z-[15] -translate-y-1/2 select-none"
          style={{
            writingMode: "vertical-rl",
            opacity: 0.2,
            color: CHAMPAGNE_GOLD,
            fontSize: "clamp(1.35rem, 4.8vw, 2.1rem)",
            letterSpacing: "0.42em",
            fontFamily: "var(--font-ko), serif",
            fontWeight: 700,
            textShadow: "0 0 20px rgba(0,0,0,0.5)",
          }}
        >
          {verticalHanja}
        </div>
      ) : null}

      {/* Language switch (top-right) */}
      <div className="absolute top-4 right-4 z-30">
        <LocaleSwitcher />
      </div>

      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Text area (keep it away from the character face) */}
        <div className="pt-[clamp(30px,6vh,62px)] px-5 text-center">
          {/* 배경과 분리: 은은한 다크 스크림 + 그라데이션은 내부에서 처리 */}
          <div className="relative z-[1] mx-auto w-full max-w-[min(100%,26rem)] sm:max-w-[min(100%,32rem)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -inset-y-5 rounded-[2rem] sm:-inset-x-10"
              style={{
                background:
                  "radial-gradient(ellipse 115% 95% at 50% 0%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 48%, rgba(0,0,0,0.12) 78%, transparent 100%)",
              }}
            />
            <div className="relative px-1 py-2 sm:px-2">
              <h1
                className={[
                  "mx-auto max-w-[22rem] sm:max-w-none",
                  "text-[clamp(1.75rem,7.2vw,2.85rem)]",
                  isKoLuxury ? "leading-[1.22]" : "leading-[1.12]",
                  isKoLuxury
                    ? `${landingTitleKo.className} font-normal tracking-[0.02em]`
                    : locale === "en"
                      ? "font-[300] tracking-tight"
                      : "font-[700] tracking-[-0.02em]",
                  !isKoLuxury
                    ? "drop-shadow-[0_0_18px_rgba(212,175,55,0.08)]"
                    : "",
                ].join(" ")}
                style={mainTitleStyle ?? undefined}
              >
                {isKoLuxury ? (
                  <span
                    className="inline-block whitespace-pre-line bg-gradient-to-br from-[#FF8C00] via-[#9B2D30] to-[#800000] bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      /* 퍼플 네온 광채 ~0.4 + 짙은 그림자로 가독성 */
                      filter: [
                        "drop-shadow(0 0 14px rgba(168, 85, 247, 0.4))",
                        "drop-shadow(0 0 32px rgba(168, 85, 247, 0.22))",
                        "drop-shadow(0 3px 10px rgba(0,0,0,0.92))",
                        "drop-shadow(0 0 1px rgba(0,0,0,0.55))",
                      ].join(" "),
                    }}
                  >
                    {t("title")}
                  </span>
                ) : (
                  t("title")
                )}
              </h1>

              {heroTagline ? (
                <p
                  className={[
                    "mx-auto max-w-[32rem]",
                    "my-[clamp(1rem,3.2vh,1.85rem)] py-[clamp(0.35rem,1.2vh,0.65rem)]",
                    "text-[clamp(0.86rem,3vw,1.02rem)] leading-[1.65]",
                    isKoLuxury
                      ? `${landingSubKo.className} font-medium`
                      : locale === "en"
                        ? "font-[300]"
                        : "font-[600]",
                  ].join(" ")}
                  style={taglineStyle}
                >
                  {heroTagline}
                </p>
              ) : null}
            </div>
          </div>

          {subtitleDirect ? (
            <p
              className={[
                "mx-auto mt-4 max-w-[30rem]",
                "text-[clamp(0.98rem,3.8vw,1.22rem)] leading-[1.6]",
                locale === "en" ? "font-[300]" : "font-[600]",
              ].join(" ")}
              style={taglineStyle}
            >
              {subtitleDirect}
            </p>
          ) : !heroTagline && hasLegacySubtitle ? (
            <p
              className={[
                "mx-auto mt-4 max-w-[30rem]",
                "text-[clamp(0.98rem,3.8vw,1.22rem)] leading-[1.6]",
                locale === "en" ? "font-[300]" : "font-[600]",
              ].join(" ")}
              style={taglineStyle}
            >
              {t("subtitlePrefix")}
              <span style={destinyPointStyle}>{t("subtitleDestiny")}</span>
              {t("subtitleSuffix")}
            </p>
          ) : null}
        </div>

        {/* Button + 하단 각주 */}
        <div className="mt-auto px-5 pb-[clamp(22px,6vh,42px)] flex flex-col items-center gap-3">
          <ArchiveButton
            href={`/${locale}/ritual`}
            label={t("button")}
            breathingGlow={isKoLuxury}
          />
          {footerNote ? (
            <p
              className="max-w-[26rem] px-2 text-center text-[10px] leading-snug text-white/38 [text-shadow:0_0_12px_rgba(0,0,0,0.65)]"
              style={{ fontFamily: "var(--font-ko), serif" }}
            >
              {footerNote}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
