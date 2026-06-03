-- =========================================================
-- DNA Gestao - Rollback planejado
-- Frente: Contas - pagamento real com encargos/descontos
--
-- ATENCAO:
-- - Este rollback remove os campos de baixa/pagamento.
-- - Se a migration ja tiver sido usada em producao, executar este rollback
--   apaga valor_pago, data_pagamento, juros_multa, desconto e observacao_pagamento.
-- - Nao executar sem exportar/validar dados antes.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;
end $$;

drop trigger if exists trg_df_contas_calcular_baixa_pagamento
  on public.df_contas;

drop function if exists public.df_contas_calcular_baixa_pagamento();

drop index if exists public.idx_df_contas_empresa_data_pagamento;
drop index if exists public.idx_df_contas_empresa_status_pagamento;

alter table public.df_contas
  drop constraint if exists df_contas_valor_pago_nao_negativo,
  drop constraint if exists df_contas_juros_multa_nao_negativo,
  drop constraint if exists df_contas_desconto_nao_negativo,
  drop constraint if exists df_contas_juros_ou_desconto;

alter table public.df_contas
  drop column if exists observacao_pagamento,
  drop column if exists desconto,
  drop column if exists juros_multa,
  drop column if exists data_pagamento,
  drop column if exists valor_pago;

commit;
