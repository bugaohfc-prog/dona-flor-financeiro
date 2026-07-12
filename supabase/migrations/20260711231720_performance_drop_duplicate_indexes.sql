begin;

-- Mantém os índices com nomes canônicos e a chave primária.
drop index if exists public.idx_df_centros_empresa;
drop index if exists public.idx_df_contas_empresa;
drop index if exists public.idx_df_notas_empresa;
drop index if exists public.df_usuarios_empresas_id_unique;

commit;
