# Auditoria da função `is_master`

Data da auditoria: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.is_master()`, apontada como ponto crítico `SECURITY DEFINER` por estar ligada à verificação de permissão Master.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service ou hook.

## Resumo executivo

`public.is_master()` é uma função `sql`, `SECURITY DEFINER`, sem argumentos, com retorno `boolean`, owner `postgres` e `search_path=public`.

A função lê `public.df_usuarios_master` e retorna `true` quando existe registro para `user_id = auth.uid()`.

Diferente de helpers legados auditados antes, `is_master` é dependência ativa de RLS/policies e também aparece em código versionado:

- 27 referências em policies;
- tabelas afetadas: `df_assinaturas`, `df_auditoria_admin`, `df_contas`, `df_contas_pagamentos`, `df_destinatarios_alertas`, `df_notas`, `df_usuarios_empresas`, `df_usuarios_filiais`;
- chamada direta em `supabase/functions/convidar-usuario/index.ts`;
- chamada por script diagnóstico `scripts/validar-rls-df-funcionarios.mjs`.

Classificação desta auditoria: **crítico**.

Motivo: a função participa de decisões de autorização em várias policies de produção. Qualquer restrição de `authenticated` pode quebrar RLS, fluxos administrativos, financeiro, usuários, filiais, destinatários de alertas e notas. `anon` e `PUBLIC` ainda são candidatos a avaliação futura por exposição, mas apenas com plano próprio, matriz RLS e validação operacional ampla. `authenticated` não deve ser revogado neste momento.

## Assinatura

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `is_master` |
| Assinatura | `public.is_master()` |
| Argumentos | nenhum |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `public` |
| Hash da definição | `0ae7a94df00e970385f5cf68ada3925a` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.is_master()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
      select 1
          from public.df_usuarios_master
              where user_id = auth.uid()
                );
                $function$
```

## Definição funcional

Em linguagem simples, a função verifica se o usuário autenticado está registrado como Master global em `df_usuarios_master`.

Ela usa:

- `auth.uid()` para obter o ID do usuário autenticado.
- `public.df_usuarios_master.user_id` para verificar status Master.

Ela não usa:

- `auth.email()`.

Ela não altera dados.

## Grants atuais

ACL atual após restrição de 2026-06-30:

