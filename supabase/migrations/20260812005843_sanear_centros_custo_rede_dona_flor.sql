-- Saneamento rastreavel dos centros de custo da Rede Dona Flor.
-- Escopo deliberadamente limitado a centro_custo_id e a criacao dos centros alvo.

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

with contas_normalizadas as (
  select
    c.id,
    trim(regexp_replace(
      lower(translate(coalesce(c.descricao, ''),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    )) as descricao_norm,
    trim(regexp_replace(
      lower(translate(coalesce(f.nome, ''),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    )) as filial_norm
  from public.df_contas c
  left join public.df_filiais f on f.id = c.filial_id
  where c.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
), contas_classificadas as (
  select
    cn.id,
    case
      when cn.descricao_norm = 'teste auditoria' then null
      when cn.filial_norm in ('pessoal', 'pessoais') then 'Pessoais'
      when cn.descricao_norm like '%pro labore%' then 'Pró-labore'
      when cn.descricao_norm ~ '(^| )(13|decimo terceiro)( |$)'
        then 'Folha e Benefícios'
      when cn.descricao_norm like '%parcelamento%'
        or cn.descricao_norm ~ '(^| )(darf|das|inss|imposto|simples).*parcel'
        or cn.descricao_norm ~ 'parcel.*(darf|das|inss|imposto|simples)( |$)'
        then 'Parcelamentos Tributários'
      when cn.descricao_norm ~ '(^| )(cronus|chronus|crhonus)( |$)'
        or cn.descricao_norm like '%all prime%'
        or cn.descricao_norm like '%cavalari joias%'
        or cn.descricao_norm like '%allinox%'
        or cn.descricao_norm like '%jesus aliancas%'
        or cn.descricao_norm like '%jesus fabiano%'
        or cn.descricao_norm ~ '(^| )jvc( |$)'
        or cn.descricao_norm like '%al brasil%'
        or cn.descricao_norm like '%sacola%'
        or cn.descricao_norm like '%mercadoria%'
        or cn.descricao_norm like '%fornecedor%'
        then 'Mercadorias e Compras'
      when cn.descricao_norm like '%salario%'
        or cn.descricao_norm like '%hindeburg%'
        or cn.descricao_norm like '%adiantamento salarial%'
        or cn.descricao_norm like '%ferias%'
        or cn.descricao_norm like '%rescis%'
        or cn.descricao_norm like '%vale aliment%'
        or cn.descricao_norm = 'alimentacao'
        or cn.descricao_norm like '%unimed%'
        or cn.descricao_norm like '%plano de saude%'
        then 'Folha e Benefícios'
      when cn.descricao_norm like '%fgts%'
        or cn.descricao_norm like '%inss%'
        or cn.descricao_norm like '%irrf%'
        or cn.descricao_norm like '%sindical%'
        or cn.descricao_norm like '%encargo trabalh%'
        then 'Encargos Trabalhistas'
      when cn.descricao_norm like '%simples%'
        or cn.descricao_norm ~ '(^| )das( |$)'
        or cn.descricao_norm like '%icms%'
        then 'Tributos sobre Vendas'
      when cn.descricao_norm like '%iptu%'
        or cn.descricao_norm like '%alvara%'
        or cn.descricao_norm like '%bombeiro%'
        or cn.descricao_norm like '%licenca%'
        or cn.descricao_norm like '%taxa%'
        or cn.descricao_norm like '%darf atrasado%'
        then 'Tributos e Taxas'
      when cn.descricao_norm like '%aluguel%'
        or cn.descricao_norm like '%condominio%'
        or cn.descricao_norm like '%seguro incendio%'
        or cn.descricao_norm ~ '(^| )svm( |$)'
        then 'Ocupação'
      when cn.descricao_norm like '%energia%'
        or cn.descricao_norm ~ '(^| )luz( |$)'
        or cn.descricao_norm like '%elektro%'
        or cn.descricao_norm like '%agua%'
        or cn.descricao_norm like '%esgoto%'
        or cn.descricao_norm like '%sanesul%'
        or cn.descricao_norm like '%telefone%'
        or cn.descricao_norm like '%internet%'
        or cn.descricao_norm ~ '(^| )(claro|vivo|telecom)( |$)'
        then 'Utilidades'
      when cn.descricao_norm like '%gigatron%'
        or cn.descricao_norm ~ '(^| )linx( |$)'
        or cn.descricao_norm ~ '(^| )tef( |$)'
        then 'Sistemas e Tecnologia'
      when cn.descricao_norm like '%contabilidade%'
        or cn.descricao_norm like '%advogado%'
        or cn.descricao_norm like '%honorario administr%'
        or cn.descricao_norm like '%associacao%'
        or cn.descricao_norm like '%despesa viagem%'
        then 'Administrativo'
      when cn.descricao_norm like '%getnet%'
        or cn.descricao_norm like '%serasa%'
        or cn.descricao_norm like '%seresa%'
        or cn.descricao_norm like '%boleto protestado%'
        then 'Meios de Pagamento e Financeiro'
      when cn.descricao_norm like '%karen modelo%'
        or cn.descricao_norm like '%modelo rubia%'
        or cn.descricao_norm like '%campanha%'
        or cn.descricao_norm like '%comercial%'
        then 'Marketing e Comercial'
      when cn.descricao_norm like '%veiculo%' then 'Veículos'
      else null
    end as centro_alvo
  from contas_normalizadas cn
), destinos as (
  select
    c.id as conta_id,
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
  from contas_classificadas c
  where c.centro_alvo is not null
)
update public.df_contas c
set centro_custo_id = d.centro_custo_id
from destinos d
where c.id = d.conta_id
  and d.centro_custo_id is not null
  and c.centro_custo_id is distinct from d.centro_custo_id;

with recorrencias_normalizadas as (
  select
    r.id,
    trim(regexp_replace(
      lower(translate(coalesce(r.descricao, ''),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    )) as descricao_norm,
    trim(regexp_replace(
      lower(translate(coalesce(f.nome, ''),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', ' ', 'g'
    )) as filial_norm
  from public.df_contas_recorrentes r
  left join public.df_filiais f on f.id = r.filial_id
  where r.empresa_id = '4f13dbfc-6da5-4130-b952-4723409a9e01'::uuid
), recorrencias_classificadas as (
  select
    rn.id,
    case
      when rn.descricao_norm = 'teste auditoria' then null
      when rn.filial_norm in ('pessoal', 'pessoais') then 'Pessoais'
      when rn.descricao_norm like '%pro labore%' then 'Pró-labore'
      when rn.descricao_norm ~ '(^| )(13|decimo terceiro)( |$)'
        then 'Folha e Benefícios'
      when rn.descricao_norm like '%parcelamento%'
        or rn.descricao_norm ~ '(^| )(darf|das|inss|imposto|simples).*parcel'
        or rn.descricao_norm ~ 'parcel.*(darf|das|inss|imposto|simples)( |$)'
        then 'Parcelamentos Tributários'
      when rn.descricao_norm ~ '(^| )(cronus|chronus|crhonus)( |$)'
        or rn.descricao_norm like '%all prime%'
        or rn.descricao_norm like '%cavalari joias%'
        or rn.descricao_norm like '%allinox%'
        or rn.descricao_norm like '%jesus aliancas%'
        or rn.descricao_norm like '%jesus fabiano%'
        or rn.descricao_norm ~ '(^| )jvc( |$)'
        or rn.descricao_norm like '%al brasil%'
        or rn.descricao_norm like '%sacola%'
        or rn.descricao_norm like '%mercadoria%'
        or rn.descricao_norm like '%fornecedor%'
        then 'Mercadorias e Compras'
      when rn.descricao_norm like '%salario%'
        or rn.descricao_norm like '%hindeburg%'
        or rn.descricao_norm like '%adiantamento salarial%'
        or rn.descricao_norm like '%ferias%'
        or rn.descricao_norm like '%rescis%'
        or rn.descricao_norm like '%vale aliment%'
        or rn.descricao_norm = 'alimentacao'
        or rn.descricao_norm like '%unimed%'
        or rn.descricao_norm like '%plano de saude%'
        then 'Folha e Benefícios'
      when rn.descricao_norm like '%fgts%'
        or rn.descricao_norm like '%inss%'
        or rn.descricao_norm like '%irrf%'
        or rn.descricao_norm like '%sindical%'
        or rn.descricao_norm like '%encargo trabalh%'
        then 'Encargos Trabalhistas'
      when rn.descricao_norm like '%simples%'
        or rn.descricao_norm ~ '(^| )das( |$)'
        or rn.descricao_norm like '%icms%'
        then 'Tributos sobre Vendas'
      when rn.descricao_norm like '%iptu%'
        or rn.descricao_norm like '%alvara%'
        or rn.descricao_norm like '%bombeiro%'
        or rn.descricao_norm like '%licenca%'
        or rn.descricao_norm like '%taxa%'
        or rn.descricao_norm like '%darf atrasado%'
        then 'Tributos e Taxas'
      when rn.descricao_norm like '%aluguel%'
        or rn.descricao_norm like '%condominio%'
        or rn.descricao_norm like '%seguro incendio%'
        or rn.descricao_norm ~ '(^| )svm( |$)'
        then 'Ocupação'
      when rn.descricao_norm like '%energia%'
        or rn.descricao_norm ~ '(^| )luz( |$)'
        or rn.descricao_norm like '%elektro%'
        or rn.descricao_norm like '%agua%'
        or rn.descricao_norm like '%esgoto%'
        or rn.descricao_norm like '%sanesul%'
        or rn.descricao_norm like '%telefone%'
        or rn.descricao_norm like '%internet%'
        or rn.descricao_norm ~ '(^| )(claro|vivo|telecom)( |$)'
        then 'Utilidades'
      when rn.descricao_norm like '%gigatron%'
        or rn.descricao_norm ~ '(^| )linx( |$)'
        or rn.descricao_norm ~ '(^| )tef( |$)'
        then 'Sistemas e Tecnologia'
      when rn.descricao_norm like '%contabilidade%'
        or rn.descricao_norm like '%advogado%'
        or rn.descricao_norm like '%honorario administr%'
        or rn.descricao_norm like '%associacao%'
        or rn.descricao_norm like '%despesa viagem%'
        then 'Administrativo'
      when rn.descricao_norm like '%getnet%'
        or rn.descricao_norm like '%serasa%'
        or rn.descricao_norm like '%seresa%'
        or rn.descricao_norm like '%boleto protestado%'
        then 'Meios de Pagamento e Financeiro'
      when rn.descricao_norm like '%karen modelo%'
        or rn.descricao_norm like '%modelo rubia%'
        or rn.descricao_norm like '%campanha%'
        or rn.descricao_norm like '%comercial%'
        then 'Marketing e Comercial'
      when rn.descricao_norm like '%veiculo%' then 'Veículos'
      else null
    end as centro_alvo
  from recorrencias_normalizadas rn
), destinos as (
  select
    r.id as recorrencia_id,
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
  from recorrencias_classificadas r
  where r.centro_alvo is not null
)
update public.df_contas_recorrentes r
set centro_custo_id = d.centro_custo_id
from destinos d
where r.id = d.recorrencia_id
  and d.centro_custo_id is not null
  and r.centro_custo_id is distinct from d.centro_custo_id;
