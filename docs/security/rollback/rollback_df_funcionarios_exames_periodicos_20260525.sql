-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Rollback/revogacao da migration:
-- supabase/migrations/20260525113000_create_df_funcionarios_exames_periodicos.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove public.df_funcionarios_exames_periodicos.
-- - Se houver registros reais de exames periodicos, esses dados serao apagados.
-- - Use somente se a migration recem-aplicada falhar nos testes iniciais
--   e antes de uso real da funcionalidade.
-- - Nao use como rotina operacional.
-- - O script nao usa CASCADE de proposito, para evitar remover dependencias
--   futuras sem revisao explicita.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da migration de exames periodicos.
-- 2. Confirmar que a funcionalidade ainda nao esta em uso real.
-- 3. Confirmar que nao ha registros que precisam ser preservados.
-- 4. Fazer backup/export de public.df_funcionarios_exames_periodicos, se necessario.
-- 5. Executar este rollback.
-- 6. Conferir que public.df_funcionarios_exames_periodicos foi removida.
-- 7. Conferir que public.df_funcionarios e data_exame_admissional continuam intactos.
-- 8. Conferir que tabelas financeiras, usuarios, empresas e automacoes seguem funcionando.
--
-- Este rollback NAO remove ou altera:
-- - public.df_funcionarios;
-- - public.df_funcionarios.data_exame_admissional;
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
  if to_regclass('public.df_funcionarios_exames_periodicos') is not null then
    drop policy if exists "df_funcionarios_exames_periodicos_select_admin_master" on public.df_funcionarios_exames_periodicos;
    drop policy if exists "df_funcionarios_exames_periodicos_insert_admin_master" on public.df_funcionarios_exames_periodicos;
    drop policy if exists "df_funcionarios_exames_periodicos_update_admin_master" on public.df_funcionarios_exames_periodicos;

    drop trigger if exists trg_df_funcionarios_exames_periodicos_set_timestamps on public.df_funcionarios_exames_periodicos;
    drop trigger if exists trg_df_funcionarios_exames_periodicos_bloquear_delete on public.df_funcionarios_exames_periodicos;
    drop trigger if exists trg_df_funcionarios_exames_periodicos_bloquear_alteracao_empresa on public.df_funcionarios_exames_periodicos;
    drop trigger if exists trg_df_funcionarios_exames_periodicos_validar_funcionario_empresa on public.df_funcionarios_exames_periodicos;
  end if;
end $$;

drop index if exists public.idx_df_funcionarios_exames_periodicos_empresa_id;
drop index if exists public.idx_df_funcionarios_exames_periodicos_funcionario_id;
drop index if exists public.idx_df_funcionarios_exames_periodicos_data_exame;
drop index if exists public.idx_df_funcionarios_exames_periodicos_empresa_funcionario;
drop index if exists public.idx_df_funcionarios_exames_periodicos_empresa_arquivado;

drop table if exists public.df_funcionarios_exames_periodicos;

drop function if exists public.df_funcionarios_exames_periodicos_set_timestamps();
drop function if exists public.df_funcionarios_exames_periodicos_bloquear_delete();
drop function if exists public.df_funcionarios_exames_periodicos_bloquear_alteracao_empresa();
drop function if exists public.df_funcionarios_exames_periodicos_validar_funcionario_empresa();

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_funcionarios_exames_periodicos') as tabela_exames_periodicos;
-- Resultado esperado: null.
--
-- Conferir que objetos existentes foram preservados:
-- select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- select column_name
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'df_funcionarios'
--   and column_name = 'data_exame_admissional';

commit;
