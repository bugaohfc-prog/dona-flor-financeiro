begin;

do $$
begin
  if to_regclass('public.df_funcionarios_ferias_ciclos') is null
     or to_regclass('public.df_funcionarios_ferias_periodos') is null
     or to_regclass('public.df_auditoria_eventos') is null then
    raise exception 'Estrutura obrigatoria de ferias ou auditoria nao encontrada.';
  end if;
  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'Helper de autorizacao de Pessoas nao encontrado.';
  end if;
  if exists (
    select 1
    from public.df_funcionarios_ferias_ciclos
    where not arquivado and status <> 'cancelada'
    group by empresa_id, funcionario_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim
    having count(*) > 1
  ) then raise exception 'PREFLIGHT_CICLOS_DUPLICADOS'; end if;
  if exists (
    select 1
    from public.df_funcionarios_ferias_periodos
    where not arquivado and status <> 'cancelada'
    group by ciclo_ferias_id, numero_parcela
    having count(*) > 1
  ) then raise exception 'PREFLIGHT_PARCELAS_DUPLICADAS'; end if;
  if exists (
    select 1
    from public.df_funcionarios_ferias_periodos p1
    join public.df_funcionarios_ferias_periodos p2
      on p1.id < p2.id
     and p1.empresa_id = p2.empresa_id
     and p1.funcionario_id = p2.funcionario_id
     and daterange(p1.data_inicio, p1.data_retorno_trabalho, '[)') &&
         daterange(p2.data_inicio, p2.data_retorno_trabalho, '[)')
    where not p1.arquivado and p1.status <> 'cancelada'
      and not p2.arquivado and p2.status <> 'cancelada'
  ) then raise exception 'PREFLIGHT_PERIODOS_SOBREPOSTOS'; end if;
  if exists (
    select 1
    from public.df_funcionarios_ferias_ciclos c
    left join public.df_funcionarios_ferias_periodos p
      on p.ciclo_ferias_id = c.id and p.empresa_id = c.empresa_id
    group by c.id, c.dias_direito
    having coalesce(sum(p.quantidade_dias) filter (
      where not p.arquivado and p.status <> 'cancelada'
    ), 0) > c.dias_direito
  ) then raise exception 'PREFLIGHT_SALDO_EXCEDIDO'; end if;
end $$;

create extension if not exists btree_gist with schema extensions;

create unique index if not exists uq_df_ferias_ciclo_ativo_periodo
on public.df_funcionarios_ferias_ciclos (
  empresa_id, funcionario_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim
)
where not arquivado and status <> 'cancelada';

create unique index if not exists uq_df_ferias_periodo_parcela_ativa
on public.df_funcionarios_ferias_periodos (ciclo_ferias_id, numero_parcela)
where not arquivado and status <> 'cancelada';

alter table public.df_funcionarios_ferias_periodos
  drop constraint if exists df_funcionarios_ferias_periodos_sem_sobreposicao;

set local search_path = public, extensions, pg_catalog;

alter table public.df_funcionarios_ferias_periodos
  add constraint df_funcionarios_ferias_periodos_sem_sobreposicao
  exclude using gist (
    empresa_id with =,
    funcionario_id with =,
    daterange(data_inicio, data_retorno_trabalho, '[)') with &&
  )
  where (not arquivado and status <> 'cancelada');

reset search_path;

