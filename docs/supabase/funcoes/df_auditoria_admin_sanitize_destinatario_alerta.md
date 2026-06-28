# Auditoria da função df_auditoria_admin_sanitize_destinatario_alerta

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.df_auditoria_admin_sanitize_destinatario_alerta()`

## Escopo

Auditoria específica, somente leitura, para confirmar se a função é trigger-only/validação interna e se pode ser candidata futura a restrição de `EXECUTE` para `anon` e `authenticated`.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS/policy/view/índice, migration, alteração de dados, frontend, service, hook ou autenticação.

## Resumo executivo

A função `public.df_auditoria_admin_sanitize_destinatario_alerta()` é uma função `plpgsql`, `SECURITY DEFINER`, owner `postgres`, retorno `trigger`, com `search_path=public`.

O catálogo Postgres mostrou uso por um único trigger:

- `trg_df_destinatarios_alertas_auditoria_admin`
- tabela: `public.df_destinatarios_alertas`
- evento: `AFTER INSERT OR UPDATE`

Não foi encontrada evidência de chamada direta pelo app via RPC, nem referência em policies, views ou outras funções.

Recomendação desta auditoria: a função é candidata forte para restringir `EXECUTE` público em ciclo futuro, começando por `anon` e `authenticated`, desde que o ciclo futuro valide o comportamento do trigger após a restrição e tenha rollback pronto.

Plano de validação e rollback para uma restrição futura: `docs/supabase/funcoes/df_auditoria_admin_sanitize_destinatario_alerta-plano-restricao.md`.

## Evidências do catálogo Postgres

Metadados consultados por `SELECT` em catálogos Postgres:

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `df_auditoria_admin_sanitize_destinatario_alerta` |
| Argumentos | nenhum |
| Retorno | `trigger` |
| Linguagem | `plpgsql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `search_path=public` |
| `anon` tem `EXECUTE` | `true` |
| `authenticated` tem `EXECUTE` | `true` |
| `PUBLIC` tem `EXECUTE` | `true` |

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

## Definição da função

A definição completa foi consultada via `pg_get_functiondef`. A função:

- lê `auth.uid()` para preencher `user_id` no registro de auditoria;
- em `INSERT`, registra ação `destinatario_alerta_criado`;
- em `UPDATE`, registra `destinatario_alerta_inativado`, `destinatario_alerta_reativado` ou `destinatario_alerta_atualizado`;
- não grava e-mail puro no detalhe de auditoria; usa `md5(lower(email))` como `email_hash`;
- grava em `public.df_auditoria_admin`;
- usa `origem = 'database_trigger'`;
- retorna `new` para `INSERT`/`UPDATE`;
- retorna `coalesce(new, old)` como fallback.

Trecho estrutural relevante:

