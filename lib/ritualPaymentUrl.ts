/**
 * 개발·스테이징: URL `?paymentSuccess=1&mock=1` 로 의식 잠금 해제(타로·페르소나 등).
 * 운영 기본값에서는 URL만으로 잠금 해제되지 않도록 mock=1 + 화이트리스트만 허용.
 */
export function allowRitualMockPaymentFromUrl(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_RITUAL_ALLOW_MOCK_PAY === "true"
  );
}

export function shouldMarkRitualPaidFromSearchParams(
  searchParams: URLSearchParams,
): boolean {
  if (searchParams.get("paymentSuccess") !== "1") return false;
  if (searchParams.get("mock") !== "1") return false;
  return allowRitualMockPaymentFromUrl();
}
