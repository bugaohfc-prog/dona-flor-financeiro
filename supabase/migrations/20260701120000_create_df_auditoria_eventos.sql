-- =========================================================
-- DNA Gestao - Auditoria operacional futura
-- Fase 1: cria public.df_auditoria_eventos sem inserir eventos reais.
--
-- ATENCAO:
-- - Nao cria tela.
-- - Nao altera frontend, services/hooks ou scripts.
-- - Nao cria triggers em tabelas operacionais.
-- - Nao altera public.df_auditoria_admin.
-- - Nao registra eventos reais nesta fase.
-- =========================================================

begin;

create table public.df_auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid null,
  ator_tipo text not null,
  ator_email_hash text null,
  modulo text not null,
  entidade_tipo text not null,
  entidade_id uuid null,
  acao text not null,
  severidade text not null default 'info',
  origem text not null,
  status text not null default 'sucesso',
  motivo text null,
  dados_antes jsonb null,
  dados_depois jsonb null,
  metadados jsonb null,
  correlation_id text null,
  criado_em timestamptz not null default now(),

  constraint df_auditoria_eventos_empresa_fk
    foreign key (empresa_id)
    references public.df_empresas(id)
    on delete restrict,

  constraint df_auditoria_eventos_ator_tipo_check
    check (ator_tipo in (
      'usuario',
      'edge_function',
      'script',
      'database_trigger',
      'sistema'
    )),

  constraint df_auditoria_eventos_modulo_check
    check (modulo in (
      'financeiro',
      'usuarios',
      'empresas',
      'rh',
      'seguranca',
      'automacao',
      'sistema'
    )),

  constraint df_auditoria_eventos_severidade_check
    check (severidade in ('info', 'warning', 'critical')),

  constraint df_auditoria_eventos_origem_check
    check (origem in (
      'app',
      'edge_function',
      'database_trigger',
      'script',
      'manual',
      'sistema'
    )),

  constraint df_auditoria_eventos_status_check
    check (status in ('sucesso', 'falha', 'bloqueado')),

  constraint df_auditoria_eventos_acao_not_blank
    check (length(btrim(acao)) > 0),

  constraint df_auditoria_eventos_entidade_tipo_not_blank
    check (length(btrim(entidade_tipo)) > 0),

  constraint df_auditoria_eventos_origem_not_blank
    check (length(btrim(origem)) > 0),

  constraint df_auditoria_eventos_acao_formato_check
    check (acao ~ '^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$'),

  constraint df_auditoria_eventos_dados_antes_object
    check (dados_antes is null or jsonb_typeof(dados_antes) = 'object'),

  constraint df_auditoria_eventos_dados_depois_object
    check (dados_depois is null or jsonb_typeof(dados_depois) = 'object'),

  constraint df_auditoria_eventos_metadados_object
    check (metadados is null or jsonb_typeof(metadados) = 'object')
);

comment on table public.df_auditoria_eventos is
  'Auditoria operacional futura do DNA Gestao. Registra eventos sanitizados por empresa, modulo, entidade e acao, sem substituir public.df_auditoria_admin.';

comment on column public.df_auditoria_eventos.ator_email_hash is
  'Hash do e-mail do ator quando necessario. Nao armazenar e-mail em texto claro.';

comment on column public.df_auditoria_eventos.dados_antes is
  'Estado anterior sanitizado. Nao armazenar payload completo, CPF, senha, token, secret, dados medicos, laudos, CID, anexos, base64, links sensiveis ou observacoes sensiveis.';

comment on column public.df_auditoria_eventos.dados_depois is
  'Estado posterior sanitizado. Nao armazenar payload completo, CPF, senha, token, secret, dados medicos, laudos, CID, anexos, base64, links sensiveis ou observacoes sensiveis.';

comment on column public.df_auditoria_eventos.metadados is
  'Metadados auxiliares sanitizados. Nao armazenar secrets, tokens, links sensiveis, base64, anexos ou request completo.';

create index idx_df_auditoria_eventos_empresa_criado
on public.df_auditoria_eventos (empresa_id, criado_em desc);

create index idx_df_auditoria_eventos_empresa_modulo_criado
on public.df_auditoria_eventos (empresa_id, modulo, criado_em desc);

create index idx_df_auditoria_eventos_empresa_entidade_criado
on public.df_auditoria_eventos (empresa_id, entidade_tipo, entidade_id, criado_em desc)
where entidade_id is not null;

create index idx_df_auditoria_eventos_empresa_user_criado
on public.df_auditoria_eventos (empresa_id, user_id, criado_em desc)
where user_id is not null;

create index idx_df_auditoria_eventos_correlation_id
on public.df_auditoria_eventos (correlation_id)
where correlation_id is not null;

create or replace function public.df_auditoria_eventos_bloquear_update_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit logs are immutable in df_auditoria_eventos.'
    using errcode = '42501';
end;
$$;

create trigger trg_df_auditoria_eventos_bloquear_update
before update
on public.df_auditoria_eventos
for each row
execute function public.df_auditoria_eventos_bloquear_update_delete();

create trigger trg_df_auditoria_eventos_bloquear_delete
before delete
on public.df_auditoria_eventos
for each row
execute function public.df_auditoria_eventos_bloquear_update_delete();

alter table public.df_auditoria_eventos enable row level security;
alter table public.df_auditoria_eventos force row level security;

revoke all on public.df_auditoria_eventos from public;
revoke all on public.df_auditoria_eventos from anon;
revoke all on public.df_auditoria_eventos from authenticated;

grant select on public.df_auditoria_eventos to authenticated;

create policy "df_auditoria_eventos_select_admin_master"
on public.df_auditoria_eventos
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select public.is_master())
    or public.df_usuario_eh_admin(empresa_id)
  )
);

do $$
declare
  unsafe_policies text;
  unsafe_grants text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_auditoria_eventos'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

  if unsafe_policies is not null then
    raise exception 'Unexpected df_auditoria_eventos write policies found: %', unsafe_policies;
  end if;

  select string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type)
  into unsafe_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_auditoria_eventos'
    and (
      grantee = 'anon'
      or (
        grantee = 'authenticated'
        and privilege_type <> 'SELECT'
      )
    );

  if unsafe_grants is not null then
    raise exception 'Unexpected df_auditoria_eventos grants found: %', unsafe_grants;
  end if;
end $$;

commit;
