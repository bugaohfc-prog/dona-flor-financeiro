# Auditoria administrativa invisível - Fase 1

Data: 2026-06-01

## Objetivo

Criar uma base inicial de auditoria administrativa sem tela nova e sem ampliar escopo funcional.

## Tabela

- `public.df_auditoria_admin`

## Ações auditadas nesta fase

Somente ações em `public.df_destinatarios_alertas`:

- criação de destinatário de alerta;
- atualização de preferências de recebimento;
- inativação;
- reativação;
- alteração de e-mail registrada apenas por hash.

Não são auditados nesta fase:

- SELECT/leitura;
- cliques;
- navegação;
- envio de e-mail;
- workflows;
- configurações gerais;
- lixeira;
- ações financeiras;
- Gestão de Pessoas.

## Dados registrados

Metadados permitidos:

- `user_id`;
- `empresa_id`;
- `acao`;
- `recurso`;
- `registro_id`;
- `origem`;
- `criado_em`;
- `detalhes` sanitizado.

`detalhes` registra apenas booleans de preferências/status e `email_hash`.

## Dados proibidos

Não registrar:

- CPF;
- salário;
- dados médicos;
- laudos;
- anexos;
- documentos;
- secrets;
- e-mail em texto claro;
- conteúdo completo de registros;
- resultados de exames;
- observações sensíveis.

## Seguranca

- RLS habilitada e forcada.
- `authenticated` recebe somente `SELECT`.
- Não há policy `ALL`.
- Não há policy `INSERT`, `UPDATE` ou `DELETE` para usuários.
- Admin/Master podem consultar logs da própria empresa.
- Operador não deve ter acesso.
- Gerente não ganha acesso novo.
- Logs são imutáveis por trigger contra `UPDATE` e `DELETE`.
- Inserts sao feitos por trigger `SECURITY DEFINER` com payload sanitizado.

## Arquivos

- `supabase/migrations/20260601210000_create_df_auditoria_admin.sql`
- `docs/security/rollback/rollback_df_auditoria_admin_20260601.sql`
- `docs/security/diagnostics/diagnostico_df_auditoria_admin_20260601.sql`

## Validação esperada

- Tabela existe.
- RLS habilitada.
- RLS forçada.
- Sem policy `ALL`.
- Sem policy `INSERT`, `UPDATE` ou `DELETE`.
- `anon` sem grants.
- `authenticated` apenas com `SELECT`.
- Triggers de imutabilidade existem.
- Trigger de auditoria em `df_destinatarios_alertas` existe.
- Amostra de `detalhes` não contém dados sensíveis em texto claro.

## Próximo passo recomendado

Aplicar a migration em ambiente controlado, rodar o diagnóstico estrutural e validar um fluxo real de criação/atualização/inativação de destinatário de alerta, sem criar tela de auditoria.
