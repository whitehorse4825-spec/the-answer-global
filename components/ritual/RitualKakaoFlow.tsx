"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { koreanVocativeCall } from "@/lib/koreanVocative";
import {
  isRitualPaid,
  readRitualIntake,
  setRitualPaid,
} from "@/lib/ritualStorage";

import RitualPayButton from "./RitualPayButton";
import RitualShell from "./RitualShell";

type Props = { locale: string };

export default function RitualKakaoFlow({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [paid, setPaid] = useState(false);
  const [callName, setCallName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
    const p = isRitualPaid("kakao");
    setPaid(p);
  }, [locale, router]);

  useEffect(() => {
    if (!isClient) return;
    const ok =
      searchParams.get("paymentSuccess") === "1" ||
      searchParams.get("mock") === "1";
    if (ok) {
      setRitualPaid("kakao", true);
      setPaid(true);
      router.replace(`/${locale}/ritual/kakao`);
    }
  }, [isClient, searchParams, router, locale]);

  const analyze = useCallback(async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ritual/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, hasImage }),
      });
      const data = (await res.json()) as { report?: string };
      setReport(data.report ?? "");
    } finally {
      setBusy(false);
    }
  }, [text, hasImage]);

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
        href={`/${locale}/ritual/menu`}
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

      {!paid ? (
        <div className="mt-10 space-y-4">
          <p className="text-center text-xs leading-relaxed text-white/55">
            {t("kakaoPayHint")}
          </p>
          <RitualPayButton
            locale={locale}
            product="kakao"
            orderName={t("orderNameKakao")}
            label={t("payButton")}
          />
        </div>
      ) : report ? (
        <div className="mt-8 rounded-2xl border border-danchung-gold/25 bg-black/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-danchung-gold/90">
            {t("reportTitle")}
          </div>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#FFF8E7]/90">
            {report}
          </pre>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs text-danchung-gold/80">{t("kakaoPaste")}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-4 text-sm"
              placeholder={t("kakaoPlaceholder")}
            />
          </label>
          <label className="block text-xs text-danchung-gold/70">
            <span className="block pb-1">{t("kakaoImageHint")}</span>
            <input
              type="file"
              accept="image/*"
              className="text-xs text-white/60"
              onChange={(e) => setHasImage(Boolean(e.target.files?.length))}
            />
          </label>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={analyze}
            className="w-full rounded-xl border border-danchung-gold/45 py-3 text-sm font-semibold text-danchung-gold disabled:opacity-40"
          >
            {busy ? t("analyzing") : t("runAnalysis")}
          </button>
        </div>
      )}
    </RitualShell>
  );
}
