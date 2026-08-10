-- Saneamento mínimo para retirar exceções empresariais dos controles pessoais.
-- Preserva filial, valores, datas, status, pagamentos e recorrências existentes.

do $$
begin
  if exists (
    select 1
    from public.df_contas c
    where lower(c.descricao) like '%hindeburg%'
      and not exists (
        select 1
        from public.df_centros_custo cc
        where cc.empresa_id = c.empresa_id
          and lower(trim(cc.nome)) = 'rh'
      )
  ) or exists (
    select 1
    from public.df_contas_recorrentes r
    where lower(r.descricao) like '%hindeburg%'
      and not exists (
        select 1
        from public.df_centros_custo cc
        where cc.empresa_id = r.empresa_id
          and lower(trim(cc.nome)) = 'rh'
      )
  ) then
    raise exception 'CENTRO_RH_NAO_ENCONTRADO_PARA_HINDEBURG';
  end if;
end;
$$;

insert into public.df_centros_custo (id, empresa_id, nome)
select gen_random_uuid(), empresas.empresa_id, 'Pró-labore'
from (
  select distinct f.empresa_id
  from public.df_filiais f
  where lower(trim(f.razao_social)) = lower('J. de Angelis L. Marques - ME')
) empresas
where not exists (
  select 1
  from public.df_centros_custo cc
  where cc.empresa_id = empresas.empresa_id
    and regexp_replace(
      lower(translate(cc.nome, 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', '', 'g'
    ) = 'prolabore'
);

with centros_rh as (
  select distinct on (empresa_id) empresa_id, id
  from public.df_centros_custo
  where lower(trim(nome)) = 'rh'
  order by empresa_id, created_at, id
)
update public.df_contas c
set centro_custo_id = rh.id
from centros_rh rh
where c.empresa_id = rh.empresa_id
  and lower(c.descricao) like '%hindeburg%'
  and c.centro_custo_id is distinct from rh.id;

with centros_rh as (
  select distinct on (empresa_id) empresa_id, id
  from public.df_centros_custo
  where lower(trim(nome)) = 'rh'
  order by empresa_id, created_at, id
)
update public.df_contas_recorrentes r
set centro_custo_id = rh.id
from centros_rh rh
where r.empresa_id = rh.empresa_id
  and lower(r.descricao) like '%hindeburg%'
  and r.centro_custo_id is distinct from rh.id;

with centros_pro_labore as (
  select distinct on (cc.empresa_id) cc.empresa_id, cc.id
  from public.df_centros_custo cc
  where regexp_replace(
    lower(translate(cc.nome, 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')),
    '[^a-z0-9]+', '', 'g'
  ) = 'prolabore'
  order by cc.empresa_id, cc.created_at, cc.id
)
update public.df_contas c
set centro_custo_id = pl.id
from centros_pro_labore pl, public.df_filiais f
where c.empresa_id = pl.empresa_id
  and f.id = c.filial_id
  and f.empresa_id = c.empresa_id
  and lower(trim(f.razao_social)) = lower('J. de Angelis L. Marques - ME')
  and lower(c.descricao) like '%labore%'
  and lower(c.descricao) like '%joanna%'
  and (
    lower(trim(coalesce(c.centro, ''))) in ('pessoal', 'pessoais')
    or exists (
      select 1
      from public.df_centros_custo atual
      where atual.id = c.centro_custo_id
        and lower(trim(atual.nome)) in ('pessoal', 'pessoais')
    )
  )
  and c.centro_custo_id is distinct from pl.id;

with centros_pro_labore as (
  select distinct on (cc.empresa_id) cc.empresa_id, cc.id
  from public.df_centros_custo cc
  where regexp_replace(
    lower(translate(cc.nome, 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')),
    '[^a-z0-9]+', '', 'g'
  ) = 'prolabore'
  order by cc.empresa_id, cc.created_at, cc.id
)
update public.df_contas_recorrentes r
set centro_custo_id = pl.id
from centros_pro_labore pl, public.df_filiais f
where r.empresa_id = pl.empresa_id
  and f.id = r.filial_id
  and f.empresa_id = r.empresa_id
  and lower(trim(f.razao_social)) = lower('J. de Angelis L. Marques - ME')
  and lower(r.descricao) like '%labore%'
  and lower(r.descricao) like '%joanna%'
  and exists (
    select 1
    from public.df_centros_custo atual
    where atual.id = r.centro_custo_id
      and lower(trim(atual.nome)) in ('pessoal', 'pessoais')
  )
  and r.centro_custo_id is distinct from pl.id;
