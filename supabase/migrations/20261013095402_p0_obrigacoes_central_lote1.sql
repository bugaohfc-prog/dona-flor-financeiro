-- DNA Gestao - P0 Lote 1
-- Nucleo minimo de obrigacoes operacionais com desligamento como primeiro consumidor.
--
-- Rollback de referencia (nao executar automaticamente):
-- 1. Restaurar as definicoes anteriores de abrir_desligamento_funcionario_controlado
--    e cancelar_desligamento_funcionario_controlado.
-- 2. Revogar e remover as tres RPCs publicas deste lote.
-- 3. Remover df_obrigacao_vinculo_elegivel_interno.
-- 4. Remover public.df_obrigacoes_operacionais somente se ainda nao houver historico real.

do $$
begin
  if to_regclass('public.df_funcionarios_desligamentos') is null then
    raise exception 'Missing table public.df_funcionarios_desligamentos';
  end if;
  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
  end if;
  if to_regclass('public.df_auditoria_eventos') is null then
    raise exception 'Missing table public.df_auditoria_eventos';
  end if;
  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'Missing helper public.df_funcionarios_pode_escrever(uuid)';
  end if;
  if to_regprocedure('public.df_usuario_pode_acessar_filial(uuid,uuid)') is null then
    raise exception 'Missing helper public.df_usuario_pode_acessar_filial(uuid,uuid)';
  end if;
  if to_regprocedure('public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text)') is null then
    raise exception 'Missing function public.abrir_desligamento_funcionario_controlado';
  end if;
  if to_regprocedure('public.cancelar_desligamento_funcionario_controlado(uuid,uuid,text,text)') is null then
    raise exception 'Missing function public.cancelar_desligamento_funcionario_controlado';
  end if;
  if to_regclass('public.df_obrigacoes_operacionais') is not null then
    raise exception 'Table public.df_obrigacoes_operacionais already exists';
  end if;
end;
$$;

create unique index if not exists uq_df_usuarios_empresas_empresa_id_id
  on public.df_usuarios_empresas (empresa_id, id);

