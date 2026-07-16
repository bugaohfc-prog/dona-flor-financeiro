-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Fechamento de Folha: hardening de EXECUTE das funcoes de itens
--
-- Contexto:
-- - As funcoes sao usadas por triggers internos.
-- - Nenhuma delas deve ser chamada diretamente via RPC por anon/authenticated.
-- =========================================================

begin;

revoke all on function public.df_folha_lancamento_itens_set_timestamps()
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_bloquear_delete()
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_bloquear_alteracao_empresa()
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_validar_vinculos()
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
from public, anon, authenticated;

do $$
declare
  unexpected_execute text;
begin
  select string_agg(routine_name || ':' || grantee, ', ' order by routine_name, grantee)
    into unexpected_execute
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name like 'df_folha_lancamento_itens_%'
    and privilege_type = 'EXECUTE'
    and grantee in ('PUBLIC', 'anon', 'authenticated');

  if unexpected_execute is not null then
    raise exception 'Unexpected EXECUTE grants on folha item functions: %', unexpected_execute;
  end if;
end $$;

commit;;
