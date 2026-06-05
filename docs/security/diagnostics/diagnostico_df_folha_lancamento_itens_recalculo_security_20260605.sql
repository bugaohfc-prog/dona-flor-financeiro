-- =========================================================
-- Diagnostico - hotfix de recalculo de itens da folha
-- Data: 2026-06-05
--
-- Objetivo:
-- - Confirmar que o trigger de itens detalhados consegue recalcular
--   df_folha_lancamentos.valor para usuario authenticated autorizado.
-- - Confirmar que as funcoes internas continuam sem EXECUTE direto
--   para PUBLIC/anon/authenticated.
-- - Confirmar que RLS, grants, bloqueio de DELETE e bloqueio de troca
--   de empresa_id continuam ativos.
-- =========================================================

-- 1. Funcoes de recalculo
select
  p.oid::regprocedure::text as assinatura,
  pg_get_userbyid(p.proowner) as owner,
  case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end as modo,
  array_to_string(p.proconfig, ', ') as config,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_proc p
where p.oid in (
  'public.df_folha_lancamento_itens_recalcular_lancamento(uuid)'::regprocedure,
  'public.df_folha_lancamento_itens_recalcular_lancamento_trigger()'::regprocedure
)
order by assinatura;

-- 2. Grants diretos em tabela
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_folha_lancamento_itens'
order by grantee, privilege_type;

-- 3. RLS e FORCE RLS
select
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.df_folha_lancamento_itens'::regclass;

-- 4. Policies
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_folha_lancamento_itens'
order by policyname;

-- 5. Triggers
select
  t.tgname,
  p.oid::regprocedure::text as funcao,
  pg_get_triggerdef(t.oid) as definicao
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.df_folha_lancamento_itens'::regclass
  and not t.tgisinternal
order by t.tgname;

-- 6. Validacao funcional transacional como authenticated autorizado.
begin;

create temp table _df_folha_itens_auth_context on commit drop as
with base as (
  select
    ue.empresa_id,
    ue.user_id,
    ue.email,
    f.id as funcionario_id
  from public.df_usuarios_empresas ue
  join public.df_funcionarios f
    on f.empresa_id = ue.empresa_id
  where lower(ue.perfil) in ('admin', 'master', 'owner', 'superadmin', 'super_admin')
    and ue.user_id is not null
    and ue.email is not null
    and coalesce(f.arquivado, false) = false
  order by ue.empresa_id, f.id
  limit 1
), competencia_disponivel as (
  select c.competencia
  from base b
  cross join lateral (
    select format('2098-%s', lpad(m::text, 2, '0')) as competencia
    from generate_series(1, 12) m
  ) c
  where not exists (
    select 1
    from public.df_folha_competencias fc
    where fc.empresa_id = b.empresa_id
      and fc.competencia = c.competencia
  )
  order by c.competencia
  limit 1
), cross_empresa as (
  select e.id as cross_empresa_id
  from public.df_empresas e, base b
  where e.id <> b.empresa_id
  limit 1
)
select
  b.empresa_id,
  b.user_id,
  b.email,
  b.funcionario_id,
  cd.competencia,
  ce.cross_empresa_id
from base b
cross join competencia_disponivel cd
left join cross_empresa ce on true;

grant select on _df_folha_itens_auth_context to authenticated;

do $$
begin
  if not exists (select 1 from _df_folha_itens_auth_context) then
    raise exception 'Sem usuario admin/master com funcionario ativo e competencia livre para teste authenticated.';
  end if;
end $$;

select set_config('request.jwt.claim.sub', user_id::text, true)
from _df_folha_itens_auth_context;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', user_id::text, 'email', email)::text,
  true
)
from _df_folha_itens_auth_context;

set local role authenticated;

do $$
declare
  v_empresa_id uuid;
  v_funcionario_id uuid;
  v_competencia text;
  v_competencia_id uuid;
  v_lancamento_id uuid;
  v_item_id uuid;
  v_total numeric(12,2);
  v_cross_empresa_id uuid;
  v_failed boolean;
begin
  select empresa_id, funcionario_id, competencia, cross_empresa_id
    into v_empresa_id, v_funcionario_id, v_competencia, v_cross_empresa_id
  from _df_folha_itens_auth_context
  limit 1;

  insert into public.df_folha_competencias (
    empresa_id,
    competencia,
    status,
    observacao_administrativa
  ) values (
    v_empresa_id,
    v_competencia,
    'aberta',
    'Diagnostico transacional de itens detalhados'
  )
  returning id into v_competencia_id;

  insert into public.df_folha_lancamentos (
    empresa_id,
    competencia_id,
    funcionario_id,
    categoria,
    natureza,
    descricao,
    valor,
    observacao_administrativa
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_funcionario_id,
    'compras_vales',
    'desconto',
    'Diagnostico compras',
    0,
    'Diagnostico transacional'
  )
  returning id into v_lancamento_id;

  insert into public.df_folha_lancamento_itens (
    empresa_id,
    competencia_id,
    lancamento_id,
    funcionario_id,
    categoria,
    descricao,
    valor,
    observacao_administrativa
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_lancamento_id,
    v_funcionario_id,
    'compras_vales',
    'Item diagnostico',
    10,
    'Teste administrativo'
  )
  returning id into v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_id;

  if v_total <> 10 then
    raise exception 'Recalculo apos INSERT falhou: esperado 10, obtido %', v_total;
  end if;

  update public.df_folha_lancamento_itens
  set valor = 15
  where id = v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_id;

  if v_total <> 15 then
    raise exception 'Recalculo apos UPDATE falhou: esperado 15, obtido %', v_total;
  end if;

  update public.df_folha_lancamento_itens
  set arquivado = true
  where id = v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_id;

  if v_total <> 0 then
    raise exception 'Recalculo apos arquivar falhou: esperado 0, obtido %', v_total;
  end if;

  begin
    delete from public.df_folha_lancamento_itens
    where id = v_item_id;

    raise exception 'DELETE fisico deveria ser bloqueado';
  exception
    when insufficient_privilege then
      null;
  end;

  v_failed := false;
  begin
    update public.df_folha_lancamento_itens
    set empresa_id = gen_random_uuid()
    where id = v_item_id;
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Troca de empresa_id deveria ser bloqueada';
  end if;

  if v_cross_empresa_id is not null then
    v_failed := false;

    begin
      insert into public.df_folha_lancamento_itens (
        empresa_id,
        competencia_id,
        lancamento_id,
        funcionario_id,
        categoria,
        valor
      ) values (
        v_cross_empresa_id,
        v_competencia_id,
        v_lancamento_id,
        v_funcionario_id,
        'compras_vales',
        10
      );
    exception
      when insufficient_privilege or check_violation then
        v_failed := true;
    end;

    if v_failed = false then
      raise exception 'Validacao cross-tenant deveria bloquear empresa divergente';
    end if;
  end if;

  raise notice 'Diagnostico authenticated de recalculo de itens da folha concluido com sucesso.';
end $$;

rollback;
