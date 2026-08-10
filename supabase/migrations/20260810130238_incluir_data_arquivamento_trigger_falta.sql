begin;

drop trigger if exists trg_df_folha_lancamentos_validar_vinculos
on public.df_folha_lancamentos;

create trigger trg_df_folha_lancamentos_validar_vinculos
before insert or update of
  empresa_id,
  competencia_id,
  funcionario_id,
  filial_id,
  categoria,
  data_referencia,
  arquivado
on public.df_folha_lancamentos
for each row
execute function public.df_folha_lancamentos_validar_vinculos();

drop trigger if exists trg_df_folha_lancamento_itens_validar_vinculos
on public.df_folha_lancamento_itens;

create trigger trg_df_folha_lancamento_itens_validar_vinculos
before insert or update of
  empresa_id,
  competencia_id,
  lancamento_id,
  funcionario_id,
  filial_id,
  categoria,
  data_referencia,
  arquivado
on public.df_folha_lancamento_itens
for each row
execute function public.df_folha_lancamento_itens_validar_vinculos();

commit;
