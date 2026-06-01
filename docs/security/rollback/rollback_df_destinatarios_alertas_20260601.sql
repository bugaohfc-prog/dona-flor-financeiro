-- =========================================================
-- DNA Gestao - E-mail/Notificacoes
-- Rollback/revogacao da migration:
-- supabase/migrations/20260601160000_create_df_destinatarios_alertas.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove a tabela public.df_destinatarios_alertas.
-- - Se houver destinatarios reais cadastrados, esses dados serao apagados.
-- - Use somente se a migration recem-aplicada falhar nos testes iniciais
--   e antes de uso real da funcionalidade.
-- - Nao use como rotina operacional.
-- - O script nao usa CASCADE de proposito, para evitar remover dependencias
--   futuras sem revisao explicita.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da migration de destinatarios de alertas.
-- 2. Confirmar que a funcionalidade ainda nao esta em uso real.
-- 3. Confirmar que nao ha destinatarios que precisam ser preservados.
-- 4. Fazer backup/export da tabela, se necessario.
-- 5. Executar este rollback.
-- 6. Conferir que a tabela foi removida.
-- 7. Conferir que df_configuracoes, df_configuracoes_alertas,
--    df_usuarios_empresas e df_empresas continuam intactas.
--
-- Este rollback NAO remove ou altera:
-- - public.df_configuracoes;
-- - public.df_configuracoes_alertas;
-- - public.df_usuarios_empresas;
-- - public.df_empresas;
-- - workflows do GitHub Actions;
-- - scripts de envio automatico;
-- - secrets;
-- - frontend.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_destinatarios_alertas') is not null then
    drop policy if exists "df_destinatarios_alertas_select_empresa" on public.df_destinatarios_alertas;
    drop policy if exists "df_destinatarios_alertas_insert_admin_master" on public.df_destinatarios_alertas;
    drop policy if exists "df_destinatarios_alertas_update_admin_master" on public.df_destinatarios_alertas;

    drop trigger if exists trg_df_destinatarios_alertas_set_timestamps on public.df_destinatarios_alertas;
    drop trigger if exists trg_df_destinatarios_alertas_bloquear_delete on public.df_destinatarios_alertas;
    drop trigger if exists trg_df_destinatarios_alertas_bloquear_alteracao_empresa on public.df_destinatarios_alertas;
  end if;
end $$;

drop index if exists public.uq_df_destinatarios_alertas_empresa_email;
drop index if exists public.idx_df_destinatarios_alertas_empresa_ativo;
drop index if exists public.idx_df_destinatarios_alertas_empresa_id;

drop table if exists public.df_destinatarios_alertas;

drop function if exists public.df_destinatarios_alertas_set_timestamps();
drop function if exists public.df_destinatarios_alertas_bloquear_delete();
drop function if exists public.df_destinatarios_alertas_bloquear_alteracao_empresa();

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_destinatarios_alertas') as tabela_destinatarios;
-- Resultado esperado: null.
--
-- Conferir que objetos existentes foram preservados:
-- select to_regclass('public.df_configuracoes') as tabela_configuracoes;
-- select to_regclass('public.df_configuracoes_alertas') as tabela_configuracoes_alertas;
-- select to_regclass('public.df_usuarios_empresas') as tabela_usuarios_empresas;
-- select to_regclass('public.df_empresas') as tabela_empresas;

commit;
