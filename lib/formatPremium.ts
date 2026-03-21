/**
 * 글로벌 프리미엄 표시가 — 금액은 제품 정책에 맞게 상수만 조정.
 * UI 문구와 숫자가 어긋나지 않도록 여기서만 포맷한다.
 */
export function formatPremiumPrice(locale: string): string {
  const loc =
    locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  const currency =
    locale === "ko" ? "KRW" : locale === "ja" ? "JPY" : "USD";
  const amount =
    locale === "ko" ? 19_900 : locale === "ja" ? 1_900 : 14.99;

  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: locale === "en" ? 2 : 0,
  }).format(amount);
}
