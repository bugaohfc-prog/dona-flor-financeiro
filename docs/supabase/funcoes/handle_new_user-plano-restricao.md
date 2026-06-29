# Plano de restrição da função handle_new_user

Data: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função alvo: `public.handle_new_user()`

## Escopo

Este documento prepara um ciclo futuro de restrição de `EXECUTE` da função `public.handle_new_user()`.

Este ciclo é somente documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de trigger, Auth, senha, Edge Function, frontend, service, hook, RLS/policy/view/índice, migration, alteração de dados ou outras permissões.

## Resumo executivo

A função `handle_new_user` é `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, retorna `trigger` e é usada pelo trigger `on_auth_user_created`, `AFTER INSERT` em `auth.users`.

Ela insere `new.id` em `public.profiles(id)` com `on conflict (id) do nothing`. Não há evidência de chamada RPC direta pelo app, Edge Functions ou scripts versionados.

Recomendação deste plano: restringir em fases, sem misturar grants com alteração de trigger, Auth, senha ou `search_path`.

## Riscos específicos

| Risco | Impacto prático | Mitigação antes de restringir |
| --- | --- | --- |
| Função é trigger de `auth.users` | Erro pode afetar provisionamento de `profiles` em criação de usuário. | Validar trigger ativo e criação de profile antes/depois. |
| Criação de profile | Novo usuário pode ficar sem linha em `public.profiles`. | Testar fluxo controlado ou validar por evidência operacional segura. |
| Exposição como RPC | Função de trigger não deve ser chamada diretamente por `anon`/`authenticated`. | Remover `PUBLIC` e `anon` somente após validar trigger. |
| Uso legado externo | Pode existir chamada externa fora do código versionado. | Confirmar com operação/logs antes de revogar. |
| Sem `search_path` fixo | `SECURITY DEFINER` sem `search_path` aumenta risco técnico. | Tratar `search_path` em ciclo separado e autorizado. |
| Sem homologação | Mudança em produção pode afetar onboarding. | Aplicar em ciclo curto, com rollback imediato. |

## Estratégia em fases

### Fase 1

Objetivo: remover exposição pública e anônima da função de trigger.

Escopo do ciclo futuro:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated` temporariamente, se houver incerteza.

Critério mínimo para execução:

- ACL atual confirmada;
- trigger `on_auth_user_created` confirmado ativo em `auth.users`;
- função intacta;
- busca versionada sem chamada direta a `handle_new_user`;
- ausência de uso externo conhecido de `/rpc/handle_new_user`;
- procedimento seguro de validação do fluxo usuário/profile definido;
- rollback operacional pronto.

### Fase 2

Objetivo: remover execução por usuários autenticados, se a função for confirmada como trigger-only e sem chamada externa.

Escopo do ciclo futuro:

- revogar `EXECUTE` de `authenticated`.

Critério mínimo para execução:

- Fase 1 monitorada sem falhas;
- trigger de Auth validado depois da Fase 1;
- ausência de chamada RPC externa;
- criação/profile operacionalmente validado;
- decisão explícita para avançar.

## Matriz antes/depois

| Item | Antes de qualquer REVOKE | Depois da Fase 1 | Depois da Fase 2 |
| --- | --- | --- | --- |
| ACL da função | Confirmar grants atuais. | Confirmar remoção de `anon` e `PUBLIC`. | Confirmar remoção de `authenticated`. |
| `PUBLIC` | Confirmar `EXECUTE` efetivo. | Deve estar sem `EXECUTE` efetivo. | Deve permanecer sem `EXECUTE` efetivo. |
| `anon` | Confirmar `EXECUTE` efetivo. | Deve estar sem `EXECUTE` efetivo. | Deve permanecer sem `EXECUTE` efetivo. |
| `authenticated` | Confirmar `EXECUTE` efetivo. | Deve permanecer conforme decisão da Fase 1. | Deve ficar sem `EXECUTE` efetivo, se autorizado. |
| `postgres`/`service_role` | Confirmar preservados. | Devem permanecer preservados. | Devem permanecer preservados. |
| Trigger | Confirmar `on_auth_user_created` ativo em `auth.users`. | Confirmar ainda ativo. | Confirmar ainda ativo. |
| Função | Confirmar definição e hash. | Confirmar função intacta. | Confirmar função intacta. |
| Código versionado | Confirmar ausência de RPC direta. | Repetir busca se houver mudança no código. | Repetir busca antes da Fase 2. |
| Criação de usuário/profile | Validar fluxo se operacionalmente seguro. | Revalidar criação de profile. | Revalidar criação de profile. |
| Advisor | Registrar alertas antes. | Espera-se redução do alerta `anon`; `authenticated` pode permanecer. | Espera-se redução do alerta `authenticated`. |
| Dados de teste | Não deixar usuário/profile indevido persistido. | Confirmar limpeza ou ausência de teste real. | Confirmar limpeza ou ausência de teste real. |

