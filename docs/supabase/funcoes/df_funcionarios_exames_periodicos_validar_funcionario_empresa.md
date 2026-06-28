# Auditoria da função df_funcionarios_exames_periodicos_validar_funcionario_empresa

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()`

## Escopo

Auditoria específica, somente leitura, para confirmar se a função é trigger-only/validação interna e se pode ser candidata futura a restrição de `EXECUTE` para `PUBLIC`, `anon` e `authenticated`.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS/policy/view/índice, migration, alteração de dados, frontend, service, hook ou autenticação.

## Resumo executivo

A função `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()` é uma função `plpgsql`, `SECURITY DEFINER`, owner `postgres`, retorno `trigger`, com `search_path=public`.

O catálogo Postgres mostrou uso por um único trigger:

- `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre`
- tabela: `public.df_funcionarios_exames_periodicos`
- timing: `BEFORE`
- eventos: `INSERT` e `UPDATE`

Não foi encontrada evidência de chamada direta pelo app via RPC, nem referência em policies, views ou outras funções.

O Supabase Advisor ainda lista esta função nos alertas `anon_security_definer_function_executable` e `authenticated_security_definer_function_executable`, porque há `EXECUTE` direto para `PUBLIC`, `anon` e `authenticated`.

Recomendação desta auditoria: candidata a restringir `EXECUTE` público em ciclo futuro, começando por plano de validação/rollback e teste transacional de `INSERT`/`UPDATE` em `df_funcionarios_exames_periodicos`.

Plano de validação e rollback para uma restrição futura: `docs/supabase/funcoes/df_funcionarios_exames_periodicos_validar_funcionario_empresa-plano-restricao.md`.

Status em 2026-06-28: restrição executada para `PUBLIC`, `anon` e `authenticated`. Após a mudança, os três papéis ficaram sem `EXECUTE` efetivo; `postgres` e `service_role` foram preservados; o trigger continuou funcionando em validações transacionais com `ROLLBACK`; o Advisor deixou de listar esta função nos alertas `anon`/`authenticated`.

## Evidências do catálogo Postgres

Metadados consultados por `SELECT` em catálogos Postgres:

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `df_funcionarios_exames_periodicos_validar_funcionario_empresa` |
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
| Hash da definição | `0d8991e6d2fe071de5bc2a3e1ffb2b90` |

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

## Definição da função

A definição completa foi consultada via `pg_get_functiondef`. A função:

- valida se `new.funcionario_id` pertence à mesma `empresa_id`;
- consulta `public.df_funcionarios`;
- lança exceção com `errcode = '23514'` quando encontra vínculo incompatível;
- retorna `new`.

Trecho estrutural relevante:

```sql
CREATE OR REPLACE FUNCTION public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- corpo consultado no catálogo: valida funcionario_id contra a mesma empresa_id
-- antes de INSERT/UPDATE em public.df_funcionarios_exames_periodicos.
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
| `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre` | `public.df_funcionarios_exames_periodicos` | `BEFORE` | `INSERT`, `UPDATE` | habilitado |

Definição observada na migration versionada:

```sql
CREATE TRIGGER trg_df_funcionarios_exames_periodicos_validar_funcionario_empresa
BEFORE INSERT OR UPDATE OF empresa_id, funcionario_id
ON public.df_funcionarios_exames_periodicos
FOR EACH ROW
EXECUTE FUNCTION public.df_funcionarios_exames_periodicos_validar_funcionario_empresa();
```

### Tabelas relacionadas

- `public.df_funcionarios_exames_periodicos`: tabela que dispara o trigger.
- `public.df_funcionarios`: tabela usada para validar `funcionario_id`.

### Policies que citam a função

Nenhuma policy citando textualmente `df_funcionarios_exames_periodicos_validar_funcionario_empresa` foi encontrada em `pg_policies`.

### Views que dependem da função

Nenhuma view em `public` citando textualmente a função foi encontrada em `information_schema.views`.

### Outras funções que chamam a função

Nenhuma função normal chamando textualmente `df_funcionarios_exames_periodicos_validar_funcionario_empresa` foi encontrada na checagem com `pg_get_functiondef`.

## Evidência de uso no código

Busca textual executada em:

- `src`
- `supabase/functions`
- `scripts`
- `docs`
- `supabase/migrations`

