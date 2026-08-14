begin;

do $$
begin
  if to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_auditoria_eventos') is null then
    raise exception 'ESTRUTURA_FERIAS_2B1_AUSENTE';
  end if;

  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'HELPER_AUTORIZACAO_PESSOAS_AUSENTE';
  end if;
end $$;

create or replace function public.df_funcionarios_bloquear_admissao_direta()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.data_admissao is distinct from new.data_admissao
     and current_user in ('anon', 'authenticated') then
    raise exception 'ADMISSAO_REQUER_RPC_CONTROLADA';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_funcionarios_bloquear_admissao_direta
  on public.df_funcionarios;

create trigger trg_df_funcionarios_bloquear_admissao_direta
before update of data_admissao
on public.df_funcionarios
for each row
execute function public.df_funcionarios_bloquear_admissao_direta();

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
begin
  if auth.uid() is null
     or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  select *
    into v_funcionario
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

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
      'aplicado', false,
      'somente_preflight', true,
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
      'aplicado', false,
      'no_op', true,
      'admissao_alterada', false,
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
        'aplicado', false,
        'requer_confirmacao', true,
        'motivo_obrigatorio', true,
        'admissao_alterada', true,
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

  v_correlation_id := coalesce(
    nullif(btrim(p_correlation_id), ''),
    gen_random_uuid()::text
  );

  if v_admissao_alterada then
    update public.df_funcionarios
    set data_admissao = p_nova_data_admissao
    where id = p_funcionario_id
      and empresa_id = p_empresa_id;
  end if;

  if v_elegivel_ciclo then
    v_fim_aquisitivo := (
      p_nova_data_admissao + interval '1 year' - interval '1 day'
    )::date;
    v_data_limite := (v_fim_aquisitivo + interval '1 year')::date;

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
      p_nova_data_admissao,
      v_fim_aquisitivo,
      v_data_limite,
      30,
      'pendente',
      false,
      null
    )
    returning * into v_ciclo;

    v_ciclo_criado_id := v_ciclo.id;
  end if;

  if v_admissao_alterada then
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
      auth.uid(),
      'usuario',
      'rh',
      'df_funcionarios',
      p_funcionario_id,
      'rh.funcionario.admissao_alterada',
      'info',
      'app',
      'sucesso',
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
      auth.uid(),
      'usuario',
      'rh',
      'ferias_ciclo',
      v_ciclo_criado_id,
      'rh.ferias_ciclo.derivado',
      'info',
      'app',
      'sucesso',
      null,
      null,
      to_jsonb(v_ciclo),
      jsonb_build_object(
        'funcionario_id', p_funcionario_id,
        'ciclo_id', v_ciclo_criado_id,
        'data_admissao_base', p_nova_data_admissao,
        'regra', 'ferias_2b1',
        'correlation_id', v_correlation_id
      ),
      v_correlation_id
    );
  end if;

  return jsonb_build_object(
    'aplicado', true,
    'no_op', false,
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

-- Serializa a criacao manual com a derivacao automatica do primeiro ciclo.
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

  perform 1
  from public.df_funcionarios
  where id = p_funcionario_id
    and empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

  if p_periodo_aquisitivo_fim < p_periodo_aquisitivo_inicio
     or p_data_limite_gozo < p_periodo_aquisitivo_fim then
    raise exception 'DATAS_CICLO_INVALIDAS';
  end if;

  if p_dias_direito is null or p_dias_direito <= 0 then
    raise exception 'DIAS_DIREITO_INVALIDOS';
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
    'ciclo', to_jsonb(v_ciclo),
    'resumo', public.df_ferias_resumo_ciclo_interno(v_ciclo.id, current_date)
  );
end;
$$;

revoke all on function public.alterar_admissao_funcionario_controlado(
  uuid, uuid, date, boolean, boolean, text, text
) from public;
revoke all on function public.alterar_admissao_funcionario_controlado(
  uuid, uuid, date, boolean, boolean, text, text
) from anon;
grant execute on function public.alterar_admissao_funcionario_controlado(
  uuid, uuid, date, boolean, boolean, text, text
) to authenticated;

revoke all on function public.df_funcionarios_bloquear_admissao_direta() from public;
revoke all on function public.df_funcionarios_bloquear_admissao_direta() from anon;
revoke all on function public.df_funcionarios_bloquear_admissao_direta() from authenticated;

do $$
begin
  if has_function_privilege(
    'anon',
    'public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)',
    'EXECUTE'
  ) then
    raise exception 'ANON_NAO_PODE_EXECUTAR_ADMISSAO_CONTROLADA';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.alterar_admissao_funcionario_controlado(uuid,uuid,date,boolean,boolean,text,text)',
    'EXECUTE'
  ) then
    raise exception 'AUTHENTICATED_SEM_EXECUCAO_ADMISSAO_CONTROLADA';
  end if;
end $$;

commit;
