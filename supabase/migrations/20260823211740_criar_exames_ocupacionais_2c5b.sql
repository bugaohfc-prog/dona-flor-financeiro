begin;

do $$
begin
  if to_regclass('public.df_empresas') is null
     or to_regclass('public.df_funcionarios') is null
     or to_regclass('public.df_funcionarios_exames_periodicos') is null
     or to_regclass('public.df_auditoria_eventos') is null
     or to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'DEPENDENCIA_EXAMES_OCUPACIONAIS_2C5B_AUSENTE';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.df_funcionarios'::regclass
      and conname = 'df_funcionarios_empresa_id_id_unique'
  ) then
    alter table public.df_funcionarios
      add constraint df_funcionarios_empresa_id_id_unique
      unique (empresa_id, id);
  end if;
end $$;

create table public.df_funcionarios_exames_ocupacionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  funcionario_id uuid not null,
  tipo text not null,
  estado text not null,
  data_prevista date null,
  data_realizada date null,
  origem text not null,
  legado_tipo text null,
  legado_id uuid null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_funcionarios_exames_ocupacionais_empresa_fk
    foreign key (empresa_id)
    references public.df_empresas(id)
    on update restrict
    on delete restrict,
  constraint df_funcionarios_exames_ocupacionais_funcionario_tenant_fk
    foreign key (empresa_id, funcionario_id)
    references public.df_funcionarios(empresa_id, id)
    on update restrict
    on delete restrict,
  constraint df_funcionarios_exames_ocupacionais_tipo_check
    check (tipo in ('ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL')),
  constraint df_funcionarios_exames_ocupacionais_estado_check
    check (estado in ('PENDENTE', 'REALIZADO', 'CANCELADO')),
  constraint df_funcionarios_exames_ocupacionais_datas_check
    check (
      (estado = 'REALIZADO' and data_realizada is not null)
      or (estado = 'PENDENTE' and data_prevista is not null and data_realizada is null)
      or (estado = 'CANCELADO' and data_realizada is null)
    ),
  constraint df_funcionarios_exames_ocupacionais_origem_check
    check (origem in ('LEGADO', 'MANUAL')),
  constraint df_funcionarios_exames_ocupacionais_legado_check
    check (
      (origem = 'LEGADO' and legado_tipo is not null and legado_id is not null)
      or (origem = 'MANUAL' and legado_tipo is null and legado_id is null)
    ),
  constraint df_funcionarios_exames_ocupacionais_legado_tipo_check
    check (
      legado_tipo is null
      or legado_tipo in ('DF_FUNCIONARIO_ADMISSIONAL', 'DF_FUNCIONARIO_EXAME_PERIODICO')
    ),
  constraint df_funcionarios_exames_ocupacionais_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

comment on table public.df_funcionarios_exames_ocupacionais is
  'Historico operacional de exames ocupacionais por vinculo. Nao armazenar dados clinicos, laudos, resultados ou documentos medicos.';
comment on column public.df_funcionarios_exames_ocupacionais.tipo is
  'Tipo operacional estruturado. DEMISSIONAL e apenas capacidade futura no 2C-5B, sem criacao automatica.';
comment on column public.df_funcionarios_exames_ocupacionais.data_prevista is
  'Data operacional planejada. Nao representa prazo legal e nao e calculada automaticamente.';
comment on column public.df_funcionarios_exames_ocupacionais.data_realizada is
  'Data de realizacao informada sem resultado, laudo ou qualquer conteudo clinico.';
comment on column public.df_funcionarios_exames_ocupacionais.legado_id is
  'Identificador imutavel da origem legada usado para backfill idempotente.';

create unique index idx_df_funcionarios_exames_ocupacionais_legado_unico
  on public.df_funcionarios_exames_ocupacionais (empresa_id, legado_tipo, legado_id)
  where legado_tipo is not null and legado_id is not null;
