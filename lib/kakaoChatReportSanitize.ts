/**
 * LLM이 자주 내는 애칭 오표기(마이선 → 마이성)를 입력 근거에 맞게 교정.
 * 대화·targetName에 실제로 「마이성」이 등장하면 건드리지 않는다.
 */
export function sanitizeMaiSunNicknameInReport(
  chatText: string,
  targetName: string | undefined,
  report: string,
): string {
  const corpus = `${chatText}\n${targetName ?? ""}`;
  const mentionsMaiSun =
    /마이선/.test(corpus) || /마이\s*\+\s*선/.test(corpus);
  const mentionsMaiSeong = /마이성/.test(corpus);
  if (!mentionsMaiSun || mentionsMaiSeong) return report;
  return report.replace(/마이성/g, "마이선");
}
