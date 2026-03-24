"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { routing } from "@/i18n/routing";

const LOCALES = routing.locales;

function getPathRemainder(pathname: string) {
  const prefix = LOCALES.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
    "|",
  );
  const match = pathname.match(new RegExp(`^\\/(${prefix})(\\/.*)?$`));
  return match?.[2] ?? "";
}

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [currentLanguage, setCurrentLanguage] = useState(locale);

  const remainder = getPathRemainder(pathname);

  useEffect(() => {
    queueMicrotask(() => setCurrentLanguage(locale));
  }, [locale]);

  const remainderToUse = useMemo(() => remainder, [remainder]);

  if (LOCALES.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border border-danchung-gold/25 bg-[#050505]/20 px-2 py-1 backdrop-blur-md">
      {LOCALES.map((target) => {
        const isActive = target === currentLanguage;
        return (
          <button
            key={target}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              setCurrentLanguage(target);
              try {
                window.sessionStorage.setItem("destiny:locale", target);
              } catch {
                // ignore
              }
              router.push(`/${target}${remainderToUse}`);
            }}
            className={[
              "h-9 rounded-full px-2.5 text-[12px] sm:text-sm font-semibold tracking-[0.08em]",
              "border transition-all duration-200",
              isActive
                ? "border-danchung-gold/70 text-danchung-gold shadow-[0_0_18px_rgba(212,175,55,0.22)] underline decoration-danchung-gold/75 underline-offset-4"
                : "border-danchung-gold/30 text-white/70 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            {target.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

