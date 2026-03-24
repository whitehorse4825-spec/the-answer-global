"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  type KakaoAdviceStyle,
  type KakaoAnalysisContext,
  type KakaoAtmosphere,
  type KakaoBond,
} from "@/lib/kakaoAnalysisContext";

export type InputFormProps = {
  /** false면 아예 마운트하지 않음 — 결과 화면에서 하단 입력 중복 방지 */
  visible: boolean;
  analysisContext: KakaoAnalysisContext;
  setAnalysisContext: Dispatch<SetStateAction<KakaoAnalysisContext>>;
  targetName: string;
  setTargetName: (v: string) => void;
  selfBubbleColorHint: string;
  setSelfBubbleColorHint: (v: string) => void;
  otherBubbleColorHint: string;
  setOtherBubbleColorHint: (v: string) => void;
  text: string;
  setText: (v: string) => void;
  imageFiles: File[];
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTextFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  analyzeError: string | null;
  busy: boolean;
  canSubmit: boolean;
  onAnalyze: () => void;
};

const bondOptions: { id: KakaoBond; labelKey: string }[] = [
  { id: "some", labelKey: "kakaoBond_some" },
  { id: "lover", labelKey: "kakaoBond_lover" },
  { id: "ex", labelKey: "kakaoBond_ex" },
  { id: "business", labelKey: "kakaoBond_business" },
];
const moodOptions: { id: KakaoAtmosphere; labelKey: string }[] = [
  { id: "sweet", labelKey: "kakaoMood_sweet" },
  { id: "fight", labelKey: "kakaoMood_fight" },
  { id: "ghosted", labelKey: "kakaoMood_ghosted" },
];
const adviceOptions: { id: KakaoAdviceStyle; labelKey: string }[] = [
  { id: "roast", labelKey: "kakaoAdvice_roast" },
  { id: "comfort", labelKey: "kakaoAdvice_comfort" },
  { id: "strategy", labelKey: "kakaoAdvice_strategy" },
];

