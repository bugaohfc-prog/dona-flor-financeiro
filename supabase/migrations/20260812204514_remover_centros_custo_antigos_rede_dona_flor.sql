-- Remove exclusivamente centros de custo legados sem referencias da Rede Dona Flor.

select pg_advisory_xact_lock(
  hashtextextended('sanear-centros-custo:4f13dbfc-6da5-4130-b952-4723409a9e01', 0)
);

do $$
declare
  v_empresa_id constant uuid := '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid;
  v_nomes constant text[] := array[
    'RH',
    'Mercadoria',
    'Marketing',
    'Sistemas',
    'Impostos e Taxas',
    'Operacional'
  ];
begin
  if not exists (
    select 1
    from public.df_empresas
    where id = v_empresa_id
  ) then
    raise exception 'EMPRESA_REDE_DONA_FLOR_NAO_ENCONTRADA';
  end if;

  if exists (
    select 1
    from public.df_contas conta
    join public.df_centros_custo centro on centro.id = conta.centro_custo_id
    where centro.empresa_id = v_empresa_id
      and centro.nome = any(v_nomes)
  ) then
    raise exception 'CENTRO_CUSTO_ANTIGO_REFERENCIADO_POR_CONTA';
  end if;

  if exists (
    select 1
    from public.df_contas_recorrentes recorrencia
    join public.df_centros_custo centro on centro.id = recorrencia.centro_custo_id
    where centro.empresa_id = v_empresa_id
      and centro.nome = any(v_nomes)
  ) then
    raise exception 'CENTRO_CUSTO_ANTIGO_REFERENCIADO_POR_RECORRENCIA';
  end if;

  delete from public.df_centros_custo
  where empresa_id = v_empresa_id
    and nome = any(v_nomes);
end;
$$;
