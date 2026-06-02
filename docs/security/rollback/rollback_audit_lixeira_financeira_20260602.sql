-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Rollback da Fase 2: Lixeira/restauracao
-- Migration:
-- supabase/migrations/20260602103000_audit_lixeira_financeira.sql
--
-- ATENCAO:
-- - Remove apenas triggers/função desta fase.
-- - Nao remove public.df_auditoria_admin.
-- - Nao apaga logs ja gravados.
-- - Nao usa CASCADE.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_contas') is not null then
    drop trigger if exists trg_df_contas_auditoria_lixeira
      on public.df_contas;
  end if;

  if to_regclass('public.df_notas') is not null then
    drop trigger if exists trg_df_notas_auditoria_lixeira
      on public.df_notas;
  end if;
end $$;

drop function if exists public.df_auditoria_admin_sanitize_lixeira_financeira();

-- Conferencia pos-rollback esperada:
-- select trigger_name
-- from information_schema.triggers
-- where event_object_schema = 'public'
--   and trigger_name in (
--     'trg_df_contas_auditoria_lixeira',
--     'trg_df_notas_auditoria_lixeira'
--   );
-- Resultado esperado: zero linhas.
--
-- A tabela de auditoria deve permanecer:
-- select to_regclass('public.df_auditoria_admin') as tabela_auditoria;

commit;
