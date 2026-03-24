"use client";

import { toPng } from "html-to-image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { KAKAO_BANK_COPY_TEXT } from "@/lib/kakaoBankInfo";
import { FULL_PACKAGE_PRICE_WON } from "@/lib/ritualStorage";

import KakaoReportMarkdown from "./KakaoReportMarkdown";
import KakaoStage1ReportVisuals from "./KakaoStage1ReportVisuals";
import ReunionDeliveredReportSections from "./ReunionDeliveredReportSections";

export type ResultCardProps = {
  /**
   * `paid`는 부모만 설정. **서버 DB 입금 승인** 후에도 부모가 `true`로 올린다.
   * 브라우저 localStorage에 결제 완료를 저장하지 않는다.
   */
  isPaid: boolean;
  targetName?: string;
  previewMd: string | null;
  fullMd: string | null;
  analyzeError: string | null;
  fullFailureMessage?: string | null;
  paidPreviewError: boolean;
  onRetryFull?: () => void;
  retryBusy?: boolean;
  paidHasFull: boolean;
  canSubmit: boolean;
  /** 서버 `kakao_report_unlocks.session_id` 와 동일 */
  paymentSessionId?: string | null;
  /** `?admin=true` — 승인 버튼 노출 */
  isAdminMode?: boolean;
  /** 모달에서 「입금 완료」를 누른 뒤 */
  depositPending?: boolean;
  onDepositSubmitted?: () => void | Promise<void>;
  /** 관리자 승인 API 성공 시 부모가 `setPaid(true)` */
  onAdminUnlockSuccess?: () => void;
  /** analyze-chat — 감정 키워드 3개(로그 기반) */
  emotionKeywords?: string[];
  /** 키워드 폴백용 대화 일부 */
  chatLogSnippet?: string;
  /**
   * false면 `ReunionDeliveredReportSections`(고정 STEP1~3·달력·선톡 템플릿)를 숨기고
   * LLM이 생성한 마크다운만 표시 — 카카오 1단계 전용 리포트에 사용.
   */
  showDeliveredTemplate?: boolean;
  /** 브리핑 상세와 동일: 뇌 지도 + 9축 막대(대화·키워드로 높이 개인화). 2·3단계 고정 템플릿은 포함하지 않음. */
  showKakaoStage1Visuals?: boolean;
};

function ReportShell({ children }: { children: ReactNode }) {
  return (
    <div className="kakao-report-premium-shell kakao-report-premium-shell--mystic kakao-report-premium-shell--teaser">
      <div className="kakao-report-premium-shell__inner px-1 pt-2">{children}</div>
    </div>
  );
}

