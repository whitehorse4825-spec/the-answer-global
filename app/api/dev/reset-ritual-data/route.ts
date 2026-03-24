import { NextResponse } from "next/server";

import {
  deleteAllKakaoUnlocksDev,
  deleteKakaoUnlockRow,
} from "@/lib/server/kakaoPaymentStore";

type Body = {
  sessionId?: string;
  /** 개발만: kakao_report_unlocks 전부 삭제 */
  purgeAllUnlocks?: boolean;
};

function isResetAllowed(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.RITUAL_DEV_RESET_SECRET?.trim();
  if (!secret) return false;
  const got =
    req.headers.get("x-ritual-dev-reset")?.trim() ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return got === secret;
}

/**
 * 개발·비상용: Supabase `kakao_report_unlocks` 행 삭제.
 * 프로덕션에서는 `RITUAL_DEV_RESET_SECRET` + 헤더 `x-ritual-dev-reset` 필요.
 */
export async function POST(req: Request) {
  if (!isResetAllowed(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Body = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (body.purgeAllUnlocks) {
    const ok = await deleteAllKakaoUnlocksDev();
    if (!ok) {
      return NextResponse.json(
        { error: "purge_not_allowed_or_failed" },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true, purged: "all_unlocks" });
  }

  const sid = body.sessionId?.trim();
  if (!sid) {
    return NextResponse.json(
      { error: "sessionId_required_or_purgeAllUnlocks" },
      { status: 400 },
    );
  }

  const ok = await deleteKakaoUnlockRow(sid);
  if (!ok) {
    return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, deletedSessionId: sid });
}
