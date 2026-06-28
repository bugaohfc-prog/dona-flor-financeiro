# Plano de restrição da função df_auditoria_admin_sanitize_destinatario_alerta

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função: `public.df_auditoria_admin_sanitize_destinatario_alerta()`

## Escopo

Este documento prepara a matriz de validação e rollback para um ciclo futuro de restrição de `EXECUTE` da função `public.df_auditoria_admin_sanitize_destinatario_alerta()`.

Este ciclo é somente documentação. Não houve execução de `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS/policy/view/índice, migration, dados, frontend, service, hook ou autenticação.

## Contexto da auditoria

A auditoria específica em `docs/supabase/funcoes/df_auditoria_admin_sanitize_destinatario_alerta.md` classificou a função como candidata forte a restringir `EXECUTE` público em ciclo futuro.

Achados usados como base:

- função `SECURITY DEFINER`;
- retorno `trigger`;
- `search_path=public`;
- owner `postgres`;
- usada pelo trigger `trg_df_destinatarios_alertas_auditoria_admin`;
- trigger `AFTER INSERT OR UPDATE` em `public.df_destinatarios_alertas`;
- sem evidência de chamada RPC direta pelo app;
- sem evidência de dependência direta em policies;
- grants atuais incluem `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role`.

## Objetivo do ciclo futuro

Reduzir exposição RPC desnecessária da função trigger-only, revogando `EXECUTE` de `anon` e `authenticated` se a validação antes/depois confirmar que:

- o trigger continua executando;
- `INSERT` e `UPDATE` em `df_destinatarios_alertas` seguem funcionando para perfis autorizados;
- `df_auditoria_admin` continua recebendo registros sanitizados;
- não há uso direto por RPC.

## Matriz de validação antes/depois

| Validação | Antes do REVOKE futuro | Depois do REVOKE futuro | Critério de sucesso |
| --- | --- | --- | --- |
| Grants da função | Confirmar `EXECUTE` atual para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role`. | Confirmar `anon=false` e `authenticated=false`; confirmar se `PUBLIC` será mantido ou revogado conforme decisão do ciclo. | Estado de grants igual ao planejado e documentado. |
| Função ativa | Confirmar que `public.df_auditoria_admin_sanitize_destinatario_alerta()` existe, retorna `trigger`, é `SECURITY DEFINER` e tem `search_path=public`. | Repetir confirmação sem mudança de definição. | Nenhuma alteração de função além de grants. |
| Trigger ativo | Confirmar trigger `trg_df_destinatarios_alertas_auditoria_admin` em `public.df_destinatarios_alertas`. | Confirmar trigger ainda ativo e apontando para a mesma função. | Trigger preservado. |
| INSERT em `df_destinatarios_alertas` | Inserir destinatário controlado em empresa de teste operacional, com usuário Admin/Master. | Repetir INSERT em registro controlado após REVOKE. | INSERT conclui sem erro e respeita RLS. |
| UPDATE em `df_destinatarios_alertas` | Atualizar/inativar/reativar destinatário controlado. | Repetir UPDATE após REVOKE. | UPDATE conclui sem erro e respeita RLS. |
| Auditoria em `df_auditoria_admin` | Confirmar registro esperado após INSERT/UPDATE, com `origem='database_trigger'` e e-mail apenas como hash. | Confirmar novo registro esperado após INSERT/UPDATE pós-REVOKE. | Auditoria continua registrando e saneando corretamente. |
| Uso direto no app/RPC | Repetir busca textual em `src`, `supabase/functions`, `scripts`, `docs` e `supabase/migrations`. | Não aplicável, salvo se houver erro operacional. | Nenhuma chamada RPC direta encontrada. |
| Policies | Confirmar que nenhuma policy cita textualmente a função. | Repetir se houver comportamento inesperado. | Nenhuma dependência direta de policy. |
| Tela/configuração relacionada | Confirmar que a tela de destinatários salva cadastro/edição em fluxo normal. | Repetir salvamento no app após REVOKE. | Fluxo visual continua funcional. |
| Advisor | Registrar alerta atual para a função. | Reexecutar Advisor, se disponível. | Alerta reduzido/removido para essa função, se o Advisor considerar grants revogados. |
| Rollback | Conferir SQL de rollback antes de alterar. | Aplicar rollback imediatamente se qualquer validação crítica falhar. | Serviço restaurado sem investigação longa em produção. |

