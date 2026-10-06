create index idx_df_desligamentos_conta_pagamento_fk
  on public.df_funcionarios_desligamentos (empresa_id, conta_pagamento_id);

create index idx_df_desligamentos_checklist_catalogo_fk
  on public.df_funcionarios_desligamentos_checklist (empresa_id, catalogo_item_id);

create index idx_df_desligamentos_correcoes_funcionario_fk
  on public.df_funcionarios_desligamentos_correcoes (empresa_id, funcionario_id);

create index idx_df_func_transferencias_destino_fk
  on public.df_funcionarios_transferencias_filiais (empresa_id, filial_destino_id);

create index idx_df_func_transferencias_origem_fk
  on public.df_funcionarios_transferencias_filiais (empresa_id, filial_origem_id);

create index idx_df_func_transferencias_retificacoes_funcionario_fk
  on public.df_funcionarios_transferencias_filiais_retificacoes (empresa_id, funcionario_id);
