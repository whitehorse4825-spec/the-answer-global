"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { mergeEmotionKeywords } from "@/lib/kakaoReportSignals";
import { RITUAL_PREVIEW_CALENDAR_FATE_DAY } from "@/lib/ritualPreviewCalendar";
import {
  DELIVERED_BAR_DEEP_ANALYSIS,
  DELIVERED_CALENDAR_ADVICE,
  DELIVERED_EMOTION_BARS,
  DELIVERED_OPENERS,
  DELIVERED_REPLY_PLAYBOOK,
  DELIVERED_STAGE1_SUBSECTIONS,
  DELIVERED_STAGE2_SUBSECTIONS,
  DELIVERED_STAGE3_SUBSECTIONS,
} from "@/lib/reunionDeliveredReportKo";
import {
  BrainMapSvg,
  EmotionBarChartPremium,
  RitualPremiumCalendar,
} from "@/components/ritual/premiumReportVisuals";

type Variant = "teaser" | "full";

export type ReunionDeliveredReportSectionsProps = {
  variant: Variant;
  targetName?: string;
  emotionKeywords?: string[];
  chatLogSnippet?: string;
  /** 티저에서 PDF/인쇄 시도 시 (예: 결제 영역으로 스크롤) */
  onPdfTeaser?: () => void;
};

function GoldSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#120a18] via-[#08050c] to-[#030204] shadow-[0_0_48px_rgba(168,85,247,0.15)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-3">
        <h3
          className="kakao-report-heading-text font-bold text-[#BF953F] [text-shadow:0_0_12px_rgba(191,149,63,0.35)]"
        >
          {title}
        </h3>
        {badge ? (
          <span className="rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-200/90">
            {badge}
          </span>
        ) : null}
      </header>
      <div className="px-4 py-5">{children}</div>
    </article>
  );
}

