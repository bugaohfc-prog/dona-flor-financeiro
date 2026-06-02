-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Rollback da migration:
-- supabase/migrations/20260601210000_create_df_auditoria_admin.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove a tabela public.df_auditoria_admin.
-- - Logs de auditoria gravados serao apagados.
-- - Use somente em falha inicial de migration, antes de uso real.
-- - Nao use como rotina operacional.
-- - Nao usa CASCADE para evitar remover dependencias futuras sem revisao.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_destinatarios_alertas') is not null then
    drop trigger if exists trg_df_destinatarios_alertas_auditoria_admin
      on public.df_destinatarios_alertas;
  end if;

  if to_regclass('public.df_auditoria_admin') is not null then
    drop policy if exists "df_auditoria_admin_select_admin_master"
      on public.df_auditoria_admin;

    drop trigger if exists trg_df_auditoria_admin_bloquear_update
      on public.df_auditoria_admin;

    drop trigger if exists trg_df_auditoria_admin_bloquear_delete
      on public.df_auditoria_admin;
  end if;
end $$;

drop index if exists public.idx_df_auditoria_admin_user_id;
drop index if exists public.idx_df_auditoria_admin_recurso_registro;
drop index if exists public.idx_df_auditoria_admin_empresa_criado;

drop table if exists public.df_auditoria_admin;

drop function if exists public.df_auditoria_admin_sanitize_destinatario_alerta();
drop function if exists public.df_auditoria_admin_bloquear_update_delete();

-- Conferencia pos-rollback esperada:
-- select to_regclass('public.df_auditoria_admin') as tabela_auditoria;
-- Resultado esperado: null.
--
-- Conferir que objetos preservados continuam existindo:
-- select to_regclass('public.df_destinatarios_alertas') as tabela_destinatarios;
-- select to_regclass('public.df_empresas') as tabela_empresas;
-- select to_regclass('public.df_usuarios_empresas') as tabela_usuarios_empresas;

commit;