## SQL de diagnóstico futuro

Não executar neste ciclo.

```sql
-- Função e grants antes/depois:
-- select
--   n.nspname as schema_name,
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as arguments,
--   pg_get_function_result(p.oid) as result_type,
--   l.lanname as language,
--   r.rolname as owner,
--   p.prosecdef as security_definer,
--   p.proconfig as config,
--   p.proacl as raw_acl,
--   has_function_privilege('anon', p.oid, 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('public', p.oid, 'EXECUTE') as public_has_execute
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- join pg_language l on l.oid = p.prolang
-- join pg_roles r on r.oid = p.proowner
-- where n.nspname = 'public'
--   and p.proname = 'df_auditoria_admin_sanitize_destinatario_alerta'
--   and pg_get_function_identity_arguments(p.oid) = '';

-- Trigger ativo:
-- select
--   t.tgname as trigger_name,
--   pg_get_triggerdef(t.oid) as trigger_definition
-- from pg_trigger t
-- join pg_proc p on p.oid = t.tgfoid
-- where p.proname = 'df_auditoria_admin_sanitize_destinatario_alerta'
--   and not t.tgisinternal;

-- Policies que citam a função:
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where coalesce(qual, '') ilike '%df_auditoria_admin_sanitize_destinatario_alerta%'
--    or coalesce(with_check, '') ilike '%df_auditoria_admin_sanitize_destinatario_alerta%';
```

## SQL futuro proposto

Não executar neste ciclo. Executar apenas em ciclo futuro autorizado, com validação antes/depois e rollback pronto.

```sql
-- revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from anon;
-- revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from authenticated;
```

Observação: a auditoria anterior também identificou `EXECUTE` para `PUBLIC`. A decisão de revogar `PUBLIC` deve ser tomada explicitamente no ciclo futuro, porque pode alterar o efeito prático para roles herdadas. Este plano mínimo registra apenas o pedido atual: `anon` e `authenticated`.

## Rollback futuro proposto

Não executar neste ciclo.

```sql
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to anon;
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to authenticated;
```

Se o ciclo futuro também revogar `PUBLIC`, o rollback desse grant deve ser incluído explicitamente:

```sql
-- grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to public;
```

## Riscos

- O trigger pode continuar funcionando por ser executado internamente pelo PostgreSQL, mas isso precisa ser validado no ambiente real.
- Se algum fluxo externo chamar a função diretamente por RPC, esse fluxo poderá quebrar após o REVOKE.
- Como não há homologação, aplicar somente em ciclo curto, com janela controlada, validação imediata e rollback pronto.
- A tabela `df_destinatarios_alertas` é funcional: Admin/Master cadastram/editam/inativam/reativam destinatários, Gerente visualiza e automações consultam destinatários ativos.
- Uma falha no trigger pode não só quebrar escrita, mas também interromper auditoria administrativa em `df_auditoria_admin`.

## Sequência segura para ciclo futuro

1. Rodar diagnósticos de função, grants, trigger, policies e busca no código.
2. Criar um registro de teste controlado em `df_destinatarios_alertas`.
3. Confirmar auditoria correspondente em `df_auditoria_admin`.
4. Executar o REVOKE autorizado.
5. Repetir INSERT/UPDATE controlados.
6. Confirmar auditoria correspondente pós-REVOKE.
7. Reexecutar Advisor, se disponível.
8. Aplicar rollback imediatamente se qualquer validação crítica falhar.

## Estado final do ciclo de planejamento

- Banco: não alterado.
- Grants: não alterados.
- Função: não alterada.
- Trigger: não alterado.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: não alterados.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.

