begin;

do $$
begin
  if to_regprocedure(
    'public.df_funcionario_filial_na_data_lote3(uuid,uuid,date)'
  ) is null then
    raise exception 'FUNCAO_LOTACAO_FILIAL_FOLHA_AUSENTE';
  end if;
end $$;

alter function public.df_funcionario_filial_na_data_lote3(uuid, uuid, date)
  security invoker;

revoke all on function public.df_funcionario_filial_na_data_lote3(uuid, uuid, date)
  from public, anon, authenticated, service_role;

grant execute on function public.df_funcionario_filial_na_data_lote3(uuid, uuid, date)
  to authenticated, service_role;

commit;
