"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { normalizeMarkdownReportLinebreaks } from "@/lib/ritualReportLinebreaks";

type Props = {
  markdown: string;
  className?: string;
  /** 유료 전체 리포트용 타이포·여밉 강화 */
  variant?: "default" | "premium" | "premiumTeaser";
};

function mdClass(
  variant: "default" | "premium" | "premiumTeaser",
  base: string,
): string {
  if (variant === "premium" || variant === "premiumTeaser") {
    return `${base} ${base}--premium`.trim();
  }
  return base;
}

/** 페이액션: 타이밍·확률·날짜 류 문장은 첫 3문단 밖에서도 강하게 가림 */
const PAYWALL_SENSITIVE =
  /연락|확률|날짜|언제|골든|비방|D-?\s*day|디데이|재회.*시기|접선|만남.*(날|일)|통화.*(날|일)|타이밍|캘린더|점지|답장.*간격|읽씹.*후/i;

function childrenToPlainText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number")
    return String(node);
  if (Array.isArray(node)) return node.map(childrenToPlainText).join("");
  if (typeof node === "object" && "props" in node) {
    const p = (node as { props?: { children?: ReactNode } }).props;
    return childrenToPlainText(p?.children);
  }
  return "";
}

/** LLM이 코드펜스로 감싼 경우 벗겨서 ## · ** 가 본문으로 렌더되게 */
function normalizeKakaoMarkdown(raw: string): string {
  let t = raw.trim();
  const fullFence = t.match(/^```(?:markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i);
  if (fullFence?.[1]) t = fullFence[1].trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:markdown|md)?\s*\r?\n?/i, "");
    t = t.replace(/\r?\n```\s*$/i, "");
    t = t.trim();
  }
  return t;
}

/**
 * 카톡 분석 리포트 — react-markdown으로 ## · ** 등을 렌더 (raw 노출 방지)
 */
export default function KakaoReportMarkdown({
  markdown,
  className = "",
  variant = "default",
}: Props) {
  const normalized = normalizeMarkdownReportLinebreaks(
    normalizeKakaoMarkdown(markdown),
  );
  const pIndexRef = useRef(0);

  useEffect(() => {
    pIndexRef.current = 0;
  }, [normalized]);

  const effectiveVariant =
    variant === "premiumTeaser" ? "premium" : variant;
  const root = [
    "kakao-report-md",
    variant === "premium" || variant === "premiumTeaser"
      ? "kakao-report-md--premium"
      : "",
    variant === "premiumTeaser" ? "kakao-report-md--premium-teaser" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={root}>
      <ReactMarkdown
        skipHtml
        components={{
          h2: ({ children }) => (
            <h2 className={mdClass(effectiveVariant, "kakao-report-md__h2")}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={[
                mdClass(effectiveVariant, "kakao-report-md__h3"),
                variant === "premiumTeaser"
                  ? "kakao-report-md__paywall-blur kakao-report-md__paywall-blur--h3"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={variant === "premiumTeaser" ? true : undefined}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => {
            const idx = pIndexRef.current++;
            const plain = childrenToPlainText(children);
            const sensitive = PAYWALL_SENSITIVE.test(plain);
            const isClear =
              variant !== "premiumTeaser" || (idx < 3 && !sensitive);
            const blurStrong =
              variant === "premiumTeaser" && sensitive && idx < 3;
            return (
              <p
                className={[
                  mdClass(effectiveVariant, "kakao-report-md__p"),
                  variant === "premiumTeaser" && !isClear
                    ? blurStrong
                      ? "kakao-report-md__paywall-blur kakao-report-md__paywall-blur--strong"
                      : "kakao-report-md__paywall-blur"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden={
                  variant === "premiumTeaser" && !isClear ? true : undefined
                }
              >
                {children}
              </p>
            );
          },
          /* 마크다운 ** 볼드는 텍스트만 표시(굵게 처리 안 함) */
          strong: ({ children }) => (
            <span className={mdClass(effectiveVariant, "kakao-report-md__strong")}>
              {children}
            </span>
          ),
          em: ({ children }) => (
            <em className={mdClass(effectiveVariant, "kakao-report-md__em")}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul className={mdClass(effectiveVariant, "kakao-report-md__ul")}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={mdClass(effectiveVariant, "kakao-report-md__ol")}>{children}</ol>
          ),
          li: ({ children }) => (
            <li className={mdClass(effectiveVariant, "kakao-report-md__li")}>{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className={mdClass(effectiveVariant, "kakao-report-md__quote")}>
              {children}
            </blockquote>
          ),
          hr: () => <hr className="kakao-report-md__hr" />,
          pre: ({ children }: { children?: ReactNode }) => (
            <pre className="kakao-report-md__pre-block">{children}</pre>
          ),
          code: ({
            className: codeClass,
            children,
          }: {
            className?: string;
            children?: ReactNode;
          }) => {
            const isFence = Boolean(codeClass?.trim());
            if (isFence) {
              return (
                <code className={`kakao-report-md__code-block ${codeClass ?? ""}`}>
                  {children}
                </code>
              );
            }
            return (
              <span className="kakao-report-md__code-inline">{children}</span>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