create or replace function public.df_ferias_resumo_ciclo_interno(
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
  v_programados integer := 0;
  v_em_gozo integer := 0;
  v_gozados integer := 0;
  v_parcelas integer := 0;
  v_proxima integer;
  v_saldo_livre integer;
  v_saldo_nao_gozado integer;
  v_status text;
begin
  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where id = p_ciclo_id;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;

  select
    coalesce(sum(quantidade_dias) filter (
      where status <> 'concluida' and data_inicio > p_data_referencia
    ), 0)::integer,
    coalesce(sum(quantidade_dias) filter (
      where status <> 'concluida'
        and data_inicio <= p_data_referencia
        and data_retorno_trabalho > p_data_referencia
    ), 0)::integer,
    coalesce(sum(quantidade_dias) filter (
      where status = 'concluida' or data_retorno_trabalho <= p_data_referencia
    ), 0)::integer,
    count(*)::integer
  into v_programados, v_em_gozo, v_gozados, v_parcelas
  from public.df_funcionarios_ferias_periodos
  where ciclo_ferias_id = p_ciclo_id
    and not arquivado
    and status <> 'cancelada';

  select numero into v_proxima
  from generate_series(1, 3) numero
  where not exists (
    select 1 from public.df_funcionarios_ferias_periodos p
    where p.ciclo_ferias_id = p_ciclo_id
      and p.numero_parcela = numero
      and not p.arquivado
      and p.status <> 'cancelada'
  )
  order by numero limit 1;

  v_saldo_livre := greatest(v_ciclo.dias_direito - v_programados - v_em_gozo - v_gozados, 0);
  v_saldo_nao_gozado := greatest(v_ciclo.dias_direito - v_gozados, 0);

  v_status := case
    when v_ciclo.arquivado then 'arquivada'
    when v_ciclo.status = 'cancelada' then 'cancelada'
    when p_data_referencia <= v_ciclo.periodo_aquisitivo_fim then 'em_aquisicao'
    when v_saldo_nao_gozado = 0 then 'concluida'
    when v_em_gozo > 0 then 'em_gozo'
    when v_ciclo.data_limite_gozo < p_data_referencia then 'vencida'
    when v_saldo_livre = 0 and v_programados > 0 then 'programada'
    when v_programados + v_em_gozo + v_gozados > 0 then 'parcial'
    else 'disponivel'
  end;

  return jsonb_build_object(
    'diasDireito', v_ciclo.dias_direito,
    'diasProgramados', v_programados,
    'diasEmGozo', v_em_gozo,
    'diasGozados', v_gozados,
    'saldoLivreParaProgramar', v_saldo_livre,
    'saldoAindaNaoGozado', v_saldo_nao_gozado,
    'quantidadeParcelas', v_parcelas,
    'proximaParcela', v_proxima,
    'statusOperacional', v_status
  );
end;
$$;

create or replace function public.df_ferias_atualizar_status_cache_interno(p_ciclo_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_resumo jsonb;
  v_status text;
begin
  v_resumo := public.df_ferias_resumo_ciclo_interno(p_ciclo_id, current_date);
  v_status := case v_resumo ->> 'statusOperacional'
    when 'programada' then 'agendada'
    when 'em_gozo' then 'parcial'
    when 'parcial' then 'parcial'
    when 'concluida' then 'concluida'
    when 'vencida' then 'vencida'
    when 'cancelada' then 'cancelada'
    else 'pendente'
  end;
  update public.df_funcionarios_ferias_ciclos
  set status = v_status
  where id = p_ciclo_id and not arquivado;
end;
$$;

create or replace function public.df_ferias_auditar_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_ciclo_id uuid,
  p_periodo_id uuid,
  p_acao text,
  p_antes jsonb,
  p_depois jsonb,
  p_motivo text default null
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois, metadados
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh',
    case when p_periodo_id is null then 'ferias_ciclo' else 'ferias_periodo' end,
    coalesce(p_periodo_id, p_ciclo_id), p_acao, 'info', 'app', 'sucesso',
    nullif(btrim(p_motivo), ''), p_antes, p_depois,
    jsonb_build_object('funcionario_id', p_funcionario_id, 'ciclo_id', p_ciclo_id)
  );
end;
$$;

create or replace function public.df_ferias_validar_periodo_interno(
  p_ciclo_id uuid,
  p_periodo_ignorado_id uuid,
  p_data_inicio date,
  p_quantidade_dias integer,
  p_numero_parcela integer
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_data_fim date;
  v_data_retorno date;
  v_reservados integer;
  v_quantidade integer;
begin
  select * into v_ciclo
  from public.df_funcionarios_ferias_ciclos
  where id = p_ciclo_id
  for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  if v_ciclo.arquivado or v_ciclo.status = 'cancelada' then raise exception 'CICLO_INATIVO'; end if;
  if p_quantidade_dias is null or p_quantidade_dias <= 0 then raise exception 'QUANTIDADE_DIAS_INVALIDA'; end if;
  if p_numero_parcela is null or p_numero_parcela not between 1 and 3 then raise exception 'PARCELA_INVALIDA'; end if;

  v_data_fim := p_data_inicio + (p_quantidade_dias - 1);
  v_data_retorno := v_data_fim + 1;

  select coalesce(sum(quantidade_dias), 0)::integer, count(*)::integer
  into v_reservados, v_quantidade
  from public.df_funcionarios_ferias_periodos
  where ciclo_ferias_id = p_ciclo_id
    and id is distinct from p_periodo_ignorado_id
    and not arquivado
    and status <> 'cancelada';

  if v_quantidade >= 3 then raise exception 'LIMITE_TRES_PARCELAS'; end if;
  if v_reservados + p_quantidade_dias > v_ciclo.dias_direito then raise exception 'SALDO_FERIAS_INSUFICIENTE'; end if;
  if exists (
    select 1 from public.df_funcionarios_ferias_periodos p
    where p.empresa_id = v_ciclo.empresa_id
      and p.funcionario_id = v_ciclo.funcionario_id
      and p.id is distinct from p_periodo_ignorado_id
      and not p.arquivado
      and p.status <> 'cancelada'
      and daterange(p.data_inicio, p.data_retorno_trabalho, '[)') &&
          daterange(p_data_inicio, v_data_retorno, '[)')
  ) then raise exception 'PERIODO_FERIAS_SOBREPOSTO'; end if;
  if exists (
    select 1 from public.df_funcionarios_ferias_periodos p
    where p.ciclo_ferias_id = p_ciclo_id
      and p.numero_parcela = p_numero_parcela
      and p.id is distinct from p_periodo_ignorado_id
      and not p.arquivado
      and p.status <> 'cancelada'
  ) then raise exception 'PARCELA_FERIAS_DUPLICADA'; end if;

  return jsonb_build_object('data_fim', v_data_fim, 'data_retorno', v_data_retorno);
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
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if not exists (select 1 from public.df_funcionarios where id=p_funcionario_id and empresa_id=p_empresa_id) then raise exception 'FUNCIONARIO_NAO_ENCONTRADO'; end if;
  if p_periodo_aquisitivo_fim < p_periodo_aquisitivo_inicio or p_data_limite_gozo < p_periodo_aquisitivo_fim then raise exception 'DATAS_CICLO_INVALIDAS'; end if;
  if p_dias_direito is null or p_dias_direito <= 0 then raise exception 'DIAS_DIREITO_INVALIDOS'; end if;
  insert into public.df_funcionarios_ferias_ciclos (
    empresa_id, funcionario_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim,
    data_limite_gozo, dias_direito, status, arquivado
  ) values (
    p_empresa_id, p_funcionario_id, p_periodo_aquisitivo_inicio, p_periodo_aquisitivo_fim,
    p_data_limite_gozo, p_dias_direito, 'pendente', false
  ) returning * into v_ciclo;
  perform public.df_ferias_atualizar_status_cache_interno(v_ciclo.id);
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=v_ciclo.id;
  perform public.df_ferias_auditar_interno(p_empresa_id,p_funcionario_id,v_ciclo.id,null,'rh.ferias_ciclo.criado',null,to_jsonb(v_ciclo),null);
  return jsonb_build_object('ciclo',to_jsonb(v_ciclo),'resumo',public.df_ferias_resumo_ciclo_interno(v_ciclo.id,current_date));
end;
$$;

create or replace function public.ajustar_dias_ciclo_ferias_controlado(
  p_empresa_id uuid, p_ciclo_id uuid, p_dias_direito integer, p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_antes jsonb;
  v_reservados integer;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if length(btrim(coalesce(p_motivo,''))) < 5 then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  select coalesce(sum(quantidade_dias),0)::integer into v_reservados
  from public.df_funcionarios_ferias_periodos
  where ciclo_ferias_id=p_ciclo_id and not arquivado and status <> 'cancelada';
  if p_dias_direito is null or p_dias_direito < greatest(v_reservados,1) then raise exception 'DIAS_DIREITO_MENORES_QUE_RESERVA'; end if;
  v_antes := to_jsonb(v_ciclo);
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
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_ciclo public.df_funcionarios_ferias_ciclos%rowtype; v_antes jsonb;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if p_acao not in ('arquivar','reativar','cancelar') then raise exception 'ACAO_INVALIDA'; end if;
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  v_antes := to_jsonb(v_ciclo);
  if p_acao='arquivar' then
    update public.df_funcionarios_ferias_ciclos set arquivado=true,arquivado_em=now() where id=p_ciclo_id returning * into v_ciclo;
  elsif p_acao='cancelar' then
    update public.df_funcionarios_ferias_ciclos set status='cancelada',arquivado=false,arquivado_em=null where id=p_ciclo_id returning * into v_ciclo;
  else
    update public.df_funcionarios_ferias_ciclos set arquivado=false,arquivado_em=null,status=case when status='cancelada' then 'pendente' else status end where id=p_ciclo_id returning * into v_ciclo;
    perform public.df_ferias_atualizar_status_cache_interno(p_ciclo_id);
    select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id;
  end if;
  perform public.df_ferias_auditar_interno(p_empresa_id,v_ciclo.funcionario_id,p_ciclo_id,null,'rh.ferias_ciclo.'||p_acao,v_antes,to_jsonb(v_ciclo),null);
  return jsonb_build_object('ciclo',to_jsonb(v_ciclo),'resumo',public.df_ferias_resumo_ciclo_interno(p_ciclo_id,current_date));
end;
$$;

create or replace function public.criar_periodo_ferias_controlado(
  p_empresa_id uuid, p_ciclo_id uuid, p_data_inicio date, p_quantidade_dias integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ciclo public.df_funcionarios_ferias_ciclos%rowtype;
  v_periodo public.df_funcionarios_ferias_periodos%rowtype;
  v_datas jsonb;
  v_parcela integer;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select * into v_ciclo from public.df_funcionarios_ferias_ciclos where id=p_ciclo_id and empresa_id=p_empresa_id for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  select numero into v_parcela from generate_series(1,3) numero
  where not exists (select 1 from public.df_funcionarios_ferias_periodos p where p.ciclo_ferias_id=p_ciclo_id and p.numero_parcela=numero and not p.arquivado and p.status <> 'cancelada')
  order by numero limit 1;
  if v_parcela is null then raise exception 'LIMITE_TRES_PARCELAS'; end if;
  v_datas := public.df_ferias_validar_periodo_interno(p_ciclo_id,null,p_data_inicio,p_quantidade_dias,v_parcela);
  insert into public.df_funcionarios_ferias_periodos (
    empresa_id,ciclo_ferias_id,funcionario_id,data_inicio,quantidade_dias,
    data_fim_calculada,data_retorno_trabalho,numero_parcela,status,arquivado
  ) values (
    p_empresa_id,p_ciclo_id,v_ciclo.funcionario_id,p_data_inicio,p_quantidade_dias,
    (v_datas->>'data_fim')::date,(v_datas->>'data_retorno')::date,v_parcela,'agendada',false
  ) returning * into v_periodo;
  perform public.df_ferias_atualizar_status_cache_interno(p_ciclo_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_ciclo.funcionario_id,p_ciclo_id,v_periodo.id,'rh.ferias_periodo.criado',null,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(p_ciclo_id,current_date));
end;
$$;

create or replace function public.atualizar_periodo_ferias_controlado(
  p_empresa_id uuid, p_periodo_id uuid, p_data_inicio date, p_quantidade_dias integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_periodo public.df_funcionarios_ferias_periodos%rowtype;
  v_ciclo_id uuid;
  v_antes jsonb;
  v_datas jsonb;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  select ciclo_ferias_id into v_ciclo_id from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  perform 1 from public.df_funcionarios_ferias_ciclos where id=v_ciclo_id and empresa_id=p_empresa_id for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  select * into v_periodo from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id and ciclo_ferias_id=v_ciclo_id for update;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  if v_periodo.arquivado or v_periodo.status='cancelada' then raise exception 'PERIODO_INATIVO'; end if;
  v_antes := to_jsonb(v_periodo);
  v_datas := public.df_ferias_validar_periodo_interno(v_periodo.ciclo_ferias_id,p_periodo_id,p_data_inicio,p_quantidade_dias,v_periodo.numero_parcela);
  update public.df_funcionarios_ferias_periodos set
    data_inicio=p_data_inicio,quantidade_dias=p_quantidade_dias,
    data_fim_calculada=(v_datas->>'data_fim')::date,
    data_retorno_trabalho=(v_datas->>'data_retorno')::date
  where id=p_periodo_id returning * into v_periodo;
  perform public.df_ferias_atualizar_status_cache_interno(v_periodo.ciclo_ferias_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_periodo.funcionario_id,v_periodo.ciclo_ferias_id,v_periodo.id,'rh.ferias_periodo.atualizado',v_antes,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(v_periodo.ciclo_ferias_id,current_date));
end;
$$;

create or replace function public.alterar_estado_periodo_ferias_controlado(
  p_empresa_id uuid, p_periodo_id uuid, p_acao text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_periodo public.df_funcionarios_ferias_periodos%rowtype;
  v_ciclo_id uuid;
  v_antes jsonb;
  v_datas jsonb;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if p_acao not in ('cancelar','arquivar','reativar') then raise exception 'ACAO_INVALIDA'; end if;
  select ciclo_ferias_id into v_ciclo_id from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  perform 1 from public.df_funcionarios_ferias_ciclos where id=v_ciclo_id and empresa_id=p_empresa_id for update;
  if not found then raise exception 'CICLO_NAO_ENCONTRADO'; end if;
  select * into v_periodo from public.df_funcionarios_ferias_periodos where id=p_periodo_id and empresa_id=p_empresa_id and ciclo_ferias_id=v_ciclo_id for update;
  if not found then raise exception 'PERIODO_NAO_ENCONTRADO'; end if;
  v_antes := to_jsonb(v_periodo);
  if p_acao='cancelar' then
    update public.df_funcionarios_ferias_periodos set status='cancelada',arquivado=false,arquivado_em=null where id=p_periodo_id returning * into v_periodo;
  elsif p_acao='arquivar' then
    update public.df_funcionarios_ferias_periodos set arquivado=true,arquivado_em=now() where id=p_periodo_id returning * into v_periodo;
  else
    v_datas := public.df_ferias_validar_periodo_interno(v_periodo.ciclo_ferias_id,p_periodo_id,v_periodo.data_inicio,v_periodo.quantidade_dias,v_periodo.numero_parcela);
    update public.df_funcionarios_ferias_periodos set arquivado=false,arquivado_em=null,status=case when status='cancelada' then 'agendada' else status end where id=p_periodo_id returning * into v_periodo;
  end if;
  perform public.df_ferias_atualizar_status_cache_interno(v_periodo.ciclo_ferias_id);
  perform public.df_ferias_auditar_interno(p_empresa_id,v_periodo.funcionario_id,v_periodo.ciclo_ferias_id,v_periodo.id,'rh.ferias_periodo.'||p_acao,v_antes,to_jsonb(v_periodo),null);
  return jsonb_build_object('periodo',to_jsonb(v_periodo),'resumo',public.df_ferias_resumo_ciclo_interno(v_periodo.ciclo_ferias_id,current_date));
end;
$$;

revoke all on public.df_funcionarios_ferias_ciclos from public, anon, authenticated;
revoke all on public.df_funcionarios_ferias_periodos from public, anon, authenticated;
grant select on public.df_funcionarios_ferias_ciclos to authenticated;
grant select on public.df_funcionarios_ferias_periodos to authenticated;

drop policy if exists "df_funcionarios_ferias_ciclos_insert_admin_master" on public.df_funcionarios_ferias_ciclos;
drop policy if exists "df_funcionarios_ferias_ciclos_update_admin_master" on public.df_funcionarios_ferias_ciclos;
drop policy if exists "df_funcionarios_ferias_periodos_insert_admin_master" on public.df_funcionarios_ferias_periodos;
drop policy if exists "df_funcionarios_ferias_periodos_update_admin_master" on public.df_funcionarios_ferias_periodos;

revoke all on function public.df_ferias_resumo_ciclo_interno(uuid,date) from public, anon, authenticated;
revoke all on function public.df_ferias_atualizar_status_cache_interno(uuid) from public, anon, authenticated;
revoke all on function public.df_ferias_auditar_interno(uuid,uuid,uuid,uuid,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function public.df_ferias_validar_periodo_interno(uuid,uuid,date,integer,integer) from public, anon, authenticated;

revoke all on function public.criar_ciclo_ferias_controlado(uuid,uuid,date,date,date,integer) from public, anon;
revoke all on function public.ajustar_dias_ciclo_ferias_controlado(uuid,uuid,integer,text) from public, anon;
revoke all on function public.alterar_estado_ciclo_ferias_controlado(uuid,uuid,text) from public, anon;
revoke all on function public.criar_periodo_ferias_controlado(uuid,uuid,date,integer) from public, anon;
revoke all on function public.atualizar_periodo_ferias_controlado(uuid,uuid,date,integer) from public, anon;
revoke all on function public.alterar_estado_periodo_ferias_controlado(uuid,uuid,text) from public, anon;
grant execute on function public.criar_ciclo_ferias_controlado(uuid,uuid,date,date,date,integer) to authenticated;
grant execute on function public.ajustar_dias_ciclo_ferias_controlado(uuid,uuid,integer,text) to authenticated;
grant execute on function public.alterar_estado_ciclo_ferias_controlado(uuid,uuid,text) to authenticated;
grant execute on function public.criar_periodo_ferias_controlado(uuid,uuid,date,integer) to authenticated;
grant execute on function public.atualizar_periodo_ferias_controlado(uuid,uuid,date,integer) to authenticated;
grant execute on function public.alterar_estado_periodo_ferias_controlado(uuid,uuid,text) to authenticated;

do $$
declare v_grants text; v_policies text;
begin
  select string_agg(table_name||':'||grantee||':'||privilege_type,', ' order by 1)
  into v_grants from information_schema.role_table_grants
  where table_schema='public'
    and table_name in ('df_funcionarios_ferias_ciclos','df_funcionarios_ferias_periodos')
    and grantee in ('anon','authenticated')
    and privilege_type <> 'SELECT';
  if v_grants is not null then raise exception 'GRANTS_DIRETOS_INESPERADOS: %',v_grants; end if;
  select string_agg(tablename||':'||policyname||':'||cmd,', ' order by 1)
  into v_policies from pg_policies
  where schemaname='public'
    and tablename in ('df_funcionarios_ferias_ciclos','df_funcionarios_ferias_periodos')
    and cmd <> 'SELECT';
  if v_policies is not null then raise exception 'POLICIES_ESCRITA_INESPERADAS: %',v_policies; end if;
end $$;

commit;
