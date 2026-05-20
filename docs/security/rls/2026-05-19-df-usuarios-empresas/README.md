# Saneamento RLS - df_usuarios_empresas

Data: 2026-05-19

Objetivo:
Remover policies antigas de escrita em df_usuarios_empresas que poderiam contornar a proteção contra alteração/remoção de usuário master.

Ambientes:
- Homologação: aplicado e validado
- Produção: aplicado e validado

Arquivos:
- 01_backup_df_usuarios_empresas.sql: consulta para registrar policies antes da alteração
- 02_migration_df_usuarios_empresas_cleanup.sql: migration aplicada
- 03_conferencia_df_usuarios_empresas.sql: conferência das policies após aplicação
- 04_conferencia_negativa_df_usuarios_empresas.sql: verificação de ausência de policies perigosas
- 05_rollback_df_usuarios_empresas.sql: rollback emergencial, reintroduz risco antigo e só deve ser usado em emergência
- relatorio_impacto_rls_df_usuarios_empresas.md: análise de impacto

Status:
Aplicado e validado em produção.

Observação:
O rollback é apenas emergencial, pois restaura policies antigas que permitiam escrita sem proteção completa contra alvo master.
