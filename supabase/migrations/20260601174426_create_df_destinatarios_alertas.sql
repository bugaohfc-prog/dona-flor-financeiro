-- =========================================================
-- DNA Gestao - E-mail/Notificacoes
-- Migration de revisao: cria public.df_destinatarios_alertas com RLS.
--
-- ATENCAO:
-- - Arquivo gerado para revisao tecnica.
-- - Nao aplicar automaticamente em producao.
-- - Validar primeiro em homologacao com testes negativos de RLS.
-- - Destinatarios de alerta nao sao usuarios do sistema.
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

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;
end $$;

create table if not exists public.df_destinatarios_alertas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null
    references public.df_empresas(id)
    on delete restrict,
  nome text null,
  email text not null,
  ativo boolean not null default true,
  recebe_contas boolean not null default true,
  recebe_notas boolean not null default true,
  recebe_resumo boolean not null default true,
  observacao text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null,
  atualizado_por uuid null,

  constraint df_destinatarios_alertas_email_not_blank
    check (length(btrim(email)) > 0),

  constraint df_destinatarios_alertas_email_formato_check
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),

  constraint df_destinatarios_alertas_nome_not_blank
    check (nome is null or length(btrim(nome)) > 0),

  constraint df_destinatarios_alertas_observacao_not_blank
    check (observacao is null or length(btrim(observacao)) > 0)
);

comment on table public.df_destinatarios_alertas is
  'E-mail/Notificacoes: destinatarios de alertas por empresa. Nao concede acesso ao sistema.';

comment on column public.df_destinatarios_alertas.email is
  'E-mail autorizado a receber alertas automaticos da empresa. Nao implica usuario do sistema.';

comment on column public.df_destinatarios_alertas.observacao is
  'Observacao administrativa curta. Nao registrar dados sensiveis, senhas, documentos ou informacoes pessoais desnecessarias.';

comment on column public.df_destinatarios_alertas.criado_por is
  'Identificador do usuario autenticado que criou o destinatario, quando disponivel. Sem FK nesta primeira migration por falta de padrao unico validado para usuario autor.';

comment on column public.df_destinatarios_alertas.atualizado_por is
  'Identificador do usuario autenticado que atualizou o destinatario, quando disponivel. Sem FK nesta primeira migration por falta de padrao unico validado para usuario autor.';

create index if not exists idx_df_destinatarios_alertas_empresa_id
on public.df_destinatarios_alertas (empresa_id);

create index if not exists idx_df_destinatarios_alertas_empresa_ativo
on public.df_destinatarios_alertas (empresa_id, ativo);

create unique index if not exists uq_df_destinatarios_alertas_empresa_email
on public.df_destinatarios_alertas (empresa_id, lower(email));

create or replace function public.df_destinatarios_alertas_set_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em = coalesce(new.criado_em, now());
    new.atualizado_em = coalesce(new.atualizado_em, now());
    new.criado_por = coalesce(new.criado_por, auth.uid());
    new.atualizado_por = coalesce(new.atualizado_por, auth.uid());
  else
    new.atualizado_em = now();
    new.atualizado_por = coalesce(auth.uid(), new.atualizado_por);
  end if;

  new.email = lower(btrim(new.email));
  new.nome = nullif(btrim(new.nome), '');
  new.observacao = nullif(btrim(new.observacao), '');

  return new;
end;
$$;

create or replace function public.df_destinatarios_alertas_bloquear_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Physical DELETE is blocked for df_destinatarios_alertas. Use ativo=false instead.'
    using errcode = '42501';
end;
$$;

create or replace function public.df_destinatarios_alertas_bloquear_alteracao_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id cannot be changed for df_destinatarios_alertas after insert'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_destinatarios_alertas_set_timestamps on public.df_destinatarios_alertas;
create trigger trg_df_destinatarios_alertas_set_timestamps
before insert or update
on public.df_destinatarios_alertas
for each row
execute function public.df_destinatarios_alertas_set_timestamps();

drop trigger if exists trg_df_destinatarios_alertas_bloquear_delete on public.df_destinatarios_alertas;
create trigger trg_df_destinatarios_alertas_bloquear_delete
before delete
on public.df_destinatarios_alertas
for each row
execute function public.df_destinatarios_alertas_bloquear_delete();

drop trigger if exists trg_df_destinatarios_alertas_bloquear_alteracao_empresa on public.df_destinatarios_alertas;
create trigger trg_df_destinatarios_alertas_bloquear_alteracao_empresa
before update
on public.df_destinatarios_alertas
for each row
execute function public.df_destinatarios_alertas_bloquear_alteracao_empresa();

alter table public.df_destinatarios_alertas enable row level security;
alter table public.df_destinatarios_alertas force row level security;

revoke all on public.df_destinatarios_alertas from public;
revoke all on public.df_destinatarios_alertas from anon;
grant select, insert, update on public.df_destinatarios_alertas to authenticated;
revoke delete on public.df_destinatarios_alertas from authenticated;

drop policy if exists "df_destinatarios_alertas_select_empresa" on public.df_destinatarios_alertas;
drop policy if exists "df_destinatarios_alertas_insert_admin_master" on public.df_destinatarios_alertas;
drop policy if exists "df_destinatarios_alertas_update_admin_master" on public.df_destinatarios_alertas;

create policy "df_destinatarios_alertas_select_empresa"
on public.df_destinatarios_alertas
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = df_destinatarios_alertas.empresa_id
        and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'gerente', 'master', 'owner', 'superadmin', 'super_admin')
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
);

create policy "df_destinatarios_alertas_insert_admin_master"
on public.df_destinatarios_alertas
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

create policy "df_destinatarios_alertas_update_admin_master"
on public.df_destinatarios_alertas
for update
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
)
with check (
  auth.uid() is not null
  and (
    public.is_master()
    or public.df_usuario_eh_admin(empresa_id)
  )
);

-- Intencionalmente nao ha policy de DELETE.
-- O DELETE fisico tambem e bloqueado pelo trigger trg_df_destinatarios_alertas_bloquear_delete.
-- Inativacao deve ser feita por UPDATE com ativo=false.

do $$
declare
  unexpected_delete_policies text;
begin
  select string_agg(policyname, ', ' order by policyname)
  into unexpected_delete_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_destinatarios_alertas'
    and cmd = 'DELETE';

  if unexpected_delete_policies is not null then
    raise exception 'Unexpected df_destinatarios_alertas DELETE policies found: %', unexpected_delete_policies;
  end if;
end $$;

-- Checklist manual obrigatorio antes de liberar service/frontend:
-- 1. Operador nao deve conseguir SELECT, INSERT, UPDATE ou DELETE.
-- 2. Gerente deve conseguir apenas SELECT dentro da empresa, conforme regra atual de Configuracoes.
-- 3. Admin deve conseguir SELECT, INSERT e UPDATE dentro da empresa.
-- 4. Master deve operar conforme regra atual do projeto, mantendo filtro de empresa ativa no service/UI.
-- 5. Usuario de outra empresa nao deve ver nem alterar destinatarios.
-- 6. DELETE fisico deve falhar; usar ativo=false.
-- 7. Alterar empresa_id de destinatario existente deve falhar.
-- 8. E-mail duplicado na mesma empresa deve falhar.
-- 9. Nao criar frontend antes da RLS ser validada.
-- 10. Nao alterar GitHub Actions antes de validar leitura segura por empresa.

commit;;
