"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  digitsOnlyBirth,
  eightDigitsToIso,
} from "@/lib/birthDateDigits";
import {
  type RitualIntake,
  type RitualRelation,
  clearKakaoConsultBrowserData,
  readRitualIntake,
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
  const [birthDigits, setBirthDigits] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthTime, setBirthTime] = useState("12:00");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [gender, setGender] = useState("female");

  const birthDateIso = useMemo(
    () => eightDigitsToIso(birthDigits),
    [birthDigits],
  );

  useEffect(() => {
    queueMicrotask(() => setIsClient(true));
  }, []);

  const onSubmitStep2 = () => {
    if (!relation || !userName.trim() || !birthDateIso) return;
    const prev = readRitualIntake();
    if (prev && prev.userName.trim() !== userName.trim()) {
      /* 이름이 바뀌면 이전 카톡 상담 draft·입금 세션은 무효 */
      clearKakaoConsultBrowserData();
    }
    const data: RitualIntake = {
      userName: userName.trim(),
      relation,
      birthDate: birthDateIso,
      birthTime: birthTimeUnknown ? "" : birthTime,
      birthTimeUnknown,
      calendar,
      gender,
      updatedAt: Date.now(),
    };
    writeRitualIntake(data);
    router.push(`/${locale}/ritual/briefing`);
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
          <h1 className="ritual-gradient-text text-center font-serif text-xl font-bold leading-snug sm:text-2xl">
            {t("step1Question")}
          </h1>
          <div className="mt-10 flex flex-col gap-5">
            {(
              [
                {
                  id: "reunion_emergency" as const,
                  titleKey: "relationEmergencyTitle",
                  subKey: "relationEmergencySub",
                },
                {
                  id: "reunion_revival" as const,
                  titleKey: "relationRevivalTitle",
                  subKey: "relationRevivalSub",
                },
                {
                  id: "reunion_blocked" as const,
                  titleKey: "relationBlockedTitle",
                  subKey: "relationBlockedSub",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRelation(opt.id);
                  setStep(2);
                }}
                className="ritual-option-card relative w-full rounded-2xl border border-[rgba(241,229,172,0.28)] bg-black/55 px-5 py-5 text-left backdrop-blur-sm transition hover:border-[rgba(241,229,172,0.45)] hover:bg-black/60"
              >
                <div className="ritual-gradient-text text-[clamp(0.95rem,3.8vw,1.08rem)] font-bold leading-snug">
                  {t(opt.titleKey)}
                </div>
                <p className="mt-2.5 text-[clamp(0.78rem,2.8vw,0.9rem)] font-medium leading-relaxed text-[#F1E5AC] [text-shadow:0_1px_14px_rgba(0,0,0,0.88)]">
                  {t(opt.subKey)}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p
            className="mb-5 rounded-xl border border-[rgba(168,85,247,0.35)] bg-black/50 px-4 py-3 text-center text-[0.8125rem] font-medium leading-relaxed text-[#F1E5AC] shadow-[0_0_28px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]"
            role="status"
          >
            {t("packageBuildupLine")}
          </p>
          <h1 className="text-center font-serif text-lg font-bold leading-snug text-[#F1E5AC] [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-xl">
            <span
              className="font-bold [text-shadow:0_0_20px_rgba(191,149,63,0.25)]"
              style={{ color: "#BF953F" }}
            >
              {t("step2TitleHighlight")}
            </span>
            {t("step2TitleSuffix")}
          </h1>
          <p className="mt-3 max-w-[26rem] mx-auto text-center text-[0.78rem] leading-relaxed text-[#F1E5AC]/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.75)]">
            {t("step2Hint")}
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="form-label-mudang">{t("nameLabel")}</span>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-[#FFF8E7] outline-none placeholder:text-white/35 focus:border-danchung-gold/50"
                placeholder={t("namePlaceholder")}
              />
            </label>

            <label className="block">
              <span className="form-label-mudang">{t("birthDateLabel")}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                maxLength={8}
                value={birthDigits}
                onChange={(e) =>
                  setBirthDigits(digitsOnlyBirth(e.target.value))
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm tracking-widest text-[#FFF8E7] outline-none placeholder:text-white/35 focus:border-danchung-gold/50"
                placeholder={t("birthDatePlaceholder")}
                aria-invalid={birthDigits.length === 8 && !birthDateIso}
              />
              {birthDateIso ? (
                <p className="mt-1.5 text-xs font-medium text-danchung-gold/90">
                  {t("birthDateParsed", { date: birthDateIso })}
                </p>
              ) : birthDigits.length === 8 && !birthDateIso ? (
                <p className="mt-1.5 text-xs text-amber-200/80">
                  {t("birthDateIncomplete")}
                </p>
              ) : null}
            </label>

            <div>
              <span className="form-label-mudang">{t("calendarLabel")}</span>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCalendar("solar")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                    calendar === "solar"
                      ? "border-danchung-gold/60 bg-danchung-gold/15 text-[#FFF8E7]"
                      : "border-white/15 bg-black/30 text-white/85"
                  }`}
                >
                  {t("calendarSolar")}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendar("lunar")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                    calendar === "lunar"
                      ? "border-danchung-gold/60 bg-danchung-gold/15 text-[#FFF8E7]"
                      : "border-white/15 bg-black/30 text-white/85"
                  }`}
                >
                  {t("calendarLunar")}
                </button>
              </div>
            </div>

            <div>
              <span className="form-label-mudang">{t("birthTimeLabel")}</span>
              <label className="mt-2 flex items-center gap-2 text-sm text-white/80">
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
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-[#FFF8E7]"
                />
              ) : null}
            </div>

            <label className="block">
              <span className="form-label-mudang">{t("genderLabel")}</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-[#FFF8E7]"
              >
                <option value="female">{t("genderFemale")}</option>
                <option value="male">{t("genderMale")}</option>
                <option value="other">{t("genderOther")}</option>
              </select>
            </label>
          </div>

          <p className="mt-8 text-center text-[0.8125rem] font-semibold tracking-wide text-[#FFF8E7] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]">
            {t("step2SubmitEyebrow")}
          </p>

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-white/20 py-3.5 text-sm text-white/80"
            >
              {t("prev")}
            </button>
            <button
              type="button"
              disabled={!userName.trim() || !birthDateIso}
              onClick={onSubmitStep2}
              className="flex flex-[2] flex-col items-center justify-center gap-0.5 rounded-xl border border-danchung-gold/50 bg-gradient-to-b from-[#c9a227]/30 to-black/50 px-3 py-3 text-sm font-bold text-[#FFF8E7] disabled:opacity-40"
            >
              <span>{t("toMenu")}</span>
              <span className="text-[10px] font-medium leading-tight text-danchung-gold/90">
                {t("step2SubmitFootnote")}
              </span>
            </button>
          </div>
        </>
      )}
    </RitualShell>
  );
}
