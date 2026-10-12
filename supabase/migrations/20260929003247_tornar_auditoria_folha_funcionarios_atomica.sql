begin;

create or replace function public.df_registrar_auditoria_mutacao_interno(
  p_empresa_id uuid,
  p_entidade_tipo text,
  p_entidade_id uuid,
  p_acao text,
  p_modulo text,
  p_correlation_id uuid,
  p_dados_antes jsonb,
  p_dados_depois jsonb,
  p_pedido jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.df_auditoria_eventos (
    empresa_id,
    user_id,
    ator_tipo,
    modulo,
    entidade_tipo,
    entidade_id,
    acao,
    severidade,
    origem,
    status,
    correlation_id,
    dados_antes,
    dados_depois,
    metadados
  ) values (
    p_empresa_id,
    auth.uid(),
    'usuario',
    p_modulo,
    p_entidade_tipo,
    p_entidade_id,
    p_acao,
    'critical',
    'app',
    'sucesso',
    p_correlation_id::text,
    p_dados_antes,
    p_dados_depois,
    jsonb_build_object(
      'pedido', p_pedido,
      'resultado', jsonb_build_object('id', p_entidade_id)
    )
  );
end;
$$;

alter function public.df_registrar_auditoria_mutacao_interno(uuid,text,uuid,text,text,uuid,jsonb,jsonb,jsonb)
  owner to postgres;
revoke all on function public.df_registrar_auditoria_mutacao_interno(uuid,text,uuid,text,text,uuid,jsonb,jsonb,jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.df_mutar_competencia_folha_controlado(
  p_empresa_id uuid,
  p_operacao text,
  p_entidade_id uuid,
  p_dados jsonb,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operacao text := lower(btrim(coalesce(p_operacao, '')));
  v_dados jsonb := coalesce(p_dados, '{}'::jsonb);
  v_acao text;
  v_pedido jsonb;
  v_anterior_metadados jsonb;
  v_anterior_entidade uuid;
  v_antes jsonb;
  v_depois jsonb;
  v_registro public.df_folha_competencias%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_correlation_id is null then
    raise exception 'PARAMETROS_MUTACAO_FOLHA_INVALIDOS';
  end if;
  if not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'ACESSO_NEGADO_MUTACAO_FOLHA';
  end if;
  if v_operacao not in ('criar', 'atualizar', 'arquivar', 'reativar')
    or jsonb_typeof(v_dados) <> 'object' then
    raise exception 'OPERACAO_MUTACAO_FOLHA_INVALIDA';
  end if;
  if v_operacao = 'criar' and p_entidade_id is not null then
    raise exception 'IDENTIFICACAO_COMPETENCIA_INESPERADA';
  elsif v_operacao <> 'criar' and p_entidade_id is null then
    raise exception 'COMPETENCIA_FOLHA_NAO_IDENTIFICADA';
  end if;
  if (v_operacao = 'criar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave
      where not (chave = any (array['competencia','status','observacao_administrativa']))
    )) or (v_operacao = 'atualizar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave
      where not (chave = any (array['status','observacao_administrativa','fechado_em','arquivado','arquivado_em']))
    )) or (v_operacao in ('arquivar','reativar') and v_dados <> '{}'::jsonb) then
    raise exception 'CAMPO_COMPETENCIA_NAO_PERMITIDO';
  end if;

  v_acao := case v_operacao
    when 'criar' then 'folha.competencia.criada'
    when 'atualizar' then 'folha.competencia.atualizada'
    when 'arquivar' then 'folha.competencia.arquivada'
    else 'folha.competencia.reativada'
  end;
  v_pedido := jsonb_build_object('operacao', v_operacao, 'entidade_id', p_entidade_id, 'dados', v_dados);

  perform pg_advisory_xact_lock(hashtextextended(
    'auditoria-mutacao:' || p_empresa_id || ':' || p_correlation_id,
    0
  ));
  select entidade_id, metadados
    into v_anterior_entidade, v_anterior_metadados
    from public.df_auditoria_eventos
    where empresa_id = p_empresa_id
      and correlation_id = p_correlation_id::text
      and acao = v_acao
    order by criado_em
    limit 1;
  if found then
    if v_anterior_metadados->'pedido' is distinct from v_pedido then
      raise exception 'CORRELATION_MUTACAO_REUTILIZADO';
    end if;
    select * into v_registro
      from public.df_folha_competencias
      where empresa_id = p_empresa_id and id = v_anterior_entidade;
    if not found then raise exception 'RESULTADO_MUTACAO_INDISPONIVEL'; end if;
    return to_jsonb(v_registro) || jsonb_build_object('idempotente', true);
  end if;

  if v_operacao = 'criar' then
    insert into public.df_folha_competencias (
      empresa_id, competencia, status, observacao_administrativa, arquivado, arquivado_em
    ) values (
      p_empresa_id,
      v_dados->>'competencia',
      coalesce(nullif(v_dados->>'status', ''), 'aberta'),
      nullif(btrim(v_dados->>'observacao_administrativa'), ''),
      false,
      null
    ) returning * into v_registro;
    v_antes := null;
  else
    select * into v_registro
      from public.df_folha_competencias
      where empresa_id = p_empresa_id and id = p_entidade_id
      for update;
    if not found then raise exception 'COMPETENCIA_FOLHA_NAO_ENCONTRADA'; end if;
    v_antes := to_jsonb(v_registro);

    if v_operacao = 'atualizar' then
      if v_dados = '{}'::jsonb then raise exception 'DADOS_COMPETENCIA_AUSENTES'; end if;
      update public.df_folha_competencias set
        status = case when v_dados ? 'status' then v_dados->>'status' else status end,
        observacao_administrativa = case when v_dados ? 'observacao_administrativa'
          then nullif(btrim(v_dados->>'observacao_administrativa'), '') else observacao_administrativa end,
        fechado_em = case when v_dados ? 'fechado_em'
          then nullif(v_dados->>'fechado_em', '')::timestamptz else fechado_em end,
        arquivado = case when v_dados ? 'arquivado'
          then (v_dados->>'arquivado')::boolean else arquivado end,
        arquivado_em = case when v_dados ? 'arquivado_em'
          then nullif(v_dados->>'arquivado_em', '')::timestamptz else arquivado_em end
      where empresa_id = p_empresa_id and id = p_entidade_id
      returning * into v_registro;
    elsif v_operacao = 'arquivar' then
      update public.df_folha_competencias
        set arquivado = true, arquivado_em = now()
        where empresa_id = p_empresa_id and id = p_entidade_id
        returning * into v_registro;
    else
      update public.df_folha_competencias
        set arquivado = false, arquivado_em = null
        where empresa_id = p_empresa_id and id = p_entidade_id
        returning * into v_registro;
    end if;
  end if;

  v_depois := to_jsonb(v_registro);
  perform public.df_registrar_auditoria_mutacao_interno(
    p_empresa_id, 'df_folha_competencias', v_registro.id, v_acao, 'folha',
    p_correlation_id, v_antes, v_depois, v_pedido
  );
  return v_depois || jsonb_build_object('idempotente', false);
end;
$$;

create or replace function public.df_mutar_lancamento_folha_controlado(
  p_empresa_id uuid,
  p_operacao text,
  p_entidade_id uuid,
  p_dados jsonb,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operacao text := lower(btrim(coalesce(p_operacao, '')));
  v_dados jsonb := coalesce(p_dados, '{}'::jsonb);
  v_acao text;
  v_pedido jsonb;
  v_anterior_metadados jsonb;
  v_anterior_entidade uuid;
  v_antes jsonb;
  v_depois jsonb;
  v_registro public.df_folha_lancamentos%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_correlation_id is null then
    raise exception 'PARAMETROS_MUTACAO_FOLHA_INVALIDOS';
  end if;
  if not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'ACESSO_NEGADO_MUTACAO_FOLHA';
  end if;
  if v_operacao not in ('criar', 'atualizar', 'arquivar', 'reativar')
    or jsonb_typeof(v_dados) <> 'object' then
    raise exception 'OPERACAO_MUTACAO_FOLHA_INVALIDA';
  end if;
  if v_operacao = 'criar' and p_entidade_id is not null then
    raise exception 'IDENTIFICACAO_LANCAMENTO_INESPERADA';
  elsif v_operacao <> 'criar' and p_entidade_id is null then
    raise exception 'LANCAMENTO_FOLHA_NAO_IDENTIFICADO';
  end if;
  if (v_operacao = 'criar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave where not (chave = any (array[
        'competencia_id','funcionario_id','filial_id','natureza','categoria','descricao',
        'data_referencia','quantidade','percentual','valor','observacao_administrativa',
        'origem_lancamento','origem_id'
      ]))
    )) or (v_operacao = 'atualizar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave where not (chave = any (array[
        'natureza','categoria','descricao','data_referencia','quantidade','percentual','valor',
        'observacao_administrativa','origem_lancamento','origem_id','conferido','conferido_em',
        'arquivado','arquivado_em'
      ]))
    )) or (v_operacao in ('arquivar','reativar') and v_dados <> '{}'::jsonb) then
    raise exception 'CAMPO_LANCAMENTO_NAO_PERMITIDO';
  end if;

  v_acao := case v_operacao
    when 'criar' then 'folha.lancamento.criado'
    when 'atualizar' then 'folha.lancamento.atualizado'
    when 'arquivar' then 'folha.lancamento.arquivado'
    else 'folha.lancamento.reativado'
  end;
  v_pedido := jsonb_build_object('operacao', v_operacao, 'entidade_id', p_entidade_id, 'dados', v_dados);
  perform pg_advisory_xact_lock(hashtextextended(
    'auditoria-mutacao:' || p_empresa_id || ':' || p_correlation_id,
    0
  ));
  select entidade_id, metadados into v_anterior_entidade, v_anterior_metadados
    from public.df_auditoria_eventos
    where empresa_id = p_empresa_id and correlation_id = p_correlation_id::text and acao = v_acao
    order by criado_em limit 1;
  if found then
    if v_anterior_metadados->'pedido' is distinct from v_pedido then
      raise exception 'CORRELATION_MUTACAO_REUTILIZADO';
    end if;
    select * into v_registro from public.df_folha_lancamentos
      where empresa_id = p_empresa_id and id = v_anterior_entidade;
    if not found then raise exception 'RESULTADO_MUTACAO_INDISPONIVEL'; end if;
    return to_jsonb(v_registro) || jsonb_build_object('idempotente', true);
  end if;

  if v_operacao = 'criar' then
    insert into public.df_folha_lancamentos (
      empresa_id, competencia_id, funcionario_id, filial_id, natureza, categoria, descricao,
      data_referencia, quantidade, percentual, valor, observacao_administrativa,
      origem_lancamento, origem_id, conferido, conferido_em, arquivado, arquivado_em
    ) values (
      p_empresa_id,
      nullif(v_dados->>'competencia_id', '')::uuid,
      nullif(v_dados->>'funcionario_id', '')::uuid,
      nullif(v_dados->>'filial_id', '')::uuid,
      v_dados->>'natureza',
      v_dados->>'categoria',
      nullif(btrim(v_dados->>'descricao'), ''),
      nullif(v_dados->>'data_referencia', '')::date,
      nullif(v_dados->>'quantidade', '')::numeric,
      nullif(v_dados->>'percentual', '')::numeric,
      nullif(v_dados->>'valor', '')::numeric,
      nullif(btrim(v_dados->>'observacao_administrativa'), ''),
      nullif(btrim(v_dados->>'origem_lancamento'), ''),
      nullif(v_dados->>'origem_id', '')::uuid,
      false, null, false, null
    ) returning * into v_registro;
    v_antes := null;
  else
    select * into v_registro from public.df_folha_lancamentos
      where empresa_id = p_empresa_id and id = p_entidade_id for update;
    if not found then raise exception 'LANCAMENTO_FOLHA_NAO_ENCONTRADO'; end if;
    if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_registro.filial_id) then
      raise exception 'ACESSO_FILIAL_NEGADO_MUTACAO_FOLHA';
    end if;
    v_antes := to_jsonb(v_registro) - array[
      'funcionario_nome_snapshot','filial_nome_snapshot','cargo_snapshot'
    ];

    if v_operacao = 'atualizar' then
      if v_dados = '{}'::jsonb then raise exception 'DADOS_LANCAMENTO_AUSENTES'; end if;
      update public.df_folha_lancamentos set
        natureza = case when v_dados ? 'natureza' then v_dados->>'natureza' else natureza end,
        categoria = case when v_dados ? 'categoria' then v_dados->>'categoria' else categoria end,
        descricao = case when v_dados ? 'descricao' then nullif(btrim(v_dados->>'descricao'), '') else descricao end,
        data_referencia = case when v_dados ? 'data_referencia' then nullif(v_dados->>'data_referencia', '')::date else data_referencia end,
        quantidade = case when v_dados ? 'quantidade' then nullif(v_dados->>'quantidade', '')::numeric else quantidade end,
        percentual = case when v_dados ? 'percentual' then nullif(v_dados->>'percentual', '')::numeric else percentual end,
        valor = case when v_dados ? 'valor' then nullif(v_dados->>'valor', '')::numeric else valor end,
        observacao_administrativa = case when v_dados ? 'observacao_administrativa' then nullif(btrim(v_dados->>'observacao_administrativa'), '') else observacao_administrativa end,
        origem_lancamento = case when v_dados ? 'origem_lancamento' then nullif(btrim(v_dados->>'origem_lancamento'), '') else origem_lancamento end,
        origem_id = case when v_dados ? 'origem_id' then nullif(v_dados->>'origem_id', '')::uuid else origem_id end,
        conferido = case when v_dados ? 'conferido' then (v_dados->>'conferido')::boolean else conferido end,
        conferido_em = case when v_dados ? 'conferido_em' then nullif(v_dados->>'conferido_em', '')::timestamptz else conferido_em end,
        arquivado = case when v_dados ? 'arquivado' then (v_dados->>'arquivado')::boolean else arquivado end,
        arquivado_em = case when v_dados ? 'arquivado_em' then nullif(v_dados->>'arquivado_em', '')::timestamptz else arquivado_em end
      where empresa_id = p_empresa_id and id = p_entidade_id
      returning * into v_registro;
    elsif v_operacao = 'arquivar' then
      update public.df_folha_lancamentos set arquivado = true, arquivado_em = now()
        where empresa_id = p_empresa_id and id = p_entidade_id returning * into v_registro;
    else
      update public.df_folha_lancamentos set arquivado = false, arquivado_em = null
        where empresa_id = p_empresa_id and id = p_entidade_id returning * into v_registro;
    end if;
  end if;

  if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_registro.filial_id) then
    raise exception 'ACESSO_FILIAL_NEGADO_MUTACAO_FOLHA';
  end if;
  v_depois := to_jsonb(v_registro) - array[
    'funcionario_nome_snapshot','filial_nome_snapshot','cargo_snapshot'
  ];
  perform public.df_registrar_auditoria_mutacao_interno(
    p_empresa_id, 'df_folha_lancamentos', v_registro.id, v_acao, 'folha',
    p_correlation_id, v_antes, v_depois, v_pedido
  );
  return to_jsonb(v_registro) || jsonb_build_object('idempotente', false);
