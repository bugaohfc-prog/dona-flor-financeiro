-- =========================================
-- Dona Flor Financeiro — FASE 10.3
-- Ativação gradual de RLS tenant-aware
-- =========================================
-- Objetivo:
-- 1) Manter a troca real de empresa já validada.
-- 2) Ativar RLS nas tabelas operacionais que possuem empresa_id.
-- 3) NÃO ativar RLS em df_empresas nesta fase para não quebrar o Company Switch.
--
-- Execute no SQL Editor do Supabase.
-- Depois valide login, troca de empresa e CRUD básico.
-- =========================================

begin;

-- Função base usada pelas policies.
-- SECURITY DEFINER evita recursão e mantém a checagem centralizada.
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

-- Função base para operações administrativas em vínculos de usuário.
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
      and lower(coalesce(due.perfil, '')) in ('admin', 'master', 'owner')
  );
$$;

-- Função auxiliar para aplicar RLS padrão em tabelas tenant-aware.
create or replace function public.df_apply_tenant_rls(p_table_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.' || p_table_name) is null then
    raise notice 'Tabela public.% não existe. Ignorando.', p_table_name;
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table_name
      and column_name = 'empresa_id'
  ) then
    raise notice 'Tabela public.% não possui empresa_id. Ignorando.', p_table_name;
    return;
  end if;

  execute format('alter table public.%I enable row level security', p_table_name);

  execute format('drop policy if exists %I on public.%I', p_table_name || '_tenant_select', p_table_name);
  execute format('drop policy if exists %I on public.%I', p_table_name || '_tenant_insert', p_table_name);
  execute format('drop policy if exists %I on public.%I', p_table_name || '_tenant_update', p_table_name);
  execute format('drop policy if exists %I on public.%I', p_table_name || '_tenant_delete', p_table_name);

  execute format(
    'create policy %I on public.%I for select to authenticated using (public.df_usuario_tem_acesso_empresa(empresa_id))',
    p_table_name || '_tenant_select',
    p_table_name
  );

  execute format(
    'create policy %I on public.%I for insert to authenticated with check (public.df_usuario_tem_acesso_empresa(empresa_id))',
    p_table_name || '_tenant_insert',
    p_table_name
  );

  execute format(
    'create policy %I on public.%I for update to authenticated using (public.df_usuario_tem_acesso_empresa(empresa_id)) with check (public.df_usuario_tem_acesso_empresa(empresa_id))',
    p_table_name || '_tenant_update',
    p_table_name
  );

  execute format(
    'create policy %I on public.%I for delete to authenticated using (public.df_usuario_tem_acesso_empresa(empresa_id))',
    p_table_name || '_tenant_delete',
    p_table_name
  );
end;
$$;

-- Tabelas principais do app.
select public.df_apply_tenant_rls('df_contas');
select public.df_apply_tenant_rls('df_notas');
select public.df_apply_tenant_rls('df_centros_custo');

-- Tabelas de configuração/recorrência, quando existirem.
select public.df_apply_tenant_rls('df_configuracoes');
select public.df_apply_tenant_rls('df_configuracoes_alertas');
select public.df_apply_tenant_rls('df_contas_recorrentes');

-- Garante que vínculos de usuário continuem protegidos.
alter table public.df_usuarios_empresas enable row level security;

drop policy if exists "df_usuarios_select_empresa" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_insert_admin" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_update_admin" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_delete_admin" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_insert_empresa" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_update_empresa" on public.df_usuarios_empresas;
drop policy if exists "df_usuarios_delete_empresa" on public.df_usuarios_empresas;

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

-- =========================================
-- Consulta de conferência pós-execução
-- =========================================
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'df_contas',
    'df_notas',
    'df_centros_custo',
    'df_configuracoes',
    'df_configuracoes_alertas',
    'df_contas_recorrentes',
    'df_usuarios_empresas'
  )
order by tablename, policyname;
