-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Rollback especifico da coluna data_exame_admissional.
--
-- Migration relacionada:
-- supabase/migrations/20260525103000_add_data_exame_admissional_df_funcionarios.sql
--
-- ATENCAO CRITICA:
-- - Este rollback remove somente a coluna
--   public.df_funcionarios.data_exame_admissional.
-- - Se houver valores preenchidos nessa coluna, eles serao apagados.
-- - Nao remove a tabela public.df_funcionarios.
-- - Nao remove policies, triggers, funcoes, indices ou dados de outros campos.
-- - Use apenas se a aplicacao da migration da coluna precisar ser revertida.
--
-- Antes de executar:
-- 1. Confirmar que a falha veio da coluna data_exame_admissional.
-- 2. Confirmar se existem valores que precisam ser preservados:
--    select count(*) as funcionarios_com_data_exame_admissional
--    from public.df_funcionarios
--    where data_exame_admissional is not null;
-- 3. Fazer backup/export dessa coluna, se necessario.
-- 4. Confirmar que o rollback principal da tabela NAO e necessario.
-- 5. Executar este rollback.
-- 6. Conferir que somente a coluna foi removida.
-- 7. Conferir que RLS, policies e triggers seguem preservados.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null then
    raise exception 'Missing table public.df_funcionarios';
  end if;
end $$;

alter table public.df_funcionarios
  drop column if exists data_exame_admissional;

-- Conferencia pos-rollback esperada:
-- 1. A consulta abaixo deve retornar zero linhas:
--    select column_name
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios'
--      and column_name = 'data_exame_admissional';
-- 2. A tabela deve continuar existindo:
--    select to_regclass('public.df_funcionarios') as tabela;
-- 3. RLS deve continuar habilitada e forcada:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 4. Triggers devem continuar existindo:
--    select tgname
--    from pg_trigger
--    where tgrelid = 'public.df_funcionarios'::regclass
--      and not tgisinternal
--    order by tgname;

commit;
