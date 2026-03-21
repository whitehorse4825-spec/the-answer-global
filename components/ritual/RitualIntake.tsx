"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  type RitualIntake,
  type RitualRelation,
  writeRitualIntake,
} from "@/lib/ritualStorage";

import RitualShell from "./RitualShell";

type Props = { locale: string };

export default function RitualIntake({ locale }: Props) {
  const t = useTranslations("Ritual");
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [relation, setRelation] = useState<RitualRelation | null>(null);
  const [userName, setUserName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthTime, setBirthTime] = useState("12:00");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [gender, setGender] = useState("female");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onSubmitStep2 = () => {
    if (!relation || !userName.trim() || !birthDate.trim()) return;
    const data: RitualIntake = {
      userName: userName.trim(),
      relation,
      birthDate: birthDate.trim(),
      birthTime: birthTimeUnknown ? "" : birthTime,
      birthTimeUnknown,
      calendar,
      gender,
      updatedAt: Date.now(),
    };
    writeRitualIntake(data);
    router.push(`/${locale}/ritual/menu`);
  };

  if (!isClient) {
    return (
      <RitualShell>
        <div className="h-64 animate-pulse rounded-2xl bg-white/[0.06]" />
      </RitualShell>
    );
  }

  return (
    <RitualShell>
      <Link
        href={`/${locale}`}
        className="mb-8 inline-block text-sm text-danchung-gold/75 hover:text-danchung-gold"
      >
        ← {t("backHome")}
      </Link>

      {step === 1 ? (
        <>
          <h1 className="text-center font-serif text-xl font-bold leading-snug text-[#FFF8E7] sm:text-2xl">
            {t("step1Question")}
          </h1>
          <div className="mt-10 flex flex-col gap-4">
            {(
              [
                ["reunion", t("relationReunion")],
                ["crush", t("relationCrush")],
                ["crisis", t("relationCrisis")],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRelation(id);
                  setStep(2);
                }}
                className="rounded-2xl border border-danchung-gold/35 bg-black/40 px-5 py-5 text-left text-base font-semibold text-[#FFF8E7] shadow-[0_0_32px_rgba(212,175,55,0.08)] transition hover:border-danchung-gold/60 hover:bg-black/55"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="text-center font-serif text-lg font-bold text-[#FFF8E7] sm:text-xl">
            {t("step2Title")}
          </h1>
          <p className="mt-2 text-center text-xs text-white/50">{t("step2Hint")}</p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-xs font-medium text-danchung-gold/85">
                {t("nameLabel")}
              </span>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-danchung-gold/50"
                placeholder={t("namePlaceholder")}
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-danchung-gold/85">
                {t("birthDateLabel")}
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-danchung-gold/50"
              />
            </label>

            <div>
              <span className="text-xs font-medium text-danchung-gold/85">
                {t("calendarLabel")}
              </span>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCalendar("solar")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm ${
                    calendar === "solar"
                      ? "border-danchung-gold/60 bg-danchung-gold/15"
                      : "border-white/15 bg-black/30"
                  }`}
                >
                  {t("calendarSolar")}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendar("lunar")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm ${
                    calendar === "lunar"
                      ? "border-danchung-gold/60 bg-danchung-gold/15"
                      : "border-white/15 bg-black/30"
                  }`}
                >
                  {t("calendarLunar")}
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-danchung-gold/85">
                {t("birthTimeLabel")}
              </span>
              <label className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={birthTimeUnknown}
                  onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                />
                {t("birthTimeUnknown")}
              </label>
              {!birthTimeUnknown ? (
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm"
                />
              ) : null}
            </div>

            <label className="block">
              <span className="text-xs font-medium text-danchung-gold/85">
                {t("genderLabel")}
              </span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm"
              >
                <option value="female">{t("genderFemale")}</option>
                <option value="male">{t("genderMale")}</option>
                <option value="other">{t("genderOther")}</option>
              </select>
            </label>
          </div>

          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-white/20 py-3.5 text-sm text-white/80"
            >
              {t("prev")}
            </button>
            <button
              type="button"
              disabled={!userName.trim() || !birthDate.trim()}
              onClick={onSubmitStep2}
              className="flex-[2] rounded-xl border border-danchung-gold/50 bg-gradient-to-b from-[#c9a227]/30 to-black/50 py-3.5 text-sm font-bold text-[#FFF8E7] disabled:opacity-40"
            >
              {t("toMenu")}
            </button>
          </div>
        </>
      )}
    </RitualShell>
  );
}
