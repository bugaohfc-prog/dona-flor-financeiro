# Auditoria da função `vincular_usuario_logado`

Data da auditoria: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.vincular_usuario_logado()`, apontada como ponto crítico `SECURITY DEFINER` por estar ligada ao vínculo de usuário autenticado com empresa.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service ou hook.

## Resumo executivo

`public.vincular_usuario_logado()` é uma função `plpgsql`, `SECURITY DEFINER`, sem argumentos, com retorno `void`, owner `postgres` e `search_path=public`.

A função atualiza `public.df_usuarios_empresas`, preenchendo `user_id` com `auth.uid()` nos registros em que `email = auth.email()` e `user_id is null`.

Não foram encontradas dependências por trigger, policy, view ou outra função. Diferente das funções trigger-only auditadas anteriormente, esta função é chamada diretamente pelo app via RPC:

- `src/pages/Login.jsx`, logo após `supabase.auth.signInWithPassword`.
- `src/services/tenantService.js`, em `sincronizarUsuarioLogadoComEmpresa()`.

Classificação desta auditoria: **alto**.

Motivo: a função é sensível por vincular usuário autenticado a registros de empresa já existentes. Ela não altera perfil, empresa ou permissão diretamente, mas ao preencher `user_id` pode ativar acesso operacional ao vínculo existente. Como o app atual depende da RPC depois do login, `authenticated` deve ser mantido por enquanto. `PUBLIC` e `anon` são candidatos a restrição em ciclo futuro controlado.

## Evidências do catálogo Postgres

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `vincular_usuario_logado` |
| Assinatura | `public.vincular_usuario_logado()` |
| Argumentos | nenhum |
| Retorno | `void` |
| Linguagem | `plpgsql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `public` |
| Hash da definição | `abbae47b82a0d609393b5782f08ffe49` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.vincular_usuario_logado()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.df_usuarios_empresas
  set user_id = auth.uid()
  where email = auth.email()
    and user_id is null;
