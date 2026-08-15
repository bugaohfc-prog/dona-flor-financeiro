begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_funcionarios_ferias_periodos') is null
     or to_regclass('public.df_auditoria_eventos') is null then
    raise exception 'ESTRUTURA_FERIAS_2B2A_AUSENTE';
  end if;

  if to_regprocedure('public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)') is null then
    raise exception 'AUTORIDADE_ADMISSAO_2B1_AUSENTE';
  end if;
end $$;

create or replace function public.df_ferias_fingerprint_ciclo_interno(
  p_ciclo jsonb
)
returns text
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select 'ferias_ciclo_v1:' || encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'id', p_ciclo->>'id',
          'empresa_id', p_ciclo->>'empresa_id',
          'funcionario_id', p_ciclo->>'funcionario_id',
          'periodo_aquisitivo_inicio', p_ciclo->>'periodo_aquisitivo_inicio',
          'periodo_aquisitivo_fim', p_ciclo->>'periodo_aquisitivo_fim',
          'data_limite_gozo', p_ciclo->>'data_limite_gozo',
          'dias_direito', (p_ciclo->>'dias_direito')::integer,
          'status', p_ciclo->>'status',
          'arquivado', (p_ciclo->>'arquivado')::boolean
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.df_ferias_bloquear_funcionario_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_empresa_id::text || ':' || p_funcionario_id::text, 0)
  );

  perform 1
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

  perform 1
  from public.df_funcionarios_ferias_ciclos
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
  order by periodo_aquisitivo_inicio, id
  for update;

  perform 1
  from public.df_funcionarios_ferias_periodos
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
  order by ciclo_ferias_id, data_inicio, id
  for update;
end;
$$;

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
        and a.metadados->>'regra' = 'ferias_2b1'
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

    select a.id, a.metadados->>'fingerprint_inicial'
      into v_evento_origem_id, v_fingerprint_inicial
    from public.df_auditoria_eventos a
    where a.acao = 'rh.ferias_ciclo.derivado'
      and a.entidade_id = v_ciclo.id
      and a.metadados->>'proveniencia' = 'sistema_derivado'
      and a.metadados->>'regra' = 'ferias_2b1'
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
    'regra', case when v_classificacao = 'PROVENIENCIA_FORTE' then 'ferias_2b1' else null end,
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

create or replace function public.df_ferias_invalidar_automacao_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_ciclo_id uuid,
  p_razao text,
  p_origem text default 'database_trigger'
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_proveniencia jsonb;
  v_correlation_id text;
begin
  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where id = p_ciclo_id
    and empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id;

  if not found then
    return;
  end if;

  v_proveniencia := public.df_ferias_proveniencia_ciclo_interno(p_ciclo_id, '-infinity'::date);

  if v_proveniencia->>'classificacao' <> 'PROVENIENCIA_FORTE'
     or exists (
       select 1
       from public.df_auditoria_eventos
       where empresa_id = p_empresa_id
         and entidade_tipo = 'ferias_ciclo'
         and entidade_id = p_ciclo_id
         and acao = 'rh.ferias_ciclo.automacao_invalidada'
         and status = 'sucesso'
     ) then
    return;
  end if;

  v_correlation_id := gen_random_uuid()::text;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id,
    auth.uid(),
    case when auth.uid() is null then 'database_trigger' else 'usuario' end,
    'rh',
    'ferias_ciclo',
    p_ciclo_id,
    'rh.ferias_ciclo.automacao_invalidada',
    'info',
    case when p_origem in ('app', 'database_trigger', 'sistema') then p_origem else 'database_trigger' end,
    'sucesso',
    nullif(btrim(p_razao), ''),
    to_jsonb(v_ciclo),
    to_jsonb(v_ciclo),
    jsonb_build_object(
      'funcionario_id', p_funcionario_id,
      'ciclo_id', p_ciclo_id,
      'empresa_id', p_empresa_id,
      'regra', 'ferias_2b2a',
      'fingerprint_versao', 'ferias_ciclo_v1',
      'fingerprint_antes', public.df_ferias_fingerprint_ciclo_interno(to_jsonb(v_ciclo)),
      'evento_origem_id', v_proveniencia->>'evento_origem_id',
      'razao_invalidacao', p_razao,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );
end;
$$;

