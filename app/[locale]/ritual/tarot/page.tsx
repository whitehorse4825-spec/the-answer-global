import { Suspense } from "react";

import RitualTarotFlow from "@/components/ritual/RitualTarotFlow";
import RitualShell from "@/components/ritual/RitualShell";

type Props = { params: Promise<{ locale: string }> };

function TarotFallback() {
  return (
    <RitualShell>
      <div className="h-56 animate-pulse rounded-2xl bg-white/[0.06]" />
    </RitualShell>
  );
}

export default async function RitualTarotPage({ params }: Props) {
  const { locale } = await params;
  return (
    <Suspense fallback={<TarotFallback />}>
      <RitualTarotFlow locale={locale} />
    </Suspense>
  );
}
