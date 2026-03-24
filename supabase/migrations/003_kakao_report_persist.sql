-- 동일 상담자(이름) 재접속 시 리포트 복구용 + 전문 영구 저장
alter table public.kakao_report_unlocks
  add column if not exists consult_user_normalized text;

alter table public.kakao_report_unlocks
  add column if not exists full_report_md text;

alter table public.kakao_report_unlocks
  add column if not exists preview_md text;

comment on column public.kakao_report_unlocks.consult_user_normalized is '의식 userName 정규화 — 복구 조회';
comment on column public.kakao_report_unlocks.full_report_md is '유료 전문 마크다운 (네트워크 끊김 대비)';
comment on column public.kakao_report_unlocks.preview_md is '간보기 본문 (선택)';

create index if not exists kakao_unlocks_consult_recover_idx
  on public.kakao_report_unlocks (consult_user_normalized, updated_at desc)
  where is_paid = true and full_report_md is not null;
