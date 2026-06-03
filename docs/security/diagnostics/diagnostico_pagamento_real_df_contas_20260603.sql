-- =========================================================
-- DNA Gestao - Diagnostico planejado
-- Frente: Contas - pagamento real com encargos/descontos
--
-- Uso:
-- - Rodar manualmente no Supabase apos aplicar a migration.
-- - Este arquivo apenas consulta metadados e amostras agregadas.
-- - Nao altera dados.
-- =========================================================

-- 1. Tabela alvo.
select
  to_regclass('public.df_contas') as tabela_contas,
  to_regclass('public.df_contas_recorrentes') as tabela_recorrencias;

-- 2. Colunas de pagamento real. Esperado: todas presentes.
select
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_contas'
  and column_name in (
    'valor',
    'valor_pago',
    'data_pagamento',
    'juros_multa',
    'desconto',
    'observacao_pagamento',
    'status',
    'recorrencia_id'
  )
order by ordinal_position;

-- 3. Trigger/função. Esperado: funcao e trigger existem.
select
  to_regprocedure('public.df_contas_calcular_baixa_pagamento()') as funcao_calculo;

select
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'df_contas'
  and trigger_name in (
    'trg_df_contas_calcular_baixa_pagamento',
    'trg_df_contas_auditoria_lixeira'
  )
order by trigger_name, event_manipulation;

-- 4. Constraints de segurança de valores. Esperado: quatro constraints novas.
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.df_contas'::regclass
  and conname in (
    'df_contas_valor_pago_nao_negativo',
    'df_contas_juros_multa_nao_negativo',
    'df_contas_desconto_nao_negativo',
    'df_contas_juros_ou_desconto'
  )
order by conname;

-- 5. Indices auxiliares. Esperado: indices novos presentes.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'df_contas'
  and indexname in (
    'idx_df_contas_empresa_data_pagamento',
    'idx_df_contas_empresa_status_pagamento'
  )
order by indexname;

-- 6. RLS/policies preservadas.
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'df_contas';

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'df_contas'
order by policyname;

-- 7. Grants preservados. Esperado: sem anon; authenticated conforme hardening vigente.
select
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'df_contas'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 8. Agregados operacionais para decidir backfill futuro.
select
  count(*) as total_contas,
  count(*) filter (where status = 'pago') as total_pagas,
  count(*) filter (where status = 'pago' and valor_pago is null) as pagas_sem_valor_pago,
  count(*) filter (where status = 'pago' and data_pagamento is null) as pagas_sem_data_pagamento,
  count(*) filter (
    where status is distinct from 'pago'
      and (
        valor_pago is not null
        or data_pagamento is not null
        or juros_multa <> 0
        or desconto <> 0
        or observacao_pagamento is not null
      )
  ) as nao_pagas_com_dados_pagamento,
  count(*) filter (where valor_pago is not null and valor_pago > valor) as com_juros_multa,
  count(*) filter (where valor_pago is not null and valor_pago < valor) as com_desconto
from public.df_contas;

-- 9. Inconsistencias de calculo. Esperado: zero linhas.
select
  id,
  empresa_id,
  valor,
  valor_pago,
  juros_multa,
  desconto,
  status,
  data_pagamento
from public.df_contas
where valor_pago is not null
  and (
    (valor_pago > valor and (juros_multa <> round((valor_pago - valor)::numeric, 2) or desconto <> 0))
    or (valor_pago < valor and (desconto <> round((valor - valor_pago)::numeric, 2) or juros_multa <> 0))
    or (valor_pago = valor and (juros_multa <> 0 or desconto <> 0))
    or juros_multa < 0
    or desconto < 0
    or (juros_multa > 0 and desconto > 0)
  )
order by data_pagamento desc nulls last
limit 50;

-- 10. Contas nao pagas com dados de pagamento. Esperado: zero linhas.
select
  id,
  empresa_id,
  valor,
  valor_pago,
  juros_multa,
  desconto,
  status,
  data_pagamento,
  observacao_pagamento
from public.df_contas
where status is distinct from 'pago'
  and (
    valor_pago is not null
    or data_pagamento is not null
    or juros_multa <> 0
    or desconto <> 0
    or observacao_pagamento is not null
  )
order by data_pagamento desc nulls last
limit 50;

-- 11. Confirmar que recorrencias nao receberam campos de baixa.
select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'df_contas_recorrentes'
  and column_name in (
    'valor_pago',
    'data_pagamento',
    'juros_multa',
    'desconto',
    'observacao_pagamento'
  )
order by column_name;
