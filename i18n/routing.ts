import { defineRouting } from "next-intl/routing";

/** 한국 타겟: 단일 로케일 (다국어 경로 비활성화) */
export const routing = defineRouting({
  locales: ["ko"],
  defaultLocale: "ko",
});

