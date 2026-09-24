begin;

do $$
begin
  if to_regclass('public.df_funcionarios_desligamentos') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'DEPENDENCIA_CONTA_ACERTO_AUSENTE';
  end if;
end $$;

create table public.df_contas_pagamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  nome text not null,
  ativo boolean not null default true,
  criado_por uuid not null,
  criado_em timestamptz not null default now(),
  atualizado_por uuid not null,
  atualizado_em timestamptz not null default now(),
  arquivado_por uuid null,
  arquivado_em timestamptz null,

  constraint df_contas_pagamento_empresa_fk
    foreign key (empresa_id) references public.df_empresas(id) on delete restrict,
  constraint df_contas_pagamento_nome_check
    check (length(btrim(nome)) between 2 and 120),
  constraint df_contas_pagamento_arquivamento_check
    check (
      (ativo and arquivado_por is null and arquivado_em is null)
      or
      (not ativo and arquivado_por is not null and arquivado_em is not null)
    ),
  constraint uq_df_contas_pagamento_empresa_id_id unique (empresa_id, id)
);

create unique index uq_df_contas_pagamento_nome_empresa
  on public.df_contas_pagamento (empresa_id, lower(btrim(nome)));

comment on table public.df_contas_pagamento is
  'Contas operacionais tenant-local identificadas somente pelo nome para vinculo historico ao acerto de desligamentos.';

alter table public.df_contas_pagamento enable row level security;
alter table public.df_contas_pagamento force row level security;

revoke all on table public.df_contas_pagamento from public, anon, authenticated;
grant select on table public.df_contas_pagamento to authenticated;

create policy "df_contas_pagamento_select_rh"
  on public.df_contas_pagamento
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and public.df_funcionarios_pode_escrever(empresa_id)
  );

alter table public.df_funcionarios_desligamentos
  add column conta_pagamento_id uuid null;

alter table public.df_funcionarios_desligamentos
  add constraint df_funcionarios_desligamentos_conta_pagamento_empresa_fk
  foreign key (empresa_id, conta_pagamento_id)
  references public.df_contas_pagamento (empresa_id, id)
  on delete restrict;

comment on column public.df_funcionarios_desligamentos.conta_pagamento_id is
  'Conta tenant-local escolhida para o acerto. Permanece vinculada quando a conta e arquivada.';

drop view public.df_funcionarios_desligamentos_efetivos;
create view public.df_funcionarios_desligamentos_efetivos
with (security_invoker = true)
as
select
  d.*,
  coalesce(r.data_efetiva_depois, d.data_efetiva) as data_efetiva_efetiva,
  coalesce(r.data_acerto_depois, d.data_acerto) as data_acerto_efetiva,
  coalesce(r.motivo_depois, d.motivo) as motivo_efetivo,
  case when r.id is null then d.observacoes else r.observacoes_depois end as observacoes_efetivas,
  coalesce(c.tipo = 'REVERSAO_ERRO', false) as efeito_revertido,
  case when c.tipo = 'REVERSAO_ERRO' then c.status_depois else
    case when d.estado = 'CONCLUIDO' then 'desligado' else d.status_anterior end
  end as status_funcional_efetivo,
  c.id as ultima_correcao_id,
  c.tipo as ultima_correcao_tipo,
  c.motivo_correcao as ultima_correcao_motivo,
  c.criado_em as ultima_correcao_em
from public.df_funcionarios_desligamentos d
left join lateral (
  select x.*
  from public.df_funcionarios_desligamentos_correcoes x
  where x.empresa_id = d.empresa_id and x.desligamento_id = d.id
  order by x.criado_em desc, x.id desc
  limit 1
) c on true
left join lateral (
  select x.*
  from public.df_funcionarios_desligamentos_correcoes x
  where x.empresa_id = d.empresa_id
    and x.desligamento_id = d.id
    and x.tipo = 'RETIFICACAO'
  order by x.criado_em desc, x.id desc
  limit 1
) r on true;

revoke all on table public.df_funcionarios_desligamentos_efetivos from public, anon, authenticated;
grant select on table public.df_funcionarios_desligamentos_efetivos to authenticated;

create function public.criar_conta_pagamento_desligamento_controlado(
  p_empresa_id uuid,
  p_nome text,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conta public.df_contas_pagamento%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if length(btrim(coalesce(p_nome, ''))) not between 2 and 120 then
    raise exception 'NOME_CONTA_PAGAMENTO_INVALIDO';
  end if;

  begin
    insert into public.df_contas_pagamento (
      empresa_id, nome, criado_por, atualizado_por
    ) values (
      p_empresa_id, btrim(p_nome), auth.uid(), auth.uid()
    ) returning * into v_conta;
  exception when unique_violation then
    raise exception 'CONTA_PAGAMENTO_NOME_DUPLICADO';
  end;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois, metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'conta_pagamento', v_conta.id,
    'rh.conta_pagamento.criada', 'info', 'app', 'sucesso', null,
    jsonb_build_object('nome', v_conta.nome, 'ativo', v_conta.ativo),
    jsonb_build_object('regra', 'conta_acerto_desligamento', 'correlation_id', v_correlation_id),
    v_correlation_id
  );

  return to_jsonb(v_conta) || jsonb_build_object('codigo', 'CONTA_PAGAMENTO_CRIADA');
