# Auditoria da função df_folha_lancamentos_validar_vinculos

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.df_folha_lancamentos_validar_vinculos()`

## Escopo

Auditoria específica, somente leitura, para confirmar se a função é trigger-only/validação interna e se pode ser candidata futura a restrição de `EXECUTE` para `PUBLIC`, `anon` e `authenticated`.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS/policy/view/índice, migration, alteração de dados, frontend, service, hook ou autenticação.

## Resumo executivo

A função `public.df_folha_lancamentos_validar_vinculos()` é uma função `plpgsql`, `SECURITY DEFINER`, owner `postgres`, retorno `trigger`, com `search_path=public`.

O catálogo Postgres mostrou uso por um único trigger:

- `trg_df_folha_lancamentos_validar_vinculos`
- tabela: `public.df_folha_lancamentos`
- timing: `BEFORE`
- eventos: `INSERT` e `UPDATE` dos campos de vínculo

Não foi encontrada evidência de chamada direta pelo app via RPC, nem referência em policies, views ou outras funções.

O Supabase Advisor ainda lista esta função nos alertas `anon_security_definer_function_executable` e `authenticated_security_definer_function_executable`, porque há `EXECUTE` direto para `PUBLIC`, `anon` e `authenticated`.

Recomendação desta auditoria: candidata a restringir `EXECUTE` público em ciclo futuro, começando por validação funcional transacional de `INSERT`/`UPDATE` em `df_folha_lancamentos` e rollback pronto.

Plano de validação e rollback para uma restrição futura: `docs/supabase/funcoes/df_folha_lancamentos_validar_vinculos-plano-restricao.md`.

Status em 2026-06-28: restrição executada para `PUBLIC`, `anon` e `authenticated`. Após a mudança, os três papéis ficaram sem `EXECUTE` efetivo; `postgres` e `service_role` foram preservados; o trigger continuou funcionando em validações transacionais com `ROLLBACK`; o Advisor deixou de listar esta função nos alertas `anon`/`authenticated`.

## Evidências do catálogo Postgres

Metadados consultados por `SELECT` em catálogos Postgres:

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `df_folha_lancamentos_validar_vinculos` |
| Argumentos | nenhum |
| Retorno | `trigger` |
| Linguagem | `plpgsql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `search_path=public` |
| `PUBLIC` tem `EXECUTE` efetivo | `true` |
| `anon` tem `EXECUTE` efetivo | `true` |
| `authenticated` tem `EXECUTE` efetivo | `true` |
| Hash da definição | `4cf0e419b9c7d5da0feef089c332faab` |

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

## Definição da função

A definição completa foi consultada via `pg_get_functiondef`. A função:

- valida se `new.competencia_id` pertence à mesma `empresa_id`;
- valida se `new.funcionario_id` pertence à mesma `empresa_id`;
- valida se `new.filial_id`, quando preenchido, pertence à mesma `empresa_id`;
- consulta `public.df_folha_competencias`, `public.df_funcionarios` e `public.df_filiais`;
- lança exceção com `errcode = '23514'` quando encontra vínculo incompatível;
- retorna `new`.

Trecho estrutural relevante:

```sql
CREATE OR REPLACE FUNCTION public.df_folha_lancamentos_validar_vinculos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- corpo consultado no catálogo: valida competencia_id, funcionario_id
-- e filial_id contra a mesma empresa_id antes de INSERT/UPDATE.
$function$;
```

## Grants atuais de EXECUTE

Grants observados em `information_schema.routine_privileges`:

| Grantee | Privilégio | Grantable |
| --- | --- | --- |
| `PUBLIC` | `EXECUTE` | `NO` |
| `anon` | `EXECUTE` | `NO` |
| `authenticated` | `EXECUTE` | `NO` |
| `postgres` | `EXECUTE` | `YES` |
| `service_role` | `EXECUTE` | `NO` |

Leitura de risco: por ser `SECURITY DEFINER` em `public`, a função fica exposta como RPC para `anon` e `authenticated`, embora a assinatura `RETURNS trigger` indique uso interno.

## Dependências encontradas

### Trigger que usa a função

| Trigger | Tabela | Timing | Eventos | Status |
| --- | --- | --- | --- | --- |
| `trg_df_folha_lancamentos_validar_vinculos` | `public.df_folha_lancamentos` | `BEFORE` | `INSERT`, `UPDATE` | habilitado |

Definição observada na migration versionada:

```sql
CREATE TRIGGER trg_df_folha_lancamentos_validar_vinculos
BEFORE INSERT OR UPDATE OF empresa_id, competencia_id, funcionario_id, filial_id
ON public.df_folha_lancamentos
FOR EACH ROW
EXECUTE FUNCTION public.df_folha_lancamentos_validar_vinculos();
```

### Tabelas relacionadas

- `public.df_folha_lancamentos`: tabela que dispara o trigger.
- `public.df_folha_competencias`: tabela usada para validar `competencia_id`.
- `public.df_funcionarios`: tabela usada para validar `funcionario_id`.
- `public.df_filiais`: tabela usada para validar `filial_id`.