## Validações antes de qualquer REVOKE

- Confirmar ACL atual.
- Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
- Confirmar `postgres` e `service_role` com `EXECUTE`.
- Confirmar trigger `on_auth_user_created` ativo.
- Confirmar trigger vinculado a `auth.users`.
- Confirmar função intacta e hash preservado.
- Confirmar ausência de chamada RPC direta no código atual.
- Confirmar se existe uso externo conhecido de `/rpc/handle_new_user`.
- Validar fluxo atual de criação de usuário/profile, se operacionalmente seguro.
- Não criar usuário real indevido em produção.
- Se teste real for necessário, documentar procedimento seguro e limpeza imediata.
- Não registrar senha real, token, hash ou credencial em documentação.

## Validações depois da Fase 1

- Confirmar `anon` sem `EXECUTE` efetivo.
- Confirmar `PUBLIC` sem `EXECUTE` efetivo.
- Confirmar `authenticated` conforme fase escolhida.
- Confirmar `postgres` e `service_role` preservados.
- Confirmar trigger `on_auth_user_created` ainda ativo.
- Confirmar função intacta e hash preservado.
- Validar criação de profile para novo `auth.users`, se operacionalmente seguro.
- Confirmar que nenhum usuário/profile de teste ficou persistido indevidamente.
- Consultar Advisor para verificar redução do alerta de `anon`.
- Registrar se o alerta de `authenticated` permaneceu por decisão da Fase 1.

## Validações depois da Fase 2

- Confirmar `authenticated` sem `EXECUTE` efetivo.
- Confirmar `PUBLIC` e `anon` ainda sem `EXECUTE` efetivo.
- Confirmar `postgres` e `service_role` preservados.
- Confirmar trigger `on_auth_user_created` ainda ativo.
- Confirmar função intacta e hash preservado.
- Validar criação de profile para novo `auth.users`, se operacionalmente seguro.
- Confirmar que nenhum usuário/profile de teste ficou persistido indevidamente.
- Consultar Advisor para verificar redução do alerta de `authenticated`.

## Procedimento seguro de teste futuro

Preferir validação sem dado real persistente. Se for indispensável testar criação real:

1. Usar usuário técnico controlado, com e-mail claramente identificável como teste.
2. Não usar senha real ou reutilizada.
3. Confirmar criação em `auth.users`.
4. Confirmar criação ou existência de `public.profiles(id)` correspondente.
5. Confirmar que o fluxo de vínculo empresarial, se acionado, continua íntegro.
6. Remover imediatamente o usuário/profile/vínculos de teste apenas se houver autorização explícita para alteração de dados.
7. Registrar no relatório apenas IDs técnicos necessários, sem senha, token ou credenciais.

Se a limpeza não puder ser autorizada com segurança, não criar usuário de teste e não prosseguir com `REVOKE`.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Fase 1:
-- revoke execute on function public.handle_new_user() from anon;
-- revoke execute on function public.handle_new_user() from public;

-- Fase 2, somente após validação:
-- revoke execute on function public.handle_new_user() from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem necessidade real de rollback ou ciclo autorizado.

```sql
-- grant execute on function public.handle_new_user() to public;
-- grant execute on function public.handle_new_user() to anon;
-- grant execute on function public.handle_new_user() to authenticated;
```

## O que não misturar

- Não alterar trigger.
- Não alterar Auth.
- Não alterar senha.
- Não alterar `search_path` no mesmo ciclo de grants.
- Não alterar Edge Function.
- Não alterar frontend, service ou hook.
- Não alterar RLS/policy/view/índice.
- Não criar migration.
- Não alterar dados sem autorização explícita.

## Próximo ciclo recomendado

Executar somente a Fase 1 em ciclo curto, se confirmado que não há uso externo de `/rpc/handle_new_user`: revogar `anon` e `PUBLIC`, manter `authenticated`, validar trigger/profile e consultar Advisor.

Não avançar para Fase 2 no mesmo ciclo sem decisão explícita após monitoramento.

## Rollback documental

```bash
git revert <commit>
```