create table public.df_obrigacoes_operacionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  desligamento_id uuid not null,
  regra_codigo text not null,
  responsavel_usuario_empresa_id uuid null,
  criada_por_usuario_empresa_id uuid null,
  titulo_snapshot text not null,
  proxima_acao text null,
  terceiro_aguardado text null,
  estado text not null default 'ABERTA',
  severidade text not null default 'MODERADA',
  prazo_em date null,
  proxima_revisao_em date null,
  snooze_ate timestamptz null,
  resultado_resolucao text null,
  motivo_resolucao text null,
  resolvida_em timestamptz null,
  resolvida_por uuid null,
  motivo_cancelamento text null,
  cancelada_em timestamptz null,
  cancelada_por uuid null,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  constraint df_obrigacoes_operacionais_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_obrigacoes_operacionais_desligamento_tenant_fk
    foreign key (empresa_id, desligamento_id)
    references public.df_funcionarios_desligamentos(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_obrigacoes_operacionais_responsavel_tenant_fk
    foreign key (empresa_id, responsavel_usuario_empresa_id)
    references public.df_usuarios_empresas(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_obrigacoes_operacionais_criador_tenant_fk
    foreign key (empresa_id, criada_por_usuario_empresa_id)
    references public.df_usuarios_empresas(empresa_id, id)
    on update restrict on delete restrict,
  constraint df_obrigacoes_operacionais_resolvida_por_fk
    foreign key (resolvida_por) references auth.users(id) on delete set null,
  constraint df_obrigacoes_operacionais_cancelada_por_fk
    foreign key (cancelada_por) references auth.users(id) on delete set null,
  constraint df_obrigacoes_operacionais_regra_check
    check (length(btrim(regra_codigo)) between 3 and 120),
  constraint df_obrigacoes_operacionais_titulo_check
    check (length(btrim(titulo_snapshot)) between 3 and 180),
  constraint df_obrigacoes_operacionais_proxima_acao_check
    check (proxima_acao is null or length(btrim(proxima_acao)) between 3 and 500),
  constraint df_obrigacoes_operacionais_terceiro_check
    check (terceiro_aguardado is null or length(btrim(terceiro_aguardado)) between 2 and 160),
  constraint df_obrigacoes_operacionais_estado_check
    check (estado in ('ABERTA', 'AGUARDANDO_TERCEIRO', 'RESOLVIDA', 'CANCELADA')),
  constraint df_obrigacoes_operacionais_severidade_check
    check (severidade in ('MODERADA', 'ALTA', 'CRITICA')),
  constraint df_obrigacoes_operacionais_resultado_check
    check (resultado_resolucao is null or resultado_resolucao in ('CUMPRIDA', 'NAO_APLICAVEL', 'DISPENSADA')),
  constraint df_obrigacoes_operacionais_ciclo_vida_check check (
    (
      estado = 'ABERTA'
      and terceiro_aguardado is null
      and resultado_resolucao is null and resolvida_em is null and resolvida_por is null
      and motivo_cancelamento is null and cancelada_em is null and cancelada_por is null
    )
    or
    (
      estado = 'AGUARDANDO_TERCEIRO'
      and terceiro_aguardado is not null
      and length(btrim(terceiro_aguardado)) >= 2
      and proxima_revisao_em is not null
      and resultado_resolucao is null and resolvida_em is null and resolvida_por is null
      and motivo_cancelamento is null and cancelada_em is null and cancelada_por is null
    )
    or
    (
      estado = 'RESOLVIDA'
      and resultado_resolucao is not null and resolvida_em is not null and resolvida_por is not null
      and (
        resultado_resolucao = 'CUMPRIDA'
        or (
          motivo_resolucao is not null
          and length(btrim(motivo_resolucao)) >= 3
        )
      )
      and motivo_cancelamento is null and cancelada_em is null and cancelada_por is null
    )
    or
    (
      estado = 'CANCELADA'
      and motivo_cancelamento is not null
      and length(btrim(motivo_cancelamento)) >= 3
      and cancelada_em is not null and cancelada_por is not null
      and resultado_resolucao is null and resolvida_em is null and resolvida_por is null
    )
  )
);

create unique index uq_df_obrigacoes_desligamento_regra
  on public.df_obrigacoes_operacionais (empresa_id, desligamento_id, regra_codigo);

create index idx_df_obrigacoes_empresa_estado
  on public.df_obrigacoes_operacionais (empresa_id, estado, atualizada_em desc);

create index idx_df_obrigacoes_empresa_responsavel
  on public.df_obrigacoes_operacionais (empresa_id, responsavel_usuario_empresa_id, estado);

create index idx_df_obrigacoes_empresa_revisao
  on public.df_obrigacoes_operacionais (empresa_id, proxima_revisao_em)
  where estado = 'AGUARDANDO_TERCEIRO';

alter table public.df_obrigacoes_operacionais enable row level security;
alter table public.df_obrigacoes_operacionais force row level security;

revoke all on table public.df_obrigacoes_operacionais from public, anon, authenticated;
grant select on table public.df_obrigacoes_operacionais to authenticated;

create policy df_obrigacoes_operacionais_select_autorizado
on public.df_obrigacoes_operacionais
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and exists (
    select 1
    from public.df_funcionarios_desligamentos d
    join public.df_funcionarios f
      on f.empresa_id = d.empresa_id
     and f.id = d.funcionario_id
    where d.empresa_id = df_obrigacoes_operacionais.empresa_id
      and d.id = df_obrigacoes_operacionais.desligamento_id
      and public.df_usuario_pode_acessar_filial(d.empresa_id, f.filial_id)
  )
);

