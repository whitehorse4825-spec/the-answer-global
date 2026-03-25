/* eslint-disable react/no-children-prop */
"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export default class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(e: unknown): State {
    return {
      hasError: true,
      message:
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "알 수 없는 클라이언트 오류",
    };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ClientErrorBoundary]", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-red-500/25 bg-red-950/30 px-5 py-6">
          <p className="mb-3 text-center text-sm font-bold text-red-300">
            페이지 오류가 발생했습니다.
          </p>
          <p className="text-center text-xs leading-relaxed text-white/70">
            {this.state.message}
          </p>
          {this.props.fallback ? (
            <div className="mt-4">{this.props.fallback}</div>
          ) : null}
          <div className="mt-5 text-center">
            <button
              type="button"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/85 hover:bg-white/15"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }
}

