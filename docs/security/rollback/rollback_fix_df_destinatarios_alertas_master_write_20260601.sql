-- =========================================================
-- DNA Gestao - E-mail/Notificacoes
-- Rollback do fix:
-- supabase/migrations/20260601173000_fix_df_destinatarios_alertas_master_write.sql
--
-- ATENCAO:
-- - Este rollback restaura as policies de escrita anteriores.
-- - Ele reintroduz a falha conhecida em que Master por vinculo em
--   df_usuarios_empresas pode nao conseguir INSERT/UPDATE.
-- - Usar somente em emergencia e com autorizacao explicita.
-- =========================================================

begin;

do $$
declare
  unsafe_policies text;
begin
  if to_regclass('public.df_destinatarios_alertas') is null then
    raise exception 'Missing table public.df_destinatarios_alertas';
  end if;

  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;

  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;

  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_destinatarios_alertas'
    and cmd in ('DELETE', 'ALL');

  if unsafe_policies is not null then
    raise exception 'Unexpected DELETE/ALL policies on df_destinatarios_alertas before rollback: %', unsafe_policies;
  end if;
end $$;

drop policy if exists "df_destinatarios_alertas_insert_admin_master" on public.df_destinatarios_alertas;
drop policy if exists "df_destinatarios_alertas_update_admin_master" on public.df_destinatarios_alertas;

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

-- Conferencia pos-rollback esperada:
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'df_destinatarios_alertas'
-- order by policyname;

commit;