```sql
CREATE OR REPLACE FUNCTION public.df_auditoria_admin_sanitize_destinatario_alerta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- corpo consultado no catálogo: registra auditoria sanitizada de INSERT/UPDATE
-- em public.df_destinatarios_alertas, gravando em public.df_auditoria_admin.
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

Leitura de risco: por ser `SECURITY DEFINER` em `public`, o `EXECUTE` para `PUBLIC`, `anon` e `authenticated` expõe uma função de trigger como RPC potencial, embora a assinatura `RETURNS trigger` reduza a utilidade de chamada direta comum.

## Dependências encontradas

### Trigger que usa a função

| Trigger | Tabela | Timing | Eventos |
| --- | --- | --- | --- |
| `trg_df_destinatarios_alertas_auditoria_admin` | `public.df_destinatarios_alertas` | `AFTER` | `INSERT`, `UPDATE` |

Definição observada:

```sql
CREATE TRIGGER trg_df_destinatarios_alertas_auditoria_admin
AFTER INSERT OR UPDATE ON public.df_destinatarios_alertas
FOR EACH ROW
EXECUTE FUNCTION df_auditoria_admin_sanitize_destinatario_alerta()
```

### Tabelas relacionadas

- `public.df_destinatarios_alertas`: tabela que dispara o trigger.
- `public.df_auditoria_admin`: tabela onde a função grava o log de auditoria.

### Policies que citam a função

Nenhuma policy citando textualmente `df_auditoria_admin_sanitize_destinatario_alerta` foi encontrada em `pg_policies`.

### Views que dependem da função

Nenhuma view em `public` ou `auth` citando textualmente a função foi encontrada em `pg_views`.

### Outras funções que chamam a função

Nenhuma função normal em `public` ou `auth` chamando textualmente `df_auditoria_admin_sanitize_destinatario_alerta` foi encontrada na checagem com `pg_get_functiondef`.

## Contexto da tabela relacionada

`public.df_destinatarios_alertas` está com:

- RLS habilitado;
- FORCE RLS habilitado;
- `anon` sem grants diretos na tabela;
- `authenticated` com `SELECT`, `INSERT` e `UPDATE`;
- sem `DELETE` para `authenticated`.

Policies atuais da tabela:

- `df_destinatarios_alertas_select_empresa`
- `df_destinatarios_alertas_insert_admin_master`
- `df_destinatarios_alertas_update_admin_master`

As policies de escrita dependem de helpers de perfil/empresa, não da função auditada neste documento.

## Evidência de uso no código

Busca textual executada em:

- `src`
- `supabase/functions`
- `scripts`
- `docs`
- `supabase/migrations`

Resultado:

- Não foi encontrada chamada RPC direta para `df_auditoria_admin_sanitize_destinatario_alerta`.
- A função aparece em `supabase/migrations/20260601210000_create_df_auditoria_admin.sql`, onde é criada e vinculada ao trigger.
- A função aparece em docs de auditoria e diagnóstico.
- O app usa a tabela `df_destinatarios_alertas` via `src/services/destinatariosAlertasService.js`, com `.from('df_destinatarios_alertas')` para listar, inserir, atualizar e alterar status.
- O script `scripts/envio-automatico-dona-flor.mjs` consulta `df_destinatarios_alertas`, mas não chama a função RPC diretamente.

Leitura: o app aciona a função indiretamente ao inserir/atualizar a tabela, via trigger. Não há evidência de chamada direta pelo frontend, service, hook, Edge Function ou script.

## Classificação de risco

### É usada apenas por trigger interna?

Sim, pelas evidências atuais do catálogo e do código versionado.

### É chamada diretamente pelo app?

Não há evidência de chamada direta.

### É usada por RLS/policy?

Não há evidência de uso em policies.

### Impacto provável de revogar EXECUTE de anon/authenticated

Baixo a médio, desde que a revogação futura não afete a execução do trigger pelo dono/tabela.

O risco principal é quebrar `INSERT`/`UPDATE` em `df_destinatarios_alertas` se o Postgres exigir privilégio de execução para o papel efetivo que dispara o trigger no ambiente Supabase. Por isso, a restrição precisa ser testada em ciclo próprio com diagnóstico antes/depois.

### Risco de quebrar insert/update na tabela relacionada

Médio em produção sem homologação. Mesmo parecendo trigger-only, a tabela é funcional no app:

- Admin/Master cadastram, editam, inativam e reativam destinatários;
- Gerente visualiza;
- Operador não ganhou acesso;
- envio automático consulta destinatários ativos.

Qualquer quebra de trigger pode impedir escrita ou auditoria de alterações em destinatários.

## Recomendação

Classificação final: candidata a restringir `anon` e `authenticated` em ciclo futuro.

Não executar neste ciclo.

Ordem recomendada:

1. Em ciclo futuro, reconsultar grants e dependências imediatamente antes da alteração.
2. Executar teste de chamada direta RPC como `anon`/`authenticated`, se houver ambiente seguro para isso.
3. Preparar rollback.
4. Aplicar restrição somente se houver janela segura.
5. Validar `INSERT` e `UPDATE` reais em `df_destinatarios_alertas` por Admin/Master.
6. Validar que auditoria continua sendo gravada em `df_auditoria_admin`.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('anon', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('public', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as public_has_execute;

-- Restrição candidata:
-- revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from anon;
-- revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from authenticated;
-- revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from public;

-- Diagnóstico depois:
-- select
--   has_function_privilege('anon', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('public', 'public.df_auditoria_admin_sanitize_destinatario_alerta()', 'EXECUTE') as public_has_execute;
```

## Rollback futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Rollback de grants, caso a restrição futura quebre o fluxo:
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to anon;
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to authenticated;
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to public;
```

## Validações obrigatórias em ciclo futuro

- Confirmar grants antes/depois.
- Confirmar que o trigger continua existente.
- Inserir destinatário de teste em empresa controlada por Admin/Master.
- Atualizar/inativar/reativar destinatário de teste.
- Confirmar registro correspondente em `df_auditoria_admin`.
- Confirmar que Gerente segue apenas leitura.
- Confirmar que Operador segue sem acesso útil.
- Confirmar que `anon` não tem acesso direto à tabela nem à função.

## Estado final deste ciclo

- Banco: não alterado.
- Grants: não alterados.
- Função: não alterada.
- Trigger: não alterado.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: não alterados.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
