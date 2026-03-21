"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { koreanVocativeCall } from "@/lib/koreanVocative";
import {
  isRitualPaid,
  readRitualIntake,
  setRitualPaid,
} from "@/lib/ritualStorage";
import { shuffleDeck, TAROT_DECK_78, type TarotCard } from "@/lib/tarotDeck";

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
  const [phase, setPhase] = useState<"shuffle" | "pick" | "reading">("shuffle");
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [picked, setPicked] = useState<TarotCard[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
    setPaid(isRitualPaid("tarot"));
  }, [locale, router]);

  useEffect(() => {
    if (!isClient) return;
    const ok =
      searchParams.get("paymentSuccess") === "1" ||
      searchParams.get("mock") === "1";
    if (ok) {
      setRitualPaid("tarot", true);
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
      void finalizeReading(next);
    }
  };

  const finalizeReading = async (cards: TarotCard[]) => {
    setBusy(true);
    try {
      const intake = readRitualIntake();
      const res = await fetch("/api/ritual/tarot-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: cards.map((c) => c.nameKo),
          birthDate: intake?.birthDate,
          relation: intake?.relation,
        }),
      });
      const data = (await res.json()) as { reading?: string };
      setReading(data.reading ?? "");
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
        href={`/${locale}/ritual/menu`}
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
            {busy && picked.length >= 3
              ? t("tarotReadingWait")
              : t("tarotPickHint", { n: picked.length })}
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
      ) : (
        <div className="mt-8 rounded-2xl border border-danchung-gold/25 bg-black/50 p-5">
          <div className="text-xs font-semibold text-danchung-gold">{t("tarotReadingTitle")}</div>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-[#FFF8E7]/90">
            {reading}
          </pre>
        </div>
      )}
    </RitualShell>
  );
}
