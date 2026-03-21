import { Suspense } from "react";

import RitualKakaoFlow from "@/components/ritual/RitualKakaoFlow";
import RitualShell from "@/components/ritual/RitualShell";

type Props = { params: Promise<{ locale: string }> };

function KakaoFallback() {
  return (
    <RitualShell>
      <div className="h-56 animate-pulse rounded-2xl bg-white/[0.06]" />
    </RitualShell>
  );
}

export default async function RitualKakaoPage({ params }: Props) {
  const { locale } = await params;
  return (
    <Suspense fallback={<KakaoFallback />}>
      <RitualKakaoFlow locale={locale} />
    </Suspense>
  );
}
