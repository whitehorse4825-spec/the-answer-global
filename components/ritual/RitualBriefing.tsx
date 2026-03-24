"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  FULL_PACKAGE_PRICE_WON,
  readRitualIntake,
  type RitualIntake,
  type RitualRelation,
} from "@/lib/ritualStorage";
import { RITUAL_PREVIEW_CALENDAR_FATE_DAY } from "@/lib/ritualPreviewCalendar";

import {
  BrainMapSvg,
  EmotionBarChartPremium,
  RitualPremiumCalendar,
} from "@/components/ritual/premiumReportVisuals";
import { DELIVERED_EMOTION_BARS } from "@/lib/reunionDeliveredReportKo";

import RitualShell from "./RitualShell";

type Props = { locale: string };

const LOADING_MS = 3000;

/** 브리핑 창 카운트다운 — 탭 세션 기준 30분, 만료 시 자동 루프 */
const BRIEFING_WINDOW_SESSION_KEY = "ritual:briefing:windowDeadlineMs";

const LIVE_TOAST_KEYS = [
  "briefingLiveToast1",
  "briefingLiveToast2",
  "briefingLiveToast3",
] as const;

const LIVE_TOAST_INTERVAL_MS = 5200;
const LIVE_TOAST_VISIBLE_MS = 2800;
const LIVE_TOAST_FIRST_DELAY_MS = 1200;