```text
{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Role | EXECUTE direto/efetivo |
| --- | --- |
| `PUBLIC` | não |
| `anon` | não |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

Leitura de risco: `PUBLIC` e `anon` não possuem mais execução efetiva. `authenticated` foi preservado porque é necessário para policies e fluxos versionados que dependem da função.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies/RLS | 27 referências textuais encontradas |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual em outra função `public` encontrada |

Tabelas com policies que citam `is_master`:

- `public.df_assinaturas`
- `public.df_auditoria_admin`
- `public.df_contas`
- `public.df_contas_pagamentos`
- `public.df_destinatarios_alertas`
- `public.df_notas`
- `public.df_usuarios_empresas`
- `public.df_usuarios_filiais`

Leitura: `authenticated` não deve ser revogado sem redesenho ou matriz de validação RLS completa.

Matriz detalhada criada em ciclo posterior:

- `docs/supabase/funcoes/is_master-matriz-rls.md`

Essa matriz mapeia as 27 policies em 8 tabelas antes de qualquer plano de restrição. A recomendação atual continua sendo não revogar `authenticated` e não executar `REVOKE` de `anon`/`PUBLIC` até a matriz ser revisada e validada operacionalmente.

Diagnóstico específico de `anon`/`PUBLIC` criado em ciclo posterior:

- `docs/supabase/funcoes/is_master-diagnostico-anon-public.md`

Esse diagnóstico confirmou que as 27 policies com `is_master()` são para `{authenticated}` e não há policy dependente de `is_master()` para `anon`. Em 2026-06-30, `EXECUTE` foi removido de `anon` e `PUBLIC`, mantendo `authenticated`.

## Evidência de uso no código

Chamadas diretas encontradas:

- `supabase/functions/convidar-usuario/index.ts`: chama `supabaseUser.rpc('is_master')`.
- `scripts/validar-rls-df-funcionarios.mjs`: chama `client.rpc('is_master')` em diagnóstico.

Não foi encontrada chamada literal `/rpc/is_master` em `src`, `supabase/functions` ou `scripts`.

Uso relacionado:

- o app e Edge Functions também usam helpers como `df_usuario_eh_admin`;
- várias migrations e docs de RLS tratam `public.is_master()` como helper ativo de autorização.

## Tabelas afetadas/lidas

| Tabela | Uso |
| --- | --- |
| `public.df_usuarios_master` | lê existência de registro por `user_id = auth.uid()` |

Dados retornados:

- `boolean`: `true` se existir registro Master; `false` caso contrário.

Dados não retornados:

- `empresa_id`;
- perfil textual;
- loja;
- permissões detalhadas;
- e-mail;
- senha;
- dados de Auth.

## Riscos práticos

### Risco se `anon` puder executar

**Alto, mitigado em 2026-06-30.** Em contexto anônimo, `auth.uid()` tende a ser nulo e a função provavelmente retorna `false`. Ainda assim, expor uma função `SECURITY DEFINER` de permissão Master para `anon` era desnecessário e aumentava superfície de ataque. `anon` não possui mais `EXECUTE` efetivo.

### Risco se `PUBLIC` mantiver EXECUTE

**Alto, mitigado em 2026-06-30.** Enquanto `PUBLIC` tiver `EXECUTE`, roles que herdam de `PUBLIC` podem manter execução efetiva. `PUBLIC` não possui mais `EXECUTE` efetivo.

### Risco se `authenticated` puder executar

**Alto, mas necessário no desenho atual.** A função retorna status Master do usuário autenticado e é usada em policies/RLS. Revogar `authenticated` agora pode quebrar autorização de leitura/escrita em múltiplas tabelas e Edge Function.

### Risco de exposição de status Master

**Alto.** Mesmo sem retornar dados de empresa ou perfil completo, a resposta `true/false` informa se o usuário possui privilégio Master global.

### Risco de impacto em RLS/policies

**Crítico.** A função é citada em 27 policies. Qualquer mudança de permissão para `authenticated` pode causar falhas de SELECT/INSERT/UPDATE/DELETE em áreas financeiras, usuários, filiais, destinatários de alertas, auditoria e notas.

## Classificação

Classificação final: **crítico**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- calcula status Master global;
- usada por 27 policies;
- chamada por Edge Function `convidar-usuario`;
- impacto potencial em RLS, administração, financeiro, usuários e multiempresa.

## Recomendação segura

Recomendação desta auditoria após a restrição de 2026-06-30:

- **manter `anon` sem `EXECUTE`**;
- **manter `PUBLIC` sem `EXECUTE`**;
- **manter `authenticated`**;
- **não restringir `authenticated` enquanto usado por RLS/app**;
- **tratar qualquer mudança adicional em ciclo próprio**.

Não executar novas alterações neste ciclo.

## SQL futuro proposto, comentado

Consulta de diagnóstico de privilégios:

```sql
-- select
--   has_function_privilege('public', 'public.is_master()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.is_master()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.is_master()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.is_master()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.is_master()', 'EXECUTE') as service_role_has_execute;
```

Executado em 2026-06-30:

```sql
-- revoke execute on function public.is_master() from anon;
-- revoke execute on function public.is_master() from public;
```

Não planejar neste momento:

```sql
-- revoke execute on function public.is_master() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.is_master() to public;
-- grant execute on function public.is_master() to anon;
```

Se `authenticated` for tratado em ciclo posterior:

```sql
-- grant execute on function public.is_master() to authenticated;
```

## Próximos passos

1. Manter `authenticated` preservado.
2. Não avançar para revogar `authenticated` enquanto a função for usada por RLS/policies/app.
3. Validar a Edge Function `convidar-usuario` em janela operacional se a equipe considerar necessário.
4. Tratar `df_usuario_eh_admin`, `df_usuario_tem_perfil_empresa`, `df_usuario_alvo_eh_master` e `df_empresas_do_usuario` em ciclos próprios.
5. Tratar grants diretos de `anon` em tabelas e policies `{public}` como frente separada de RLS/permissões.

## O que não mexer agora

- Não executar novos `REVOKE` neste ciclo.
- Não revogar `authenticated`.
- Não alterar a função.
- Não alterar Auth, senha, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
