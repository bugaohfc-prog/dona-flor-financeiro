# Plano de restrição da função login_usuario

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função alvo: `public.login_usuario(p_usuario text, p_senha text)`

## Escopo

Este documento preparou a restrição de `EXECUTE` da função crítica `public.login_usuario(...)` e agora registra a execução da Fase 1.

Neste ciclo foram executados apenas os `REVOKE` autorizados para `anon` e `PUBLIC`. Não foi executado `REVOKE` de `authenticated`, `GRANT`, `ALTER FUNCTION`, alteração de senha/autenticação, Edge Function, frontend, service, hook, RLS/policy/view/índice, migration, alteração de dados ou outras permissões.

## Resumo executivo

A função `login_usuario` é `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, lê `public.df_usuarios`, recebe senha em texto como parâmetro e compara `senha_hash` com `crypt(p_senha, u.senha_hash)`.

Como `PUBLIC`, `anon` e `authenticated` possuem `EXECUTE` efetivo, o risco é crítico. O app versionado atual usa Supabase Auth em `src/pages/Login.jsx` por `supabase.auth.signInWithPassword`, sem evidência de chamada direta à RPC `login_usuario`.

Recomendação deste plano: restringir em fases, sem misturar grants com alteração de Auth, senha ou `search_path`.

Status da Fase 1 em 2026-06-28: executada com sucesso. `EXECUTE` foi revogado de `anon` e `PUBLIC`; `authenticated` foi mantido com `EXECUTE`; `postgres` e `service_role` foram preservados. Não houve rollback.

## Resultado da Fase 1

### Diagnóstico antes

Consulta ao catálogo Postgres antes da restrição:

| Item | Resultado antes |
| --- | --- |
| ACL | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` com `EXECUTE` efetivo | `true` |
| `anon` com `EXECUTE` efetivo | `true` |
| `authenticated` com `EXECUTE` efetivo | `true` |
| `postgres` com `EXECUTE` | `true` |
| `service_role` com `EXECUTE` | `true` |
| `SECURITY DEFINER` | `true` |
| `search_path` | não configurado |
| Hash da definição | `a096f36a7170f162bf18c223e121a9b6` |

Dependências antes da restrição:

- triggers usando a função: `0`;
- policies citando a função: `0`;
- views citando a função: `0`;
- outras funções normais chamando textualmente a função: `0`.

Evidência no código versionado:

- sem chamada direta da RPC `login_usuario` em `src`, `supabase/functions` e `scripts`;
- sem uso versionado de `/rpc/login_usuario`;
- `src/pages/Login.jsx` usa `supabase.auth.signInWithPassword`;
- `src/pages/Login.jsx` chama `vincular_usuario_logado` após autenticar;
- nenhuma Edge Function versionada chama `login_usuario`.

Validação funcional antes:

- não foi executado login real com credencial de produção neste ciclo;
- nenhuma senha, hash, token ou credencial foi registrada;
- a validação operacional foi limitada à evidência versionada de que o login atual usa Supabase Auth, não a RPC legada.

Advisor antes:

- `login_usuario` aparecia em `anon_security_definer_function_executable`;
- `login_usuario` aparecia em `authenticated_security_definer_function_executable`;
- `login_usuario` permanecia em `function_search_path_mutable`.

### SQL executado

```sql
revoke execute on function public.login_usuario(text, text) from anon;
revoke execute on function public.login_usuario(text, text) from public;
```

Não foi executado `REVOKE` de `authenticated`.

### Diagnóstico depois

Consulta ao catálogo Postgres depois da restrição:

