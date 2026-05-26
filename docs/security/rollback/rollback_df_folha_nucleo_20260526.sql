-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Rollback/revogacao da migration:
-- supabase/migrations/20260526_create_df_folha_nucleo.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove as tabelas do nucleo do Fechamento de Folha:
--   public.df_folha_lancamentos
--   public.df_folha_competencias
-- - Se houver registros reais de folha, esses dados serao apagados.
-- - Use somente se a migration recem-aplicada falhar nos testes iniciais
--   e antes de uso real da funcionalidade.
-- - Nao use como rotina operacional.
-- - O script nao usa CASCADE de proposito, para evitar remover dependencias
--   futuras sem revisao explicita.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da migration do nucleo do Fechamento de Folha.
-- 2. Confirmar que a funcionalidade ainda nao esta em uso real.
-- 3. Confirmar que nao ha registros que precisam ser preservados.
-- 4. Fazer backup/export das tabelas de folha, se necessario.
-- 5. Executar este rollback.
-- 6. Conferir que as tabelas de folha foram removidas.
-- 7. Conferir que public.df_funcionarios continua intacta.
-- 8. Conferir que Gestao de Ferias continua intacta.
-- 9. Conferir que tabelas financeiras, usuarios, empresas e automacoes seguem funcionando.
--
-- Este rollback NAO remove ou altera:
-- - public.df_funcionarios;
-- - public.df_funcionarios_exames_periodicos;
-- - public.df_funcionarios_ferias_ciclos;
-- - public.df_funcionarios_ferias_periodos;
-- - public.df_empresas;
-- - public.df_filiais;
-- - public.df_usuarios_empresas;
-- - public.df_funcionarios_pode_escrever(uuid);
-- - policies de outras tabelas;
-- - tabelas financeiras;
-- - objetos de envio automatico, autenticacao, scripts ou automacoes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_folha_lancamentos') is not null then
    drop policy if exists "df_folha_lancamentos_select_admin_master" on public.df_folha_lancamentos;
    drop policy if exists "df_folha_lancamentos_insert_admin_master" on public.df_folha_lancamentos;
    drop policy if exists "df_folha_lancamentos_update_admin_master" on public.df_folha_lancamentos;

    drop trigger if exists trg_df_folha_lancamentos_set_timestamps on public.df_folha_lancamentos;
    drop trigger if exists trg_df_folha_lancamentos_bloquear_delete on public.df_folha_lancamentos;
    drop trigger if exists trg_df_folha_lancamentos_bloquear_alteracao_empresa on public.df_folha_lancamentos;
    drop trigger if exists trg_df_folha_lancamentos_validar_vinculos on public.df_folha_lancamentos;
  end if;

  if to_regclass('public.df_folha_competencias') is not null then
    drop policy if exists "df_folha_competencias_select_admin_master" on public.df_folha_competencias;
    drop policy if exists "df_folha_competencias_insert_admin_master" on public.df_folha_competencias;
    drop policy if exists "df_folha_competencias_update_admin_master" on public.df_folha_competencias;

    drop trigger if exists trg_df_folha_competencias_set_timestamps on public.df_folha_competencias;
    drop trigger if exists trg_df_folha_competencias_bloquear_delete on public.df_folha_competencias;
    drop trigger if exists trg_df_folha_competencias_bloquear_alteracao_empresa on public.df_folha_competencias;
  end if;
end $$;

drop index if exists public.idx_df_folha_lancamentos_empresa_id;
drop index if exists public.idx_df_folha_lancamentos_competencia_id;
drop index if exists public.idx_df_folha_lancamentos_funcionario_id;
drop index if exists public.idx_df_folha_lancamentos_categoria;
drop index if exists public.idx_df_folha_lancamentos_natureza;
drop index if exists public.idx_df_folha_lancamentos_arquivado;
drop index if exists public.idx_df_folha_lancamentos_data_referencia;

drop index if exists public.uq_df_folha_competencias_empresa_competencia_ativa;
drop index if exists public.idx_df_folha_competencias_empresa_id;
drop index if exists public.idx_df_folha_competencias_competencia;
drop index if exists public.idx_df_folha_competencias_status;
drop index if exists public.idx_df_folha_competencias_arquivado;
drop index if exists public.idx_df_folha_competencias_empresa_competencia;

drop table if exists public.df_folha_lancamentos;
drop table if exists public.df_folha_competencias;

drop function if exists public.df_folha_lancamentos_set_timestamps();
drop function if exists public.df_folha_lancamentos_bloquear_delete();
drop function if exists public.df_folha_lancamentos_bloquear_alteracao_empresa();
drop function if exists public.df_folha_lancamentos_validar_vinculos();

drop function if exists public.df_folha_competencias_set_timestamps();
drop function if exists public.df_folha_competencias_bloquear_delete();
drop function if exists public.df_folha_competencias_bloquear_alteracao_empresa();

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_folha_lancamentos') as tabela_lancamentos;
-- select to_regclass('public.df_folha_competencias') as tabela_competencias;
-- Resultados esperados: null.
--
-- Conferir que objetos existentes foram preservados:
-- select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- select to_regclass('public.df_funcionarios_ferias_ciclos') as tabela_ferias_ciclos;
-- select to_regclass('public.df_funcionarios_ferias_periodos') as tabela_ferias_periodos;
-- select to_regclass('public.df_empresas') as tabela_empresas;

commit;
