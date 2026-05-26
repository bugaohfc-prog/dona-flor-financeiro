-- =========================================================
-- DNA Gestao - Gestao de Pessoas
-- Migration de revisao: cria nucleo do Fechamento de Folha.
--
-- ATENCAO:
-- - Arquivo gerado para aplicacao controlada.
-- - Nao aplicar automaticamente sem pre-flight e rollback revisados.
-- - Cria somente:
--   public.df_folha_competencias
--   public.df_folha_lancamentos
-- - Nao cria frontend, service, hook, menu, rota, exportacao, importacao,
--   integracao com financeiro ou integracao com ferias.
-- - Nao cria df_folha_vales_compras, snapshots ou conferencias detalhadas.
-- - Nao armazenar documentos, anexos, uploads, base64, links publicos,
--   dados medicos, CID, laudos, diagnosticos ou informacoes clinicas.
--
-- Pre-flight sugerido antes de aplicar:
-- 1. Confirmar que public.df_empresas existe:
--    select to_regclass('public.df_empresas') as tabela_empresas;
-- 2. Confirmar que public.df_funcionarios existe:
--    select to_regclass('public.df_funcionarios') as tabela_funcionarios;
-- 3. Confirmar que public.df_filiais existe:
--    select to_regclass('public.df_filiais') as tabela_filiais;
-- 4. Confirmar que as tabelas de folha ainda nao existem:
--    select to_regclass('public.df_folha_competencias') as tabela_competencias;
--    select to_regclass('public.df_folha_lancamentos') as tabela_lancamentos;
-- 5. Confirmar que helper de permissao validado existe:
--    select to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') as helper;
-- 6. Confirmar RLS habilitada e forcada em df_funcionarios:
--    select c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname = 'df_funcionarios';
-- 7. Confirmar rollback disponivel:
--    docs/security/rollback/rollback_df_folha_nucleo_20260526.sql
-- 8. Confirmar que nenhum frontend/service/hook depende das tabelas antes da aplicacao.
-- =========================================================

begin;

do $$
declare
  v_funcionarios_rls boolean;
  v_funcionarios_force_rls boolean;
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_funcionarios') is null then
    raise exception 'Missing table public.df_funcionarios';
  end if;

  if to_regclass('public.df_filiais') is null then
    raise exception 'Missing table public.df_filiais';
  end if;

  if to_regprocedure('public.df_funcionarios_pode_escrever(uuid)') is null then
    raise exception 'Missing helper public.df_funcionarios_pode_escrever(uuid)';
  end if;

  select c.relrowsecurity, c.relforcerowsecurity
    into v_funcionarios_rls, v_funcionarios_force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'df_funcionarios';

  if coalesce(v_funcionarios_rls, false) is distinct from true
     or coalesce(v_funcionarios_force_rls, false) is distinct from true then
    raise exception 'public.df_funcionarios must have RLS enabled and forced before creating payroll core';
  end if;
end $$;

create table if not exists public.df_folha_competencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  competencia text not null,
  status text not null default 'aberta',
  observacao_administrativa text null,
  fechado_em timestamptz null,
  fechado_por uuid null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_folha_competencias_competencia_formato_check
    check (
      competencia ~ '^[0-9]{4}-[0-9]{2}$'
      and substring(competencia from 6 for 2)::integer between 1 and 12
    ),

  constraint df_folha_competencias_status_check
    check (status in (
      'aberta',
      'em_conferencia',
      'validada',
      'enviada_contabilidade',
      'fechada',
      'arquivada'
    )),

  constraint df_folha_competencias_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