create or replace function public.df_obrigacao_vinculo_elegivel_interno(
  p_empresa_id uuid,
  p_vinculo_id uuid,
  p_filial_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.df_usuarios_empresas ue
    join auth.users au
      on au.id = coalesce(ue.user_id, ue.usuario_id)
    left join public.profiles p on p.id = au.id
    where ue.empresa_id = p_empresa_id
      and ue.id = p_vinculo_id
      and lower(coalesce(ue.perfil, '')) in ('admin', 'master', 'owner', 'superadmin', 'super_admin')
      and au.deleted_at is null
      and (au.banned_until is null or au.banned_until <= now())
      and coalesce(lower(p.status), 'ativo') = 'ativo'
      and (
        p_filial_id is null
        or ue.acesso_todas_filiais = true
        or lower(coalesce(ue.perfil, '')) in ('admin', 'master', 'owner', 'superadmin', 'super_admin')
        or exists (
          select 1
          from public.df_usuarios_filiais uf
          where uf.empresa_id = p_empresa_id
            and uf.usuario_id = ue.id
            and uf.filial_id = p_filial_id
        )
      )
  );
$$;

revoke all on function public.df_obrigacao_vinculo_elegivel_interno(uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function public.abrir_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_motivo text,
  p_data_efetiva date,
  p_data_acerto date,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_funcionario public.df_funcionarios%rowtype;
  v_workflow public.df_funcionarios_desligamentos%rowtype;
  v_obrigacao public.df_obrigacoes_operacionais%rowtype;
  v_responsavel_id uuid;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
  v_obrigacao_correlation_id text := gen_random_uuid()::text;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if length(btrim(coalesce(p_motivo, ''))) < 3 then raise exception 'MOTIVO_DESLIGAMENTO_OBRIGATORIO'; end if;
  if p_data_efetiva is null then raise exception 'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA'; end if;
  if p_data_acerto is null then raise exception 'DATA_ACERTO_DESLIGAMENTO_OBRIGATORIA'; end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, p_funcionario_id);
  if v_funcionario.arquivado then raise exception 'FUNCIONARIO_ARQUIVADO'; end if;
  if v_funcionario.status = 'desligado' then raise exception 'FUNCIONARIO_JA_DESLIGADO'; end if;

  perform 1 from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and funcionario_id = p_funcionario_id and estado = 'ABERTO'
  for update;
  if found then raise exception 'DESLIGAMENTO_JA_ABERTO'; end if;

  select ue.id
    into v_responsavel_id
  from public.df_usuarios_empresas ue
  where ue.empresa_id = p_empresa_id
    and (
      ue.user_id = auth.uid()
      or ue.usuario_id = auth.uid()
      or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    and public.df_obrigacao_vinculo_elegivel_interno(p_empresa_id, ue.id, v_funcionario.filial_id)
  order by (ue.user_id = auth.uid()) desc, ue.created_at, ue.id
  limit 1;

  begin
    insert into public.df_funcionarios_desligamentos
      (empresa_id,funcionario_id,estado,motivo,data_efetiva,data_acerto,observacoes,aberto_por,correlation_id)
    values
      (p_empresa_id,p_funcionario_id,'ABERTO',btrim(p_motivo),p_data_efetiva,p_data_acerto,
       nullif(btrim(p_observacoes),''),auth.uid(),v_correlation_id)
    returning * into v_workflow;
  exception when unique_violation then
    raise exception 'DESLIGAMENTO_JA_ABERTO';
  end;

  insert into public.df_obrigacoes_operacionais (
    empresa_id, desligamento_id, regra_codigo,
    responsavel_usuario_empresa_id, criada_por_usuario_empresa_id,
    titulo_snapshot, proxima_acao, estado, severidade
  ) values (
    p_empresa_id, v_workflow.id, 'desligamento.conferencia_inicial',
    v_responsavel_id, v_responsavel_id,
    'Conferir dados iniciais do desligamento',
    'Revisar os dados do desligamento e definir a próxima ação.',
    'ABERTA', 'MODERADA'
  )
  on conflict (empresa_id, desligamento_id, regra_codigo)
  do update set atualizada_em = public.df_obrigacoes_operacionais.atualizada_em
  returning * into v_obrigacao;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','obrigacao_operacional',v_obrigacao.id,
     'rh.obrigacao.criada','info','app','sucesso',null,
     jsonb_build_object(
       'estado',v_obrigacao.estado,
       'responsavel_usuario_empresa_id',v_obrigacao.responsavel_usuario_empresa_id,
       'titulo_snapshot',v_obrigacao.titulo_snapshot,
       'proxima_acao',v_obrigacao.proxima_acao
     ),
     jsonb_build_object(
       'desligamento_id',v_workflow.id,
       'funcionario_id',p_funcionario_id,
       'regra_codigo',v_obrigacao.regra_codigo,
       'responsavel_excepcionalmente_ausente',v_responsavel_id is null
     ),v_obrigacao_correlation_id);

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','funcionario_desligamento',v_workflow.id,
     'rh.desligamento.aberto','info','app','sucesso',v_workflow.motivo,null,
     jsonb_build_object('estado',v_workflow.estado,'data_efetiva',v_workflow.data_efetiva,
       'data_acerto',v_workflow.data_acerto,'observacoes_presentes',v_workflow.observacoes is not null),
     jsonb_build_object('funcionario_id',p_funcionario_id,'workflow_id',v_workflow.id,
       'regra','desligamento_funcional_lote2','status_funcional_preservado',v_funcionario.status,
       'correlation_id',v_correlation_id),v_correlation_id);

  return to_jsonb(v_workflow)||jsonb_build_object(
    'codigo','DESLIGAMENTO_ABERTO',
    'obrigacao_id',v_obrigacao.id,
    'obrigacao_responsavel_id',v_obrigacao.responsavel_usuario_empresa_id
  );
