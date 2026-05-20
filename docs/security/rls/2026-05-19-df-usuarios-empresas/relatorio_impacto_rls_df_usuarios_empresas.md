# Relatorio de impacto - RLS df_usuarios_empresas

## Escopo

Somente `public.df_usuarios_empresas`.

Nao altera frontend, CSS, auth, Edge Functions, Pipedream, importador CSV, `df_notas` ou `df_assinaturas`.

## Problema confirmado

O CSV pos-RLS mostra policies antigas de escrita com `roles = {public}`:

- `df usuarios admin insert`
- `df usuarios admin update`
- `df usuarios admin delete`

Essas policies usam apenas `df_usuario_eh_admin(empresa_id)`. Como policies permissivas somam acesso, elas podem liberar escrita mesmo quando as policies novas bloqueiam alteracao/remocao de alvo master.

## Mudanca proposta

1. Remover as policies antigas perigosas de escrita.
2. Remover nomes legados defensivos de escrita se existirem: `usuarios_insert`, `usuarios_update`, `usuarios_delete`.
3. Recriar de forma deterministica as quatro policies seguras `*_saneado` para SELECT/INSERT/UPDATE/DELETE.
4. Bloquear qualquer policy de escrita inesperada remanescente na propria migration.

## Protecoes mantidas

- SELECT para master, admin da empresa e proprio usuario.
- INSERT para master ou admin da empresa, bloqueando perfil master/owner/superadmin/super_admin.
- INSERT bloqueia vinculo para usuario ja master via `public.df_usuario_alvo_eh_master(user_id, email, usuario_id)`.
- UPDATE bloqueia admin comum editando alvo master por perfil, user_id, email ou usuario_id.
- DELETE bloqueia admin comum removendo alvo master por perfil, user_id, email ou usuario_id.

## O que nao foi tocado

- Policies antigas de SELECT em `df_usuarios_empresas`, porque o risco critico apontado estava nas policies de escrita.
- `df_notas`.
- `df_assinaturas`.
- Edge Functions.
- Frontend.

## Risco operacional

Baixo a medio. A mudanca remove permissoes de escrita antigas e preserva as policies saneadas. O ponto de atencao e testar os fluxos de Usuarios apos aplicar:

- admin comum cria usuario comum;
- admin comum nao cria master;
- admin comum nao altera/remova master;
- master continua criando/editando/removendo conforme esperado;
- usuario comum continua vendo o proprio vinculo.

## Ordem segura de execucao

1. Rodar `01_backup_df_usuarios_empresas.sql` e salvar/exportar o resultado.
2. Aplicar `02_migration_df_usuarios_empresas_cleanup.sql`.
3. Rodar `03_conferencia_df_usuarios_empresas.sql`.
4. Rodar `04_conferencia_negativa_df_usuarios_empresas.sql` e confirmar zero linhas.
5. Testar fluxos funcionais de Usuarios.

## Rollback

`05_rollback_df_usuarios_empresas.sql` reintroduz as tres policies antigas. Deve ser usado apenas em emergencia, porque restaura exatamente o risco critico auditado.
