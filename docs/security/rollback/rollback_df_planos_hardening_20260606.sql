-- Rollback do hardening minimo da tabela public.df_planos.
-- Recria o estado remoto observado antes da migration de 2026-06-06.
-- Usar somente se a leitura do catalogo de planos for afetada de forma inesperada.

begin;

alter table public.df_planos enable row level security;
alter table public.df_planos no force row level security;

grant select, insert, update, delete, truncate, references, trigger
on table public.df_planos
to anon;

grant select, insert, update, delete, truncate, references, trigger
on table public.df_planos
to authenticated;

drop policy if exists df_planos_select_catalogo on public.df_planos;
drop policy if exists planos_select on public.df_planos;

create policy planos_select
on public.df_planos
as permissive
for select
to public
using (true);

commit;
