-- Rollback do hardening controlado de public.df_notas.
-- Reverte somente FORCE RLS, preservando RLS habilitada, grants, policies e triggers.

begin;

alter table public.df_notas enable row level security;
alter table public.df_notas no force row level security;

commit;
