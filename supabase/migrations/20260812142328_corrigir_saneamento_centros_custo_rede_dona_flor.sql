-- Correcao autonoma do saneamento de centros de custo da Rede Dona Flor.
-- Altera somente centro_custo_id e cria centros alvo ausentes.

select pg_advisory_xact_lock(
  hashtextextended('sanear-centros-custo:4f13dbfc-6da5-4130-b952-4723409a9e01', 0)
);

do $$
begin
  if not exists (
    select 1
    from public.df_empresas
    where id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
  ) then
    raise exception 'EMPRESA_REDE_DONA_FLOR_NAO_ENCONTRADA';
  end if;
end;
$$;

create or replace function pg_temp.classificar_cc_rede_dona_flor(
  p_descricao text,
  p_filial text,
  p_centro_atual text
)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  with normalizado as (
    select
      trim(regexp_replace(
        lower(translate(coalesce(p_descricao, ''),
          'áàâãäéèêëíìîïóòôõöúùûüç',
          'aaaaaeeeeiiiiooooouuuuc')),
        '[^a-z0-9]+', ' ', 'g'
      )) as descricao,
      trim(regexp_replace(
        lower(translate(coalesce(p_filial, ''),
          'áàâãäéèêëíìîïóòôõöúùûüç',
          'aaaaaeeeeiiiiooooouuuuc')),
        '[^a-z0-9]+', ' ', 'g'
      )) as filial,
      trim(regexp_replace(
        lower(translate(coalesce(p_centro_atual, ''),
          'áàâãäéèêëíìîïóòôõöúùûüç',
          'aaaaaeeeeiiiiooooouuuuc')),
        '[^a-z0-9]+', ' ', 'g'
      )) as centro_atual
  )
  select case
    when descricao = 'teste auditoria' then null
    when filial in ('pessoal', 'pessoais') then 'Pessoais'
    when descricao like '%pro labore%' then 'Pró-labore'
    when descricao like '%parcelamento%'
      or descricao ~ '(^| )(darf|das|inss|imposto|simples).*parcel'
      or descricao ~ 'parcel.*(darf|das|inss|imposto|simples)( |$)'
      then 'Parcelamentos Tributários'
    when descricao like '%aluguel%'
      or descricao like '%aluguerl%'
      or descricao like '%condominio%'
      or descricao like '%seguro incendio%'
      or descricao ~ '(^| )svm( |$)'
      then 'Ocupação'
    when descricao like '%fgts%'
      or descricao like '%inss%'
      or descricao like '%irrf%'
      or descricao like '%sindicato%'
      or descricao like '%sindical%'
      or descricao like '%encargo trabalh%'
      then 'Encargos Trabalhistas'
    when descricao like '%salario%'
      or descricao like '%hindeburg%'
      or descricao like '%adiantamento%'
      or descricao like '%ferias%'
      or descricao ~ '(^| )(13|decimo terceiro)( |$)'
      or descricao like '%rescis%'
      or descricao like '%recis%'
      or descricao like '%alimentacao%'
      or descricao like '%alimentecao%'
      or descricao like '%beneficio%'
      or descricao like '%unimed%'
      or descricao like '%plano de saude%'
      then 'Folha e Benefícios'
    when descricao ~ '(^| )(cronus|chronus|crhonus)( |$)'
      or descricao like '%all prime%'
      or descricao like '%cavalari joias%'
      or descricao like '%allinox%'
      or descricao like '%jesus aliancas%'
      or descricao like '%alianca jesus%'
      or descricao like '%jesus fabiano%alianca%'
      or descricao like '%jesus fabiano%'
      or descricao like '%micheli acessorios%'
      or descricao like '%repasse compras dayane%'
      or descricao ~ '(^| )jvc( |$)'
      or descricao like '%al brasil%'
      or descricao like '%sacola%'
      or descricao like '%mercadoria%'
      or descricao like '%fornecedor%'
      then 'Mercadorias e Compras'
    when descricao like '%simples%'
      or descricao ~ '(^| )das( |$)'
      or descricao like '%icms%'
      then 'Tributos sobre Vendas'
    when descricao like '%iptu%'
      or descricao like '%alvara%'
      or descricao like '%bombeiro%'
      or descricao like '%licenca%'
      or descricao like '%taxa%'
      or descricao like '%darf atrasado%'
      then 'Tributos e Taxas'
    when descricao like '%energia%'
      or descricao ~ '(^| )luz( |$)'
      or descricao like '%elektro%'
      or descricao like '%agua%'
      or descricao like '%esgoto%'
      or descricao like '%sanesul%'
      or descricao like '%telefone%'
      or descricao like '%internet%'
      or descricao ~ '(^| )(claro|vivo|telecom)( |$)'
      then 'Utilidades'
    when descricao like '%gigatron%'
      or descricao ~ '(^| )linx( |$)'
      or descricao ~ '(^| )tef( |$)'
      then 'Sistemas e Tecnologia'
    when descricao like '%contabilidade%'
      or descricao like '%advogado%'
      or descricao like '%honorario administr%'
      or descricao like '%associacao%'
      or descricao ~ '(^| )acia( |$)'
      or descricao like '%despesa viagem%'
      or descricao like '%administrativ%'
      then 'Administrativo'
    when descricao like '%getnet%'
      or descricao like '%serasa%'
      or descricao like '%seresa%'
      or descricao like '%boleto protestado%'
      or descricao like '%cobranca financeira%'
      then 'Meios de Pagamento e Financeiro'
    when descricao like '%karen modelo%'
      or descricao like '%modelo rubia%'
      or descricao like '%modelo%'
      or descricao like '%campanha%'
      or descricao like '%comercial%'
      then 'Marketing e Comercial'
    when descricao like '%veiculo%'
      or descricao like '%carro celia%'
      then 'Veículos'
    when centro_atual = 'rh' then 'Folha e Benefícios'
    when centro_atual = 'mercadoria' then 'Mercadorias e Compras'
    when centro_atual = 'marketing' then 'Marketing e Comercial'
    when centro_atual = 'sistemas' then 'Sistemas e Tecnologia'
    when centro_atual = 'impostos e taxas' then 'Tributos e Taxas'
    else null
  end
  from normalizado;
