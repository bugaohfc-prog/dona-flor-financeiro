# Status SECURITY DEFINER pós-hardenings

Data da atualização: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento resume o estado atual dos alertas do Supabase Security Advisor após os ciclos recentes de hardening de funções `SECURITY DEFINER`.

O ciclo foi somente diagnóstico/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS, policy, Auth, Edge Function, frontend, service, migration ou dados.

## Resumo executivo

As funções críticas já tratadas saíram do alerta `anon_security_definer_function_executable`. Elas permanecem, quando aplicável, no alerta `authenticated_security_definer_function_executable` porque `authenticated` foi preservado por dependência de app, RLS ou fluxo operacional.

O Security Advisor atual ainda lista 6 funções executáveis por `anon` e 15 funções executáveis por `authenticated`.

Próximo candidato recomendado no status anterior: `public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)`.

Motivo: é helper crítico de proteção de Master, ainda aparece em `anon_security_definer_function_executable`, não é trigger interna, e deve ser auditado antes de qualquer restrição. Não executar `REVOKE` sem auditoria específica e matriz de impacto.

Status em 2026-06-30: auditoria específica criada em `docs/supabase/funcoes/df_usuario_alvo_eh_master.md`. A função foi classificada como crítica, com `PUBLIC` já sem `EXECUTE` efetivo, `anon` ainda com `EXECUTE` efetivo direto e `authenticated` preservado por uso em 6 policies `{authenticated}`.

## Funções saneadas de `anon`

| Função | Estado atual no Advisor |
| --- | --- |
| `criar_usuario` | fora de `anon`; permanece em `authenticated` e `function_search_path_mutable` |
| `login_usuario` | fora de `anon`; permanece em `authenticated` e `function_search_path_mutable` |
| `handle_new_user` | fora de `anon`; permanece em `authenticated` e `function_search_path_mutable` |
| `vincular_usuario_logado` | fora de `anon`; permanece em `authenticated` |
| `get_empresa_usuario` | fora de `anon`; permanece em `authenticated` |
| `is_admin` | fora de `anon`; permanece em `authenticated` |
| `is_master` | fora de `anon`; permanece em `authenticated` |
| `df_usuario_eh_admin` | fora de `anon`; permanece em `authenticated` |
| `df_usuario_tem_perfil_empresa` | fora de `anon`; permanece em `authenticated` |
| `df_auditoria_admin_sanitize_destinatario_alerta` | fora de `anon` e `authenticated` |
| `df_folha_lancamentos_validar_vinculos` | fora de `anon` e `authenticated` |
| `df_funcionarios_exames_periodicos_validar_funcionario_empresa` | fora de `anon` e `authenticated` |

## Ainda em `anon`

| Função | Tipo de risco | Observação |
| --- | --- | --- |
| `df_empresas_do_usuario()` | helper de tenant/empresa | envolve policy legada `{public}` em `df_usuarios_empresas`; precisa matriz própria antes de grant |
| `df_funcionarios_pode_escrever(p_empresa_id uuid)` | helper RLS de Gestão de Pessoas/Folha | amplo impacto em policies; não revogar `authenticated` |
| `df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)` | helper crítico de proteção Master | próximo candidato recomendado para auditoria específica |
| `df_funcionarios_ferias_ciclos_validar_funcionario_empresa()` | trigger/validação interna | separar em ciclo de funções internas |
| `df_funcionarios_ferias_periodos_validar_vinculos()` | trigger/validação interna | separar em ciclo de funções internas |
| `df_funcionarios_validar_filial_empresa()` | trigger/validação interna | separar em ciclo de funções internas |

## Ainda em `authenticated`

| Função |
| --- |
| `criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)` |
| `df_empresas_do_usuario()` |
| `df_funcionarios_ferias_ciclos_validar_funcionario_empresa()` |
| `df_funcionarios_ferias_periodos_validar_vinculos()` |
| `df_funcionarios_pode_escrever(p_empresa_id uuid)` |
| `df_funcionarios_validar_filial_empresa()` |
| `df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)` |
| `df_usuario_eh_admin(p_empresa_id uuid)` |
| `df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])` |
| `get_empresa_usuario()` |
| `handle_new_user()` |
| `is_admin()` |
| `is_master()` |
| `login_usuario(p_usuario text, p_senha text)` |
| `vincular_usuario_logado()` |

Leitura: não revogar `authenticated` das funções acima sem plano próprio, porque há dependência conhecida ou provável de app, RLS, Edge Function, autenticação legada ou fluxo operacional.

## Search path mutable

Funções ainda listadas em `function_search_path_mutable`:

- `atualizar_data_modificacao`
- `login_usuario`
- `bloquear_exclusao_usuario_master`
- `df_contas_calcular_baixa_pagamento`
- `criar_usuario`
- `handle_new_user`

Leitura: `search_path` deve ser tratado em ciclo próprio, sem misturar com grants de `anon`/`authenticated`.

## Próximo ciclo recomendado

Criar diagnóstico específico para avaliar remoção de `anon` de `public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)`, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

Escopo recomendado:

- confirmar grants atuais, hash e `search_path`;
- confirmar que as 6 policies seguem `{authenticated}`;
- confirmar que não há chamada direta em `src`, `supabase/functions` ou `scripts`;
- avaliar impacto de remover apenas `anon`;
- preservar `PUBLIC` sem `EXECUTE`;
- manter `authenticated` até prova contrária;
- não executar `REVOKE` nesse próximo ciclo de diagnóstico.

## Restrições para próximos ciclos

- Não revogar `authenticated` de helpers usados por RLS/app sem plano próprio.
- Não misturar hardening de grants com refatoração de RLS/policies.
- Não misturar funções trigger-only com helpers críticos de permissão.
- Não misturar com search_path.
- Não alterar Auth, Edge Functions, frontend, services, dados ou migrations sem ciclo próprio.
