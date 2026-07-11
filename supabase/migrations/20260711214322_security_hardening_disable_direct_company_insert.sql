begin;

drop policy if exists "df_empresas_insert_master_only" on public.df_empresas;
revoke insert on table public.df_empresas from public, anon, authenticated;

commit;
