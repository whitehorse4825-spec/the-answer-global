/**
 * 카톡 리포트 봉인 해제 — Supabase 우선, 미설정 시 서버 메모리 폴백(서버리스 비영속).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { normalizeConsultUserName } from "@/lib/kakaoConsultIdentity";

const TABLE = "kakao_report_unlocks";

type MemoryRow = {
  is_paid: boolean;
  is_pending: boolean;
  expected_amount_won: number | null;
  depositor_name: string | null;
  consult_user_normalized: string | null;
  full_report_md: string | null;
  preview_md: string | null;
  updated_at: string;
};

const memoryStore = new Map<string, MemoryRow>();

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** 입금자명 비교용(공백 제거·소문자) */
export function normalizeDepositorName(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function namesMatch(stored: string | null, sender: string): boolean {
  const a = normalizeDepositorName(stored ?? "");
  const b = normalizeDepositorName(sender);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export async function getKakaoSessionPaid(sessionId: string): Promise<boolean> {
  const sid = sessionId.trim();
  if (!sid) return false;

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("is_paid")
      .eq("session_id", sid)
      .maybeSingle();
    if (error) {
      console.error("[kakaoPaymentStore] supabase read", error.message);
      return false;
    }
    return Boolean(data?.is_paid);
  }

  return memoryStore.get(sid)?.is_paid ?? false;
}

export async function setKakaoSessionPaid(
  sessionId: string,
  paid: boolean,
): Promise<boolean> {
  const sid = sessionId.trim();
  if (!sid) return false;

  const sb = getSupabase();
  if (sb) {
    const { data: cur, error: readErr } = await sb
      .from(TABLE)
      .select(
        "is_pending, expected_amount_won, depositor_name, consult_user_normalized, full_report_md, preview_md",
      )
      .eq("session_id", sid)
      .maybeSingle();
    if (readErr) {
      console.error("[kakaoPaymentStore] read before paid", readErr.message);
    }
    const row = {
      session_id: sid,
      is_paid: paid,
      is_pending: paid ? false : Boolean(cur?.is_pending),
      expected_amount_won: cur?.expected_amount_won ?? null,
      depositor_name: cur?.depositor_name ?? null,
      consult_user_normalized: cur?.consult_user_normalized ?? null,
      full_report_md: cur?.full_report_md ?? null,
      preview_md: cur?.preview_md ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from(TABLE).upsert(row, {
      onConflict: "session_id",
    });
    if (error) {
      console.error("[kakaoPaymentStore] supabase upsert", error.message);
      return false;
    }
    return true;
  }

  const existing = memoryStore.get(sid);
  memoryStore.set(sid, {
    is_paid: paid,
    is_pending: paid ? false : (existing?.is_pending ?? false),
    expected_amount_won: existing?.expected_amount_won ?? null,
    depositor_name: existing?.depositor_name ?? null,
    consult_user_normalized: existing?.consult_user_normalized ?? null,
    full_report_md: existing?.full_report_md ?? null,
    preview_md: existing?.preview_md ?? null,
    updated_at: new Date().toISOString(),
  });
  return true;
}

/** 유저가 「입금 완료」 — 페이액션 sender / amount 와 매칭 대기 */
export async function registerKakaoPendingDeposit(
  sessionId: string,
  depositorName: string,
  amountWon: number,
): Promise<boolean> {
  const sid = sessionId.trim();
  const name = depositorName.trim();
  if (!sid || !name || !Number.isFinite(amountWon) || amountWon <= 0) return false;

  const norm = normalizeConsultUserName(name);
  const row = {
    session_id: sid,
    is_paid: false,
    is_pending: true,
    expected_amount_won: Math.round(amountWon),
    depositor_name: name,
    consult_user_normalized: norm || null,
    updated_at: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).upsert(row, {
      onConflict: "session_id",
    });
    if (error) {
      console.error("[kakaoPaymentStore] register pending", error.message);
      return false;
    }
    return true;
  }

  memoryStore.set(sid, {
    is_paid: false,
    is_pending: true,
    expected_amount_won: row.expected_amount_won,
    depositor_name: row.depositor_name,
    consult_user_normalized: norm || null,
    full_report_md: null,
    preview_md: null,
    updated_at: row.updated_at,
  });
  return true;
}

/** 전문 생성 후 DB 영구 저장 — 재접속 시 복구 */
export async function saveKakaoReportMarkdown(
  sessionId: string,
  data: {
    fullReportMd: string;
    previewMd?: string | null;
    consultUserName: string;
  },
): Promise<boolean> {
  const sid = sessionId.trim();
  if (!sid || !data.fullReportMd.trim()) return false;

  const norm = normalizeConsultUserName(data.consultUserName);
  const payload = {
    full_report_md: data.fullReportMd,
    preview_md: data.previewMd?.trim() ? data.previewMd : null,
    consult_user_normalized: norm || null,
    updated_at: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).update(payload).eq("session_id", sid);
    if (error) {
      console.error("[kakaoPaymentStore] save report", error.message);
      return false;
    }
    return true;
  }

  const cur = memoryStore.get(sid);
  if (!cur) return false;
  memoryStore.set(sid, {
    ...cur,
    full_report_md: payload.full_report_md,
    preview_md: payload.preview_md,
    consult_user_normalized: payload.consult_user_normalized,
    updated_at: payload.updated_at,
  });
  return true;
}

