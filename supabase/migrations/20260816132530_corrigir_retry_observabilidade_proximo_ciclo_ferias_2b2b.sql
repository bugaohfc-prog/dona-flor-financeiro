begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_ferias_garantir_proximo_ciclo_interno(uuid,uuid,date,text,uuid,text)') is null
     or to_regprocedure('public.df_ferias_bloquear_funcionario_interno(uuid,uuid)') is null then
    raise exception 'AUTORIDADE_FERIAS_2B2B_AUSENTE';
  end if;
end $$;

create table if not exists public.df_ferias_automacoes_config (
  regra text primary key,
  data_ativacao date not null,
  criado_em timestamptz not null default now(),
  constraint df_ferias_automacoes_config_regra_check
    check (regra = 'ferias_proximo_ciclo_v1')
);

comment on table public.df_ferias_automacoes_config is
  'Fronteiras operacionais versionadas das automacoes de Ferias; nao altera ciclos existentes.';

alter table public.df_ferias_automacoes_config enable row level security;
revoke all on table public.df_ferias_automacoes_config from public, anon, authenticated;

insert into public.df_ferias_automacoes_config (regra, data_ativacao)
values (
  'ferias_proximo_ciclo_v1',
  (now() at time zone 'America/Sao_Paulo')::date
)
on conflict (regra) do nothing;

create table if not exists public.df_ferias_execucoes_automaticas (
  id uuid primary key default gen_random_uuid(),
  regra text not null,
  data_ativacao date not null,
  data_referencia date not null,
  iniciado_em timestamptz not null default clock_timestamp(),
  finalizado_em timestamptz,
  status text not null default 'em_execucao',
  candidatos integer not null default 0,
  criados integer not null default 0,
  ja_existentes integer not null default 0,
  bloqueados integer not null default 0,
  erros integer not null default 0,
  resumo jsonb not null default '{}'::jsonb,
  origem text not null,
  correlation_id text not null unique,
  constraint df_ferias_execucoes_regra_check
    check (regra = 'ferias_proximo_ciclo_v1'),
  constraint df_ferias_execucoes_status_check
    check (status in ('em_execucao', 'sucesso', 'parcial', 'falha')),
  constraint df_ferias_execucoes_origem_check
    check (origem in ('cron', 'manual_test')),
  constraint df_ferias_execucoes_contadores_check
    check (
      candidatos >= 0 and criados >= 0 and ja_existentes >= 0
      and bloqueados >= 0 and erros >= 0
    ),
  constraint df_ferias_execucoes_finalizacao_check
    check (
      (status = 'em_execucao' and finalizado_em is null)
      or (status <> 'em_execucao' and finalizado_em is not null)
    )
);

comment on table public.df_ferias_execucoes_automaticas is
  'Observabilidade funcional append-only das execucoes do gerador diario de ciclos de Ferias.';

create index if not exists idx_df_ferias_execucoes_regra_inicio
  on public.df_ferias_execucoes_automaticas (regra, iniciado_em desc);

create index if not exists idx_df_ferias_execucoes_status_inicio
  on public.df_ferias_execucoes_automaticas (status, iniciado_em desc);

alter table public.df_ferias_execucoes_automaticas enable row level security;
revoke all on table public.df_ferias_execucoes_automaticas from public, anon, authenticated;

create or replace function public.df_ferias_proteger_execucao_automatica_interno()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'EXECUCAO_AUTOMATICA_APPEND_ONLY';
  end if;

  if old.status <> 'em_execucao'
     or new.id <> old.id
     or new.regra <> old.regra
     or new.data_ativacao <> old.data_ativacao
     or new.data_referencia <> old.data_referencia
     or new.iniciado_em <> old.iniciado_em
     or new.origem <> old.origem
     or new.correlation_id <> old.correlation_id
     or new.status = 'em_execucao'
     or new.finalizado_em is null then
    raise exception 'EXECUCAO_AUTOMATICA_FINALIZACAO_INVALIDA';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_ferias_execucoes_append_only
  on public.df_ferias_execucoes_automaticas;
create trigger trg_df_ferias_execucoes_append_only
before update or delete on public.df_ferias_execucoes_automaticas
for each row execute function public.df_ferias_proteger_execucao_automatica_interno();

