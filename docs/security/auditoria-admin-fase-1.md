# Auditoria administrativa invisível

Data: 2026-06-01

## Objetivo

Criar uma base inicial de auditoria administrativa sem tela nova e sem ampliar escopo funcional.

## Tabela

- `public.df_auditoria_admin`

## Fase 1 - Destinatários de alertas

Data: 2026-06-01

### Ações auditadas

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

## Fase 2 - Lixeira/restauração

Data: 2026-06-02

### Tabelas envolvidas

- `public.df_contas`
- `public.df_notas`

### Ações auditadas

Somente ações sensíveis ligadas ao estado de Lixeira:

- conta enviada para lixeira;
- conta restaurada;
- conta com status de lixeira atualizado;
- conta excluída definitivamente;
- nota enviada para lixeira;
- nota restaurada;
- nota com status de lixeira atualizado;
- nota excluída definitivamente.

As ações são detectadas por triggers no banco:

- `UPDATE` de `excluido` ou `excluido_em`;
- `DELETE` físico em `df_contas` ou `df_notas`.

Não são auditados nesta fase:

- SELECT/leitura;
- cliques;
- navegação;
- edição comum de conta ou nota que não altere status de lixeira;
- conteúdo financeiro completo;
- conteúdo textual de notas;
- envio de e-mail;
- workflows;
- Gestão de Pessoas.

### Dados registrados

`detalhes` registra apenas:

- `excluido` antes/depois;
- presença de `excluido_em` antes/depois;
- marcador booleano de exclusão definitiva.

Não registrar:

- descrição da conta;
- valor;
- centro de custo;
- vencimento;
- título da nota;
- texto/conteúdo da nota;
- observação;
- e-mail;
- CPF;
- salário;
- dados médicos;
- laudos;
- anexos;
- documentos;
- secrets.

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

## Segurança

- RLS habilitada e forçada.
- `authenticated` recebe somente `SELECT`.
- Não há policy `ALL`.
- Não há policy `INSERT`, `UPDATE` ou `DELETE` para usuários.
- Admin/Master podem consultar logs da própria empresa.
- Operador não deve ter acesso.
- Gerente não ganha acesso novo.
- Logs são imutáveis por trigger contra `UPDATE` e `DELETE`.
- Inserts são feitos por trigger `SECURITY DEFINER` com payload sanitizado.

## Arquivos

- `supabase/migrations/20260601210000_create_df_auditoria_admin.sql`
- `supabase/migrations/20260602103000_audit_lixeira_financeira.sql`
- `docs/security/rollback/rollback_df_auditoria_admin_20260601.sql`
- `docs/security/rollback/rollback_audit_lixeira_financeira_20260602.sql`
- `docs/security/diagnostics/diagnostico_df_auditoria_admin_20260601.sql`
- `docs/security/diagnostics/diagnostico_audit_lixeira_financeira_20260602.sql`

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
- Triggers de auditoria em `df_contas` e `df_notas` existem após a Fase 2.
- Amostra de `detalhes` não contém dados sensíveis em texto claro.

## Próximo passo recomendado

Aplicar a migration da Fase 2 em ambiente controlado, rodar o diagnóstico estrutural e validar pelo app um fluxo real de envio para lixeira, restauração e, se autorizado operacionalmente, exclusão definitiva.
