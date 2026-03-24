import { NextResponse } from "next/server";

import { findLatestPaidReportForConsult } from "@/lib/server/kakaoPaymentStore";

/**
 * 동일 상담자 이름으로 유료 전문이 DB에 있으면 복구 (네트워크 끊김·재접속)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userName = url.searchParams.get("userName")?.trim() ?? "";
  if (!userName) {
    return NextResponse.json({ error: "userName_required" }, { status: 400 });
  }

  const row = await findLatestPaidReportForConsult(userName);
  if (!row) {
    return NextResponse.json({ recovered: false });
  }

  return NextResponse.json({
    recovered: true,
    sessionId: row.sessionId,
    fullReportMd: row.fullReportMd,
    previewMd: row.previewMd,
  });
}
