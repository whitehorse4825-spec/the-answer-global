"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { koreanVocativeCall } from "@/lib/koreanVocative";
import { shouldMarkRitualPaidFromSearchParams } from "@/lib/ritualPaymentUrl";
import { readKakaoAnalysisDraft } from "@/lib/kakaoPayResumeDraft";
import {
  isRitualPaid,
  readFullPackagePortoneUnlocked,
  readKakaoTargetDisplayName,
  readRitualIntake,
} from "@/lib/ritualStorage";

import { PersonaAssistantBubbleContent } from "@/lib/personaReplyRichText";

import RitualPayButton from "./RitualPayButton";
import RitualShell from "./RitualShell";

const MAX_USER_TURNS = 10;

type Msg = { role: "user" | "other"; text: string };

type Props = { locale: string };

export default function RitualPersonaFlow({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [paid, setPaid] = useState(false);
  const [callName, setCallName] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const userTurnsLeft = MAX_USER_TURNS - userTurns;

  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
    // 실제 결제 성공(또는 로컬 테스트) 시 `ritual:fullPackage:portoneUnlocked` 플래그로 즉시 해제
    setPaid(isRitualPaid("persona") || readFullPackagePortoneUnlocked());
  }, [locale, router]);

  useEffect(() => {
    if (!isClient) return;
    if (shouldMarkRitualPaidFromSearchParams(searchParams)) {
      setPaid(true);
      router.replace(`/${locale}/ritual/persona`);
    }
  }, [isClient, searchParams, router, locale]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = useCallback(async () => {
    if (!paid || userTurnsLeft <= 0 || !input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    const userMsg: Msg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setApiError(null);
    setBusy(true);
    try {
      const intake = readRitualIntake();
      const draft = readKakaoAnalysisDraft();
      const apiMsgs = [...messages, userMsg].map((x) => ({
        role: x.role === "user" ? ("user" as const) : ("assistant" as const),
        content: x.text,
      }));
      const res = await fetch("/api/ritual/persona-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMsgs,
          userName: intake?.userName,
          relation: intake?.relation,
          targetName: readKakaoTargetDisplayName() || draft?.payload?.targetName,
          selfBubbleColorHint: draft?.payload?.selfBubbleColorHint,
          otherBubbleColorHint: draft?.payload?.otherBubbleColorHint,
          stage1Excerpt: draft?.previewMd?.trim().slice(0, 8000),
          maxUserTurns: MAX_USER_TURNS,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setMessages((m) => m.slice(0, -1));
        setInput(text);
        setApiError(
          typeof data.message === "string"
            ? data.message
            : data.error === "persona_chat_failed"
              ? "신령님이 잠깐 막혔다. 잠시 후 다시 보내보거라."
              : "점사를 불러오지 못했다. 서버 설정을 확인하거나 잠시 후 다시 보내보거라.",
        );
        return;
      }
      setUserTurns((n) => n + 1);
      setMessages((m) => [...m, { role: "other", text: data.reply ?? "" }]);
    } catch {
      setMessages((m) => m.slice(0, -1));
      setInput(text);
      setApiError("네트워크가 꼬였다. 다시 보내보거라.");
    } finally {
      setBusy(false);
    }
  }, [paid, userTurnsLeft, busy, messages, input]);

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
        {t("personaTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-danchung-gold/85">
        {t("personaLead", { name: callName })}
      </p>

      {!paid ? (
        <div className="mt-10 space-y-4">
          <p className="text-center text-xs text-white/55">{t("personaPayHint")}</p>
          <RitualPayButton
            locale={locale}
            product="persona"
            orderName={t("orderNamePersona")}
            label={t("payButton")}
          />
        </div>
      ) : (
        <div className="mt-8 flex min-h-[55vh] flex-col rounded-2xl border border-[#7c6a4a]/40 bg-[#1a1814]/95 shadow-inner">
          <div className="border-b border-white/10 bg-[#2c2a26] px-4 py-3 text-center text-sm font-semibold text-[#FFF8E7]/90">
            상대
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#7e7e7e]/25 px-3 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-white/45">
                {callName}, 첫 말을 걸어보거라.
              </p>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.text.slice(0, 12)}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`kakao-sns-bubble-text max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#fee500] text-[#1a1a1a]"
                      : "bg-white text-[#111]"
                  }`}
                >
                  {m.role === "user" ? (
                    m.text
                  ) : (
                    <PersonaAssistantBubbleContent text={m.text} />
                  )}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/90 px-3 py-2 text-xs text-black/60">
                  {t("personaTyping")}
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <div className="border-t border-black/20 bg-[#f5f5f5] p-3">
            {apiError ? (
              <p className="mb-2 text-center text-[11px] font-medium text-red-700">
                {apiError}
              </p>
            ) : null}
            <p className="mb-2 text-center text-[11px] text-black/50">
              {userTurnsLeft > 0
                ? t("personaRemaining", { n: userTurnsLeft })
                : t("personaLimitReached")}
            </p>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={userTurnsLeft <= 0 || busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t("personaInputPlaceholder")}
                className="kakao-sns-bubble-text min-h-10 flex-1 rounded-lg border border-black/10 bg-white px-3 text-black outline-none"
              />
              <button
                type="button"
                disabled={userTurnsLeft <= 0 || busy || !input.trim()}
                onClick={() => void send()}
                className="rounded-lg bg-[#2c2a26] px-4 text-sm font-semibold text-[#fee500] disabled:opacity-40"
              >
                {t("personaSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </RitualShell>
  );
}
