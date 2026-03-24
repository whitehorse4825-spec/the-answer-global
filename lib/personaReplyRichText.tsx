import type { ReactNode } from "react";

/**
 * 처방 레이블 + 콜론 + 따옴표로 감싼 실전 한 통.
 * 「돌려 말해봐」/「돌려말해봐」 둘 다 허용.
 */
function prescriptionPattern(): RegExp {
  return /(차라리\s+)?(이렇게 보내라|이렇게 보내봐|이런\s*식으로\s*돌려\s*말해봐)(\s*:\s*)(['"])([\s\S]*?)\4/g;
}

/**
 * 3단계 무녀 훈수: LLM이 쓴 ** 제거, 처방 레이블+콜론은 굵게, 따옴표와 안 문구는 빨간색.
 */
export function PersonaAssistantBubbleContent({ text }: { text: string }): ReactNode {
  const cleaned = text.replace(/\*\*/g, "");
  const re = prescriptionPattern();
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={`t-${key++}`}>{cleaned.slice(last, m.index)}</span>,
      );
    }
    const charari = m[1];
    const label = m[2];
    const colonSpace = m[3];
    const q = m[4];
    const inner = m[5];
    parts.push(
      <span key={`p-${key++}`}>
        {charari ? <span>{charari}</span> : null}
        <span className="font-bold text-[#111]">{label}</span>
        <span className="font-bold text-[#111]">{colonSpace}</span>
        <span className="font-semibold text-red-600">{q}</span>
        <span className="font-semibold text-red-600">{inner}</span>
        <span className="font-semibold text-red-600">{q}</span>
      </span>,
    );
    last = re.lastIndex;
  }
  if (last < cleaned.length) {
    parts.push(<span key={`t-${key++}`}>{cleaned.slice(last)}</span>);
  }
  return <>{parts}</>;
}
