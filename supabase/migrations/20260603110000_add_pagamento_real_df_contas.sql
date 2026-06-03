-- =========================================================
-- DNA Gestao - Planejamento SQL
-- Frente: Contas - pagamento real com encargos/descontos
--
-- ATENCAO:
-- - SQL criado para revisao e aplicacao controlada futura.
-- - Nao aplicar sem ciclo proprio de pre-flight e validacao.
-- - Nao altera RLS, policies, grants ou auditoria da Lixeira.
-- - Nao altera df_contas_recorrentes.
-- - Nao faz backfill de registros antigos pagos.
-- =========================================================

begin;

do $$
begin
  if to_regclass('public.df_contas') is null then
    raise exception 'Missing table public.df_contas';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'df_contas'
      and column_name = 'valor'
      and data_type = 'numeric'
  ) then
    raise exception 'Unexpected or missing column public.df_contas.valor numeric';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'df_contas'
      and t.tgname = 'trg_df_contas_auditoria_lixeira'
      and not t.tgisinternal
  ) then
    raise exception 'Missing trigger public.trg_df_contas_auditoria_lixeira';
  end if;
end $$;

alter table public.df_contas
  add column if not exists valor_pago numeric(12,2) null,
  add column if not exists data_pagamento date null,
  add column if not exists juros_multa numeric(12,2) not null default 0,
  add column if not exists desconto numeric(12,2) not null default 0,
  add column if not exists observacao_pagamento text null;

comment on column public.df_contas.valor is
  'Valor previsto/original da conta. Nao deve ser alterado para registrar encargos de pagamento.';
comment on column public.df_contas.valor_pago is
  'Valor efetivamente pago na baixa da conta.';
comment on column public.df_contas.data_pagamento is
  'Data efetiva da baixa/pagamento.';
comment on column public.df_contas.juros_multa is
  'Diferenca positiva calculada quando valor_pago > valor.';
comment on column public.df_contas.desconto is
  'Diferenca positiva calculada quando valor_pago < valor.';
comment on column public.df_contas.observacao_pagamento is
  'Comentario opcional da baixa/pagamento, sem dados sensiveis.';

create or replace function public.df_contas_calcular_baixa_pagamento()
returns trigger
language plpgsql
as $$
begin
  new.observacao_pagamento = nullif(btrim(new.observacao_pagamento), '');

  if coalesce(new.status, '') = 'pago' then
    if new.valor_pago is null then
      new.valor_pago = coalesce(new.valor, 0);
    end if;

    if new.data_pagamento is null then
      new.data_pagamento = current_date;
    end if;
  else
    new.valor_pago = null;
    new.data_pagamento = null;
    new.juros_multa = 0;
    new.desconto = 0;
    new.observacao_pagamento = null;
    return new;
  end if;

  if new.valor_pago is null then
    new.juros_multa = 0;
    new.desconto = 0;
    return new;
  end if;

  if new.valor_pago > coalesce(new.valor, 0) then
    new.juros_multa = round((new.valor_pago - coalesce(new.valor, 0))::numeric, 2);
    new.desconto = 0;
  elsif new.valor_pago < coalesce(new.valor, 0) then
    new.juros_multa = 0;
    new.desconto = round((coalesce(new.valor, 0) - new.valor_pago)::numeric, 2);
  else
    new.juros_multa = 0;
    new.desconto = 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_df_contas_calcular_baixa_pagamento
  on public.df_contas;

create trigger trg_df_contas_calcular_baixa_pagamento
before insert or update of valor, valor_pago, status, data_pagamento, observacao_pagamento
on public.df_contas
for each row
execute function public.df_contas_calcular_baixa_pagamento();

alter table public.df_contas
  drop constraint if exists df_contas_valor_pago_nao_negativo,
  add constraint df_contas_valor_pago_nao_negativo
    check (valor_pago is null or valor_pago >= 0);

alter table public.df_contas
  drop constraint if exists df_contas_juros_multa_nao_negativo,
  add constraint df_contas_juros_multa_nao_negativo
    check (juros_multa >= 0);

alter table public.df_contas
  drop constraint if exists df_contas_desconto_nao_negativo,
  add constraint df_contas_desconto_nao_negativo
    check (desconto >= 0);

alter table public.df_contas
  drop constraint if exists df_contas_juros_ou_desconto,
  add constraint df_contas_juros_ou_desconto
    check (not (juros_multa > 0 and desconto > 0));

create index if not exists idx_df_contas_empresa_data_pagamento
on public.df_contas (empresa_id, data_pagamento)
where data_pagamento is not null;

create index if not exists idx_df_contas_empresa_status_pagamento
on public.df_contas (empresa_id, status, data_pagamento);

commit;