export type RecoveredKakaoReport = {
  sessionId: string;
  fullReportMd: string;
  previewMd: string | null;
};

/** 동일 상담자(이름) 최신 유료 전문 복구 */
export async function findLatestPaidReportForConsult(
  consultUserName: string,
): Promise<RecoveredKakaoReport | null> {
  const norm = normalizeConsultUserName(consultUserName);
  if (!norm) return null;

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("session_id, full_report_md, preview_md")
      .eq("is_paid", true)
      .eq("consult_user_normalized", norm)
      .not("full_report_md", "is", null)
      .neq("full_report_md", "")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[kakaoPaymentStore] recover query", error.message);
      return null;
    }
    if (!data?.full_report_md || !data.session_id) return null;
    return {
      sessionId: data.session_id,
      fullReportMd: data.full_report_md,
      previewMd: data.preview_md ?? null,
    };
  }

  let best: RecoveredKakaoReport | null = null;
  let bestTs = "";
  for (const [sid, row] of memoryStore) {
    if (
      row.is_paid &&
      row.full_report_md &&
      row.consult_user_normalized === norm &&
      row.updated_at > bestTs
    ) {
      bestTs = row.updated_at;
      best = {
        sessionId: sid,
        fullReportMd: row.full_report_md,
        previewMd: row.preview_md,
      };
    }
  }
  return best;
}

/**
 * 페이액션 웹훅: is_pending 이고 금액 일치·입금자명 매칭되는 행을 is_paid 로 갱신.
 */
export async function resolvePayActionWebhookMatch(
  sender: string,
  amountWon: number,
): Promise<{ ok: boolean; sessionId?: string; reason?: string }> {
  const amount = Math.round(amountWon);
  if (!sender.trim() || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "invalid_sender_or_amount" };
  }

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from(TABLE)
      .select("session_id, depositor_name, expected_amount_won, updated_at")
      .eq("is_pending", true)
      .eq("is_paid", false)
      .eq("expected_amount_won", amount)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[kakaoPaymentStore] webhook query", error.message);
      return { ok: false, reason: "db_error" };
    }

    const rows = data ?? [];
    const hit =
      rows.find((r) => namesMatch(r.depositor_name, sender)) ?? null;
    if (!hit) {
      return { ok: false, reason: "no_matching_pending_row" };
    }

    const { error: upErr } = await sb
      .from(TABLE)
      .update({
        is_paid: true,
        is_pending: false,
        consult_user_normalized:
          normalizeConsultUserName(hit.depositor_name ?? "") || null,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", hit.session_id);

    if (upErr) {
      console.error("[kakaoPaymentStore] webhook update", upErr.message);
      return { ok: false, reason: "update_failed" };
    }
    return { ok: true, sessionId: hit.session_id };
  }

  /* 메모리 폴백 */
  let best: { sid: string; row: MemoryRow } | null = null;
  for (const [sid, row] of memoryStore) {
    if (
      row.is_pending &&
      !row.is_paid &&
      row.expected_amount_won === amount &&
      namesMatch(row.depositor_name, sender)
    ) {
      if (!best || row.updated_at > best.row.updated_at) {
        best = { sid, row };
      }
    }
  }
  if (!best) return { ok: false, reason: "no_matching_pending_row" };

  const cnMem =
    best.row.consult_user_normalized ||
    normalizeConsultUserName(best.row.depositor_name ?? "") ||
    null;
  memoryStore.set(best.sid, {
    ...best.row,
    is_paid: true,
    is_pending: false,
    consult_user_normalized: cnMem,
    updated_at: new Date().toISOString(),
  });
  return { ok: true, sessionId: best.sid };
}

