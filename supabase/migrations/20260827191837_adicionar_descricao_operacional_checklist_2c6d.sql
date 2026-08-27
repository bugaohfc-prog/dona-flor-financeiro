begin;

do $$
begin
  if to_regclass('public.df_funcionarios_desligamentos_checklist_catalogo') is null
     or to_regclass('public.df_funcionarios_desligamentos_checklist') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_usuario_eh_admin(uuid)') is null
     or to_regprocedure('public.is_master()') is null then
    raise exception 'DEPENDENCIAS_DESCRICAO_CHECKLIST_2C6D_AUSENTES';
  end if;
end $$;

alter table public.df_funcionarios_desligamentos_checklist_catalogo
  add column descricao_operacional text null;

alter table public.df_funcionarios_desligamentos_checklist_catalogo
  add constraint df_checklist_catalogo_descricao_operacional_check
  check (descricao_operacional is null or length(descricao_operacional) <= 500);

comment on column public.df_funcionarios_desligamentos_checklist_catalogo.descricao_operacional is
  'Texto administrativo opcional. Nao define obrigacao, prazo legal, automacao ou regra de conclusao.';

alter table public.df_funcionarios_desligamentos_checklist
  add column descricao_snapshot text null;

alter table public.df_funcionarios_desligamentos_checklist
  add constraint df_checklist_descricao_snapshot_check
  check (descricao_snapshot is null or length(descricao_snapshot) <= 500);

comment on column public.df_funcionarios_desligamentos_checklist.descricao_snapshot is
  'Copia historica opcional da descricao do catalogo no momento da criacao do item.';

drop function public.criar_item_catalogo_checklist_desligamento_controlado(uuid, text, text);

create function public.criar_item_catalogo_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_titulo text,
  p_descricao_operacional text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text := nullif(regexp_replace(btrim(p_titulo), '\s+', ' ', 'g'), '');
  v_descricao text := nullif(btrim(p_descricao_operacional), '');
  v_codigo text := 'CATALOGO_' || replace(gen_random_uuid()::text, '-', '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
  v_item public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
begin
  if auth.uid() is null
     or not (public.is_master() or public.df_usuario_eh_admin(p_empresa_id)) then
    raise exception 'SEM_PERMISSAO_ADMIN_CATALOGO_CHECKLIST';
  end if;
  if v_titulo is null or length(v_titulo) not between 3 and 160 then
    raise exception 'TITULO_CATALOGO_CHECKLIST_INVALIDO';
  end if;
  if v_descricao is not null and length(v_descricao) > 500 then
    raise exception 'DESCRICAO_OPERACIONAL_CHECKLIST_MUITO_LONGA';
  end if;

  insert into public.df_funcionarios_desligamentos_checklist_catalogo (
    empresa_id, codigo, titulo, descricao_operacional, ativo
  ) values (
    p_empresa_id, v_codigo, v_titulo, v_descricao, true
  ) returning * into v_item;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'checklist_catalogo_item', v_item.id,
    'rh.checklist_catalogo.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object(
      'titulo', v_item.titulo,
      'descricao_operacional', v_item.descricao_operacional,
      'ativo', v_item.ativo
    ),
    jsonb_build_object('regra', 'descricao_checklist_2c6d', 'codigo', v_item.codigo),
    v_correlation_id
  );

  return to_jsonb(v_item);
end;
$$;

drop function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(uuid, uuid, text, text);

