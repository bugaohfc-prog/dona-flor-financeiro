-- Hardening minimo da tabela public.df_planos.
-- Contexto:
-- - df_planos e catalogo global de planos, sem dados pessoais;
-- - o frontend usa a tabela apenas para leitura em billingService;
-- - anon/authenticated tinham grants amplos, incluindo escrita e TRUNCATE;
-- - a policy anterior era SELECT para public usando true.

begin;

alter table public.df_planos enable row level security;
alter table public.df_planos force row level security;

drop policy if exists planos_select on public.df_planos;
drop policy if exists df_planos_select_catalogo on public.df_planos;

revoke all privileges on table public.df_planos from anon;
revoke all privileges on table public.df_planos from authenticated;

grant select on table public.df_planos to anon;
grant select on table public.df_planos to authenticated;

create policy df_planos_select_catalogo
on public.df_planos
as permissive
for select
to anon, authenticated
using (ativo = true);

commit;