function SubBlock({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-xl border border-[#BF953F]/25 bg-black/35 p-3">
      {kicker ? (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
          {kicker}
        </p>
      ) : null}
      <h4 className="kakao-report-heading-text mt-1 font-bold text-[#F1E5AC]/95">
        {title}
      </h4>
      <p className="kakao-report-body-text mt-2 whitespace-pre-line text-white/78">
        {body}
      </p>
    </section>
  );
}

/** 무료 티저: 본문은 블러 + 결제 유도 (backdrop-filter) */
function TeaserSealedOverlay({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="relative mt-2 overflow-hidden rounded-xl border border-[#BF953F]/35 bg-black/25">
      <div className="pointer-events-none select-none blur-[8px] opacity-[0.38] saturate-[0.65]">
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 px-4 py-5 text-center backdrop-blur-[10px]"
        style={{ WebkitBackdropFilter: "blur(10px)" }}
      >
        <span className="text-xl leading-none" aria-hidden>
          🔒
        </span>
        <p className="kakao-report-body-text max-w-[16rem] font-black leading-snug text-[#F1E5AC] [text-shadow:0_0_14px_rgba(191,149,63,0.5)]">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function ReunionDeliveredReportSections({
  variant,
  targetName,
  emotionKeywords = [],
  chatLogSnippet = "",
  onPdfTeaser,
}: ReunionDeliveredReportSectionsProps) {
  const t = useTranslations("Ritual");
  const [deepOpen, setDeepOpen] = useState(true);
  const accordionId = useId();

  const displayKeywords = useMemo(
    () => mergeEmotionKeywords(emotionKeywords, chatLogSnippet, 3),
    [emotionKeywords, chatLogSnippet],
  );

  const isTeaser = variant === "teaser";
  const sealCta = t("teaserPaywallSealCta");

  /** 샘플 달력 1–28일 — '오늘'만 강조, 불꽃 날짜(17)는 티저에서 ? */
  const [calendarTodayDom] = useState(() => new Date().getDate());
  const todayInSampleGrid = Math.min(Math.max(calendarTodayDom, 1), 28);

  const handlePdf = useCallback(() => {
    if (variant === "teaser") {
      onPdfTeaser?.();
      return;
    }
    window.print();
  }, [variant, onPdfTeaser]);

  const nameBit = targetName?.trim()
    ? `${targetName.trim()}의 `
    : "";

  return (
    <div className="reunion-delivered-report reunion-delivered-report--readable space-y-5 leading-[1.78] print:space-y-4">
      <div className="rounded-xl border border-[#BF953F]/40 bg-gradient-to-r from-[#BF953F]/12 via-purple-950/35 to-[#BF953F]/10 px-4 py-3 shadow-[0_0_28px_rgba(191,149,63,0.18)]">
        <p className="kakao-report-heading-text text-center font-black uppercase tracking-[0.18em] text-[#BF953F] [text-shadow:0_0_14px_rgba(191,149,63,0.35)]">
          {t("deliveredReportVolumeBadge")}
        </p>
        <p className="kakao-report-body-text mt-2 text-center leading-relaxed text-[#FFF8E7]/88">
          {isTeaser ? t("deliveredTeaserReportSubline") : t("deliveredReportSubline")}
        </p>
        {isTeaser ? (
          <p className="mt-2 text-center text-[10px] leading-relaxed text-danchung-gold/65">
            {t("deliveredTeaserWatermark")}
          </p>
        ) : null}
      </div>

      {/* [1단계] 천기누설 */}
      <GoldSection title={t("productKakaoTitle")} badge="STEP 1">
        <div className="space-y-4">
          {isTeaser ? (
            <TeaserSealedOverlay label={sealCta}>
              <div className="space-y-3 p-2">
                <SubBlock
                  kicker="SECTION 1-1"
                  title={DELIVERED_STAGE1_SUBSECTIONS.pulseTitle}
                  body={DELIVERED_STAGE1_SUBSECTIONS.pulseBody}
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-300/80">
                    {t("briefingBrainMapLabel")}
                  </p>
                  <div className="mt-2">
                    <BrainMapSvg />
                  </div>
                </div>
              </div>
            </TeaserSealedOverlay>
          ) : (
            <>
              <SubBlock
                kicker="SECTION 1-1"
                title={DELIVERED_STAGE1_SUBSECTIONS.pulseTitle}
                body={DELIVERED_STAGE1_SUBSECTIONS.pulseBody}
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-300/80">
                  {t("briefingBrainMapLabel")}
                </p>
                <div className="mt-2">
                  <BrainMapSvg />
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300/85">
              {t("briefingEmotionGraphLabel")}
            </p>
            <p className="kakao-report-body-text mt-1 font-medium text-[#F1E5AC]/80">
              {isTeaser
                ? t("teaserStage1BarsHook")
                : `${nameBit}${t("deliveredEmotionGraphDynamic", {
                    k1: displayKeywords[0] ?? "—",
                    k2: displayKeywords[1] ?? "—",
                    k3: displayKeywords[2] ?? "—",
                  })}`}
            </p>
            <EmotionBarChartPremium
              bars={DELIVERED_EMOTION_BARS}
              className="mt-2 !border-rose-500/20 !bg-black/50"
            />
            <p className="mt-2 text-[9px] leading-relaxed text-white/45">
              {DELIVERED_EMOTION_BARS.map((b) => b.label).join(" · ")}
            </p>
          </div>

          {isTeaser ? (
            <>
              <div>
                <p className="kakao-report-heading-text font-semibold text-[#F1E5AC]/95">
                  {t("deliveredUnconsciousLeadDynamic")}
                </p>
                <div className="kakao-keyword-row mt-2">
                  {displayKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="kakao-keyword-pill kakao-report-body-text rounded-md border border-[#BF953F]/55 bg-[#BF953F]/10 px-2.5 py-1 font-bold text-[#BF953F] shadow-[0_0_12px_rgba(191,149,63,0.2)]"
                    >
                      [{kw}]
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-danchung-gold/70">
                  {t("teaserKeywordHookNote")}
                </p>
              </div>
              <TeaserSealedOverlay label={sealCta}>
                <div className="space-y-3 p-2">
                  <SubBlock
                    kicker="SECTION 1-2"
                    title={DELIVERED_STAGE1_SUBSECTIONS.crossTitle}
                    body={`${DELIVERED_STAGE1_SUBSECTIONS.crossLead}\n\n${DELIVERED_STAGE1_SUBSECTIONS.crossBody}`}
                  />
                  <p className="text-[10px] text-white/50">막대별 심층 해설 ···</p>
                </div>
              </TeaserSealedOverlay>
            </>
          ) : (
            <>
              <div>
                <p className="kakao-report-heading-text font-semibold text-[#F1E5AC]/95">
                  {t("deliveredUnconsciousLeadDynamic")}
                </p>
                <div className="kakao-keyword-row mt-2">
                  {displayKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="kakao-keyword-pill kakao-report-body-text rounded-md border border-[#BF953F]/55 bg-[#BF953F]/10 px-2.5 py-1 font-bold text-[#BF953F] shadow-[0_0_12px_rgba(191,149,63,0.2)]"
                    >
                      [{kw}]
                    </span>
                  ))}
                </div>
              </div>

              <SubBlock
                kicker="SECTION 1-2"
                title={DELIVERED_STAGE1_SUBSECTIONS.crossTitle}
                body={`${DELIVERED_STAGE1_SUBSECTIONS.crossLead}\n\n${DELIVERED_STAGE1_SUBSECTIONS.crossBody}`}
              />

              <div className="rounded-xl border border-[#BF953F]/30 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  id={`${accordionId}-trigger`}
                  aria-expanded={deepOpen}
                  aria-controls={`${accordionId}-panel`}
                  className="kakao-report-heading-text flex w-full items-center justify-between gap-2 px-3 py-3.5 text-left font-bold text-[#F1E5AC] transition hover:bg-white/[0.04]"
                  onClick={() => setDeepOpen((v) => !v)}
                >
                  <span className="[text-shadow:0_0_10px_rgba(191,149,63,0.35)]">
                    {t("deliveredDeepAccordion")}
                  </span>
                  <span className="text-danchung-gold/80">
                    {deepOpen ? "▲" : "▼"}
                  </span>
                </button>
                {deepOpen ? (
                  <div
                    id={`${accordionId}-panel`}
                    role="region"
                    aria-labelledby={`${accordionId}-trigger`}
                    className="space-y-4 border-t border-white/10 px-3 pb-5 pt-3"
                  >
                    {DELIVERED_EMOTION_BARS.map((b) => (
                      <div
                        key={b.label}
                        className="min-h-[6.5rem] rounded-lg border border-white/10 border-l-2 border-l-rose-400/35 bg-black/45 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                      >
                        <p className="kakao-report-heading-text font-bold text-rose-200/90">
                          막대 · {b.label}
                        </p>
                        <p className="kakao-report-body-text mt-3 whitespace-pre-line leading-[2] text-white/80">
                          {DELIVERED_BAR_DEEP_ANALYSIS[b.label] ?? ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </GoldSection>

      {/* [2단계] 운명점지 캘린더 */}
      <GoldSection title={t("deliveredStage2Headline")} badge="STEP 2">
        <div className="space-y-4">
          {isTeaser ? (
            <TeaserSealedOverlay label={sealCta}>
              <div className="p-2">
                <SubBlock
                  kicker="SECTION 2-1"
                  title={DELIVERED_STAGE2_SUBSECTIONS.overviewTitle}
                  body={DELIVERED_STAGE2_SUBSECTIONS.overviewBody}
                />
              </div>
            </TeaserSealedOverlay>
          ) : (
            <SubBlock
              kicker="SECTION 2-1"
              title={DELIVERED_STAGE2_SUBSECTIONS.overviewTitle}
              body={DELIVERED_STAGE2_SUBSECTIONS.overviewBody}
            />
          )}

          <RitualPremiumCalendar
            mode={isTeaser ? "teaser" : "full"}
            todayDom={todayInSampleGrid}
            fateDay={RITUAL_PREVIEW_CALENDAR_FATE_DAY}
            caption={
              isTeaser ? t("teaserCalendarCaption") : t("briefingFatedDayTeaser")
            }
          />

          {isTeaser ? (
            <TeaserSealedOverlay label={sealCta}>
              <div className="space-y-3 p-2">
                <SubBlock
                  kicker="SECTION 2-2"
                  title={DELIVERED_STAGE2_SUBSECTIONS.fireTitle}
                  body={DELIVERED_STAGE2_SUBSECTIONS.fireBody}
                />
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                    SECTION 2-3 · 날짜별 행동 지침
                  </p>
                  {DELIVERED_CALENDAR_ADVICE.slice(0, 2).map((row) => (
                    <div
                      key={row.day}
                      className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5"
                    >
                      <p className="kakao-report-heading-text font-bold text-[#F1E5AC]/95">
                        {row.day}일 — {row.tag}
                      </p>
                      <p className="kakao-report-body-text mt-1.5 leading-[1.8] text-white/75">
                        {row.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TeaserSealedOverlay>
          ) : (
            <>
              <SubBlock
                kicker="SECTION 2-2"
                title={DELIVERED_STAGE2_SUBSECTIONS.fireTitle}
                body={DELIVERED_STAGE2_SUBSECTIONS.fireBody}
              />

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                  SECTION 2-3 · 날짜별 행동 지침
                </p>
                {DELIVERED_CALENDAR_ADVICE.map((row) => (
                  <div
                    key={row.day}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5"
                  >
                    <p className="kakao-report-heading-text font-bold text-[#F1E5AC]/95">
                      {row.day}일 — {row.tag}
                    </p>
                    <p className="kakao-report-body-text mt-1.5 leading-[1.8] text-white/75">
                      {row.body}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </GoldSection>

      {/* [3단계] 영혼빙의 */}
      <GoldSection title={t("deliveredStage3Headline")} badge="STEP 3">
        <div className="space-y-4">
          {isTeaser ? (
            <TeaserSealedOverlay label={sealCta}>
              <div className="p-2">
                <SubBlock
                  kicker="SECTION 3-1"
                  title={DELIVERED_STAGE3_SUBSECTIONS.toneTitle}
                  body={DELIVERED_STAGE3_SUBSECTIONS.toneBody}
                />
              </div>
            </TeaserSealedOverlay>
          ) : (
            <SubBlock
              kicker="SECTION 3-1"
              title={DELIVERED_STAGE3_SUBSECTIONS.toneTitle}
              body={DELIVERED_STAGE3_SUBSECTIONS.toneBody}
            />
          )}

          {isTeaser ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                SECTION 3-2 · {t("deliveredOpenerBlockTitle")}
              </p>
              <p className="kakao-report-body-text mt-2 leading-relaxed text-[#F1E5AC]/85">
                {t("teaserOpenerPeekIntro")}
              </p>
              <div className="mt-2 rounded-lg border border-[#BF953F]/28 bg-black/45 p-3">
                <p className="kakao-report-heading-text font-bold text-[#BF953F]">
                  {DELIVERED_OPENERS[0]?.title ?? ""}
                </p>
                <p className="kakao-sns-bubble-text mt-2 rounded-md border border-white/10 bg-[#1a1520]/90 px-3 py-2 leading-relaxed text-[#FFF8E7]/92">
                  「{t("teaserOpenerLinePeek")}」
                  <span className="select-none text-violet-300/50 blur-[3px]">
                    ████
                  </span>
                </p>
              </div>
              <TeaserSealedOverlay label={sealCta}>
                <div className="space-y-3 p-2">
                  {DELIVERED_OPENERS.map((o) => (
                    <div
                      key={o.title}
                      className="rounded-lg border border-[#BF953F]/28 bg-black/45 p-3"
                    >
                      <p className="kakao-report-heading-text font-bold text-[#BF953F]">
                        {o.title}
                      </p>
                      <p className="kakao-sns-bubble-text mt-2 text-white/70">
                        「{o.line}」
                      </p>
                    </div>
                  ))}
                </div>
              </TeaserSealedOverlay>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                SECTION 3-2 · {t("deliveredOpenerBlockTitle")}
              </p>
              <div className="mt-2 space-y-3">
                {DELIVERED_OPENERS.map((o) => (
                  <div
                    key={o.title}
                    className="rounded-lg border border-[#BF953F]/28 bg-black/45 p-3"
                  >
                    <p className="kakao-report-heading-text font-bold text-[#BF953F]">
                      {o.title}
                    </p>
                    <p className="kakao-sns-bubble-text mt-2 rounded-md border border-white/10 bg-[#1a1520]/90 px-3 py-2 leading-relaxed text-[#FFF8E7]/92">
                      「{o.line}」
                    </p>
                    <p className="kakao-report-body-text mt-2 whitespace-pre-line leading-[1.85] text-white/76">
                      {o.manual}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isTeaser ? (
            <TeaserSealedOverlay label={sealCta}>
              <div className="space-y-2 p-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                  SECTION 3-3 · {t("deliveredReplyPlaybookTitle")}
                </p>
                {DELIVERED_REPLY_PLAYBOOK.slice(0, 2).map((row) => (
                  <div
                    key={row.situation}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5"
                  >
                    <p className="kakao-report-heading-text font-bold text-violet-200/90">
                      상황: {row.situation}
                    </p>
                  </div>
                ))}
              </div>
            </TeaserSealedOverlay>
          ) : (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danchung-gold/75">
                SECTION 3-3 · {t("deliveredReplyPlaybookTitle")}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/50">
                {DELIVERED_STAGE3_SUBSECTIONS.playbookIntro}
              </p>
              <div className="mt-3 space-y-2">
                {DELIVERED_REPLY_PLAYBOOK.map((row) => (
                  <div
                    key={row.situation}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5"
                  >
                    <p className="kakao-report-heading-text font-bold text-violet-200/90">
                      상황: {row.situation}
                    </p>
                    <p className="kakao-report-body-text mt-1.5 leading-[1.8] text-emerald-200/85">
                      ✓ {row.do}
                    </p>
                    <p className="kakao-report-body-text mt-1 leading-[1.8] text-red-200/75">
                      ✕ {row.dont}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-[#b2b2b2]/95 p-2">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
              <div className="flex items-center gap-2 border-b border-black/5 bg-[#FEE500] px-3 py-2.5">
                <span className="text-lg text-black/70" aria-hidden>
                  ←
                </span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600" />
                <div className="min-w-0 flex-1">
                  <p className="kakao-sns-bubble-text truncate font-bold text-black">
                    {t("briefingChatSampleName")}
                  </p>
                </div>
              </div>
                <div className="space-y-2 bg-[#b2c4d9] p-3">
                <div className="kakao-sns-bubble-text ml-auto max-w-[85%] rounded-lg bg-[#FEE500] px-3 py-2 text-black shadow-sm">
                  잘 지냈어?
                </div>
                <div className="kakao-sns-bubble-text max-w-[85%] rounded-lg bg-white px-3 py-2 leading-relaxed text-black shadow-sm">
                  {isTeaser ? (
                    <>
                      <span className="font-medium">{t("teaserChatOpponentPeek")}</span>
                      <span
                        className="select-none text-black/35 blur-[2.5px]"
                        aria-hidden
                      >
                        {" "}
                        ··· ████ ···
                      </span>
                    </>
                  ) : (
                    t("briefingChatSampleLine")
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-black/55">
              {isTeaser
                ? t("teaserChatSimulationFootnote")
                : "빙의 시뮬레이션 — 말투·호흡만 참고하고, 그대로 복붙하지 말고 너희 사전으로 갈아 끼워라."}
            </p>
          </div>
        </div>
      </GoldSection>

      <div className="flex flex-col items-center gap-3 pb-2">
        {isTeaser ? (
          <div
            className="w-full max-w-md rounded-2xl border-2 border-[#BF953F]/45 bg-gradient-to-b from-[#140a12]/95 via-black/80 to-[#060308] px-4 py-5 text-center shadow-[0_0_40px_rgba(168,85,247,0.14),inset_0_1px_0_rgba(255,248,220,0.06)] print:hidden"
            role="status"
          >
            <span className="text-3xl leading-none" aria-hidden>
              🔒
            </span>
            <p className="mt-3 text-[1.02rem] font-black leading-snug tracking-tight text-[#F1E5AC] [text-shadow:0_0_18px_rgba(191,149,63,0.4)] sm:text-[1.08rem]">
              {t("deliveredPdfLockedTeaserTitle")}
            </p>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[#FFF8E7]/78 sm:text-[0.98rem]">
              {t("deliveredPdfLockedTeaserSub")}
            </p>
            <p className="mt-4 rounded-xl border border-danchung-gold/35 bg-danchung-gold/[0.1] px-3 py-2.5 text-[0.88rem] font-bold leading-relaxed text-danchung-gold/95 sm:text-[0.92rem]">
              {t("deliveredPdfLockedTeaserBadge")}
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="kakao-report-spirit-keep-btn max-w-md print:hidden"
              onClick={() => handlePdf()}
            >
              {t("deliveredPdfButton")}
            </button>
            <p className="max-w-md text-center text-[0.82rem] leading-relaxed text-danchung-gold/65 print:hidden sm:text-[0.88rem]">
              {t("deliveredPdfPrintHint")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
