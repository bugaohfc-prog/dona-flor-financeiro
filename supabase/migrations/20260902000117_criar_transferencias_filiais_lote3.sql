begin;

alter table public.df_filiais
  add constraint df_filiais_empresa_id_id_unique unique (empresa_id, id);

create table public.df_funcionarios_transferencias_filiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  funcionario_id uuid not null,
  filial_origem_id uuid not null,
  filial_destino_id uuid not null,
  data_transferencia date not null,
  motivo text not null,
  observacoes text null,
  criado_em timestamptz not null default now(),
  criado_por uuid not null default auth.uid(),
  correlation_id text not null,

  constraint df_func_transferencias_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_func_transferencias_funcionario_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id) on delete restrict,
  constraint df_func_transferencias_origem_fk
    foreign key (empresa_id, filial_origem_id)
    references public.df_filiais(empresa_id, id) on delete restrict,
  constraint df_func_transferencias_destino_fk
    foreign key (empresa_id, filial_destino_id)
    references public.df_filiais(empresa_id, id) on delete restrict,
  constraint df_func_transferencias_filiais_distintas
    check (filial_origem_id <> filial_destino_id),
  constraint df_func_transferencias_motivo_preenchido
    check (length(btrim(motivo)) between 1 and 200),
  constraint df_func_transferencias_observacoes_limite
    check (observacoes is null or length(btrim(observacoes)) between 1 and 500),
  constraint df_func_transferencias_correlation_preenchido
    check (length(btrim(correlation_id)) > 0),
  constraint df_func_transferencias_data_unica
    unique (empresa_id, funcionario_id, data_transferencia)
);

create index idx_df_func_transferencias_historico
  on public.df_funcionarios_transferencias_filiais
  (empresa_id, funcionario_id, data_transferencia desc, criado_em desc);

alter table public.df_funcionarios_transferencias_filiais enable row level security;
alter table public.df_funcionarios_transferencias_filiais force row level security;

create policy "df_func_transferencias_select_rh"
on public.df_funcionarios_transferencias_filiais
for select
to authenticated
using (
  public.df_usuario_eh_admin(empresa_id)
  or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
);

revoke all on table public.df_funcionarios_transferencias_filiais
  from public, anon, authenticated;
grant select on table public.df_funcionarios_transferencias_filiais
  to authenticated;

create or replace function public.df_func_transferencias_bloquear_mutacao_direta_lote3()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'TRANSFERENCIA_FILIAL_HISTORICO_IMUTAVEL';
end;
$$;

create trigger trg_df_func_transferencias_bloquear_update_delete_lote3
before update or delete on public.df_funcionarios_transferencias_filiais
for each row execute function public.df_func_transferencias_bloquear_mutacao_direta_lote3();

create or replace function public.df_funcionarios_bloquear_filial_direta_lote3()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.filial_id is distinct from old.filial_id
    and coalesce(current_setting('app.transferencia_filial_controlada', true), '') <> '1' then
    raise exception 'TRANSFERENCIA_FILIAL_EXIGE_OPERACAO_CONTROLADA';
  end if;
  return new;
end;
$$;

create trigger trg_df_funcionarios_bloquear_filial_direta_lote3
before update of filial_id on public.df_funcionarios
for each row execute function public.df_funcionarios_bloquear_filial_direta_lote3();