end;
$$;

create or replace function public.df_mutar_item_folha_controlado(
  p_empresa_id uuid,
  p_operacao text,
  p_entidade_id uuid,
  p_dados jsonb,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operacao text := lower(btrim(coalesce(p_operacao, '')));
  v_dados jsonb := coalesce(p_dados, '{}'::jsonb);
  v_acao text;
  v_pedido jsonb;
  v_anterior_metadados jsonb;
  v_anterior_entidade uuid;
  v_antes jsonb;
  v_depois jsonb;
  v_registro public.df_folha_lancamento_itens%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_correlation_id is null then
    raise exception 'PARAMETROS_MUTACAO_FOLHA_INVALIDOS';
  end if;
  if not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'ACESSO_NEGADO_MUTACAO_FOLHA';
  end if;
  if v_operacao not in ('criar', 'atualizar', 'arquivar', 'reativar')
    or jsonb_typeof(v_dados) <> 'object' then
    raise exception 'OPERACAO_MUTACAO_FOLHA_INVALIDA';
  end if;
  if v_operacao = 'criar' and p_entidade_id is not null then
    raise exception 'IDENTIFICACAO_ITEM_INESPERADA';
  elsif v_operacao <> 'criar' and p_entidade_id is null then
    raise exception 'ITEM_FOLHA_NAO_IDENTIFICADO';
  end if;
  if (v_operacao = 'criar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave where not (chave = any (array[
        'competencia_id','lancamento_id','funcionario_id','filial_id','categoria','descricao',
        'data_referencia','quantidade','percentual','valor_base','valor',
        'observacao_administrativa','origem_item'
      ]))
    )) or (v_operacao = 'atualizar' and exists (
      select 1 from jsonb_object_keys(v_dados) chave where not (chave = any (array[
        'categoria','descricao','data_referencia','quantidade','percentual','valor_base','valor',
        'observacao_administrativa','origem_item','conferido','conferido_em','arquivado','arquivado_em'
      ]))
    )) or (v_operacao in ('arquivar','reativar') and v_dados <> '{}'::jsonb) then
    raise exception 'CAMPO_ITEM_FOLHA_NAO_PERMITIDO';
  end if;

  v_acao := case v_operacao
    when 'criar' then 'folha.item.criado'
    when 'atualizar' then 'folha.item.atualizado'
    when 'arquivar' then 'folha.item.arquivado'
    else 'folha.item.reativado'
  end;
  v_pedido := jsonb_build_object('operacao', v_operacao, 'entidade_id', p_entidade_id, 'dados', v_dados);
  perform pg_advisory_xact_lock(hashtextextended(
    'auditoria-mutacao:' || p_empresa_id || ':' || p_correlation_id,
    0
  ));
  select entidade_id, metadados into v_anterior_entidade, v_anterior_metadados
    from public.df_auditoria_eventos
    where empresa_id = p_empresa_id and correlation_id = p_correlation_id::text and acao = v_acao
    order by criado_em limit 1;
  if found then
    if v_anterior_metadados->'pedido' is distinct from v_pedido then
      raise exception 'CORRELATION_MUTACAO_REUTILIZADO';
    end if;
    select * into v_registro from public.df_folha_lancamento_itens
      where empresa_id = p_empresa_id and id = v_anterior_entidade;
    if not found then raise exception 'RESULTADO_MUTACAO_INDISPONIVEL'; end if;
    return to_jsonb(v_registro) || jsonb_build_object('idempotente', true);
  end if;

  if v_operacao = 'criar' then
    insert into public.df_folha_lancamento_itens (
      empresa_id, competencia_id, lancamento_id, funcionario_id, filial_id, categoria, descricao,
      data_referencia, quantidade, percentual, valor_base, valor, observacao_administrativa,
      origem_item, conferido, conferido_em, arquivado, arquivado_em
    ) values (
      p_empresa_id,
      nullif(v_dados->>'competencia_id', '')::uuid,
      nullif(v_dados->>'lancamento_id', '')::uuid,
      nullif(v_dados->>'funcionario_id', '')::uuid,
      nullif(v_dados->>'filial_id', '')::uuid,
      v_dados->>'categoria',
      nullif(btrim(v_dados->>'descricao'), ''),
      nullif(v_dados->>'data_referencia', '')::date,
      nullif(v_dados->>'quantidade', '')::numeric,
      nullif(v_dados->>'percentual', '')::numeric,
      nullif(v_dados->>'valor_base', '')::numeric,
      coalesce(nullif(v_dados->>'valor', '')::numeric, 0),
      nullif(btrim(v_dados->>'observacao_administrativa'), ''),
      nullif(btrim(v_dados->>'origem_item'), ''),
      false, null, false, null
    ) returning * into v_registro;
    v_antes := null;
  else
    select * into v_registro from public.df_folha_lancamento_itens
      where empresa_id = p_empresa_id and id = p_entidade_id for update;
    if not found then raise exception 'ITEM_FOLHA_NAO_ENCONTRADO'; end if;
    if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_registro.filial_id) then
      raise exception 'ACESSO_FILIAL_NEGADO_MUTACAO_FOLHA';
    end if;
    v_antes := to_jsonb(v_registro);

    if v_operacao = 'atualizar' then
      if v_dados = '{}'::jsonb then raise exception 'DADOS_ITEM_FOLHA_AUSENTES'; end if;
      update public.df_folha_lancamento_itens set
        categoria = case when v_dados ? 'categoria' then v_dados->>'categoria' else categoria end,
        descricao = case when v_dados ? 'descricao' then nullif(btrim(v_dados->>'descricao'), '') else descricao end,
        data_referencia = case when v_dados ? 'data_referencia' then nullif(v_dados->>'data_referencia', '')::date else data_referencia end,
        quantidade = case when v_dados ? 'quantidade' then nullif(v_dados->>'quantidade', '')::numeric else quantidade end,
        percentual = case when v_dados ? 'percentual' then nullif(v_dados->>'percentual', '')::numeric else percentual end,
        valor_base = case when v_dados ? 'valor_base' then nullif(v_dados->>'valor_base', '')::numeric else valor_base end,
        valor = case when v_dados ? 'valor' then coalesce(nullif(v_dados->>'valor', '')::numeric, 0) else valor end,
        observacao_administrativa = case when v_dados ? 'observacao_administrativa' then nullif(btrim(v_dados->>'observacao_administrativa'), '') else observacao_administrativa end,
        origem_item = case when v_dados ? 'origem_item' then nullif(btrim(v_dados->>'origem_item'), '') else origem_item end,
        conferido = case when v_dados ? 'conferido' then (v_dados->>'conferido')::boolean else conferido end,
        conferido_em = case when v_dados ? 'conferido_em' then nullif(v_dados->>'conferido_em', '')::timestamptz else conferido_em end,
        arquivado = case when v_dados ? 'arquivado' then (v_dados->>'arquivado')::boolean else arquivado end,
        arquivado_em = case when v_dados ? 'arquivado_em' then nullif(v_dados->>'arquivado_em', '')::timestamptz else arquivado_em end
      where empresa_id = p_empresa_id and id = p_entidade_id
      returning * into v_registro;
    elsif v_operacao = 'arquivar' then
      update public.df_folha_lancamento_itens set arquivado = true, arquivado_em = now()
        where empresa_id = p_empresa_id and id = p_entidade_id returning * into v_registro;
    else
      update public.df_folha_lancamento_itens set arquivado = false, arquivado_em = null
        where empresa_id = p_empresa_id and id = p_entidade_id returning * into v_registro;
    end if;
  end if;

  if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_registro.filial_id) then
    raise exception 'ACESSO_FILIAL_NEGADO_MUTACAO_FOLHA';
  end if;
  v_depois := to_jsonb(v_registro);
  perform public.df_registrar_auditoria_mutacao_interno(
    p_empresa_id, 'df_folha_lancamento_itens', v_registro.id, v_acao, 'folha',
    p_correlation_id, v_antes, v_depois, v_pedido
  );
  return v_depois || jsonb_build_object('idempotente', false);
