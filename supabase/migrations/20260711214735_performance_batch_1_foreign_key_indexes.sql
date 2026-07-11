begin;

create index if not exists idx_df_contas_centro_custo_id
  on public.df_contas (centro_custo_id);

create index if not exists idx_df_contas_user_id
  on public.df_contas (user_id);

create index if not exists idx_df_contas_recorrencia_id
  on public.df_contas (recorrencia_id);

create index if not exists idx_df_contas_pagamentos_conta_id
  on public.df_contas_pagamentos (conta_id);

create index if not exists idx_df_folha_lancamento_itens_filial_id
  on public.df_folha_lancamento_itens (filial_id);

create index if not exists idx_df_folha_lancamentos_filial_id
  on public.df_folha_lancamentos (filial_id);

create index if not exists idx_df_funcionarios_filial_id
  on public.df_funcionarios (filial_id);

create index if not exists idx_df_notas_user_id
  on public.df_notas (user_id);

create index if not exists idx_df_receitas_filial_id
  on public.df_receitas (filial_id);

create index if not exists idx_df_usuarios_empresas_user_id
  on public.df_usuarios_empresas (user_id);

commit;
