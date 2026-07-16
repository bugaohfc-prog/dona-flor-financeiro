-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Fechamento de Folha: corrige execucao do trigger de recálculo
--
-- Contexto:
-- - O hardening anterior removeu EXECUTE de PUBLIC/anon/authenticated
--   das funcoes internas de trigger.
-- - O trigger de recálculo chama uma funcao auxiliar; como o wrapper
--   estava SECURITY INVOKER, usuarios autenticados recebiam:
--   "permission denied for function df_folha_lancamento_itens_recalcular_lancamento".
--
-- Estrategia:
-- - Manter anon/authenticated sem EXECUTE direto nas funcoes internas.
-- - Executar somente a cadeia interna de recálculo como SECURITY DEFINER,
--   com search_path fixo em public.
-- =========================================================

begin;

do $$
begin
  if to_regprocedure('public.df_folha_lancamento_itens_recalcular_lancamento(uuid)') is null then
    raise exception 'Missing function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)';
  end if;

  if to_regprocedure('public.df_folha_lancamento_itens_recalcular_lancamento_trigger()') is null then
    raise exception 'Missing function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()';
  end if;
end $$;

alter function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)
security definer
set search_path = public;

alter function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
security definer
set search_path = public;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
from public, anon, authenticated;

do $$
declare
  v_recalculo_security_definer boolean;
  v_trigger_security_definer boolean;
  v_unexpected_execute text;
begin
  select p.prosecdef
    into v_recalculo_security_definer
  from pg_proc p
  where p.oid = 'public.df_folha_lancamento_itens_recalcular_lancamento(uuid)'::regprocedure;

  select p.prosecdef
    into v_trigger_security_definer
  from pg_proc p
  where p.oid = 'public.df_folha_lancamento_itens_recalcular_lancamento_trigger()'::regprocedure;

  if coalesce(v_recalculo_security_definer, false) = false then
    raise exception 'df_folha_lancamento_itens_recalcular_lancamento(uuid) must be SECURITY DEFINER';
  end if;

  if coalesce(v_trigger_security_definer, false) = false then
    raise exception 'df_folha_lancamento_itens_recalcular_lancamento_trigger() must be SECURITY DEFINER';
  end if;

  select string_agg(routine_name || ':' || grantee, ', ' order by routine_name, grantee)
    into v_unexpected_execute
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name in (
      'df_folha_lancamento_itens_recalcular_lancamento',
      'df_folha_lancamento_itens_recalcular_lancamento_trigger'
    )
    and privilege_type = 'EXECUTE'
    and grantee in ('PUBLIC', 'anon', 'authenticated');

  if v_unexpected_execute is not null then
    raise exception 'Unexpected EXECUTE grants on folha item recalculation functions: %', v_unexpected_execute;
  end if;
end $$;

commit;;
