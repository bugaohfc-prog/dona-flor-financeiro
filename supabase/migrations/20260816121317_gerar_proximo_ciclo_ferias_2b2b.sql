begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_funcionarios_ferias_periodos') is null
     or to_regclass('public.df_auditoria_eventos') is null then
    raise exception 'ESTRUTURA_FERIAS_2B2B_AUSENTE';
  end if;

  if to_regprocedure('public.df_ferias_bloquear_funcionario_interno(uuid,uuid)') is null
     or to_regprocedure('public.df_ferias_fingerprint_ciclo_interno(jsonb)') is null
     or to_regprocedure('public.df_ferias_proveniencia_ciclo_interno(uuid,date)') is null
     or to_regprocedure('public.criar_ciclo_ferias_controlado(uuid,uuid,date,date,date,integer)') is null then
    raise exception 'AUTORIDADE_FERIAS_2B2A_AUSENTE';
  end if;
end $$;

create or replace function public.df_ferias_proveniencia_ciclo_interno(
  p_ciclo_id uuid,
  p_data_referencia date default current_date
)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_total_derivacoes integer := 0;
  v_derivacoes_fortes integer := 0;
  v_invalidacoes integer := 0;
  v_periodos integer := 0;
  v_evento_origem_id uuid;
  v_regra text;
  v_fingerprint_inicial text;
  v_fingerprint_atual text;
  v_classificacao text;
  v_elegivel boolean := false;
begin
  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where id = p_ciclo_id;

  if not found then
    raise exception 'CICLO_NAO_ENCONTRADO';
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where a.empresa_id = v_ciclo.empresa_id
        and a.entidade_tipo = 'ferias_ciclo'
        and a.entidade_id = v_ciclo.id
        and a.modulo = 'rh'
        and a.status = 'sucesso'
        and a.metadados->>'proveniencia' = 'sistema_derivado'
        and a.metadados->>'regra' in ('ferias_2b1', 'ferias_proximo_ciclo_v1')
        and a.metadados->>'fingerprint_versao' = 'ferias_ciclo_v1'
        and a.metadados->>'ciclo_id' = v_ciclo.id::text
        and a.metadados->>'funcionario_id' = v_ciclo.funcionario_id::text
        and a.metadados->>'empresa_id' = v_ciclo.empresa_id::text
        and nullif(btrim(a.correlation_id), '') is not null
        and a.metadados->>'correlation_id' = a.correlation_id
        and a.metadados->>'fingerprint_inicial' =
            public.df_ferias_fingerprint_ciclo_interno(a.dados_depois)
    )::integer
  into v_total_derivacoes, v_derivacoes_fortes
  from public.df_auditoria_eventos a
  where a.acao = 'rh.ferias_ciclo.derivado'
    and (
      a.entidade_id = v_ciclo.id
      or a.metadados->>'ciclo_id' = v_ciclo.id::text
    );

  if v_derivacoes_fortes = 1 and v_total_derivacoes = 1 then
    v_classificacao := 'PROVENIENCIA_FORTE';

    select a.id, a.metadados->>'regra', a.metadados->>'fingerprint_inicial'
      into v_evento_origem_id, v_regra, v_fingerprint_inicial
    from public.df_auditoria_eventos a
    where a.acao = 'rh.ferias_ciclo.derivado'
      and a.entidade_id = v_ciclo.id
      and a.metadados->>'proveniencia' = 'sistema_derivado'
      and a.metadados->>'regra' in ('ferias_2b1', 'ferias_proximo_ciclo_v1')
      and a.metadados->>'fingerprint_versao' = 'ferias_ciclo_v1';
  elsif v_total_derivacoes > 0 then
    v_classificacao := 'PROVENIENCIA_INSUFICIENTE';
  else
    v_classificacao := 'LEGADO_OU_DESCONHECIDO';
  end if;

  v_fingerprint_atual := public.df_ferias_fingerprint_ciclo_interno(to_jsonb(v_ciclo));

  select count(*)::integer into v_invalidacoes
  from public.df_auditoria_eventos
  where empresa_id = v_ciclo.empresa_id
    and entidade_tipo = 'ferias_ciclo'
    and entidade_id = v_ciclo.id
    and acao = 'rh.ferias_ciclo.automacao_invalidada'
    and status = 'sucesso';

  select count(*)::integer into v_periodos
  from public.df_funcionarios_ferias_periodos
  where ciclo_ferias_id = v_ciclo.id;

  v_elegivel := v_classificacao = 'PROVENIENCIA_FORTE'
    and v_invalidacoes = 0
    and v_periodos = 0
    and v_fingerprint_atual = v_fingerprint_inicial
    and not v_ciclo.arquivado
    and v_ciclo.status <> 'cancelada'
    and v_ciclo.periodo_aquisitivo_inicio > p_data_referencia;

  return jsonb_build_object(
    'ciclo_id', v_ciclo.id,
    'funcionario_id', v_ciclo.funcionario_id,
    'empresa_id', v_ciclo.empresa_id,
    'classificacao', v_classificacao,
    'evento_origem_id', v_evento_origem_id,
    'regra', v_regra,
    'fingerprint_versao', 'ferias_ciclo_v1',
    'fingerprint_inicial', v_fingerprint_inicial,
    'fingerprint_atual', v_fingerprint_atual,
    'fingerprint_confere', v_fingerprint_inicial is not null and v_fingerprint_atual = v_fingerprint_inicial,
    'invalidacoes', v_invalidacoes,
    'periodos_fisicos', v_periodos,
    'elegivel_automacao', v_elegivel
  );
