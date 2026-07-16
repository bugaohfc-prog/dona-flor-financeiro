-- DNA Gestao - Campos para ocultar contas da visao operacional
-- Objetivo:
-- - Permitir ocultar contas sem excluir e sem enviar para a lixeira.
-- - Preservar status financeiro, valores, vencimentos e dados de baixa.
-- - Manter todas as contas existentes visiveis por padrao.

alter table public.df_contas
  add column if not exists oculto boolean not null default false,
  add column if not exists oculto_em timestamptz null;

comment on column public.df_contas.oculto is
  'Indica se a conta deve ficar oculta da visao operacional principal sem ser excluida ou movida para a lixeira.';

comment on column public.df_contas.oculto_em is
  'Data/hora em que a conta foi marcada como oculta. Nulo quando a conta esta visivel.';;
