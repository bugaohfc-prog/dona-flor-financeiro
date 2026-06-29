# Plano de restrição da função `is_admin`

Data do plano: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento prepara um ciclo futuro de restrição de `EXECUTE` da função `public.is_admin()`.

Este ciclo é somente documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de Auth, RLS, policy, frontend, service, hook, migration ou dados.

## Resumo

`public.is_admin()` é uma função `SECURITY DEFINER` usada como helper de permissão administrativa.

A função usa `auth.uid()` e retorna `boolean` quando existe vínculo em `public.df_usuarios_empresas` com:

```sql
user_id = auth.uid()
and perfil = 'admin'
```

Achado importante da auditoria anterior:

- não há evidência de chamada direta pelo app atual;
- não há uso textual encontrado em policies/RLS;
- fluxos atuais usam helpers mais específicos, como `df_usuario_eh_admin` e `is_master`, ou leitura direta de vínculo/perfil;
- ainda pode existir uso legado externo fora do código versionado;
- por prudência, `authenticated` deve ser mantido até validação completa.

## Resultado da execução da Fase 1

Data da execução: 2026-06-29

SQL executado:

```sql
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin() from public;
```

Não foi executado `REVOKE` de `authenticated`.

### Diagnóstico antes

| Role | EXECUTE efetivo antes |
| --- | --- |
| `PUBLIC` | sim |
| `anon` | sim |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

ACL antes:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

Função antes:

- assinatura: `public.is_admin()`;
- retorno: `boolean`;
- linguagem: `sql`;
- owner: `postgres`;
- `SECURITY DEFINER`: `true`;
- `search_path`: `public`;
- hash da definição: `c3007d22aaf6abfbf756dba7debffdb6`.

Uso no código e policies antes:

- não há chamada versionada da RPC em `src`, `supabase/functions` ou `scripts`;
- busca textual em policies/RLS retornou `0` policies usando `is_admin`.

### Validação antes

- Login normal: não validado operacionalmente por falta de sessão/credencial real neste ambiente.
- Áreas administrativas: não validadas operacionalmente por falta de sessão real neste ambiente.
- Permissões Admin/Master: não validadas operacionalmente por falta de sessão real neste ambiente.
- Integridade de dados: não foi executado `INSERT`, `UPDATE` ou `DELETE` em `df_usuarios_empresas` neste ciclo.
- Contagem de `df_usuarios_empresas` antes: `6`.
- Decisão: prosseguir foi considerado seguro porque a mudança preserva `authenticated`, não há uso versionado da RPC no app atual e não há policy/RLS usando a função.

### Diagnóstico depois

| Role | EXECUTE efetivo depois |
| --- | --- |
| `PUBLIC` | não |
| `anon` | não |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

ACL depois:

```text
{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

Função depois:

- assinatura preservada: `public.is_admin()`;
- retorno preservado: `boolean`;
- linguagem preservada: `sql`;
- owner preservado: `postgres`;
- `SECURITY DEFINER` preservado: `true`;
- `search_path` preservado: `public`;
- hash da definição preservado: `c3007d22aaf6abfbf756dba7debffdb6`.

### Validação depois

- Login normal: não validado operacionalmente por falta de sessão/credencial real neste ambiente.
- Áreas administrativas: não validadas operacionalmente por falta de sessão real neste ambiente.
- Permissões Admin/Master: não validadas operacionalmente por falta de sessão real neste ambiente.
- Integridade de dados: não foi executado `INSERT`, `UPDATE` ou `DELETE` em `df_usuarios_empresas` neste ciclo.
- Contagem de `df_usuarios_empresas` depois: `6`.
- Advisor: consultado. `is_admin` não apareceu mais no alerta `anon_security_definer_function_executable`; permaneceu no alerta `authenticated_security_definer_function_executable`, conforme esperado porque `authenticated` foi mantido.

### Rollback operacional

Se houver falha operacional relacionada a login, áreas administrativas ou permissões, executar:

```sql
grant execute on function public.is_admin() to public;
grant execute on function public.is_admin() to anon;
```

Não executar `GRANT` para `authenticated` como rollback padrão, pois `authenticated` não foi revogado neste ciclo.

## Estratégia em fases

### Fase 1 - reduzir exposição pública mantendo `authenticated`

Objetivo:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated`;
- preservar `postgres` e `service_role`;
- validar login, áreas administrativas e permissões admin/master antes/depois.

Justificativa:

- `anon` não deveria precisar executar helper de permissão/admin baseado em `auth.uid()`;
- `PUBLIC` mantém exposição efetiva mesmo se grants diretos forem removidos;
- `authenticated` deve ser mantido até confirmar que nenhum fluxo do app, RLS/policy ou integração externa depende diretamente da função.

### Fase 2 - não executar agora

Não planejar revogar `authenticated` neste momento.

`authenticated` só poderá ser avaliado depois de confirmar que nenhum fluxo do app, RLS/policy ou integração externa depende diretamente de `/rpc/is_admin`, ou após refatoração específica que remova qualquer dependência dessa RPC.