end;
$$;

create or replace function public.df_ferias_garantir_proximo_ciclo_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_data_referencia date,
  p_correlation_id text default null,
  p_user_id uuid default null,
  p_origem text default 'sistema'
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
  v_ancora public.df_funcionarios_ferias_ciclos%rowtype;
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_corrente_count integer := 0;
  v_gaps integer := 0;
  v_sobreposicoes integer := 0;
  v_inicio date;
  v_fim date;
  v_limite date;
  v_correlation_id text;
  v_fingerprint text;
begin
  if p_data_referencia is null then
    raise exception 'DATA_REFERENCIA_OBRIGATORIA';
  end if;

  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);

  select * into v_funcionario
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id;

  if v_funcionario.arquivado
     or v_funcionario.status <> 'ativo'
     or v_funcionario.data_admissao is null then
    return jsonb_build_object(
      'codigo', 'FUNCIONARIO_INATIVO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia
    );
  end if;

  with sequencia as (
    select
      c.periodo_aquisitivo_inicio,
      c.periodo_aquisitivo_fim,
      lag(c.periodo_aquisitivo_fim) over (
        order by c.periodo_aquisitivo_inicio, c.id
      ) as fim_anterior
    from public.df_funcionarios_ferias_ciclos c
    where c.empresa_id = p_empresa_id
      and c.funcionario_id = p_funcionario_id
      and not c.arquivado
      and c.status <> 'cancelada'
  )
  select
    count(*) filter (
      where fim_anterior is not null
        and periodo_aquisitivo_inicio > fim_anterior + 1
    )::integer,
    count(*) filter (
      where fim_anterior is not null
        and periodo_aquisitivo_inicio <= fim_anterior
    )::integer
  into v_gaps, v_sobreposicoes
  from sequencia;

  if v_sobreposicoes > 0 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_SOBREPOSICAO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia
    );
  end if;

  if v_gaps > 0 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_GAP',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia
    );
  end if;

  select count(*)::integer into v_corrente_count
  from public.df_funcionarios_ferias_ciclos c
  where c.empresa_id = p_empresa_id
    and c.funcionario_id = p_funcionario_id
    and not c.arquivado
    and c.status <> 'cancelada'
    and p_data_referencia between c.periodo_aquisitivo_inicio and c.periodo_aquisitivo_fim;

  if v_corrente_count > 1 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_SOBREPOSICAO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia
    );
  end if;

  if v_corrente_count = 0 then
    return jsonb_build_object(
      'codigo', 'NAO_ELEGIVEL',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia,
      'motivo', 'SEM_CICLO_ATUAL_UNICO'
    );
  end if;

  select * into v_ancora
  from public.df_funcionarios_ferias_ciclos c
  where c.empresa_id = p_empresa_id
    and c.funcionario_id = p_funcionario_id
    and not c.arquivado
    and c.status <> 'cancelada'
    and p_data_referencia between c.periodo_aquisitivo_inicio and c.periodo_aquisitivo_fim;

  v_inicio := v_ancora.periodo_aquisitivo_fim + 1;
  v_fim := (v_inicio + interval '1 year' - interval '1 day')::date;
  v_limite := (v_fim + interval '1 year')::date;

  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos c
  where c.empresa_id = p_empresa_id
    and c.funcionario_id = p_funcionario_id
    and not c.arquivado
    and c.status <> 'cancelada'
    and c.periodo_aquisitivo_inicio = v_inicio
    and c.periodo_aquisitivo_fim = v_fim;

  if found then
    return jsonb_build_object(
      'codigo', 'JA_EXISTE',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'ciclo_id', v_ciclo.id,
      'data_referencia', p_data_referencia,
      'inicio', v_inicio,
      'fim', v_fim
    );
  end if;

  if exists (
    select 1
    from public.df_funcionarios_ferias_ciclos c
    where c.empresa_id = p_empresa_id
      and c.funcionario_id = p_funcionario_id
      and c.id <> v_ancora.id
      and c.periodo_aquisitivo_inicio <= v_fim
      and c.periodo_aquisitivo_fim >= v_inicio
  ) then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_SOBREPOSICAO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'inicio', v_inicio,
      'fim', v_fim
    );
  end if;

  if exists (
    select 1
    from public.df_funcionarios_ferias_ciclos c
    where c.empresa_id = p_empresa_id
      and c.funcionario_id = p_funcionario_id
      and c.id <> v_ancora.id
      and c.periodo_aquisitivo_inicio >= v_inicio
  ) then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_FUTURO_INCOMPATIVEL',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'inicio', v_inicio,
      'fim', v_fim
    );
  end if;

  if extract(month from v_inicio) = 2 and extract(day from v_inicio) = 29 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_29FEV',
      'diagnostico', 'PROXIMO_CICLO_29FEV_REQUER_DECISAO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'inicio', v_inicio
    );
  end if;

  if v_ancora.periodo_aquisitivo_fim <> p_data_referencia then
    return jsonb_build_object(
      'codigo', 'NAO_ELEGIVEL',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'data_acionamento', v_ancora.periodo_aquisitivo_fim,
      'motivo', 'FORA_DO_ULTIMO_DIA_DO_CICLO'
    );
  end if;

  v_correlation_id := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);

  insert into public.df_funcionarios_ferias_ciclos (
    empresa_id,
    funcionario_id,
    periodo_aquisitivo_inicio,
    periodo_aquisitivo_fim,
    data_limite_gozo,
    dias_direito,
    status,
    arquivado,
    arquivado_em
  ) values (
    p_empresa_id,
    p_funcionario_id,
    v_inicio,
    v_fim,
    v_limite,
    30,
    'pendente',
    false,
    null
  ) returning * into v_ciclo;

  v_fingerprint := public.df_ferias_fingerprint_ciclo_interno(to_jsonb(v_ciclo));

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
    motivo,
    dados_antes,
    dados_depois,
    metadados,
    correlation_id
  ) values (
    p_empresa_id,
    p_user_id,
    case when p_user_id is null then 'sistema' else 'usuario' end,
    'rh',
    'ferias_ciclo',
    v_ciclo.id,
    'rh.ferias_ciclo.derivado',
    'info',
    case when p_origem in ('app', 'sistema') then p_origem else 'sistema' end,
    'sucesso',
    null,
    null,
    to_jsonb(v_ciclo),
    jsonb_build_object(
      'proveniencia', 'sistema_derivado',
      'regra', 'ferias_proximo_ciclo_v1',
      'ciclo_id', v_ciclo.id,
      'ciclo_ancora_id', v_ancora.id,
      'funcionario_id', p_funcionario_id,
      'empresa_id', p_empresa_id,
      'data_base', p_data_referencia,
      'anchor', jsonb_build_object(
        'ciclo_id', v_ancora.id,
        'periodo_aquisitivo_fim', v_ancora.periodo_aquisitivo_fim
      ),
      'fingerprint_versao', 'ferias_ciclo_v1',
      'fingerprint_inicial', v_fingerprint,
      'snapshot_inicial', to_jsonb(v_ciclo),
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return jsonb_build_object(
    'codigo', 'CRIADO',
    'criado', true,
    'funcionario_id', p_funcionario_id,
    'ciclo_ancora_id', v_ancora.id,
    'ciclo_id', v_ciclo.id,
    'data_referencia', p_data_referencia,
    'inicio', v_inicio,
    'fim', v_fim,
    'data_limite_gozo', v_limite,
    'correlation_id', v_correlation_id
  );
end;
$$;

create or replace function public.garantir_proximo_ciclo_ferias_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_data_referencia date default ((now() at time zone 'America/Sao_Paulo')::date),
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null
     or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  return public.df_ferias_garantir_proximo_ciclo_interno(
    p_empresa_id,
    p_funcionario_id,
    p_data_referencia,
    p_correlation_id,
    auth.uid(),
    'app'
  );
end;
$$;

create or replace function public.criar_ciclo_ferias_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_periodo_aquisitivo_inicio date,
  p_periodo_aquisitivo_fim date,
  p_data_limite_gozo date,
  p_dias_direito integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
begin
  if auth.uid() is null
     or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);

  if p_periodo_aquisitivo_fim < p_periodo_aquisitivo_inicio
     or p_data_limite_gozo < p_periodo_aquisitivo_fim then
    raise exception 'DATAS_CICLO_INVALIDAS';
  end if;

  if p_dias_direito is null or p_dias_direito <= 0 then
    raise exception 'DIAS_DIREITO_INVALIDOS';
  end if;

  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
    and periodo_aquisitivo_inicio = p_periodo_aquisitivo_inicio
    and periodo_aquisitivo_fim = p_periodo_aquisitivo_fim
    and not arquivado
    and status <> 'cancelada';

  if found then
    return jsonb_build_object(
      'codigo', 'JA_EXISTE',
      'ciclo', to_jsonb(v_ciclo),
      'resumo', public.df_ferias_resumo_ciclo_interno(v_ciclo.id, current_date)
    );
  end if;

  insert into public.df_funcionarios_ferias_ciclos (
    empresa_id,
    funcionario_id,
    periodo_aquisitivo_inicio,
    periodo_aquisitivo_fim,
    data_limite_gozo,
    dias_direito,
    status,
    arquivado
  ) values (
    p_empresa_id,
    p_funcionario_id,
    p_periodo_aquisitivo_inicio,
    p_periodo_aquisitivo_fim,
    p_data_limite_gozo,
    p_dias_direito,
    'pendente',
    false
  ) returning * into v_ciclo;

  perform public.df_ferias_atualizar_status_cache_interno(v_ciclo.id);

  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where id = v_ciclo.id;

  perform public.df_ferias_auditar_interno(
    p_empresa_id,
    p_funcionario_id,
    v_ciclo.id,
    null,
    'rh.ferias_ciclo.criado',
    null,
    to_jsonb(v_ciclo),
    null
  );

  return jsonb_build_object(
    'codigo', 'CRIADO',
    'ciclo', to_jsonb(v_ciclo),
    'resumo', public.df_ferias_resumo_ciclo_interno(v_ciclo.id, current_date)
  );
end;
$$;

create or replace function public.df_ferias_gerar_proximos_ciclos_lote_interno(
  p_data_referencia date default ((now() at time zone 'America/Sao_Paulo')::date)
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_funcionario record;
  v_resultado jsonb;
  v_resultados jsonb := '[]'::jsonb;
  v_candidatos integer := 0;
  v_criados integer := 0;
  v_ja_existentes integer := 0;
  v_bloqueados integer := 0;
  v_erros integer := 0;
begin
  if p_data_referencia is null then
    raise exception 'DATA_REFERENCIA_OBRIGATORIA';
  end if;

  for v_funcionario in
    select f.empresa_id, f.id as funcionario_id
    from public.df_funcionarios f
    where exists (
      select 1
      from public.df_funcionarios_ferias_ciclos c
      where c.empresa_id = f.empresa_id
        and c.funcionario_id = f.id
        and not c.arquivado
        and c.status <> 'cancelada'
        and c.periodo_aquisitivo_fim = p_data_referencia
    )
    order by f.empresa_id, f.id
  loop
    v_candidatos := v_candidatos + 1;

    begin
      v_resultado := public.df_ferias_garantir_proximo_ciclo_interno(
        v_funcionario.empresa_id,
        v_funcionario.funcionario_id,
        p_data_referencia,
        gen_random_uuid()::text,
        null,
        'sistema'
      );
    exception when others then
      v_resultado := jsonb_build_object(
        'codigo', 'ERRO_TECNICO',
        'criado', false,
        'empresa_id', v_funcionario.empresa_id,
        'funcionario_id', v_funcionario.funcionario_id,
        'sqlstate', sqlstate
      );
    end;

    v_resultados := v_resultados || jsonb_build_array(v_resultado);

    if v_resultado->>'codigo' = 'CRIADO' then
      v_criados := v_criados + 1;
    elsif v_resultado->>'codigo' = 'JA_EXISTE' then
      v_ja_existentes := v_ja_existentes + 1;
    elsif v_resultado->>'codigo' = 'ERRO_TECNICO' then
      v_erros := v_erros + 1;
    elsif v_resultado->>'codigo' like 'BLOQUEADO_%' then
      v_bloqueados := v_bloqueados + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'data_referencia', p_data_referencia,
    'timezone', 'America/Sao_Paulo',
    'candidatos', v_candidatos,
    'criados', v_criados,
    'ja_existentes', v_ja_existentes,
    'bloqueados', v_bloqueados,
    'erros', v_erros,
    'resultados', v_resultados
  );
end;
$$;

revoke all on function public.df_ferias_garantir_proximo_ciclo_interno(uuid, uuid, date, text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.df_ferias_gerar_proximos_ciclos_lote_interno(date)
  from public, anon, authenticated;
revoke all on function public.garantir_proximo_ciclo_ferias_controlado(uuid, uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.garantir_proximo_ciclo_ferias_controlado(uuid, uuid, date, text)
  to authenticated;

comment on function public.garantir_proximo_ciclo_ferias_controlado(uuid, uuid, date, text) is
  'Gera, no ultimo dia civil do ciclo atual, no maximo um sucessor exato e auditado; nao reconcilia legado.';
comment on function public.df_ferias_gerar_proximos_ciclos_lote_interno(date) is
  'Executor interno idempotente do lote diario de sucessores de ferias.';

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'df-ferias-proximo-ciclo-diario'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'df-ferias-proximo-ciclo-diario',
    '5 3 * * *',
    $cron$select public.df_ferias_gerar_proximos_ciclos_lote_interno(
      (now() at time zone 'America/Sao_Paulo')::date
    );$cron$
  );
end $$;

commit;
