"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { koreanVocativeCall } from "@/lib/koreanVocative";
import { readRitualIntake } from "@/lib/ritualStorage";

import RitualShell from "./RitualShell";

type Props = { locale: string };

export default function RitualMenu({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [callName, setCallName] = useState("");

  useEffect(() => {
    setIsClient(true);
    const intake = readRitualIntake();
    if (!intake?.userName) {
      router.replace(`/${locale}/ritual`);
      return;
    }
    setCallName(koreanVocativeCall(intake.userName));
  }, [locale, router]);

  if (!isClient) {
    return (
      <RitualShell>
        <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  if (!callName) return null;

  return (
    <RitualShell>
      <Link
        href={`/${locale}/ritual`}
        className="mb-6 inline-block text-sm text-danchung-gold/75 hover:text-danchung-gold"
      >
        ← {t("backEdit")}
      </Link>

      <p className="text-center font-serif text-lg leading-relaxed text-[#FFF8E7] sm:text-xl">
        {t("menuGreeting", { name: callName })}
      </p>
      <p className="mt-3 text-center text-sm text-danchung-gold/80">{t("menuSub")}</p>

      <div className="mt-12 flex flex-col gap-4">
        <Link
          href={`/${locale}/ritual/kakao`}
          className="block rounded-2xl border border-danchung-gold/35 bg-black/45 p-5 shadow-[0_0_40px_rgba(212,175,55,0.06)] transition hover:border-danchung-gold/55"
        >
          <div className="text-base font-bold text-[#FFF8E7]">{t("productKakaoTitle")}</div>
          <div className="mt-1 text-lg font-black text-danchung-gold">{t("productKakaoPrice")}</div>
          <p className="mt-2 text-xs leading-relaxed text-white/55">{t("productKakaoDesc")}</p>
        </Link>

        <Link
          href={`/${locale}/ritual/tarot`}
          className="block rounded-2xl border border-danchung-gold/35 bg-black/45 p-5 shadow-[0_0_40px_rgba(212,175,55,0.06)] transition hover:border-danchung-gold/55"
        >
          <div className="text-base font-bold text-[#FFF8E7]">{t("productTarotTitle")}</div>
          <div className="mt-1 text-lg font-black text-danchung-gold">{t("productTarotPrice")}</div>
          <p className="mt-2 text-xs leading-relaxed text-white/55">{t("productTarotDesc")}</p>
        </Link>

        <Link
          href={`/${locale}/ritual/persona`}
          className="block rounded-2xl border border-danchung-gold/35 bg-black/45 p-5 shadow-[0_0_40px_rgba(212,175,55,0.06)] transition hover:border-danchung-gold/55"
        >
          <div className="text-base font-bold text-[#FFF8E7]">{t("productPersonaTitle")}</div>
          <div className="mt-1 text-lg font-black text-danchung-gold">{t("productPersonaPrice")}</div>
          <p className="mt-2 text-xs leading-relaxed text-white/55">{t("productPersonaDesc")}</p>
        </Link>
      </div>
    </RitualShell>
  );
}
