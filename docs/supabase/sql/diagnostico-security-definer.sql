-- DNA Gestao - Diagnostico SECURITY DEFINER expostas
-- Projeto Supabase: contas-donaflor
-- Data: 2026-06-28
--
-- SOMENTE LEITURA.
-- Este arquivo contem apenas SELECTs de catalogo para auditoria.
-- Nao executa REVOKE, GRANT, ALTER FUNCTION, DROP, CREATE POLICY,
-- ALTER VIEW, CREATE INDEX, DROP INDEX, migration ou alteracao de dados.
--
-- Uso sugerido:
-- 1. Executar no SQL Editor do Supabase.
-- 2. Exportar/salvar os resultados por secao.
-- 3. Usar os resultados para planejar ciclos futuros com rollback.
--
-- Escopo:
-- - funcoes SECURITY DEFINER no schema public;
-- - grants/privilegios de EXECUTE;
-- - funcoes potencialmente expostas por PostgREST/RPC;
-- - triggers, policies e views que referenciam funcoes sensiveis;
-- - busca textual de funcoes que chamam outras funcoes sensiveis.

-- ============================================================
-- A. Funcoes SECURITY DEFINER no schema public
-- ============================================================

with funcoes_security_definer as (
  select
    p.oid,
    n.nspname as schema_name,
    p.proname as function_name,
    p.oid::regprocedure::text as signature,
    pg_get_function_identity_arguments(p.oid) as arguments,
    l.lanname as language,
    p.prosecdef as security_definer,
    case p.provolatile
      when 'i' then 'immutable'
      when 's' then 'stable'
      when 'v' then 'volatile'
      else p.provolatile::text
    end as volatility,
    p.proconfig as function_config,
    exists (
      select 1
      from unnest(coalesce(p.proconfig, array[]::text[])) cfg
      where cfg like 'search_path=%'
    ) as has_search_path_config,
    pg_get_userbyid(p.proowner) as owner_name,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_has_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_has_execute,
    p.proacl::text as acl_raw,
    left(regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g'), 700) as definition_summary
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where n.nspname = 'public'
    and p.prosecdef = true
)
select
  schema_name,
  function_name,
  signature,
  arguments,
  language,
  security_definer,
  volatility,
  has_search_path_config,
  function_config,
  owner_name,
  anon_has_execute,
  authenticated_has_execute,
  acl_raw,
  definition_summary
from funcoes_security_definer
order by function_name, arguments;

-- ============================================================
-- B. Grants de EXECUTE e privilegios efetivos
-- ============================================================

with funcoes_security_definer as (
  select
    p.oid,
    n.nspname as schema_name,
    p.proname as function_name,
    p.oid::regprocedure::text as signature,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proacl::text as acl_raw
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef = true
),
roles_interesse as (
  select 'anon'::name as role_name
  union all
  select 'authenticated'::name
  union all
  select 'service_role'::name
)
select
  f.schema_name,
  f.function_name,
  f.signature,
  f.arguments,
  r.role_name as grantee,
  case
    when has_function_privilege(r.role_name, f.oid, 'EXECUTE') then 'EXECUTE'
    else null
  end as privilege_type,
  has_function_privilege('anon', f.oid, 'EXECUTE') as anon_has_execute,
  has_function_privilege('authenticated', f.oid, 'EXECUTE') as authenticated_has_execute,
  f.acl_raw
from funcoes_security_definer f
cross join roles_interesse r
order by f.function_name, f.arguments, r.role_name;

-- Grants explicitos registrados em information_schema.
-- Observacao: privilegios herdados via PUBLIC podem aparecer melhor no SELECT anterior.
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.routine_privileges
where routine_schema = 'public'
  and privilege_type = 'EXECUTE'
  and routine_name in (
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
  )
order by routine_name, grantee;

-- ============================================================
-- C. Funcoes potencialmente expostas em PostgREST/RPC
-- ============================================================

select
  n.nspname as schema_name,
  p.proname as function_name,
  p.oid::regprocedure::text as signature,
  pg_get_function_identity_arguments(p.oid) as arguments,
  l.lanname as language,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_has_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_has_execute,
  case
    when has_function_privilege('anon', p.oid, 'EXECUTE') then '/rest/v1/rpc/' || p.proname
    when has_function_privilege('authenticated', p.oid, 'EXECUTE') then '/rest/v1/rpc/' || p.proname
    else null
  end as possible_rpc_path
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.prosecdef = true
  and (
    has_function_privilege('anon', p.oid, 'EXECUTE')
    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
order by p.proname, pg_get_function_identity_arguments(p.oid);

-- ============================================================
-- D1. Dependencias - triggers que usam funcoes SECURITY DEFINER
-- ============================================================

with funcoes_security_definer as (
  select
    p.proname as function_name,
    p.oid::regprocedure::text as signature
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef = true
)
select
  t.trigger_schema,
  t.event_object_schema,
  t.event_object_table,
  t.trigger_name,
  f.function_name,
  f.signature,
  t.action_timing,
  t.event_manipulation,
  t.action_statement
from information_schema.triggers t
join funcoes_security_definer f
  on t.action_statement ilike '%' || f.function_name || '(%'
order by t.event_object_schema, t.event_object_table, t.trigger_name, f.function_name;

-- ============================================================
-- D2. Dependencias - policies que citam funcoes SECURITY DEFINER
-- ============================================================

with funcoes_security_definer as (
  select
    p.proname as function_name,
    p.oid::regprocedure::text as signature
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef = true
)
select
  pol.schemaname,
  pol.tablename,
  pol.policyname,
  pol.roles,
  pol.cmd,
  f.function_name,
  f.signature,
  pol.qual,
  pol.with_check
from pg_policies pol
join funcoes_security_definer f
  on coalesce(pol.qual, '') ilike '%' || f.function_name || '(%'
  or coalesce(pol.with_check, '') ilike '%' || f.function_name || '(%'
where pol.schemaname = 'public'
order by pol.tablename, pol.policyname, f.function_name;

-- ============================================================
-- D3. Dependencias - views que citam funcoes SECURITY DEFINER
-- ============================================================

with funcoes_security_definer as (
  select
    p.proname as function_name,
    p.oid::regprocedure::text as signature
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef = true
),
views_publicas as (
  select
    v.schemaname,
    v.viewname,
    v.definition
  from pg_views v
  where v.schemaname = 'public'
)
select
  v.schemaname,
  v.viewname,
  f.function_name,
  f.signature,
  left(regexp_replace(v.definition, '\s+', ' ', 'g'), 900) as view_definition_summary
from views_publicas v
join funcoes_security_definer f
  on v.definition ilike '%' || f.function_name || '(%'
order by v.viewname, f.function_name;

-- ============================================================
-- E1. Busca textual - policies por funcao sensivel conhecida
-- ============================================================

with funcoes_alvo(function_name) as (
  values
    ('criar_usuario'),
    ('login_usuario'),
    ('get_empresa_usuario'),
    ('is_admin'),
    ('is_master'),
    ('handle_new_user'),
    ('vincular_usuario_logado'),
    ('df_empresas_do_usuario'),
    ('df_usuario_eh_admin'),
    ('df_usuario_tem_perfil_empresa'),
    ('df_usuario_alvo_eh_master'),
    ('df_funcionarios_pode_escrever'),
    ('df_funcionarios_validar_filial_empresa'),
    ('df_funcionarios_exames_periodicos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_ciclos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_periodos_validar_vinculos'),
    ('df_folha_lancamentos_validar_vinculos'),
    ('df_auditoria_admin_sanitize_destinatario_alerta')
)
select
  pol.schemaname,
  pol.tablename,
  pol.policyname,
  pol.roles,
  pol.cmd,
  fa.function_name,
  pol.qual,
  pol.with_check
from pg_policies pol
join funcoes_alvo fa
  on coalesce(pol.qual, '') ilike '%' || fa.function_name || '(%'
  or coalesce(pol.with_check, '') ilike '%' || fa.function_name || '(%'
where pol.schemaname = 'public'
order by fa.function_name, pol.tablename, pol.policyname;

-- ============================================================
-- E2. Busca textual - funcoes que chamam funcoes sensiveis
-- ============================================================

with funcoes_alvo(function_name) as (
  values
    ('criar_usuario'),
    ('login_usuario'),
    ('get_empresa_usuario'),
    ('is_admin'),
    ('is_master'),
    ('handle_new_user'),
    ('vincular_usuario_logado'),
    ('df_empresas_do_usuario'),
    ('df_usuario_eh_admin'),
    ('df_usuario_tem_perfil_empresa'),
    ('df_usuario_alvo_eh_master'),
    ('df_funcionarios_pode_escrever'),
    ('df_funcionarios_validar_filial_empresa'),
    ('df_funcionarios_exames_periodicos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_ciclos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_periodos_validar_vinculos'),
    ('df_folha_lancamentos_validar_vinculos'),
    ('df_auditoria_admin_sanitize_destinatario_alerta')
),
funcoes_publicas as (
  select
    n.nspname as schema_name,
    p.proname as caller_function,
    p.oid::regprocedure::text as caller_signature,
    p.prosecdef as caller_security_definer,
    pg_get_functiondef(p.oid) as function_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select
  fp.schema_name,
  fp.caller_function,
  fp.caller_signature,
  fp.caller_security_definer,
  fa.function_name as referenced_function,
  left(regexp_replace(fp.function_definition, '\s+', ' ', 'g'), 900) as caller_definition_summary
from funcoes_publicas fp
join funcoes_alvo fa
  on fp.function_definition ilike '%' || fa.function_name || '(%'
where fp.caller_function <> fa.function_name
order by fa.function_name, fp.caller_function;

-- ============================================================
-- E3. Definicao completa por funcao alvo
-- ============================================================

with funcoes_alvo(function_name) as (
  values
    ('criar_usuario'),
    ('login_usuario'),
    ('get_empresa_usuario'),
    ('is_admin'),
    ('is_master'),
    ('handle_new_user'),
    ('vincular_usuario_logado'),
    ('df_empresas_do_usuario'),
    ('df_usuario_eh_admin'),
    ('df_usuario_tem_perfil_empresa'),
    ('df_usuario_alvo_eh_master'),
    ('df_funcionarios_pode_escrever'),
    ('df_funcionarios_validar_filial_empresa'),
    ('df_funcionarios_exames_periodicos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_ciclos_validar_funcionario_empresa'),
    ('df_funcionarios_ferias_periodos_validar_vinculos'),
    ('df_folha_lancamentos_validar_vinculos'),
    ('df_auditoria_admin_sanitize_destinatario_alerta')
)
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.oid::regprocedure::text as signature,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as full_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join funcoes_alvo fa on fa.function_name = p.proname
where n.nspname = 'public'
order by p.proname, pg_get_function_identity_arguments(p.oid);