revoke all on function public.df_ferias_proteger_execucao_automatica_interno()
  from public, anon, authenticated;

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
  v_gaps integer := 0;
  v_sobreposicoes integer := 0;
  v_inicio date;
  v_fim date;
  v_limite date;
  v_data_ativacao date;
  v_modo text;
  v_correlation_id text;
  v_fingerprint text;
begin
  if p_data_referencia is null then
    raise exception 'DATA_REFERENCIA_OBRIGATORIA';
  end if;

  select data_ativacao into v_data_ativacao
  from public.df_ferias_automacoes_config
  where regra = 'ferias_proximo_ciclo_v1';

  if v_data_ativacao is null then
    raise exception 'CONFIG_AUTOMACAO_FERIAS_AUSENTE';
  end if;

  perform public.df_ferias_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);

  select * into v_funcionario
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id;

  if not found
     or v_funcionario.arquivado
     or v_funcionario.status <> 'ativo'
     or v_funcionario.data_admissao is null then
    return jsonb_build_object(
      'codigo', 'FUNCIONARIO_INATIVO',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao
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
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao
    );
  end if;

  if v_gaps > 0 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_GAP',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao
    );
  end if;

  select * into v_ancora
  from public.df_funcionarios_ferias_ciclos c
  where c.empresa_id = p_empresa_id
    and c.funcionario_id = p_funcionario_id
    and not c.arquivado
    and c.status <> 'cancelada'
    and c.periodo_aquisitivo_fim <= p_data_referencia
  order by c.periodo_aquisitivo_fim desc, c.periodo_aquisitivo_inicio desc, c.id
  limit 1;

  if not found then
    return jsonb_build_object(
      'codigo', 'NAO_ELEGIVEL',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
      'motivo', 'SEM_CICLO_ENCERRADO'
    );
  end if;

  if v_ancora.periodo_aquisitivo_fim < v_data_ativacao then
    return jsonb_build_object(
      'codigo', 'NAO_ELEGIVEL',
      'criado', false,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
      'data_acionamento', v_ancora.periodo_aquisitivo_fim,
      'motivo', 'CICLO_ENCERRADO_ANTES_ATIVACAO'
    );
  end if;

  v_inicio := v_ancora.periodo_aquisitivo_fim + 1;
  v_fim := (v_inicio + interval '1 year' - interval '1 day')::date;
  v_limite := (v_fim + interval '1 year')::date;
  v_modo := case
    when v_ancora.periodo_aquisitivo_fim = p_data_referencia then 'NORMAL'
    else 'CATCH_UP'
  end;

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
      'modo', v_modo,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'ciclo_id', v_ciclo.id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
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
      'modo', v_modo,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
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
      'modo', v_modo,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
      'inicio', v_inicio,
      'fim', v_fim
    );
  end if;

  if extract(month from v_inicio) = 2 and extract(day from v_inicio) = 29 then
    return jsonb_build_object(
      'codigo', 'BLOQUEADO_29FEV',
      'diagnostico', 'PROXIMO_CICLO_29FEV_REQUER_DECISAO',
      'criado', false,
      'modo', v_modo,
      'funcionario_id', p_funcionario_id,
      'ciclo_ancora_id', v_ancora.id,
      'data_referencia', p_data_referencia,
      'data_ativacao', v_data_ativacao,
      'inicio', v_inicio
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
      'data_base', v_ancora.periodo_aquisitivo_fim,
      'data_execucao', p_data_referencia,
      'modo', v_modo,
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
    'modo', v_modo,
    'funcionario_id', p_funcionario_id,
    'ciclo_ancora_id', v_ancora.id,
    'ciclo_id', v_ciclo.id,
    'data_referencia', p_data_referencia,
    'data_ativacao', v_data_ativacao,
    'inicio', v_inicio,
    'fim', v_fim,
    'data_limite_gozo', v_limite,
    'correlation_id', v_correlation_id
  );
end;
$$;

