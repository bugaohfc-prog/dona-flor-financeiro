-- =========================================================
-- DNA Gestao - Mini RH
-- Rollback/revogacao emergencial da migration:
-- supabase/migrations/20260524190000_create_df_funcionarios.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove a tabela public.df_funcionarios.
-- - Se houver dados reais na tabela, esses dados serao apagados.
-- - Use somente se a migration df_funcionarios recem-aplicada falhar nos
--   testes iniciais e antes de uso real do modulo Mini RH.
-- - Nao use como rotina operacional.
-- - O script nao usa CASCADE de proposito, para evitar remover dependencias
--   futuras sem revisao explicita.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da migration df_funcionarios.
-- 2. Confirmar que o Mini RH ainda nao esta em uso real.
-- 3. Confirmar que nao ha dados que precisam ser preservados.
-- 4. Fazer backup/export de public.df_funcionarios, se necessario.
-- 5. Executar este rollback.
-- 6. Conferir que public.df_funcionarios foi removida.
-- 7. Conferir que df_empresas, df_filiais, df_usuarios_empresas e tabelas
--    financeiras continuam funcionando.
--
-- Este rollback NAO remove:
-- - public.df_empresas;
-- - public.df_filiais;
-- - public.df_usuarios_empresas;
-- - public.is_master();
-- - public.df_usuario_eh_admin(uuid);
-- - policies de outras tabelas;
-- - tabelas financeiras;
-- - objetos de envio automatico, autenticacao, scripts ou automacoes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is not null then
    drop policy if exists "df_funcionarios_select_rh_inicial" on public.df_funcionarios;
    drop policy if exists "df_funcionarios_insert_admin_master" on public.df_funcionarios;
    drop policy if exists "df_funcionarios_update_admin_master" on public.df_funcionarios;

    drop trigger if exists trg_df_funcionarios_bloquear_delete on public.df_funcionarios;
    drop trigger if exists trg_df_funcionarios_validar_filial_empresa on public.df_funcionarios;
    drop trigger if exists trg_df_funcionarios_bloquear_alteracao_empresa on public.df_funcionarios;
    drop trigger if exists trg_df_funcionarios_set_timestamps on public.df_funcionarios;
  end if;
end $$;

drop index if exists public.idx_df_funcionarios_empresa_id;
drop index if exists public.idx_df_funcionarios_empresa_status;
drop index if exists public.idx_df_funcionarios_empresa_filial;
drop index if exists public.idx_df_funcionarios_empresa_nome_lower;
drop index if exists public.idx_df_funcionarios_empresa_ativos;

-- Se o unique parcial de CPF for ativado em ciclo futuro, este DROP continua seguro.
drop index if exists public.uq_df_funcionarios_empresa_cpf_ativo;

drop table if exists public.df_funcionarios;

drop function if exists public.df_funcionarios_bloquear_delete();
drop function if exists public.df_funcionarios_validar_filial_empresa();
drop function if exists public.df_funcionarios_bloquear_alteracao_empresa();
drop function if exists public.df_funcionarios_set_timestamps();

-- Helper criado pela migration df_funcionarios para policies iniciais do Mini RH.
-- Sem CASCADE: se outro objeto futuro passar a depender dele, o rollback deve parar.
drop function if exists public.df_usuario_tem_perfil_empresa(uuid, text[]);

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_funcionarios') as tabela_df_funcionarios;
-- Resultado esperado: null.

commit;