end;
$$;

create function public.alterar_atividade_conta_pagamento_desligamento_controlado(
  p_empresa_id uuid,
  p_conta_pagamento_id uuid,
  p_ativo boolean,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_contas_pagamento%rowtype;
  v_depois public.df_contas_pagamento%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  select * into v_antes
  from public.df_contas_pagamento
  where empresa_id = p_empresa_id and id = p_conta_pagamento_id
  for update;
  if not found then raise exception 'CONTA_PAGAMENTO_NAO_ENCONTRADA'; end if;
  if v_antes.ativo = p_ativo then raise exception 'CONTA_PAGAMENTO_SEM_ALTERACAO'; end if;

  update public.df_contas_pagamento
  set ativo = p_ativo,
      atualizado_por = auth.uid(),
      atualizado_em = now(),
      arquivado_por = case when p_ativo then null else auth.uid() end,
      arquivado_em = case when p_ativo then null else now() end
  where empresa_id = p_empresa_id and id = p_conta_pagamento_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois, metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'conta_pagamento', v_depois.id,
    case when p_ativo then 'rh.conta_pagamento.reativada' else 'rh.conta_pagamento.arquivada' end,
    'info', 'app', 'sucesso',
    jsonb_build_object('nome', v_antes.nome, 'ativo', v_antes.ativo),
    jsonb_build_object('nome', v_depois.nome, 'ativo', v_depois.ativo),
    jsonb_build_object('regra', 'conta_acerto_desligamento', 'correlation_id', v_correlation_id),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('codigo', 'CONTA_PAGAMENTO_ATIVIDADE_ALTERADA');
end;
$$;

create function public.vincular_conta_pagamento_desligamento_controlado(
  p_empresa_id uuid,
  p_desligamento_id uuid,
  p_conta_pagamento_id uuid,
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
  v_conta public.df_contas_pagamento%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  select * into v_antes
  from public.df_funcionarios_desligamentos
  where empresa_id = p_empresa_id and id = p_desligamento_id
  for update;
  if not found then raise exception 'DESLIGAMENTO_NAO_ENCONTRADO'; end if;
  if v_antes.estado <> 'ABERTO' then raise exception 'DESLIGAMENTO_NAO_ESTA_ABERTO'; end if;

  if p_conta_pagamento_id is not null then
    select * into v_conta
    from public.df_contas_pagamento
    where empresa_id = p_empresa_id and id = p_conta_pagamento_id
    for share;
    if not found then raise exception 'CONTA_PAGAMENTO_NAO_ENCONTRADA'; end if;
    if not v_conta.ativo then raise exception 'CONTA_PAGAMENTO_ARQUIVADA'; end if;
  end if;

  if v_antes.conta_pagamento_id is not distinct from p_conta_pagamento_id then
    raise exception 'CONTA_PAGAMENTO_SEM_ALTERACAO';
  end if;

  update public.df_funcionarios_desligamentos
  set conta_pagamento_id = p_conta_pagamento_id,
      atualizado_em = now(),
      correlation_id = v_correlation_id
  where empresa_id = p_empresa_id and id = p_desligamento_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois, metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'funcionario_desligamento', v_depois.id,
    'rh.desligamento.conta_pagamento_vinculada', 'info', 'app', 'sucesso',
    jsonb_build_object('conta_pagamento_id', v_antes.conta_pagamento_id),
    jsonb_build_object('conta_pagamento_id', v_depois.conta_pagamento_id),
    jsonb_build_object(
      'funcionario_id', v_depois.funcionario_id,
      'workflow_id', v_depois.id,
      'regra', 'conta_acerto_desligamento',
      'correlation_id', v_correlation_id
    ),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('codigo', 'CONTA_PAGAMENTO_VINCULADA');
end;
$$;

revoke all on function public.criar_conta_pagamento_desligamento_controlado(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.alterar_atividade_conta_pagamento_desligamento_controlado(uuid, uuid, boolean, text)
  from public, anon, authenticated;
revoke all on function public.vincular_conta_pagamento_desligamento_controlado(uuid, uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.criar_conta_pagamento_desligamento_controlado(uuid, text, text)
  to authenticated;
grant execute on function public.alterar_atividade_conta_pagamento_desligamento_controlado(uuid, uuid, boolean, text)
  to authenticated;
grant execute on function public.vincular_conta_pagamento_desligamento_controlado(uuid, uuid, uuid, text)
  to authenticated;

commit;