## Execução da restrição em 2026-06-28

Status: executada parcialmente, conforme escopo autorizado.

Comandos executados no Supabase:

```sql
revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from anon;
revoke execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() from authenticated;
```

Não foi executado `REVOKE` de `PUBLIC`.

### Diagnóstico antes

- ACL antes: `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`.
- `anon` tinha `EXECUTE` efetivo: `true`.
- `authenticated` tinha `EXECUTE` efetivo: `true`.
- `PUBLIC` tinha `EXECUTE` efetivo: `true`.
- Função existente, `SECURITY DEFINER`, retorno `trigger`, `search_path=public`.
- Hash da definição antes: `004a9239b3160638608137e7f330a244`.
- Trigger `trg_df_destinatarios_alertas_auditoria_admin` ativo em `public.df_destinatarios_alertas`, `AFTER INSERT OR UPDATE`.
- Policies que citam textualmente a função: `0`.
- Busca no código: sem chamada RPC direta em `src`, `supabase/functions` ou `scripts`; ocorrências restritas a docs/migrations e uso da tabela relacionada.

### Validação funcional antes

Teste executado em transação com `ROLLBACK`, sem persistir destinatário de teste:

- `INSERT` controlado em `public.df_destinatarios_alertas`: sucesso.
- `UPDATE` controlado no mesmo registro: sucesso.
- Auditoria de `INSERT` em `public.df_auditoria_admin`: `1`.
- Auditoria de `UPDATE` em `public.df_auditoria_admin`: `1`.
- `origem='database_trigger'`: confirmado.
- `email_hash` no detalhe de auditoria: confirmado.

### Diagnóstico depois

- ACL depois: `{=X/postgres,postgres=X/postgres,service_role=X/postgres}`.
- Grants diretos restantes em `information_schema.routine_privileges`: `PUBLIC`, `postgres`, `service_role`.
- Grants diretos removidos: `anon`, `authenticated`.
- `anon` ainda tem `EXECUTE` efetivo: `true`, por causa de `PUBLIC`.
- `authenticated` ainda tem `EXECUTE` efetivo: `true`, por causa de `PUBLIC`.
- `PUBLIC` continua com `EXECUTE` efetivo: `true`.
- Hash da definição depois: `004a9239b3160638608137e7f330a244`.
- Trigger `trg_df_destinatarios_alertas_auditoria_admin` continuou ativo e apontando para a mesma função.

### Validação funcional depois

Teste repetido em transação com `ROLLBACK`, sem persistir destinatário de teste:

- `INSERT` controlado em `public.df_destinatarios_alertas`: sucesso.
- `UPDATE` controlado no mesmo registro: sucesso.
- Auditoria de `INSERT` em `public.df_auditoria_admin`: `1`.
- Auditoria de `UPDATE` em `public.df_auditoria_admin`: `1`.
- `origem='database_trigger'`: confirmado.
- `email_hash` no detalhe de auditoria: confirmado.

### Advisor depois

O Security Advisor ainda listou a função em:

- `anon_security_definer_function_executable`;
- `authenticated_security_definer_function_executable`.

Leitura: a permanência do alerta é esperada porque `PUBLIC` continua com `EXECUTE`, e `anon`/`authenticated` mantêm execução efetiva por esse caminho. Não houve improviso para revogar `PUBLIC`, pois isso estava fora do escopo autorizado.

### Rollback

Rollback Supabase não foi executado porque a validação funcional antes/depois passou.

Rollback Supabase disponível, se necessário:

```sql
grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to anon;
grant execute on function public.df_auditoria_admin_sanitize_destinatario_alerta() to authenticated;
```

### Próximo passo recomendado

Preparar novo ciclo específico para decidir se `PUBLIC` deve perder `EXECUTE` nessa função. Esse ciclo deve repetir a mesma matriz e deixar explícito que a mudança efetiva do Advisor depende de remover o caminho por `PUBLIC`.
