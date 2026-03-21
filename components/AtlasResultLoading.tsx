"use client";

import { useTranslations } from "next-intl";

const GLYPHS = ["木", "火", "土", "金", "水"] as const;

/**
 * 무료 인생도감 결과 로딩 — 단청 문양 회전 + 오행 글자 순환
 */
export default function AtlasResultLoading() {
  const t = useTranslations("Result");

  return (
    <div className="lux-atlas-loading-root" role="status" aria-live="polite">
      <div className="lux-atlas-loading-ornament" aria-hidden>
        <div className="lux-atlas-loading-dancheong" />
        <div className="lux-atlas-loading-glyph-stack">
          {GLYPHS.map((g, i) => (
            <span
              key={g}
              className="lux-atlas-loading-glyph"
              style={{ animationDelay: `${i * 1.35}s` }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      <p className="lux-atlas-loading-caption max-w-[min(92vw,22rem)] text-center text-[11px] leading-snug tracking-wide text-danchung-gold/70">
        {t("resultLoadingMessage")}
      </p>
    </div>
  );
}
