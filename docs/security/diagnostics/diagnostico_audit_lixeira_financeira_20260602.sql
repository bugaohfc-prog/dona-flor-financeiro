-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Diagnostico estrutural: Fase 2 Lixeira/restauracao
--
-- Uso:
-- - Rodar manualmente no Supabase apos aplicar a migration.
-- - Este arquivo apenas consulta metadados; nao altera dados.
-- =========================================================

-- 1. Tabelas envolvidas existem.
select
  to_regclass('public.df_auditoria_admin') as tabela_auditoria_admin,
  to_regclass('public.df_contas') as tabela_contas,
  to_regclass('public.df_notas') as tabela_notas;

-- 2. Colunas exigidas para auditar Lixeira.
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('df_contas', 'df_notas')
  and column_name in ('id', 'empresa_id', 'excluido', 'excluido_em')
order by table_name, column_name;

-- 3. RLS da tabela de auditoria preservada.
select
  relname,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.df_auditoria_admin'::regclass;

-- 4. Policies da auditoria. Esperado: sem ALL/INSERT/UPDATE/DELETE.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
order by policyname;

-- Resultado esperado: zero linhas.
select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'df_auditoria_admin'
  and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

-- 5. Grants da auditoria. Esperado: authenticated apenas SELECT; anon sem acesso.
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_auditoria_admin'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 6. Triggers da Fase 2.
select
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and trigger_name in (
    'trg_df_contas_auditoria_lixeira',
    'trg_df_notas_auditoria_lixeira'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 7. Funcao da Fase 2.
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'df_auditoria_admin_sanitize_lixeira_financeira';

-- 8. Amostra de logs da Fase 2 para revisar sanitizacao.
-- Esperado: detalhes somente com excluido/excluido_em_presente/exclusao_definitiva.
select
  acao,
  recurso,
  registro_id,
  origem,
  detalhes,
  criado_em
from public.df_auditoria_admin
where recurso in ('df_contas', 'df_notas')
  and acao in (
    'conta_lixeira_enviada',
    'conta_lixeira_restaurada',
    'conta_lixeira_status_atualizado',
    'conta_lixeira_excluida_definitivo',
    'nota_lixeira_enviada',
    'nota_lixeira_restaurada',
    'nota_lixeira_status_atualizado',
    'nota_lixeira_excluida_definitivo'
  )
order by criado_em desc
limit 20;

-- 9. Busca defensiva de termos sensiveis em detalhes dos logs da Fase 2.
-- Resultado esperado: zero linhas.
select
  id,
  acao,
  recurso,
  registro_id,
  detalhes
from public.df_auditoria_admin
where recurso in ('df_contas', 'df_notas')
  and acao like '%lixeira%'
  and (
    detalhes::text ~* '([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})'
    or detalhes::text ~* 'cpf'
    or detalhes::text ~* 'sal[aá]rio'
    or detalhes::text ~* 'm[eé]dic'
    or detalhes::text ~* 'laudo'
    or detalhes::text ~* 'anexo'
    or detalhes::text ~* 'secret'
    or detalhes::text ~* 'senha'
    or detalhes::text ~* 'token'
    or detalhes::text ~* 'descricao'
    or detalhes::text ~* 'descrição'
    or detalhes::text ~* 'titulo'
    or detalhes::text ~* 'título'
    or detalhes::text ~* 'conteudo'
    or detalhes::text ~* 'conteúdo'
    or detalhes::text ~* 'observacao'
    or detalhes::text ~* 'observação'
    or detalhes::text ~* 'valor'
  )
order by criado_em desc
limit 20;
