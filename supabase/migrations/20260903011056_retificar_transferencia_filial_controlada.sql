begin;

alter table public.df_funcionarios_transferencias_filiais
  add constraint df_func_transferencias_empresa_id_id_unique
  unique (empresa_id, id);

create table public.df_funcionarios_transferencias_filiais_retificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  transferencia_id uuid not null,
  funcionario_id uuid not null,
  data_anterior date not null,
  data_corrigida date not null,
  motivo text not null,
  criado_em timestamptz not null default now(),
  criado_por uuid not null default auth.uid(),
  correlation_id text not null,

  constraint df_func_transferencias_retificacoes_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_func_transferencias_retificacoes_transferencia_fk
    foreign key (empresa_id, transferencia_id)
    references public.df_funcionarios_transferencias_filiais(empresa_id, id) on delete restrict,
  constraint df_func_transferencias_retificacoes_funcionario_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id) on delete restrict,
  constraint df_func_transferencias_retificacoes_datas_distintas
    check (data_anterior <> data_corrigida),
  constraint df_func_transferencias_retificacoes_motivo_preenchido
    check (length(btrim(motivo)) between 3 and 500),
  constraint df_func_transferencias_retificacoes_correlation_preenchido
    check (length(btrim(correlation_id)) > 0)
);

create index idx_df_func_transferencias_retificacoes_historico
  on public.df_funcionarios_transferencias_filiais_retificacoes
  (empresa_id, transferencia_id, criado_em desc);

alter table public.df_funcionarios_transferencias_filiais_retificacoes enable row level security;
alter table public.df_funcionarios_transferencias_filiais_retificacoes force row level security;

create policy "df_func_transferencias_retificacoes_select_rh"
on public.df_funcionarios_transferencias_filiais_retificacoes
for select
to authenticated
using (
  public.df_usuario_eh_admin(empresa_id)
  or public.df_usuario_tem_perfil_empresa(empresa_id, array['gerente'])
);

revoke all on table public.df_funcionarios_transferencias_filiais_retificacoes
  from public, anon, authenticated;
grant select on table public.df_funcionarios_transferencias_filiais_retificacoes
  to authenticated;

create or replace function public.df_func_transferencias_retificacoes_bloquear_mutacao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'RETIFICACAO_TRANSFERENCIA_HISTORICO_IMUTAVEL';
end;
$$;

create trigger trg_df_func_transferencias_retificacoes_bloquear_update_delete
before update or delete on public.df_funcionarios_transferencias_filiais_retificacoes
for each row execute function public.df_func_transferencias_retificacoes_bloquear_mutacao();

create or replace view public.df_funcionarios_transferencias_filiais_efetivas
with (security_invoker = true)
as
select
  t.id,
  t.empresa_id,
  t.funcionario_id,
  t.filial_origem_id,
  t.filial_destino_id,
  coalesce(r.data_corrigida, t.data_transferencia) as data_transferencia,
  t.data_transferencia as data_transferencia_original,
  t.motivo,
  t.observacoes,
  t.criado_em,
  t.criado_por,
  t.correlation_id,
  (r.id is not null) as retificada,
  r.id as ultima_retificacao_id,
  r.motivo as motivo_retificacao,
  r.criado_em as retificado_em
from public.df_funcionarios_transferencias_filiais t
left join lateral (
  select rr.id, rr.data_corrigida, rr.motivo, rr.criado_em
  from public.df_funcionarios_transferencias_filiais_retificacoes rr
  where rr.empresa_id = t.empresa_id
    and rr.transferencia_id = t.id
  order by rr.criado_em desc, rr.id desc
  limit 1
) r on true;

revoke all on public.df_funcionarios_transferencias_filiais_efetivas
  from public, anon, authenticated;
grant select on public.df_funcionarios_transferencias_filiais_efetivas
  to authenticated;

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
  from public.df_funcionarios_transferencias_filiais_efetivas
  where empresa_id = p_empresa_id
    and funcionario_id = p_funcionario_id
    and data_transferencia <= p_data_referencia
  order by data_transferencia desc, criado_em desc
  limit 1;
  if found then return v_filial_id; end if;

  select filial_origem_id into v_filial_id
  from public.df_funcionarios_transferencias_filiais_efetivas
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

