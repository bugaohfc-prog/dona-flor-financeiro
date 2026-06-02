-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Fase 1: cria public.df_auditoria_admin e audita destinatarios de alertas.
--
-- ATENCAO:
-- - Arquivo gerado para revisao tecnica.
-- - Nao aplicar automaticamente em producao sem validacao.
-- - Nao registra SELECT, cliques ou navegacao.
-- - Nao registrar dados sensiveis em texto claro.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_empresas') is null then
    raise exception 'Missing table public.df_empresas';
  end if;

  if to_regclass('public.df_usuarios_empresas') is null then
    raise exception 'Missing table public.df_usuarios_empresas';
  end if;

  if to_regclass('public.df_destinatarios_alertas') is null then
    raise exception 'Missing table public.df_destinatarios_alertas';
  end if;

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;
end $$;

create table if not exists public.df_auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  user_id uuid null,
  acao text not null,
  recurso text not null,
  registro_id uuid null,
  origem text not null default 'database_trigger',
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),

  constraint df_auditoria_admin_acao_not_blank
    check (length(btrim(acao)) > 0),

  constraint df_auditoria_admin_recurso_not_blank
    check (length(btrim(recurso)) > 0),

  constraint df_auditoria_admin_origem_not_blank
    check (length(btrim(origem)) > 0),

  constraint df_auditoria_admin_detalhes_object
    check (jsonb_typeof(detalhes) = 'object')
);

comment on table public.df_auditoria_admin is
  'Auditoria administrativa invisivel. Registra metadados de acoes criticas sem painel visual nesta fase.';

comment on column public.df_auditoria_admin.detalhes is
  'Somente metadados sanitizados. Nao registrar CPF, salario, dados medicos, laudos, anexos, documentos, secrets ou conteudo completo de registros.';

create index if not exists idx_df_auditoria_admin_empresa_criado
on public.df_auditoria_admin (empresa_id, criado_em desc);

create index if not exists idx_df_auditoria_admin_recurso_registro
on public.df_auditoria_admin (recurso, registro_id);

create index if not exists idx_df_auditoria_admin_user_id
on public.df_auditoria_admin (user_id);

create or replace function public.df_auditoria_admin_bloquear_update_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit logs are immutable in df_auditoria_admin.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_df_auditoria_admin_bloquear_update on public.df_auditoria_admin;
create trigger trg_df_auditoria_admin_bloquear_update
before update
on public.df_auditoria_admin
for each row
execute function public.df_auditoria_admin_bloquear_update_delete();

drop trigger if exists trg_df_auditoria_admin_bloquear_delete on public.df_auditoria_admin;
create trigger trg_df_auditoria_admin_bloquear_delete
before delete
on public.df_auditoria_admin
for each row
execute function public.df_auditoria_admin_bloquear_update_delete();

create or replace function public.df_auditoria_admin_sanitize_destinatario_alerta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acao text;
  v_detalhes jsonb;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if tg_op = 'INSERT' then
    v_acao := 'destinatario_alerta_criado';
    v_detalhes := jsonb_build_object(
      'ativo', new.ativo,
      'recebe_contas', new.recebe_contas,
      'recebe_notas', new.recebe_notas,
      'recebe_resumo', new.recebe_resumo,
      'email_hash', md5(lower(coalesce(new.email, '')))
    );

    insert into public.df_auditoria_admin (
      empresa_id,
      user_id,
      acao,
      recurso,
      registro_id,
      origem,
      detalhes
    )
    values (
      new.empresa_id,
      v_user_id,
      v_acao,
      'df_destinatarios_alertas',
      new.id,
      'database_trigger',
      v_detalhes
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_acao := case
      when old.ativo is distinct from new.ativo and new.ativo = false then 'destinatario_alerta_inativado'
      when old.ativo is distinct from new.ativo and new.ativo = true then 'destinatario_alerta_reativado'
      else 'destinatario_alerta_atualizado'
    end;

    v_detalhes := jsonb_strip_nulls(jsonb_build_object(
      'antes', jsonb_strip_nulls(jsonb_build_object(
        'ativo', case when old.ativo is distinct from new.ativo then old.ativo end,
        'recebe_contas', case when old.recebe_contas is distinct from new.recebe_contas then old.recebe_contas end,
        'recebe_notas', case when old.recebe_notas is distinct from new.recebe_notas then old.recebe_notas end,
        'recebe_resumo', case when old.recebe_resumo is distinct from new.recebe_resumo then old.recebe_resumo end,
        'email_hash', case when lower(old.email) is distinct from lower(new.email) then md5(lower(coalesce(old.email, ''))) end
      )),
      'depois', jsonb_strip_nulls(jsonb_build_object(
        'ativo', case when old.ativo is distinct from new.ativo then new.ativo end,
        'recebe_contas', case when old.recebe_contas is distinct from new.recebe_contas then new.recebe_contas end,
        'recebe_notas', case when old.recebe_notas is distinct from new.recebe_notas then new.recebe_notas end,
        'recebe_resumo', case when old.recebe_resumo is distinct from new.recebe_resumo then new.recebe_resumo end,
        'email_hash', case when lower(old.email) is distinct from lower(new.email) then md5(lower(coalesce(new.email, ''))) end
      ))
    ));

    if v_detalhes = '{"antes": {}, "depois": {}}'::jsonb or v_detalhes = '{}'::jsonb then
      return new;
    end if;

    insert into public.df_auditoria_admin (
      empresa_id,
      user_id,
      acao,
      recurso,
      registro_id,
      origem,
      detalhes
    )
    values (
      new.empresa_id,
      v_user_id,
      v_acao,
      'df_destinatarios_alertas',
      new.id,
      'database_trigger',
      v_detalhes
    );

    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_df_destinatarios_alertas_auditoria_admin on public.df_destinatarios_alertas;
create trigger trg_df_destinatarios_alertas_auditoria_admin
after insert or update
on public.df_destinatarios_alertas
for each row
execute function public.df_auditoria_admin_sanitize_destinatario_alerta();

alter table public.df_auditoria_admin enable row level security;
alter table public.df_auditoria_admin force row level security;

revoke all on public.df_auditoria_admin from public;
revoke all on public.df_auditoria_admin from anon;
revoke all on public.df_auditoria_admin from authenticated;
grant select on public.df_auditoria_admin to authenticated;

drop policy if exists "df_auditoria_admin_select_admin_master" on public.df_auditoria_admin;

create policy "df_auditoria_admin_select_admin_master"
on public.df_auditoria_admin
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

-- Intencionalmente nao ha policy de INSERT, UPDATE, DELETE ou ALL para usuarios.
-- Inserts sao feitos por trigger SECURITY DEFINER com payload sanitizado.
-- UPDATE e DELETE tambem sao bloqueados por trigger de imutabilidade.

do $$
declare
  unexpected_policies text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unexpected_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_auditoria_admin'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

  if unexpected_policies is not null then
    raise exception 'Unexpected df_auditoria_admin write policies found: %', unexpected_policies;
  end if;
end $$;

commit;
