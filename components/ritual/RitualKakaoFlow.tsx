"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import {
  type KakaoAnalysisContext,
  DEFAULT_KAKAO_ANALYSIS_CONTEXT,
} from "@/lib/kakaoAnalysisContext";
import {
  clearKakaoAnalysisDraft,
  readKakaoAnalysisDraft,
  saveKakaoAnalysisDraft,
} from "@/lib/kakaoPayResumeDraft";
import { draftMatchesCurrentConsult } from "@/lib/kakaoConsultIdentity";
import {
  clearKakaoPaymentSessionId,
  newKakaoPaymentSessionId,
  readKakaoPaymentSessionId,
} from "@/lib/kakaoPaymentSession";
import { koreanVocativeCall } from "@/lib/koreanVocative";
import { mergeEmotionKeywords } from "@/lib/kakaoReportSignals";
import {
  getRitualPreviewCalendarTodayDom,
  RITUAL_PREVIEW_CALENDAR_FATE_DAY,
} from "@/lib/ritualPreviewCalendar";
import { saveTarotStage1Bridge } from "@/lib/tarotStage1Bridge";
import {
  isRitualPaid,
  readFullPackagePortoneUnlocked,
  readKakaoTargetDisplayName,
  readRitualIntake,
  FULL_PACKAGE_PRICE_WON,
  writeKakaoTargetDisplayName,
} from "@/lib/ritualStorage";

import KakaoAnalysisLoadingOverlay from "./KakaoAnalysisLoadingOverlay";
import InputForm from "./InputForm";
import ResultCard from "./ResultCard";
import RitualShell from "./RitualShell";

type Props = { locale: string };

const KAKAO_DEPOSIT_STATUS = "/api/ritual/kakao-deposit/status";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MIN_TEXT_CHARS = 20;

type StoredPayload = {
  text: string;
  images: { mimeType: string; dataBase64: string }[];
  analysisContext: KakaoAnalysisContext;
  targetName: string;
  selfBubbleColorHint?: string;
  otherBubbleColorHint?: string;
};

function parseDataUrl(dataUrl: string): { mimeType: string; dataBase64: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mimeType: m[1].trim(), dataBase64: m[2].replace(/\s/g, "") };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result ?? ""));
    fr.onerror = () => reject(fr.error ?? new Error("read failed"));
    fr.readAsDataURL(file);
  });
}

