"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { readKakaoAnalysisDraft } from "@/lib/kakaoPayResumeDraft";
import { mergeEmotionKeywords } from "@/lib/kakaoReportSignals";
import { requestFullPackagePortonePayment } from "@/lib/portoneClient";
import {
  FULL_PACKAGE_PRICE_WON,
  readFullPackagePortoneUnlocked,
  readRitualIntake,
  writeFullPackagePortoneUnlocked,
} from "@/lib/ritualStorage";

import RitualShell from "./RitualShell";

type Props = { locale: string };

type RoadmapStep = 1 | 2 | 3;

export default function RitualMenu({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [userFormalName, setUserFormalName] = useState("");
  const [primarySignal, setPrimarySignal] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  /** 현재 황금 하이라이트 단계 (1→2→3 순서로 이동, 결제는 3단계에서만) */
  const [activeStep, setActiveStep] = useState<RoadmapStep>(1);
  /**
   * 결제 성공 후 UI에서 단계별로 “해제/티저 공개”를 순서대로 보여주기 위한 진행 단계.
   * - unlocked: 결제 성공 여부
   * - revealStep: 1 → 2 → 3 순서대로 본문이 열리는 타이밍
   */
  const [revealStep, setRevealStep] = useState<RoadmapStep>(1);

  const step1Ref = useRef<HTMLLIElement>(null);
  const step2Ref = useRef<HTMLLIElement>(null);
  const step3Ref = useRef<HTMLLIElement>(null);
  /** 모바일 리디렉션 복귀 시 URL 처리 1회 */
  const portoneReturnHandledRef = useRef(false);
  const revealTimersRef = useRef<number[]>([]);
  const autoRedirectStartedRef = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsClient(true);
      const alreadyUnlocked = readFullPackagePortoneUnlocked();
      setUnlocked(alreadyUnlocked);
      // alreadyUnlocked 상태여도, 결제 후 UX는 1 → 2 → 3 순서로 공개된 뒤 이동해야 함.
      // 실제 자동 이동은 unlocked 감지 useEffect에서 startRevealAndRedirect로 처리.
      setRevealStep(1);
      setActiveStep(1);
      const intake = readRitualIntake();
      if (!intake?.userName?.trim()) {
        router.replace(`/${locale}/ritual`);
        return;
      }
      const name = intake.userName.trim();
      setUserFormalName(name);

      const draft = readKakaoAnalysisDraft();
      const sameUser =
        draft?.consultUserName?.trim() === name &&
        Boolean(draft?.previewMd?.trim());
      if (sameUser && draft?.payload) {
        const kws = mergeEmotionKeywords(
          draft.emotionKeywords ?? [],
          draft.payload.text ?? "",
          3,
        );
        setPrimarySignal(kws[0] ?? null);
      } else {
        setPrimarySignal(null);
      }
    });
  }, [locale, router]);

  /** 포트원 모바일 리디렉션 복귀: ?paymentId=… (성공) — Promise로는 결과를 못 받는 흐름 */
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;
    if (portoneReturnHandledRef.current) return;
    if (readFullPackagePortoneUnlocked()) return;

    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("paymentId");
    const code = params.get("code");
    if (!paymentId || code) return;
    if (!paymentId.startsWith("fullpkg_")) return;

    portoneReturnHandledRef.current = true;
    writeFullPackagePortoneUnlocked();
    setUnlocked(true);
    window.history.replaceState({}, "", pathname);
    alert(t("roadmapPortoneSuccessAlert"));
  }, [isClient, pathname, t]);

  useEffect(() => {
    const el =
      activeStep === 1
        ? step1Ref.current
        : activeStep === 2
          ? step2Ref.current
          : step3Ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeStep]);

  // 타이머 정리(페이지 이동/언마운트 대비)
  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach((id) => window.clearTimeout(id));
      revealTimersRef.current = [];
    };
  }, []);

  const amountStr = useMemo(
    () => FULL_PACKAGE_PRICE_WON.toLocaleString("ko-KR"),
    [],
  );

  const isStepRevealed = (step: RoadmapStep) => unlocked && revealStep >= step;
  const stayOnMenu = searchParams.get("stay") === "1";

  const isGold = (step: RoadmapStep) =>
    unlocked ? revealStep >= step : activeStep === step;

  const startRevealAndRedirect = () => {
    if (autoRedirectStartedRef.current) return;
    autoRedirectStartedRef.current = true;
    // 결제 성공 후 1단계(카톡 속마음 분석기)가 먼저 나오게 이동
    // 이후 2/3 단계 자동 진행은 각 단계 페이지에서 처리
    router.replace(`/${locale}/ritual/kakao`);
  };

  useEffect(() => {
    if (!isClient) return;
    if (!unlocked) return;
    if (stayOnMenu) return;
    startRevealAndRedirect();
  }, [isClient, unlocked, locale, stayOnMenu]);

  const handlePortonePay = async () => {
    if (payBusy || unlocked) return;
    if (activeStep !== 3) {
      alert(t("roadmapPayNeedStep3"));
      return;
    }
    setPayBusy(true);
    try {
      const result = await requestFullPackagePortonePayment({
        buyerName: userFormalName,
      });
      if (result.ok) {
        writeFullPackagePortoneUnlocked();
        setUnlocked(true);
        alert(t("roadmapPortoneSuccessAlert"));
        // 결제 성공 후 1 → 2 → 3 순서 공개 후 persona로 이동
        startRevealAndRedirect();
        return;
      }
      if (result.cancelled) {
        alert(
          `${t("roadmapPortoneCancelled")}${result.message ? `\n${result.message}` : ""}`,
        );
        return;
      }
      alert(
        `${t("roadmapPortonePayFail")}${result.message ? `\n${result.message}` : ""}`,
      );
    } catch (e) {
      alert(
        `${t("roadmapPortoneLoadError")}${e instanceof Error ? `\n${e.message}` : ""}`,
      );
    } finally {
      setPayBusy(false);
    }
  };

  const goNextStep = () => {
    if (activeStep >= 3) return;
    setActiveStep((s) => (s === 1 ? 2 : 3));
  };

  const goPrevStep = () => {
    if (activeStep <= 1) return;
    setActiveStep((s) => (s === 3 ? 2 : 1));
  };

  if (!isClient) {
    return (
      <RitualShell>
        <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  if (!userFormalName) return null;

  const cardShell = (step: RoadmapStep) =>
    [
      "rounded-2xl p-4 transition-all duration-500",
      isGold(step)
        ? "border-2 border-[#BF953F]/55 bg-gradient-to-br from-[#120a18]/95 to-black/90 shadow-[0_0_36px_rgba(168,85,247,0.14),0_0_24px_rgba(191,149,63,0.18)]"
        : "border border-white/[0.12] bg-black/40 opacity-[0.78]",
    ].join(" ");

  const stepBadge = (step: RoadmapStep, label: string) => (
    <div
      className={[
        "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-[#08040c] text-sm font-black sm:h-9 sm:w-9 sm:text-[15px]",
        isGold(step)
          ? "border-[#BF953F] text-[#F1E5AC] shadow-[0_0_18px_rgba(191,149,63,0.5)]"
          : "border-[#BF953F]/35 text-[#F1E5AC]/55 shadow-none",
      ].join(" ")}
      aria-hidden
    >
      {label}
    </div>
  );

  const titleClass = (step: RoadmapStep) =>
    [
      "text-base sm:text-lg font-black",
      isGold(step)
        ? "text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]"
        : "text-[#FFF8E7]/55",
    ].join(" ");

  return (
    <RitualShell>
      <Link
        href={`/${locale}/ritual`}
        className="mb-5 inline-block text-sm text-danchung-gold/80 hover:text-danchung-gold"
      >
        ← {t("backEdit")}
      </Link>

      <header className="text-center break-keep">
        <h1 className="whitespace-pre-line font-serif text-xl font-bold leading-snug text-[#FFF8E7] [text-shadow:0_0_24px_rgba(191,149,63,0.35)] sm:text-2xl">
          {t("roadmapTitle", { name: userFormalName })}
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm font-semibold tracking-wide text-danchung-gold/90 sm:text-base">
          {t("roadmapSubtitle")}
        </p>
        {!unlocked ? (
          <p className="mx-auto mt-3 max-w-[22rem] text-[12px] leading-relaxed text-danchung-gold/65 sm:text-[13px]">
            {t("roadmapStepIntro")}
          </p>
        ) : null}
        {!unlocked ? (
          <p
            className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#BF953F]/90"
            aria-live="polite"
          >
            {t("roadmapStepBadge", { step: activeStep })}
          </p>
        ) : null}
      </header>

      {/* 타임라인: 황금 인연줄 + 3단계 */}
      <div className="relative mx-auto mt-8 max-w-md break-keep pb-52">
        <p className="sr-only">{t("roadmapSpineLabel")}</p>
        <div
          className="pointer-events-none absolute left-[15px] top-3 bottom-3 w-[3px] rounded-full sm:left-[17px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(246,226,122,0.95) 0%, rgba(191,149,63,0.85) 45%, rgba(107,79,12,0.75) 100%)",
            boxShadow:
              "0 0 16px rgba(191,149,63,0.55), 0 0 40px rgba(212,175,55,0.2)",
          }}
          aria-hidden
        />

        <ol className="relative z-[1] space-y-12 sm:space-y-14">
          {/* ① 천기누설 */}
          <li ref={step1Ref} className="relative pl-11 sm:pl-12">
            {stepBadge(1, "①")}
            <div className={cardShell(1)}>
              <h2 className={titleClass(1)}>{t("roadmapS1Badge")}</h2>
              <div
                className={[
                  "mt-3 overflow-hidden rounded-xl p-3 transition-colors",
                  isGold(1)
                    ? "border border-[#BF953F]/35 bg-black/55"
                    : "border border-white/10 bg-black/35",
                ].join(" ")}
              >
                {primarySignal ? (
                  <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed text-[#FFF8E7] sm:text-base">
                    {t("roadmapS1Reveal", { signal: primarySignal })}
                  </p>
                ) : (
                  <p className="text-[15px] leading-relaxed text-danchung-gold/88 sm:text-base">
                    {t("roadmapS1Waiting")}
                  </p>
                )}
              </div>
            </div>
          </li>

          {/* ② 운명점지 */}
          <li ref={step2Ref} className="relative pl-11 sm:pl-12">
            {stepBadge(2, "②")}
            <div className={cardShell(2)}>
              <h2 className={titleClass(2)}>{t("roadmapS2Badge")}</h2>
              {isStepRevealed(2) ? (
                <p className="mt-4 text-center text-[15px] font-semibold leading-relaxed text-[#FFF8E7]/95 sm:text-base">
                  {t("roadmapS2Teaser")}
                </p>
              ) : (
                <div
                  className={[
                    "mt-3 overflow-hidden rounded-xl p-3",
                    isGold(2)
                      ? "border border-[#BF953F]/35 bg-black/55"
                      : "border border-white/10 bg-black/35",
                  ].join(" ")}
                >
                  <p className="text-[15px] leading-relaxed text-danchung-gold/88 sm:text-base">
                    {t("roadmapS2Waiting")}
                  </p>
                </div>
              )}
            </div>
          </li>

          {/* ③ 영혼빙의 */}
          <li ref={step3Ref} className="relative pl-11 sm:pl-12">
            {stepBadge(3, "③")}
            <div className={cardShell(3)}>
              <h2 className={titleClass(3)}>{t("roadmapS3Badge")}</h2>
              {isStepRevealed(3) ? (
                <p className="mt-4 text-center text-[15px] font-semibold leading-relaxed text-[#FFF8E7]/95 sm:text-base">
                  {t("roadmapS3Teaser")}
                </p>
              ) : (
                <div
                  className={[
                    "mt-3 overflow-hidden rounded-xl p-3",
                    isGold(3)
                      ? "border border-[#BF953F]/35 bg-black/55"
                      : "border border-white/10 bg-black/35",
                  ].join(" ")}
                >
                  <p className="text-[15px] leading-relaxed text-danchung-gold/88 sm:text-base">
                    {t("roadmapS3Waiting")}
                  </p>
                </div>
              )}
            </div>
          </li>
        </ol>
      </div>

      {/* 하단 고정 — 단계 진행 후 3단계에서 결제 */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#BF953F]/25 bg-[#030306]/92 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto w-full max-w-lg">
          {unlocked ? (
            <p className="mb-3 text-center text-[14px] font-bold leading-snug text-emerald-200/95 [text-shadow:0_0_14px_rgba(52,211,153,0.35)]">
              {t("roadmapPortonePaidBadge")}
            </p>
          ) : activeStep === 3 ? (
            <p
              className="mb-3 whitespace-pre-line break-keep text-center text-[15px] font-bold leading-snug text-red-400 sm:text-[15px]"
              style={{
                textShadow:
                  "0 0 12px rgba(248,113,113,0.95), 0 0 28px rgba(239,68,68,0.55)",
              }}
            >
              {t("roadmapPayWarningNeon")}
            </p>
          ) : (
            <p className="mb-3 text-center text-[13px] font-semibold leading-snug text-danchung-gold/85">
              {t("roadmapStepBadge", { step: activeStep })}
              {" · "}
              <span className="text-danchung-gold/65">
                {activeStep === 1
                  ? t("roadmapStepFooterAfter1")
                  : t("roadmapStepFooterAfter2")}
              </span>
            </p>
          )}

          {unlocked ? (
            <div className="kakao-pay-cta-black-gold flex w-full flex-col items-center justify-center !min-h-[3.5rem] !cursor-default !rounded-xl !px-3 !py-3 opacity-90">
              <span className="text-[clamp(17px,4.8vw,20px)] font-black text-[#fceea8]/90">
                {t("roadmapPortonePaidButton")}
              </span>
              <span className="mt-0.5 text-[13px] font-semibold text-danchung-gold/70">
                {amountStr}원 · {t("roadmapCtaLine1")}
              </span>
            </div>
          ) : activeStep < 3 ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeStep === 1}
                  onClick={goPrevStep}
                  className="min-h-[3.25rem] flex-1 rounded-xl border border-white/20 bg-black/50 px-3 text-[13px] font-bold text-white/80 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {t("roadmapPrevStep")}
                </button>
                <button
                  type="button"
                  onClick={goNextStep}
                  className="kakao-pay-cta-black-gold min-h-[3.25rem] flex-[1.35] !rounded-xl !px-3 !py-2 !text-[15px] !font-black"
                >
                  {t("roadmapNextStep")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={payBusy}
              onClick={() => void handlePortonePay()}
              className="kakao-pay-cta-black-gold flex w-full flex-col items-center justify-center gap-1 !min-h-[3.85rem] !rounded-xl !px-3 !py-3 !font-black !tracking-tight break-keep disabled:opacity-60"
            >
              <span className="whitespace-nowrap text-[clamp(15px,4.2vw,18px)] leading-tight">
                {t("roadmapPortoneCta")}
              </span>
              <span className="text-[11px] font-semibold text-[#fceea8]/75">
                {payBusy ? "…" : `카카오페이 통합결제 · ${amountStr}원`}
              </span>
            </button>
          )}

          <p className="mt-3 text-center text-[11px] leading-[1.75] text-white/45 sm:text-[12px]">
            {t("roadmapPortoneFinePrint")}
          </p>
        </div>
      </div>
    </RitualShell>
  );
}
