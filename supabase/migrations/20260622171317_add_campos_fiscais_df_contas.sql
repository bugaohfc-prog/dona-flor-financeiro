alter table public.df_contas
  add column if not exists imposto_tipo text null,
  add column if not exists competencia date null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'df_contas_imposto_tipo_check'
      and conrelid = 'public.df_contas'::regclass
  ) then
    alter table public.df_contas
      add constraint df_contas_imposto_tipo_check
      check (
        imposto_tipo is null
        or imposto_tipo in ('simples_nacional', 'fgts', 'inss', 'outro')
      );
  end if;
end $$;

comment on column public.df_contas.imposto_tipo is 'Classificacao opcional da conta como obrigacao fiscal: simples_nacional, fgts, inss ou outro.';
comment on column public.df_contas.competencia is 'Competencia fiscal opcional da conta. Usar preferencialmente o primeiro dia do mes de competencia.';;
