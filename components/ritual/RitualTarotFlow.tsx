"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { readKakaoAnalysisDraft } from "@/lib/kakaoPayResumeDraft";
import { koreanVocativeCall } from "@/lib/koreanVocative";
import {
  getRitualPreviewCalendarTodayDom,
  RITUAL_PREVIEW_CALENDAR_FATE_DAY,
} from "@/lib/ritualPreviewCalendar";
import { readTarotStage1Bridge } from "@/lib/tarotStage1Bridge";
import { shouldMarkRitualPaidFromSearchParams } from "@/lib/ritualPaymentUrl";
import {
  isRitualPaid,
  readFullPackagePortoneUnlocked,
  readKakaoTargetDisplayName,
  readRitualIntake,
} from "@/lib/ritualStorage";
import { normalizePlainTarotLinebreaks } from "@/lib/ritualReportLinebreaks";
import { shuffleDeck, TAROT_DECK_78, type TarotCard } from "@/lib/tarotDeck";

import KakaoReportMarkdown from "./KakaoReportMarkdown";
import RitualPayButton from "./RitualPayButton";
import RitualShell from "./RitualShell";

type Props = { locale: string };

export default function RitualTarotFlow({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [paid, setPaid] = useState(false);
  const [callName, setCallName] = useState("");
  const [phase, setPhase] = useState<"shuffle" | "pick" | "loading" | "reading">(
    "shuffle",
  );
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [picked, setPicked] = useState<TarotCard[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [readingError, setReadingError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveImageBusy, setSaveImageBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const tarotCaptureRef = useRef<HTMLDivElement>(null);

  const readingFormatted = useMemo(
    () => (reading ? normalizePlainTarotLinebreaks(reading) : ""),
    [reading],
  );

  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 2800);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  const saveTarotImage = useCallback(async () => {
    const el = tarotCaptureRef.current;
    if (!el || !readingFormatted) return;
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
        `mudang-tarot-${Date.now()}.png`,
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
  }, [readingFormatted, t]);
  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
    setPaid(isRitualPaid("tarot") || readFullPackagePortoneUnlocked());
  }, [locale, router]);

  useEffect(() => {
    if (!isClient) return;
    if (shouldMarkRitualPaidFromSearchParams(searchParams)) {
      setPaid(true);
      router.replace(`/${locale}/ritual/tarot`);
    }
  }, [isClient, searchParams, router, locale]);

  useEffect(() => {
    if (!paid || phase !== "shuffle" || deck.length > 0) return;
    const t0 = window.setTimeout(() => {
      setDeck(shuffleDeck(TAROT_DECK_78, Date.now()));
      setPhase("pick");
    }, 2800);
    return () => window.clearTimeout(t0);
  }, [paid, phase, deck.length]);

  const pickCard = (c: TarotCard) => {
    if (picked.length >= 3 || picked.some((p) => p.id === c.id)) return;
    const next = [...picked, c];
    setPicked(next);
    if (next.length === 3) {
      setPhase("loading");
      void finalizeReading(next);
    }
  };

  /** API 페이로드 과대 시 토큰·지연 증가 → 타로 전용으로 상한 축소 */
  const TAROT_CONTEXT_CAP = 4500;

  const finalizeReading = async (cards: TarotCard[]) => {
    setBusy(true);
    try {
      const intake = readRitualIntake();
      const draft = readKakaoAnalysisDraft();
      const bridge = readTarotStage1Bridge();
      const targetName =
        draft?.payload?.targetName?.trim() ||
        bridge?.targetName?.trim() ||
        readKakaoTargetDisplayName() ||
        undefined;

      const chatSnippet =
        (draft?.payload?.text ?? bridge?.chatSnippet ?? "")
          .trim()
          .slice(0, TAROT_CONTEXT_CAP);
      const stage1PreviewExcerpt = (
        draft?.previewMd ?? bridge?.stage1PreviewExcerpt ??
        ""
      ).slice(0, TAROT_CONTEXT_CAP);
      const emotionKeywords =
        draft?.emotionKeywords ?? bridge?.emotionKeywords;
      const selfBubbleColorHint =
        draft?.payload?.selfBubbleColorHint?.trim() ||
        bridge?.selfBubbleColorHint?.trim() ||
        undefined;
      const otherBubbleColorHint =
        draft?.payload?.otherBubbleColorHint?.trim() ||
        bridge?.otherBubbleColorHint?.trim() ||
        undefined;

      const previewCalendarTodayDom =
        typeof bridge?.previewCalendarTodayDom === "number"
          ? bridge.previewCalendarTodayDom
          : getRitualPreviewCalendarTodayDom();
      const previewCalendarFateDay =
        typeof bridge?.previewCalendarFateDay === "number"
          ? bridge.previewCalendarFateDay
          : RITUAL_PREVIEW_CALENDAR_FATE_DAY;

      const res = await fetch("/api/ritual/tarot-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: cards.map((c) => c.nameKo),
          birthDate: intake?.birthDate,
          birthTime: intake?.birthTime,
          birthTimeUnknown: intake?.birthTimeUnknown,
          calendar: intake?.calendar,
          gender: intake?.gender,
          relation: intake?.relation,
          userName: intake?.userName,
          targetName,
          selfBubbleColorHint,
          otherBubbleColorHint,
          emotionKeywords,
          chatSnippet: chatSnippet || undefined,
          stage1PreviewExcerpt: stage1PreviewExcerpt || undefined,
          previewCalendarTodayDom,
          previewCalendarFateDay,
        }),
      });
      const data = (await res.json()) as { reading?: string; message?: string };
      if (!res.ok) {
        setReadingError(true);
        setReading(
          data.message ??
            "점사를 불러오지 못했다. 잠시 후 다시 뽑거나 네트워크를 확인하거라.",
        );
      } else {
        setReadingError(false);
        setReading(data.reading ?? "");
      }
      setPhase("reading");
    } catch {
      setReadingError(true);
      setReading(
        "신령님 쪽 선이 잠깐 꼬였다. 잠시 후 카드를 다시 고르거나 페이지를 새로고침하거라.",
      );
      setPhase("reading");
    } finally {
      setBusy(false);
    }
  };

  if (!isClient || !callName) {
    return (
      <RitualShell>
        <div className="h-56 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  return (
    <RitualShell>
      <Link
        href={`/${locale}/ritual/menu?stay=1`}
        className="mb-6 inline-block text-sm text-danchung-gold/75"
      >
        ← {t("backMenu")}
      </Link>

      <h1 className="text-center font-serif text-xl font-bold text-[#FFF8E7]">
        {t("tarotTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-danchung-gold/85">
        {t("tarotLead", { name: callName })}
      </p>

      {!paid ? (
        <div className="mt-10 space-y-4">
          <p className="text-center text-xs text-white/55">{t("tarotPayHint")}</p>
          <RitualPayButton
            locale={locale}
            product="tarot"
            orderName={t("orderNameTarot")}
            label={t("payButton")}
          />
        </div>
      ) : phase === "shuffle" ? (
        <div className="mt-16 flex flex-col items-center">
          <div
            className="relative h-44 w-32 animate-[spin_2.8s_ease-in-out_infinite]"
            style={{ transformStyle: "preserve-3d" as const }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute left-0 top-0 h-44 w-32 rounded-lg border-2 border-danchung-gold/50 bg-gradient-to-b from-[#1a1520] to-black shadow-lg"
                style={{
                  transform: `translateY(${-i * 2}px) rotate(${i * 3}deg)`,
                  opacity: 1 - i * 0.12,
                }}
              />
            ))}
          </div>
          <p className="mt-8 animate-pulse text-sm text-danchung-gold/90">
            {t("tarotShuffling")}
          </p>
        </div>
      ) : phase === "pick" ? (
        <div className="mt-8">
          <p className="text-center text-xs text-white/60">
            {t("tarotPickHint", { n: picked.length })}
          </p>
          <div className="mt-4 max-h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex flex-wrap justify-center gap-1.5">
              {deck.map((c) => {
                const selected = picked.some((p) => p.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={selected || picked.length >= 3 || busy}
                    onClick={() => pickCard(c)}
                    className={`flex h-[4.5rem] w-11 shrink-0 items-center justify-center rounded-md border px-0.5 text-[9px] leading-tight ${
                      selected
                        ? "border-danchung-gold bg-danchung-gold/20 text-[#FFF8E7]"
                        : "border-white/20 bg-black/50 text-white/70 hover:border-danchung-gold/50"
                    }`}
                  >
                    {selected ? c.nameKo : "🂠"}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-white/40">
            {t("tarotDeckNote")}
          </p>
        </div>
      ) : phase === "loading" ? (
        <div className="mt-12 flex min-h-[min(42vh,320px)] flex-col items-center justify-center rounded-2xl border border-danchung-gold/20 bg-black/40 px-6 py-10">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-danchung-gold/25 border-t-danchung-gold"
            aria-hidden
          />
          <p className="mt-6 text-center text-sm font-semibold text-[#FFF8E7]">
            {t("tarotReadingLoadingTitle")}
          </p>
          <p className="mt-2 max-w-sm text-center text-xs leading-relaxed text-white/55">
            {t("tarotReadingLoadingSub")}
          </p>
          <p className="mt-4 text-center text-[11px] text-danchung-gold/75">
            {t("tarotReadingWait")}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div
            ref={tarotCaptureRef}
            className="kakao-report-capture-root reunion-print-capture rounded-2xl border border-danchung-gold/25 bg-black/50 p-5"
          >
            <div className="text-xs font-semibold text-danchung-gold">
              {t("tarotReadingTitle")}
            </div>
            <div className="tarot-stage2-reading mt-4 text-[#FFF8E7]/90">
              <KakaoReportMarkdown
                markdown={readingFormatted}
                className="!text-[#FFF8E7]/90 [&_.kakao-report-md]:!text-[#FFF8E7]/90"
              />
            </div>
          </div>
          {reading && !readingError ? (
            <div className="flex justify-center px-1">
              <button
                type="button"
                disabled={saveImageBusy}
                className="kakao-report-spirit-keep-btn disabled:opacity-50"
                onClick={() => void saveTarotImage()}
              >
                {saveImageBusy ? t("kakaoReportImageSaving") : t("kakaoReportSpiritKeep")}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {paid && phase === "reading" && reading && !readingError ? (
        <div className="mt-6 flex w-full justify-center px-1">
          <button
            type="button"
            className="kakao-pay-cta-black-gold w-full !min-h-[3.25rem] !rounded-xl !px-3 !py-3 !font-black !tracking-tight break-keep"
            onClick={() => router.replace(`/${locale}/ritual/persona`)}
          >
            다음 단계(3단계): 영혼빙의(페르소나)로 이동
          </button>
        </div>
      ) : null}

      {toastMsg ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl border border-danchung-gold/35 bg-[#0a0610]/95 px-4 py-2.5 text-center text-xs text-[#FFF8E7] shadow-lg"
          role="status"
        >
          {toastMsg}
        </div>
      ) : null}
    </RitualShell>
  );
}
