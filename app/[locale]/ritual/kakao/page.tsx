import { Suspense } from "react";

/**
 * 카카오 속마음 리추얼 페이지
 * - 결과 UI: `components/ritual/ResultCard.tsx` (마스크·블러·결제 CTA)
 * - 입력 폼: `components/ritual/InputForm.tsx` — 결과가 있으면 `visible={false}`로 숨김
 */
import RitualKakaoFlow from "@/components/ritual/RitualKakaoFlow";
import RitualShell from "@/components/ritual/RitualShell";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";

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
      <ClientErrorBoundary fallback={<KakaoFallback />}>
        <RitualKakaoFlow locale={locale} />
      </ClientErrorBoundary>
    </Suspense>
  );
}
