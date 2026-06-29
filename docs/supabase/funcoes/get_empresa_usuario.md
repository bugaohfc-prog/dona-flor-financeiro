# Auditoria da função `get_empresa_usuario`

Data da auditoria: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.get_empresa_usuario()`, apontada como ponto crítico `SECURITY DEFINER` por estar ligada à resolução de empresa/tenant do usuário.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service ou hook.

## Resumo executivo

`public.get_empresa_usuario()` é uma função `sql`, `SECURITY DEFINER`, sem argumentos, com retorno `uuid`, owner `postgres` e `search_path=public`.

A função lê `public.df_usuarios_empresas` e retorna o primeiro `empresa_id` encontrado para `user_id = auth.uid()`.

Não foram encontradas dependências por trigger, policy, view ou outra função. Também não foi encontrada chamada direta pelo app atual em `src`, `supabase/functions` ou `scripts`.

O fluxo atual de tenant no código versionado usa `src/services/tenantService.js`, que lê diretamente `df_usuarios_empresas` por `user_id` e carrega `df_empresas.nome`; não chama `get_empresa_usuario`.

Classificação desta auditoria: **alto**.

Motivo: a função é `SECURITY DEFINER`, resolve tenant por contexto de Auth, retorna `empresa_id`, está executável por `PUBLIC`, `anon` e `authenticated`, e parece legado/incerto no código atual. `anon` e `PUBLIC` são candidatos fortes a restrição em ciclo futuro. `authenticated` deve ser tratado apenas após plano próprio e checagem de uso legado externo.

## Assinatura

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `get_empresa_usuario` |
| Assinatura | `public.get_empresa_usuario()` |
| Argumentos | nenhum |
| Retorno | `uuid` |
| Linguagem | `sql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `public` |
| Hash da definição | `140380edd9b1c5fbcc02c2986a417712` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.get_empresa_usuario()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select empresa_id
  from public.df_usuarios_empresas
  where user_id = auth.uid()
  limit 1;