create or replace function public.df_ferias_invalidar_ciclo_trigger()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_razao text;
begin
  if old.periodo_aquisitivo_inicio is not distinct from new.periodo_aquisitivo_inicio
     and old.periodo_aquisitivo_fim is not distinct from new.periodo_aquisitivo_fim
     and old.data_limite_gozo is not distinct from new.data_limite_gozo
     and old.dias_direito is not distinct from new.dias_direito
     and old.status is not distinct from new.status
     and old.arquivado is not distinct from new.arquivado then
    return new;
  end if;

  v_razao := case
    when old.dias_direito is distinct from new.dias_direito then 'dias_direito_ajustados'
    when old.periodo_aquisitivo_inicio is distinct from new.periodo_aquisitivo_inicio
      or old.periodo_aquisitivo_fim is distinct from new.periodo_aquisitivo_fim
      or old.data_limite_gozo is distinct from new.data_limite_gozo then 'datas_ciclo_alteradas'
    else 'estado_ciclo_alterado'
  end;

  perform public.df_ferias_invalidar_automacao_interno(
    old.empresa_id, old.funcionario_id, old.id, v_razao, 'database_trigger'
  );
  return new;
end;
$$;

create or replace function public.df_ferias_invalidar_periodo_trigger()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_periodo public.df_funcionarios_ferias_periodos%rowtype;
begin
  if tg_op = 'INSERT' then
    v_periodo := new;
  else
    v_periodo := old;
  end if;

  if tg_op = 'UPDATE'
     and old.data_inicio is not distinct from new.data_inicio
     and old.quantidade_dias is not distinct from new.quantidade_dias
     and old.data_fim_calculada is not distinct from new.data_fim_calculada
     and old.data_retorno_trabalho is not distinct from new.data_retorno_trabalho
     and old.numero_parcela is not distinct from new.numero_parcela
     and old.status is not distinct from new.status
     and old.arquivado is not distinct from new.arquivado then
    return new;
  end if;

  perform public.df_ferias_invalidar_automacao_interno(
    v_periodo.empresa_id,
    v_periodo.funcionario_id,
    v_periodo.ciclo_ferias_id,
    case when tg_op = 'INSERT' then 'periodo_criado' else 'periodo_alterado' end,
    'database_trigger'
  );
  return new;
end;
$$;

drop trigger if exists trg_df_ferias_ciclo_invalidar_automacao
  on public.df_funcionarios_ferias_ciclos;
create trigger trg_df_ferias_ciclo_invalidar_automacao
before update on public.df_funcionarios_ferias_ciclos
for each row execute function public.df_ferias_invalidar_ciclo_trigger();

drop trigger if exists trg_df_ferias_periodo_invalidar_automacao
  on public.df_funcionarios_ferias_periodos;
create trigger trg_df_ferias_periodo_invalidar_automacao
before insert or update on public.df_funcionarios_ferias_periodos
for each row execute function public.df_ferias_invalidar_periodo_trigger();

create or replace function public.alterar_admissao_funcionario_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_nova_data_admissao date,
  p_somente_preflight boolean default false,
  p_confirmar_ciclos_preservados boolean default false,
  p_motivo text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
  v_data_anterior date;
  v_ciclos_existentes integer := 0;
  v_primeiro_inicio date;
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_ciclo_criado_id uuid;
  v_fim_aquisitivo date;
  v_data_limite date;
  v_correlation_id text;
  v_admissao_alterada boolean;
  v_elegivel_ciclo boolean;
  v_fingerprint text;
