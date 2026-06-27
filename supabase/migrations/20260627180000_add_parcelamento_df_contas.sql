-- DNA Gestao - Campos estruturais para parcelamento de contas
-- Objetivo:
-- - Permitir agrupar contas independentes criadas a partir de um parcelamento.
-- - Nao criar parcelamentos automaticamente neste ciclo.
-- - Nao alterar RLS, policies, triggers, baixa, estorno, recorrencia ou pagamentos parciais.

alter table public.df_contas
  add column if not exists grupo_parcelamento_id uuid null,
  add column if not exists parcela_numero integer null,
  add column if not exists parcelas_total integer null,
  add column if not exists valor_total_parcelamento numeric(12,2) null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'df_contas_parcelamento_consistente'
      and conrelid = 'public.df_contas'::regclass
  ) then
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
          and parcela_numero > 0
          and parcelas_total > 0
          and parcela_numero <= parcelas_total
          and (valor_total_parcelamento is null or valor_total_parcelamento >= 0)
        )
      );
  end if;
end $$;

comment on column public.df_contas.grupo_parcelamento_id is
  'Identificador logico que agrupa contas criadas no mesmo parcelamento. Cada parcela continua sendo uma conta independente.';

comment on column public.df_contas.parcela_numero is
  'Numero da parcela dentro do grupo de parcelamento.';

comment on column public.df_contas.parcelas_total is
  'Quantidade total de parcelas do grupo.';

comment on column public.df_contas.valor_total_parcelamento is
  'Valor total informado no momento da criacao do parcelamento, usado apenas para conferencia visual.';
