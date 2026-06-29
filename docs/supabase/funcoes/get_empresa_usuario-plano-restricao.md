# Plano de restrição da função `get_empresa_usuario`

Data do plano: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento prepara um ciclo futuro de restrição de `EXECUTE` da função `public.get_empresa_usuario()`.

Este ciclo é somente documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de Auth, RLS, policy, frontend, service, hook, migration ou dados.

## Resumo

`public.get_empresa_usuario()` é uma função `SECURITY DEFINER` usada para resolver empresa/tenant do usuário autenticado a partir de `public.df_usuarios_empresas`.

A função usa `auth.uid()` e retorna `empresa_id` quando:

```sql
user_id = auth.uid()
```

Achado importante da auditoria anterior:

- não há evidência de chamada direta pelo app atual;
- `src/services/tenantService.js` resolve tenant lendo `df_usuarios_empresas` diretamente por `user_id`;
- ainda pode existir uso legado externo fora do código versionado;
- por prudência, `authenticated` deve ser mantido até validação completa.

## Estratégia em fases

### Fase 1 - reduzir exposição pública mantendo `authenticated`

Objetivo:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated`;
- preservar `postgres` e `service_role`;
- validar login e carregamento de tenant antes/depois.

Justificativa:

- `anon` não deveria precisar executar função que depende de `auth.uid()`;
- `PUBLIC` mantém exposição efetiva mesmo se grants diretos forem removidos;
- `authenticated` deve ser mantido até confirmar que nenhum fluxo atual ou legado depende diretamente da RPC.

### Fase 2 - não executar agora

Não planejar revogar `authenticated` neste momento.

`authenticated` só poderá ser avaliado depois de confirmar que nenhum fluxo do app depende diretamente de `/rpc/get_empresa_usuario`, ou após refatoração específica que remova qualquer dependência dessa RPC.

## Matriz de validação antes/depois

| Validação | Antes do REVOKE futuro | Depois do REVOKE futuro |
| --- | --- | --- |
| ACL da função | Confirmar grants atuais para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role` | Confirmar `PUBLIC` e `anon` sem `EXECUTE`; `authenticated`, `postgres` e `service_role` preservados |
| Função intacta | Confirmar assinatura, owner, `SECURITY DEFINER`, `search_path` e hash/definição | Repetir conferência para garantir que não houve `ALTER FUNCTION` |
| Uso no app | Confirmar se o app chama ou não chama a RPC | Confirmar que nenhum fluxo passou a depender da RPC durante o ciclo |
| Login normal | Validar login por Supabase Auth sem registrar senha/token | Repetir login normal |
| Carregamento de tenant | Confirmar carregamento de empresa/tenant após login | Confirmar carregamento de empresa/tenant após o REVOKE |
| `tenantService.js` | Confirmar que resolve empresa por leitura direta em `df_usuarios_empresas` | Confirmar que o fluxo segue funcionando sem depender da RPC |
| Execução autenticada | Confirmar necessidade de manter `authenticated` | Confirmar `authenticated` ainda com `EXECUTE` efetivo |
| Integridade de vínculo | Confirmar que nenhum dado real será alterado no teste | Confirmar que `df_usuarios_empresas` não sofreu alteração |
| Advisor | Registrar alerta atual para `anon`/`authenticated`/`PUBLIC`, se possível | Verificar se saiu do alerta `anon` e se permaneceu apenas `authenticated`/`search_path`, se aplicável |

## Validações antes de qualquer REVOKE

Antes de executar a Fase 1 em ciclo futuro:

1. Confirmar ACL atual de `public.get_empresa_usuario()`.
2. Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
3. Confirmar `postgres` e `service_role` com `EXECUTE`.
4. Confirmar função intacta, sem alteração de definição.
5. Confirmar se o app chama ou não chama a RPC.
6. Validar login normal via Supabase Auth.
7. Validar carregamento de tenant/empresa após login.
8. Validar o fluxo atual de `src/services/tenantService.js`.
9. Confirmar que usuário autenticado consegue resolver empresa corretamente.
10. Não alterar vínculo real indevidamente.
11. Não criar dados persistentes de teste.

## Validações depois do REVOKE futuro

Depois da Fase 1, no mesmo ciclo futuro:

1. Confirmar `anon` sem `EXECUTE` efetivo.
2. Confirmar `PUBLIC` sem `EXECUTE` efetivo.
3. Confirmar `authenticated` ainda com `EXECUTE` efetivo.
4. Confirmar `postgres` e `service_role` preservados.
5. Confirmar função intacta.
6. Validar login normal via Supabase Auth.
7. Validar carregamento de tenant/empresa após login.
8. Confirmar que `df_usuarios_empresas` não sofreu alteração.
9. Consultar Supabase Advisor, se possível, para verificar se saiu do alerta `anon` e se permaneceu apenas em `authenticated`/`search_path`, se aplicável.

## Riscos específicos

- Quebra de carregamento de tenant/empresa se houver uso não mapeado da RPC.
- O app pode depender da RPC em fluxo legado externo ou versão não versionada.
- Exposição de `empresa_id`/tenant se `anon` ou `PUBLIC` permanecerem com `EXECUTE`.
- `auth.uid()` depende do contexto da sessão; testes não devem simular contexto incorreto.
- Não revogar `authenticated` sem confirmação completa do fluxo.
- Não misturar grants com alteração de função, RLS, Auth, frontend, service ou hook.
- Sem homologação, aplicar apenas em ciclo curto com rollback imediato.

## SQL futuro proposto, comentado

Diagnóstico antes:

```sql
-- select
--   has_function_privilege('public', 'public.get_empresa_usuario()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.get_empresa_usuario()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.get_empresa_usuario()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.get_empresa_usuario()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.get_empresa_usuario()', 'EXECUTE') as service_role_has_execute;
```

Fase 1:

```sql
-- revoke execute on function public.get_empresa_usuario() from anon;
-- revoke execute on function public.get_empresa_usuario() from public;
```

Não executar neste momento:

```sql
-- revoke execute on function public.get_empresa_usuario() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.get_empresa_usuario() to public;
-- grant execute on function public.get_empresa_usuario() to anon;
```

Se necessário por segurança operacional:

```sql
-- grant execute on function public.get_empresa_usuario() to authenticated;
```

## Critério para prosseguir em ciclo futuro

Prosseguir para Fase 1 somente se:

- o app continuar autenticando por Supabase Auth;
- o tenant continuar sendo resolvido pelo fluxo atual de `tenantService.js`;
- não houver evidência de chamada direta da RPC no app atual;
- houver janela curta para validação;
- rollback estiver pronto;
- a execução se limitar a `anon` e `PUBLIC`.

Não prosseguir se:

- houver dúvida sobre login ou carregamento de tenant;
- houver indício de uso externo crítico não mapeado;
- for necessário alterar frontend, service, Auth, RLS ou a função no mesmo ciclo.