create or replace function public.df_funcionario_filial_na_data_lote3(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_data_referencia date
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_filial_id uuid;
begin
  if p_data_referencia is null then
    select filial_id into v_filial_id
    from public.df_funcionarios
    where empresa_id = p_empresa_id and id = p_funcionario_id;
    return v_filial_id;
  end if;

  select filial_destino_id into v_filial_id
  from public.df_funcionarios_transferencias_filiais
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
    and data_transferencia <= p_data_referencia
  order by data_transferencia desc, criado_em desc
  limit 1;
  if found then return v_filial_id; end if;

  select filial_origem_id into v_filial_id
  from public.df_funcionarios_transferencias_filiais
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
    and data_transferencia > p_data_referencia
  order by data_transferencia asc, criado_em asc
  limit 1;
  if found then return v_filial_id; end if;

  select filial_id into v_filial_id
  from public.df_funcionarios
  where empresa_id = p_empresa_id and id = p_funcionario_id;
  return v_filial_id;
end;
$$;

create or replace function public.transferir_funcionario_filial_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_filial_destino_id uuid,
  p_data_transferencia date,
  p_motivo text,
  p_observacoes text default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_funcionario_antes public.df_funcionarios%rowtype;
  v_funcionario_depois public.df_funcionarios%rowtype;
  v_transferencia public.df_funcionarios_transferencias_filiais%rowtype;
  v_ultima_data date;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_filial_destino_id is null or p_data_transferencia is null or nullif(btrim(p_motivo), '') is null then
    raise exception 'TRANSFERENCIA_DADOS_OBRIGATORIOS';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_empresa_id::text || ':' || p_funcionario_id::text, 0));

  select * into v_funcionario_antes
  from public.df_funcionarios
  where empresa_id = p_empresa_id and id = p_funcionario_id
  for update;
  if not found then raise exception 'FUNCIONARIO_NAO_ENCONTRADO'; end if;
  if v_funcionario_antes.arquivado or v_funcionario_antes.status not in ('ativo', 'afastado') then
    raise exception 'FUNCIONARIO_NAO_ELEGIVEL_TRANSFERENCIA';
  end if;
  if v_funcionario_antes.filial_id is null then raise exception 'FUNCIONARIO_SEM_FILIAL_ORIGEM'; end if;
  if v_funcionario_antes.filial_id = p_filial_destino_id then raise exception 'FILIAL_DESTINO_IGUAL_ORIGEM'; end if;
  if p_data_transferencia < v_funcionario_antes.data_admissao then raise exception 'TRANSFERENCIA_DATA_ANTERIOR_ADMISSAO'; end if;
  if p_data_transferencia > current_date then raise exception 'TRANSFERENCIA_DATA_FUTURA'; end if;
  if not exists (
    select 1 from public.df_filiais
    where empresa_id = p_empresa_id and id = p_filial_destino_id and ativo is true
  ) then raise exception 'FILIAL_DESTINO_INVALIDA'; end if;
  if exists (
    select 1 from public.df_funcionarios_desligamentos
    where empresa_id = p_empresa_id and funcionario_id = p_funcionario_id and estado = 'ABERTO'
  ) then raise exception 'TRANSFERENCIA_CONFLITO_DESLIGAMENTO'; end if;

  select max(data_transferencia) into v_ultima_data
  from public.df_funcionarios_transferencias_filiais
  where empresa_id = p_empresa_id and funcionario_id = p_funcionario_id;
  if v_ultima_data is not null and p_data_transferencia <= v_ultima_data then
    raise exception 'TRANSFERENCIA_CRONOLOGIA_INVALIDA';
  end if;

  insert into public.df_funcionarios_transferencias_filiais (
    empresa_id, funcionario_id, filial_origem_id, filial_destino_id,
    data_transferencia, motivo, observacoes, criado_por, correlation_id
  ) values (
    p_empresa_id, p_funcionario_id, v_funcionario_antes.filial_id, p_filial_destino_id,
    p_data_transferencia, btrim(p_motivo), nullif(btrim(p_observacoes), ''), auth.uid(), v_correlation_id
  ) returning * into v_transferencia;

  perform set_config('app.transferencia_filial_controlada', '1', true);
  update public.df_funcionarios
  set filial_id = p_filial_destino_id
  where empresa_id = p_empresa_id and id = p_funcionario_id
  returning * into v_funcionario_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', p_funcionario_id,
    'rh.funcionario.filial_transferida', 'info', 'app', 'sucesso', btrim(p_motivo),
    jsonb_build_object('filial_id', v_funcionario_antes.filial_id),
    jsonb_build_object('filial_id', v_funcionario_depois.filial_id, 'data_transferencia', p_data_transferencia),
    jsonb_build_object(
      'funcionario_id', p_funcionario_id,
      'transferencia_id', v_transferencia.id,
      'filial_origem_id', v_transferencia.filial_origem_id,
      'filial_destino_id', v_transferencia.filial_destino_id,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_transferencia) || jsonb_build_object(
    'filial_atual_id', v_funcionario_depois.filial_id,
    'correlation_id', v_correlation_id
  );
