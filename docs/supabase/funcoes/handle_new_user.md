# Auditoria da função handle_new_user

Data: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.handle_new_user()`

## Escopo

Auditoria específica, somente leitura, para avaliar uma função `SECURITY DEFINER` sensível ligada ao provisionamento de perfil após criação de usuário no Supabase Auth.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de trigger, Auth, senha, Edge Function, frontend, service, hook, RLS/policy/view/índice, migration, alteração de dados ou outras permissões.

## Resumo executivo

A função `public.handle_new_user()` é `plpgsql`, `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, retorna `trigger` e está executável por `PUBLIC`, `anon` e `authenticated`.

Ela é usada pelo trigger `on_auth_user_created`, `AFTER INSERT` em `auth.users`, e insere `new.id` em `public.profiles(id)` com `on conflict (id) do nothing`.

Não foi encontrada chamada RPC direta a `handle_new_user` no app, Edge Functions ou scripts versionados. A função parece ser usada apenas como trigger interna de Auth, mas está exposta como RPC por causa dos grants atuais.

Classificação desta auditoria: **alto**.

Recomendação segura: manter temporariamente neste ciclo. Preparar plano próprio antes de qualquer `REVOKE`, priorizando restrição de `PUBLIC` e `anon` se confirmado que a execução do trigger de Auth não depende desses grants. Manter `authenticated` temporariamente até validação operacional do fluxo de criação de usuário. Não alterar trigger, Auth ou `search_path` no mesmo ciclo de grants.

Plano de validação e rollback para restrição futura: `docs/supabase/funcoes/handle_new_user-plano-restricao.md`.

## Definição funcional em linguagem simples

A função roda quando um novo registro é inserido em `auth.users`.

Ela tenta criar um registro correspondente em `public.profiles` com:

- `id = new.id`.

Se o profile já existir, não faz alteração por causa de `on conflict (id) do nothing`. Depois retorna `new` para permitir que o fluxo do trigger continue.

Definição observada:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$function$
```

## Evidências do catálogo Postgres

Metadados consultados por `SELECT` em catálogos Postgres:

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `handle_new_user` |
| Argumentos | nenhum |
| Retorno | `trigger` |
| Linguagem | `plpgsql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | não configurado |
| Hash da definição | `63547f8592621a804d25a0111d8389d2` |

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

## Grants atuais de EXECUTE

| Papel | `EXECUTE` efetivo | Leitura |
| --- | --- | --- |
| `PUBLIC` | `true` | Exposição ampla por herança. |
| `anon` | `true` | Tem grant direto e também herda de `PUBLIC`. |
| `authenticated` | `true` | Tem grant direto e também herda de `PUBLIC`. |
| `postgres` | `true` | Preservado. |
| `service_role` | `true` | Preservado. |

Leitura de risco: enquanto `PUBLIC` tiver `EXECUTE`, a função segue executável por papéis que herdam de `PUBLIC`, mesmo que grants diretos sejam removidos.

## Tabelas afetadas

### `auth.users`

A função é executada por trigger ligado a `auth.users`.

Ela usa o valor `new.id` do usuário recém-criado.

### `public.profiles`

A função insere em `public.profiles`:

| Campo | Origem |
| --- | --- |
| `id` | `new.id` de `auth.users` |

Não foram identificadas leituras/escritas em `df_usuarios`, empresa, loja, permissões ou vínculos por esta função. O vínculo empresarial e dados complementares parecem ser tratados por outros fluxos, como Edge Functions e serviços.

## Dependências encontradas

### Trigger que usa a função

| Trigger | Schema/tabela | Evento | Definição |
| --- | --- | --- | --- |
| `on_auth_user_created` | `auth.users` | `AFTER INSERT` | `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()` |

### Policies que citam a função

Nenhuma policy citando textualmente `handle_new_user` foi encontrada em `pg_policies`.

### Views que dependem da função

Nenhuma view em `public` ou `auth` citando textualmente `handle_new_user` foi encontrada.

### Outras funções que chamam a função

Nenhuma função normal em `public` ou `auth` chamando textualmente `handle_new_user` foi encontrada.

### Funções sensíveis chamadas

A definição observada não chama outras funções sensíveis. Ela executa apenas `insert into public.profiles`.

## Evidência de uso no código

Busca textual executada em:

- `src`;
- `supabase/functions`;
- `scripts`;
- `docs`;
- `supabase/migrations`.

Resultado:

- Não foi encontrada chamada RPC direta para `handle_new_user` no app atual.
- Não foi encontrado uso versionado de `/rpc/handle_new_user`.
- As ocorrências de `handle_new_user` estão em documentação e SQL diagnóstico.
- As chamadas RPC versionadas do app/Edge Functions envolvem outras funções, como `vincular_usuario_logado`, `is_master` e `df_usuario_eh_admin`.

Leitura: o app não parece chamar `handle_new_user` diretamente. A função parece ser trigger-only de `auth.users`.

## Relação com fluxos de criação de usuário

O fluxo manual atual em `supabase/functions/criar-usuario-manual/index.ts` usa `supabaseAdmin.auth.admin.createUser`, depois faz `upsert` em `profiles` e insere vínculo em `df_usuarios_empresas`.