create or replace function public.df_ferias_gerar_proximos_ciclos_lote_execucao_interno(
  p_data_referencia date,
  p_origem text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_execucao_id uuid := gen_random_uuid();
  v_correlation_id text := gen_random_uuid()::text;
  v_data_ativacao date;
  v_funcionario record;
  v_resultado jsonb;
  v_resultados jsonb := '[]'::jsonb;
  v_resumo jsonb;
  v_candidatos integer := 0;
  v_criados integer := 0;
  v_ja_existentes integer := 0;
  v_bloqueados integer := 0;
  v_erros integer := 0;
  v_status text;
  v_sqlstate text;
  v_sqlerrm text;
begin
  if p_data_referencia is null then
    raise exception 'DATA_REFERENCIA_OBRIGATORIA';
  end if;

  if p_origem not in ('cron', 'manual_test') then
    raise exception 'ORIGEM_EXECUCAO_INVALIDA';
  end if;

  select data_ativacao into v_data_ativacao
  from public.df_ferias_automacoes_config
  where regra = 'ferias_proximo_ciclo_v1';

  if v_data_ativacao is null then
    raise exception 'CONFIG_AUTOMACAO_FERIAS_AUSENTE';
  end if;

  insert into public.df_ferias_execucoes_automaticas (
    id,
    regra,
    data_ativacao,
    data_referencia,
    status,
    origem,
    correlation_id
  ) values (
    v_execucao_id,
    'ferias_proximo_ciclo_v1',
    v_data_ativacao,
    p_data_referencia,
    'em_execucao',
    p_origem,
    v_correlation_id
  );

  begin
    for v_funcionario in
      select f.empresa_id, f.id as funcionario_id
      from public.df_funcionarios f
      join lateral (
        select c.periodo_aquisitivo_fim
        from public.df_funcionarios_ferias_ciclos c
        where c.empresa_id = f.empresa_id
          and c.funcionario_id = f.id
          and not c.arquivado
          and c.status <> 'cancelada'
          and c.periodo_aquisitivo_fim <= p_data_referencia
        order by c.periodo_aquisitivo_fim desc, c.periodo_aquisitivo_inicio desc, c.id
        limit 1
      ) ancora on true
      where ancora.periodo_aquisitivo_fim >= v_data_ativacao
        and not exists (
          select 1
          from public.df_funcionarios_ferias_ciclos sucessor
          where sucessor.empresa_id = f.empresa_id
            and sucessor.funcionario_id = f.id
            and not sucessor.arquivado
            and sucessor.status <> 'cancelada'
            and sucessor.periodo_aquisitivo_inicio = ancora.periodo_aquisitivo_fim + 1
            and sucessor.periodo_aquisitivo_fim =
              (ancora.periodo_aquisitivo_fim + 1 + interval '1 year' - interval '1 day')::date
        )
      order by f.empresa_id, f.id
    loop
      v_candidatos := v_candidatos + 1;

      begin
        v_resultado := public.df_ferias_garantir_proximo_ciclo_interno(
          v_funcionario.empresa_id,
          v_funcionario.funcionario_id,
          p_data_referencia,
          v_correlation_id || ':' || v_funcionario.funcionario_id::text,
          null,
          'sistema'
        );
      exception when others then
        get stacked diagnostics v_sqlstate = returned_sqlstate, v_sqlerrm = message_text;
        v_resultado := jsonb_build_object(
          'codigo', 'ERRO_TECNICO',
          'criado', false,
          'empresa_id', v_funcionario.empresa_id,
          'funcionario_id', v_funcionario.funcionario_id,
          'sqlstate', v_sqlstate,
          'mensagem', left(v_sqlerrm, 500)
        );
      end;

      v_resultados := v_resultados || jsonb_build_array(v_resultado);

      if v_resultado->>'codigo' = 'CRIADO' then
        v_criados := v_criados + 1;
      elsif v_resultado->>'codigo' = 'JA_EXISTE' then
        v_ja_existentes := v_ja_existentes + 1;
      elsif v_resultado->>'codigo' = 'ERRO_TECNICO' then
        v_erros := v_erros + 1;
      elsif v_resultado->>'codigo' like 'BLOQUEADO_%'
         or v_resultado->>'codigo' in ('NAO_ELEGIVEL', 'FUNCIONARIO_INATIVO') then
        v_bloqueados := v_bloqueados + 1;
      end if;
    end loop;

    v_status := case when v_erros > 0 then 'parcial' else 'sucesso' end;
    v_resumo := jsonb_build_object(
      'execucao_id', v_execucao_id,
      'correlation_id', v_correlation_id,
      'regra', 'ferias_proximo_ciclo_v1',
      'origem', p_origem,
      'data_ativacao', v_data_ativacao,
      'data_referencia', p_data_referencia,
      'timezone', 'America/Sao_Paulo',
      'status', v_status,
      'candidatos', v_candidatos,
      'criados', v_criados,
      'ja_existentes', v_ja_existentes,
      'bloqueados', v_bloqueados,
      'erros', v_erros,
      'resultados', v_resultados
    );

    update public.df_ferias_execucoes_automaticas
    set finalizado_em = clock_timestamp(),
        status = v_status,
        candidatos = v_candidatos,
        criados = v_criados,
        ja_existentes = v_ja_existentes,
        bloqueados = v_bloqueados,
        erros = v_erros,
        resumo = v_resumo
    where id = v_execucao_id;
  exception when others then
    get stacked diagnostics v_sqlstate = returned_sqlstate, v_sqlerrm = message_text;
    v_erros := v_erros + 1;
    v_status := 'falha';
    v_resumo := jsonb_build_object(
      'execucao_id', v_execucao_id,
      'correlation_id', v_correlation_id,
      'regra', 'ferias_proximo_ciclo_v1',
      'origem', p_origem,
      'data_ativacao', v_data_ativacao,
      'data_referencia', p_data_referencia,
      'timezone', 'America/Sao_Paulo',
      'status', v_status,
      'candidatos', v_candidatos,
      'criados', v_criados,
      'ja_existentes', v_ja_existentes,
      'bloqueados', v_bloqueados,
      'erros', v_erros,
      'erro_fatal', jsonb_build_object(
        'sqlstate', v_sqlstate,
        'mensagem', left(v_sqlerrm, 500)
      ),
      'resultados', v_resultados
    );

    update public.df_ferias_execucoes_automaticas
    set finalizado_em = clock_timestamp(),
        status = v_status,
        candidatos = v_candidatos,
        criados = v_criados,
        ja_existentes = v_ja_existentes,
        bloqueados = v_bloqueados,
        erros = v_erros,
        resumo = v_resumo
    where id = v_execucao_id;
  end;

  return v_resumo;
end;
$$;

create or replace function public.df_ferias_gerar_proximos_ciclos_lote_interno(
  p_data_referencia date default ((now() at time zone 'America/Sao_Paulo')::date)
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.df_ferias_gerar_proximos_ciclos_lote_execucao_interno(
    p_data_referencia,
    'cron'
  );
$$;

create or replace function public.df_ferias_gerar_proximos_ciclos_lote_teste_interno(
  p_data_referencia date
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.df_ferias_gerar_proximos_ciclos_lote_execucao_interno(
    p_data_referencia,
    'manual_test'
  );
$$;

revoke all on function public.df_ferias_garantir_proximo_ciclo_interno(uuid, uuid, date, text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.df_ferias_gerar_proximos_ciclos_lote_execucao_interno(date, text)
  from public, anon, authenticated;
revoke all on function public.df_ferias_gerar_proximos_ciclos_lote_interno(date)
  from public, anon, authenticated;
revoke all on function public.df_ferias_gerar_proximos_ciclos_lote_teste_interno(date)
  from public, anon, authenticated;

comment on function public.df_ferias_garantir_proximo_ciclo_interno(uuid, uuid, date, text, uuid, text) is
  'Gera o sucessor exato no dia normal ou em catch-up posterior, sem alcançar anchors anteriores à ativação 2B-2B.';
comment on function public.df_ferias_gerar_proximos_ciclos_lote_interno(date) is
  'Executor cron diário, idempotente e com observabilidade funcional persistente.';
comment on function public.df_ferias_gerar_proximos_ciclos_lote_teste_interno(date) is
  'Executor interno de teste com a mesma regra do cron e origem manual_test.';

do $$
declare
  v_job record;
begin
  select jobid, schedule, command, active
    into v_job
  from cron.job
  where jobname = 'df-ferias-proximo-ciclo-diario'
  order by jobid desc
  limit 1;

  if not found
     or v_job.schedule <> '5 3 * * *'
     or not v_job.active
     or position('df_ferias_gerar_proximos_ciclos_lote_interno' in v_job.command) = 0
     or position('America/Sao_Paulo' in v_job.command) = 0 then
    raise exception 'CRON_FERIAS_2B2B_INCOMPATIVEL';
  end if;
end $$;

commit;
