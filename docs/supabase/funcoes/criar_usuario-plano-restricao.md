# Plano de restrição da função criar_usuario

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função alvo: `public.criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)`

## Escopo

Este documento prepara um ciclo futuro de restrição de `EXECUTE` da função crítica `public.criar_usuario(...)`.

Este ciclo é somente documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de senha/autenticação, RLS/policy/view/índice, migration, alteração de dados, frontend, service, hook ou Edge Function.

## Resumo executivo

A função `criar_usuario` é `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, e cria registros legados em `public.df_usuarios`, incluindo `senha_hash`, tipo/perfil, loja, permissão de pagamento e `ativo=true`.

Como `PUBLIC`, `anon` e `authenticated` possuem `EXECUTE` efetivo, o risco é crítico. A restrição futura deve ser feita em fases, com validação do fluxo atual `criar-usuario-manual` antes e depois, porque não há ambiente de homologação.

Recomendação deste plano:

1. Fase 1: revogar `EXECUTE` de `anon` e `PUBLIC`, mantendo `authenticated` temporariamente se ainda houver incerteza sobre uso legado.
2. Fase 2: após monitoramento e confirmação de ausência de uso externo de `/rpc/criar_usuario`, avaliar revogar `EXECUTE` de `authenticated`.

## Riscos específicos

| Risco | Impacto prático | Mitigação antes de restringir |
| --- | --- | --- |
| Criação indevida de usuário | Um cliente pode criar registro legado em `df_usuarios` fora do fluxo administrativo esperado. | Revogar primeiro `anon` e `PUBLIC`; validar que o app atual usa Edge Function. |
| Alteração indireta de perfil/permissão | A função aceita `p_tipo`, `p_loja` e `p_pode_pagar` como parâmetros. | Validar que nenhuma tela atual depende da RPC e que a criação administrativa passa por validação de admin. |
| Senha como parâmetro | A função recebe senha em texto e calcula `senha_hash` no banco. | Evitar exposição pública da RPC; tratar autenticação em plano próprio. |
| Uso legado externo | Pode existir integração fora do código versionado chamando `/rpc/criar_usuario`. | Confirmar com operação/logs antes da Fase 2. |
| Sem `search_path` fixo | Função `SECURITY DEFINER` sem `search_path` aumenta risco técnico. | Tratar `search_path` em ciclo separado com `ALTER FUNCTION` autorizado e rollback. |
| Sem homologação | Mudança em produção pode quebrar fluxo antigo oculto. | Ciclo curto, validação antes/depois e rollback imediato pronto. |

## Matriz antes/depois

| Item | Antes de qualquer REVOKE | Depois da Fase 1 | Depois da Fase 2 |
| --- | --- | --- | --- |
| ACL da função | Confirmar grants atuais para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role`. | Confirmar `PUBLIC` e `anon` sem `EXECUTE` efetivo. | Confirmar `authenticated` sem `EXECUTE` efetivo. |
| `PUBLIC` | Confirmar `EXECUTE` efetivo. | Deve estar sem `EXECUTE`. | Deve permanecer sem `EXECUTE`. |
| `anon` | Confirmar `EXECUTE` efetivo direto ou por `PUBLIC`. | Deve estar sem `EXECUTE` efetivo. | Deve permanecer sem `EXECUTE` efetivo. |
| `authenticated` | Confirmar `EXECUTE` efetivo direto ou por `PUBLIC`. | Pode permanecer com `EXECUTE` direto temporário, se a fase escolhida preservar legado. | Deve ficar sem `EXECUTE` efetivo, se a Fase 2 for aprovada. |
| Chamada RPC no código | Repetir busca por `criar_usuario` e `/rpc/criar_usuario`. | Repetir busca se houver alteração de código entre ciclos. | Repetir busca e confirmar ausência de dependência. |
| Uso externo conhecido | Confirmar com operação se existe integração externa. | Monitorar erro operacional após retirada de `anon`/`PUBLIC`. | Só executar se não houver uso externo confirmado. |
| Edge Function `criar-usuario-manual` | Validar que cria usuário sem depender da RPC `criar_usuario`. | Validar novamente. | Validar novamente. |
| Painel/admin | Confirmar criação de usuário operacional pelo fluxo atual. | Confirmar novamente. | Confirmar novamente. |
| Advisor | Registrar alerta antes da mudança. | Verificar se alerta para `anon`/`PUBLIC` reduziu. | Verificar se alerta para `authenticated` reduziu. |
| Usuário de teste | Usar dado controlado e reversível, sem credencial real. | Confirmar que nenhum usuário indevido ficou persistido. | Confirmar que nenhum usuário indevido ficou persistido. |

