alter table public.df_contas
add column if not exists grupo_parcelamento_id uuid null,
add column if not exists parcela_numero integer null,
add column if not exists parcelas_total integer null,
add column if not exists valor_total_parcelamento numeric(12,2) null;

alter table public.df_contas
drop constraint if exists df_contas_parcelamento_consistente;

alter table public.df_contas
add constraint df_contas_parcelamento_consistente
check (
  (
    grupo_parcelamento_id is null
    and parcela_numero is null
    and parcelas_total is null
    and valor_total_parcelamento is null
  )
  or
  (
    grupo_parcelamento_id is not null
    and parcela_numero is not null
    and parcelas_total is not null
    and valor_total_parcelamento is not null
    and parcela_numero > 0
    and parcelas_total > 0
    and parcela_numero <= parcelas_total
    and valor_total_parcelamento >= 0
  )
);;
