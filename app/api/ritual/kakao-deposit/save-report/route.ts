import { NextResponse } from "next/server";

import { saveKakaoReportMarkdown } from "@/lib/server/kakaoPaymentStore";

type Body = {
  sessionId?: string;
  fullReportMd?: string;
  previewMd?: string;
  consultUserName?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  const fullReportMd = body.fullReportMd?.trim() ?? "";
  const consultUserName = body.consultUserName?.trim() ?? "";

  if (!sessionId || !fullReportMd) {
    return NextResponse.json(
      { error: "session_and_report_required" },
      { status: 400 },
    );
  }

  const ok = await saveKakaoReportMarkdown(sessionId, {
    fullReportMd,
    previewMd: body.previewMd,
    consultUserName,
  });

  if (!ok) {
    return NextResponse.json({ error: "persist_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
