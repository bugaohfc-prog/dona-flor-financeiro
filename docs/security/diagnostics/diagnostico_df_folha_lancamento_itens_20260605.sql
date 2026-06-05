-- =========================================================
-- Diagnostico - df_folha_lancamento_itens
-- DNA Gestao - Gestao de Pessoas / Fechamento de Folha
--
-- Objetivo:
-- - Validar estrutura, RLS, grants, policies, triggers e constraints.
-- - Validar recalculo do total do lancamento principal em transacao
--   temporaria com rollback.
-- =========================================================

-- 1. Estrutura principal
select
  to_regclass('public.df_folha_lancamento_itens') as tabela_itens;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_folha_lancamento_itens'
order by ordinal_position;

select
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.df_folha_lancamento_itens'::regclass
order by conname;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'df_folha_lancamento_itens'
order by indexname;

-- 2. RLS, policies e grants
select
  relrowsecurity as rls_enabled,
  relforcerowsecurity as force_rls_enabled
from pg_class
where oid = 'public.df_folha_lancamento_itens'::regclass;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_folha_lancamento_itens'
order by policyname;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_folha_lancamento_itens'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select
  count(*) as unsafe_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'df_folha_lancamento_itens'
  and cmd in ('ALL', 'DELETE');

select
  count(*) as authenticated_delete_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_folha_lancamento_itens'
  and grantee = 'authenticated'
  and privilege_type = 'DELETE';

select
  count(*) as anon_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_folha_lancamento_itens'
  and grantee = 'anon';

-- 3. Triggers e funcoes
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_folha_lancamento_itens'
order by trigger_name, event_manipulation;

select
  p.proname,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname like 'df_folha_lancamento_itens_%'
order by p.proname;

-- 4. Validacao funcional transacional
-- Este bloco cria dados temporarios de teste e faz rollback ao final.
begin;

do $$
declare
  v_empresa_id uuid;
  v_funcionario_id uuid;
  v_competencia_id uuid;
  v_competencia text;
  v_lancamento_compras uuid;
  v_lancamento_falta uuid;
  v_lancamento_hora uuid;
  v_lancamento_premiacao uuid;
  v_item_id uuid;
  v_total numeric(12,2);
  v_mes integer;
  v_failed boolean;
