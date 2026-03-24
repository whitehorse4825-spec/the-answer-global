/**
 * 리포트·점사 본문 가독성 — LLM이 한 문단에 묶은 짧은 인용(예: 잘 자오?) 줄바꿈 보강
 * 저장 이미지(toPng)와 화면 표시 동일하게 맞추기 위해 클라이언트에서 적용한다.
 */

/** 1단계 마크다운: 인라인 ** 볼드 직전에 문단 나눔 */
export function normalizeMarkdownReportLinebreaks(md: string): string {
  let t = md;
  // 무녀체 어미 뒤 바로 오는 볼드 인용
  t = t.replace(/(구먼|하네|하오|이네)\s+(\*\*)/g, "$1\n\n$2");
  // 문장 종료 뒤 볼드 (순서 번호 "1. **…" 는 제외 — 마침표 앞이 숫자면 줄바꿈 넣지 않음)
  t = t.replace(/(?<!\d)([.!?…。])\s+(\*\*)/g, "$1\n\n$2");
  // 한글 문장 끝 + 공백 + 짧은 볼드 질문(예: **잘 자오?**)
  t = t.replace(
    /([가-힣!?])\s+(\*\*[가-힣\s?！？…]+[?？]\*\*)/g,
    "$1\n\n$2",
  );
  t = t.replace(/\n{3,}/g, "\n\n");
  return t;
}

/** 2단계 평문 점사: 무녀체 뒤 짧은 질문·대화 줄 나눔 */
export function normalizePlainTarotLinebreaks(text: string): string {
  if (!text) return text;
  let t = text;
  // 구먼/하네 … 잘 자오? 처럼 한 줄에 붙은 경우
  t = t.replace(/(구먼|하네|하오|이네)\s+([가-힣「][^\n]{0,120}?\?)/g, "$1\n\n$2");
  // 따옴표로 감싼 짧은 말 앞
  t = t.replace(
    /(구먼|하네|하오|이네)\s+([「\u201C][^\n]{0,80}?[」\u201D])/g,
    "$1\n\n$2",
  );
  // 한글 문장 끝 뒤 다음 한글 문장(숫자·날짜만의 '.'는 건너뜀)
  t = t.replace(/(?<=[가-힣])([.!?…。])\s+(?=[가-힣「])/g, "$1\n\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t;
}