/**
 * 페이액션: `sessionId`(또는 orderId)가 오면 **그 행만** 승인 — 현재 상담 1:1 식별
 */
export async function resolvePayActionWebhookBySessionId(
  sessionId: string,
  opts?: { amountWon?: number; sender?: string },
): Promise<{ ok: boolean; reason?: string }> {
  const sid = sessionId.trim();
  if (!sid) return { ok: false, reason: "invalid_session" };

  const sb = getSupabase();
  if (sb) {
    const { data: row, error } = await sb
      .from(TABLE)
      .select(
        "session_id, is_pending, is_paid, expected_amount_won, depositor_name",
      )
      .eq("session_id", sid)
      .maybeSingle();
    if (error) {
      console.error("[kakaoPaymentStore] webhook session read", error.message);
      return { ok: false, reason: "db_error" };
    }
    if (!row) return { ok: false, reason: "session_not_found" };
    if (row.is_paid) return { ok: true, reason: "already_paid" };
    if (!row.is_pending) return { ok: false, reason: "not_pending" };

    if (opts?.amountWon != null && row.expected_amount_won != null) {
      if (Math.round(opts.amountWon) !== row.expected_amount_won) {
        return { ok: false, reason: "amount_mismatch" };
      }
    }
    if (opts?.sender && !namesMatch(row.depositor_name, opts.sender)) {
      return { ok: false, reason: "sender_mismatch" };
    }

    const { error: upErr } = await sb
      .from(TABLE)
      .update({
        is_paid: true,
        is_pending: false,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sid);
    if (upErr) {
      console.error("[kakaoPaymentStore] webhook session update", upErr.message);
      return { ok: false, reason: "update_failed" };
    }
    return { ok: true };
  }

  const row = memoryStore.get(sid);
  if (!row) return { ok: false, reason: "session_not_found" };
  if (row.is_paid) return { ok: true, reason: "already_paid" };
  if (!row.is_pending) return { ok: false, reason: "not_pending" };
  if (opts?.amountWon != null && row.expected_amount_won != null) {
    if (Math.round(opts.amountWon) !== row.expected_amount_won) {
      return { ok: false, reason: "amount_mismatch" };
    }
  }
  if (opts?.sender && !namesMatch(row.depositor_name, opts.sender)) {
    return { ok: false, reason: "sender_mismatch" };
  }
  const cnSid =
    row.consult_user_normalized ||
    normalizeConsultUserName(row.depositor_name ?? "") ||
    null;
  memoryStore.set(sid, {
    ...row,
    is_paid: true,
    is_pending: false,
    consult_user_normalized: cnSid,
    updated_at: new Date().toISOString(),
  });
  return { ok: true };
}

export async function deleteKakaoUnlockRow(sessionId: string): Promise<boolean> {
  const sid = sessionId.trim();
  if (!sid) return false;
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from(TABLE).delete().eq("session_id", sid);
    if (error) {
      console.error("[kakaoPaymentStore] delete row", error.message);
      return false;
    }
    return true;
  }
  memoryStore.delete(sid);
  return true;
}

/** 개발·비상용 — 프로덕션에서는 RITUAL_ALLOW_DEV_PURGE=true 일 때만 */
export async function deleteAllKakaoUnlocksDev(): Promise<boolean> {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.RITUAL_ALLOW_DEV_PURGE === "true";
  if (!allow) return false;

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb
      .from(TABLE)
      .delete()
      .gte("updated_at", "1970-01-01T00:00:00Z");
    if (error) {
      console.error("[kakaoPaymentStore] delete all", error.message);
      return false;
    }
    return true;
  }
  memoryStore.clear();
  return true;
}
