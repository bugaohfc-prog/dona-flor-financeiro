begin;

do $$
begin
  if to_regclass('public.df_funcionarios_desligamentos_checklist_catalogo') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_usuario_eh_admin(uuid)') is null
     or to_regprocedure('public.is_master()') is null then
    raise exception 'DEPENDENCIAS_CATALOGO_CHECKLIST_2C6C_AUSENTES';
  end if;
end $$;

create or replace function public.criar_item_catalogo_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_titulo text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text := nullif(regexp_replace(btrim(p_titulo), '\s+', ' ', 'g'), '');
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

  insert into public.df_funcionarios_desligamentos_checklist_catalogo (
    empresa_id, codigo, titulo, ativo
  ) values (
    p_empresa_id, v_codigo, v_titulo, true
  ) returning * into v_item;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'checklist_catalogo_item', v_item.id,
    'rh.checklist_catalogo.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object('titulo', v_item.titulo, 'ativo', v_item.ativo),
    jsonb_build_object('regra', 'catalogo_checklist_2c6c', 'codigo', v_item.codigo),
    v_correlation_id
  );

  return to_jsonb(v_item);
end;
$$;

create or replace function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_catalogo_item_id uuid,
  p_titulo text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text := nullif(regexp_replace(btrim(p_titulo), '\s+', ' ', 'g'), '');
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

  select * into v_antes
  from public.df_funcionarios_desligamentos_checklist_catalogo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  for update;
  if not found then raise exception 'ITEM_CATALOGO_NAO_ENCONTRADO'; end if;
  if v_antes.titulo = v_titulo then
    return to_jsonb(v_antes) || jsonb_build_object('idempotente', true);
  end if;

  update public.df_funcionarios_desligamentos_checklist_catalogo
  set titulo = v_titulo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'checklist_catalogo_item', v_depois.id,
    'rh.checklist_catalogo.atualizado', 'info', 'app', 'sucesso',
    jsonb_build_object('titulo', v_antes.titulo),
    jsonb_build_object('titulo', v_depois.titulo),
    jsonb_build_object('regra', 'catalogo_checklist_2c6c', 'codigo', v_depois.codigo),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('idempotente', false);
end;
$$;

create or replace function public.alterar_atividade_item_catalogo_checklist_desligamento_controlado(
  p_empresa_id uuid,
  p_catalogo_item_id uuid,
  p_ativo boolean,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
  v_antes public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
  v_depois public.df_funcionarios_desligamentos_checklist_catalogo%rowtype;
begin
  if auth.uid() is null
     or not (public.is_master() or public.df_usuario_eh_admin(p_empresa_id)) then
    raise exception 'SEM_PERMISSAO_ADMIN_CATALOGO_CHECKLIST';
  end if;
  if p_catalogo_item_id is null then raise exception 'ITEM_CATALOGO_NAO_IDENTIFICADO'; end if;
  if p_ativo is null then raise exception 'ATIVIDADE_CATALOGO_CHECKLIST_INVALIDA'; end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos_checklist_catalogo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  for update;
  if not found then raise exception 'ITEM_CATALOGO_NAO_ENCONTRADO'; end if;
  if v_antes.ativo = p_ativo then
    return to_jsonb(v_antes) || jsonb_build_object('idempotente', true);
  end if;

  update public.df_funcionarios_desligamentos_checklist_catalogo
  set ativo = p_ativo
  where empresa_id = p_empresa_id and id = p_catalogo_item_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'checklist_catalogo_item', v_depois.id,
    'rh.checklist_catalogo.atividade_alterada', 'info', 'app', 'sucesso',
    jsonb_build_object('ativo', v_antes.ativo),
    jsonb_build_object('ativo', v_depois.ativo),
    jsonb_build_object('regra', 'catalogo_checklist_2c6c', 'codigo', v_depois.codigo),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('idempotente', false);
end;
$$;

revoke all on function public.criar_item_catalogo_checklist_desligamento_controlado(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_item_catalogo_checklist_desligamento_controlado(uuid, text, text)
  to authenticated;

revoke all on function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.editar_titulo_item_catalogo_checklist_desligamento_controlado(uuid, uuid, text, text)
  to authenticated;

revoke all on function public.alterar_atividade_item_catalogo_checklist_desligamento_controlado(uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.alterar_atividade_item_catalogo_checklist_desligamento_controlado(uuid, uuid, boolean, text)
  to authenticated;

commit;