create index idx_df_funcionarios_exames_ocupacionais_funcionario
  on public.df_funcionarios_exames_ocupacionais (empresa_id, funcionario_id);
create index idx_df_funcionarios_exames_ocupacionais_operacional
  on public.df_funcionarios_exames_ocupacionais (empresa_id, tipo, estado)
  where arquivado = false;
create index idx_df_funcionarios_exames_ocupacionais_previstos
  on public.df_funcionarios_exames_ocupacionais (empresa_id, data_prevista)
  where arquivado = false and estado = 'PENDENTE';

create or replace function public.df_exames_ocupacionais_set_timestamps_2c5b()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif not new.arquivado then
    new.arquivado_em = null;
  end if;
  return new;
end;
$$;

create or replace function public.df_exames_ocupacionais_proteger_registro_2c5b()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'EXAME_OCUPACIONAL_DELETE_BLOQUEADO';
  end if;

  if new.empresa_id is distinct from old.empresa_id
     or new.funcionario_id is distinct from old.funcionario_id
     or new.origem is distinct from old.origem
     or new.legado_tipo is distinct from old.legado_tipo
     or new.legado_id is distinct from old.legado_id
     or new.criado_em is distinct from old.criado_em then
    raise exception 'PROVENIENCIA_EXAME_OCUPACIONAL_IMUTAVEL';
  end if;
  return new;
end;
$$;

create trigger trg_df_exames_ocupacionais_set_timestamps_2c5b
before insert or update on public.df_funcionarios_exames_ocupacionais
for each row execute function public.df_exames_ocupacionais_set_timestamps_2c5b();

create trigger trg_df_exames_ocupacionais_proteger_update_2c5b
before update on public.df_funcionarios_exames_ocupacionais
for each row execute function public.df_exames_ocupacionais_proteger_registro_2c5b();

create trigger trg_df_exames_ocupacionais_bloquear_delete_2c5b
before delete on public.df_funcionarios_exames_ocupacionais
for each row execute function public.df_exames_ocupacionais_proteger_registro_2c5b();

alter table public.df_funcionarios_exames_ocupacionais enable row level security;
alter table public.df_funcionarios_exames_ocupacionais force row level security;

revoke all on table public.df_funcionarios_exames_ocupacionais from public, anon, authenticated;
grant select on table public.df_funcionarios_exames_ocupacionais to authenticated;