create function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_catalogo_item_id uuid,
  p_titulo text,
  p_descricao_operacional text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text := nullif(regexp_replace(btrim(p_titulo), '\s+', ' ', 'g'), '');
  v_descricao text := nullif(btrim(p_descricao_operacional), '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
  v_antes public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
  v_depois public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
begin
  if auth.uid() is null
     or not (public.is_master() or public.df_usuario_eh_admin(p_empresa_id)) then
    raise exception 'SEM_PERMISSAO_ADMIN_CATALOGO_CHECKLIST';
  end if;
  if p_catalogo_item_id is null then raise exception 'ITEM_CATALOGO_NAO_IDENTIFICADO'; end if;
  if v_titulo is null or length(v_titulo) not between 3 and 160 then
    raise exception 'TITULO_CATALOGO_CHECKLIST_INVALIDO';
  end if;
  if v_descricao is not null and length(v_descricao) > 500 then
    raise exception 'DESCRICAO_OPERACIONAL_CHECKLIST_MUITO_LONGA';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos_checklist_catalogo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  for update;
  if not found then raise exception 'ITEM_CATALOGO_NAO_ENCONTRADO'; end if;
  if v_antes.titulo = v_titulo
     and v_antes.descricao_operacional is not distinct from v_descricao then
    return to_jsonb(v_antes) || jsonb_build_object('idempotente', true);
  end if;

  update public.df_funcionarios_desligamentos_checklist_catalogo
  set titulo = v_titulo,
      descricao_operacional = v_descricao
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'checklist_catalogo_item', v_depois.id,
    'rh.checklist_catalogo.atualizado', 'info', 'app', 'sucesso',
    jsonb_build_object(
      'titulo', v_antes.titulo,
      'descricao_operacional', v_antes.descricao_operacional
    ),
    jsonb_build_object(
      'titulo', v_depois.titulo,
      'descricao_operacional', v_depois.descricao_operacional
    ),
    jsonb_build_object('regra', 'descricao_checklist_2c6d', 'codigo', v_depois.codigo),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('idempotente', false);
end;
$$;

create or replace function public.criar_item_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_catalogo_item_id uuid,
  p_data_prevista date default null,
  p_observacao_administrativa text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referencia public.df_funcionarios_desligamentos%rowtype;
  v_desligamento public.df_funcionarios_desligamentos%rowtype;
  v_catalogo public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
  v_item public.df_funcionarios_desligamentos_checklist%rowtype;
  v_observacao text := nullif(btrim(p_observacao_administrativa), '');
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_catalogo_item_id is null then
    raise exception 'ITEM_CATALOGO_OBRIGATORIO';
  end if;
  if v_observacao is not null and length(v_observacao) > 500 then
    raise exception 'OBSERVACAO_CHECKLIST_MUITO_LONGA';
  end if;

  select * into v_referencia
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;

  perform public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_referencia.funcionario_id);
  v_desligamento := public.df_checklist_validar_desligamento_efetivo_2c6b(
    p_empresa_id, p_desligamento_id, v_referencia.funcionario_id
  );

  select * into v_catalogo
  from public.df_funcionarios_desligamentos_checklist_catalogo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  for key share;
  if not found then raise exception 'ITEM_CATALOGO_NAO_ENCONTRADO'; end if;
  if not v_catalogo.ativo then raise exception 'ITEM_CATALOGO_INATIVO'; end if;

  begin
    insert into public.df_funcionarios_desligamentos_checklist (
      empresa_id, desligamento_id, funcionario_id, catalogo_item_id,
      item_codigo, titulo_snapshot, descricao_snapshot, estado, data_prevista,
      observacao_administrativa, correlation_id
    ) values (
      p_empresa_id, v_desligamento.id, v_desligamento.funcionario_id, v_catalogo.id,
      v_catalogo.codigo, v_catalogo.titulo, v_catalogo.descricao_operacional, 'PENDENTE', p_data_prevista,
      v_observacao, v_correlation_id
    ) returning * into v_item;
  exception when unique_violation then
    raise exception 'ITEM_CHECKLIST_JA_EXISTE';
  end;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'desligamento_checklist_item', v_item.id,
    'rh.desligamento.checklist_item.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object(
      'item_id', v_item.id,
      'desligamento_id', v_item.desligamento_id,
      'funcionario_id', v_item.funcionario_id,
      'item_codigo', v_item.item_codigo,
      'titulo_snapshot', v_item.titulo_snapshot,
      'descricao_snapshot', v_item.descricao_snapshot,
      'estado', v_item.estado,
      'data_prevista', v_item.data_prevista,
      'observacao_administrativa', v_item.observacao_administrativa
    ),
    jsonb_build_object(
      'regra', 'checklist_desligamento_2c6d',
      'workflow_id', v_item.desligamento_id,
      'funcionario_id', v_item.funcionario_id,
      'catalogo_item_id', v_item.catalogo_item_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_item);
end;
$$;

revoke all on function public.criar_item_catalogo_checklist_desligamento_controlado(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_item_catalogo_checklist_desligamento_controlado(uuid, text, text, text)
  to authenticated;

revoke all on function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(uuid, uuid, text, text, text)
  to authenticated;

commit;