Isso significa que o fluxo manual não chama `handle_new_user` diretamente, mas a criação via Auth pode disparar o trigger `on_auth_user_created`. Como a Edge Function também faz `upsert` em `profiles`, o `on conflict do nothing` da função reduz risco de conflito, mas a interação deve ser validada antes de qualquer restrição.

## Riscos práticos

### Risco se `anon` puder executar

Alto.

Como a função retorna `trigger`, chamada direta por RPC tende a não ser um fluxo útil de negócio, mas a exposição de função `SECURITY DEFINER` em schema público é indesejada. A função executa com privilégios do owner e escreve em `profiles`.

### Risco se `authenticated` puder executar

Médio a alto.

Usuários autenticados não deveriam precisar executar diretamente uma função de trigger de Auth. Mesmo que a chamada RPC direta falhe por contexto de trigger ausente, a superfície de execução é desnecessária e aparece no Advisor.

### Risco se `PUBLIC` mantiver EXECUTE

Alto.

`PUBLIC` mantém execução efetiva para `anon` e `authenticated`. Qualquer plano futuro precisa tratar `PUBLIC`, não apenas grants diretos.

### Risco de criação/vínculo indevido de usuário

Médio.

A função não cria usuário no Auth e não cria vínculo em `df_usuarios_empresas`; ela cria apenas `profiles(id)`. O risco prático maior é exposição de uma função privilegiada e possível comportamento inesperado se chamada fora do contexto de trigger.

### Risco de escalar permissões

Baixo a médio.

A função observada não grava perfil, empresa, loja, role, permissão ou `df_usuarios_empresas`. O risco de escala direta de permissão não aparece na definição atual, mas a função é `SECURITY DEFINER` e deve ser tratada com cuidado.

### Risco de quebrar trigger de Auth se grants forem alterados

Médio.

Triggers executam internamente pelo PostgreSQL e normalmente não dependem de `EXECUTE` para `anon`/`authenticated`. Ainda assim, como não há homologação e a função participa de provisionamento de `profiles`, qualquer restrição futura precisa validar criação de usuário e profile antes/depois.

### Risco de `search_path`

Alto.

O Advisor lista `handle_new_user` em `function_search_path_mutable`. Como a função é `SECURITY DEFINER` e referencia `public.profiles`, o `search_path` deve ser corrigido apenas em ciclo próprio autorizado, com rollback.

## Classificação

Classificação final: **alto**.

Motivos:

- `SECURITY DEFINER`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- sem `search_path` fixo;
- escreve em `public.profiles`;
- usada por trigger `AFTER INSERT` em `auth.users`;
- não há evidência de uso direto pelo app, mas há risco de quebrar provisionamento de perfil se a restrição for feita sem validação.

## Recomendação segura

Recomendação deste ciclo:

- manter temporariamente, sem alteração;
- criar plano específico de restrição antes de qualquer `REVOKE`;
- validar novamente que o app não chama `handle_new_user` por RPC;
- confirmar que o trigger `on_auth_user_created` permanece ativo;
- validar criação de usuário via fluxo atual e criação/upsert de `profiles`;
- priorizar restrição de `PUBLIC`;
- priorizar restrição de `anon` se confirmado que o trigger continua funcionando;
- manter `authenticated` temporariamente até plano próprio;
- tratar `search_path` em ciclo separado, sem misturar com grants.

Ordem sugerida para ciclo futuro:

1. Confirmar ACL e trigger ativo.
2. Confirmar ausência de chamada RPC direta.
3. Validar criação de usuário em fluxo seguro e controlado, sem expor senha real.
4. Preparar rollback de grants.
5. Se seguro, restringir `PUBLIC` e `anon` em fase própria.
6. Avaliar `authenticated` em etapa posterior.
7. Tratar `search_path` somente em ciclo autorizado de `ALTER FUNCTION`.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('public', 'public.handle_new_user()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') as authenticated_has_execute;

-- Restrição candidata inicial, somente após validação do trigger:
-- revoke execute on function public.handle_new_user() from anon;
-- revoke execute on function public.handle_new_user() from public;

-- Restrição de authenticated somente após validação adicional:
-- revoke execute on function public.handle_new_user() from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem necessidade real de rollback ou ciclo autorizado.

```sql
-- Rollback de grants:
-- grant execute on function public.handle_new_user() to public;
-- grant execute on function public.handle_new_user() to anon;
-- grant execute on function public.handle_new_user() to authenticated;
```

## Próximos passos

- Usar o plano em `docs/supabase/funcoes/handle_new_user-plano-restricao.md` como matriz antes/depois para qualquer ciclo futuro de `REVOKE`.
- Validar fluxo de criação de usuário/profile sem alterar Auth neste ciclo.
- Confirmar que o trigger `on_auth_user_created` continua sendo a única dependência direta.
- Não alterar grants, trigger, função, Auth, senha ou `search_path` sem ciclo próprio.

## Estado final deste ciclo

- Banco: não alterado.
- Grants: não alterados.
- Função: não alterada.
- Trigger: não alterado.
- Autenticação/senhas: não alteradas.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: não alterados.
- Edge Function/frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