function formatKoCountdownDuration(totalSec: number): string {
  if (totalSec <= 0) return "0분\u00A000초";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}분\u00A0${String(s).padStart(2, "0")}초`;
}

function introKeyForRelation(rel: RitualRelation) {
  switch (rel) {
    case "reunion_emergency":
      return "briefingIntroEmergency" as const;
    case "reunion_revival":
      return "briefingIntroRevival" as const;
    default:
      return "briefingIntroBlocked" as const;
  }
}

function ScrollReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      queueMicrotask(() => setShow(true));
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setShow(true);
        }
      },
      { threshold: 0.04, rootMargin: "0px 0px -4% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        show ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** 히어로 미리보기 카드 사이 — 순서·연결감 */
function BriefingHeroConnector() {
  return (
    <div
      className="flex flex-col items-center justify-center py-1"
      aria-hidden
    >
      <div className="flex flex-col items-center">
        <div className="h-4 w-px bg-gradient-to-b from-transparent to-[#BF953F]/55" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#BF953F]/40 bg-black/55 shadow-[0_0_24px_rgba(191,149,63,0.22)]">
          <span className="select-none text-xl leading-none text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.5)]">
            ↓
          </span>
        </div>
        <div className="h-4 w-px bg-gradient-to-b from-[#BF953F]/55 to-transparent" />
      </div>
      <div className="mt-1 h-px w-[min(12rem,55vw)] bg-gradient-to-r from-transparent via-[#BF953F]/40 to-transparent" />
    </div>
  );
}

export default function RitualBriefing({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const [intake, setIntake] = useState<RitualIntake | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [countdownSec, setCountdownSec] = useState(0);
  const [liveToastIdx, setLiveToastIdx] = useState(0);
  const [liveToastOn, setLiveToastOn] = useState(false);
  const amountStr = useMemo(
    () => FULL_PACKAGE_PRICE_WON.toLocaleString("ko-KR"),
    [],
  );

  useEffect(() => {
    queueMicrotask(() => setIsClient(true));
  }, []);

  useEffect(() => {
    if (!isClient) return;
    queueMicrotask(() => {
      const data = readRitualIntake();
      if (!data?.userName?.trim()) {
        router.replace(`/${locale}/ritual`);
        return;
      }
      setIntake(data);
    });
  }, [isClient, locale, router]);

  useEffect(() => {
    if (!intake) return;
    const id = window.setTimeout(() => setRevealed(true), LOADING_MS);
    return () => clearTimeout(id);
  }, [intake]);

  useEffect(() => {
    if (!revealed) return;
    const tick = () => {
      const now = Date.now();
      let deadline = Number(
        sessionStorage.getItem(BRIEFING_WINDOW_SESSION_KEY),
      );
      if (!deadline || deadline < now) {
        deadline = now + 30 * 60 * 1000;
        sessionStorage.setItem(
          BRIEFING_WINDOW_SESSION_KEY,
          String(deadline),
        );
      }
      setCountdownSec(Math.max(0, Math.floor((deadline - now) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [revealed]);

  /** 실시간 구매 알림 — 8초마다, 3초간 노출 후 페이드아웃 */
  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;
    let idx = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const pulse = () => {
      if (cancelled) return;
      setLiveToastIdx(idx % LIVE_TOAST_KEYS.length);
      idx += 1;
      setLiveToastOn(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!cancelled) setLiveToastOn(false);
      }, LIVE_TOAST_VISIBLE_MS);
    };

    const first = setTimeout(pulse, LIVE_TOAST_FIRST_DELAY_MS);
    const interval = setInterval(pulse, LIVE_TOAST_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [revealed]);

  const onCta = () => {
    const payUrl = process.env.NEXT_PUBLIC_RITUAL_FULL_PACKAGE_PAY_URL?.trim();
    if (payUrl) {
      window.location.href = payUrl;
      return;
    }
    router.push(`/${locale}/ritual/menu`);
  };

  if (!isClient) {
    return (
      <RitualShell>
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  if (!intake) {
    return (
      <RitualShell>
        <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  if (!revealed) {
    return (
      <RitualShell>
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#030306]/96 px-6 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <div className="relative h-28 w-28">
            <div
              className="briefing-loading-orbit absolute inset-0 rounded-full border-2 border-dashed border-[rgba(168,85,247,0.45)]"
              aria-hidden
            />
            <div
              className="absolute inset-3 rounded-full border border-[rgba(241,229,172,0.35)] shadow-[0_0_40px_rgba(168,85,247,0.35)]"
              aria-hidden
            />
            <div
              className="absolute inset-[26%] rounded-full bg-gradient-to-br from-[#ff8c00]/40 via-[#800000]/50 to-[#1a0508]"
              aria-hidden
            />
          </div>
          <p className="max-w-[20rem] text-center text-[0.95rem] font-medium leading-relaxed text-[#F1E5AC] [text-shadow:0_0_24px_rgba(168,85,247,0.35),0_2px_12px_rgba(0,0,0,0.9)]">
            {t("briefingLoading", { name: intake.userName.trim() })}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[rgba(168,85,247,0.7)]"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </RitualShell>
    );
  }

  const introKey = introKeyForRelation(intake.relation);

  const stages = [
    {
      icon: "✦",
      badge: t("briefingStage1Badge"),
      desc: t("briefingStage1Desc"),
    },
    {
      icon: "◎",
      badge: t("briefingStage2Badge"),
      desc: t("briefingStage2Desc"),
    },
    {
      icon: "◇",
      badge: t("briefingStage3Badge"),
      desc: t("briefingStage3Desc"),
    },
  ] as const;

  const satisfactionBadge = () => (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/35 bg-gradient-to-r from-emerald-950/80 to-teal-950/60 px-2.5 py-1 text-[9px] font-bold tracking-wide text-emerald-100/95 shadow-[0_0_16px_rgba(52,211,153,0.15)]">
      <span aria-hidden>★</span>
      {t("briefingSatisfactionBadge")}
    </span>
  );

  const liveToastKey = LIVE_TOAST_KEYS[liveToastIdx] ?? LIVE_TOAST_KEYS[0];

  return (
    <RitualShell>
      {/* 라이브 구매 알림 — 뷰포트 왼쪽 하단 */}
      <div
        className={[
          "pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-[90] max-w-[min(calc(100vw-1.5rem),19.5rem)] transition-all duration-500 ease-out",
          liveToastOn
            ? "translate-x-0 opacity-100"
            : "-translate-x-[115%] opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="rounded-xl border border-[#BF953F]/25 bg-black/78 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(191,149,63,0.12)] backdrop-blur-md">
          <p className="text-[clamp(14px,3.8vw,16px)] font-semibold leading-snug text-[#BF953F] [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]">
            {t(liveToastKey as (typeof LIVE_TOAST_KEYS)[number])}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="briefing-smoke-layer absolute inset-x-0 -top-8 bottom-0 z-0 min-h-[120vh] rounded-none" />

        <div className="relative z-[1]">
          <Link
            href={`/${locale}/ritual`}
            className="mb-6 inline-block text-sm text-[#F1E5AC]/80 hover:text-[#F1E5AC]"
          >
            ← {t("briefingBack")}
          </Link>

          <h1 className="whitespace-pre-line break-keep text-center font-serif text-[clamp(1.35rem,6vw,2.05rem)] font-extrabold leading-[1.15] tracking-tight text-[#F1E5AC] [text-shadow:0_0_36px_rgba(191,149,63,0.32),0_2px_16px_rgba(0,0,0,0.92)]">
            {t("briefingFullPackageTitle")}
          </h1>
          <h2 className="ritual-gradient-text mx-auto mt-3 max-w-[24rem] whitespace-pre-line break-keep text-center font-serif text-[clamp(1.05rem,4.6vw,1.5rem)] font-bold leading-snug">
            {t("briefingHeadline")}
          </h2>

          <p className="mx-auto mt-4 max-w-[26rem] break-keep text-center text-[0.95rem] leading-relaxed text-[#F1E5AC]/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.85)] sm:text-[1rem]">
            {t(introKey)}
          </p>

          <div className="mt-10 space-y-4">
            {stages.map((s, i) => (
              <ScrollReveal key={s.badge}>
                <div className="relative overflow-hidden rounded-2xl border border-[rgba(241,229,172,0.22)] bg-black/50 px-4 py-4 shadow-[0_0_28px_rgba(168,85,247,0.12),inset_0_0_0_1px_rgba(168,85,247,0.08)] backdrop-blur-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8c00]/25 to-[#800000]/35 text-lg text-[#F1E5AC] shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                        aria-hidden
                      >
                        {s.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[rgba(168,85,247,0.95)]">
                          {i + 1} · {s.badge}
                        </div>
                        <p className="mt-1 whitespace-pre-line break-keep text-[0.95rem] font-semibold leading-snug text-[#F1E5AC] [text-shadow:0_1px_10px_rgba(0,0,0,0.8)] sm:text-[1rem]">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                    {satisfactionBadge()}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-14">
            <ScrollReveal>
              <h2 className="whitespace-pre-line break-keep text-center font-serif text-[clamp(1.05rem,4.4vw,1.35rem)] font-bold leading-snug text-[#F1E5AC] [text-shadow:0_0_24px_rgba(191,149,63,0.2)]">
                {t("briefingPeekTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-[24rem] whitespace-pre-line break-keep text-center text-[13px] leading-relaxed text-[#F1E5AC]/72 sm:text-[14px]">
                {t("briefingPeekSub")}
              </p>
            </ScrollReveal>

            <div className="mt-10 flex flex-col gap-10">
              {/* Card A — 무의식 리포트 · 인포그래픽 + 오토스크롤 */}
              <ScrollReveal>
                <article className="overflow-hidden rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#1a0f16] via-[#0d080c] to-[#050304] shadow-[0_0_48px_rgba(168,85,247,0.18),0_0_80px_rgba(191,149,63,0.08)]">
                  <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
                    <h3 className="text-left text-sm font-bold text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]">
                      {t("briefingHeroCardATitle")}
                    </h3>
                    <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-200/90">
                      SAMPLE
                    </span>
                  </header>
                  <div className="relative max-h-[min(52vw,280px)] overflow-y-auto overflow-x-hidden scroll-smooth sm:max-h-[300px]">
                    <div className="px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
                        {t("briefingBrainMapLabel")}
                      </p>
                      <div className="mt-2">
                        <BrainMapSvg />
                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300/85">
                        {t("briefingEmotionGraphLabel")}
                      </p>
                      <EmotionBarChartPremium
                        bars={DELIVERED_EMOTION_BARS}
                        className="mt-2 !border-rose-500/20 !bg-black/50"
                      />

                      <p className="mt-4 text-[11px] font-semibold text-[#F1E5AC]/90">
                        {t("briefingUnconsciousLead")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          t("briefingKwDeficit"),
                          t("briefingKwLonging"),
                          t("briefingKwPride"),
                        ].map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md border border-[#BF953F]/55 bg-[#BF953F]/10 px-2.5 py-1 text-[11px] font-bold text-[#BF953F] shadow-[0_0_12px_rgba(191,149,63,0.2)]"
                          >
                            [{kw}]
                          </span>
                        ))}
                      </div>

                      <div className="relative mt-4 overflow-hidden rounded-lg border border-[#BF953F]/35">
                        <div className="pointer-events-none space-y-1.5 bg-black/35 p-2 text-[10px] leading-relaxed text-white/55 blur-[6px] opacity-40 saturate-75">
                          <p className="line-through decoration-red-500/70 decoration-2">
                            · 답장 텀이 길어질수록 방어 기제가 켜집니다
                          </p>
                          <p>· 야간 22–01시 감정 곡선 급상승 구간 포착</p>
                          <p className="line-through decoration-red-500/70 decoration-2">
                            · 읽씹 직후 보낸 말에서 자존심 키워드 노출
                          </p>
                          <p>· 7가지 축: 회피·그리움·책임·죄책감·비교·안도·질투</p>
                        </div>
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/50 px-2 py-4 text-center backdrop-blur-[10px]"
                          style={{ WebkitBackdropFilter: "blur(10px)" }}
                        >
                          <p className="text-[9px] font-black leading-snug text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.45)]">
                            {t("teaserPaywallSealCta")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>

              <BriefingHeroConnector />

              {/* Card B — 타로 · 금박 카드 + 캘린더 */}
              <ScrollReveal>
                <article className="overflow-hidden rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#120a18] via-[#08050c] to-[#030204] shadow-[0_0_48px_rgba(168,85,247,0.18)]">
                  <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
                    <h3 className="text-sm font-bold text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]">
                      {t("briefingHeroCardBTitle")}
                    </h3>
                    <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-200/90">
                      SAMPLE
                    </span>
                  </header>
                  <div className="px-4 py-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-5">
                      {["Ⅰ", "Ⅱ", "Ⅲ"].map((mark, i) => (
                        <div
                          key={mark}
                          className="relative h-[min(28vw,112px)] w-[min(20vw,80px)] rounded-lg sm:h-[130px] sm:w-[88px]"
                          style={{
                            transform: `rotate(${i === 0 ? -7 : i === 2 ? 6 : 0}deg)`,
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #d4af37 0%, #8b6914 35%, #f6e27a 55%, #6b4f0a 100%)",
                              padding: "3px",
                            }}
                          >
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-gradient-to-br from-[#1a0a20] via-[#2d1538] to-[#0a0508]">
                              <span className="text-[10px] font-serif text-[#BF953F]/90">
                                THE ANSWER
                              </span>
                              <span className="mt-1 text-lg text-violet-300/40">
                                {mark}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <RitualPremiumCalendar
                        mode="teaser"
                        todayDom={1}
                        fateDay={RITUAL_PREVIEW_CALENDAR_FATE_DAY}
                        mysteryOnlyTeaser
                        caption={t("teaserCalendarCaption")}
                      />
                    </div>
                  </div>
                </article>
              </ScrollReveal>

              <BriefingHeroConnector />

              {/* Card C — 카톡형 AI 대화 */}
              <ScrollReveal>
                <article className="overflow-hidden rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#1c1810] to-[#080705] shadow-[0_0_48px_rgba(168,85,247,0.15)]">
                  <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
                    <h3 className="kakao-report-heading-text font-bold text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]">
                      {t("briefingHeroCardCTitle")}
                    </h3>
                    <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-200/90">
                      SAMPLE
                    </span>
                  </header>
                  <div className="bg-[#b2b2b2] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                      <div className="flex items-center gap-2 border-b border-black/5 bg-[#FEE500] px-3 py-2.5">
                        <span
                          className="text-lg text-black/70"
                          aria-hidden
                        >
                          ←
                        </span>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600" />
                        <div className="min-w-0 flex-1">
                          <p className="kakao-sns-bubble-text truncate font-bold text-black">
                            {t("briefingChatSampleName")}
                          </p>
                          <p className="text-[10px] text-black/45">
                            영혼 빙의 시뮬레이션
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-[#b2c7d6] px-3 py-4">
                        <div className="flex justify-start">
                          <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white px-3 py-2.5 shadow-sm">
                            <p className="kakao-sns-bubble-text leading-snug text-black">
                              <span className="font-medium">
                                {t("teaserChatOpponentPeek")}
                              </span>
                              <span
                                className="text-black/35 blur-[2px]"
                                aria-hidden
                              >
                                … ████ …
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end opacity-35">
                          <div className="max-w-[75%] rounded-lg rounded-tr-none bg-[#FEE500] px-3 py-2">
                            <p className="kakao-sns-bubble-text text-black/80">…</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            </div>
          </div>

          <ScrollReveal>
            <div className="mt-14 rounded-2xl border border-[rgba(212,175,55,0.45)] bg-gradient-to-b from-black/70 via-[#1a0a08]/80 to-black/90 px-5 py-6 text-center shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_0_40px_rgba(168,85,247,0.2),0_0_72px_rgba(212,175,55,0.08)]">
              <p className="break-keep text-xs font-bold uppercase tracking-[0.25em] text-[rgba(241,229,172,0.75)] sm:text-sm">
                {t("briefingPackageTitle")}
              </p>
              <p className="mt-3 break-keep text-[clamp(15px,3.8vw,17px)] font-semibold leading-relaxed text-[#F1E5AC] [text-shadow:0_0_20px_rgba(168,85,247,0.2)]">
                {t("briefingPackageBody", { amount: amountStr })}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-6 pb-2">
              <p className="break-keep text-center text-[15px] font-semibold leading-relaxed text-[#ff6b6b]/95 [text-shadow:0_0_20px_rgba(239,68,68,0.25)] sm:text-[16px]">
                {t("briefingUrgencyLine")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mx-auto mt-5 max-w-[28rem] rounded-2xl border border-[#BF953F]/40 bg-black/65 px-4 py-4 shadow-[0_0_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] sm:px-5 sm:py-5">
              <p className="text-center text-[clamp(17px,4.9vw,20px)] font-semibold leading-[1.7] text-[#FFFEF8] [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
                {t("briefingClosingBenefitFull")}
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-5 pb-6">
            <p
              className="whitespace-pre-line break-keep text-center text-[18px] font-bold leading-[1.55] text-[#FFCC4D] [text-shadow:0_0_22px_rgba(255,200,80,0.5),0_1px_5px_rgba(0,0,0,0.92)]"
              role="timer"
              aria-live="polite"
              aria-atomic="true"
            >
              {t("briefingCountdownLine", {
                duration: formatKoCountdownDuration(countdownSec),
              })}
            </p>

            <div className="relative mt-4">
              <span
                aria-hidden
                className="landing-cta-breathe-glow pointer-events-none absolute -inset-[10px] z-0 rounded-[1.6rem] opacity-80"
              />
              <button
                type="button"
                onClick={onCta}
                className="relative z-[1] w-full min-h-[3.5rem] overflow-hidden rounded-[1.35rem] border border-[rgba(212,175,55,0.65)] bg-white/[0.08] px-6 py-5 text-center shadow-[0_0_0_1px_rgba(212,175,55,0.55),0_0_28px_rgba(212,175,55,0.42),0_0_56px_rgba(191,149,63,0.22),inset_0_0_0_1px_rgba(212,175,55,0.18)] transition hover:-translate-y-px active:translate-y-0 sm:py-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[1.35rem]"
                >
                  <span className="briefing-cta-shine absolute -left-[25%] top-0 h-full w-[60%] bg-gradient-to-r from-transparent via-[#fffef6] via-45% to-transparent opacity-95 [box-shadow:0_0_28px_rgba(255,215,120,0.55)] mix-blend-overlay" />
                </span>
                <span className="relative z-10 block text-[clamp(20px,5.2vw,22px)] font-bold tracking-wide text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.85)]">
                  {t("briefingCta", { amount: amountStr })}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </RitualShell>
  );
}