create table if not exists public.df_folha_lancamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  competencia_id uuid not null
    references public.df_folha_competencias(id)
    on delete restrict,
  funcionario_id uuid not null
    references public.df_funcionarios(id)
    on delete restrict,
  filial_id uuid null
    references public.df_filiais(id)
    on delete restrict,
  natureza text not null,
  categoria text not null,
  descricao text null,
  data_referencia date null,
  quantidade numeric(12,2) null,
  percentual numeric(7,2) null,
  valor numeric(12,2) null,
  observacao_administrativa text null,
  origem_lancamento text null,
  origem_id uuid null,
  conferido boolean not null default false,
  conferido_em timestamptz null,
  conferido_por uuid null,
  arquivado boolean not null default false,
  arquivado_em timestamptz null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint df_folha_lancamentos_natureza_check
    check (natureza in ('credito', 'desconto', 'informativo')),

  constraint df_folha_lancamentos_categoria_check
    check (categoria in (
      'premiacao',
      'hora_extra_50',
      'hora_extra_60',
      'hora_extra_100',
      'outro_credito',
      'compras_vales',
      'plano_saude',
      'falta_injustificada',
      'pensao_alimenticia',
      'outro_desconto',
      'observacao_administrativa',
      'data_falta',
      'status_conferencia',
      'origem_lancamento'
    )),

  constraint df_folha_lancamentos_natureza_categoria_check
    check (
      (
        natureza = 'credito'
        and categoria in (
          'premiacao',
          'hora_extra_50',
          'hora_extra_60',
          'hora_extra_100',
          'outro_credito'
        )
      )
      or (
        natureza = 'desconto'
        and categoria in (
          'compras_vales',
          'plano_saude',
          'falta_injustificada',
          'pensao_alimenticia',
          'outro_desconto'
        )
      )
      or (
        natureza = 'informativo'
        and categoria in (
          'observacao_administrativa',
          'data_falta',
          'status_conferencia',
          'origem_lancamento'
        )
      )
    ),

  constraint df_folha_lancamentos_valor_nao_negativo_check
    check (valor is null or valor >= 0),

  constraint df_folha_lancamentos_valor_financeiro_check
    check (
      (
        categoria in (
          'premiacao',
          'hora_extra_50',
          'hora_extra_60',
          'hora_extra_100',
          'outro_credito',
          'compras_vales',
          'plano_saude',
          'pensao_alimenticia',
          'outro_desconto'
        )
        and valor is not null
      )
      or categoria in (
        'falta_injustificada',
        'observacao_administrativa',
        'data_falta',
        'status_conferencia',
        'origem_lancamento'
      )
    ),

  constraint df_folha_lancamentos_outros_descricao_check
    check (
      categoria not in ('outro_credito', 'outro_desconto')
      or nullif(btrim(coalesce(descricao, '')), '') is not null
    ),

  constraint df_folha_lancamentos_quantidade_check
    check (quantidade is null or quantidade >= 0),

  constraint df_folha_lancamentos_percentual_check
    check (percentual is null or percentual >= 0),

  constraint df_folha_lancamentos_conferido_em_check
    check (conferido = true or conferido_em is null),

  constraint df_folha_lancamentos_arquivado_em_check
    check (arquivado = true or arquivado_em is null)
);

comment on table public.df_folha_competencias is
  'Gestao de Pessoas: competencias mensais do Fechamento de Folha. Uso administrativo, sujeito a RLS e LGPD. Nao anexar documentos.';

comment on table public.df_folha_lancamentos is
  'Gestao de Pessoas: lancamentos de folha por competencia e funcionario. Nao registrar dados medicos, CID, laudos, diagnosticos, documentos ou informacoes clinicas.';

comment on column public.df_folha_competencias.observacao_administrativa is
  'Uso administrativo. Nao registrar dados medicos, CID, laudos, diagnosticos, documentos, anexos ou informacoes clinicas.';

comment on column public.df_folha_competencias.fechado_por is
  'Identificador do usuario que fechou a competencia. Sem FK nesta primeira migration por falta de padrao unico validado para usuario autor.';

comment on column public.df_folha_lancamentos.observacao_administrativa is
  'Uso administrativo. Nao registrar dados medicos, CID, laudos, diagnosticos, documentos, anexos ou informacoes clinicas.';

comment on column public.df_folha_lancamentos.descricao is
  'Descricao administrativa do lancamento. Nao usar para dados medicos, documentos, laudos, CID, diagnosticos ou informacoes clinicas.';

comment on column public.df_folha_lancamentos.conferido_por is
  'Identificador do usuario que conferiu o lancamento. Sem FK nesta primeira migration por falta de padrao unico validado para usuario autor.';

comment on column public.df_folha_lancamentos.origem_id is
  'Referencia futura opcional para origem do lancamento. Nao cria integracao automatica nesta migration.';

create unique index if not exists uq_df_folha_competencias_empresa_competencia_ativa
on public.df_folha_competencias (empresa_id, competencia)
where arquivado = false;

create index if not exists idx_df_folha_competencias_empresa_id
on public.df_folha_competencias (empresa_id);

create index if not exists idx_df_folha_competencias_competencia
on public.df_folha_competencias (competencia);

create index if not exists idx_df_folha_competencias_status
on public.df_folha_competencias (status);

create index if not exists idx_df_folha_competencias_arquivado
on public.df_folha_competencias (arquivado);

create index if not exists idx_df_folha_competencias_empresa_competencia
on public.df_folha_competencias (empresa_id, competencia);

