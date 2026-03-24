-- 카톡 리포트 수동 승인(봉인 해제). Supabase SQL 에디터 또는 CLI로 실행.
create table if not exists public.kakao_report_unlocks (
  session_id text primary key,
  is_paid boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.kakao_report_unlocks enable row level security;
-- 정책 없음 → 일반 클라이언트는 접근 불가. API는 SUPABASE_SERVICE_ROLE_KEY로 RLS 우회.

comment on table public.kakao_report_unlocks is '카톡 간보기 세션별 입금 승인(서버 API만 쓰기)';