$function$
```

## Definição funcional

Em linguagem simples, a função tenta descobrir a empresa ativa do usuário autenticado.

Ela usa:

- `auth.uid()` para obter o ID do usuário autenticado.
- `public.df_usuarios_empresas.user_id` para localizar vínculo.
- `public.df_usuarios_empresas.empresa_id` como dado retornado.

Ela não usa:

- `auth.email()`.

Ela não altera dados.

## Grants atuais

ACL catalogada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Role | EXECUTE direto/efetivo |
| --- | --- |
| `PUBLIC` | sim |
| `anon` | sim |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

Leitura de risco: `PUBLIC` mantém execução efetiva aberta; `anon` também tem grant direto; `authenticated` pode executar a função mesmo sem evidência de uso atual no app.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies | nenhuma policy citando textualmente a função |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual encontrada |

## Evidência de uso no código

Busca textual em `src`, `supabase/functions`, `scripts`, `docs` e `supabase/migrations` encontrou `get_empresa_usuario` apenas em documentação e SQL de diagnóstico/auditoria.

Não foi encontrada chamada direta no app atual:

- nenhuma chamada `supabase.rpc('get_empresa_usuario')`;
- nenhuma chamada literal `/rpc/get_empresa_usuario`;
- nenhuma chamada em Edge Function.

Fluxo atual identificado:

- `src/services/tenantService.js` usa `buscarVinculoEmpresaDoUsuario(userId)`;
- essa função lê `df_usuarios_empresas` diretamente com `.eq('user_id', userId)`;
- em seguida carrega `df_empresas.nome`;
- portanto, o fluxo atual de tenant não depende de `get_empresa_usuario`.

## Tabelas afetadas

| Tabela | Uso |
| --- | --- |
| `public.df_usuarios_empresas` | lê `empresa_id` filtrando por `user_id = auth.uid()` |

Dados retornados:

- `empresa_id` do primeiro vínculo encontrado para o usuário autenticado.

Dados não retornados:

- `perfil`;
- `loja`;
- permissões;
- nome da empresa;
- e-mail;
- senha;
- dados de Auth.

## Riscos práticos

### Risco se `anon` puder executar

**Alto.** Em contexto anônimo, `auth.uid()` tende a ser nulo e a função provavelmente retorna vazio. Ainda assim, expor uma função `SECURITY DEFINER` de resolução de tenant para `anon` é desnecessário e aumenta superfície de ataque.

### Risco se `PUBLIC` mantiver EXECUTE

**Alto.** Enquanto `PUBLIC` tiver `EXECUTE`, roles que herdam de `PUBLIC` podem manter execução efetiva. Para remover exposição pública real, `PUBLIC` precisa ser tratado junto com `anon`.

### Risco se `authenticated` puder executar

**Médio/alto.** A função retorna apenas o `empresa_id` do usuário autenticado, mas esse dado define tenant e pode ser usado para inferir vínculo empresarial. Como não há chamada atual no app, o risco principal é legado externo desconhecido.

### Risco de exposição de empresa/tenant

**Alto.** `empresa_id` é dado de tenant. Mesmo sem retornar perfil ou permissões, ele participa do isolamento multiempresa e deve ser tratado como sensível.

### Risco de vazamento de perfil/permissão

**Baixo/médio.** A função não retorna `perfil`, `loja` ou permissões. O vazamento direto é limitado a `empresa_id`, mas esse ID pode ser suficiente para correlação com outros fluxos se combinado com permissões indevidas.

## Classificação

Classificação final: **alto**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- resolve empresa/tenant do usuário;
- usa contexto de Auth;
- sem evidência de uso direto pelo app atual;
- possível legado externo não mapeado.

## Recomendação segura

Recomendação desta auditoria:

- **manter temporariamente** até plano de restrição próprio;
- **candidata a restringir `anon`**;
- **candidata a restringir `PUBLIC`**;
- **manter `authenticated` inicialmente**, por prudência com possível legado externo;
- **avaliar restringir `authenticated` somente após plano próprio**, checagem operacional e confirmação de ausência de uso externo;
- **precisa plano próprio** antes de qualquer alteração.

Não executar `REVOKE` neste ciclo.

## SQL futuro proposto, comentado

Diagnóstico antes de qualquer restrição futura:

```sql
-- select
--   has_function_privilege('public', 'public.get_empresa_usuario()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.get_empresa_usuario()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.get_empresa_usuario()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.get_empresa_usuario()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.get_empresa_usuario()', 'EXECUTE') as service_role_has_execute;
```

Fase 1 candidata, somente após ciclo autorizado:

```sql
-- revoke execute on function public.get_empresa_usuario() from anon;
-- revoke execute on function public.get_empresa_usuario() from public;
```

Fase posterior, somente após confirmar ausência de uso externo:

```sql
-- revoke execute on function public.get_empresa_usuario() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.get_empresa_usuario() to public;
-- grant execute on function public.get_empresa_usuario() to anon;
```

Se `authenticated` for tratado em ciclo posterior:

```sql
-- grant execute on function public.get_empresa_usuario() to authenticated;
```

## Próximos passos

Plano de restrição específico criado em `docs/supabase/funcoes/get_empresa_usuario-plano-restricao.md`.

1. Reconfirmar que o app atual não chama a RPC.
2. Validar login e carregamento de tenant pelo fluxo atual de `tenantService.js`.
3. Em ciclo curto futuro, avaliar remover `anon` e `PUBLIC`, mantendo `authenticated`.
4. Não planejar revogar `authenticated` agora; isso só deve ser avaliado após confirmação completa do fluxo ou refatoração específica.

## O que não mexer agora

- Não revogar `anon`, `PUBLIC` ou `authenticated` neste ciclo.
- Não alterar a função.
- Não alterar Auth, senha, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
