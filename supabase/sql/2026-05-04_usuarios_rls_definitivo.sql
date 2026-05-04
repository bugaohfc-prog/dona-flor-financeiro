-- DF Gestão Financeira — usuários, vínculo automático e RLS sem recursão
-- Execute no SQL Editor do Supabase conectado ao projeto correto.
-- Esta base assume a tabela public.df_usuarios_empresas já usada pelo app.

begin;

create extension if not exists pgcrypto;

create table if not exists public.df_usuarios_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid null references auth.users(id) on delete cascade,
  email text not null,
  nome text null,
  perfil text not null default 'operador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint df_usuarios_empresas_perfil_check check (perfil in ('admin', 'gerente', 'operador'))
);

alter table public.df_usuarios_empresas
  add column if not exists email text,
  add column if not exists nome text,
  add column if not exists perfil text default 'operador',
  add column if not exists updated_at timestamptz default now();

update public.df_usuarios_empresas
set email = lower(trim(email))
where email is not null;

update public.df_usuarios_empresas
set perfil = case
  when lower(trim(perfil)) in ('admin', 'adm', 'administrador', 'master', 'owner') then 'admin'
  when lower(trim(perfil)) in ('gerente', 'gerencia', 'gestor', 'manager') then 'gerente'
  else 'operador'
end
where perfil is not null;

create unique index if not exists df_usuarios_empresas_empresa_email_uidx
  on public.df_usuarios_empresas (empresa_id, lower(email));

create unique index if not exists df_usuarios_empresas_empresa_user_uidx
  on public.df_usuarios_empresas (empresa_id, user_id)
  where user_id is not null;

create or replace function public.df_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_df_usuarios_empresas_touch on public.df_usuarios_empresas;
create trigger trg_df_usuarios_empresas_touch
before update on public.df_usuarios_empresas
for each row execute function public.df_touch_updated_at();

create or replace function public.df_usuario_e_admin_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.df_usuarios_empresas due
    where due.empresa_id = p_empresa_id
      and due.user_id = auth.uid()
      and due.perfil = 'admin'
  );
$$;

create or replace function public.df_usuario_tem_acesso_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.df_usuarios_empresas due
    where due.empresa_id = p_empresa_id
      and due.user_id = auth.uid()
  );
$$;

create or replace function public.df_vincular_usuario_por_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.df_usuarios_empresas due
     set user_id = new.id,
         email = lower(trim(new.email)),
         updated_at = now()
   where due.user_id is null
     and lower(trim(due.email)) = lower(trim(new.email));

  return new;
end;
$$;

drop trigger if exists trg_df_vincular_usuario_por_email on auth.users;
create trigger trg_df_vincular_usuario_por_email
after insert or update of email on auth.users
for each row execute function public.df_vincular_usuario_por_email();

-- Vincula usuários que já existem no Auth com pré-cadastros pendentes.
update public.df_usuarios_empresas due
set user_id = au.id,
    updated_at = now()
from auth.users au
where due.user_id is null
  and lower(trim(due.email)) = lower(trim(au.email));

alter table public.df_usuarios_empresas enable row level security;

drop policy if exists "df_usuarios_select_empresa" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_insert_admin" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_update_admin" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_delete_admin" on public.df_usuarios_empresas;

drop policy if exists "usuarios_select_empresa" on public.df_usuarios_empresas;
drop policy if exists "usuarios_insert_admin" on public.df_usuarios_empresas;
drop policy if exists "usuarios_update_admin" on public.df_usuarios_empresas;
drop policy if exists "usuarios_delete_admin" on public.df_usuarios_empresas;

create policy "df_usuarios_select_empresa"
on public.df_usuarios_empresas
for select
to authenticated
using (
  user_id = auth.uid()
  or public.df_usuario_tem_acesso_empresa(empresa_id)
);

create policy "df_usuarios_insert_admin"
on public.df_usuarios_empresas
for insert
to authenticated
with check (
  public.df_usuario_e_admin_empresa(empresa_id)
);

create policy "df_usuarios_update_admin"
on public.df_usuarios_empresas
for update
to authenticated
using (
  public.df_usuario_e_admin_empresa(empresa_id)
)
with check (
  public.df_usuario_e_admin_empresa(empresa_id)
);

create policy "df_usuarios_delete_admin"
on public.df_usuarios_empresas
for delete
to authenticated
using (
  public.df_usuario_e_admin_empresa(empresa_id)
  and coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> auth.uid()
);

commit;
