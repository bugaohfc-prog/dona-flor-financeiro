# Resultado do diagnóstico SECURITY DEFINER

Data da execução: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento registra o resultado da execução do SQL diagnóstico versionado em `docs/supabase/sql/diagnostico-security-definer.sql`.

A execução foi somente leitura, com consultas `SELECT` contra catálogos/metadados do Postgres e views de policies. Não houve alteração no Supabase.

Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP`, `CREATE/DROP POLICY`, `ALTER VIEW`, `CREATE/DROP INDEX`, migration, alteração de dados, alteração de frontend, service, hook ou autenticação.

## Resumo da execução

- Total de funções `SECURITY DEFINER` no schema `public`: 22.
- Funções `SECURITY DEFINER` executáveis por `anon`: 18.
- Funções `SECURITY DEFINER` executáveis por `authenticated`: 18.
- Funções expostas para `anon` ou `authenticated`: 18.
- Funções `SECURITY DEFINER` em `public` sem execute para `anon`/`authenticated`: 4.
- Funções expostas sem `search_path` fixo: 3.
- Funções expostas usadas por triggers: 7.
- Funções expostas citadas por policies: 6.
- Views públicas que citam textualmente as funções alvo: nenhuma encontrada na consulta executada.
- Chamadas textuais entre funções alvo: nenhuma encontrada na checagem agregada.

Funções expostas sem `search_path` fixo:

- `criar_usuario`
- `handle_new_user`
- `login_usuario`

Funções `SECURITY DEFINER` não expostas para `anon`/`authenticated`:

- `df_auditoria_admin_sanitize_lixeira_financeira`
- `df_folha_lancamento_itens_recalcular_lancamento`
- `df_folha_lancamento_itens_recalcular_lancamento_trigger`
- `df_folha_lancamento_itens_validar_vinculos`

## Funções com EXECUTE para anon e authenticated

As 18 funções abaixo estavam com `EXECUTE` efetivo para `anon` e para `authenticated` na execução do diagnóstico:

- `criar_usuario`
- `df_auditoria_admin_sanitize_destinatario_alerta`
- `df_empresas_do_usuario`
- `df_folha_lancamentos_validar_vinculos`
- `df_funcionarios_exames_periodicos_validar_funcionario_empresa`
- `df_funcionarios_ferias_ciclos_validar_funcionario_empresa`
- `df_funcionarios_ferias_periodos_validar_vinculos`
- `df_funcionarios_pode_escrever`
- `df_funcionarios_validar_filial_empresa`
- `df_usuario_alvo_eh_master`
- `df_usuario_eh_admin`
- `df_usuario_tem_perfil_empresa`
- `get_empresa_usuario`
- `handle_new_user`
- `is_admin`
- `is_master`
- `login_usuario`
- `vincular_usuario_logado`

## Uso por triggers

Funções expostas usadas por triggers:

| Função | Trigger | Tabela |
| --- | --- | --- |
| `df_auditoria_admin_sanitize_destinatario_alerta` | `trg_df_destinatarios_alertas_auditoria_admin` | `public.df_destinatarios_alertas` |
| `df_folha_lancamentos_validar_vinculos` | `trg_df_folha_lancamentos_validar_vinculos` | `public.df_folha_lancamentos` |
| `df_funcionarios_exames_periodicos_validar_funcionario_empresa` | `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre` | `public.df_funcionarios_exames_periodicos` |
| `df_funcionarios_ferias_ciclos_validar_funcionario_empresa` | `trg_df_funcionarios_ferias_ciclos_validar_funcionario_empresa` | `public.df_funcionarios_ferias_ciclos` |
| `df_funcionarios_ferias_periodos_validar_vinculos` | `trg_df_funcionarios_ferias_periodos_validar_vinculos` | `public.df_funcionarios_ferias_periodos` |
| `df_funcionarios_validar_filial_empresa` | `trg_df_funcionarios_validar_filial_empresa` | `public.df_funcionarios` |
| `handle_new_user` | `on_auth_user_created` | `auth.users` |

Leitura inicial: as funções de trigger/validação interna são candidatas futuras a restringir execução direta por RPC, mas ainda precisam de auditoria por função antes de qualquer `REVOKE`.

## Uso por policies

Funções expostas citadas por policies:

| Função | Referências em policies | Tabelas citadas |
| --- | ---: | --- |
| `is_master` | 27 | `df_assinaturas`, `df_auditoria_admin`, `df_contas`, `df_contas_pagamentos`, `df_destinatarios_alertas`, `df_notas`, `df_usuarios_empresas`, `df_usuarios_filiais` |
| `df_usuario_eh_admin` | 24 | `df_assinaturas`, `df_auditoria_admin`, `df_contas`, `df_contas_pagamentos`, `df_destinatarios_alertas`, `df_notas`, `df_usuarios_empresas`, `df_usuarios_filiais` |
| `df_funcionarios_pode_escrever` | 21 | `df_folha_competencias`, `df_folha_lancamento_itens`, `df_folha_lancamentos`, `df_funcionarios`, `df_funcionarios_exames_periodicos`, `df_funcionarios_ferias_ciclos`, `df_funcionarios_ferias_periodos` |
| `df_usuario_tem_perfil_empresa` | 14 | `df_contas`, `df_contas_pagamentos`, `df_destinatarios_alertas`, `df_funcionarios`, `df_notas` |
| `df_usuario_alvo_eh_master` | 6 | `df_usuarios_empresas`, `df_usuarios_filiais` |
| `df_empresas_do_usuario` | 1 | `df_usuarios_empresas` |

Leitura inicial: não revogar `authenticated` dessas funções sem matriz de teste por perfil, isolamento multiempresa e validação das policies dependentes.

## Evidência de uso direto no código/RPC

Chamadas diretas encontradas no código versionado durante o inventário anterior:

- `vincular_usuario_logado`: chamada por `src/pages/Login.jsx` e `src/services/tenantService.js`.
- `is_master`: chamada por `supabase/functions/convidar-usuario/index.ts` e por script diagnóstico de RLS.
- `df_usuario_eh_admin`: chamada por `supabase/functions/convidar-usuario/index.ts`.
- `df_funcionarios_pode_escrever`: chamada por script diagnóstico de RLS.

Sem evidência de chamada direta pelo frontend/service/hook principal:

- `criar_usuario`
- `login_usuario`
- `handle_new_user`
- `get_empresa_usuario`
- `is_admin`
- `df_empresas_do_usuario`
- `df_usuario_tem_perfil_empresa`
- `df_usuario_alvo_eh_master`
- `df_auditoria_admin_sanitize_destinatario_alerta`
- `df_folha_lancamentos_validar_vinculos`
- `df_funcionarios_exames_periodicos_validar_funcionario_empresa`
- `df_funcionarios_ferias_ciclos_validar_funcionario_empresa`
- `df_funcionarios_ferias_periodos_validar_vinculos`
- `df_funcionarios_validar_filial_empresa`

Essa ausência de evidência não prova ausência de uso. Antes de qualquer restrição, repetir busca em frontend, services, hooks, Edge Functions, scripts e logs operacionais relevantes.

## Classificação por grupo

### A. Não mexer agora - autenticação/login/fluxo sensível

- `login_usuario`
- `criar_usuario`
- `handle_new_user`
- `vincular_usuario_logado`

Risco prático: quebrar login legado, provisionamento de usuário, trigger de Auth ou vínculo automático usuário/empresa.

Recomendação: manter por enquanto. Tratar em ciclo próprio de autenticação/legado, sem misturar com policies ou funções trigger-only.

### B. Não mexer agora - usadas por RLS/policies

- `is_master`
- `df_usuario_eh_admin`
- `df_usuario_tem_perfil_empresa`
- `df_usuario_alvo_eh_master`
- `df_funcionarios_pode_escrever`
- `df_empresas_do_usuario`
- `get_empresa_usuario`

Risco prático: quebrar leitura/escrita em áreas financeiras, usuários, filiais, destinatários de alertas, notas, Gestão de Pessoas e folha.

Recomendação: não revogar `authenticated` agora. Avaliar `anon` somente depois de mapear policies com role `{public}` e testar perfis.

### C. Candidatas futuras para restringir EXECUTE público

- `df_auditoria_admin_sanitize_destinatario_alerta`
- `df_folha_lancamentos_validar_vinculos`
- `df_funcionarios_exames_periodicos_validar_funcionario_empresa`
- `df_funcionarios_ferias_ciclos_validar_funcionario_empresa`
- `df_funcionarios_ferias_periodos_validar_vinculos`
- `df_funcionarios_validar_filial_empresa`

Risco prático: exposição desnecessária de funções internas de trigger/validação como RPC.

Recomendação: candidatas a ciclo futuro de restrição de `EXECUTE` para `anon` e `authenticated`, mas somente depois de auditoria individual e rollback preparado.

### D. Incertas / precisam rastreio adicional

- `is_admin`
- `get_empresa_usuario`
- `criar_usuario`
- `login_usuario`

Risco prático: possível legado ainda dependente de fluxo histórico ou integração não evidente no código atual.

Recomendação: rastrear antes de remover, restringir ou substituir.

## Próximo ciclo recomendado

Auditar primeiro a função `df_auditoria_admin_sanitize_destinatario_alerta`, sem executar `REVOKE`.

Status em 2026-06-28: relatório específico criado em `docs/supabase/funcoes/df_auditoria_admin_sanitize_destinatario_alerta.md`.

Status em 2026-06-28: plano de validação/rollback para restrição futura criado em `docs/supabase/funcoes/df_auditoria_admin_sanitize_destinatario_alerta-plano-restricao.md`.

Status em 2026-06-28: restrição executada apenas para grants diretos de `anon` e `authenticated`. `PUBLIC` foi preservado, então o Advisor ainda lista a função porque `anon`/`authenticated` seguem com `EXECUTE` efetivo por `PUBLIC`.

Status em 2026-06-28: `EXECUTE` de `PUBLIC` também foi revogado para `df_auditoria_admin_sanitize_destinatario_alerta`. Após a mudança, `PUBLIC`, `anon` e `authenticated` ficaram sem `EXECUTE` efetivo nessa função; validações transacionais de `INSERT`/`UPDATE` e auditoria passaram; o Advisor deixou de listar essa função nos alertas `anon`/`authenticated`.

Status em 2026-06-28: relatório específico criado para `df_folha_lancamentos_validar_vinculos` em `docs/supabase/funcoes/df_folha_lancamentos_validar_vinculos.md`. A função foi classificada como trigger-only/validação interna, sem evidência de RPC direta no app, sem uso em policies/views/outras funções, e candidata a restrição futura de `EXECUTE` para `PUBLIC`, `anon` e `authenticated` após validação funcional transacional.

Status em 2026-06-28: plano de validação/rollback para restrição futura de `df_folha_lancamentos_validar_vinculos` criado em `docs/supabase/funcoes/df_folha_lancamentos_validar_vinculos-plano-restricao.md`. O plano mantém a restrição para ciclo futuro autorizado, com testes antes/depois em transação com `ROLLBACK`.

Status em 2026-06-28: restrição executada para `df_folha_lancamentos_validar_vinculos`. `EXECUTE` foi revogado de `PUBLIC`, `anon` e `authenticated`; `postgres` e `service_role` foram preservados; a função e o trigger permaneceram intactos; validações transacionais de `INSERT`/`UPDATE` e rejeição de vínculo inválido passaram antes/depois; nenhum dado de teste persistiu; o Advisor deixou de listar essa função nos alertas `anon`/`authenticated`.

Status em 2026-06-28: relatório específico criado para `df_funcionarios_exames_periodicos_validar_funcionario_empresa` em `docs/supabase/funcoes/df_funcionarios_exames_periodicos_validar_funcionario_empresa.md`. A função foi classificada como trigger-only/validação interna, sem evidência de RPC direta no app, sem uso em policies/views/outras funções, e candidata a restrição futura de `EXECUTE` para `PUBLIC`, `anon` e `authenticated` após plano de validação/rollback.

Status em 2026-06-28: plano de validação/rollback para restrição futura de `df_funcionarios_exames_periodicos_validar_funcionario_empresa` criado em `docs/supabase/funcoes/df_funcionarios_exames_periodicos_validar_funcionario_empresa-plano-restricao.md`. O plano mantém a restrição para ciclo futuro autorizado, com testes antes/depois em transação com `ROLLBACK` e cuidado LGPD para não registrar dados médicos, laudos, resultados ou anexos.

Status em 2026-06-28: restrição executada para `df_funcionarios_exames_periodicos_validar_funcionario_empresa`. `EXECUTE` foi revogado de `PUBLIC`, `anon` e `authenticated`; `postgres` e `service_role` foram preservados; a função e o trigger permaneceram intactos; validações transacionais de `INSERT`/`UPDATE` e rejeição de funcionário de outra empresa passaram antes/depois; nenhum dado de teste persistiu; não foram usados dados médicos reais; o Advisor deixou de listar essa função nos alertas `anon`/`authenticated`.

Status em 2026-06-28: frente alterada temporariamente para pontos críticos `SECURITY DEFINER`. Relatório específico criado para `criar_usuario` em `docs/supabase/funcoes/criar_usuario.md`. A função foi classificada como crítica por criar usuário legado em `df_usuarios`, gravar `senha_hash`, aceitar perfil/loja/permissão por parâmetro, estar executável por `PUBLIC`, `anon` e `authenticated`, e não ter `search_path` fixo.

Objetivo recomendado após a auditoria de `criar_usuario`:

- criar plano próprio de restrição para `criar_usuario`;
- validar o fluxo atual `criar-usuario-manual` antes de qualquer `REVOKE`;
- priorizar avaliação de `anon` e `PUBLIC`;
- tratar `authenticated` somente após confirmar ausência de uso legado externo.

Status em 2026-06-28: plano de validação/rollback para restrição futura de `criar_usuario` criado em `docs/supabase/funcoes/criar_usuario-plano-restricao.md`. O plano propõe Fase 1 para remover `EXECUTE` de `anon` e `PUBLIC`, mantendo `authenticated` temporariamente se houver incerteza de uso legado, e Fase 2 para avaliar `authenticated` somente após monitoramento e confirmação de ausência de uso externo de `/rpc/criar_usuario`.

Status em 2026-06-28: Fase 1 da restrição de `criar_usuario` executada. `EXECUTE` foi revogado de `anon` e `PUBLIC`; `authenticated` foi mantido com `EXECUTE`; `postgres` e `service_role` foram preservados; hash da definição permaneceu `abd9a262dc9057bcce0ff5fb8b6db1f4`; não houve alteração de função, senha, autenticação, RLS, policy, view, índice, Edge Function, frontend, service ou hook. O Advisor deixou de listar `criar_usuario` no alerta `anon_security_definer_function_executable`, mas manteve `authenticated_security_definer_function_executable` e `function_search_path_mutable`.

Status em 2026-06-28: `criar_usuario` foi mantida em observação e a frente de pontos críticos avançou para auditoria específica de `login_usuario`, documentada em `docs/supabase/funcoes/login_usuario.md`. A função foi classificada como crítica por validar senha legada contra `df_usuarios.senha_hash`, retornar dados de perfil/permissão, estar executável por `PUBLIC`, `anon` e `authenticated`, e não ter `search_path` fixo. Não houve alteração no Supabase neste ciclo.

## O que não mexer agora

- Não executar novos `REVOKE` sem ciclo autorizado.
- Não executar `GRANT`.
- Não alterar funções.
- Não alterar `search_path`.
- Não alterar RLS ou policies.
- Não alterar views ou índices.
- Não criar migration.
- Não alterar dados.
- Não alterar frontend, service, hook ou autenticação.

## Rollback

Este ciclo não tem rollback de banco porque não houve alteração no Supabase.

Rollback documental deste commit:

```bash
git revert <commit>
```