create policy "df_exames_ocupacionais_select_rh"
on public.df_funcionarios_exames_ocupacionais
for select
to authenticated
using (
  (select auth.uid()) is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

insert into public.df_funcionarios_exames_ocupacionais (
  empresa_id, funcionario_id, tipo, estado,
  data_prevista, data_realizada, origem, legado_tipo, legado_id,
  arquivado, arquivado_em, criado_em, atualizado_em
)
select
  f.empresa_id, f.id, 'ADMISSIONAL', 'REALIZADO',
  null, f.data_exame_admissional, 'LEGADO', 'DF_FUNCIONARIO_ADMISSIONAL', f.id,
  false, null, coalesce(f.created_at, now()), coalesce(f.updated_at, now())
from public.df_funcionarios f
where f.data_exame_admissional is not null
on conflict (empresa_id, legado_tipo, legado_id)
  where legado_tipo is not null and legado_id is not null
do nothing;

insert into public.df_funcionarios_exames_ocupacionais (
  empresa_id, funcionario_id, tipo, estado,
  data_prevista, data_realizada, origem, legado_tipo, legado_id,
  arquivado, arquivado_em, criado_em, atualizado_em
)
select
  e.empresa_id, e.funcionario_id, 'PERIODICO', 'REALIZADO',
  null, e.data_exame, 'LEGADO', 'DF_FUNCIONARIO_EXAME_PERIODICO', e.id,
  e.arquivado, e.arquivado_em, e.criado_em, e.atualizado_em
from public.df_funcionarios_exames_periodicos e
on conflict (empresa_id, legado_tipo, legado_id)
  where legado_tipo is not null and legado_id is not null
do nothing;

create or replace function public.registrar_exame_ocupacional_controlado(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_tipo text,
  p_estado text,
  p_data_prevista date default null,
  p_data_realizada date default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exame public.df_funcionarios_exames_ocupacionais%rowtype;
  v_tipo text := upper(nullif(btrim(p_tipo), ''));
  v_estado text := upper(nullif(btrim(p_estado), ''));
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if v_tipo is null or v_tipo not in ('ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL') then
    raise exception 'TIPO_EXAME_OCUPACIONAL_INVALIDO';
  end if;
  if v_estado is null or v_estado not in ('PENDENTE', 'REALIZADO', 'CANCELADO') then
    raise exception 'ESTADO_EXAME_OCUPACIONAL_INVALIDO';
  end if;
  if (v_estado = 'REALIZADO' and p_data_realizada is null)
     or (v_estado = 'PENDENTE' and (p_data_prevista is null or p_data_realizada is not null))
     or (v_estado = 'CANCELADO' and p_data_realizada is not null) then
    raise exception 'DATAS_EXAME_OCUPACIONAL_INCOERENTES';
  end if;

  perform 1
  from public.df_funcionarios
  where empresa_id = p_empresa_id and id = p_funcionario_id
  for key share;
  if not found then
    raise exception 'FUNCIONARIO_NAO_ENCONTRADO';
  end if;

  insert into public.df_funcionarios_exames_ocupacionais (
    empresa_id, funcionario_id, tipo, estado,
    data_prevista, data_realizada, origem
  ) values (
    p_empresa_id, p_funcionario_id, v_tipo, v_estado,
    p_data_prevista, p_data_realizada, 'MANUAL'
  ) returning * into v_exame;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'exame_ocupacional', v_exame.id,
    'rh.exame_ocupacional.criado', 'info', 'app', 'sucesso', null,
    jsonb_build_object(
      'exame_id', v_exame.id,
      'funcionario_id', v_exame.funcionario_id,
      'tipo', v_exame.tipo,
      'estado', v_exame.estado,
      'data_prevista', v_exame.data_prevista,
      'data_realizada', v_exame.data_realizada,
      'arquivado', v_exame.arquivado
    ),
    jsonb_build_object('regra', 'exames_ocupacionais_2c5b'),
    v_correlation_id
  );

  return to_jsonb(v_exame) || jsonb_build_object('correlation_id', v_correlation_id);
end;
$$;

create or replace function public.atualizar_exame_ocupacional_controlado(
  p_empresa_id uuid,
  p_exame_id uuid,
  p_tipo text,
  p_estado text,
  p_data_prevista date default null,
  p_data_realizada date default null,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_funcionarios_exames_ocupacionais%rowtype;
  v_depois public.df_funcionarios_exames_ocupacionais%rowtype;
  v_tipo text := upper(nullif(btrim(p_tipo), ''));
  v_estado text := upper(nullif(btrim(p_estado), ''));
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if v_tipo is null or v_tipo not in ('ADMISSIONAL', 'PERIODICO', 'DEMISSIONAL') then
    raise exception 'TIPO_EXAME_OCUPACIONAL_INVALIDO';
  end if;
  if v_estado is null or v_estado not in ('PENDENTE', 'REALIZADO', 'CANCELADO') then
    raise exception 'ESTADO_EXAME_OCUPACIONAL_INVALIDO';
  end if;
  if (v_estado = 'REALIZADO' and p_data_realizada is null)
     or (v_estado = 'PENDENTE' and (p_data_prevista is null or p_data_realizada is not null))
     or (v_estado = 'CANCELADO' and p_data_realizada is not null) then
    raise exception 'DATAS_EXAME_OCUPACIONAL_INCOERENTES';
  end if;

  select * into v_antes
  from public.df_funcionarios_exames_ocupacionais
  where empresa_id = p_empresa_id and id = p_exame_id
  for update;
  if not found then
    raise exception 'EXAME_OCUPACIONAL_NAO_ENCONTRADO';
  end if;
  if v_antes.arquivado then
    raise exception 'EXAME_OCUPACIONAL_ARQUIVADO';
  end if;
  if v_antes.origem = 'LEGADO' then
    raise exception 'EXAME_OCUPACIONAL_LEGADO_SOMENTE_LEITURA';
  end if;

  update public.df_funcionarios_exames_ocupacionais
  set tipo = v_tipo,
      estado = v_estado,
      data_prevista = p_data_prevista,
      data_realizada = p_data_realizada
  where empresa_id = p_empresa_id and id = p_exame_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'exame_ocupacional', v_depois.id,
    'rh.exame_ocupacional.atualizado', 'info', 'app', 'sucesso',
    jsonb_build_object(
      'tipo', v_antes.tipo, 'estado', v_antes.estado,
      'data_prevista', v_antes.data_prevista, 'data_realizada', v_antes.data_realizada
    ),
    jsonb_build_object(
      'tipo', v_depois.tipo, 'estado', v_depois.estado,
      'data_prevista', v_depois.data_prevista, 'data_realizada', v_depois.data_realizada
    ),
    jsonb_build_object('regra', 'exames_ocupacionais_2c5b', 'funcionario_id', v_depois.funcionario_id),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object('correlation_id', v_correlation_id);
end;
$$;

create or replace function public.arquivar_exame_ocupacional_controlado(
  p_empresa_id uuid,
  p_exame_id uuid,
  p_correlation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes public.df_funcionarios_exames_ocupacionais%rowtype;
  v_depois public.df_funcionarios_exames_ocupacionais%rowtype;
  v_correlation_id text := coalesce(nullif(btrim(p_correlation_id), ''), gen_random_uuid()::text);
begin
  if auth.uid() is null or not public.df_funcionarios_pode_escrever(p_empresa_id) then
    raise exception 'SEM_PERMISSAO';
  end if;

  select * into v_antes
  from public.df_funcionarios_exames_ocupacionais
  where empresa_id = p_empresa_id and id = p_exame_id
  for update;
  if not found then
    raise exception 'EXAME_OCUPACIONAL_NAO_ENCONTRADO';
  end if;
  if v_antes.origem = 'LEGADO' then
    raise exception 'EXAME_OCUPACIONAL_LEGADO_SOMENTE_LEITURA';
  end if;
  if v_antes.arquivado then
    return to_jsonb(v_antes) || jsonb_build_object(
      'codigo', 'EXAME_OCUPACIONAL_JA_ARQUIVADO',
      'idempotente', true,
      'correlation_id', v_correlation_id
    );
  end if;

  update public.df_funcionarios_exames_ocupacionais
  set arquivado = true
  where empresa_id = p_empresa_id and id = p_exame_id
  returning * into v_depois;

  insert into public.df_auditoria_eventos (
    empresa_id, user_id, ator_tipo, modulo, entidade_tipo, entidade_id,
    acao, severidade, origem, status, dados_antes, dados_depois,
    metadados, correlation_id
  ) values (
    p_empresa_id, auth.uid(), 'usuario', 'rh', 'exame_ocupacional', v_depois.id,
    'rh.exame_ocupacional.arquivado', 'info', 'app', 'sucesso',
    jsonb_build_object('arquivado', false),
    jsonb_build_object('arquivado', true, 'arquivado_em', v_depois.arquivado_em),
    jsonb_build_object('regra', 'exames_ocupacionais_2c5b', 'funcionario_id', v_depois.funcionario_id),
    v_correlation_id
  );

  return to_jsonb(v_depois) || jsonb_build_object(
    'codigo', 'EXAME_OCUPACIONAL_ARQUIVADO',
    'idempotente', false,
    'correlation_id', v_correlation_id
  );
end;
$$;

revoke all on function public.registrar_exame_ocupacional_controlado(uuid, uuid, text, text, date, date, text)
  from public, anon, authenticated;
grant execute on function public.registrar_exame_ocupacional_controlado(uuid, uuid, text, text, date, date, text)
  to authenticated;

revoke all on function public.atualizar_exame_ocupacional_controlado(uuid, uuid, text, text, date, date, text)
  from public, anon, authenticated;
grant execute on function public.atualizar_exame_ocupacional_controlado(uuid, uuid, text, text, date, date, text)
  to authenticated;

revoke all on function public.arquivar_exame_ocupacional_controlado(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.arquivar_exame_ocupacional_controlado(uuid, uuid, text)
  to authenticated;

revoke all on function public.df_exames_ocupacionais_set_timestamps_2c5b()
  from public, anon, authenticated;
revoke all on function public.df_exames_ocupacionais_proteger_registro_2c5b()
  from public, anon, authenticated;

do $$
declare
  v_admissionais_legado bigint;
  v_admissionais_novos bigint;
  v_periodicos_legado bigint;
  v_periodicos_novos bigint;
  v_duplicados bigint;
  v_invalidos bigint;
  v_colunas_proibidas text;
begin
  select count(*) into v_admissionais_legado
  from public.df_funcionarios
  where data_exame_admissional is not null;

  select count(*) into v_admissionais_novos
  from public.df_funcionarios_exames_ocupacionais
  where legado_tipo = 'DF_FUNCIONARIO_ADMISSIONAL';

  select count(*) into v_periodicos_legado
  from public.df_funcionarios_exames_periodicos;

  select count(*) into v_periodicos_novos
  from public.df_funcionarios_exames_ocupacionais
  where legado_tipo = 'DF_FUNCIONARIO_EXAME_PERIODICO';

  select count(*) into v_duplicados
  from (
    select empresa_id, legado_tipo, legado_id
    from public.df_funcionarios_exames_ocupacionais
    where legado_tipo is not null and legado_id is not null
    group by empresa_id, legado_tipo, legado_id
    having count(*) > 1
  ) d;

  select count(*) into v_invalidos
  from public.df_funcionarios_exames_ocupacionais
  where tipo = 'DEMISSIONAL' or estado = 'PENDENTE';

  select string_agg(column_name, ', ' order by column_name)
  into v_colunas_proibidas
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'df_funcionarios_exames_ocupacionais'
    and column_name = any (array[
      'cid', 'diagnostico', 'laudo', 'resultado', 'resultado_clinico',
      'observacao_medica', 'documento', 'documento_medico', 'anexo',
      'upload', 'base64', 'link_publico', 'apto_inapto',
      'restricao_medica', 'condicao_saude', 'informacao_clinica'
    ]);

  if v_admissionais_legado <> v_admissionais_novos then
    raise exception 'BACKFILL_ADMISSIONAL_INCOMPLETO:%:%', v_admissionais_legado, v_admissionais_novos;
  end if;
  if v_periodicos_legado <> v_periodicos_novos then
    raise exception 'BACKFILL_PERIODICO_INCOMPLETO:%:%', v_periodicos_legado, v_periodicos_novos;
  end if;
  if v_duplicados <> 0 then
    raise exception 'BACKFILL_EXAMES_OCUPACIONAIS_DUPLICADO:%', v_duplicados;
  end if;
  if v_invalidos <> 0 then
    raise exception 'BACKFILL_EXAMES_OCUPACIONAIS_CRIACAO_INDEVIDA:%', v_invalidos;
  end if;
  if v_colunas_proibidas is not null then
    raise exception 'COLUNAS_CLINICAS_PROIBIDAS:%', v_colunas_proibidas;
  end if;
end $$;

commit;
