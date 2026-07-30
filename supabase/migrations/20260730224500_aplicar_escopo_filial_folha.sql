begin;

do $$
begin
  if to_regclass('public.df_folha_lancamentos') is null
    or to_regclass('public.df_folha_lancamento_itens') is null then
    raise exception 'Tabelas financeiras da Folha ausentes para aplicar escopo por filial.';
  end if;

  if to_regprocedure('public.df_usuario_pode_acessar_filial(uuid,uuid)') is null then
    raise exception 'Funcao canonica de escopo por filial ausente.';
  end if;
end;
$$;

drop policy if exists "df_folha_lancamentos_select_admin_master"
  on public.df_folha_lancamentos;
drop policy if exists "df_folha_lancamentos_insert_admin_master"
  on public.df_folha_lancamentos;
drop policy if exists "df_folha_lancamentos_update_admin_master"
  on public.df_folha_lancamentos;

create policy "df_folha_lancamentos_select_admin_master"
on public.df_folha_lancamentos
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_folha_lancamentos_insert_admin_master"
on public.df_folha_lancamentos
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_folha_lancamentos_update_admin_master"
on public.df_folha_lancamentos
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

drop policy if exists "df_folha_lancamento_itens_select_admin_master"
  on public.df_folha_lancamento_itens;
drop policy if exists "df_folha_lancamento_itens_insert_admin_master"
  on public.df_folha_lancamento_itens;
drop policy if exists "df_folha_lancamento_itens_update_admin_master"
  on public.df_folha_lancamento_itens;

create policy "df_folha_lancamento_itens_select_admin_master"
on public.df_folha_lancamento_itens
for select
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_folha_lancamento_itens_insert_admin_master"
on public.df_folha_lancamento_itens
for insert
to authenticated
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

create policy "df_folha_lancamento_itens_update_admin_master"
on public.df_folha_lancamento_itens
for update
to authenticated
using (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
)
with check (
  auth.uid() is not null
  and public.df_funcionarios_pode_escrever(empresa_id)
  and public.df_usuario_pode_acessar_filial(empresa_id, filial_id)
);

do $$
declare
  v_tabela text;
  v_classificacao text;
  v_sem_escopo text;
begin
  for v_tabela in
    select empresa.table_name
    from information_schema.columns empresa
    join information_schema.columns filial
      on filial.table_schema = empresa.table_schema
     and filial.table_name = empresa.table_name
     and filial.column_name = 'filial_id'
    where empresa.table_schema = 'public'
      and empresa.column_name = 'empresa_id'
    order by empresa.table_name
  loop
    v_classificacao := case
      when v_tabela in (
        'df_contas',
        'df_contas_recorrentes',
        'df_receitas',
        'df_folha_lancamentos',
        'df_folha_lancamento_itens'
      ) then 'financeira'
      when v_tabela = 'df_notas' then 'operacional_escopada'
      when v_tabela = 'df_funcionarios' then 'rh_fora_p0_3'
      when v_tabela = 'df_usuarios_filiais' then 'controle_acesso'
      else null
    end;

    if v_classificacao is null then
      raise exception 'Tabela com empresa_id e filial_id sem classificacao P0-3: %',
        v_tabela;
    end if;

    if v_classificacao in ('financeira', 'operacional_escopada') then
      select string_agg(policyname || ':' || cmd, ', ' order by policyname)
      into v_sem_escopo
      from pg_policies
      where schemaname = 'public'
        and tablename = v_tabela
        and cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')
        and (
          coalesce(qual, '') || ' ' || coalesce(with_check, '')
        ) not like '%df_usuario_pode_acessar_filial%';

      if v_sem_escopo is not null then
        raise exception 'Policies sem escopo canonico de filial em %: %',
          v_tabela,
          v_sem_escopo;
      end if;
    end if;
  end loop;

  if has_function_privilege(
    'authenticated',
    'public.df_folha_lancamento_itens_recalcular_lancamento(uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated pode executar recálculo privilegiado da Folha diretamente';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'df_folha_lancamentos',
        'df_folha_lancamento_itens'
      )
      and cmd in ('DELETE', 'ALL')
  ) then
    raise exception 'Policy DELETE ou ALL inesperada nas tabelas financeiras da Folha';
  end if;
end;
$$;

commit;
