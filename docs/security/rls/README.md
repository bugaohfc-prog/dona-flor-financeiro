# Índice RLS

Este diretório reúne os SQLs, conferências, relatórios e rollbacks versionados da etapa de Row Level Security (RLS) do projeto **Dona Flor Financeiro**.

## Status geral

- RLS principal: aplicada e validada em homologação.
- RLS principal: aplicada e validada em produção.
- Migration principal aplicada: versão corrigida sem dependência de `df_usuarios_empresas.status` / `ue.status`.
- Saneamento complementar de `df_usuarios_empresas`: aplicado e validado em homologação.
- Saneamento complementar de `df_usuarios_empresas`: aplicado e validado em produção.
- Correção de segurança de `convidar-usuario` com `empresaId`: aplicada e validada em homologação.
- Guardrails de centro de custo: aplicados e validados sem alteração de SQL/RLS.

## Documentos principais

- `../RLS_HOMOLOGACAO_STATUS.md`: registro consolidado da aplicação, validação, produção e observações de segurança.
- `2026-05-19-df-usuarios-empresas/`: pacote do saneamento complementar de `df_usuarios_empresas`.
- `2026-05-21-convidar-usuario-empresa-id.md`: registro técnico da correção de autorização por empresa na Edge Function `convidar-usuario`.
- `2026-05-21-centro-custo-guardrails.md`: registro técnico dos guardrails de exclusão e salvamento de centro de custo.

## Pacote 2026-05-19 - df_usuarios_empresas

Status:

- Homologação: aplicado e validado.
- Produção: aplicado e validado.

Arquivos:

- `2026-05-19-df-usuarios-empresas/README.md`: resumo do complemento.
- `2026-05-19-df-usuarios-empresas/01_backup_df_usuarios_empresas.sql`: consulta de backup/conferência anterior.
- `2026-05-19-df-usuarios-empresas/02_migration_df_usuarios_empresas_cleanup.sql`: migration aplicada.
- `2026-05-19-df-usuarios-empresas/03_conferencia_df_usuarios_empresas.sql`: conferência pós-aplicação.
- `2026-05-19-df-usuarios-empresas/04_conferencia_negativa_df_usuarios_empresas.sql`: conferência negativa; resultado esperado é zero linhas.
- `2026-05-19-df-usuarios-empresas/05_rollback_df_usuarios_empresas.sql`: rollback emergencial.
- `2026-05-19-df-usuarios-empresas/relatorio_impacto_rls_df_usuarios_empresas.md`: análise de impacto.

## Rollbacks

Rollbacks são emergenciais. Eles não devem ser usados como rotina operacional, pois podem restaurar policies antigas e reabrir riscos já saneados.

Antes de qualquer rollback:

1. Confirmar o incidente que exige reversão;
2. Salvar evidências do estado atual;
3. Validar o impacto de segurança;
4. Executar somente o rollback correspondente à etapa afetada;
5. Rodar as conferências novamente após a reversão.