## Validações antes de qualquer REVOKE

- Confirmar ACL atual da função.
- Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo.
- Confirmar ausência de chamada RPC direta no código versionado.
- Confirmar se existe uso externo conhecido de `/rpc/criar_usuario`.
- Validar o fluxo atual `criar-usuario-manual`.
- Confirmar que a Edge Function cria usuário corretamente sem depender da RPC `criar_usuario`.
- Confirmar que criação de usuário pelo painel/admin continua operacional.
- Confirmar que qualquer usuário de teste seja controlado, identificável e removido ou revertido conforme processo autorizado.

## Validações depois da Fase 1

- Confirmar `anon` sem `EXECUTE` efetivo.
- Confirmar `PUBLIC` sem `EXECUTE` efetivo.
- Confirmar o estado de `authenticated` conforme a fase escolhida.
- Validar novamente `criar-usuario-manual`.
- Validar criação de usuário pelo app/admin.
- Consultar Supabase Advisor para verificar redução do alerta.
- Confirmar que nenhum usuário de teste indevido ficou persistido.
- Monitorar se houve erro operacional relacionado a `/rpc/criar_usuario`.

## Validações depois da Fase 2

- Confirmar `authenticated` sem `EXECUTE` efetivo.
- Confirmar que `PUBLIC` e `anon` continuam sem `EXECUTE` efetivo.
- Validar novamente `criar-usuario-manual`.
- Validar criação de usuário pelo app/admin.
- Consultar Supabase Advisor para verificar redução do alerta remanescente.
- Confirmar que nenhum usuário de teste indevido ficou persistido.
- Registrar se houve rollback ou se a restrição permaneceu estável.

## Estratégia em fases

### Fase 1

Objetivo: remover exposição pública e anônima da função legada.

Escopo autorizado em ciclo futuro:

- revogar `EXECUTE` de `anon`;
- revogar `EXECUTE` de `PUBLIC`;
- manter `authenticated` temporariamente, se ainda houver incerteza de uso legado.

Critério para prosseguir: o fluxo atual `criar-usuario-manual` deve estar validado antes da mudança, e não deve haver evidência de chamada RPC direta no app.

### Fase 2

Objetivo: remover exposição para usuários autenticados, se confirmado que a RPC é legado não utilizado.

Escopo autorizado em ciclo futuro:

- revogar `EXECUTE` de `authenticated`.

Critério para prosseguir: monitoramento da Fase 1 sem falhas, ausência de uso externo conhecido de `/rpc/criar_usuario`, e validação operacional da criação de usuários pelo app/admin.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Fase 1:
-- revoke execute on function public.criar_usuario(text, text, text, text, text, text, boolean) from anon;
-- revoke execute on function public.criar_usuario(text, text, text, text, text, text, boolean) from public;

-- Fase 2, somente após validação:
-- revoke execute on function public.criar_usuario(text, text, text, text, text, text, boolean) from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem necessidade real de rollback ou ciclo autorizado.

```sql
-- grant execute on function public.criar_usuario(text, text, text, text, text, text, boolean) to public;
-- grant execute on function public.criar_usuario(text, text, text, text, text, text, boolean) to anon;
-- grant execute on function public.criar_usuario(text, text, text, text, text, text, boolean) to authenticated;
```

## O que não mexer junto

- Não alterar autenticação ou senha.
- Não alterar a Edge Function `criar-usuario-manual`.
- Não alterar frontend, service ou hook.
- Não alterar `search_path` no mesmo ciclo de grants sem autorização explícita.
- Não alterar RLS/policies.
- Não criar migration.
- Não alterar dados persistentes sem plano próprio.

## Próximo ciclo recomendado

Executar Fase 1 em ciclo curto, com diagnóstico antes/depois, validação do fluxo `criar-usuario-manual`, consulta ao Advisor e rollback imediato preparado.

Não executar Fase 2 no mesmo ciclo da Fase 1, salvo decisão explícita após validação operacional e evidência de ausência de uso legado externo.

## Rollback documental

```bash
git revert <commit>
```