### Policies que citam a função

Nenhuma policy citando textualmente `df_folha_lancamentos_validar_vinculos` foi encontrada em `pg_policies`.

### Views que dependem da função

Nenhuma view em `public` citando textualmente a função foi encontrada em `information_schema.views`.

### Outras funções que chamam a função

Nenhuma função normal chamando textualmente `df_folha_lancamentos_validar_vinculos` foi encontrada na checagem com `pg_get_functiondef`.

## Evidência de uso no código

Busca textual executada em:

- `src`
- `supabase/functions`
- `scripts`
- `docs`
- `supabase/migrations`

Resultado:

- Não foi encontrada chamada RPC direta para `df_folha_lancamentos_validar_vinculos`.
- A função aparece em `supabase/migrations/20260526_create_df_folha_nucleo.sql`, onde é criada e vinculada ao trigger.
- A função aparece em docs de auditoria, diagnóstico e rollback.
- O app usa a tabela `df_folha_lancamentos` via `src/services/folhaService.js`, mas não chama a função diretamente.

Leitura: o app aciona a função indiretamente ao inserir/atualizar `df_folha_lancamentos`, via trigger. Não há evidência de chamada direta pelo frontend, service, hook, Edge Function ou script.

## Classificação de risco

### É usada apenas por trigger interna?

Sim, pelas evidências atuais do catálogo e do código versionado.

### É chamada diretamente pelo app?

Não há evidência de chamada direta.

### É usada por RLS/policy?

Não há evidência de uso em policies.

### Impacto provável de revogar EXECUTE de PUBLIC/anon/authenticated

Baixo a médio, desde que o trigger continue executando internamente após a restrição.

O risco principal é quebrar `INSERT`/`UPDATE` em `public.df_folha_lancamentos` se o ambiente exigir privilégio de `EXECUTE` do papel efetivo que dispara o trigger. Por isso, o ciclo futuro precisa validar escrita antes/depois dentro de transação com `ROLLBACK`.

### Risco de quebrar insert/update na tabela relacionada

Médio em produção sem homologação. A tabela `df_folha_lancamentos` faz parte do núcleo de Fechamento de Folha/Gestão de Pessoas e contém validações multiempresa. Uma restrição mal validada pode impedir lançamento/edição de folha ou mascarar erro operacional como falha de permissão.

## Recomendação

Classificação final: candidata a restringir `PUBLIC`, `anon` e `authenticated` em ciclo futuro.

Não executar neste ciclo.

Ordem recomendada:

1. Reconsultar grants e dependências imediatamente antes da alteração.
2. Confirmar cenário controlado para `INSERT`/`UPDATE` em `df_folha_lancamentos`.
3. Executar validação funcional antes em transação com `ROLLBACK`.
4. Aplicar restrição somente se a validação antes for segura.
5. Repetir validação funcional depois em transação com `ROLLBACK`.
6. Consultar Advisor para confirmar se os alertas da função saíram.
7. Manter rollback pronto para restaurar grants.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('public', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as authenticated_has_execute;

-- Restrição candidata:
-- revoke execute on function public.df_folha_lancamentos_validar_vinculos() from anon;
-- revoke execute on function public.df_folha_lancamentos_validar_vinculos() from authenticated;
-- revoke execute on function public.df_folha_lancamentos_validar_vinculos() from public;

-- Diagnóstico depois:
-- select
--   has_function_privilege('public', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_folha_lancamentos_validar_vinculos()', 'EXECUTE') as authenticated_has_execute;
```

## Rollback futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Rollback de grants, caso a restrição futura quebre o fluxo:
-- grant execute on function public.df_folha_lancamentos_validar_vinculos() to public;
-- grant execute on function public.df_folha_lancamentos_validar_vinculos() to anon;
-- grant execute on function public.df_folha_lancamentos_validar_vinculos() to authenticated;
```

## Validações obrigatórias em ciclo futuro

- Confirmar grants antes/depois.
- Confirmar que o trigger continua existente e habilitado.
- Criar cenário controlado de competência, funcionário e, se aplicável, filial da mesma empresa.
- Inserir lançamento de folha de teste dentro de transação com `ROLLBACK`.
- Atualizar campos de vínculo dentro da mesma transação controlada, quando seguro.
- Confirmar rejeição de vínculo cross-tenant, se o teste puder ser feito sem persistência.
- Confirmar que nenhum dado de teste persistiu.
- Confirmar que `anon` e `authenticated` perderam `EXECUTE` efetivo.
- Confirmar que o Advisor deixou de listar esta função, se aplicável.

## Estado final deste ciclo

- Banco: alterado posteriormente somente nos grants autorizados da função alvo.
- Grants: `EXECUTE` removido de `PUBLIC`, `anon` e `authenticated` em 2026-06-28.
- Função: não alterada.
- Trigger: não alterado.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: nenhum dado persistente alterado no ciclo de restrição; testes executados com `ROLLBACK`.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