begin
  if auth.uid() is null
     or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);

  select * into v_funcionario
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id;

  v_data_anterior := v_funcionario.data_admissao;
  v_admissao_alterada := v_data_anterior is distinct from p_nova_data_admissao;

  select count(*)::integer, min(periodo_aquisitivo_inicio)
    into v_ciclos_existentes, v_primeiro_inicio
  from public.df_funcionarios_ferias_ciclos
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id;

  if v_ciclos_existentes > 0
     and p_nova_data_admissao is not null
     and p_nova_data_admissao > v_primeiro_inicio then
    raise exception 'ADMISSAO_POSTERIOR_A_CICLO_EXISTENTE';
  end if;

  v_elegivel_ciclo := v_ciclos_existentes = 0
    and p_nova_data_admissao is not null
    and not v_funcionario.arquivado
    and v_funcionario.status = 'ativo';

  if v_elegivel_ciclo
     and extract(month from p_nova_data_admissao) = 2
     and extract(day from p_nova_data_admissao) = 29 then
    raise exception 'ADMISSAO_29FEV_REQUER_DECISAO';
  end if;

  if p_somente_preflight then
    return jsonb_build_object(
      'aplicado', false, 'somente_preflight', true,
      'admissao_alterada', v_admissao_alterada,
      'data_admissao_anterior', v_data_anterior,
      'data_admissao_nova', p_nova_data_admissao,
      'ciclos_existentes', v_ciclos_existentes,
      'requer_confirmacao', v_admissao_alterada and v_ciclos_existentes > 0,
      'motivo_obrigatorio', v_admissao_alterada and v_ciclos_existentes > 0,
      'criara_primeiro_ciclo', v_elegivel_ciclo,
      'ciclos_preservados', v_ciclos_existentes > 0
    );
  end if;

  if not v_admissao_alterada and not v_elegivel_ciclo then
    return jsonb_build_object(
      'aplicado', false, 'no_op', true, 'admissao_alterada', false,
      'data_admissao_anterior', v_data_anterior,
      'data_admissao_nova', p_nova_data_admissao,
      'ciclos_existentes', v_ciclos_existentes,
      'ciclo_criado_id', null,
      'ciclos_preservados', v_ciclos_existentes > 0
    );
  end if;

  if v_admissao_alterada and v_ciclos_existentes > 0 then
    if not p_confirmar_ciclos_preservados then
      return jsonb_build_object(
        'aplicado', false, 'requer_confirmacao', true,
        'motivo_obrigatorio', true, 'admissao_alterada', true,
        'data_admissao_anterior', v_data_anterior,
        'data_admissao_nova', p_nova_data_admissao,
        'ciclos_existentes', v_ciclos_existentes,
        'ciclos_preservados', true
      );
    end if;

    if length(btrim(coalesce(p_motivo, ''))) < 5 then
      raise exception 'MOTIVO_ADMISSAO_OBRIGATORIO';
    end if;
  end if;

  v_correlation_id := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);

  if v_admissao_alterada then
    update public.df_funcionarios
    set data_admissao = p_nova_data_admissao
    where id = p_funcionario_id
      and empresa_id = p_empresa_id;
  end if;

  if v_elegivel_ciclo then
    v_fim_aquisitivo := (p_nova_data_admissao + interval '1 year' - interval '1 day')::date;
    v_data_limite := (v_fim_aquisitivo + interval '1 year')::date;

    insert into public.df_funcionarios_ferias_ciclos (
      empresa_id, funcionario_id, periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim, data_limite_gozo, dias_direito,
      status, arquivado, arquivado_em
    ) values (
      p_empresa_id, p_funcionario_id, p_nova_data_admissao,
      v_fim_aquisitivo, v_data_limite, 30,
      'pendente', false, null
    ) returning * into v_ciclo;

    v_ciclo_criado_id := v_ciclo.id;
    v_fingerprint := public.df_ferias_fingerprint_ciclo_interno(to_jsonb(v_ciclo));
  end if;

  if v_admissao_alterada then
    insert into public.df_auditoria_eventos (
      empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
      acao, severidade, origem, status, motivo, dados_antes, dados_depois,
      metadados, correlation_id
    ) values (
      p_empresa_id, auth.uid(), 'usuario', 'rh', 'df_funcionarios', p_funcionario_id,
      'rh.funcionario.admissao_alterada', 'info', 'app', 'sucesso',
      case when v_ciclos_existentes > 0 then nullif(btrim(p_motivo), '') else null end,
      jsonb_build_object('data_admissao', v_data_anterior),
      jsonb_build_object('data_admissao', p_nova_data_admissao),
      jsonb_build_object(
        'funcionario_id', p_funcionario_id,
        'ciclos_existentes', v_ciclos_existentes,
        'ciclo_criado_id', v_ciclo_criado_id,
        'regra', 'ferias_2b1',
        'correlation_id', v_correlation_id
      ),
      v_correlation_id
    );
  end if;

  if v_ciclo_criado_id is not null then
    insert into public.df_auditoria_eventos (
      empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
      acao, severidade, origem, status, motivo, dados_antes, dados_depois,
      metadados, correlation_id
    ) values (
      p_empresa_id, auth.uid(), 'usuario', 'rh', 'ferias_ciclo', v_ciclo_criado_id,
      'rh.ferias_ciclo.derivado', 'info', 'app', 'sucesso', null, null,
      to_jsonb(v_ciclo),
      jsonb_build_object(
        'funcionario_id', p_funcionario_id,
        'ciclo_id', v_ciclo_criado_id,
        'empresa_id', p_empresa_id,
        'data_admissao_base', p_nova_data_admissao,
        'proveniencia', 'sistema_derivado',
        'regra', 'ferias_2b1',
        'fingerprint_versao', 'ferias_ciclo_v1',
        'fingerprint_inicial', v_fingerprint,
        'correlation_id', v_correlation_id
      ),
      v_correlation_id
    );
  end if;

  return jsonb_build_object(
    'aplicado', true, 'no_op', false,
    'admissao_alterada', v_admissao_alterada,
    'data_admissao_anterior', v_data_anterior,
    'data_admissao_nova', p_nova_data_admissao,
    'ciclos_existentes', v_ciclos_existentes,
    'ciclos_preservados', v_ciclos_existentes > 0,
    'ciclo_criado_id', v_ciclo_criado_id,
    'ciclo_criado', case when v_ciclo_criado_id is null then null else to_jsonb(v_ciclo) end,
    'correlation_id', v_correlation_id
  );