end;
$$;

create or replace function public.df_definir_arquivamento_funcionario_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_arquivado boolean,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_acao text;
  v_pedido jsonb;
  v_anterior_metadados jsonb;
  v_anterior_entidade uuid;
  v_antes jsonb;
  v_depois jsonb;
  v_registro public.df_funcionarios%rowtype;
begin
  if auth.uid() is null or p_empresa_id is null or p_funcionario_id is null
    or p_arquivado is null or p_correlation_id is null then
    raise exception 'PARAMETROS_ARQUIVAMENTO_FUNCIONARIO_INVALIDOS';
  end if;
  if not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'ACESSO_NEGADO_ARQUIVAMENTO_FUNCIONARIO';
  end if;
  v_acao := case when p_arquivado then 'rh.funcionario.arquivado' else 'rh.funcionario.reativado' end;
  v_pedido := jsonb_build_object('funcionario_id', p_funcionario_id, 'arquivado', p_arquivado);
  perform pg_advisory_xact_lock(hashtextextended(
    'auditoria-mutacao:' || p_empresa_id || ':' || p_correlation_id,
    0
  ));
  select entidade_id, metadados into v_anterior_entidade, v_anterior_metadados
    from public.df_auditoria_eventos
    where empresa_id = p_empresa_id and correlation_id = p_correlation_id::text and acao = v_acao
    order by criado_em limit 1;
  if found then
    if v_anterior_metadados->'pedido' is distinct from v_pedido
      or v_anterior_entidade is distinct from p_funcionario_id then
      raise exception 'CORRELATION_MUTACAO_REUTILIZADO';
    end if;
    select * into v_registro from public.df_funcionarios
      where empresa_id = p_empresa_id and id = p_funcionario_id;
    if not found then raise exception 'RESULTADO_MUTACAO_INDISPONIVEL'; end if;
    return jsonb_build_object(
      'id', v_registro.id,
      'empresa_id', v_registro.empresa_id,
      'arquivado', v_registro.arquivado,
      'arquivado_em', v_registro.arquivado_em,
      'idempotente', true
    );
  end if;

  select * into v_registro from public.df_funcionarios
    where empresa_id = p_empresa_id and id = p_funcionario_id for update;
  if not found then raise exception 'FUNCIONARIO_NAO_ENCONTRADO'; end if;
  v_antes := jsonb_build_object('arquivado', v_registro.arquivado, 'arquivado_em', v_registro.arquivado_em);
  update public.df_funcionarios
    set arquivado = p_arquivado,
        arquivado_em = case when p_arquivado then now() else null end
    where empresa_id = p_empresa_id and id = p_funcionario_id
    returning * into v_registro;
  v_depois := jsonb_build_object('arquivado', v_registro.arquivado, 'arquivado_em', v_registro.arquivado_em);
  perform public.df_registrar_auditoria_mutacao_interno(
    p_empresa_id, 'df_funcionarios', v_registro.id, v_acao, 'rh',
    p_correlation_id, v_antes, v_depois, v_pedido
  );
  return jsonb_build_object(
    'id', v_registro.id,
    'empresa_id', v_registro.empresa_id,
    'arquivado', v_registro.arquivado,
    'arquivado_em', v_registro.arquivado_em,
    'idempotente', false
  );
