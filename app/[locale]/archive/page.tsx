import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  return {
    title: t("title"),
  };
}

function toQueryString(
  sp: Record<string, string | string[] | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) q.append(k, item);
    } else {
      q.set(k, v);
    }
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** 구 인연줄 해독 입력 경로 → 재회 비방실 플로우로 통합 */
export default async function ArchivePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  redirect(`/${locale}/ritual${toQueryString(sp)}`);
}
