begin;

do $validation$
begin
  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;
  if to_regclass('public.df_contas_recorrentes') is null then
    raise exception 'Missing table public.df_contas_recorrentes';
  end if;
  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;
  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;
  if to_regprocedure('public.df_usuario_tem_perfil_empresa(uuid,text[])') is null then
    raise exception 'Missing helper public.df_usuario_tem_perfil_empresa(uuid,text[])';
  end if;
  if to_regclass('public.uq_df_contas_recorrencia_vencimento_ativas') is null then
    raise exception 'Missing protected index public.uq_df_contas_recorrencia_vencimento_ativas';
  end if;
end;
$validation$;

create or replace function public.proteger_df_contas_recorrencia_id_insert()
returns trigger
language plpgsql
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if new.recorrencia_id is null then
    return new;
  end if;

  if current_setting('dna.recorrencia_insert_autorizado', true)
      in ('controlado', 'automatico') then
    return new;
  end if;

  if (select auth.uid()) is null then
    raise exception using
      errcode = '42501',
      message = 'Autenticacao obrigatoria para inserir conta recorrente.';
  end if;

  if not (
    (select public.is_master())
    or public.df_usuario_eh_admin(new.empresa_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Somente Admin ou Master pode inserir conta com recorrencia_id diretamente.';
  end if;

  return new;
end;
$function$;

revoke all on function public.proteger_df_contas_recorrencia_id_insert()
from public, anon, authenticated;

drop trigger if exists proteger_df_contas_recorrencia_id_insert
on public.df_contas;

create trigger proteger_df_contas_recorrencia_id_insert
before insert
on public.df_contas
for each row
execute function public.proteger_df_contas_recorrencia_id_insert();

comment on function public.proteger_df_contas_recorrencia_id_insert() is
'Bloqueia INSERT direto com recorrencia_id para perfis diferentes de Admin/Master; RPCs validadas liberam somente a operacao corrente.';

create or replace function public.gerar_ocorrencia_recorrente_controlada(
  p_empresa_id uuid,
  p_recorrencia_id uuid,
  p_data_vencimento date,
  p_competencia date default null,
  p_imposto_tipo text default null,
  p_enviar_whatsapp boolean default false,
  p_enviar_email boolean default false,
  p_enviar_push boolean default false,
  p_dias_aviso integer default 1
)
returns jsonb
language plpgsql
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_serie public.df_contas_recorrentes%rowtype;
  v_conta public.df_contas%rowtype;
  v_ultimo_dia integer;
  v_dia_esperado integer;
begin
  if (select auth.uid()) is null then
    raise exception using
      errcode = '42501',
      message = 'Autenticacao obrigatoria para gerar ocorrencia recorrente.';
  end if;

  if not (
    (select public.is_master())
    or public.df_usuario_eh_admin(p_empresa_id)
  ) then
    raise exception using
      errcode = '42501',
      message = 'Somente Admin ou Master pode gerar ocorrencia recorrente.';
  end if;

  select r.*
    into v_serie
  from public.df_contas_recorrentes r
  where r.id = p_recorrencia_id
    and r.empresa_id = p_empresa_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Recorrencia inexistente ou de outra empresa.';
  end if;
  if coalesce(v_serie.ativo, false) is not true then
    raise exception using
      errcode = '22023',
      message = 'Recorrencia inativa.';
  end if;
  if lower(coalesce(v_serie.tipo_recorrencia, 'mensal')) <> 'mensal' then
    raise exception using
      errcode = '22023',
      message = 'Somente recorrencias mensais podem ser geradas.';
  end if;
  if v_serie.descricao is null or v_serie.valor is null
      or v_serie.dia_vencimento is null or p_data_vencimento is null then
    raise exception using
      errcode = '22023',
      message = 'Recorrencia sem dados obrigatorios.';
  end if;
  if v_serie.data_inicio is not null and p_data_vencimento < v_serie.data_inicio then
    raise exception using
      errcode = '22023',
      message = 'Vencimento anterior ao inicio da recorrencia.';
  end if;
  if v_serie.centro_custo_id is not null and not exists (
    select 1
    from public.df_centros_custo cc
    where cc.id = v_serie.centro_custo_id
      and cc.empresa_id = p_empresa_id
  ) then
    raise exception using
      errcode = '22023',
      message = 'Centro de custo da recorrencia nao pertence a empresa.';
  end if;
  if v_serie.filial_id is not null and not exists (
    select 1
    from public.df_filiais f
    where f.id = v_serie.filial_id
      and f.empresa_id = p_empresa_id
      and coalesce(f.ativo, false) = true
  ) then
    raise exception using
      errcode = '22023',
      message = 'Filial da recorrencia nao pertence a empresa ou esta inativa.';
  end if;

  v_ultimo_dia := extract(day from (
    date_trunc('month', p_data_vencimento)::date
      + interval '1 month - 1 day'
  ))::integer;
  v_dia_esperado := least(v_serie.dia_vencimento, v_ultimo_dia);
  if extract(day from p_data_vencimento)::integer <> v_dia_esperado then
    raise exception using
      errcode = '22023',
      message = 'Vencimento incompatível com a recorrencia.';
  end if;

  select c.*
    into v_conta
  from public.df_contas c
  where c.empresa_id = p_empresa_id
    and c.recorrencia_id = p_recorrencia_id
    and c.data_vencimento = p_data_vencimento
    and coalesce(c.excluido, false) = false
    and coalesce(c.deletado, false) = false
  order by c.id
  limit 1;

  if found then
    return jsonb_build_object(
      'conta', to_jsonb(v_conta),
      'criada', false,
      'idempotente', true
    );
  end if;

  perform set_config('dna.recorrencia_insert_autorizado', 'controlado', true);

  insert into public.df_contas (
    empresa_id,
    descricao,
    valor,
    data_vencimento,
    vencimento,
    centro_custo_id,
    filial_id,
    observacao,
    recorrencia_id,
    imposto_tipo,
    competencia,
    status,
    excluido,
    enviar_whatsapp,
    enviar_email,
    enviar_push,
    dias_aviso
  )
  values (
    p_empresa_id,
    v_serie.descricao,
    v_serie.valor,
    p_data_vencimento,
    p_data_vencimento,
    v_serie.centro_custo_id,
    v_serie.filial_id,
    null,
    v_serie.id,
    p_imposto_tipo,
    p_competencia,
    'pendente',
    false,
    coalesce(p_enviar_whatsapp, false),
    coalesce(p_enviar_email, false),
    coalesce(p_enviar_push, false),
    greatest(coalesce(p_dias_aviso, 1), 1)
  )
  on conflict (recorrencia_id, data_vencimento)
    where recorrencia_id is not null
      and coalesce(excluido, false) = false
      and coalesce(deletado, false) = false
  do nothing
  returning * into v_conta;

  if found then
    return jsonb_build_object(
      'conta', to_jsonb(v_conta),
      'criada', true,
      'idempotente', false
    );
  end if;

  select c.*
    into v_conta
  from public.df_contas c
  where c.empresa_id = p_empresa_id
    and c.recorrencia_id = p_recorrencia_id
    and c.data_vencimento = p_data_vencimento
    and coalesce(c.excluido, false) = false
    and coalesce(c.deletado, false) = false
  order by c.id
  limit 1;

  if found then
    return jsonb_build_object(
      'conta', to_jsonb(v_conta),
      'criada', false,
      'idempotente', true
    );
  end if;

  raise exception using
    errcode = '23505',
    message = 'Conflito ao gerar ocorrencia recorrente.',
    constraint = 'uq_df_contas_recorrencia_vencimento_ativas';
end;
$function$;

revoke all on function public.gerar_ocorrencia_recorrente_controlada(
  uuid, uuid, date, date, text, boolean, boolean, boolean, integer
) from public, anon;
grant execute on function public.gerar_ocorrencia_recorrente_controlada(
  uuid, uuid, date, date, text, boolean, boolean, boolean, integer
) to authenticated;

comment on function public.gerar_ocorrencia_recorrente_controlada(
  uuid, uuid, date, date, text, boolean, boolean, boolean, integer
) is
'Gera exatamente uma ocorrencia faltante, com revalidacao Admin/Master e idempotencia pelo indice protegido.';

create or replace function public.gerar_ocorrencias_recorrentes_automaticas(
  p_empresa_id uuid,
  p_ocorrencias jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_item jsonb;
  v_serie public.df_contas_recorrentes%rowtype;
  v_conta public.df_contas%rowtype;
  v_recorrencia_id uuid;
  v_data_vencimento date;
  v_competencia date;
  v_imposto_tipo text;
  v_ultimo_dia integer;
  v_dia_esperado integer;
  v_inicio_horizonte date;
  v_fim_horizonte date;
  v_criadas jsonb := '[]'::jsonb;
  v_ja_existentes jsonb := '[]'::jsonb;
begin
  if (select auth.uid()) is null then
    raise exception using
      errcode = '42501',
      message = 'Autenticacao obrigatoria para planejamento recorrente.';
  end if;

  if not (
    (select public.is_master())
    or public.df_usuario_eh_admin(p_empresa_id)
    or public.df_usuario_tem_perfil_empresa(
      p_empresa_id,
      array['gerente', 'master', 'owner', 'superadmin', 'super_admin']
    )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Perfil sem permissao para planejamento recorrente.';
  end if;

  if p_ocorrencias is null or jsonb_typeof(p_ocorrencias) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'Ocorrencias devem ser enviadas como array.';
  end if;
  if jsonb_array_length(p_ocorrencias) > 500 then
    raise exception using
      errcode = '22023',
      message = 'Limite de 500 ocorrencias por operacao.';
  end if;

  v_inicio_horizonte := date_trunc('month', current_date)::date;
  v_fim_horizonte := (
    date_trunc('month', current_date + 90)::date
      + interval '1 month - 1 day'
  )::date;

  perform set_config('dna.recorrencia_insert_autorizado', 'automatico', true);

  for v_item in
    select value
    from jsonb_array_elements(p_ocorrencias)
    order by value ->> 'recorrencia_id', value ->> 'data_vencimento'
  loop
    v_recorrencia_id := nullif(v_item ->> 'recorrencia_id', '')::uuid;
    v_data_vencimento := nullif(v_item ->> 'data_vencimento', '')::date;
    v_competencia := nullif(v_item ->> 'competencia', '')::date;
    v_imposto_tipo := nullif(v_item ->> 'imposto_tipo', '');

    select r.*
      into v_serie
    from public.df_contas_recorrentes r
    where r.id = v_recorrencia_id
      and r.empresa_id = p_empresa_id
    for update;

    if not found or coalesce(v_serie.ativo, false) is not true
        or lower(coalesce(v_serie.tipo_recorrencia, 'mensal')) <> 'mensal' then
      raise exception using
        errcode = '22023',
        message = 'Recorrencia automatica invalida ou inativa.';
    end if;
    if v_serie.descricao is null or v_serie.valor is null
        or v_serie.dia_vencimento is null or v_data_vencimento is null then
      raise exception using
        errcode = '22023',
        message = 'Recorrencia automatica sem dados obrigatorios.';
    end if;
    if v_data_vencimento < v_inicio_horizonte
        or v_data_vencimento > v_fim_horizonte
        or (v_serie.data_inicio is not null and v_data_vencimento < v_serie.data_inicio) then
      raise exception using
        errcode = '22023',
        message = 'Vencimento fora do horizonte automatico autorizado.';
    end if;
    if v_serie.centro_custo_id is not null and not exists (
      select 1
      from public.df_centros_custo cc
      where cc.id = v_serie.centro_custo_id
        and cc.empresa_id = p_empresa_id
    ) then
      raise exception using
        errcode = '22023',
        message = 'Centro de custo da recorrencia automatica nao pertence a empresa.';
    end if;
    if v_serie.filial_id is not null and not exists (
      select 1
      from public.df_filiais f
      where f.id = v_serie.filial_id
        and f.empresa_id = p_empresa_id
        and coalesce(f.ativo, false) = true
    ) then
      raise exception using
        errcode = '22023',
        message = 'Filial da recorrencia automatica nao pertence a empresa ou esta inativa.';
    end if;

    v_ultimo_dia := extract(day from (
      date_trunc('month', v_data_vencimento)::date
        + interval '1 month - 1 day'
    ))::integer;
    v_dia_esperado := least(v_serie.dia_vencimento, v_ultimo_dia);
    if extract(day from v_data_vencimento)::integer <> v_dia_esperado then
      raise exception using
        errcode = '22023',
        message = 'Vencimento automatico incompatível com a recorrencia.';
    end if;

    insert into public.df_contas (
      empresa_id,
      descricao,
      valor,
      data_vencimento,
      vencimento,
      centro_custo_id,
      filial_id,
      observacao,
      recorrencia_id,
      imposto_tipo,
      competencia,
      status,
      excluido,
      enviar_whatsapp,
      enviar_email,
      enviar_push,
      dias_aviso
    )
    values (
      p_empresa_id,
      v_serie.descricao,
      v_serie.valor,
      v_data_vencimento,
      v_data_vencimento,
      v_serie.centro_custo_id,
      v_serie.filial_id,
      null,
      v_serie.id,
      v_imposto_tipo,
      v_competencia,
      'pendente',
      false,
      coalesce((v_item ->> 'enviar_whatsapp')::boolean, false),
      coalesce((v_item ->> 'enviar_email')::boolean, false),
      coalesce((v_item ->> 'enviar_push')::boolean, false),
      greatest(coalesce((v_item ->> 'dias_aviso')::integer, 1), 1)
    )
    on conflict (recorrencia_id, data_vencimento)
      where recorrencia_id is not null
        and coalesce(excluido, false) = false
        and coalesce(deletado, false) = false
    do nothing
    returning * into v_conta;

    if found then
      v_criadas := v_criadas || jsonb_build_array(to_jsonb(v_conta));
    else
      select c.*
        into v_conta
      from public.df_contas c
      where c.empresa_id = p_empresa_id
        and c.recorrencia_id = v_recorrencia_id
        and c.data_vencimento = v_data_vencimento
        and coalesce(c.excluido, false) = false
        and coalesce(c.deletado, false) = false
      order by c.id
      limit 1;

      if not found then
        raise exception using
          errcode = '23505',
          message = 'Conflito ao reconciliar planejamento recorrente.',
          constraint = 'uq_df_contas_recorrencia_vencimento_ativas';
      end if;
      v_ja_existentes := v_ja_existentes || jsonb_build_array(to_jsonb(v_conta));
    end if;
  end loop;

  return jsonb_build_object(
    'contas', v_criadas,
    'ja_existentes', v_ja_existentes
  );
end;
$function$;

revoke all on function public.gerar_ocorrencias_recorrentes_automaticas(
  uuid, jsonb
) from public, anon;
grant execute on function public.gerar_ocorrencias_recorrentes_automaticas(
  uuid, jsonb
) to authenticated;

comment on function public.gerar_ocorrencias_recorrentes_automaticas(
  uuid, jsonb
) is
'Preserva o planejamento automatico existente em RPC estrita, limitado ao tenant, series ativas e horizonte vigente.';

commit;
