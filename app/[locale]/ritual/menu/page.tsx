import { Suspense } from "react";

import RitualMenu from "@/components/ritual/RitualMenu";

type Props = { params: Promise<{ locale: string }> };

function RitualMenuFallback() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
    </div>
  );
}

export default async function RitualMenuPage({ params }: Props) {
  const { locale } = await params;
  return (
    <Suspense fallback={<RitualMenuFallback />}>
      <RitualMenu locale={locale} />
    </Suspense>
  );
}
