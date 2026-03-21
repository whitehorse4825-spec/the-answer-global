import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getTranslations } from "next-intl/server";

import type { Metadata } from "next";
import LuxuryResult from "@/components/LuxuryResult";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Result" });
  return {
    title: t("title"),
  };
}

export default async function ResultPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-30">
        <LocaleSwitcher />
      </div>
      {/* server에서 가져온 타이틀/서브타이틀은 LuxuryResult에서 디자인적으로 재표현 */}
      <LuxuryResult locale={locale} />
    </div>
  );
}
