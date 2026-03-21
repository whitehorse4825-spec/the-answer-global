import { Suspense } from "react";

import RitualPersonaFlow from "@/components/ritual/RitualPersonaFlow";
import RitualShell from "@/components/ritual/RitualShell";

type Props = { params: Promise<{ locale: string }> };

function PersonaFallback() {
  return (
    <RitualShell>
      <div className="h-56 animate-pulse rounded-2xl bg-white/[0.06]" />
    </RitualShell>
  );
}

export default async function RitualPersonaPage({ params }: Props) {
  const { locale } = await params;
  return (
    <Suspense fallback={<PersonaFallback />}>
      <RitualPersonaFlow locale={locale} />
    </Suspense>
  );
}