$$;

with centros_alvo(nome) as (
  values
    ('Mercadorias e Compras'),
    ('Folha e Benefícios'),
    ('Encargos Trabalhistas'),
    ('Tributos sobre Vendas'),
    ('Tributos e Taxas'),
    ('Parcelamentos Tributários'),
    ('Ocupação'),
    ('Utilidades'),
    ('Sistemas e Tecnologia'),
    ('Administrativo'),
    ('Meios de Pagamento e Financeiro'),
    ('Marketing e Comercial'),
    ('Veículos'),
    ('Pró-labore'),
    ('Pessoais')
)
insert into public.df_centros_custo (nome, empresa_id)
select ca.nome, '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
from centros_alvo ca
where not exists (
  select 1
  from public.df_centros_custo cc
  where cc.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
    and trim(regexp_replace(
      lower(translate(cc.nome,
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    )) = trim(regexp_replace(
      lower(translate(ca.nome,
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    ))
);

with classificados as (
  select
    c.id,
    pg_temp.classificar_cc_rede_dona_flor(
      c.descricao,
      f.nome,
      cc.nome
    ) as centro_alvo
  from public.df_contas c
  left join public.df_filiais f on f.id = c.filial_id
  left join public.df_centros_custo cc on cc.id = c.centro_custo_id
  where c.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
), destinos as (
  select
    c.id,
    (
      select cc.id
      from public.df_centros_custo cc
      where cc.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
        and trim(regexp_replace(
          lower(translate(cc.nome,
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc')),
          '[^a-z0-9]+', ' ', 'g'
        )) = trim(regexp_replace(
          lower(translate(c.centro_alvo,
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc')),
          '[^a-z0-9]+', ' ', 'g'
        ))
      order by cc.created_at nulls last, cc.id
      limit 1
    ) as centro_custo_id
  from classificados c
  where c.centro_alvo is not null
)
update public.df_contas c
set centro_custo_id = d.centro_custo_id
from destinos d
where c.id = d.id
  and d.centro_custo_id is not null
  and c.centro_custo_id is distinct from d.centro_custo_id;

with classificados as (
  select
    r.id,
    pg_temp.classificar_cc_rede_dona_flor(
      r.descricao,
      f.nome,
      cc.nome
    ) as centro_alvo
  from public.df_contas_recorrentes r
  left join public.df_filiais f on f.id = r.filial_id
  left join public.df_centros_custo cc on cc.id = r.centro_custo_id
  where r.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
), destinos as (
  select
    r.id,
    (
      select cc.id
      from public.df_centros_custo cc
      where cc.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
        and trim(regexp_replace(
          lower(translate(cc.nome,
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc')),
          '[^a-z0-9]+', ' ', 'g'
        )) = trim(regexp_replace(
          lower(translate(r.centro_alvo,
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc')),
          '[^a-z0-9]+', ' ', 'g'
        ))
      order by cc.created_at nulls last, cc.id
      limit 1
    ) as centro_custo_id
  from classificados r
  where r.centro_alvo is not null
)
update public.df_contas_recorrentes r
set centro_custo_id = d.centro_custo_id
from destinos d
where r.id = d.id
  and d.centro_custo_id is not null
  and r.centro_custo_id is distinct from d.centro_custo_id;
