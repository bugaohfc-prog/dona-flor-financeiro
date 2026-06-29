# Plano de restrição da função `vincular_usuario_logado`

Data do plano: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento prepara um ciclo futuro de restrição de `EXECUTE` da função `public.vincular_usuario_logado()`.

Este ciclo é somente documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de Auth, RLS, policy, frontend, service, hook, migration ou dados.

## Resumo

`public.vincular_usuario_logado()` é uma função `SECURITY DEFINER` usada pelo app para vincular o usuário autenticado a registros pendentes em `public.df_usuarios_empresas`.

A função usa `auth.uid()` e `auth.email()` e atualiza `df_usuarios_empresas.user_id` quando:

```sql
email = auth.email()
and user_id is null
```

O app chama essa RPC em:

- `src/pages/Login.jsx`, após login com `supabase.auth.signInWithPassword`.
- `src/services/tenantService.js`, em `sincronizarUsuarioLogadoComEmpresa()`.

Por isso, a restrição futura deve remover apenas `anon` e `PUBLIC` na Fase 1, mantendo `authenticated`.

## Estratégia em fases

### Fase 1 - reduzir exposição pública mantendo o fluxo atual

Objetivo:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated`;
- preservar `postgres` e `service_role`;
- validar login e sincronização de empresa antes/depois.

Justificativa:

- `anon` não deveria precisar executar uma função que depende de `auth.uid()` e `auth.email()`;
- `PUBLIC` mantém exposição efetiva mesmo se grants diretos forem removidos;
- `authenticated` é necessário enquanto o app chamar `supabase.rpc('vincular_usuario_logado')`.

### Fase 2 - não executar agora

Não planejar revogar `authenticated` neste momento.

`authenticated` só poderá ser avaliado em ciclo futuro se houver decisão de refatorar/remover a chamada RPC do app ou substituir o vínculo por outro fluxo validado. Sem essa mudança, revogar `authenticated` tende a quebrar login/sincronização de empresa.

## Matriz de validação antes/depois

| Validação | Antes do REVOKE futuro | Depois do REVOKE futuro |
| --- | --- | --- |
| ACL da função | Confirmar grants atuais para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role` | Confirmar `PUBLIC` e `anon` sem `EXECUTE`; `authenticated`, `postgres` e `service_role` preservados |
| Função intacta | Confirmar assinatura, owner, `SECURITY DEFINER`, `search_path` e hash/definição | Repetir conferência para garantir que não houve `ALTER FUNCTION` |
| Uso no app | Confirmar chamada em `Login.jsx` e `tenantService.js` | Confirmar que o app continua chamando como usuário autenticado |
| Login normal | Validar login por Supabase Auth sem registrar senha/token | Repetir login normal |
| Sincronização de empresa | Confirmar que o vínculo/tenant é carregado após login | Confirmar que o tenant continua carregando após login |
| Execução autenticada | Confirmar que usuário autenticado consegue executar o fluxo necessário | Confirmar que `authenticated` ainda executa a RPC |
| Integridade de vínculo | Confirmar que nenhum vínculo real será alterado indevidamente no teste | Confirmar que `df_usuarios_empresas` não sofreu alteração indevida |
| Advisor | Registrar alerta atual para `anon`/`authenticated`/`PUBLIC`, se possível | Verificar se saiu do alerta `anon` e se permaneceu apenas `authenticated`/`search_path`, se aplicável |

## Validações antes de qualquer REVOKE

Antes de executar a Fase 1 em ciclo futuro:

1. Confirmar ACL atual de `public.vincular_usuario_logado()`.
2. Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
3. Confirmar `postgres` e `service_role` com `EXECUTE`.
4. Confirmar função intacta, sem alteração de definição.
5. Confirmar que o app chama a RPC em `src/pages/Login.jsx`.
6. Confirmar que o app chama a RPC em `src/services/tenantService.js`.
7. Validar login normal via Supabase Auth.
8. Validar sincronização de empresa/tenant após login.
9. Confirmar que usuário autenticado consegue executar o fluxo necessário.
10. Não alterar vínculo real indevidamente.

## Validações depois do REVOKE futuro

Depois da Fase 1, no mesmo ciclo futuro:

1. Confirmar `anon` sem `EXECUTE` efetivo.
2. Confirmar `PUBLIC` sem `EXECUTE` efetivo.
3. Confirmar `authenticated` ainda com `EXECUTE` efetivo.
4. Confirmar `postgres` e `service_role` preservados.
5. Confirmar função intacta.
6. Validar login normal via Supabase Auth.
7. Validar sincronização de empresa/tenant após login.
8. Confirmar que `df_usuarios_empresas` não sofreu alteração indevida.
9. Consultar Supabase Advisor, se possível, para verificar se a função saiu do alerta `anon` e permaneceu apenas em `authenticated`/`search_path`, se aplicável.

## Riscos específicos

- Vínculo indevido de `user_id` em `public.df_usuarios_empresas` se houver registros pendentes incorretos ou duplicados por e-mail.
- Impacto direto no login/sincronização de empresa, porque o app chama a RPC após autenticação.
- `auth.uid()` e `auth.email()` dependem do contexto da sessão; testes não devem simular contexto incorreto.
- `authenticated` é necessário no desenho atual do app.
- Não revogar `authenticated` sem refatoração prévia.
- Pode existir uso legado externo fora do código versionado.
- Não misturar grants com alteração de função, RLS, Auth, frontend, service ou hook.
- Sem homologação, aplicar apenas em ciclo curto com rollback imediato.

## SQL futuro proposto, comentado

Diagnóstico antes:

```sql
-- select
--   has_function_privilege('public', 'public.vincular_usuario_logado()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.vincular_usuario_logado()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.vincular_usuario_logado()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.vincular_usuario_logado()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.vincular_usuario_logado()', 'EXECUTE') as service_role_has_execute;
```

Fase 1:

```sql
-- revoke execute on function public.vincular_usuario_logado() from anon;
-- revoke execute on function public.vincular_usuario_logado() from public;
```

Não executar neste momento:

```sql
-- revoke execute on function public.vincular_usuario_logado() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.vincular_usuario_logado() to public;
-- grant execute on function public.vincular_usuario_logado() to anon;
```

Se necessário por segurança operacional:

```sql
-- grant execute on function public.vincular_usuario_logado() to authenticated;
```

## Critério para prosseguir em ciclo futuro

Prosseguir para Fase 1 somente se:

- o app continuar autenticando por Supabase Auth;
- a chamada RPC continuar ocorrendo como usuário autenticado;
- houver janela curta para validação;
- rollback estiver pronto;
- a execução se limitar a `anon` e `PUBLIC`.

Não prosseguir se:

- houver dúvida sobre login ou sincronização de empresa;
- houver indício de uso externo crítico não mapeado;
- for necessário alterar frontend, service, Auth, RLS ou a função no mesmo ciclo.
