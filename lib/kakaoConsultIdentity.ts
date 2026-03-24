/**
 * 카톡 상담 draft·DB 입금 매칭용 — 같은 사람인지 식별 (이름 변경 시 이전 세션 무효화)
 */
export function normalizeConsultUserName(name: string): string {
  return name
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** draft 가 현재 의식 intake 이름과 같은 상담인지 */
export function draftMatchesCurrentConsult(
  consultUserNameInDraft: string | undefined,
  intakeUserName: string,
): boolean {
  const cur = normalizeConsultUserName(intakeUserName);
  if (!cur) return false;
  if (!consultUserNameInDraft || typeof consultUserNameInDraft !== "string") {
    return false;
  }
  return normalizeConsultUserName(consultUserNameInDraft) === cur;
}