end;
$$;

create or replace function public.criar_ciclo_ferias_controlado(
  p_empresa_id uuid, p_funcionario_id uuid,
  p_periodo_aquisitivo_inicio date, p_periodo_aquisitivo_fim date,
  p_data_limite_gozo date, p_dias_direito integer default 30
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,p_funcionario_id);
  if p_periodo_aquisitivo_fim < p_periodo_aquisitivo_inicio or p_data_limite_gozo < p_periodo_aquisitivo_fim then raise exception 'DATAS_CICLO_INVALIDAS'; end if;
  if p_dias_direito is null or p_dias_direito <= 0 then raise exception 'DIAS_DIREITO_INVALIDOS'; end if;
  insert into public.df_funcionarios_ferias_ciclos (empresa_id,funcionario_id,periodo_aquisitivo_inicio,periodo_aquisitivo_fim,data_limite_gozo,dias_direito,status,arquivado)
  values (p_empresa_id,p_funcionario_id,p_periodo_aquisitivo_inicio,p_periodo_aquisitivo_fim,p_data_limite_gozo,p_dias_direito,'pendente',false) returning * into v_ciclo;
  perform public.df_ferias_atualizar_status_cache_interno(v_ciclo.id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=v_ciclo.id;
  perform public.df_ferias_auditar_interno(p_empresa_id,p_funcionario_id,v_ciclo.id,null,'rh.ferias_ciclo.criado',null,to_jsonb(v_ciclo),null);
  return jsonb_build_object('ciclo',to_jsonb(v_ciclo),'resumo',public.df_ferias_resumo_ciclo_interno(v_ciclo.id,current_date));
end;
$$;

create or replace function public.ajustar_dias_ciclo_ferias_controlado(
  p_empresa_id uuid, p_ciclo_id uuid, p_dias_direito integer, p_motivo text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype; v_antes jsonb; v_reservados integer; v_funcionario_id uuid;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if length(btrim(coalesce(p_motivo,''))) < 5 then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  select funcionario_id into v_funcionario_id from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,v_funcionario_id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  select coalesce(sum(quantidade_dias),0)::integer into v_reservados from public.df_funcionarios_ferias_periodos where ciclo_ferias_id=p_ciclo_id and not arquivado and status<>'cancelada';
  if p_dias_direito is null or p_dias_direito < greatest(v_reservados,1) then raise exception 'DIAS_DIREITO_MENORES_QUE_RESERVA'; end if;
  v_antes:=to_jsonb(v_ciclo);
  update public.df_funcionarios_ferias_ciclos set dias_direito=p_dias_direito where id=p_ciclo_id returning * into v_ciclo;
  perform public.df_ferias_atualizar_status_cache_interno(p_ciclo_id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id;
  perform public.df_ferias_auditar_interno(p_empresa_id,v_ciclo.funcionario_id,p_ciclo_id,null,'rh.ferias_ciclo.dias_ajustados',v_antes,to_jsonb(v_ciclo),p_motivo);
  return jsonb_build_object('ciclo',to_jsonb(v_ciclo),'resumo',public.df_ferias_resumo_ciclo_interno(p_ciclo_id,current_date));
end;
$$;

create or replace function public.alterar_estado_ciclo_ferias_controlado(
  p_empresa_id uuid, p_ciclo_id uuid, p_acao text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype; v_antes jsonb; v_funcionario_id uuid;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if p_acao not in ('arquivar','reativar','cancelar') then raise exception 'ACAO_INVALIDA'; end if;
  select funcionario_id into v_funcionario_id from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,v_funcionario_id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  v_antes:=to_jsonb(v_ciclo);
  if p_acao='arquivar' then update public.df_funcionarios_ferias_ciclos set arquivado=true,arquivado_em=now() where id=p_ciclo_id returning * into v_ciclo;
  elsif p_acao='cancelar' then update public.df_funcionarios_ferias_ciclos set status='cancelada',arquivado=false,arquivado_em=null where id=p_ciclo_id returning * into v_ciclo;
  else update public.df_funcionarios_ferias_ciclos set arquivado=false,arquivado_em=null,status=case when status='cancelada' then 'pendente' else status end where id=p_ciclo_id returning * into v_ciclo;
    perform public.df_ferias_atualizar_status_cache_interno(p_ciclo_id); select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id; end if;
  perform public.df_ferias_auditar_interno(p_empresa_id,v_ciclo.funcionario_id,p_ciclo_id,null,'rh.ferias_ciclo.'||p_acao,v_antes,to_jsonb(v_ciclo),null);
  return jsonb_build_object('ciclo',to_jsonb(v_ciclo),'resumo',public.df_ferias_resumo_ciclo_interno(p_ciclo_id,current_date));
end;
$$;

create or replace function public.criar_periodo_ferias_controlado(
  p_empresa_id uuid, p_ciclo_id uuid, p_data_inicio date, p_quantidade_dias integer
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype; v_periodo public.df_funcionarios_ferias_periodos%rowtype; v_datas jsonb; v_parcela integer; v_funcionario_id uuid;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select funcionario_id into v_funcionario_id from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,v_funcionario_id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id;
  select numero into v_parcela from generate_series(1,3) numero where not exists (select 1 from public.df_funcionarios_ferias_periodos p where p.ciclo_ferias_id=p_ciclo_id and p.numero_parcela=numero and not p.arquivado and p.status<>'cancelada') order by numero limit 1;
  if v_parcela is null then raise exception 'LIMITE_TRES_PARCELAS'; end if;
  v_datas:=public.df_ferias_validar_periodo_interno(p_ciclo_id,null,p_data_inicio,p_quantidade_dias,v_parcela);
  insert into public.df_funcionarios_ferias_periodos (empresa_id,ciclo_ferias_id,funcionario_id,data_inicio,quantidade_dias,data_fim_calculada,data_retorno_trabalho,numero_parcela,status,arquivado)
  values (p_empresa_id,p_ciclo_id,v_ciclo.funcionario_id,p_data_inicio,p_quantidade_dias,(v_datas->>'data_fim')::date,(v_datas->>'data_retorno')::date,v_parcela,'agendada',false) returning * into v_periodo;
  perform public.df_ferias_atualizar_status_cache_interno(p_ciclo_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_ciclo.funcionario_id,p_ciclo_id,v_periodo.id,'rh.ferias_periodo.criado',null,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(p_ciclo_id,current_date));
end;
$$;

create or replace function public.atualizar_periodo_ferias_controlado(
  p_empresa_id uuid, p_periodo_id uuid, p_data_inicio date, p_quantidade_dias integer
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_periodo public.df_funcionarios_ferias_periodos%rowtype; v_ciclo_id uuid; v_antes jsonb; v_datas jsonb; v_funcionario_id uuid;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select ciclo_ferias_id,funcionario_id into v_ciclo_id,v_funcionario_id from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,v_funcionario_id);
  select * into v_periodo from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id and ciclo_ferias_id=v_ciclo_id;
  if v_periodo.arquivado or v_periodo.status='cancelada' then raise exception 'PERIODO_INATIVO'; end if;
  v_antes:=to_jsonb(v_periodo);
  v_datas:=public.df_ferias_validar_periodo_interno(v_periodo.ciclo_ferias_id,p_periodo_id,p_data_inicio,p_quantidade_dias,v_periodo.numero_parcela);
  update public.df_funcionarios_ferias_periodos set data_inicio=p_data_inicio,quantidade_dias=p_quantidade_dias,data_fim_calculada=(v_datas->>'data_fim')::date,data_retorno_trabalho=(v_datas->>'data_retorno')::date where id=p_periodo_id returning * into v_periodo;
  perform public.df_ferias_atualizar_status_cache_interno(v_periodo.ciclo_ferias_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_periodo.funcionario_id,v_periodo.ciclo_ferias_id,v_periodo.id,'rh.ferias_periodo.atualizado',v_antes,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(v_periodo.ciclo_ferias_id,current_date));
end;
$$;

create or replace function public.alterar_estado_periodo_ferias_controlado(
  p_empresa_id uuid, p_periodo_id uuid, p_acao text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_periodo public.df_funcionarios_ferias_periodos%rowtype; v_ciclo_id uuid; v_antes jsonb; v_datas jsonb; v_funcionario_id uuid;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if p_acao not in ('cancelar','arquivar','reativar') then raise exception 'ACAO_INVALIDA'; end if;
  select ciclo_ferias_id,funcionario_id into v_ciclo_id,v_funcionario_id from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id,v_funcionario_id);
  select * into v_periodo from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id and ciclo_ferias_id=v_ciclo_id;
  v_antes:=to_jsonb(v_periodo);
  if p_acao='cancelar' then update public.df_funcionarios_ferias_periodos set status='cancelada',arquivado=false,arquivado_em=null where id=p_periodo_id returning * into v_periodo;
  elsif p_acao='arquivar' then update public.df_funcionarios_ferias_periodos set arquivado=true,arquivado_em=now() where id=p_periodo_id returning * into v_periodo;
  else v_datas:=public.df_ferias_validar_periodo_interno(v_periodo.ciclo_ferias_id,p_periodo_id,v_periodo.data_inicio,v_periodo.quantidade_dias,v_periodo.numero_parcela);
    update public.df_funcionarios_ferias_periodos set arquivado=false,arquivado_em=null,status=case when status='cancelada' then 'agendada' else status end where id=p_periodo_id returning * into v_periodo; end if;
  perform public.df_ferias_atualizar_status_cache_interno(v_periodo.ciclo_ferias_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_periodo.funcionario_id,v_periodo.ciclo_ferias_id,v_periodo.id,'rh.ferias_periodo.'||p_acao,v_antes,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(v_periodo.ciclo_ferias_id,current_date));
end;
$$;

revoke all on function public.df_ferias_fingerprint_ciclo_interno(jsonb) from public, anon, authenticated;
revoke all on function public.df_ferias_bloquear_funcionario_interno(uuid,uuid) from public, anon, authenticated;
revoke all on function public.df_ferias_proveniencia_ciclo_interno(uuid,date) from public, anon, authenticated;
revoke all on function public.df_ferias_invalidar_automacao_interno(uuid,uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.df_ferias_invalidar_ciclo_trigger() from public, anon, authenticated;
revoke all on function public.df_ferias_invalidar_periodo_trigger() from public, anon, authenticated;

do $$
declare
  v_rpc text;
begin
  foreach v_rpc in array array[
    'public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)',
    'public.criar_ciclo_ferias_controlado(uuid,uuid,date,date,date,integer)',
    'public.ajustar_dias_ciclo_ferias_controlado(uuid,uuid,integer,text)',
    'public.alterar_estado_ciclo_ferias_controlado(uuid,uuid,text)',
    'public.criar_periodo_ferias_controlado(uuid,uuid,date,integer)',
    'public.atualizar_periodo_ferias_controlado(uuid,uuid,date,integer)',
    'public.alterar_estado_periodo_ferias_controlado(uuid,uuid,text)'
  ] loop
    if not has_function_privilege('authenticated', v_rpc, 'EXECUTE') then
      raise exception 'AUTHENTICATED_SEM_EXECUCAO_RPC: %', v_rpc;
    end if;
    if has_function_privilege('anon', v_rpc, 'EXECUTE') then
      raise exception 'ANON_COM_EXECUCAO_RPC: %', v_rpc;
    end if;
  end loop;
end $$;

commit;