export default function RitualKakaoFlow({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  /**
   * 입금 승인(DB) 후 전문 로딩 — **localStorage에 결제 플래그는 저장하지 않음.**
   * `true`는 Supabase `is_paid` 조회·관리자 승인 API 성공 시에만 올린다.
   */
  const [paid, setPaid] = useState(false);
  const [callName, setCallName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewMd, setPreviewMd] = useState<string | null>(null);
  const [fullMd, setFullMd] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [fullFailureMessage, setFullFailureMessage] = useState<string | null>(
    null,
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [analysisContext, setAnalysisContext] = useState<KakaoAnalysisContext>(
    () => ({ ...DEFAULT_KAKAO_ANALYSIS_CONTEXT })
  );
  const [targetName, setTargetName] = useState("");
  const [selfBubbleColorHint, setSelfBubbleColorHint] = useState("");
  const [otherBubbleColorHint, setOtherBubbleColorHint] = useState("");
  /** 서버 입금 승인(DB) 폴링용 — localStorage 결제 플래그와 무관 */
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  /** 모달에서 「입금 완료」 후 — 관리자 DB 승인 대기 */
  const [depositPending, setDepositPending] = useState(false);
  const [emotionKeywords, setEmotionKeywords] = useState<string[]>([]);
  const [packagePitchOpen, setPackagePitchOpen] = useState(false);

  const lastPayloadRef = useRef<StoredPayload | null>(null);
  /** 결제 완료 플로우(다음 단계 이동)는 고객이 버튼으로 직접 진행 */

  const setTargetNamePersist = useCallback((v: string) => {
    setTargetName(v);
    writeKakaoTargetDisplayName(v);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
    setTargetName(readKakaoTargetDisplayName());
    /* 브라우저에 결제 완료 플래그는 저장하지 않음 — 스텁은 항상 false */
    setPaid(isRitualPaid("kakao") || readFullPackagePortoneUnlocked());
  }, [locale, router]);

  // 결제 완료(유료) 상태에서는 패키지 권유 모달을 강제로 닫는다.
  useEffect(() => {
    if (paid) setPackagePitchOpen(false);
  }, [paid]);

  // 자동 이동 로직 제거. 유료이면 아래 “다음 단계” 버튼으로 이동합니다.

  /**
   * session draft 복원 (개인 데이터 영구 복구는 사용하지 않음)
   */
  useEffect(() => {
    if (!isClient) return;
    if (previewMd || fullMd) return;

    const intake = readRitualIntake();
    const intakeName = intake?.userName ?? "";
    const draft = readKakaoAnalysisDraft();

    if (draft?.payload && typeof draft.previewMd === "string") {
      if (!draftMatchesCurrentConsult(draft.consultUserName, intakeName)) {
        clearKakaoAnalysisDraft();
        clearKakaoPaymentSessionId();
      } else {
        lastPayloadRef.current = draft.payload as StoredPayload;
        setPreviewMd(draft.previewMd);
        setEmotionKeywords(
          mergeEmotionKeywords(
            draft.emotionKeywords ?? [],
            draft.payload.text ?? "",
            3,
          ),
        );
        setText(draft.payload.text ?? "");
        setTargetNamePersist((draft.payload.targetName ?? "").trim());
        setSelfBubbleColorHint(draft.payload.selfBubbleColorHint ?? "");
        setOtherBubbleColorHint(draft.payload.otherBubbleColorHint ?? "");
        setAnalysisContext({ ...draft.payload.analysisContext });
        const sid =
          (typeof draft.sessionId === "string" && draft.sessionId) ||
          readKakaoPaymentSessionId();
        if (sid) setPaymentSessionId(sid);
        setDepositPending(draft.depositPending === true);

        let cancelled = false;
        (async () => {
          if (!sid) return;
          try {
            const r = await fetch(
              `${KAKAO_DEPOSIT_STATUS}?sessionId=${encodeURIComponent(sid)}`,
            );
            const j = (await r.json()) as { isPaid?: boolean };
            if (!cancelled && j.isPaid) setPaid(true);
          } catch {
            /* noop */
          }
        })();

        return () => {
          cancelled = true;
        };
      }
    }

    void intakeName;
  }, [isClient, previewMd, fullMd, setTargetNamePersist]);

  /** Supabase Realtime — 입금 대기 중 DB 가 is_paid 되면 즉시 봉인 해제 */
  useEffect(() => {
    if (!isClient || !paymentSessionId || paid || !depositPending) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) return;

    const supabase = createClient(url, anon);
    const channel = supabase
      .channel(`kakao-unlock-${paymentSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kakao_report_unlocks",
          filter: `session_id=eq.${paymentSessionId}`,
        },
        (payload) => {
          const row = payload.new as { is_paid?: boolean };
          if (row?.is_paid) setPaid(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kakao_report_unlocks",
          filter: `session_id=eq.${paymentSessionId}`,
        },
        (payload) => {
          const row = payload.new as { is_paid?: boolean };
          if (row?.is_paid) setPaid(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isClient, paymentSessionId, paid, depositPending]);

  /** 입금 승인 폴링 — Realtime 없을 때·백업용 */
  useEffect(() => {
    if (!isClient || !paymentSessionId || paid || !previewMd) return;

    const poll = async () => {
      try {
        const r = await fetch(
          `${KAKAO_DEPOSIT_STATUS}?sessionId=${encodeURIComponent(paymentSessionId)}`,
        );
        const j = (await r.json()) as { isPaid?: boolean };
        if (j.isPaid) setPaid(true);
      } catch {
        /* noop */
      }
    };

    void poll();
    const intervalMs =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ? 45_000 : 12_000;
    const id = window.setInterval(poll, intervalMs);
    return () => window.clearInterval(id);
  }, [isClient, paymentSessionId, paid, previewMd]);

  useEffect(() => {
    if (paid) setDepositPending(false);
  }, [paid]);

  useEffect(() => {
    if (!paid && fullMd) {
      setFullMd(null);
    }
  }, [paid, fullMd]);

  const buildImagesPayload = useCallback(async () => {
    const images: { mimeType: string; dataBase64: string }[] = [];
    for (const file of imageFiles.slice(0, MAX_IMAGES)) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("image_too_large");
      }
      const dataUrl = await readFileAsDataUrl(file);
      const parsed = parseDataUrl(dataUrl);
      if (parsed?.dataBase64) {
        images.push({ mimeType: parsed.mimeType, dataBase64: parsed.dataBase64 });
      }
    }
    return images;
  }, [imageFiles]);

  const callAnalyzeApi = useCallback(
    async (mode: "preview" | "full", payload: StoredPayload) => {
      const intake = readRitualIntake();
      const res = await fetch("/api/ritual/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload.text,
          images: payload.images,
          userName: intake?.userName,
          targetName: payload.targetName.trim() || undefined,
          relation: intake?.relation,
          birthDate: intake?.birthDate,
          birthTime: intake?.birthTime,
          birthTimeUnknown: intake?.birthTimeUnknown,
          calendar: intake?.calendar,
          gender: intake?.gender,
          analysisContext: payload.analysisContext,
          selfBubbleColorHint: payload.selfBubbleColorHint?.trim() || undefined,
          otherBubbleColorHint: payload.otherBubbleColorHint?.trim() || undefined,
          mode,
        }),
      });
      const data = (await res.json()) as {
        preview?: string;
        report?: string;
        emotionKeywords?: string[];
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        if (data.error === "llm_not_configured") {
          throw new Error("llm_not_configured");
        }
        throw new Error(data.message ?? "request_failed");
      }
      return data;
    },
    []
  );

  useEffect(() => {
    if (!isClient || !paid || !previewMd || fullMd) {
      return;
    }
    const payload = lastPayloadRef.current;
    if (!payload) return;

    let cancelled = false;

    (async () => {
      setBusy(true);
      setAnalyzeError(null);
      setFullFailureMessage(null);
      try {
        const data = await callAnalyzeApi("full", payload);
        if (cancelled) return;
        setFullMd(data.report ?? "");
        setEmotionKeywords(
          mergeEmotionKeywords(
            data.emotionKeywords ?? [],
            payload.text ?? "",
            3,
          ),
        );
        clearKakaoAnalysisDraft();
        setFullFailureMessage(null);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof Error && e.message === "llm_not_configured") {
            setAnalyzeError(t("kakaoErrorLlmNotConfigured"));
            setFullFailureMessage(e.message);
          } else {
            setAnalyzeError(t("kakaoErrorFullAfterPay"));
            setFullFailureMessage(
              e instanceof Error ? e.message : String(e),
            );
          }
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isClient, paid, previewMd, fullMd, callAnalyzeApi, t]);

  const retryFullAfterPay = useCallback(async () => {
    const payload = lastPayloadRef.current;
    if (!payload || busy) return;
    setBusy(true);
    setAnalyzeError(null);
    setFullFailureMessage(null);
    try {
      const data = await callAnalyzeApi("full", payload);
      setFullMd(data.report ?? "");
      setEmotionKeywords(
        mergeEmotionKeywords(
          data.emotionKeywords ?? [],
          payload.text ?? "",
          3,
        ),
      );
      clearKakaoAnalysisDraft();
      setFullFailureMessage(null);
    } catch (e) {
      if (e instanceof Error && e.message === "llm_not_configured") {
        setAnalyzeError(t("kakaoErrorLlmNotConfigured"));
        setFullFailureMessage(e.message);
      } else {
        setAnalyzeError(t("kakaoErrorFullAfterPay"));
        setFullFailureMessage(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  }, [busy, callAnalyzeApi, t]);

  const markDepositSubmitted = useCallback(async () => {
    setDepositPending(true);
    const draft = readKakaoAnalysisDraft();
    const intake = readRitualIntake();
    const consultUserName = intake?.userName?.trim() ?? "";
    if (draft) {
      saveKakaoAnalysisDraft({
        ...draft,
        depositPending: true,
        consultUserName: consultUserName || draft.consultUserName,
      });
    }

    const sid =
      paymentSessionId?.trim() ||
      draft?.sessionId?.trim() ||
      readKakaoPaymentSessionId()?.trim();
    const depositor = intake?.userName?.trim();
    if (!sid || !depositor) return;

    try {
      await fetch("/api/ritual/kakao-deposit/register-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          depositorName: depositor,
          amountWon: FULL_PACKAGE_PRICE_WON,
        }),
      });
    } catch {
      /* 백업: 폴링·Realtime 이 승인 상태를 잡음 */
    }
  }, [paymentSessionId]);

  const canSubmit =
    text.trim().length >= MIN_TEXT_CHARS || imageFiles.length > 0;

  const lastPayloadUsable = Boolean(
    lastPayloadRef.current &&
      (lastPayloadRef.current.text.trim().length >= MIN_TEXT_CHARS ||
        lastPayloadRef.current.images.length > 0),
  );

  /**
   * 미결제: 간보기(preview)만 생성.
   * 풀패키지 결제 완료: **천기누설 전문(full)**만 생성 — `setPaid(false)` 금지(간보기로 되돌아가는 버그 방지).
   */
  const analyze = useCallback(async () => {
    if (busy) return;

    const fullPackagePaid = readFullPackagePortoneUnlocked();

    let payload: StoredPayload | null = null;

    if (canSubmit) {
      try {
        const images = await buildImagesPayload();
        payload = {
          text: text.trim(),
          images,
          analysisContext: { ...analysisContext },
          targetName: targetName.trim(),
          selfBubbleColorHint: selfBubbleColorHint.trim(),
          otherBubbleColorHint: otherBubbleColorHint.trim(),
        };
      } catch (e) {
        if (e instanceof Error && e.message === "image_too_large") {
          setAnalyzeError(t("kakaoImageTooLarge"));
        } else {
          setAnalyzeError(t("kakaoErrorGeneric"));
        }
        return;
      }
    } else if (lastPayloadUsable && lastPayloadRef.current) {
      const ref = lastPayloadRef.current;
      payload = {
        text: ref.text,
        images: ref.images,
        analysisContext: { ...ref.analysisContext },
        targetName: ref.targetName,
        selfBubbleColorHint: ref.selfBubbleColorHint,
        otherBubbleColorHint: ref.otherBubbleColorHint,
      };
    } else {
      return;
    }

    setAnalyzeError(null);
    setFullFailureMessage(null);
    setBusy(true);

    /** 인연 종결 풀패키지 결제 후: 1단계 전문 리포트만 (간보기 스킵) */
    if (fullPackagePaid) {
      try {
        lastPayloadRef.current = payload;
        setPaid(true);
        setPackagePitchOpen(false);
        setPreviewMd(null);
        setFullMd(null);

        const data = await callAnalyzeApi("full", payload);
        const fullReport = data.report ?? "";
        const kwsFull = mergeEmotionKeywords(
          data.emotionKeywords ?? [],
          payload.text ?? "",
          3,
        );
        setFullMd(fullReport);
        setEmotionKeywords(kwsFull);
        saveTarotStage1Bridge({
          emotionKeywords: kwsFull,
          chatSnippet: payload.text.slice(0, 12_000),
          stage1PreviewExcerpt: fullReport.slice(0, 12_000),
          targetName: payload.targetName?.trim() || undefined,
          selfBubbleColorHint: payload.selfBubbleColorHint?.trim() || undefined,
          otherBubbleColorHint: payload.otherBubbleColorHint?.trim() || undefined,
          previewCalendarTodayDom: getRitualPreviewCalendarTodayDom(),
          previewCalendarFateDay: RITUAL_PREVIEW_CALENDAR_FATE_DAY,
        });
        clearKakaoAnalysisDraft();
        setFullFailureMessage(null);
      } catch (e) {
        if (e instanceof Error && e.message === "llm_not_configured") {
          setAnalyzeError(t("kakaoErrorLlmNotConfigured"));
          setFullFailureMessage(e.message);
        } else {
          setAnalyzeError(t("kakaoErrorFullAfterPay"));
          setFullFailureMessage(
            e instanceof Error ? e.message : String(e),
          );
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    clearKakaoAnalysisDraft();
    clearKakaoPaymentSessionId();
    setPaymentSessionId(null);
    setDepositPending(false);
    setPaid(false);
    setFullMd(null);
    try {
      lastPayloadRef.current = payload;

      const data = await callAnalyzeApi("preview", payload);
      const md = data.preview ?? "";
      const kws = mergeEmotionKeywords(
        data.emotionKeywords ?? [],
        payload.text ?? "",
        3,
      );
      setPreviewMd(md);
      setEmotionKeywords(kws);
      const sid = newKakaoPaymentSessionId();
      setPaymentSessionId(sid);
      const intakeNow = readRitualIntake();
      saveKakaoAnalysisDraft({
        payload,
        previewMd: md,
        emotionKeywords: kws,
        sessionId: sid,
        consultUserName: intakeNow?.userName?.trim() ?? "",
        depositPending: false,
      });
      saveTarotStage1Bridge({
        emotionKeywords: kws,
        chatSnippet: payload.text.slice(0, 12_000),
        stage1PreviewExcerpt: md.slice(0, 12_000),
        targetName: payload.targetName.trim() || undefined,
        selfBubbleColorHint: payload.selfBubbleColorHint?.trim() || undefined,
        otherBubbleColorHint: payload.otherBubbleColorHint?.trim() || undefined,
        previewCalendarTodayDom: getRitualPreviewCalendarTodayDom(),
        previewCalendarFateDay: RITUAL_PREVIEW_CALENDAR_FATE_DAY,
      });
      if (!paid) setPackagePitchOpen(true);
    } catch (e) {
      if (e instanceof Error && e.message === "llm_not_configured") {
        setAnalyzeError(t("kakaoErrorLlmNotConfigured"));
      } else {
        setAnalyzeError(t("kakaoErrorGeneric"));
      }
    } finally {
      setBusy(false);
    }
  }, [
    analysisContext,
    buildImagesPayload,
    busy,
    callAnalyzeApi,
    canSubmit,
    lastPayloadUsable,
    paid,
    t,
    text,
    targetName,
    selfBubbleColorHint,
    otherBubbleColorHint,
  ]);

  const onImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) {
      setImageFiles([]);
      return;
    }
    setImageFiles(Array.from(list).slice(0, MAX_IMAGES));
  };

  const onTextFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const body = await file.text();
      setText((prev) => {
        const prefix = prev.trim() ? `${prev.trim()}\n\n` : "";
        return `${prefix}--- ${file.name} ---\n${body}`;
      });
    } catch {
      setAnalyzeError(t("kakaoTextFileError"));
    }
    e.target.value = "";
  };

  const hasResult = Boolean(previewMd || fullMd);
  const paidPreviewError = Boolean(
    paid && previewMd && !fullMd && analyzeError
  );

  /**
   * 결과가 뜰 때 window 스크롤이 폼 하단에 머무는 경우가 많음 → 맨 위(뒤로가기·제목·1단계 카드)가 보이게.
   * (내부 ResultCard의 overflow만 초기화해서는 페이지 전체 위치가 안 바뀜)
   */
  useEffect(() => {
    if (!previewMd && !fullMd) return;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [previewMd, fullMd]);

  const isAdminMode = searchParams.get("admin") === "true";

  if (!isClient || !callName) {
    return (
      <RitualShell>
        <div className="h-56 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  return (
    <RitualShell>
      <KakaoAnalysisLoadingOverlay open={busy} />

      {packagePitchOpen ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/82 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-pitch-title"
          onClick={() => setPackagePitchOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#BF953F]/50 bg-[#0a0610] px-6 py-7 shadow-[0_0_60px_rgba(212,175,55,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="package-pitch-title"
              className="text-center text-lg font-black leading-snug text-[#fceea8] sm:text-xl"
            >
              {t("packagePitchTitle")}
            </h2>
            <p className="mt-3 text-center text-base leading-relaxed text-white/88">
              {t("packagePitchBody")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="kakao-pay-cta-black-gold flex-1 !min-h-[3.35rem] !rounded-xl !text-[15px] !font-black"
                onClick={() => {
                  setPackagePitchOpen(false);
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById("ritual-kakao-pay-anchor")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  });
                }}
              >
                {t("packagePitchConfirm")}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/28 py-3.5 text-base font-bold text-white/88 hover:bg-white/5"
                onClick={() => setPackagePitchOpen(false)}
              >
                {t("packagePitchLater")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Link
        href={`/${locale}/ritual/menu?stay=1`}
        className="mb-6 inline-block text-sm text-danchung-gold/75"
      >
        ← {t("backMenu")}
      </Link>

      <h1 className="text-center font-serif text-xl font-bold text-[#FFF8E7]">
        {t("kakaoTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-danchung-gold/85">
        {t("kakaoLead", { name: callName })}
      </p>
      {!hasResult ? (
        <p className="mx-auto mt-2 max-w-md text-center text-[11px] leading-relaxed text-white/50">
          {t("kakaoFreeFlowHint")}
        </p>
      ) : null}

      {hasResult ? (
        <ResultCard
          isPaid={paid}
          targetName={targetName}
          emotionKeywords={emotionKeywords}
          chatLogSnippet={lastPayloadRef.current?.text ?? ""}
          previewMd={previewMd}
          fullMd={fullMd}
          analyzeError={analyzeError}
          fullFailureMessage={fullFailureMessage}
          paidPreviewError={paidPreviewError}
          onRetryFull={() => void retryFullAfterPay()}
          retryBusy={busy}
          paidHasFull={Boolean(paid && fullMd)}
          canSubmit={canSubmit}
          paymentSessionId={paymentSessionId}
          isAdminMode={isAdminMode}
          depositPending={depositPending}
          onDepositSubmitted={markDepositSubmitted}
          onAdminUnlockSuccess={() => setPaid(true)}
          showDeliveredTemplate={false}
          showKakaoStage1Visuals
        />
      ) : null}

      {hasResult && paid ? (
        <div className="mt-6 flex w-full justify-center px-1">
          <button
            type="button"
            className="kakao-pay-cta-black-gold w-full !min-h-[3.25rem] !rounded-xl !px-3 !py-3 !font-black !tracking-tight break-keep"
            onClick={() => router.replace(`/${locale}/ritual/tarot`)}
          >
            다음 단계(2단계): 운명점지(타로)로 이동
          </button>
        </div>
      ) : null}

      <InputForm
        visible={!hasResult}
        analysisContext={analysisContext}
        setAnalysisContext={setAnalysisContext}
        targetName={targetName}
        setTargetName={setTargetNamePersist}
        selfBubbleColorHint={selfBubbleColorHint}
        setSelfBubbleColorHint={setSelfBubbleColorHint}
        otherBubbleColorHint={otherBubbleColorHint}
        setOtherBubbleColorHint={setOtherBubbleColorHint}
        text={text}
        setText={setText}
        imageFiles={imageFiles}
        onImageChange={onImageChange}
        onTextFileChange={onTextFileChange}
        analyzeError={analyzeError}
        busy={busy}
        canSubmit={canSubmit}
        onAnalyze={() => void analyze()}
      />

    </RitualShell>
  );
}