create index if not exists idx_df_folha_lancamentos_empresa_id
on public.df_folha_lancamentos (empresa_id);

create index if not exists idx_df_folha_lancamentos_competencia_id
on public.df_folha_lancamentos (competencia_id);

create index if not exists idx_df_folha_lancamentos_funcionario_id
on public.df_folha_lancamentos (funcionario_id);

create index if not exists idx_df_folha_lancamentos_categoria
on public.df_folha_lancamentos (categoria);

create index if not exists idx_df_folha_lancamentos_natureza
on public.df_folha_lancamentos (natureza);

create index if not exists idx_df_folha_lancamentos_arquivado
on public.df_folha_lancamentos (arquivado);

create index if not exists idx_df_folha_lancamentos_data_referencia
on public.df_folha_lancamentos (data_referencia);

create or replace function public.df_folha_competencias_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_lancamentos_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
  else
    new.atualizado_em = now();
  end if;

  if new.arquivado = true and new.arquivado_em is null then
    new.arquivado_em = now();
  elsif new.arquivado = false then
    new.arquivado_em = null;
  end if;

  if new.conferido = true and new.conferido_em is null then
    new.conferido_em = now();
  elsif new.conferido = false then
    new.conferido_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_competencias_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_folha_competencias. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_folha_lancamentos_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_folha_lancamentos. Use arquivado=true instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_folha_competencias_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_folha_competencias after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_lancamentos_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_folha_lancamentos after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.df_folha_lancamentos_validar_vinculos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.df_folha_competencias c
    where c.id = new.competencia_id
      and c.empresa_id = new.empresa_id
  ) then
    raise exception 'competencia_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.df_funcionarios f
    where f.id = new.funcionario_id
      and f.empresa_id = new.empresa_id
  ) then
    raise exception 'funcionario_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  if new.filial_id is not null and not exists (
    select 1
    from public.df_filiais fl
    where fl.id = new.filial_id
      and fl.empresa_id = new.empresa_id
  ) then
    raise exception 'filial_id must belong to the same empresa_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_folha_competencias_set_timestamps on public.df_folha_competencias;
create trigger trg_df_folha_competencias_set_timestamps
before insert or update
on public.df_folha_competencias
for each row
execute function public.df_folha_competencias_set_timestamps();

drop trigger if exists trg_df_folha_competencias_bloquear_delete on public.df_folha_competencias;
create trigger trg_df_folha_competencias_bloquear_delete
before delete
on public.df_folha_competencias
for each row
execute function public.df_folha_competencias_bloquear_delete();

drop trigger if exists trg_df_folha_competencias_bloquear_alteracao_empresa on public.df_folha_competencias;
create trigger trg_df_folha_competencias_bloquear_alteracao_empresa
before update
on public.df_folha_competencias
for each row
execute function public.df_folha_competencias_bloquear_alteracao_empresa();

drop trigger if exists trg_df_folha_lancamentos_set_timestamps on public.df_folha_lancamentos;
create trigger trg_df_folha_lancamentos_set_timestamps
before insert or update
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_set_timestamps();

drop trigger if exists trg_df_folha_lancamentos_bloquear_delete on public.df_folha_lancamentos;
create trigger trg_df_folha_lancamentos_bloquear_delete
before delete
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_bloquear_delete();

drop trigger if exists trg_df_folha_lancamentos_bloquear_alteracao_empresa on public.df_folha_lancamentos;
create trigger trg_df_folha_lancamentos_bloquear_alteracao_empresa
before update
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_bloquear_alteracao_empresa();

drop trigger if exists trg_df_folha_lancamentos_validar_vinculos on public.df_folha_lancamentos;
create trigger trg_df_folha_lancamentos_validar_vinculos
before insert or update of empresa_id, competencia_id, funcionario_id, filial_id
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_validar_vinculos();

alter table public.df_folha_competencias enable row level security;
alter table public.df_folha_competencias force row level security;

alter table public.df_folha_lancamentos enable row level security;
alter table public.df_folha_lancamentos force row level security;

revoke all on public.df_folha_competencias from public;
revoke all on public.df_folha_competencias from anon;
grant select, insert, update on public.df_folha_competencias to authenticated;
revoke delete on public.df_folha_competencias from authenticated;

revoke all on public.df_folha_lancamentos from public;
revoke all on public.df_folha_lancamentos from anon;
grant select, insert, update on public.df_folha_lancamentos to authenticated;
revoke delete on public.df_folha_lancamentos from authenticated;

