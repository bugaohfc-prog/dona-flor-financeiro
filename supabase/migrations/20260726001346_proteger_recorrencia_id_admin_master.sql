begin;

do $validation$
begin
  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;
  if to_regprocedure('public.is_master()') is null then
    raise exception 'Missing helper public.is_master()';
  end if;
  if to_regprocedure('public.df_usuario_eh_admin(uuid)') is null then
    raise exception 'Missing helper public.df_usuario_eh_admin(uuid)';
  end if;
end;
$validation$;

create or replace function public.proteger_df_contas_recorrencia_id_admin_master()
returns trigger
language plpgsql
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if new.recorrencia_id is not distinct from old.recorrencia_id then
    return new;
  end if;

  if (select auth.uid()) is null then
    raise exception using
      errcode = '42501',
      message = 'Autenticacao obrigatoria para alterar recorrencia_id.';
  end if;

  if not (
    (select public.is_master())
    or (
      public.df_usuario_eh_admin(old.empresa_id)
      and public.df_usuario_eh_admin(new.empresa_id)
    )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Somente Admin ou Master pode alterar recorrencia_id.';
  end if;

  return new;
end;
$function$;

revoke all on function public.proteger_df_contas_recorrencia_id_admin_master()
from public, anon, authenticated;

drop trigger if exists proteger_df_contas_recorrencia_id_admin_master
on public.df_contas;

create trigger proteger_df_contas_recorrencia_id_admin_master
before update of recorrencia_id
on public.df_contas
for each row
when (old.recorrencia_id is distinct from new.recorrencia_id)
execute function public.proteger_df_contas_recorrencia_id_admin_master();

comment on function public.proteger_df_contas_recorrencia_id_admin_master() is
'Bloqueia alteracoes de df_contas.recorrencia_id para perfis que nao sejam Admin ou Master.';

commit;
