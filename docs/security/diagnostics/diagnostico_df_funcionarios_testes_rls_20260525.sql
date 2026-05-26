-- DNA Gestão
-- Diagnóstico seguro de possíveis registros de teste RLS em public.df_funcionarios
--
-- Uso previsto:
-- 1. Executar somente para leitura no SQL Editor do Supabase.
-- 2. Revisar os resultados manualmente antes de planejar qualquer ciclo de limpeza.
-- 3. Não usar este diagnóstico como autorização automática para remover ou arquivar dados.
--
-- Critérios fortes de teste RLS:
-- - nome = 'TESTE RLS FUNCIONARIO'
-- - email = 'teste.rls@example.com'
-- - cpf = '12345678901'
--
-- Observação LGPD:
-- - CPF é exibido apenas mascarado.
-- - Este arquivo não exibe telefone nem observações.
-- - Este arquivo não altera dados.

-- 1. Contagem geral de candidatos fortes.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.status,
    f.arquivado
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
)
select
  count(*) as total_candidatos_fortes,
  count(*) filter (where arquivado is false) as total_ativos_nao_arquivados,
  count(*) filter (where arquivado is true) as total_arquivados,
  count(*) filter (where status = 'ativo') as total_status_ativo,
  count(*) filter (where status = 'afastado') as total_status_afastado,
  count(*) filter (where status = 'desligado') as total_status_desligado
from candidatos_fortes;

-- 2. Contagem de candidatos fortes por empresa.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.status,
    f.arquivado
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
)
select
  cf.empresa_id,
  e.nome as empresa_nome,
  count(*) as total_candidatos,
  count(*) filter (where cf.arquivado is false) as total_ativos_nao_arquivados,
  count(*) filter (where cf.arquivado is true) as total_arquivados,
  min(cf.id::text) as exemplo_id
from candidatos_fortes cf
left join public.df_empresas e on e.id = cf.empresa_id
group by cf.empresa_id, e.nome
order by e.nome nulls last, cf.empresa_id;

-- 3. Listagem segura de candidatos fortes.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.nome,
    f.email,
    f.cpf,
    f.status,
    f.arquivado,
    f.created_at,
    f.updated_at
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
)
select
  cf.id,
  cf.empresa_id,
  e.nome as empresa_nome,
  cf.nome,
  cf.email,
  case
    when nullif(regexp_replace(coalesce(cf.cpf, ''), '\D', '', 'g'), '') is null then null
    else '***.***.***-' || right(regexp_replace(coalesce(cf.cpf, ''), '\D', '', 'g'), 2)
  end as cpf_mascarado,
  cf.status,
  cf.arquivado,
  cf.created_at as criado_em,
  cf.updated_at as atualizado_em
from candidatos_fortes cf
left join public.df_empresas e on e.id = cf.empresa_id
order by cf.created_at desc nulls last, e.nome nulls last, cf.nome;

-- 4. Candidatos fracos ou suspeitos para revisão humana.
with candidatos_fortes as (
  select f.id
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
),
candidatos_suspeitos as (
  select
    f.id,
    f.empresa_id,
    f.nome,
    f.email,
    f.cargo,
    f.status,
    f.arquivado,
    f.created_at,
    f.updated_at
  from public.df_funcionarios f
  where
    not exists (
      select 1
      from candidatos_fortes cf
      where cf.id = f.id
    )
    and (
      lower(trim(coalesce(f.nome, ''))) like '%teste%'
      or lower(trim(coalesce(f.cargo, ''))) like '%teste%'
      or lower(trim(coalesce(f.email, ''))) like '%teste%'
      or regexp_replace(coalesce(f.telefone, ''), '\D', '', 'g') = '11999999999'
    )
)
select
  cs.id,
  cs.empresa_id,
  e.nome as empresa_nome,
  cs.nome,
  cs.email,
  cs.cargo,
  cs.status,
  cs.arquivado,
  cs.created_at as criado_em,
  cs.updated_at as atualizado_em,
  'suspeito; revisar manualmente antes de qualquer limpeza' as recomendacao
from candidatos_suspeitos cs
left join public.df_empresas e on e.id = cs.empresa_id
order by cs.created_at desc nulls last, e.nome nulls last, cs.nome;

-- 5. Exames periódicos vinculados a candidatos fortes.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.nome,
    f.arquivado
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
)
select
  cf.id as funcionario_id,
  cf.empresa_id,
  e.nome as empresa_nome,
  cf.nome,
  cf.arquivado as funcionario_arquivado,
  count(ep.id) as total_exames_periodicos,
  count(ep.id) filter (where ep.arquivado is false) as total_exames_ativos,
  count(ep.id) filter (where ep.arquivado is true) as total_exames_arquivados,
  min(ep.data_exame) as primeira_data_exame,
  max(ep.data_exame) as ultima_data_exame
from candidatos_fortes cf
left join public.df_empresas e on e.id = cf.empresa_id
left join public.df_funcionarios_exames_periodicos ep
  on ep.funcionario_id = cf.id
  and ep.empresa_id = cf.empresa_id
group by cf.id, cf.empresa_id, e.nome, cf.nome, cf.arquivado
order by total_exames_periodicos desc, e.nome nulls last, cf.nome;

-- 6. Conferência de candidatos fortes com exames periódicos vinculados.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.nome,
    f.status,
    f.arquivado,
    f.created_at,
    f.updated_at
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
)
select
  cf.id as funcionario_id,
  cf.empresa_id,
  e.nome as empresa_nome,
  cf.nome,
  cf.status,
  cf.arquivado,
  cf.created_at as funcionario_criado_em,
  cf.updated_at as funcionario_atualizado_em,
  ep.id as exame_periodico_id,
  ep.data_exame,
  ep.arquivado as exame_arquivado,
  ep.criado_em as exame_criado_em,
  ep.atualizado_em as exame_atualizado_em
from candidatos_fortes cf
join public.df_funcionarios_exames_periodicos ep
  on ep.funcionario_id = cf.id
  and ep.empresa_id = cf.empresa_id
left join public.df_empresas e on e.id = cf.empresa_id
order by cf.created_at desc nulls last, ep.data_exame desc nulls last;

-- 7. Resumo final para decisão humana.
with candidatos_fortes as (
  select
    f.id,
    f.empresa_id,
    f.arquivado
  from public.df_funcionarios f
  where
    upper(trim(coalesce(f.nome, ''))) = 'TESTE RLS FUNCIONARIO'
    or lower(trim(coalesce(f.email, ''))) = 'teste.rls@example.com'
    or regexp_replace(coalesce(f.cpf, ''), '\D', '', 'g') = '12345678901'
),
exames_vinculados as (
  select ep.id
  from public.df_funcionarios_exames_periodicos ep
  join candidatos_fortes cf
    on cf.id = ep.funcionario_id
    and cf.empresa_id = ep.empresa_id
)
select
  (select count(*) from candidatos_fortes) as total_candidatos_fortes,
  (select count(*) from candidatos_fortes where arquivado is false) as candidatos_fortes_ativos_nao_arquivados,
  (select count(*) from candidatos_fortes where arquivado is true) as candidatos_fortes_arquivados,
  (select count(*) from exames_vinculados) as total_exames_periodicos_vinculados,
  'revisar resultados manualmente antes de qualquer ciclo de limpeza' as recomendacao;