end;
$$;

create or replace function public.df_folha_lancamentos_snapshot_data_2c2()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pessoa_id uuid;
  v_nome text;
  v_filial_id uuid;
  v_filial_nome text;
  v_cargo text;
  v_data_admissao date;
begin
  if tg_op = 'UPDATE' then
    if new.funcionario_nome_snapshot is distinct from old.funcionario_nome_snapshot
      or new.pessoa_id_snapshot is distinct from old.pessoa_id_snapshot
      or new.filial_id_snapshot is distinct from old.filial_id_snapshot
      or new.filial_nome_snapshot is distinct from old.filial_nome_snapshot
      or new.cargo_snapshot is distinct from old.cargo_snapshot
      or new.data_admissao_snapshot is distinct from old.data_admissao_snapshot
      or new.snapshot_origem is distinct from old.snapshot_origem
      or new.snapshot_capturado_em is distinct from old.snapshot_capturado_em then
      raise exception 'SNAPSHOT_FOLHA_IMUTAVEL';
    end if;
    if new.funcionario_id is distinct from old.funcionario_id then raise exception 'FUNCIONARIO_LANCAMENTO_FOLHA_IMUTAVEL'; end if;
    if new.empresa_id is distinct from old.empresa_id then raise exception 'EMPRESA_LANCAMENTO_FOLHA_IMUTAVEL'; end if;
  else
    v_filial_id := public.df_funcionario_filial_na_data_lote3(new.empresa_id, new.funcionario_id, new.data_referencia);
    select f.pessoa_id, p.nome, coalesce(fi.razao_social, fi.nome),
           nullif(btrim(f.cargo), ''), f.data_admissao
      into v_pessoa_id, v_nome, v_filial_nome, v_cargo, v_data_admissao
    from public.df_funcionarios f
    join public.df_pessoas p on p.empresa_id = f.empresa_id and p.id = f.pessoa_id
    left join public.df_filiais fi on fi.empresa_id = f.empresa_id and fi.id = v_filial_id
    where f.empresa_id = new.empresa_id and f.id = new.funcionario_id;
    if not found or v_pessoa_id is null or nullif(btrim(v_nome), '') is null then
      raise exception 'IDENTIDADE_FOLHA_NAO_ENCONTRADA';
    end if;
    new.filial_id := v_filial_id;
    new.funcionario_nome_snapshot := v_nome;
    new.pessoa_id_snapshot := v_pessoa_id;
    new.filial_id_snapshot := v_filial_id;
    new.filial_nome_snapshot := v_filial_nome;
    new.cargo_snapshot := v_cargo;
    new.data_admissao_snapshot := v_data_admissao;
    new.snapshot_origem := 'capturado_criacao_v1';
    new.snapshot_capturado_em := now();
  end if;

  if tg_op = 'INSERT'
    or new.data_referencia is distinct from old.data_referencia
    or new.funcionario_id is distinct from old.funcionario_id then
    perform public.df_folha_validar_data_efetiva_2c2(new.empresa_id, new.funcionario_id, new.data_referencia);
  end if;
  return new;
end;
$$;

revoke all on function public.transferir_funcionario_filial_controlado(uuid, uuid, uuid, date, text, text, text)
  from public, anon, authenticated;
grant execute on function public.transferir_funcionario_filial_controlado(uuid, uuid, uuid, date, text, text, text)
  to authenticated;
revoke all on function public.df_funcionario_filial_na_data_lote3(uuid, uuid, date)
  from public, anon, authenticated;
revoke all on function public.df_func_transferencias_bloquear_mutacao_direta_lote3()
  from public, anon, authenticated;
revoke all on function public.df_funcionarios_bloquear_filial_direta_lote3()
  from public, anon, authenticated;

commit;