begin
  select f.empresa_id, f.id
    into v_empresa_id, v_funcionario_id
  from public.df_funcionarios f
  where coalesce(f.arquivado, false) = false
  order by f.id
  limit 1;

  if v_empresa_id is null or v_funcionario_id is null then
    raise notice 'Sem funcionario ativo para teste transacional; diagnostico estrutural ainda e valido.';
    return;
  end if;

  for v_mes in 1..12 loop
    v_competencia := '2099-' || lpad(v_mes::text, 2, '0');

    if not exists (
      select 1
      from public.df_folha_competencias c
      where c.empresa_id = v_empresa_id
        and c.competencia = v_competencia
        and coalesce(c.arquivado, false) = false
    ) then
      exit;
    end if;

    v_competencia := null;
  end loop;

  if v_competencia is null then
    raise notice 'Sem competencia futura livre para teste transacional; diagnostico estrutural ainda e valido.';
    return;
  end if;

  insert into public.df_folha_competencias (
    empresa_id,
    competencia,
    status,
    observacao_administrativa
  ) values (
    v_empresa_id,
    v_competencia,
    'aberta',
    'diagnostico temporario rollback'
  )
  returning id into v_competencia_id;

  insert into public.df_folha_lancamentos (
    empresa_id,
    competencia_id,
    funcionario_id,
    categoria,
    natureza,
    descricao,
    quantidade,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_funcionario_id,
    'compras_vales',
    'desconto',
    'Diagnostico compras',
    1,
    1
  )
  returning id into v_lancamento_compras;

  insert into public.df_folha_lancamentos (
    empresa_id,
    competencia_id,
    funcionario_id,
    categoria,
    natureza,
    descricao,
    quantidade,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_funcionario_id,
    'falta_injustificada',
    'desconto',
    'Diagnostico falta',
    1,
    0
  )
  returning id into v_lancamento_falta;

  insert into public.df_folha_lancamentos (
    empresa_id,
    competencia_id,
    funcionario_id,
    categoria,
    natureza,
    descricao,
    quantidade,
    percentual,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_funcionario_id,
    'hora_extra_50',
    'credito',
    'Diagnostico hora extra',
    1,
    50,
    0
  )
  returning id into v_lancamento_hora;

  insert into public.df_folha_lancamentos (
    empresa_id,
    competencia_id,
    funcionario_id,
    categoria,
    natureza,
    descricao,
    percentual,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_funcionario_id,
    'premiacao',
    'credito',
    'Diagnostico premiacao',
    10,
    0
  )
  returning id into v_lancamento_premiacao;

  insert into public.df_folha_lancamento_itens (
    empresa_id,
    competencia_id,
    lancamento_id,
    funcionario_id,
    categoria,
    descricao,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_lancamento_compras,
    v_funcionario_id,
    'compras_vales',
    'Compra teste rollback',
    10
  )
  returning id into v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_compras;

  if v_total <> 10 then
    raise exception 'Falha no recalculo apos insert: esperado 10, obtido %', v_total;
  end if;

  update public.df_folha_lancamento_itens
  set valor = 15
  where id = v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_compras;

  if v_total <> 15 then
    raise exception 'Falha no recalculo apos update: esperado 15, obtido %', v_total;
  end if;

  update public.df_folha_lancamento_itens
  set arquivado = true
  where id = v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_compras;

  if v_total <> 0 then
    raise exception 'Falha no recalculo apos arquivar: esperado 0, obtido %', v_total;
  end if;

  update public.df_folha_lancamento_itens
  set arquivado = false
  where id = v_item_id;

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_compras;

  if v_total <> 15 then
    raise exception 'Falha no recalculo apos reativar: esperado 15, obtido %', v_total;
  end if;

  insert into public.df_folha_lancamento_itens (
    empresa_id,
    competencia_id,
    lancamento_id,
    funcionario_id,
    categoria,
    data_referencia,
    quantidade,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_lancamento_falta,
    v_funcionario_id,
    'falta_injustificada',
    current_date,
    1,
    0
  );

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_falta;

  if v_total <> 0 then
    raise exception 'Falha no total informativo de falta: esperado 0, obtido %', v_total;
  end if;

  insert into public.df_folha_lancamento_itens (
    empresa_id,
    competencia_id,
    lancamento_id,
    funcionario_id,
    categoria,
    quantidade,
    percentual,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_lancamento_hora,
    v_funcionario_id,
    'hora_extra_50',
    2,
    50,
    0
  );

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_hora;

  if v_total <> 0 then
    raise exception 'Falha no total informativo de hora extra: esperado 0, obtido %', v_total;
  end if;

  insert into public.df_folha_lancamento_itens (
    empresa_id,
    competencia_id,
    lancamento_id,
    funcionario_id,
    categoria,
    percentual,
    valor_base,
    valor
  ) values (
    v_empresa_id,
    v_competencia_id,
    v_lancamento_premiacao,
    v_funcionario_id,
    'premiacao',
    10,
    1000,
    100
  );

  select valor into v_total
  from public.df_folha_lancamentos
  where id = v_lancamento_premiacao;

  if v_total <> 100 then
    raise exception 'Falha no total de premiacao: esperado 100, obtido %', v_total;
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
    insert into public.df_folha_lancamento_itens (
      empresa_id,
      competencia_id,
      lancamento_id,
      funcionario_id,
      categoria,
      valor
    ) values (
      v_empresa_id,
      v_competencia_id,
      v_lancamento_compras,
      v_funcionario_id,
      'compras_vales',
      0
    );
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Constraint de compras_vales com valor 0 nao bloqueou';
  end if;

  v_failed := false;
  begin
    insert into public.df_folha_lancamento_itens (
      empresa_id,
      competencia_id,
      lancamento_id,
      funcionario_id,
      categoria,
      percentual,
      valor_base,
      valor
    ) values (
      v_empresa_id,
      v_competencia_id,
      v_lancamento_compras,
      v_funcionario_id,
      'premiacao',
      10,
      1000,
      100
    );
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Validacao de categoria entre item e lancamento pai nao bloqueou';
  end if;

  v_failed := false;
  begin
    insert into public.df_folha_lancamento_itens (
      empresa_id,
      competencia_id,
      lancamento_id,
      funcionario_id,
      categoria,
      quantidade,
      valor
    ) values (
      v_empresa_id,
      v_competencia_id,
      v_lancamento_falta,
      v_funcionario_id,
      'falta_injustificada',
      1,
      0
    );
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Constraint de falta sem data_referencia nao bloqueou';
  end if;

  v_failed := false;
  begin
    insert into public.df_folha_lancamento_itens (
      empresa_id,
      competencia_id,
      lancamento_id,
      funcionario_id,
      categoria,
      quantidade,
      percentual,
      valor
    ) values (
      v_empresa_id,
      v_competencia_id,
      v_lancamento_hora,
      v_funcionario_id,
      'hora_extra_50',
      2,
      60,
      0
    );
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Constraint de hora_extra_50 com percentual invalido nao bloqueou';
  end if;

  v_failed := false;
  begin
    insert into public.df_folha_lancamento_itens (
      empresa_id,
      competencia_id,
      lancamento_id,
      funcionario_id,
      categoria,
      percentual,
      valor_base,
      valor
    ) values (
      v_empresa_id,
      v_competencia_id,
      v_lancamento_premiacao,
      v_funcionario_id,
      'premiacao',
      10,
      1000,
      99
    );
  exception
    when check_violation then
      v_failed := true;
  end;

  if v_failed = false then
    raise exception 'Constraint de premiacao com valor incoerente nao bloqueou';
  end if;

  raise notice 'Validacao funcional de df_folha_lancamento_itens concluida com sucesso em transacao temporaria.';
end $$;

rollback;
