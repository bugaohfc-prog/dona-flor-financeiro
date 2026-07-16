begin;

-- 1) Tabela legada de usuários: somente leitura limitada ao próprio registro e sem exposição do hash de senha.
drop policy if exists "df_usuarios_insert" on public.df_usuarios;
drop policy if exists "df_usuarios_update" on public.df_usuarios;
drop policy if exists "df_usuarios_delete" on public.df_usuarios;
drop policy if exists "df_usuarios_select" on public.df_usuarios;

create policy "df_usuarios_select_own_legacy"
on public.df_usuarios
for select
to authenticated
using (
  auth.uid() is not null
  and (
    id = auth.uid()
    or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

revoke all on table public.df_usuarios from public, anon, authenticated;
grant select (
  id, nome, usuario, email, tipo, loja, pode_pagar, ativo, criado_em,
  whatsapp, receber_email, receber_whatsapp, empresa_id
) on table public.df_usuarios to authenticated;

-- 2) Profiles: usuário pode manter apenas dados pessoais, nunca role/status/empresa/flag de senha.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, name, nome) on table public.profiles to authenticated;
grant update (name, nome, last_login_at, updated_at) on table public.profiles to authenticated;

-- Mantém as policies próprias já existentes, agora combinadas com grants por coluna.

-- 3) Empresa: leitura para membros; alteração e exclusão somente Admin da empresa ou Master global.
drop policy if exists "df_empresas_update" on public.df_empresas;
drop policy if exists "df_empresas_delete" on public.df_empresas;

create policy "df_empresas_update_admin_master"
on public.df_empresas
for update
to authenticated
using (
  (select public.is_master())
  or public.df_usuario_eh_admin(id)
)
with check (
  (select public.is_master())
  or public.df_usuario_eh_admin(id)
);

create policy "df_empresas_delete_admin_master"
on public.df_empresas
for delete
to authenticated
using (
  (select public.is_master())
  or public.df_usuario_eh_admin(id)
);

revoke select, update, delete, truncate, references, trigger
on table public.df_empresas from public, anon;
revoke truncate, references, trigger
on table public.df_empresas from authenticated;

-- 4) Registro legado de Master não deve ser visível nem manipulável por anon.
revoke all on table public.df_usuarios_master from public, anon;
grant select on table public.df_usuarios_master to authenticated;

commit;;
