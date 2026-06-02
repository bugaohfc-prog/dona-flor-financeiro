# Hardening RLS - df_contas e df_notas

Data: 2026-06-02

## Objetivo

Registrar o endurecimento de RLS das tabelas financeiras centrais `public.df_contas` e `public.df_notas`, aplicado no Supabase `contas-donaflor` e validado funcionalmente.

## Estado atual validado

- Migration `supabase/migrations/20260602170000_hardening_rls_df_contas_df_notas.sql` aplicada no Supabase.
- Operador validado.
- Gerente validado.
- Admin validado.
- Master validado.
- Cross-tenant validado.
- Lixeira validada por leitura e permissao de restauracao via `UPDATE`.
- Triggers de auditoria da Lixeira preservados.
- Rollback nao foi necessario.
- DELETE fisico/exclusao definitiva nao foi testado neste ciclo sem autorizacao explicita.

## Estado atual diagnosticado

- RLS habilitada nas duas tabelas.
- FORCE RLS desativado nas duas tabelas.
- `anon` possui grants amplos em `df_contas` e `df_notas`.
- `authenticated` possui grants extras, incluindo `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`.
- Existem policies `ALL`.
- Existem policies `DELETE`.
- Existem policies legadas por `user_id`.
- `empresa_id` e `user_id` sao nullable.
- Triggers de auditoria da Lixeira existem e devem ser preservados:
  - `trg_df_contas_auditoria_lixeira`;
  - `trg_df_notas_auditoria_lixeira`.

## Alteracoes aplicadas

Arquivos versionados:

- `supabase/migrations/20260602170000_hardening_rls_df_contas_df_notas.sql`
- `docs/security/rollback/rollback_hardening_rls_df_contas_df_notas_20260602.sql`
- `docs/security/diagnostics/diagnostico_hardening_rls_df_contas_df_notas_20260602.sql`

A migration aplicada:

- remove grants de `anon`;
- remove grants extras de `authenticated`;
- concede `SELECT`, `INSERT`, `UPDATE` e `DELETE` para `authenticated`;
- remove policies `ALL`;
- remove policies `DELETE` legadas/amplas;
- remove policies legadas por `user_id`;
- cria policies explicitas por comando:
  - `SELECT`;
  - `INSERT`;
  - `UPDATE`;
- `DELETE`;
- restringe `SELECT` de registros na Lixeira a Admin/Master;
- restringe `DELETE` fisico a Admin/Master;
- preserva lixeira logica via `UPDATE` de `excluido` e `excluido_em`;
- preserva os triggers de auditoria da Lixeira;
- nao altera `empresa_id` para `NOT NULL`;
- nao ativa `FORCE RLS` neste ciclo.

## Matriz validada

### Anon

- Sem grants.
- Sem acesso esperado.

### Operador

- `SELECT` na propria empresa.
- Nao consulta registros em Lixeira por RLS.
- Sem `INSERT`.
- Sem `UPDATE`.
- Sem `DELETE` fisico.
- Sem cross-tenant.

### Gerente

- `SELECT` de registros ativos, `INSERT` e `UPDATE` na propria empresa, conforme fluxo operacional financeiro.
- Sem acesso a Lixeira administrativa via frontend validado.
- Sem Importar contas via frontend validado.
- Sem `DELETE` fisico.
- Sem cross-tenant.

### Admin/Master

- `SELECT`, `INSERT`, `UPDATE` e `DELETE` na propria empresa.
- Pode consultar registros em Lixeira por RLS.
- DELETE fisico preservado para compatibilidade com a UI atual de exclusao definitiva.
- Sem cross-tenant.
- Master tambem pode ser reconhecido por `public.is_master()` ou por perfil master/owner/superadmin na empresa, conforme helper ja usado no projeto.

## Impacto esperado

- Reduzir superficie de risco para `anon`.
- Remover permissao direta de `TRUNCATE`, `REFERENCES` e `TRIGGER` para `authenticated`.
- Manter `DELETE` para `authenticated`, limitado por policy a Admin/Master.
- Eliminar policies permissivas `ALL`.
- Eliminar escrita baseada apenas em `user_id`.
- Manter app funcionando nos fluxos comuns de Contas e Notas com tenant por `empresa_id`.
- Manter auditoria invisivel da Lixeira.

## Riscos remanescentes

- Se algum fluxo futuro criar ou atualizar conta/nota com perfil `operador`, ele sera bloqueado pela RLS.
- Se surgirem registros com `empresa_id` nulo, eles deixam de aparecer para usuarios comuns pelas policies atuais.
- Se algum usuario Admin/Master executar `DELETE` fisico, a auditoria da Lixeira deve registrar o evento pelo trigger `AFTER DELETE`.
- Se algum processo privilegiado depender de grants antigos para `anon` ou de `TRUNCATE`, `REFERENCES` ou `TRIGGER`, ele sera bloqueado.
- `FORCE RLS` permanece fora deste ciclo para evitar impacto nao mapeado em rotinas privilegiadas.

## Validacao por perfil

Validado com usuarios reais ou consultas controladas sem service role:

- `anon`: sem SELECT/INSERT/UPDATE/DELETE.
- Operador:
  - SELECT propria empresa permitido;
  - SELECT de registros `excluido=true` bloqueado;
  - SELECT cross-tenant bloqueado;
  - INSERT bloqueado;
  - UPDATE bloqueado;
  - DELETE bloqueado.
- Gerente:
  - SELECT propria empresa permitido apenas para registros ativos;
  - INSERT propria empresa permitido se o fluxo funcional atual exigir;
  - UPDATE propria empresa permitido se o fluxo funcional atual exigir;
  - cross-tenant bloqueado;
  - DELETE bloqueado.
- Admin:
  - SELECT/INSERT/UPDATE propria empresa permitidos;
  - SELECT de registros `excluido=true` permitido;
  - cross-tenant bloqueado;
  - DELETE propria empresa permitido.
- Master:
  - SELECT/INSERT/UPDATE/DELETE conforme padrao master do projeto;
  - SELECT de registros `excluido=true` permitido;
  - cross-tenant bloqueado para usuarios sem vinculo/padrao master reconhecido;
  - DELETE propria empresa permitido.

Validar tambem:

- Lixeira logica por `UPDATE excluido/excluido_em`.
- Restauração por `UPDATE`.
- Logs em `df_auditoria_admin`.
- Triggers preservados.
- Sem policy `ALL`.
- Sem policy `DELETE` ampla/legada.
- Policy `DELETE` restrita a Admin/Master.
- Sem grants extras.
- `empresa_id` nulo em massa legada, se houver.

## Fora deste ciclo / nao realizado

- Ativar `FORCE RLS`.
- Tornar `empresa_id NOT NULL`.
- Criar trigger para bloquear alteracao de `empresa_id`.
- Alterar frontend, services, hooks, GitHub Actions, scripts ou secrets.
- Testar DELETE fisico.