export default function ResultCard({
  isPaid,
  targetName = "",
  previewMd,
  fullMd,
  analyzeError,
  fullFailureMessage = null,
  paidPreviewError,
  onRetryFull,
  retryBusy,
  paidHasFull,
  canSubmit,
  paymentSessionId = null,
  isAdminMode = false,
  depositPending = false,
  onDepositSubmitted,
  onAdminUnlockSuccess,
  emotionKeywords = [],
  chatLogSnippet = "",
  showDeliveredTemplate = true,
  showKakaoStage1Visuals = false,
}: ResultCardProps) {
  const t = useTranslations("Ritual");
  const amount = FULL_PACKAGE_PRICE_WON.toLocaleString("ko-KR");
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminErr, setAdminErr] = useState<string | null>(null);
  const [saveImageBusy, setSaveImageBusy] = useState(false);
  const reportCaptureRef = useRef<HTMLDivElement>(null);
  /** 1단계 리포트: 스크롤을 항상 위(뇌 지도·막대 → 본문 순)부터 읽히게 */
  const reportScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2800);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  const safeFullMd = isPaid && fullMd ? fullMd : null;
  const showTeaserLock = Boolean(previewMd && !safeFullMd);
  const lockedUnpaid = Boolean(!isPaid && previewMd);

  useEffect(() => {
    if (!previewMd && !safeFullMd) return;
    const inner = reportScrollRef.current;
    if (inner) inner.scrollTop = 0;
  }, [previewMd, safeFullMd, showTeaserLock]);

  const targetSr = targetName?.trim();
  const whoPossessive = targetSr
    ? `${targetSr}의`
    : t("kakaoWhoPossessiveDefault");
  const payDecodeLabel = t("kakaoPayFullPackageCTA", { amount });

  /** 페이액션 등 외부 결제 URL — 없으면 무통장 모달 */
  const fullPackagePayUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_RITUAL_FULL_PACKAGE_PAY_URL?.trim();
    if (!raw) return null;
    const sid = paymentSessionId?.trim();
    try {
      const u = new URL(raw);
      if (sid) u.searchParams.set("session_id", sid);
      return u.toString();
    } catch {
      return sid
        ? `${raw}${raw.includes("?") ? "&" : "?"}session_id=${encodeURIComponent(sid)}`
        : raw;
    }
  }, [paymentSessionId]);

  const kakaoBrandingFootnotesEl = (
    <div
      className="mt-3 space-y-2 text-left text-[10px] leading-snug text-neutral-400"
      style={{ fontSize: "10px", lineHeight: 1.45 }}
    >
      <p className="break-words">{t("kakaoPayBrandingLine1")}</p>
      <p className="break-words">{t("kakaoPayBrandingLine2")}</p>
    </div>
  );

  const kakaoModalExtraLegalEl = (
    <div
      className="mt-3 space-y-2 text-left text-[10px] leading-snug text-neutral-500"
      style={{ fontSize: "10px", lineHeight: 1.45 }}
    >
      <p className="break-words">{t("kakaoPayLegalDepositDelay")}</p>
      <p className="break-words">{t("kakaoPayLegalReceiptRefund")}</p>
    </div>
  );

  const fullFetchBusy = Boolean(isPaid && previewMd && !fullMd && retryBusy);
  const showTopErrorBanner = Boolean(analyzeError && !paidPreviewError);

  const showAdminApprove =
    isAdminMode && Boolean(paymentSessionId?.trim());

  const copyBank = async () => {
    try {
      await navigator.clipboard.writeText(KAKAO_BANK_COPY_TEXT);
      setToastMsg(t("kakaoBankCopyToast"));
    } catch {
      setToastMsg(null);
    }
  };

  const saveSpiritImage = useCallback(async () => {
    const el = reportCaptureRef.current;
    if (!el || !safeFullMd) return;
    setSaveImageBusy(true);
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: "#0a0610",
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `mudang-report-${Date.now()}.png`,
        { type: "image/png" },
      );
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("kakaoReportShareTitle"),
        });
        setToastMsg(t("kakaoReportImageSharedToast"));
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        setToastMsg(t("kakaoReportImageSavedToast"));
      }
    } catch {
      setToastMsg(t("kakaoReportImageSaveFail"));
    } finally {
      setSaveImageBusy(false);
    }
  }, [safeFullMd, t]);

  const adminApprove = async () => {
    if (!paymentSessionId?.trim()) return;
    setAdminBusy(true);
    setAdminErr(null);
    try {
      const res = await fetch("/api/ritual/kakao-deposit/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: paymentSessionId.trim(),
        }),
      });
      if (!res.ok) {
        setAdminErr(t("kakaoAdminApproveFail"));
        return;
      }
      onAdminUnlockSuccess?.();
    } catch {
      setAdminErr(t("kakaoAdminApproveFail"));
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="kakao-result-mystic-shell relative mx-auto mt-8 max-w-3xl px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
    <div className="kakao-result-mystic kakao-result-mystic--lux kakao-result-readable-ui min-w-0 max-w-full rounded-2xl px-6 pb-8 pt-8 sm:px-7 sm:pb-10 sm:pt-9">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-danchung-gold/80">
        {t("kakaoReportEyebrow")}
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#FFFEF8]">
        {showTeaserLock ? t("kakaoFreePreviewResultTitle") : t("reportTitle")}
      </div>

      {showTopErrorBanner ? (
        <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-100/95">
          {analyzeError}
        </p>
      ) : null}

      <div
        ref={reportScrollRef}
        className={[
          "mt-4 overflow-visible pr-1",
          showTeaserLock ? "" : "max-h-[min(70vh,720px)] overflow-y-auto overflow-x-hidden",
        ].join(" ")}
      >
        {safeFullMd ? (
          <div className="kakao-result-full-unseal space-y-4">
            <div
              ref={reportCaptureRef}
              className="kakao-report-capture-root reunion-print-capture kakao-full-unseal-gold relative overflow-visible rounded-xl"
            >
              <div className="kakao-full-unseal-gold__mist" aria-hidden />
              <div className="relative z-[1] space-y-3">
                {showKakaoStage1Visuals ? (
                  <KakaoStage1ReportVisuals
                    variant="full"
                    emotionKeywords={emotionKeywords}
                    chatLogSnippet={chatLogSnippet}
                  />
                ) : null}
                {showDeliveredTemplate ? (
                  <ReunionDeliveredReportSections
                    variant="full"
                    targetName={targetSr}
                    emotionKeywords={emotionKeywords}
                    chatLogSnippet={chatLogSnippet}
                  />
                ) : null}
                <div
                  className="rounded-xl border border-danchung-gold/35 bg-gradient-to-r from-danchung-gold/15 via-purple-950/40 to-danchung-gold/10 px-4 py-3 shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                  role="status"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-danchung-gold">
                    {t("kakaoPaidUnlockBadge")}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#FFF8E7]/90">
                    {t("kakaoPaidUnlockSub")}
                  </p>
                </div>
                <div className="kakao-report-premium-shell kakao-report-premium-shell--mystic">
                  <div className="kakao-report-premium-shell__inner">
                    <KakaoReportMarkdown markdown={safeFullMd} variant="premium" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center px-1">
              <button
                type="button"
                disabled={saveImageBusy}
                className="kakao-report-spirit-keep-btn disabled:opacity-50"
                onClick={() => void saveSpiritImage()}
              >
                {saveImageBusy ? t("kakaoReportImageSaving") : t("kakaoReportSpiritKeep")}
              </button>
            </div>
          </div>
        ) : showTeaserLock && previewMd ? (
          <>
            <div
              className="relative overflow-visible px-1 pb-[min(52vh,22rem)] pt-6 sm:pb-[min(46vh,19rem)]"
              aria-label={payDecodeLabel}
            >
              {showKakaoStage1Visuals ? (
                <KakaoStage1ReportVisuals
                  variant="teaser"
                  emotionKeywords={emotionKeywords}
                  chatLogSnippet={chatLogSnippet}
                />
              ) : null}
              {showDeliveredTemplate ? (
                <ReunionDeliveredReportSections
                  variant="teaser"
                  targetName={targetSr}
                  emotionKeywords={emotionKeywords}
                  chatLogSnippet={chatLogSnippet}
                  onPdfTeaser={() => {
                    document
                      .getElementById("ritual-kakao-pay-anchor")
                      ?.scrollIntoView({ behavior: "smooth", block: "end" });
                  }}
                />
              ) : null}
              <div
                className={[
                  "kakao-result-lock-stack kakao-result-lock-stack--lux rounded-xl border-2 border-danchung-gold/45 bg-[#030108]",
                  showDeliveredTemplate ? "mt-5" : "mt-0",
                ].join(" ")}
              >
                {targetSr ? (
                  <p className="sr-only">
                    {t("kakaoResultTargetSr", { name: targetSr })}
                  </p>
                ) : null}
                <div className="kakao-result-lock-base pt-1">
                  <ReportShell>
                    <KakaoReportMarkdown
                      markdown={previewMd}
                      variant="premiumTeaser"
                    />
                  </ReportShell>
                </div>
                <div className="kakao-result-lock-backdrop-veil" aria-hidden />
                <div className="kakao-result-lock-peek absolute left-0 right-0 top-0 px-1 pt-1">
                  <ReportShell>
                    <KakaoReportMarkdown
                      markdown={previewMd}
                      variant="premiumTeaser"
                    />
                  </ReportShell>
                </div>
              </div>
            </div>

            <div
              id="ritual-kakao-pay-anchor"
              className="kakao-pay-floating-bar pointer-events-none fixed bottom-0 left-0 right-0 z-[95] border-t border-white/[0.07] bg-gradient-to-t from-black/92 via-black/72 to-transparent pt-10 backdrop-blur-[20px] supports-[backdrop-filter]:bg-black/55"
              style={{ WebkitBackdropFilter: "blur(20px)" }}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-lg px-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-1">
                <div className="relative overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[#050208]/75 p-[3px] shadow-[0_-16px_56px_rgba(0,0,0,0.65),0_8px_40px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[13px] opacity-[0.65]"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(252,238,168,0.14) 0%, transparent 42%, rgba(139,92,246,0.08) 100%)",
                    }}
                    aria-hidden
                  />
                  <span
                    className="kakao-pay-floating-shine pointer-events-none absolute -left-[20%] top-0 z-[2] h-full w-[55%]"
                    aria-hidden
                  />
                  <div className="relative z-[1] rounded-[13px] bg-[#06030d]/98 px-4 py-4 text-center sm:px-5 sm:py-5">
                    {lockedUnpaid ? (
                      depositPending ? (
                        <div className="kakao-deposit-mystic-wrap relative overflow-hidden rounded-[12px] px-1 py-2">
                          <div className="kakao-deposit-purple-smoke" aria-hidden />
                          <div
                            className="kakao-deposit-purple-smoke kakao-deposit-purple-smoke--2"
                            aria-hidden
                          />
                          <div
                            className="kakao-deposit-purple-smoke kakao-deposit-purple-smoke--3"
                            aria-hidden
                          />
                          <p className="relative z-10 break-keep px-1 text-[1.05rem] font-black leading-snug text-[#fceea8] drop-shadow-[0_0_18px_rgba(167,139,250,0.55)] sm:text-[1.15rem]">
                            {t("kakaoDepositSpiritsLine")}
                          </p>
                          <p className="relative z-10 mt-3 text-[0.95rem] leading-relaxed text-violet-200/85">
                            {t("kakaoDepositMistSub")}
                          </p>
                          {kakaoBrandingFootnotesEl}
                          <p className="relative z-10 mt-2 text-[0.72rem] leading-relaxed text-neutral-500/85">
                            {t("kakaoPaywallFinePrint")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="break-keep text-[1.05rem] font-black leading-snug text-[#fceea8] drop-shadow-[0_0_14px_rgba(212,175,55,0.45)] sm:text-[1.12rem]">
                            {t("kakaoPaywallPackageQuestion", {
                              whoPossessive,
                            })}
                          </p>
                          <p
                            className="mt-3 break-keep rounded-xl border border-danchung-gold/30 bg-danchung-gold/[0.12] px-3 py-2.5 text-[0.92rem] font-semibold leading-relaxed text-[#FFF8E7]/95"
                            role="status"
                          >
                            {t("paySocialProofLine")}
                          </p>
                          <p className="mt-3 break-keep text-center text-[0.88rem] font-bold leading-snug text-amber-200/95 [text-shadow:0_0_14px_rgba(251,191,36,0.35)]">
                            {t("payCtaUrgencyPulse")}
                          </p>
                          <button
                            type="button"
                            className="kakao-pay-cta-black-gold relative z-[3] mt-4 w-full overflow-hidden !min-h-[3.85rem] !rounded-xl !px-6 !py-4 !text-[1.05rem] !font-black !leading-tight sm:!text-[1.12rem]"
                            onClick={() => {
                              if (fullPackagePayUrl) {
                                window.location.href = fullPackagePayUrl;
                                return;
                              }
                              setBankModalOpen(true);
                            }}
                          >
                            <span
                              className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-xl"
                              aria-hidden
                            >
                              <span className="kakao-pay-floating-shine kakao-pay-floating-shine--btn absolute -left-[22%] top-0 h-full w-[55%] opacity-70 mix-blend-overlay" />
                            </span>
                            <span className="relative z-[2]">{payDecodeLabel}</span>
                          </button>
                          {kakaoBrandingFootnotesEl}
                          <p className="mt-2 text-[0.72rem] leading-relaxed text-neutral-500/85">
                            {t("kakaoPaywallFinePrint")}
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        {paidPreviewError ? (
                          <>
                            <p className="text-[1rem] font-bold leading-snug text-red-200/95 sm:text-[1.05rem]">
                              {t("kakaoErrorFullAfterPay")}
                            </p>
                            {fullFailureMessage ? (
                              <p
                                className="mt-2 max-h-24 overflow-y-auto break-words text-left text-[0.8rem] leading-relaxed text-white/50"
                                title={fullFailureMessage}
                              >
                                {fullFailureMessage}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              disabled={retryBusy}
                              className="kakao-pay-cta-black-gold mt-4 w-full !min-h-[3.35rem] !rounded-xl !px-5 !py-3 !text-[0.98rem] !font-black disabled:opacity-40 sm:!text-[1.05rem]"
                              onClick={() => onRetryFull?.()}
                            >
                              {retryBusy
                                ? t("kakaoLoadingFull")
                                : t("kakaoRetryFullAfterPay")}
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-[1.05rem] font-black leading-snug text-[#fceea8] drop-shadow-[0_0_14px_rgba(212,175,55,0.45)] sm:text-[1.1rem]">
                              {t("kakaoFullDecodeLoadingTitle")}
                            </p>
                            <p className="mt-3 text-[0.95rem] leading-relaxed text-danchung-gold/88">
                              {t("kakaoPayWaitingShaman")}
                            </p>
                            <p className="mt-2 text-[0.88rem] leading-relaxed text-danchung-gold/75">
                              {fullFetchBusy
                                ? t("kakaoFullDecodeLoadingSub")
                                : t("kakaoFullDecodeWaiting")}
                            </p>
                            <div className="mt-4 flex justify-center">
                              <span className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-danchung-gold/30 border-t-danchung-gold" />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {showAdminApprove ? (
                  <div className="mt-2 px-0.5">
                    {adminErr ? (
                      <p className="mb-2 text-center text-[0.85rem] text-red-300/95">
                        {adminErr}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={adminBusy}
                      className="w-full rounded-xl border border-amber-500/55 bg-gradient-to-b from-amber-950/70 to-black/50 py-3 text-center text-[0.82rem] font-bold leading-snug text-amber-100/95 shadow-[0_0_24px_rgba(245,158,11,0.18)] backdrop-blur-sm disabled:opacity-50 sm:text-[0.88rem]"
                      onClick={() => void adminApprove()}
                    >
                      {adminBusy
                        ? t("kakaoAdminApproveBusy")
                        : t("kakaoAdminApproveButton")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {toastMsg ? (
        <div
          className={[
            "fixed left-1/2 z-[200] max-w-[min(90vw,22rem)] -translate-x-1/2 rounded-xl border border-danchung-gold/40 bg-[#0a0610]/96 px-4 py-3 text-center text-[0.95rem] leading-relaxed text-[#fceea8] shadow-[0_0_36px_rgba(0,0,0,0.65)] backdrop-blur-md",
            showTeaserLock
              ? "bottom-[calc(10.5rem+env(safe-area-inset-bottom))]"
              : "bottom-8",
          ].join(" ")}
          role="status"
        >
          {toastMsg}
        </div>
      ) : null}

      {bankModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kakao-bank-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-visible rounded-2xl border-2 border-danchung-gold/50 bg-[#0a0610] px-6 pb-6 pt-8 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
            <h2
              id="kakao-bank-modal-title"
              className="text-center font-serif text-xl font-bold text-[#fceea8]"
            >
              {t("kakaoBankModalTitle")}
            </h2>

            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-danchung-gold/35 bg-black/35 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xl font-bold leading-snug tracking-tight text-[#fceea8] sm:text-left sm:text-2xl">
                {KAKAO_BANK_COPY_TEXT}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-xl border border-danchung-gold/55 bg-danchung-gold/20 px-5 py-3 text-base font-black text-danchung-gold hover:bg-danchung-gold/30"
                onClick={() => void copyBank()}
              >
                {t("kakaoBankCopyButton")}
              </button>
            </div>

            <p className="mt-5 whitespace-pre-line text-center text-sm leading-relaxed text-white/85">
              {t("kakaoBankModalBody", { amount })}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="kakao-pay-cta-black-gold w-full !min-h-[3.25rem] !rounded-xl !px-6 !py-3 !text-[15px] !font-black"
                onClick={() => {
                  setBankModalOpen(false);
                  void onDepositSubmitted?.();
                }}
              >
                {t("kakaoDepositCompleteButton")}
              </button>
              {kakaoBrandingFootnotesEl}
              {kakaoModalExtraLegalEl}
              <button
                type="button"
                className="w-full rounded-xl border border-white/20 py-3 text-sm text-white/75 hover:bg-white/5"
                onClick={() => setBankModalOpen(false)}
              >
                {t("kakaoBankModalClose")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