/** 카카오 리추얼 입력 폼 — `visible === false`이면 렌더하지 않음 */
export default function InputForm({
  visible,
  analysisContext,
  setAnalysisContext,
  targetName,
  setTargetName,
  selfBubbleColorHint,
  setSelfBubbleColorHint,
  otherBubbleColorHint,
  setOtherBubbleColorHint,
  text,
  setText,
  imageFiles,
  onImageChange,
  onTextFileChange,
  analyzeError,
  busy,
  canSubmit,
  onAnalyze,
}: InputFormProps) {
  const t = useTranslations("Ritual");
  const textFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pickedTextFileName, setPickedTextFileName] = useState<string | null>(
    null,
  );

  const handleTextFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.files?.[0]?.name?.trim();
    setPickedTextFileName(name || null);
    onTextFileChange(e);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-xl border border-danchung-gold/22 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-center text-xs font-bold tracking-wide text-danchung-gold">
          {t("kakaoCtxHeading")}
        </p>

        <div className="mt-4">
          <span className="form-label-mudang">{t("kakaoCtxBond")}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {bondOptions.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setAnalysisContext((prev) => ({ ...prev, bond: id }))
                }
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  analysisContext.bond === id
                    ? "border-danchung-gold/85 bg-danchung-gold/18 text-[#FFF8E7] shadow-[0_0_16px_rgba(212,175,55,0.15)]"
                    : "border-white/14 bg-black/35 text-white/68 hover:border-white/28",
                ].join(" ")}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="form-label-mudang">{t("kakaoCtxMood")}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {moodOptions.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setAnalysisContext((prev) => ({ ...prev, atmosphere: id }))
                }
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  analysisContext.atmosphere === id
                    ? "border-danchung-gold/85 bg-danchung-gold/18 text-[#FFF8E7] shadow-[0_0_16px_rgba(212,175,55,0.15)]"
                    : "border-white/14 bg-black/35 text-white/68 hover:border-white/28",
                ].join(" ")}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="form-label-mudang">{t("kakaoCtxAdvice")}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {adviceOptions.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setAnalysisContext((prev) => ({
                    ...prev,
                    adviceStyle: id,
                  }))
                }
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  analysisContext.adviceStyle === id
                    ? "border-danchung-gold/85 bg-danchung-gold/18 text-[#FFF8E7] shadow-[0_0_16px_rgba(212,175,55,0.15)]"
                    : "border-white/14 bg-black/35 text-white/68 hover:border-white/28",
                ].join(" ")}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-danchung-gold/80">
          {t("kakaoTargetNameLabel")}
        </span>
        <input
          type="text"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-[#FFF8E7] outline-none placeholder:text-white/35 focus:border-danchung-gold/45"
          placeholder={t("kakaoTargetNamePlaceholder")}
          autoComplete="nickname"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
          {t("kakaoTargetNameSpellingHint")}
        </p>
      </label>

      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <p className="text-[11px] font-semibold text-danchung-gold/90">
          {t("kakaoBubbleSectionTitle")}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">
          {t("kakaoBubbleSectionLead")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-danchung-gold/35 bg-danchung-gold/10 px-2.5 py-1.5 text-[11px] font-medium text-[#FFF8E7] hover:border-danchung-gold/55"
            onClick={() => {
              setSelfBubbleColorHint(t("kakaoBubblePresetSelfYellow"));
              setOtherBubbleColorHint(t("kakaoBubblePresetOtherWhite"));
            }}
          >
            {t("kakaoBubbleQuickKakaoDefault")}
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-[11px] text-white/65 hover:border-white/30"
            onClick={() => {
              setSelfBubbleColorHint("");
              setOtherBubbleColorHint("");
            }}
          >
            {t("kakaoBubbleClear")}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] text-danchung-gold/75">
              {t("kakaoBubbleSelfLabel")}
            </span>
            <input
              type="text"
              value={selfBubbleColorHint}
              onChange={(e) =>
                setSelfBubbleColorHint(e.target.value.slice(0, 48))
              }
              className="mt-1.5 w-full rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-sm text-[#FFF8E7] outline-none placeholder:text-white/30 focus:border-danchung-gold/40"
              placeholder={t("kakaoBubbleSelfPlaceholder")}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-danchung-gold/75">
              {t("kakaoBubbleOtherLabel")}
            </span>
            <input
              type="text"
              value={otherBubbleColorHint}
              onChange={(e) =>
                setOtherBubbleColorHint(e.target.value.slice(0, 48))
              }
              className="mt-1.5 w-full rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-sm text-[#FFF8E7] outline-none placeholder:text-white/30 focus:border-danchung-gold/40"
              placeholder={t("kakaoBubbleOtherPlaceholder")}
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-danchung-gold/80">{t("kakaoPaste")}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="kakao-sns-bubble-text mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-4 text-[#FFF8E7] placeholder:text-white/35"
          placeholder={t("kakaoPlaceholder")}
        />
      </label>
      <p className="text-[11px] leading-relaxed text-white/45">
        {t("kakaoInputHint")}
      </p>

      <div className="block text-xs text-danchung-gold/70">
        <span className="block pb-1">{t("kakaoTextFileHint")}</span>
        <input
          ref={textFileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          tabIndex={-1}
          aria-label={t("kakaoFilePickTxt")}
          onChange={handleTextFileChange}
        />
        <button
          type="button"
          className="rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-medium text-[#FFF8E7] hover:border-danchung-gold/45 hover:bg-black/65"
          onClick={() => textFileInputRef.current?.click()}
        >
          {t("kakaoFilePickTxt")}
        </button>
        {pickedTextFileName ? (
          <span className="mt-1.5 block text-[11px] text-danchung-gold/60">
            {t("kakaoFileSelectedTxt", { name: pickedTextFileName })}
          </span>
        ) : null}
      </div>

      <div className="block text-xs text-danchung-gold/70">
        <span className="block pb-1">{t("kakaoImageHint")}</span>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={t("kakaoFilePickImages")}
          onChange={onImageChange}
        />
        <button
          type="button"
          className="rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-medium text-[#FFF8E7] hover:border-danchung-gold/45 hover:bg-black/65"
          onClick={() => imageInputRef.current?.click()}
        >
          {t("kakaoFilePickImages")}
        </button>
        {imageFiles.length > 0 ? (
          <span className="mt-1.5 block text-[11px] text-danchung-gold/55">
            {t("kakaoImageCount", { n: imageFiles.length })}
          </span>
        ) : null}
      </div>

      {analyzeError ? (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-200/90">
          {analyzeError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={onAnalyze}
        className="w-full rounded-xl border border-danchung-gold/45 py-3 text-sm font-semibold text-danchung-gold disabled:opacity-40"
      >
        {busy ? t("analyzing") : t("runAnalysisPreview")}
      </button>
    </div>
  );
}