create or replace function public.retificar_transferencia_filial_controlada(
  p_empresa_id uuid,
  p_transferencia_id uuid,
  p_nova_data_transferencia date,
  p_motivo text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transferencia public.df_funcionarios_transferencias_filiais%rowtype;
  v_funcionario public.df_funcionarios%rowtype;
  v_data_atual date;
  v_data_anterior date;
  v_data_posterior date;
  v_retificacao public.df_funcionarios_transferencias_filiais_retificacoes%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if p_transferencia_id is null or p_nova_data_transferencia is null or length(btrim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'RETIFICACAO_TRANSFERENCIA_DADOS_OBRIGATORIOS';
  end if;

  select * into v_transferencia
  from public.df_funcionarios_transferencias_filiais
  where empresa_id = p_empresa_id and id = p_transferencia_id;
  if not found then raise exception 'TRANSFERENCIA_NAO_ENCONTRADA'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_empresa_id::text || ':' || v_transferencia.funcionario_id::text, 0));

  select * into v_transferencia
  from public.df_funcionarios_transferencias_filiais
  where empresa_id = p_empresa_id and id = p_transferencia_id
  for update;

  select * into v_funcionario
  from public.df_funcionarios
  where empresa_id = p_empresa_id and id = v_transferencia.funcionario_id
  for update;
  if not found then raise exception 'FUNCIONARIO_NAO_ENCONTRADO'; end if;

  select coalesce(
    (
      select r.data_corrigida
      from public.df_funcionarios_transferencias_filiais_retificacoes r
      where r.empresa_id = p_empresa_id and r.transferencia_id = p_transferencia_id
      order by r.criado_em desc, r.id desc
      limit 1
    ),
    v_transferencia.data_transferencia
  ) into v_data_atual;

  if p_nova_data_transferencia = v_data_atual then raise exception 'RETIFICACAO_TRANSFERENCIA_SEM_ALTERACAO'; end if;
  if p_nova_data_transferencia < v_funcionario.data_admissao then raise exception 'TRANSFERENCIA_DATA_ANTERIOR_ADMISSAO'; end if;
  if p_nova_data_transferencia > current_date then raise exception 'TRANSFERENCIA_DATA_FUTURA'; end if;

  select max(e.data_transferencia) into v_data_anterior
  from public.df_funcionarios_transferencias_filiais_efetivas e
  where e.empresa_id = p_empresa_id
    and e.funcionario_id = v_transferencia.funcionario_id
    and e.id <> p_transferencia_id
    and e.criado_em < v_transferencia.criado_em;

  select min(e.data_transferencia) into v_data_posterior
  from public.df_funcionarios_transferencias_filiais_efetivas e
  where e.empresa_id = p_empresa_id
    and e.funcionario_id = v_transferencia.funcionario_id
    and e.id <> p_transferencia_id
    and e.criado_em > v_transferencia.criado_em;

  if (v_data_anterior is not null and p_nova_data_transferencia <= v_data_anterior)
    or (v_data_posterior is not null and p_nova_data_transferencia >= v_data_posterior)
    or exists (
      select 1
      from public.df_funcionarios_transferencias_filiais_efetivas e
      where e.empresa_id = p_empresa_id
        and e.funcionario_id = v_transferencia.funcionario_id
        and e.id <> p_transferencia_id
        and e.data_transferencia = p_nova_data_transferencia
    ) then
    raise exception 'RETIFICACAO_TRANSFERENCIA_CRONOLOGIA_INVALIDA';
  end if;

  insert into public.df_funcionarios_transferencias_filiais_retificacoes (
    empresa_id, transferencia_id, funcionario_id, data_anterior, data_corrigida,
    motivo, criado_por, correlation_id
  ) values (
    p_empresa_id, p_transferencia_id, v_transferencia.funcionario_id, v_data_atual,
    p_nova_data_transferencia, btrim(p_motivo), auth.uid(), v_correlation_id
  ) returning * into v_retificacao;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, motivo, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario', v_transferencia.funcionario_id,
    'rh.funcionario.filial_transferencia_retificada', 'info', 'app', 'sucesso', btrim(p_motivo),
    jsonb_build_object('data_transferencia', v_data_atual),
    jsonb_build_object('data_transferencia', p_nova_data_transferencia),
    jsonb_build_object(
      'funcionario_id', v_transferencia.funcionario_id,
      'transferencia_id', p_transferencia_id,
      'retificacao_id', v_retificacao.id,
      'filial_origem_id', v_transferencia.filial_origem_id,
      'filial_destino_id', v_transferencia.filial_destino_id,
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_retificacao) || jsonb_build_object(
    'data_transferencia_efetiva', p_nova_data_transferencia,
    'correlation_id', v_correlation_id
  );
end;
$$;

revoke all on function public.retificar_transferencia_filial_controlada(uuid, uuid, date, text, text)
  from public, anon, authenticated;
grant execute on function public.retificar_transferencia_filial_controlada(uuid, uuid, date, text, text)
  to authenticated;
revoke all on function public.df_func_transferencias_retificacoes_bloquear_mutacao()
  from public, anon, authenticated;

commit;
