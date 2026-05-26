-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Rollback/revogacao da migration:
-- supabase/migrations/20260525123000_create_df_funcionarios_ferias.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove as tabelas de ferias:
--   public.df_funcionarios_ferias_periodos
--   public.df_funcionarios_ferias_ciclos
-- - Se houver registros reais de ferias, esses dados serao apagados.
-- - Use somente se a migration recem-aplicada falhar nos testes iniciais
--   e antes de uso real da funcionalidade.
-- - Nao use como rotina operacional.
-- - O script nao usa CASCADE de proposito, para evitar remover dependencias
--   futuras sem revisao explicita.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da migration de Gestao de Ferias.
-- 2. Confirmar que a funcionalidade ainda nao esta em uso real.
-- 3. Confirmar que nao ha registros que precisam ser preservados.
-- 4. Fazer backup/export das tabelas de ferias, se necessario.
-- 5. Executar este rollback.
-- 6. Conferir que as tabelas de ferias foram removidas.
-- 7. Conferir que public.df_funcionarios continua intacta.
-- 8. Conferir que public.df_funcionarios_exames_periodicos continua intacta.
-- 9. Conferir que tabelas financeiras, usuarios, empresas e automacoes seguem funcionando.
--
-- Este rollback NAO remove ou altera:
-- - public.df_funcionarios;
-- - public.df_funcionarios_exames_periodicos;
-- - public.df_empresas;
-- - public.df_usuarios_empresas;
-- - public.df_funcionarios_pode_escrever(uuid);
-- - policies de outras tabelas;
-- - tabelas financeiras;
-- - objetos de envio automatico, autenticacao, scripts ou automacoes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_funcionarios_ferias_periodos') is not null then
    drop policy if exists "df_funcionarios_ferias_periodos_select_admin_master" on public.df_funcionarios_ferias_periodos;
    drop policy if exists "df_funcionarios_ferias_periodos_insert_admin_master" on public.df_funcionarios_ferias_periodos;
    drop policy if exists "df_funcionarios_ferias_periodos_update_admin_master" on public.df_funcionarios_ferias_periodos;

    drop trigger if exists trg_df_funcionarios_ferias_periodos_set_timestamps on public.df_funcionarios_ferias_periodos;
    drop trigger if exists trg_df_funcionarios_ferias_periodos_bloquear_delete on public.df_funcionarios_ferias_periodos;
    drop trigger if exists trg_df_funcionarios_ferias_periodos_bloquear_alteracao_empresa on public.df_funcionarios_ferias_periodos;
    drop trigger if exists trg_df_funcionarios_ferias_periodos_validar_vinculos on public.df_funcionarios_ferias_periodos;
  end if;

  if to_regclass('public.df_funcionarios_ferias_ciclos') is not null then
    drop policy if exists "df_funcionarios_ferias_ciclos_select_admin_master" on public.df_funcionarios_ferias_ciclos;
    drop policy if exists "df_funcionarios_ferias_ciclos_insert_admin_master" on public.df_funcionarios_ferias_ciclos;
    drop policy if exists "df_funcionarios_ferias_ciclos_update_admin_master" on public.df_funcionarios_ferias_ciclos;

    drop trigger if exists trg_df_funcionarios_ferias_ciclos_set_timestamps on public.df_funcionarios_ferias_ciclos;
    drop trigger if exists trg_df_funcionarios_ferias_ciclos_bloquear_delete on public.df_funcionarios_ferias_ciclos;
    drop trigger if exists trg_df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa on public.df_funcionarios_ferias_ciclos;
    drop trigger if exists trg_df_funcionarios_ferias_ciclos_validar_funcionario_empresa on public.df_funcionarios_ferias_ciclos;
  end if;
end $$;

drop index if exists public.idx_df_funcionarios_ferias_periodos_empresa_id;
drop index if exists public.idx_df_funcionarios_ferias_periodos_funcionario_id;
drop index if exists public.idx_df_funcionarios_ferias_periodos_ciclo_id;
drop index if exists public.idx_df_funcionarios_ferias_periodos_empresa_ciclo;
drop index if exists public.idx_df_funcionarios_ferias_periodos_empresa_funcionario;
drop index if exists public.idx_df_funcionarios_ferias_periodos_empresa_arquivado;
drop index if exists public.idx_df_funcionarios_ferias_periodos_data_inicio;
drop index if exists public.idx_df_funcionarios_ferias_periodos_data_retorno;

drop index if exists public.idx_df_funcionarios_ferias_ciclos_empresa_id;
drop index if exists public.idx_df_funcionarios_ferias_ciclos_funcionario_id;
drop index if exists public.idx_df_funcionarios_ferias_ciclos_empresa_funcionario;
drop index if exists public.idx_df_funcionarios_ferias_ciclos_empresa_status;
drop index if exists public.idx_df_funcionarios_ferias_ciclos_empresa_arquivado;
drop index if exists public.idx_df_funcionarios_ferias_ciclos_data_limite;

drop table if exists public.df_funcionarios_ferias_periodos;
drop table if exists public.df_funcionarios_ferias_ciclos;

drop function if exists public.df_funcionarios_ferias_periodos_set_timestamps();
drop function if exists public.df_funcionarios_ferias_periodos_bloquear_delete();
drop function if exists public.df_funcionarios_ferias_periodos_bloquear_alteracao_empresa();
drop function if exists public.df_funcionarios_ferias_periodos_validar_vinculos();

drop function if exists public.df_funcionarios_ferias_ciclos_set_timestamps();
drop function if exists public.df_funcionarios_ferias_ciclos_bloquear_delete();
drop function if exists public.df_funcionarios_ferias_ciclos_bloquear_alteracao_empresa();
drop function if exists public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa();

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_funcionarios_ferias_periodos') as tabela_periodos;
-- select to_regclass('public.df_funcionarios_ferias_ciclos') as tabela_ciclos;
-- Resultados esperados: null.
--
-- Conferir que objetos existentes foram preservados:
-- select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- select to_regclass('public.df_funcionarios_exames_periodicos') as tabela_exames_periodicos;
-- select to_regclass('public.df_empresas') as tabela_empresas;

commit;