## Matriz de validação antes/depois

| Validação | Antes do REVOKE futuro | Depois do REVOKE futuro |
| --- | --- | --- |
| ACL da função | Confirmar grants atuais para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role` | Confirmar `PUBLIC` e `anon` sem `EXECUTE`; `authenticated`, `postgres` e `service_role` preservados |
| Função intacta | Confirmar assinatura, owner, `SECURITY DEFINER`, `search_path` e hash/definição | Repetir conferência para garantir que não houve `ALTER FUNCTION` |
| Uso no app | Confirmar uso ou ausência de uso direto da RPC | Confirmar que nenhum fluxo passou a depender da RPC durante o ciclo |
| Uso em RLS/policies | Confirmar ausência de policy citando `is_admin` | Reconfirmar que nenhuma policy foi alterada |
| Login normal | Validar login por Supabase Auth sem registrar senha/token | Repetir login normal |
| Áreas administrativas | Validar acesso Admin/Master às áreas administrativas esperadas | Repetir validação das áreas administrativas |
| Permissões Admin/Master | Validar que Admin/Master mantêm ações permitidas | Confirmar que permissões permanecem íntegras |
| Operador/Gerente | Confirmar que não ganharam acesso sensível | Reconfirmar que não ganharam acesso sensível |
| Integridade de dados | Confirmar que nenhum dado de teste persistente será criado | Confirmar que `df_usuarios_empresas` não sofreu alteração |
| Advisor | Registrar alerta atual para `anon`/`authenticated`/`PUBLIC`, se possível | Verificar se saiu do alerta `anon` e se permaneceu apenas `authenticated`/`search_path`, se aplicável |

## Validações antes de qualquer REVOKE

Antes de executar a Fase 1 em ciclo futuro:

1. Confirmar ACL atual de `public.is_admin()`.
2. Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
3. Confirmar `postgres` e `service_role` com `EXECUTE`.
4. Confirmar função intacta, sem alteração de definição.
5. Confirmar uso ou ausência de uso da função no app.
6. Confirmar uso ou ausência de uso em policies/RLS.
7. Validar login normal via Supabase Auth.
8. Validar acesso às áreas administrativas.
9. Validar permissões de Admin/Master, se aplicável.
10. Confirmar que Gerente/Operador não ganharam ação sensível.
11. Não alterar dados persistentes de teste.

## Validações depois do REVOKE futuro

Depois da Fase 1, no mesmo ciclo futuro:

1. Confirmar `anon` sem `EXECUTE` efetivo.
2. Confirmar `PUBLIC` sem `EXECUTE` efetivo.
3. Confirmar `authenticated` ainda com `EXECUTE` efetivo.
4. Confirmar `postgres` e `service_role` preservados.
5. Confirmar função intacta.
6. Validar login normal via Supabase Auth.
7. Validar áreas administrativas.
8. Validar permissões de Admin/Master, se aplicável.
9. Confirmar que `df_usuarios_empresas` não sofreu alteração.
10. Consultar Supabase Advisor, se possível, para verificar se saiu do alerta `anon` e se permaneceu apenas em `authenticated`/`search_path`, se aplicável.

## Riscos específicos

- Quebra de fluxos administrativos se houver uso não mapeado da RPC.
- Impacto em permissões se algum app, RLS/policy ou integração externa depender de `is_admin`.
- Exposição de status admin se `anon` ou `PUBLIC` permanecerem com `EXECUTE`.
- `auth.uid()` depende do contexto da sessão; testes não devem simular contexto incorreto.
- Possível uso legado externo fora do código versionado.
- Não revogar `authenticated` sem confirmação completa.
- Não misturar grants com alteração de função, RLS, Auth, frontend, service ou hook.
- Sem homologação, aplicar apenas em ciclo curto com rollback imediato.

## SQL futuro proposto, comentado

Diagnóstico antes:

```sql
-- select
--   has_function_privilege('public', 'public.is_admin()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.is_admin()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE') as service_role_has_execute;
```

Fase 1:

```sql
-- revoke execute on function public.is_admin() from anon;
-- revoke execute on function public.is_admin() from public;
```

Não executar neste momento:

```sql
-- revoke execute on function public.is_admin() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.is_admin() to public;
-- grant execute on function public.is_admin() to anon;
```

Se necessário por segurança operacional:

```sql
-- grant execute on function public.is_admin() to authenticated;
```

## Critério para prosseguir em ciclo futuro

Prosseguir para Fase 1 somente se:

- o app continuar autenticando por Supabase Auth;
- não houver evidência de chamada direta da RPC no app atual;
- nenhuma policy/RLS depender diretamente de `is_admin`;
- fluxos administrativos puderem ser validados antes/depois;
- rollback estiver pronto;
- a execução se limitar a `anon` e `PUBLIC`.

Não prosseguir se:

- houver dúvida sobre acesso administrativo;
- houver indício de uso externo crítico não mapeado;
- for necessário alterar frontend, service, Auth, RLS ou a função no mesmo ciclo.