end;
$$;

create or replace function public.cancelar_desligamento_funcionario_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_motivo_cancelamento text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_funcionarios_desligamentos%rowtype;
  v_depois public.df_funcionarios_desligamentos%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_obrigacao public.df_obrigacoes_operacionais%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
  v_estado_obrigacao_antes text;
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if length(btrim(coalesce(p_motivo_cancelamento, ''))) < 3 then
    raise exception 'MOTIVO_CANCELAMENTO_OBRIGATORIO';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id;
  if not found then
    raise exception 'DESLIGAMENTO_NAO_ENCONTRADO';
  end if;

  v_funcionario := public.df_desligamento_bloquear_funcionario_interno(p_empresa_id, v_antes.funcionario_id);

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id
  for update;

  if v_antes.estado <> 'ABERTO' then
    raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO';
  end if;

  update public.df_funcionarios_desligamentos
  set estado = 'CANCELADO',
      cancelado_por = auth.uid(),
      cancelado_em = now(),
      motivo_cancelamento = btrim(p_motivo_cancelamento),
      atualizado_em = now(),
      correlation_id = v_correlation_id
  where id = v_antes.id
  returning * into v_depois;

  for v_obrigacao in
    select *
    from public.df_obrigacoes_operacionais
    where empresa_id = p_empresa_id
      and desligamento_id = p_desligamento_id
      and estado in ('ABERTA', 'AGUARDANDO_TERCEIRO')
    for update
  loop
    v_estado_obrigacao_antes := v_obrigacao.estado;

    update public.df_obrigacoes_operacionais
    set estado = 'CANCELADA',
        terceiro_aguardado = null,
        proxima_revisao_em = null,
        snooze_ate = null,
        motivo_cancelamento = 'Origem cancelada: ' || btrim(p_motivo_cancelamento),
        cancelada_em = now(),
        cancelada_por = auth.uid(),
        atualizada_em = now()
    where id = v_obrigacao.id
    returning * into v_obrigacao;

    insert into public.df_auditoria_eventos (
      empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,
      acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id
    ) values (
      p_empresa_id,auth.uid(),'usuario','rh','obrigacao_operacional',v_obrigacao.id,
      'rh.obrigacao.cancelada','info','app','sucesso',v_obrigacao.motivo_cancelamento,
      jsonb_build_object('estado',v_estado_obrigacao_antes),
      jsonb_build_object('estado',v_obrigacao.estado,'motivo_cancelamento',v_obrigacao.motivo_cancelamento),
      jsonb_build_object('desligamento_id',p_desligamento_id,'regra_codigo',v_obrigacao.regra_codigo),
      gen_random_uuid()::text
    );
  end loop;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_depois.id,
    'rh.desligamento.cancelado', 'info', 'app', 'sucesso', v_depois.motivo_cancelamento,
    jsonb_build_object('estado', v_antes.estado, 'data_efetiva', v_antes.data_efetiva),
    jsonb_build_object(
      'estado', v_depois.estado,
      'data_efetiva', v_depois.data_efetiva,
      'motivo_cancelamento', v_depois.motivo_cancelamento
    ),
    jsonb_build_object(
      'funcionario_id', v_depois.funcionario_id,
      'workflow_id', v_depois.id,
      'regra', 'desligamento_2a',
      'status_funcional_preservado', v_funcionario.status,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('codigo', 'DESLIGAMENTO_CANCELADO');
end;
$$;

create or replace function public.reatribuir_obrigacao_operacional_controlado(
  p_empresa_id uuid,
  p_obrigacao_id uuid,
  p_responsavel_usuario_empresa_id uuid,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_obrigacoes_operacionais%rowtype;
  v_depois public.df_obrigacoes_operacionais%rowtype;
  v_filial_id uuid;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if p_responsavel_usuario_empresa_id is null then raise exception 'RESPONSAVEL_OBRIGATORIO'; end if;

  select o.*
    into v_antes
  from public.df_obrigacoes_operacionais o
  where o.empresa_id=p_empresa_id and o.id=p_obrigacao_id
  for update;
  if not found then raise exception 'OBRIGACAO_NAO_ENCONTRADA'; end if;

  select f.filial_id
    into v_filial_id
  from public.df_funcionarios_desligamentos d
  join public.df_funcionarios f on f.empresa_id=d.empresa_id and f.id=d.funcionario_id
  where d.empresa_id=p_empresa_id and d.id=v_antes.desligamento_id;
  if v_antes.estado in ('RESOLVIDA','CANCELADA') then raise exception 'OBRIGACAO_IMUTAVEL'; end if;
  if not public.df_usuario_pode_acessar_filial(p_empresa_id, v_filial_id) then raise exception 'SEM_PERMISSAO_FILIAL'; end if;
  if not public.df_obrigacao_vinculo_elegivel_interno(p_empresa_id,p_responsavel_usuario_empresa_id,v_filial_id) then
    raise exception 'RESPONSAVEL_INELEGIVEL';
  end if;
  if v_antes.responsavel_usuario_empresa_id is not distinct from p_responsavel_usuario_empresa_id then
    return to_jsonb(v_antes)||jsonb_build_object('codigo','RESPONSAVEL_PRESERVADO');
  end if;

  update public.df_obrigacoes_operacionais
  set responsavel_usuario_empresa_id=p_responsavel_usuario_empresa_id, atualizada_em=now()
  where id=v_antes.id
  returning * into v_depois;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','obrigacao_operacional',v_depois.id,
     'rh.obrigacao.responsavel_alterado','info','app','sucesso',
     jsonb_build_object('responsavel_usuario_empresa_id',v_antes.responsavel_usuario_empresa_id),
     jsonb_build_object('responsavel_usuario_empresa_id',v_depois.responsavel_usuario_empresa_id),
     jsonb_build_object('desligamento_id',v_depois.desligamento_id,'regra_codigo',v_depois.regra_codigo),v_correlation_id);

  return to_jsonb(v_depois)||jsonb_build_object('codigo','RESPONSAVEL_ALTERADO');
end;
$$;

create or replace function public.atualizar_acompanhamento_obrigacao_controlado(
  p_empresa_id uuid,
  p_obrigacao_id uuid,
  p_estado text,
  p_terceiro_aguardado text default null,
  p_proxima_revisao_em date default null,
  p_snooze_minutos integer default null,
  p_remover_snooze boolean default false,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_obrigacoes_operacionais%rowtype;
  v_depois public.df_obrigacoes_operacionais%rowtype;
  v_estado text := upper(btrim(coalesce(p_estado,'')));
  v_terceiro text := nullif(btrim(p_terceiro_aguardado),'');
  v_snooze_ate timestamptz;
  v_filial_id uuid;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if v_estado not in ('ABERTA','AGUARDANDO_TERCEIRO') then raise exception 'ESTADO_ACOMPANHAMENTO_INVALIDO'; end if;
  if p_remover_snooze and p_snooze_minutos is not null then raise exception 'SNOOZE_AMBIGUO'; end if;
  if p_snooze_minutos is not null and p_snooze_minutos not in (30,60) then raise exception 'SNOOZE_INVALIDO'; end if;
  if v_estado='AGUARDANDO_TERCEIRO' and (v_terceiro is null or length(v_terceiro)<2) then raise exception 'TERCEIRO_OBRIGATORIO'; end if;
  if v_estado='AGUARDANDO_TERCEIRO' and p_proxima_revisao_em is null then raise exception 'PROXIMA_REVISAO_OBRIGATORIA'; end if;
  if p_proxima_revisao_em is not null and p_proxima_revisao_em < current_date then raise exception 'PROXIMA_REVISAO_NO_PASSADO'; end if;

  select o.*
    into v_antes
  from public.df_obrigacoes_operacionais o
  where o.empresa_id=p_empresa_id and o.id=p_obrigacao_id
  for update;
  if not found then raise exception 'OBRIGACAO_NAO_ENCONTRADA'; end if;

  select f.filial_id
    into v_filial_id
  from public.df_funcionarios_desligamentos d
  join public.df_funcionarios f on f.empresa_id=d.empresa_id and f.id=d.funcionario_id
  where d.empresa_id=p_empresa_id and d.id=v_antes.desligamento_id;
  if v_antes.estado in ('RESOLVIDA','CANCELADA') then raise exception 'OBRIGACAO_IMUTAVEL'; end if;
  if not public.df_usuario_pode_acessar_filial(p_empresa_id,v_filial_id) then raise exception 'SEM_PERMISSAO_FILIAL'; end if;

  v_snooze_ate := case
    when p_remover_snooze then null
    when p_snooze_minutos is not null then now() + make_interval(mins => p_snooze_minutos)
    else v_antes.snooze_ate
  end;

  update public.df_obrigacoes_operacionais
  set estado=v_estado,
      terceiro_aguardado=case when v_estado='AGUARDANDO_TERCEIRO' then v_terceiro else null end,
      proxima_revisao_em=p_proxima_revisao_em,
      snooze_ate=v_snooze_ate,
      atualizada_em=now()
  where id=v_antes.id
  returning * into v_depois;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','obrigacao_operacional',v_depois.id,
     'rh.obrigacao.acompanhamento_alterado','info','app','sucesso',
     jsonb_build_object('estado',v_antes.estado,'terceiro_aguardado',v_antes.terceiro_aguardado,
       'proxima_revisao_em',v_antes.proxima_revisao_em,'snooze_ate',v_antes.snooze_ate),
     jsonb_build_object('estado',v_depois.estado,'terceiro_aguardado',v_depois.terceiro_aguardado,
       'proxima_revisao_em',v_depois.proxima_revisao_em,'snooze_ate',v_depois.snooze_ate),
     jsonb_build_object('desligamento_id',v_depois.desligamento_id,'regra_codigo',v_depois.regra_codigo),v_correlation_id);

  return to_jsonb(v_depois)||jsonb_build_object('codigo','ACOMPANHAMENTO_ALTERADO');
end;
$$;

create or replace function public.resolver_obrigacao_operacional_controlado(
  p_empresa_id uuid,
  p_obrigacao_id uuid,
  p_resultado text,
  p_motivo text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_obrigacoes_operacionais%rowtype;
  v_depois public.df_obrigacoes_operacionais%rowtype;
  v_resultado text := upper(btrim(coalesce(p_resultado,'')));
  v_motivo text := nullif(btrim(p_motivo),'');
  v_filial_id uuid;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then raise exception 'SEM_PERMISSAO'; end if;
  if v_resultado not in ('CUMPRIDA','NAO_APLICAVEL','DISPENSADA') then raise exception 'RESULTADO_RESOLUCAO_INVALIDO'; end if;
  if v_resultado in ('NAO_APLICAVEL','DISPENSADA') and (v_motivo is null or length(v_motivo)<3) then
    raise exception 'MOTIVO_RESOLUCAO_OBRIGATORIO';
  end if;

  select o.*
    into v_antes
  from public.df_obrigacoes_operacionais o
  where o.empresa_id=p_empresa_id and o.id=p_obrigacao_id
  for update;
  if not found then raise exception 'OBRIGACAO_NAO_ENCONTRADA'; end if;

  select f.filial_id
    into v_filial_id
  from public.df_funcionarios_desligamentos d
  join public.df_funcionarios f on f.empresa_id=d.empresa_id and f.id=d.funcionario_id
  where d.empresa_id=p_empresa_id and d.id=v_antes.desligamento_id;
  if v_antes.estado in ('RESOLVIDA','CANCELADA') then raise exception 'OBRIGACAO_IMUTAVEL'; end if;
  if not public.df_usuario_pode_acessar_filial(p_empresa_id,v_filial_id) then raise exception 'SEM_PERMISSAO_FILIAL'; end if;

  update public.df_obrigacoes_operacionais
  set estado='RESOLVIDA',
      terceiro_aguardado=null,
      proxima_revisao_em=null,
      snooze_ate=null,
      resultado_resolucao=v_resultado,
      motivo_resolucao=v_motivo,
      resolvida_em=now(),
      resolvida_por=auth.uid(),
      atualizada_em=now()
  where id=v_antes.id
  returning * into v_depois;

  insert into public.df_auditoria_eventos
    (empresa_id,user_id,ator_tipo,modulo,entidade_tipo,entidade_id,acao,severidade,origem,status,motivo,dados_antes,dados_depois,metadados,correlation_id)
  values
    (p_empresa_id,auth.uid(),'usuario','rh','obrigacao_operacional',v_depois.id,
     'rh.obrigacao.resolvida','info','app','sucesso',v_motivo,
     jsonb_build_object('estado',v_antes.estado,'responsavel_usuario_empresa_id',v_antes.responsavel_usuario_empresa_id),
     jsonb_build_object('estado',v_depois.estado,'resultado_resolucao',v_depois.resultado_resolucao,
       'motivo_resolucao',v_depois.motivo_resolucao,'resolvida_em',v_depois.resolvida_em),
     jsonb_build_object('desligamento_id',v_depois.desligamento_id,'regra_codigo',v_depois.regra_codigo),v_correlation_id);

  return to_jsonb(v_depois)||jsonb_build_object('codigo','OBRIGACAO_RESOLVIDA');
end;
$$;

revoke all on function public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text)
  from public, anon, authenticated;
revoke all on function public.cancelar_desligamento_funcionario_controlado(uuid,uuid,text,text)
  from public, anon, authenticated;
revoke all on function public.reatribuir_obrigacao_operacional_controlado(uuid,uuid,uuid,text)
  from public, anon, authenticated;
revoke all on function public.atualizar_acompanhamento_obrigacao_controlado(uuid,uuid,text,text,date,integer,boolean,text)
  from public, anon, authenticated;
revoke all on function public.resolver_obrigacao_operacional_controlado(uuid,uuid,text,text,text)
  from public, anon, authenticated;

grant execute on function public.abrir_desligamento_funcionario_controlado(uuid,uuid,text,date,date,text,text)
  to authenticated;
grant execute on function public.cancelar_desligamento_funcionario_controlado(uuid,uuid,text,text)
  to authenticated;
grant execute on function public.reatribuir_obrigacao_operacional_controlado(uuid,uuid,uuid,text)
  to authenticated;
grant execute on function public.atualizar_acompanhamento_obrigacao_controlado(uuid,uuid,text,text,date,integer,boolean,text)
  to authenticated;
grant execute on function public.resolver_obrigacao_operacional_controlado(uuid,uuid,text,text,text)
  to authenticated;

comment on table public.df_obrigacoes_operacionais is
  'Obrigacoes operacionais persistidas. P0 Lote 1: desligamento como primeiro consumidor.';