end;
$$;

alter function public.df_mutar_competencia_folha_controlado(uuid,text,uuid,jsonb,uuid) owner to postgres;
alter function public.df_mutar_lancamento_folha_controlado(uuid,text,uuid,jsonb,uuid) owner to postgres;
alter function public.df_mutar_item_folha_controlado(uuid,text,uuid,jsonb,uuid) owner to postgres;
alter function public.df_definir_arquivamento_funcionario_controlado(uuid,uuid,boolean,uuid) owner to postgres;

revoke all on function public.df_mutar_competencia_folha_controlado(uuid,text,uuid,jsonb,uuid) from public, anon;
revoke all on function public.df_mutar_lancamento_folha_controlado(uuid,text,uuid,jsonb,uuid) from public, anon;
revoke all on function public.df_mutar_item_folha_controlado(uuid,text,uuid,jsonb,uuid) from public, anon;
revoke all on function public.df_definir_arquivamento_funcionario_controlado(uuid,uuid,boolean,uuid) from public, anon;

grant execute on function public.df_mutar_competencia_folha_controlado(uuid,text,uuid,jsonb,uuid) to authenticated;
grant execute on function public.df_mutar_lancamento_folha_controlado(uuid,text,uuid,jsonb,uuid) to authenticated;
grant execute on function public.df_mutar_item_folha_controlado(uuid,text,uuid,jsonb,uuid) to authenticated;
grant execute on function public.df_definir_arquivamento_funcionario_controlado(uuid,uuid,boolean,uuid) to authenticated;

revoke insert, update on table public.df_folha_competencias from authenticated;
revoke insert, update on table public.df_folha_lancamentos from authenticated;
revoke insert, update on table public.df_folha_lancamento_itens from authenticated;
revoke update on table public.df_funcionarios from authenticated;

comment on function public.df_mutar_competencia_folha_controlado(uuid,text,uuid,jsonb,uuid) is
  'Muta competencia e registra auditoria na mesma transacao, com autorizacao e idempotencia por correlation_id.';
comment on function public.df_mutar_lancamento_folha_controlado(uuid,text,uuid,jsonb,uuid) is
  'Muta lancamento e registra auditoria na mesma transacao, com autorizacao, filial e idempotencia.';
comment on function public.df_mutar_item_folha_controlado(uuid,text,uuid,jsonb,uuid) is
  'Muta item de lancamento e registra auditoria na mesma transacao, com autorizacao, filial e idempotencia.';
comment on function public.df_definir_arquivamento_funcionario_controlado(uuid,uuid,boolean,uuid) is
  'Arquiva ou reativa funcionario e registra auditoria na mesma transacao.';

commit;
