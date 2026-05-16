-- =========================================================
-- FASE 11.9.1 — AUTH MANUAL PROVISIONING DEPLOY KIT
-- Dona Flor Financeiro
-- Objetivo: preparar banco para criação manual de usuário com e-mail + senha provisória.
-- Script idempotente: pode rodar mais de uma vez.
-- =========================================================

-- Profiles: mantém compatibilidade com versões que usam name e/ou nome.
alter table if exists public.profiles
  add column if not exists nome text;

alter table if exists public.profiles
  add column if not exists name text;

alter table if exists public.profiles
  add column if not exists status text default 'ativo';

alter table if exists public.profiles
  add column if not exists role text default 'leitura';

alter table if exists public.profiles
  add column if not exists empresa_id uuid;

alter table if exists public.profiles
  add column if not exists must_change_password boolean default false;

alter table if exists public.profiles
  add column if not exists created_by uuid;

alter table if exists public.profiles
  add column if not exists last_login_at timestamptz;

alter table if exists public.profiles
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_profiles_empresa_id on public.profiles (empresa_id);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);

-- Vínculo usuário x empresa: garante campos usados pela tela Usuários.
alter table if exists public.df_usuarios_empresas
  add column if not exists user_id uuid;

alter table if exists public.df_usuarios_empresas
  add column if not exists empresa_id uuid;

alter table if exists public.df_usuarios_empresas
  add column if not exists email text;

alter table if exists public.df_usuarios_empresas
  add column if not exists nome text;

alter table if exists public.df_usuarios_empresas
  add column if not exists perfil text default 'operador';

alter table if exists public.df_usuarios_empresas
  add column if not exists status text default 'ativo';

alter table if exists public.df_usuarios_empresas
  add column if not exists created_at timestamptz default now();

alter table if exists public.df_usuarios_empresas
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_df_usuarios_empresas_empresa_id on public.df_usuarios_empresas (empresa_id);
create index if not exists idx_df_usuarios_empresas_user_id on public.df_usuarios_empresas (user_id);
create index if not exists idx_df_usuarios_empresas_email on public.df_usuarios_empresas (lower(email));
create index if not exists idx_df_usuarios_empresas_perfil on public.df_usuarios_empresas (perfil);

-- Evita duplicidade do mesmo e-mail na mesma empresa, quando a tabela já existe e está consistente.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'df_usuarios_empresas'
  ) then
    if not exists (
      select 1 from pg_indexes
      where schemaname = 'public'
        and indexname = 'uq_df_usuarios_empresas_empresa_email'
    ) then
      create unique index uq_df_usuarios_empresas_empresa_email
      on public.df_usuarios_empresas (empresa_id, lower(email))
      where email is not null and empresa_id is not null;
    end if;
  end if;
end $$;

-- Função usada pelas Edge Functions para confirmar se o usuário logado pode administrar usuários.
-- Mantém compatibilidade: admin/master/owner/administrador no vínculo da empresa ou tabela master.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.user_id = auth.uid()
      and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'master', 'owner')
  )
  or exists (
    select 1
    from public.df_usuarios_empresas ue
    where lower(coalesce(ue.email, '')) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      and lower(coalesce(ue.perfil, '')) in ('admin', 'adm', 'administrador', 'master', 'owner')
  )
  or exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'df_usuarios_master'
  ) and exists (
    select 1
    from public.df_usuarios_master m
    where lower(coalesce(m.email, '')) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Validação rápida.
select 'auth_manual_provisioning_ok' as status;
