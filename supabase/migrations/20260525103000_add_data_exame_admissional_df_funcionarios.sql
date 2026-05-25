-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Migration de revisao: adiciona data_exame_admissional em public.df_funcionarios.
--
-- ATENCAO:
-- - Arquivo gerado para aplicacao controlada no Supabase principal.
-- - Nao aplicar automaticamente sem pre-flight e rollback revisados.
-- - A coluna guarda somente data operacional de exame admissional.
-- - Nao armazenar laudos, resultados, documentos, anexos, uploads,
--   base64, links publicos, observacoes medicas ou informacoes clinicas.
-- - RLS, policies, triggers e permissoes nao sao alterados neste ciclo.
--
-- Pre-flight sugerido antes de aplicar:
-- 1. Confirmar tabela:
--    select to_regclass('public.df_funcionarios') as tabela;
-- 2. Confirmar que a coluna ainda nao existe:
--    select column_name, data_type, is_nullable
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios'
--      and column_name = 'data_exame_admissional';
-- 3. Confirmar RLS habilitada e forcada:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 4. Confirmar triggers principais:
--    select tgname
--    from pg_trigger
--    where tgrelid = 'public.df_funcionarios'::regclass
--      and not tgisinternal
--    order by tgname;
-- 5. Confirmar que nao ha policy DELETE/ALL:
--    select policyname, cmd
--    from pg_policies
--    where schemaname = 'public'
--      and tablename = 'df_funcionarios'
--      and cmd in ('DELETE', 'ALL');
-- 6. Confirmar rollback disponivel:
--    docs/security/rollback/rollback_df_funcionarios_data_exame_admissional_20260525.sql
-- 7. Confirmar que o frontend ainda nao depende desta coluna.
-- =========================================================

begin;

do $$
declare
  v_data_type text;
  v_is_nullable text;
begin
  if to_regclass('public.df_funcionarios') is null then
    raise exception 'Missing table public.df_funcionarios';
  end if;

  select data_type, is_nullable
    into v_data_type, v_is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'df_funcionarios'
    and column_name = 'data_exame_admissional';

  if v_data_type is not null and (v_data_type <> 'date' or v_is_nullable <> 'YES') then
    raise exception 'Column public.df_funcionarios.data_exame_admissional exists with unexpected definition: %, nullable %',
      v_data_type,
      v_is_nullable;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_funcionarios'
      and cmd in ('DELETE', 'ALL')
  ) then
    raise exception 'Unexpected DELETE/ALL policy found on public.df_funcionarios';
  end if;
end $$;

alter table public.df_funcionarios
  add column if not exists data_exame_admissional date;

comment on column public.df_funcionarios.data_exame_admissional is
  'Data do exame admissional para controle operacional de vencimento periodico. Nao armazenar laudos, resultados, documentos ou informacoes clinicas.';

-- Checklist pos-aplicacao:
-- 1. Confirmar que a coluna existe como date e nullable:
--    select column_name, data_type, is_nullable, column_default
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'df_funcionarios'
--      and column_name = 'data_exame_admissional';
-- 2. Confirmar RLS habilitada e forcada:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 3. Confirmar triggers preservados:
--    select tgname
--    from pg_trigger
--    where tgrelid = 'public.df_funcionarios'::regclass
--      and not tgisinternal
--    order by tgname;
-- 4. Confirmar que nao ha policy DELETE/ALL:
--    select policyname, cmd
--    from pg_policies
--    where schemaname = 'public'
--      and tablename = 'df_funcionarios'
--      and cmd in ('DELETE', 'ALL');
-- 5. Reexecutar o script local de validacao RLS:
--    scripts/validar-rls-df-funcionarios.mjs
-- 6. Confirmar que a tela Funcionarios segue abrindo sem depender desta coluna.

commit;
