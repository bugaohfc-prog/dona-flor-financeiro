-- Esquema legado minimo para aplicar, em banco efemero, todas as migrations
-- versionadas deste repositorio. Este arquivo e exclusivo de testes e nao e uma
-- migration nem representa um deploy de producao.

create extension if not exists pgcrypto;
create extension if not exists pgtap;

create table public.df_empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Empresa teste',
  cnpj text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.df_filiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A migration historica de receitas inclui uma carga inicial com estes UUIDs.
-- O baseline efemero precisa reproduzir apenas as chaves referenciadas para que
-- toda a cadeia versionada seja exercitada sem depender de dados de producao.
insert into public.df_empresas (id, nome)
values ('4f13dbfc-6da5-4130-b952-4723409a9e01', 'Empresa legado CI');

insert into public.df_filiais (id, empresa_id, nome)
values
  ('11bcb631-98c4-4f8f-90d1-5d73d92dea99', '4f13dbfc-6da5-4130-b952-4723409a9e01', 'Andradina CI'),
  ('4e55f8a6-50f0-4bb2-a4f6-38d2f9a487d2', '4f13dbfc-6da5-4130-b952-4723409a9e01', 'Tres Lagoas CI'),
  ('d5b0a887-e425-4e5d-9edd-517a96eaa26d', '4f13dbfc-6da5-4130-b952-4723409a9e01', 'Paranaiba CI'),
  ('b043a198-411e-4fc8-9e75-92b5e47a4c01', '4f13dbfc-6da5-4130-b952-4723409a9e01', 'Brilho CI');

create table public.df_centros_custo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  nome text not null,
  ativo boolean not null default true
);

create table public.df_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text,
  usuario text,
  email text,
  senha_hash text,
  tipo text,
  loja text,
  pode_pagar boolean default false,
  ativo boolean default true,
  criado_em timestamptz default now(),
  whatsapp text,
  receber_email boolean default false,
  receber_whatsapp boolean default false,
  empresa_id uuid references public.df_empresas(id)
);

create table public.df_usuarios_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  user_id uuid,
  usuario_id uuid,
  email text,
  nome text,
  perfil text not null default 'operador',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.df_usuarios_filiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  usuario_id uuid not null references public.df_usuarios(id),
  filial_id uuid not null references public.df_filiais(id),
  criado_em timestamptz not null default now()
);

create table public.df_usuarios_master (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text
);

create table public.profiles (
  id uuid primary key,
  name text,
  nome text,
  role text,
  status text,
  empresa_id uuid,
  must_change_password boolean default false,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.df_contas_recorrentes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  descricao text not null,
  valor numeric(14,2) not null default 0,
  dia_vencimento integer not null default 1,
  tipo_recorrencia text not null default 'mensal',
  data_inicio date,
  centro_custo_id uuid references public.df_centros_custo(id),
  filial_id uuid references public.df_filiais(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.df_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  user_id uuid,
  descricao text not null default 'Conta teste',
  valor numeric(14,2) not null default 0,
  data_vencimento date not null default current_date,
  vencimento date,
  status text default 'pendente',
  observacao text,
  centro_custo_id uuid references public.df_centros_custo(id),
  filial_id uuid references public.df_filiais(id),
  recorrencia_id uuid references public.df_contas_recorrentes(id),
  excluido boolean not null default false,
  excluido_em timestamptz,
  deletado boolean not null default false,
  deletado_em timestamptz,
  enviar_whatsapp boolean not null default false,
  enviar_email boolean not null default false,
  enviar_push boolean not null default false,
  dias_aviso integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.df_notas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.df_empresas(id),
  user_id uuid,
  titulo text not null default 'Nota teste',
  texto text,
  data date default current_date,
  filial_id uuid references public.df_filiais(id),
  excluido boolean not null default false,
  excluido_em timestamptz,
  deletado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.contas (id uuid primary key default gen_random_uuid(), user_id uuid);
create table public.df_push_tokens (id uuid primary key default gen_random_uuid(), user_id uuid, token text);
create table public.df_planos (id uuid primary key default gen_random_uuid(), nome text, ativo boolean default true);

alter table public.df_empresas enable row level security;
alter table public.df_usuarios enable row level security;
alter table public.df_usuarios_empresas enable row level security;
alter table public.df_usuarios_filiais enable row level security;
alter table public.df_usuarios_master enable row level security;
alter table public.df_contas enable row level security;
alter table public.df_notas enable row level security;
alter table public.df_contas_recorrentes enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;

-- A imagem local do Supabase concede privilegios amplos por default a novas
-- tabelas. O ambiente legado real nao possuia esses grants; neutralizamos o
-- default antes de aplicar as migrations, que concedem apenas o necessario.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.df_usuarios_master m where m.user_id = auth.uid()
  ) or exists (
    select 1 from public.df_usuarios_empresas ue
    where ue.user_id = auth.uid() and lower(ue.perfil) in ('master','owner','superadmin','super_admin')
  );
$$;

create or replace function public.df_usuario_eh_admin(p_empresa_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.df_usuarios_empresas ue
    where ue.empresa_id = p_empresa_id
      and ue.ativo is true
      and (ue.user_id = auth.uid() or lower(ue.email) = lower(auth.jwt() ->> 'email'))
      and lower(ue.perfil) in ('admin','administrador')
  );
$$;

create or replace function public.df_usuario_alvo_eh_master(
  p_user_id uuid,
  p_email text,
  p_usuario_id uuid
)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.df_usuarios_master m
    where m.user_id = p_user_id
       or (p_email is not null and lower(m.email) = lower(p_email))
  );
$$;

create or replace function public.df_funcionarios_pode_escrever(p_empresa_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_master() or public.df_usuario_eh_admin(p_empresa_id);
$$;

create or replace function public.criar_usuario(text,text,text,text,text,text,boolean)
returns uuid language sql as $$ select gen_random_uuid() $$;
create or replace function public.login_usuario(text,text)
returns jsonb language sql as $$ select '{}'::jsonb $$;
create or replace function public.atualizar_data_modificacao()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create or replace function public.bloquear_exclusao_usuario_master()
returns trigger language plpgsql as $$ begin return old; end $$;
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$ begin return new; end $$;
create or replace function public.df_empresas_do_usuario()
returns setof public.df_empresas language sql as $$ select * from public.df_empresas where false $$;

create view public.df_lembretes_hoje as select id, empresa_id from public.df_contas where data_vencimento = current_date;

create policy "df_contas_select_empresa" on public.df_contas for select to authenticated using (true);
create policy "df_contas_insert_empresa_operacional" on public.df_contas for insert to authenticated with check (true);
create policy "df_contas_update_empresa_operacional" on public.df_contas for update to authenticated using (true) with check (true);
create policy "df_contas_delete_admin_master" on public.df_contas for delete to authenticated using (true);
create policy "df_notas_delete_admin_master" on public.df_notas for delete to authenticated using (true);