| Item | Resultado depois |
| --- | --- |
| ACL | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` com `EXECUTE` efetivo | `false` |
| `anon` com `EXECUTE` efetivo | `false` |
| `authenticated` com `EXECUTE` efetivo | `true` |
| `postgres` com `EXECUTE` | `true` |
| `service_role` com `EXECUTE` | `true` |
| `SECURITY DEFINER` | `true` |
| `search_path` | não configurado |
| Hash da definição | `a096f36a7170f162bf18c223e121a9b6` |

Leitura: a Fase 1 atingiu o objetivo. `PUBLIC` e `anon` ficaram sem `EXECUTE` efetivo; `authenticated` foi mantido temporariamente conforme planejado.

Validação funcional depois:

- não foi executado login real com credencial de produção;
- nenhuma senha, hash, token, sessão ou credencial foi registrada;
- não houve alteração de usuário, senha ou Auth;
- a busca versionada continua sem chamada direta à RPC `login_usuario`.

Advisor depois:

- `login_usuario` deixou de aparecer em `anon_security_definer_function_executable`;
- `login_usuario` permaneceu em `authenticated_security_definer_function_executable`, como esperado porque `authenticated` foi preservado na Fase 1;
- `login_usuario` permaneceu em `function_search_path_mutable`, porque não houve `ALTER FUNCTION`.

Rollback operacional preparado, mas não executado:

```sql
-- grant execute on function public.login_usuario(text, text) to public;
-- grant execute on function public.login_usuario(text, text) to anon;
```

## Riscos específicos

| Risco | Impacto prático | Mitigação antes de restringir |
| --- | --- | --- |
| Função recebe senha como parâmetro | A RPC exposta vira superfície pública de validação de senha legada. | Confirmar que o login atual usa Supabase Auth e não a RPC. |
| Comparação com `senha_hash` | Permite testar credenciais contra `df_usuarios`. | Remover exposição pública/anônima somente após validar ausência de uso legado. |
| Enumeração de usuários | Diferenças de resposta, tempo ou retorno podem indicar credencial válida. | Validar comportamento operacional e reduzir superfície de RPC. |
| Retorno de perfil/permissão | Retorna `tipo`, `loja`, `pode_pagar`, `email`, `usuario` e `ativo`. | Não permitir execução pública se a RPC não for necessária. |
| Uso legado externo | Pode existir fluxo fora do código versionado usando `/rpc/login_usuario`. | Confirmar com operação/logs antes de revogar. |
| Sem `search_path` fixo | `SECURITY DEFINER` sem `search_path` aumenta risco técnico. | Tratar `search_path` em ciclo separado e autorizado. |
| Sem homologação | Mudança em produção pode quebrar login legado oculto. | Aplicar em ciclo curto, com rollback imediato. |

## Estratégia em fases

### Fase 1

Objetivo: remover a exposição pública e anônima, preservando `authenticated` temporariamente se ainda houver incerteza de uso legado.

Escopo do ciclo futuro:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated` temporariamente.

Critério mínimo para execução:

- busca versionada sem chamada direta a `login_usuario`;
- `Login.jsx` validado usando `supabase.auth.signInWithPassword`;
- nenhuma Edge Function chamando `login_usuario`;
- ausência de uso externo conhecido de `/rpc/login_usuario`;
- rollback operacional pronto.

### Fase 2

Objetivo: remover execução por usuários autenticados, se a RPC for confirmada como legado sem uso.

Escopo do ciclo futuro:

- revogar `EXECUTE` de `authenticated`.

Critério mínimo para execução:

- Fase 1 monitorada sem falhas;
- nenhuma evidência de fluxo legado usando `/rpc/login_usuario`;
- login normal pelo app validado;
- decisão explícita para avançar.

## Matriz antes/depois

