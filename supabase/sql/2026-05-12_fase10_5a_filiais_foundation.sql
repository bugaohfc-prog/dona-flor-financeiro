-- FASE 10.5A — FILIAIS FOUNDATION
-- Dona Flor Financeiro
-- Objetivo: criar camada de filiais/unidades por empresa sem alterar contas/notas ainda.

-- =========================================================
-- 1. EXTENSÃO PARA UUID
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 2. TABELA DE FILIAIS
-- =========================================================

create table if not exists df_filiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references df_empresas(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Evita filiais duplicadas dentro da mesma empresa.
create unique index if not exists df_filiais_empresa_nome_unique
on df_filiais (empresa_id, lower(nome));

create index if not exists df_filiais_empresa_id_idx
on df_filiais (empresa_id);

-- =========================================================
-- 3. RLS TENANT-AWARE
-- =========================================================

alter table df_filiais enable row level security;

drop policy if exists "df_filiais_tenant_select" on df_filiais;
drop policy if exists "df_filiais_tenant_insert" on df_filiais;
drop policy if exists "df_filiais_tenant_update" on df_filiais;
drop policy if exists "df_filiais_tenant_delete" on df_filiais;

create policy "df_filiais_tenant_select"
on df_filiais
for select
using (
  exists (
    select 1
    from df_usuarios_empresas u
    where u.empresa_id = df_filiais.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_filiais_tenant_insert"
on df_filiais
for insert
with check (
  exists (
    select 1
    from df_usuarios_empresas u
    where u.empresa_id = df_filiais.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_filiais_tenant_update"
on df_filiais
for update
using (
  exists (
    select 1
    from df_usuarios_empresas u
    where u.empresa_id = df_filiais.empresa_id
      and u.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from df_usuarios_empresas u
    where u.empresa_id = df_filiais.empresa_id
      and u.user_id = auth.uid()
  )
);

create policy "df_filiais_tenant_delete"
on df_filiais
for delete
using (
  exists (
    select 1
    from df_usuarios_empresas u
    where u.empresa_id = df_filiais.empresa_id
      and u.user_id = auth.uid()
  )
);

-- =========================================================
-- 4. VALIDAÇÃO
-- =========================================================

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where tablename = 'df_filiais';
