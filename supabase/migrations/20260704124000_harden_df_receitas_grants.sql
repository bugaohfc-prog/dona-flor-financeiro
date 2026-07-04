begin;

revoke all on public.df_receitas from public;
revoke all on public.df_receitas from anon;
revoke all on public.df_receitas from authenticated;
grant select, insert, update on public.df_receitas to authenticated;

commit;