| Item | Antes de qualquer REVOKE | Depois da Fase 1 | Depois da Fase 2 |
| --- | --- | --- | --- |
| ACL da função | Confirmar grants atuais. | Confirmar remoção de `anon` e `PUBLIC`. | Confirmar remoção de `authenticated`. |
| `PUBLIC` | Confirmar `EXECUTE` efetivo. | Deve estar sem `EXECUTE` efetivo. | Deve permanecer sem `EXECUTE` efetivo. |
| `anon` | Confirmar `EXECUTE` efetivo. | Deve estar sem `EXECUTE` efetivo. | Deve permanecer sem `EXECUTE` efetivo. |
| `authenticated` | Confirmar `EXECUTE` efetivo. | Deve permanecer conforme decisão da Fase 1. | Deve ficar sem `EXECUTE` efetivo, se autorizado. |
| `postgres`/`service_role` | Confirmar preservados. | Devem permanecer preservados. | Devem permanecer preservados. |
| Definição/hash | Confirmar função intacta. | Deve permanecer igual. | Deve permanecer igual. |
| Login atual | Validar `signInWithPassword`. | Revalidar login normal pelo app. | Revalidar login normal pelo app. |
| Uso no código | Confirmar ausência de RPC direta. | Repetir busca se houver mudança no código. | Repetir busca antes da Fase 2. |
| Edge Functions | Confirmar ausência de chamada a `login_usuario`. | Sem alteração. | Sem alteração. |
| Advisor | Registrar alertas antes. | Espera-se redução do alerta `anon`; `authenticated` pode permanecer. | Espera-se redução do alerta `authenticated`. |
| Auth/senha/usuários | Não alterar. | Confirmar que não houve alteração. | Confirmar que não houve alteração. |

## Validações antes de qualquer REVOKE

- Confirmar ACL atual.
- Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
- Confirmar `postgres` e `service_role` preservados.
- Confirmar ausência de chamada RPC direta no código atual.
- Confirmar se existe uso externo conhecido de `/rpc/login_usuario`.
- Validar que `Login.jsx` usa `supabase.auth.signInWithPassword`.
- Validar login operacional atual no app sem depender da RPC `login_usuario`.
- Confirmar que nenhuma Edge Function chama `login_usuario`.
- Não registrar senha real, hash ou credencial em documentação.
- Não criar usuário de teste sem plano próprio.

## Validações depois da Fase 1

- Confirmar `anon` sem `EXECUTE` efetivo.
- Confirmar `PUBLIC` sem `EXECUTE` efetivo.
- Confirmar `authenticated` conforme fase escolhida.
- Confirmar `postgres` e `service_role` preservados.
- Confirmar função intacta e hash preservado.
- Validar novamente login normal pelo app.
- Confirmar que não houve alteração de Auth, senha ou usuários.
- Consultar Advisor para verificar redução do alerta de `anon`.
- Registrar se o alerta de `authenticated` permaneceu por decisão da Fase 1.

## Validações depois da Fase 2

- Confirmar `authenticated` sem `EXECUTE` efetivo.
- Confirmar `PUBLIC` e `anon` ainda sem `EXECUTE` efetivo.
- Confirmar `postgres` e `service_role` preservados.
- Confirmar função intacta e hash preservado.
- Validar novamente login normal pelo app.
- Confirmar que não houve alteração de Auth, senha ou usuários.
- Consultar Advisor para verificar redução do alerta de `authenticated`.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Fase 1:
-- revoke execute on function public.login_usuario(text, text) from anon;
-- revoke execute on function public.login_usuario(text, text) from public;

-- Fase 2, somente após validação:
-- revoke execute on function public.login_usuario(text, text) from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem necessidade real de rollback ou ciclo autorizado.

```sql
-- grant execute on function public.login_usuario(text, text) to public;
-- grant execute on function public.login_usuario(text, text) to anon;
-- grant execute on function public.login_usuario(text, text) to authenticated;
```

## O que não misturar

- Não alterar Auth.
- Não alterar senha, hash ou política de senha.
- Não alterar `search_path` no mesmo ciclo de grants.
- Não alterar Edge Function.
- Não alterar frontend, service ou hook.
- Não alterar RLS/policy/view/índice.
- Não criar migration.
- Não alterar dados.

## Próximo ciclo recomendado

Monitorar a Fase 1 e confirmar se existe qualquer uso externo de `/rpc/login_usuario`.

Depois do monitoramento, planejar a Fase 2 para avaliar `authenticated`. Não executar a Fase 2 sem novo ciclo autorizado, validação operacional do login normal pelo app e rollback imediato preparado.

## Rollback documental

```bash
git revert <commit>
```
