"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  locale: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  genderLabel: string;
  birthDateLabel: string;
  birthTimeLabel: string;
  unknownLabel: string;
  genderOptions: Array<{ value: string; label: string }>;
  submitLabel: string;
};

export default function ArchiveForm({
  locale,
  title,
  subtitle,
  nameLabel,
  genderLabel,
  birthDateLabel,
  birthTimeLabel,
  unknownLabel,
  genderOptions,
  submitLabel,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Archive");
  const [visible, setVisible] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<string>(genderOptions[0]?.value ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(true);
  const [birthTime, setBirthTime] = useState("");

  type MainCategoryId = "romance" | "career" | "money" | "lifetimeAtlas" | "soulBond";
  type SubCategoryId =
    | "solo"
    | "reunion"
    | "crush"
    | "flirt"
    | "couple"
    | "jobChange"
    | "success"
    | "startup"
    | "investment"
    | "wealth"
    | "dog"
    | "cat"
    | "otherFriend";

  const mainCategories = useMemo(
    () =>
      [
        { id: "romance" as const, label: t("mainCategory_romance") },
        { id: "career" as const, label: t("mainCategory_career") },
        { id: "money" as const, label: t("mainCategory_money") },
        { id: "lifetimeAtlas" as const, label: t("mainCategory_lifetimeAtlas") },
        { id: "soulBond" as const, label: t("mainCategory_soulBond") },
      ] as const,
    [t],
  );

  const [mainCategory, setMainCategory] = useState<MainCategoryId>("career");
  const [subCategory, setSubCategory] = useState<SubCategoryId>("jobChange");

  const subCategories = useMemo(() => {
    if (mainCategory === "romance") {
      return [
        { id: "solo" as const, label: t("subCategory_solo") },
        { id: "reunion" as const, label: t("subCategory_reunion") },
        { id: "crush" as const, label: t("subCategory_crush") },
        { id: "flirt" as const, label: t("subCategory_flirt") },
        { id: "couple" as const, label: t("subCategory_couple") },
      ];
    }
    if (mainCategory === "career") {
      return [
        { id: "jobChange" as const, label: t("subCategory_jobChange") },
        { id: "success" as const, label: t("subCategory_success") },
        { id: "startup" as const, label: t("subCategory_startup") },
      ];
    }
    if (mainCategory === "money") {
      return [
        { id: "investment" as const, label: t("subCategory_investment") },
        { id: "wealth" as const, label: t("subCategory_wealth") },
      ];
    }
    if (mainCategory === "soulBond") {
      return [
        { id: "dog" as const, label: t("subCategory_dog") },
        { id: "cat" as const, label: t("subCategory_cat") },
        {
          id: "otherFriend" as const,
          label: t("subCategory_otherFriend"),
        },
      ];
    }
    return [];
  }, [mainCategory, t]);

  const showSubCategory = subCategories.length > 0;
  const showChatSection = mainCategory === "romance";

  const shouldPrioritizeChat = useMemo(() => {
    if (mainCategory !== "romance") return false;
    return subCategory === "reunion" || subCategory === "flirt";
  }, [mainCategory, subCategory]);

  const privacyGuide = t("privacyGuide");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        "w-full",
        "transition-all duration-600 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      <div className="pt-[clamp(26px,6vh,52px)] px-5 text-center">
        <h1
          className={[
            "mx-auto text-[clamp(1.6rem,6vw,2.5rem)] leading-[1.08] font-[700] tracking-[-0.02em]",
          ].join(" ")}
          style={{
            color: "#FFFDD0",
            WebkitTextStroke: "0.55px rgba(212,175,55,0.65)",
            textShadow: "0 0 18px rgba(212,175,55,0.12)",
          }}
        >
          {title}
        </h1>
        <p
          className="mx-auto mt-4 text-[clamp(0.95rem,3.4vw,1.16rem)] leading-[1.6] max-w-[34rem]"
          style={{
            color: "rgba(255,253,208,0.92)",
            WebkitTextStroke: "0.35px rgba(212,175,55,0.32)",
            textShadow: "0 0 12px rgba(212,175,55,0.08)",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div className="mx-auto mt-[clamp(18px,4.2vh,28px)] w-full max-w-[560px] px-4 pb-[clamp(22px,6vh,44px)]">
        <form
          className="rounded-3xl border border-danchung-gold/25 bg-white/5 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.35)] px-[clamp(16px,3.8vw,22px)] py-[clamp(18px,4.2vw,26px)]"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              window.localStorage.setItem(
                "destiny:last",
                JSON.stringify({
                  name,
                  gender,
                  birthDate,
                  birthTimeUnknown,
                  birthTime,
                  mainCategory,
                  subCategory,
                  chatFiles: {
                    count: uploadedFiles.length,
                    names: uploadedFiles.map((f) => f.name),
                  },
                  // Back-compat: 기존 result 키워드 매핑용
                  mode:
                    mainCategory === "lifetimeAtlas"
                      ? "lifetimeAtlas"
                      : mainCategory === "soulBond"
                        ? "petBond"
                        : mainCategory === "career"
                          ? "pastLifeRecord"
                          : mainCategory === "money"
                            ? "loveWealth"
                            : "today",
                  ts: Date.now(),
                }),
              );
            } catch {
              // storage may be blocked; fall back to default result UI
            }
            router.push(`/${locale}/decoding`);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white/85">{nameLabel}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#050505]/30 px-3 text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-danchung-gold/40"
                placeholder={nameLabel}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white/85">{genderLabel}</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#050505]/30 px-3 text-white outline-none focus:ring-2 focus:ring-danchung-gold/40"
              >
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-white/85">{birthDateLabel}</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#050505]/30 px-3 text-white outline-none focus:ring-2 focus:ring-danchung-gold/40"
              />
            </label>

            <div className="sm:col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/85">{birthTimeLabel}</span>
                <button
                  type="button"
                  onClick={() => setBirthTimeUnknown((v) => !v)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    birthTimeUnknown
                      ? "border-danchung-gold/60 bg-danchung-gold/15 text-danchung-gold"
                      : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10",
                  ].join(" ")}
                  aria-pressed={birthTimeUnknown}
                >
                  {unknownLabel}
                </button>
              </div>

              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={birthTimeUnknown}
                className={[
                  "h-11 rounded-xl border border-white/10 bg-[#050505]/30 px-3 text-white outline-none focus:ring-2 focus:ring-danchung-gold/40",
                  birthTimeUnknown ? "opacity-50" : "opacity-100",
                ].join(" ")}
              />
            </div>
          </div>

          {/* 카테고리 시스템 */}
          <div className="mt-8">
            <div className="text-sm font-semibold text-white/85 mb-4 tracking-wide">
              {t("categoryHeading")}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {mainCategories.map((c) => {
                const active = mainCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setMainCategory(c.id);
                      // 로맨스/커리어/머니에 따라 기본 서브를 재설정
                      if (c.id === "romance") setSubCategory("reunion");
                      if (c.id === "career") setSubCategory("jobChange");
                      if (c.id === "money") setSubCategory("investment");
                      if (c.id === "soulBond") setSubCategory("dog");
                    }}
                    aria-pressed={active}
                    className={[
                      "rounded-2xl border px-4 py-4 text-left font-semibold transition-all duration-200",
                      "min-h-[54px] touch-manipulation",
                      active
                        ? "border-danchung-gold border-2 bg-gradient-to-br from-danchung-gold/35 via-white/10 to-danchung-blue/25 text-white shadow-[0_0_26px_rgba(212,175,55,0.35)]"
                        : "border-white/15 bg-white/5 text-white/75 hover:bg-white/8 hover:border-danchung-gold/40",
                    ].join(" ")}
                  >
                    <span className="block text-[clamp(0.95rem,3.2vw,1.1rem)] tracking-tight">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 서브 옵션 (선택 애니메이션) */}
            <div
              className={[
                "mt-5 overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-sm transition-[max-height,opacity,transform] duration-500",
                showSubCategory ? "max-h-[260px] opacity-100 translate-y-0 border-white/10" : "max-h-0 opacity-0 translate-y-2 border-transparent",
              ].join(" ")}
            >
              <div className="p-4 sm:p-5">
                <div className="text-xs font-semibold tracking-[0.18em] text-danchung-gold/85 uppercase">
                  {t("subOptionsHeading")}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 sm:gap-4">
                  {subCategories.map((s) => {
                    const active = subCategory === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSubCategory(s.id)}
                        aria-pressed={active}
                        className={[
                          "rounded-2xl border px-4 py-3 font-semibold transition-colors",
                          "min-h-[48px]",
                          active
                            ? "border-danchung-gold/70 bg-danchung-gold/15 text-[#FFFDD0] shadow-[0_0_28px_rgba(212,175,55,0.25)]"
                            : "border-white/15 bg-[#050505]/35 text-white/80 hover:bg-white/8 hover:border-danchung-gold/40",
                        ].join(" ")}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Data Analysis (conditional) */}
          <div
            className={[
              "mt-10 overflow-hidden transition-[max-height,opacity,transform] duration-500",
              showChatSection
                ? "max-h-[900px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 translate-y-2 pointer-events-none",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="h-12 w-12 rounded-2xl border border-danchung-gold/25 bg-danchung-gold/10 backdrop-blur-sm flex items-center justify-center"
                style={{ boxShadow: "0 0 30px rgba(212,175,55,0.10)" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 9.5C7.5 7.567 9.067 6 11 6H17C18.933 6 20.5 7.567 20.5 9.5V12.2C20.5 14.133 18.933 15.7 17 15.7H13.8L10.6 17.7V15.7H11C9.067 15.7 7.5 14.133 7.5 12.2V9.5Z"
                    stroke="rgba(212,175,55,0.95)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.7 12.4C3.4 12.1 3.2 11.7 3.2 11.2V9.7C3.2 8.1 4.4 6.9 6 6.9H7.2"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <div className="text-sm font-semibold text-white/90">
                  {t("chatAnalysisTitle")}
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {t("uploadButtonLabel")}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setUploadedFiles(list);
              }}
            />

            <div
              className={[
                "mt-4 rounded-2xl border-2 border-dashed px-4 py-6 sm:px-5",
                isDragging ? "border-danchung-gold/60 bg-danchung-gold/10" : "border-white/20 bg-white/5",
              ].join(" ")}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const list = Array.from(e.dataTransfer.files ?? []);
                setUploadedFiles(list);
              }}
            >
              <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border border-danchung-gold/35 bg-[#050505]/25 backdrop-blur-md text-white/90 font-semibold px-4 py-3 min-h-[44px] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-danchung-gold/40"
                >
                  {t("uploadButtonLabel")}
                </button>

                <div className="text-sm text-white/65">
                  {t("dropHint")}
                </div>
              </div>

              {uploadedFiles.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-danchung-gold/90">
                    {t("uploadSummary", { count: uploadedFiles.length })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedFiles.slice(0, 4).map((f) => (
                      <span
                        key={f.name}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                        title={f.name}
                      >
                        {f.name.length > 18 ? `${f.name.slice(0, 18)}...` : f.name}
                      </span>
                    ))}
                    {uploadedFiles.length > 4 ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        +{uploadedFiles.length - 4}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 text-[12px] text-white/60">
              {t("supportsNote")}
            </div>

            {shouldPrioritizeChat ? (
              <div className="mt-2 rounded-2xl border border-danchung-gold/25 bg-danchung-gold/10 px-4 py-3">
                <div className="text-xs font-semibold text-danchung-gold/95">
                  {t("priorityNoticeTitle")}
                </div>
                <div className="mt-1 text-xs text-white/70">
                  {t("priorityNoticeBody")}
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-xs font-semibold text-white/85">
                {t("privacyGuideTitle")}
              </div>
              <div className="mt-2 text-[12px] leading-relaxed text-white/65">
                {privacyGuide}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full h-12 rounded-2xl border border-danchung-gold/35 bg-[#050505]/25 backdrop-blur-md text-white/90 font-semibold shadow-[0_0_50px_rgba(0,0,0,0.22)] transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-danchung-gold/40"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
