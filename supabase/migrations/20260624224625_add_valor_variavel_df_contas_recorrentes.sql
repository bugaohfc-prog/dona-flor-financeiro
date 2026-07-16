-- DNA Gestao - Valor variavel em series recorrentes
-- Objetivo:
-- - Identificar series cujo valor mensal deve ser tratado como estimativa.
-- - Preservar o comportamento atual de todas as series existentes.
-- - Nao alterar contas, RLS, policies, triggers ou regras de geracao.

alter table public.df_contas_recorrentes
  add column if not exists valor_variavel boolean not null default false;

comment on column public.df_contas_recorrentes.valor_variavel is
  'Indica que o valor da serie e apenas uma estimativa e deve ser conferido em cada conta gerada.';;
