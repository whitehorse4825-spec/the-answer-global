-- 페이액션 매칭용 입금 대기 + 브라우저 Realtime 구독(anon SELECT)
-- Supabase SQL 에디터에서 순서대로 실행. 이미 컬럼이 있으면 해당 줄은 생략 가능.

alter table public.kakao_report_unlocks
  add column if not exists is_pending boolean not null default false;

alter table public.kakao_report_unlocks
  add column if not exists expected_amount_won integer;

alter table public.kakao_report_unlocks
  add column if not exists depositor_name text;

comment on column public.kakao_report_unlocks.is_pending is '유저가 입금 완료 누름 → 웹훅 매칭 대기';
comment on column public.kakao_report_unlocks.expected_amount_won is '기대 입금액(원)';
comment on column public.kakao_report_unlocks.depositor_name is '입금자명(의식 intake userName 등) — 페이액션 sender 와 매칭';

-- Realtime: 테이블이 이미 publication 에 있으면 이 줄은 에러 날 수 있음(무시)
alter publication supabase_realtime add table public.kakao_report_unlocks;

-- anon 이 행을 읽을 수 있어야 Realtime postgres_changes 가 클라이언트에 전달됨 (세션 id 는 UUID 급 비밀값으로 취급)
drop policy if exists "kakao_unlocks_select_anon" on public.kakao_report_unlocks;
create policy "kakao_unlocks_select_anon"
  on public.kakao_report_unlocks
  for select
  to anon
  using (true);
