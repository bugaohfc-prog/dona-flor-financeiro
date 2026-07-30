begin;

create or replace function public.definir_arquivamento_pagamento_parcial(
  p_empresa_id uuid,
  p_conta_id uuid,
  p_pagamento_id uuid,
  p_arquivado boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_conta public.df_contas%rowtype;
  v_pagamento public.df_contas_pagamentos%rowtype;
  v_arquivado_em timestamptz;
  v_acao text;
begin
  if auth.uid() is null
    or p_empresa_id is null
    or p_conta_id is null
    or p_pagamento_id is null
    or p_arquivado is null then
    raise exception 'Parametros invalidos para arquivamento do pagamento parcial.'
      using errcode = '22023';
  end if;

  if not (
    public.is_master()
    or public.df_usuario_eh_admin(p_empresa_id)
    or public.df_usuario_tem_perfil_empresa(p_empresa_id, array['gerente'])
  ) then
    raise exception 'Sem permissao para alterar o arquivamento do pagamento parcial.'
      using errcode = '42501';
  end if;

  select c.*
  into v_conta
  from public.df_contas c
  where c.id = p_conta_id
    and c.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'Conta nao encontrada para o arquivamento do pagamento parcial.'
      using errcode = 'P0002';
  end if;

  if v_conta.oculto is true
    or v_conta.excluido is true
    or v_conta.deletado is true then
    raise exception 'Conta indisponivel para o arquivamento do pagamento parcial.'
      using errcode = '55000';
  end if;

  if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_conta.filial_id) then
    raise exception 'Sem acesso a filial da conta.'
      using errcode = '42501';
  end if;

  select p.*
  into v_pagamento
  from public.df_contas_pagamentos p
  where p.id = p_pagamento_id
    and p.empresa_id = p_empresa_id
    and p.conta_id = p_conta_id
  for update;

  if not found then
    raise exception 'Pagamento parcial nao encontrado.'
      using errcode = 'P0002';
  end if;

  if v_pagamento.arquivado is not distinct from p_arquivado then
    return jsonb_build_object(
      'ok', true,
      'idempotente', true,
      'auditoria_registrada', false,
      'pagamento', to_jsonb(v_pagamento)
    );
  end if;

  v_arquivado_em := case when p_arquivado then now() else null end;
  v_acao := case
    when p_arquivado then 'financeiro.pagamento_parcial.estornado'
    else 'financeiro.pagamento_parcial.restaurado'
  end;

  update public.df_contas_pagamentos
  set arquivado = p_arquivado,
      arquivado_em = v_arquivado_em
  where id = p_pagamento_id
    and empresa_id = p_empresa_id
    and conta_id = p_conta_id
  returning * into v_pagamento;

  insert into public.df_auditoria_eventos (
    empresa_id,
    user_id,
    ator_tipo,
    modulo,
    entidade_tipo,
    entidade_id,
    acao,
    origem,
    severidade,
    status,
    dados_antes,
    dados_depois,
    metadados
  )
  values (
    p_empresa_id,
    auth.uid(),
    'usuario',
    'financeiro',
    'df_contas_pagamentos',
    p_pagamento_id,
    v_acao,
    'app',
    'warning',
    'sucesso',
    jsonb_build_object('arquivado', not p_arquivado, 'conta_id', p_conta_id),
    jsonb_build_object('arquivado', p_arquivado, 'conta_id', p_conta_id),
    jsonb_build_object('conta_id', p_conta_id)
  );

  return jsonb_build_object(
    'ok', true,
    'idempotente', false,
    'auditoria_registrada', true,
    'pagamento', to_jsonb(v_pagamento)
  );
end;
$$;

revoke all on function public.definir_arquivamento_pagamento_parcial(
  uuid, uuid, uuid, boolean
) from public, anon, authenticated;
grant execute on function public.definir_arquivamento_pagamento_parcial(
  uuid, uuid, uuid, boolean
) to authenticated;

revoke update on table public.df_contas_pagamentos from authenticated;
drop policy if exists "df_contas_pagamentos_update_empresa_operacional"
  on public.df_contas_pagamentos;

do $$
begin
  if has_table_privilege(
    'authenticated',
    'public.df_contas_pagamentos',
    'UPDATE'
  ) then
    raise exception 'authenticated ainda possui UPDATE direto em df_contas_pagamentos';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'df_contas_pagamentos'
      and cmd in ('UPDATE', 'ALL')
  ) then
    raise exception 'Policy paralela ainda permite UPDATE direto em df_contas_pagamentos';
  end if;
end;
$$;

commit;