end;
$function$
```

## Definição funcional

Em linguagem simples, a função tenta vincular o usuário logado a registros pendentes em `df_usuarios_empresas`.

Ela usa:

- `auth.uid()` para obter o ID do usuário autenticado.
- `auth.email()` para obter o e-mail do usuário autenticado.
- `public.df_usuarios_empresas.email` para localizar vínculos pendentes.
- `public.df_usuarios_empresas.user_id` para gravar o ID do usuário autenticado.

Ela altera:

- `public.df_usuarios_empresas.user_id`.

Ela não altera diretamente:

- `empresa_id`;
- `perfil`;
- `email`;
- `loja`;
- `status`;
- senha;
- dados de Auth.

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

Leitura de risco: `PUBLIC` mantém a função exposta de forma efetiva para roles que herdam de `PUBLIC`. `anon` também aparece com grant direto. `authenticated` é usado pelo fluxo atual do app.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies | nenhuma policy citando textualmente a função |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual encontrada |

## Evidência de uso no código

Chamadas RPC diretas encontradas:

- `src/pages/Login.jsx`: chama `supabase.rpc('vincular_usuario_logado')` após login bem-sucedido com `supabase.auth.signInWithPassword`.
- `src/services/tenantService.js`: `sincronizarUsuarioLogadoComEmpresa()` chama `supabase.rpc('vincular_usuario_logado')`.

Também foi verificado:

- não foi encontrada string literal `/rpc/vincular_usuario_logado` no código versionado;
- não foi encontrada chamada em Edge Function;
- o uso principal depende de usuário autenticado, pois a função usa `auth.uid()` e `auth.email()`.

## Tabelas afetadas

| Tabela | Uso |
| --- | --- |
| `public.df_usuarios_empresas` | atualiza `user_id` quando `email = auth.email()` e `user_id is null` |

Dados alterados pela função:

- `user_id` em registros pendentes de vínculo.

Dados retornados:

- nenhum dado é retornado; retorno `void`.

## Riscos práticos

### Risco se `anon` puder executar

**Alto.** Em contexto anônimo, `auth.uid()` e `auth.email()` tendem a ser nulos e a atualização provavelmente não encontra linhas. Ainda assim, a função sensível fica exposta como RPC, o que é desnecessário e aumenta superfície de ataque.

### Risco se `PUBLIC` mantiver EXECUTE

**Alto.** Enquanto `PUBLIC` tiver `EXECUTE`, remover apenas grants diretos de roles específicas pode não eliminar a exposição efetiva. Para reduzir o alerta de exposição pública, `PUBLIC` precisa ser tratado em ciclo próprio.

### Risco se `authenticated` puder executar

**Médio/alto, mas esperado no fluxo atual.** Qualquer usuário autenticado pode chamar a função, mas o filtro por `auth.email()` limita o vínculo ao e-mail da sessão. O risco prático está em vincular todos os registros pendentes com o mesmo e-mail e ativar acessos já cadastrados em `df_usuarios_empresas`.

### Risco de vínculo indevido

**Médio/alto.** Se houver registros pendentes com e-mail incorreto, duplicado ou legado, a função pode preencher `user_id` para todos os registros com esse e-mail e `user_id is null`. Ela não cria perfil ou permissão nova, mas pode ativar acesso a empresas/perfis previamente registrados.

### Risco de escalar empresa/perfil/permissão

**Médio.** A função não altera `empresa_id`, `perfil` ou permissões diretamente. Porém, ao preencher `user_id`, ela pode tornar efetivo um vínculo que já continha empresa/perfil/permissão.

## Classificação

Classificação final: **alto**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- manipula vínculo usuário-empresa;
- usa contexto de Auth;
- chamada diretamente pelo app após login;
- impacto potencial em acesso multiempresa se houver vínculo pendente incorreto.

## Recomendação segura

Recomendação desta auditoria:

- **manter temporariamente** a função ativa;
- **`anon` restrito na Fase 1 em 2026-06-29**;
- **`PUBLIC` restrito na Fase 1 em 2026-06-29**;
- **manter `authenticated` por enquanto**, porque o app atual chama a RPC depois do login;
- **restringir `authenticated` somente após plano próprio**, substituição do fluxo ou validação de que o vínculo automático não depende mais da RPC.

Status após Fase 1: `PUBLIC` e `anon` ficaram sem `EXECUTE` efetivo; `authenticated`, `postgres` e `service_role` foram preservados.

## SQL futuro proposto, comentado

Diagnóstico antes de qualquer restrição futura:

```sql
-- select
--   has_function_privilege('public', 'public.vincular_usuario_logado()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.vincular_usuario_logado()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.vincular_usuario_logado()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.vincular_usuario_logado()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.vincular_usuario_logado()', 'EXECUTE') as service_role_has_execute;
```

Fase 1 candidata, somente após ciclo autorizado:

```sql
-- revoke execute on function public.vincular_usuario_logado() from anon;
-- revoke execute on function public.vincular_usuario_logado() from public;
```

Fase 2, somente após substituir ou validar o fluxo do app:

```sql
-- revoke execute on function public.vincular_usuario_logado() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.vincular_usuario_logado() to public;
-- grant execute on function public.vincular_usuario_logado() to anon;
-- grant execute on function public.vincular_usuario_logado() to authenticated;
```

## Próximos passos

Plano de restrição específico criado em `docs/supabase/funcoes/vincular_usuario_logado-plano-restricao.md`.

Status da Fase 1 registrado no plano: `EXECUTE` foi revogado de `anon` e `PUBLIC`, mantendo `authenticated`.

1. Monitorar login atual e sincronização de empresa.
2. Não planejar revogar `authenticated` agora; isso só deve ser avaliado se o fluxo de vínculo for redesenhado ou se a chamada RPC for removida do app.
3. Manter rollback operacional pronto para `PUBLIC` e `anon` caso apareça falha relacionada.

## O que não mexer agora

- Não revogar `authenticated`.
- Não alterar a função.
- Não alterar Auth, senha, trigger, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
