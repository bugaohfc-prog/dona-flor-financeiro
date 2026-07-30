begin;

alter table public.df_contas_pagamentos
  add column if not exists idempotency_key uuid null;

comment on column public.df_contas_pagamentos.idempotency_key is
  'Chave fornecida pelo cliente para tornar o registro de pagamento parcial idempotente por empresa.';

create unique index if not exists uq_df_contas_pagamentos_empresa_idempotency
  on public.df_contas_pagamentos (empresa_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.registrar_pagamento_parcial_controlado(
  p_empresa_id uuid,
  p_conta_id uuid,
  p_valor numeric,
  p_data_pagamento date,
  p_observacao text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conta public.df_contas%rowtype;
  v_pagamento public.df_contas_pagamentos%rowtype;
  v_total_pago numeric(14,2);
  v_valor numeric(14,2);
  v_saldo numeric(14,2);
  v_quantidade_anterior integer;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;

  if p_empresa_id is null or p_conta_id is null or p_idempotency_key is null then
    raise exception 'Empresa, conta e chave de idempotencia sao obrigatorias.' using errcode = '22023';
  end if;

  if not (
    public.is_master()
    or public.df_usuario_eh_admin(p_empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      p_empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']::text[]
    )
  ) then
    raise exception 'Usuario sem permissao para registrar pagamento parcial.' using errcode = '42501';
  end if;

  v_valor := round(coalesce(p_valor, 0), 2);
  if v_valor <= 0 or p_data_pagamento is null then
    raise exception 'Valor positivo e data de pagamento sao obrigatorios.' using errcode = '22023';
  end if;

  select *
  into v_conta
  from public.df_contas c
  where c.id = p_conta_id
    and c.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'Conta nao encontrada.' using errcode = 'P0002';
  end if;

  if v_conta.status = 'pago'
    or coalesce(v_conta.oculto, false)
    or coalesce(v_conta.excluido, false)
    or coalesce(v_conta.deletado, false) then
    raise exception 'Conta indisponivel para pagamento parcial.' using errcode = '55000';
  end if;

  select *
  into v_pagamento
  from public.df_contas_pagamentos p
  where p.empresa_id = p_empresa_id
    and p.idempotency_key = p_idempotency_key;

  if found then
    if v_pagamento.conta_id is distinct from p_conta_id
      or v_pagamento.valor_pago is distinct from v_valor
      or v_pagamento.data_pagamento is distinct from p_data_pagamento then
      raise exception 'Chave de idempotencia ja utilizada com outro pagamento.' using errcode = '23505';
    end if;

    return jsonb_build_object(
      'pagamento', to_jsonb(v_pagamento),
      'idempotente', true,
      'auditoria_registrada', true
    );
  end if;

  select
    coalesce(round(sum(p.valor_pago), 2), 0),
    count(*)::integer
  into v_total_pago, v_quantidade_anterior
  from public.df_contas_pagamentos p
  where p.empresa_id = p_empresa_id
    and p.conta_id = p_conta_id
    and coalesce(p.arquivado, false) = false;

  v_saldo := greatest(round(coalesce(v_conta.valor, 0) - v_total_pago, 2), 0);
  if v_valor > v_saldo then
    raise exception 'O valor informado supera o saldo pendente.'
      using errcode = '23514',
            detail = jsonb_build_object('saldo_pendente', v_saldo)::text;
  end if;

  insert into public.df_contas_pagamentos (
    empresa_id, conta_id, valor_pago, data_pagamento, observacao, idempotency_key
  )
  values (
    p_empresa_id, p_conta_id, v_valor, p_data_pagamento,
    nullif(btrim(p_observacao), ''), p_idempotency_key
  )
  returning * into v_pagamento;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  )
  values (
    p_empresa_id, auth.uid(), 'usuario', 'financeiro', 'df_contas_pagamentos',
    v_pagamento.id, 'financeiro.pagamento_parcial.criado', 'info', 'app', 'sucesso',
    jsonb_build_object(
      'valor_pago', v_total_pago,
      'saldo', v_saldo,
      'quantidade_parciais', v_quantidade_anterior
    ),
    jsonb_build_object(
      'valor_pago', round(v_total_pago + v_valor, 2),
      'saldo', greatest(round(v_saldo - v_valor, 2), 0),
      'quantidade_parciais', v_quantidade_anterior + 1
    ),
    jsonb_build_object(
      'conta_id', p_conta_id,
      'pagamento_id', v_pagamento.id,
      'data_pagamento', p_data_pagamento
    ),
    'financeiro.pagamento_parcial.criado:' || v_pagamento.id::text
  );

  return jsonb_build_object(
    'pagamento', to_jsonb(v_pagamento),
    'idempotente', false,
    'auditoria_registrada', true
  );
end;
$$;

revoke all on function public.registrar_pagamento_parcial_controlado(uuid, uuid, numeric, date, text, uuid)
  from public, anon;
grant execute on function public.registrar_pagamento_parcial_controlado(uuid, uuid, numeric, date, text, uuid)
  to authenticated;

revoke insert on table public.df_contas_pagamentos from authenticated;
drop policy if exists "df_contas_pagamentos_insert_empresa_operacional"
  on public.df_contas_pagamentos;

do $$
begin
  if has_table_privilege('authenticated', 'public.df_contas_pagamentos', 'INSERT') then
    raise exception 'authenticated ainda possui INSERT direto em df_contas_pagamentos';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_contas_pagamentos'
      and cmd in ('INSERT', 'ALL')
  ) then
    raise exception 'Policy paralela ainda permite INSERT direto em df_contas_pagamentos';
  end if;
end;
$$;

commit;