Resultado:

- Não foi encontrada chamada RPC direta para `df_funcionarios_exames_periodicos_validar_funcionario_empresa`.
- A função aparece em `supabase/migrations/20260525113000_create_df_funcionarios_exames_periodicos.sql`, onde é criada e vinculada ao trigger.
- A função aparece em docs de auditoria, diagnóstico e rollback.
- O app usa a tabela `df_funcionarios_exames_periodicos` via `src/services/funcionariosExamesPeriodicosService.js`.
- O painel consulta `df_funcionarios_exames_periodicos` em `src/hooks/useResumoGestaoPessoasPainel.js`.

Leitura: o app aciona a função indiretamente ao inserir/atualizar `df_funcionarios_exames_periodicos`, via trigger. Não há evidência de chamada direta pelo frontend, service, hook, Edge Function ou script.

## Classificação de risco

### É usada apenas por trigger interna?

Sim, pelas evidências atuais do catálogo e do código versionado.

### É chamada diretamente pelo app?

Não há evidência de chamada direta.

### É usada por RLS/policy?

Não há evidência de uso em policies.

### Impacto provável de revogar EXECUTE de PUBLIC/anon/authenticated

Baixo a médio, desde que o trigger continue executando internamente após a restrição.

O risco principal é quebrar `INSERT`/`UPDATE` em `public.df_funcionarios_exames_periodicos` se o ambiente exigir privilégio de `EXECUTE` do papel efetivo que dispara o trigger. Por isso, o ciclo futuro precisa validar escrita antes/depois dentro de transação com `ROLLBACK`.

### Risco de quebrar insert/update na tabela relacionada

Médio em produção sem homologação. A tabela `df_funcionarios_exames_periodicos` faz parte de Gestão de Pessoas e deve manter cuidado com LGPD. A função não armazena laudos, anexos ou resultados, mas valida vínculo de funcionário/empresa; uma restrição mal validada pode impedir cadastro/edição de exames periódicos.

## Recomendação

Classificação final: candidata a restringir `PUBLIC`, `anon` e `authenticated` em ciclo futuro.

Não executar neste ciclo.

Ordem recomendada:

1. Criar plano de restrição com matriz antes/depois e rollback.
2. Reconsultar grants e dependências imediatamente antes da alteração.
3. Confirmar cenário controlado para `INSERT`/`UPDATE` em `df_funcionarios_exames_periodicos`.
4. Executar validação funcional antes em transação com `ROLLBACK`.
5. Aplicar restrição somente se a validação antes for segura.
6. Repetir validação funcional depois em transação com `ROLLBACK`.
7. Consultar Advisor para confirmar se os alertas da função saíram.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('public', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as authenticated_has_execute;

-- Restrição candidata:
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from anon;
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from authenticated;
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from public;

-- Diagnóstico depois:
-- select
--   has_function_privilege('public', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()', 'EXECUTE') as authenticated_has_execute;
```

## Rollback futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Rollback de grants, caso a restrição futura quebre o fluxo:
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to public;
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to anon;
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to authenticated;
```

## Validações obrigatórias em ciclo futuro

- Confirmar grants antes/depois.
- Confirmar que o trigger continua existente e habilitado.
- Criar cenário controlado de empresa e funcionário da mesma empresa.
- Inserir exame periódico de teste dentro de transação com `ROLLBACK`, se seguro.
- Atualizar `funcionario_id` ou campo relacionado dentro da mesma transação controlada, quando seguro.
- Confirmar rejeição de vínculo cross-tenant, se o teste puder ser feito sem persistência.
- Confirmar que nenhum dado de teste persistiu.
- Confirmar que `PUBLIC`, `anon` e `authenticated` perderam `EXECUTE` efetivo.
- Confirmar que o Advisor deixou de listar esta função, se aplicável.

## Estado final deste ciclo

- Banco: alterado posteriormente somente nos grants autorizados da função alvo.
- Grants: `EXECUTE` removido de `PUBLIC`, `anon` e `authenticated` em 2026-06-28.
- Função: não alterada.
- Trigger: não alterado.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: nenhum dado persistente alterado no ciclo de restrição; testes executados com `ROLLBACK` e sem dados médicos reais.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
