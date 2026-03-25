/**
 * 나이스페이 결제창 JS — 샌드·운영 **동일 URL** (clientId로 구분). 샌드박스는 API만 sandbox-api.
 * @see nicepay-manual common/test.md, common/api.md
 */
export function resolveNicepaySdkUrl(
  _clientId: string,
  override?: string | null,
): string {
  void _clientId;
  const t = override?.trim();
  if (t) return t.endsWith("/") ? t : `${t}/`;
  return "https://pay.nicepay.co.kr/v1/js/";
}

export function resolveNicepayApiBase(
  clientId: string,
  override?: string | null,
): string {
  const t = override?.trim();
  if (t) return t.replace(/\/$/, "");
  return clientId.startsWith("S2_")
    ? "https://sandbox-api.nicepay.co.kr"
    : "https://api.nicepay.co.kr";
}
