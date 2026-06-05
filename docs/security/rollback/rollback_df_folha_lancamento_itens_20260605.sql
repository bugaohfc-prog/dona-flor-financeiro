-- =========================================================
-- Rollback - df_folha_lancamento_itens
-- DNA Gestao - Gestao de Pessoas / Fechamento de Folha
--
-- Uso:
-- - Executar somente se for necessario remover a estrutura de itens
--   detalhados criada pela migration 20260605130000.
-- - Este rollback remove a tabela e as funcoes/triggers relacionadas.
-- - Os valores ja materializados em df_folha_lancamentos.valor nao sao
--   restaurados para o estado anterior automaticamente.
-- =========================================================

begin;

drop policy if exists "df_folha_lancamento_itens_select_admin_master"
on public.df_folha_lancamento_itens;

drop policy if exists "df_folha_lancamento_itens_insert_admin_master"
on public.df_folha_lancamento_itens;

drop policy if exists "df_folha_lancamento_itens_update_admin_master"
on public.df_folha_lancamento_itens;

drop trigger if exists trg_df_folha_lancamento_itens_recalcular_lancamento
on public.df_folha_lancamento_itens;

drop trigger if exists trg_df_folha_lancamento_itens_validar_vinculos
on public.df_folha_lancamento_itens;

drop trigger if exists trg_df_folha_lancamento_itens_bloquear_alteracao_empresa
on public.df_folha_lancamento_itens;

drop trigger if exists trg_df_folha_lancamento_itens_bloquear_delete
on public.df_folha_lancamento_itens;

drop trigger if exists trg_df_folha_lancamento_itens_set_timestamps
on public.df_folha_lancamento_itens;

drop index if exists public.idx_df_folha_lancamento_itens_empresa_comp_func;
drop index if exists public.idx_df_folha_lancamento_itens_data_referencia;
drop index if exists public.idx_df_folha_lancamento_itens_arquivado;
drop index if exists public.idx_df_folha_lancamento_itens_categoria;
drop index if exists public.idx_df_folha_lancamento_itens_funcionario_id;
drop index if exists public.idx_df_folha_lancamento_itens_lancamento_id;
drop index if exists public.idx_df_folha_lancamento_itens_competencia_id;
drop index if exists public.idx_df_folha_lancamento_itens_empresa_id;

drop table if exists public.df_folha_lancamento_itens;

drop function if exists public.df_folha_lancamento_itens_recalcular_lancamento_trigger();
drop function if exists public.df_folha_lancamento_itens_recalcular_lancamento(uuid);
drop function if exists public.df_folha_lancamento_itens_validar_vinculos();
drop function if exists public.df_folha_lancamento_itens_bloquear_alteracao_empresa();
drop function if exists public.df_folha_lancamento_itens_bloquear_delete();
drop function if exists public.df_folha_lancamento_itens_set_timestamps();

commit;

-- Validacao sugerida apos rollback:
-- select to_regclass('public.df_folha_lancamento_itens') as tabela_itens;
-- select proname
-- from pg_proc
-- where pronamespace = 'public'::regnamespace
--   and proname like 'df_folha_lancamento_itens_%';