drop policy if exists "df_folha_competencias_select_admin_master" on public.df_folha_competencias;
drop policy if exists "df_folha_competencias_insert_admin_master" on public.df_folha_competencias;
drop policy if exists "df_folha_competencias_update_admin_master" on public.df_folha_competencias;

create policy "df_folha_competencias_select_admin_master"
on public.df_folha_competencias
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_competencias_insert_admin_master"
on public.df_folha_competencias
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_competencias_update_admin_master"
on public.df_folha_competencias
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

drop policy if exists "df_folha_lancamentos_select_admin_master" on public.df_folha_lancamentos;
drop policy if exists "df_folha_lancamentos_insert_admin_master" on public.df_folha_lancamentos;
drop policy if exists "df_folha_lancamentos_update_admin_master" on public.df_folha_lancamentos;

create policy "df_folha_lancamentos_select_admin_master"
on public.df_folha_lancamentos
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_lancamentos_insert_admin_master"
on public.df_folha_lancamentos
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

create policy "df_folha_lancamentos_update_admin_master"
on public.df_folha_lancamentos
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
);

do $$
declare
  unsafe_policies text;
  forbidden_columns text;
begin
  select string_agg(tablename || ':' || policyname || ':' || cmd, ', ' order by tablename, policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in ('df_folha_competencias', 'df_folha_lancamentos')
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on payroll core tables: %', unsafe_policies;
  end if;

  select string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name)
  into forbidden_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('df_folha_competencias', 'df_folha_lancamentos')
    and column_name = any (array[
      'documento',
      'documentos',
      'anexo',
      'anexos',
      'upload',
      'base64',
      'link_publico',
      'laudo',
      'resultado',
      'cid',
      'diagnostico',
      'observacao_medica',
      'informacao_clinica',
      'conta_financeira_id',
      'conta_pagar_id',
      'valor_pagamento',
      'data_pagamento'
    ]);

  if forbidden_columns is not null then
    raise exception 'Forbidden columns found on payroll core tables: %', forbidden_columns;
  end if;
end $$;

-- Checklist pos-aplicacao:
-- 1. Confirmar tabelas criadas:
--    select to_regclass('public.df_folha_competencias') as tabela_competencias;
--    select to_regclass('public.df_folha_lancamentos') as tabela_lancamentos;
-- 2. Confirmar campos principais:
--    select table_name, column_name, data_type, is_nullable, column_default
--    from information_schema.columns
--    where table_schema = 'public'
--      and table_name in ('df_folha_competencias', 'df_folha_lancamentos')
--    order by table_name, ordinal_position;
-- 3. Confirmar RLS habilitada e forcada:
--    select c.relname, c.relrowsecurity, c.relforcerowsecurity
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relname in ('df_folha_competencias', 'df_folha_lancamentos');
-- 4. Confirmar policies SELECT/INSERT/UPDATE e ausencia de DELETE/ALL:
--    select tablename, policyname, cmd
--    from pg_policies
--    where schemaname = 'public'
--      and tablename in ('df_folha_competencias', 'df_folha_lancamentos')
--    order by tablename, policyname;
-- 5. Confirmar triggers principais:
--    select tgrelid::regclass as tabela, tgname
--    from pg_trigger
--    where tgrelid in (
--      'public.df_folha_competencias'::regclass,
--      'public.df_folha_lancamentos'::regclass
--    )
--      and not tgisinternal
--    order by tabela::text, tgname;
-- 6. Confirmar constraints principais:
--    select conrelid::regclass as tabela, conname, contype
--    from pg_constraint
--    where conrelid in (
--      'public.df_folha_competencias'::regclass,
--      'public.df_folha_lancamentos'::regclass
--    )
--    order by tabela::text, conname;
-- 7. Confirmar indices principais:
--    select schemaname, tablename, indexname
--    from pg_indexes
--    where schemaname = 'public'
--      and tablename in ('df_folha_competencias', 'df_folha_lancamentos')
--    order by tablename, indexname;
-- 8. Testar com dados fake que DELETE fisico falha.
-- 9. Testar com dados fake que empresa_id nao pode mudar apos INSERT.
-- 10. Testar com dados fake que competencia_id/funcionario_id/filial_id cross-tenant sao rejeitados.
-- 11. Validar que nao existem campos de documento, anexo, upload, dados medicos ou financeiro.
-- 12. Validar com anon/auth que operador e gerente nao acessam.
-- 13. Validar com anon/auth que admin/master acessam somente empresas permitidas.

commit;
