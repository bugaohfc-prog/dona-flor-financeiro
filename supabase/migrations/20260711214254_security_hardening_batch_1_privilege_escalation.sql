begin;

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.df_usuarios_empresas ue
        where ue.user_id = auth.uid()
          and lower(coalesce(ue.perfil, '')) in ('master', 'owner', 'superadmin', 'super_admin')
      )
      or exists (
        select 1
        from public.df_usuarios_master um
        where um.user_id = auth.uid()
      )
    );
$function$;

revoke all on function public.is_master() from public, anon;
grant execute on function public.is_master() to authenticated, service_role;

revoke insert, update, delete, truncate, references, trigger
on table public.df_usuarios_master
from public, anon, authenticated;

drop policy if exists "df_usuarios_master_insert" on public.df_usuarios_master;
drop policy if exists "df_usuarios_master_update" on public.df_usuarios_master;
drop policy if exists "df_usuarios_master_delete" on public.df_usuarios_master;

create unique index if not exists ux_df_usuarios_master_user_id
on public.df_usuarios_master (user_id)
where user_id is not null;

revoke all on function public.criar_usuario(text, text, text, text, text, text, boolean)
from public, anon, authenticated;

drop policy if exists "df_empresas_insert" on public.df_empresas;
drop policy if exists "df_empresas_insert_master_only" on public.df_empresas;
create policy "df_empresas_insert_master_only"
on public.df_empresas
for insert
to authenticated
with check ((select public.is_master()));

drop policy if exists "Usuario vê sua empresa" on public.df_usuarios_empresas;
drop policy if exists "df usuarios select empresa" on public.df_usuarios_empresas;
drop policy if exists "ver propria empresa" on public.df_usuarios_empresas;

drop policy if exists "Centros por empresa" on public.df_centros_custo;

drop policy if exists "Allow insert for authenticated users" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;

alter view public.df_lembretes_hoje set (security_invoker = true);
revoke all on table public.df_lembretes_hoje from public, anon, authenticated;

commit;
