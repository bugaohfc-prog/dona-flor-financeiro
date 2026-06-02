-- =========================================================
-- DNA Gestao - Auditoria administrativa invisivel
-- Fase 2: audita acoes sensiveis da Lixeira em contas e notas.
--
-- ATENCAO:
-- - Nao cria tela nova.
-- - Nao altera permissoes.
-- - Nao registra SELECT, cliques ou navegacao.
-- - Nao registra descricao, valor, titulo, texto, conteudo ou observacoes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_auditoria_admin') is null then
    raise exception 'Missing table public.df_auditoria_admin';
  end if;

  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;

  if to_regclass('public.df_notas') is null then
    raise exception 'Missing table public.df_notas';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'df_contas'
      and column_name in ('id', 'empresa_id', 'excluido', 'excluido_em')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    raise exception 'Missing required columns on public.df_contas';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'df_notas'
      and column_name in ('id', 'empresa_id', 'excluido', 'excluido_em')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    raise exception 'Missing required columns on public.df_notas';
  end if;
end $$;

create or replace function public.df_auditoria_admin_sanitize_lixeira_financeira()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acao text;
  v_recurso text;
  v_empresa_id uuid;
  v_registro_id uuid;
  v_detalhes jsonb;
begin
  v_recurso := tg_table_name;

  if tg_op = 'UPDATE' then
    if old.excluido is not distinct from new.excluido
      and old.excluido_em is not distinct from new.excluido_em then
      return new;
    end if;

    if coalesce(old.excluido, false) = false and new.excluido = true then
      v_acao := case
        when tg_table_name = 'df_contas' then 'conta_lixeira_enviada'
        when tg_table_name = 'df_notas' then 'nota_lixeira_enviada'
      end;
    elsif old.excluido = true and coalesce(new.excluido, false) = false then
      v_acao := case
        when tg_table_name = 'df_contas' then 'conta_lixeira_restaurada'
        when tg_table_name = 'df_notas' then 'nota_lixeira_restaurada'
      end;
    else
      v_acao := case
        when tg_table_name = 'df_contas' then 'conta_lixeira_status_atualizado'
        when tg_table_name = 'df_notas' then 'nota_lixeira_status_atualizado'
      end;
    end if;

    v_empresa_id := new.empresa_id;
    v_registro_id := new.id;
    v_detalhes := jsonb_build_object(
      'antes', jsonb_build_object(
        'excluido', old.excluido,
        'excluido_em_presente', old.excluido_em is not null
      ),
      'depois', jsonb_build_object(
        'excluido', new.excluido,
        'excluido_em_presente', new.excluido_em is not null
      )
    );

    insert into public.df_auditoria_admin (
      empresa_id,
      user_id,
      acao,
      recurso,
      registro_id,
      origem,
      detalhes
    )
    values (
      v_empresa_id,
      auth.uid(),
      v_acao,
      v_recurso,
      v_registro_id,
      'database_trigger',
      v_detalhes
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    v_acao := case
      when tg_table_name = 'df_contas' then 'conta_lixeira_excluida_definitivo'
      when tg_table_name = 'df_notas' then 'nota_lixeira_excluida_definitivo'
    end;

    v_empresa_id := old.empresa_id;
    v_registro_id := old.id;
    v_detalhes := jsonb_build_object(
      'antes', jsonb_build_object(
        'excluido', old.excluido,
        'excluido_em_presente', old.excluido_em is not null
      ),
      'depois', jsonb_build_object(
        'exclusao_definitiva', true
      )
    );

    insert into public.df_auditoria_admin (
      empresa_id,
      user_id,
      acao,
      recurso,
      registro_id,
      origem,
      detalhes
    )
    values (
      v_empresa_id,
      auth.uid(),
      v_acao,
      v_recurso,
      v_registro_id,
      'database_trigger',
      v_detalhes
    );

    return old;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.df_auditoria_admin_sanitize_lixeira_financeira() from public;
revoke all on function public.df_auditoria_admin_sanitize_lixeira_financeira() from anon;
revoke all on function public.df_auditoria_admin_sanitize_lixeira_financeira() from authenticated;

drop trigger if exists trg_df_contas_auditoria_lixeira on public.df_contas;
create trigger trg_df_contas_auditoria_lixeira
after update or delete
on public.df_contas
for each row
execute function public.df_auditoria_admin_sanitize_lixeira_financeira();

drop trigger if exists trg_df_notas_auditoria_lixeira on public.df_notas;
create trigger trg_df_notas_auditoria_lixeira
after update or delete
on public.df_notas
for each row
execute function public.df_auditoria_admin_sanitize_lixeira_financeira();

-- Garantias defensivas: esta fase nao pode ampliar escrita direta na auditoria.
do $$
declare
  unsafe_policies text;
  unsafe_grants text;
begin
  select string_agg(policyname || ':' || cmd, ', ' order by policyname)
  into unsafe_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'df_auditoria_admin'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE');

  if unsafe_policies is not null then
    raise exception 'Unexpected df_auditoria_admin write policies found: %', unsafe_policies;
  end if;

  select string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type)
  into unsafe_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'df_auditoria_admin'
    and grantee in ('anon', 'authenticated')
    and not (grantee = 'authenticated' and privilege_type = 'SELECT');

  if unsafe_grants is not null then
    raise exception 'Unexpected df_auditoria_admin grants found: %', unsafe_grants;
  end if;
end $$;

commit;
