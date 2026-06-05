-- =========================================================
-- Rollback - hotfix de execucao do recalculo de itens da folha
-- Data: 2026-06-05
--
-- Atencao:
-- - Este rollback restaura o modo SECURITY INVOKER das funcoes de recalculo.
-- - Isso pode reintroduzir o erro:
--   "permission denied for function df_folha_lancamento_itens_recalcular_lancamento"
--   para usuarios autenticados no fluxo de itens detalhados.
-- =========================================================

begin;

alter function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)
security invoker
set search_path = public;

alter function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
security invoker
set search_path = public;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento(uuid)
from public, anon, authenticated;

revoke all on function public.df_folha_lancamento_itens_recalcular_lancamento_trigger()
from public, anon, authenticated;

commit;

-- Validacao opcional:
-- select
--   p.oid::regprocedure::text as assinatura,
--   case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as modo,
--   array_to_string(p.proconfig, ', ') as config
-- from pg_proc p
-- where p.oid in (
--   'public.df_folha_lancamento_itens_recalcular_lancamento(uuid)'::regprocedure,
--   'public.df_folha_lancamento_itens_recalcular_lancamento_trigger()'::regprocedure
-- )
-- order by assinatura;
