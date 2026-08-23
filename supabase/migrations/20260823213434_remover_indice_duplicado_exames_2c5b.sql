begin;

do $$
begin
  if to_regclass('public.uq_df_funcionarios_empresa_id_id') is null
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.df_funcionarios'::regclass
         and conname = 'df_funcionarios_empresa_id_id_unique'
     ) then
    raise exception 'DEPENDENCIA_REPARO_INDICE_2C5B_AUSENTE';
  end if;
end $$;

alter table public.df_funcionarios_exames_ocupacionais
  drop constraint df_funcionarios_exames_ocupacionais_funcionario_tenant_fk;

alter table public.df_funcionarios
  drop constraint df_funcionarios_empresa_id_id_unique;

alter table public.df_funcionarios_exames_ocupacionais
  add constraint df_funcionarios_exames_ocupacionais_funcionario_tenant_fk
  foreign key (empresa_id, funcionario_id)
  references public.df_funcionarios(empresa_id, id)
  on update restrict
  on delete restrict;

do $$
declare
  v_indices_iguais bigint;
begin
  if to_regclass('public.uq_df_funcionarios_empresa_id_id') is null then
    raise exception 'INDICE_TENANT_FUNCIONARIO_ORIGINAL_AUSENTE';
  end if;

  select count(*) into v_indices_iguais
  from pg_index i
  where i.indrelid = 'public.df_funcionarios'::regclass
    and i.indisunique
    and i.indpred is null
    and (
      select array_agg(a.attname order by k.ordinality)
      from unnest(i.indkey) with ordinality as k(attnum, ordinality)
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
    ) = array['empresa_id', 'id']::name[];

  if v_indices_iguais <> 1 then
    raise exception 'INDICES_TENANT_FUNCIONARIO_INESPERADOS:%', v_indices_iguais;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.df_funcionarios_exames_ocupacionais'::regclass
      and conname = 'df_funcionarios_exames_ocupacionais_funcionario_tenant_fk'
      and contype = 'f'
      and convalidated
  ) then
    raise exception 'FK_TENANT_EXAME_OCUPACIONAL_INVALIDA';
  end if;
end $$;

commit;
