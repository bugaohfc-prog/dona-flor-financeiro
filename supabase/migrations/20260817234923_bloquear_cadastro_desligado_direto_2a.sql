begin;

create or replace function public.df_funcionarios_bloquear_desligamento_direto_2a()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'desligado'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    raise exception 'DESLIGAMENTO_CONCLUSAO_BLOQUEADA_ATE_2B';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_df_funcionarios_bloquear_desligamento_direto_2a
  on public.df_funcionarios;
create trigger trg_df_funcionarios_bloquear_desligamento_direto_2a
before insert or update on public.df_funcionarios
for each row
execute function public.df_funcionarios_bloquear_desligamento_direto_2a();

revoke all on function public.df_funcionarios_bloquear_desligamento_direto_2a()
  from public, anon, authenticated;

commit;
