# Plano de restrição da função df_funcionarios_exames_periodicos_validar_funcionario_empresa

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função alvo: `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()`

## Escopo

Plano documental para um ciclo futuro de restrição de `EXECUTE` da função `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()`.

Este ciclo não executa `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de trigger, RLS, policy, view, índice, migration, dados, frontend, service, hook ou autenticação.

## Contexto da auditoria

A auditoria específica publicada em `docs/supabase/funcoes/df_funcionarios_exames_periodicos_validar_funcionario_empresa.md` classificou a função como candidata a restrição futura.

Achados principais:

- função `plpgsql`;
- `SECURITY DEFINER`;
- owner `postgres`;
- retorno `trigger`;
- `search_path=public`;
- hash da definição: `0d8991e6d2fe071de5bc2a3e1ffb2b90`;
- usada pelo trigger `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre`;
- tabela: `public.df_funcionarios_exames_periodicos`;
- grants atuais incluem `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role`;
- `PUBLIC`, `anon` e `authenticated` têm `EXECUTE` efetivo;
- sem evidência de chamada RPC direta pelo app;
- app usa a tabela, não a função.

## Matriz de validação antes/depois

| Validação | Antes do REVOKE futuro | Depois do REVOKE futuro | Critério de aceite |
| --- | --- | --- | --- |
| ACL/grants | Confirmar grants atuais para `PUBLIC`, `anon`, `authenticated`, `postgres` e `service_role`. | Confirmar que `PUBLIC`, `anon` e `authenticated` perderam `EXECUTE`; `postgres` e `service_role` seguem conforme esperado. | Estado final bate com o escopo autorizado do ciclo futuro. |
| EXECUTE efetivo | Confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo. | Confirmar `PUBLIC`, `anon` e `authenticated` sem `EXECUTE` efetivo. | `has_function_privilege` retorna `false` para os três papéis restritos. |
| Função | Confirmar função existente, `SECURITY DEFINER`, `search_path=public`, retorno `trigger` e hash `0d8991e6d2fe071de5bc2a3e1ffb2b90`. | Repetir e confirmar hash/definição intactos. | Nenhuma alteração funcional na função. |
| Trigger | Confirmar `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre` ativo. | Confirmar trigger ativo. | Trigger continua habilitado em `df_funcionarios_exames_periodicos`. |
| Policies | Confirmar que nenhuma policy cita a função. | Repetir se necessário. | Nenhuma dependência direta de RLS/policy foi introduzida. |
| Código/RPC | Confirmar ausência de chamada RPC direta no código versionado. | Repetir busca se houve mudança de código entre ciclos. | Nenhum uso direto pelo app. |
| Estrutura da tabela | Confirmar colunas obrigatórias, constraints e FKs de `df_funcionarios_exames_periodicos`. | Não aplicável, salvo se houver alteração estrutural entre ciclos. | Campos mínimos para teste controlado estão conhecidos. |
| Teste funcional válido | Executar `INSERT`/`UPDATE` controlados em transação com `ROLLBACK`, se seguro. | Repetir o mesmo teste após a restrição. | Trigger executa e valida funcionário/empresa sem persistir dados. |
| Advisor | Confirmar que a função aparece nos alertas antes, se aplicável. | Consultar Advisor após restrição. | Alertas da função reduzem ou desaparecem; se persistirem, registrar motivo. |

## Diagnóstico antes do REVOKE futuro

Antes de qualquer alteração, executar somente consultas de diagnóstico:

- confirmar ACL atual;
- confirmar `PUBLIC`, `anon` e `authenticated` com `EXECUTE` efetivo;
- confirmar trigger ativo;
- confirmar função ativa e definição intacta;
- confirmar hash da função;
- confirmar que não há chamada RPC direta no código;
- confirmar que não há policy dependendo diretamente da função;
- confirmar estrutura mínima da tabela `df_funcionarios_exames_periodicos`;
- identificar campos obrigatórios para teste seguro;
- confirmar se é seguro testar `INSERT`/`UPDATE` em transação com `ROLLBACK`.

SQL diagnóstico sugerido, somente leitura:

```sql
-- ACL, hash e privilégios efetivos:
-- select
--   p.oid::regprocedure as funcao,
--   p.proacl as acl,
--   has_function_privilege('public', p.oid, 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', p.oid, 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_has_execute,
--   md5(pg_get_functiondef(p.oid)) as definition_md5
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname = 'df_funcionarios_exames_periodicos_validar_funcionario_empresa'
--   and pg_get_function_identity_arguments(p.oid) = '';

-- Grants diretos:
-- select grantee, privilege_type, is_grantable
-- from information_schema.routine_privileges
-- where specific_schema = 'public'
--   and routine_name = 'df_funcionarios_exames_periodicos_validar_funcionario_empresa'
-- order by grantee;

-- Trigger ativo:
-- select
--   t.tgname,
--   t.tgrelid::regclass as tabela,
--   t.tgenabled,
--   pg_get_triggerdef(t.oid) as definicao
-- from pg_trigger t
-- join pg_proc p on p.oid = t.tgfoid
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname = 'df_funcionarios_exames_periodicos_validar_funcionario_empresa';

-- Policies que citam a função:
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and (
--     coalesce(qual, '') ilike '%df_funcionarios_exames_periodicos_validar_funcionario_empresa%'
--     or coalesce(with_check, '') ilike '%df_funcionarios_exames_periodicos_validar_funcionario_empresa%'
--   );

-- Estrutura mínima da tabela:
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'df_funcionarios_exames_periodicos'
-- order by ordinal_position;
```

## Validação funcional antes

Executar apenas se houver cenário seguro e reversível.

Objetivo:

- fazer `INSERT` controlado em `public.df_funcionarios_exames_periodicos` dentro de transação com `ROLLBACK`;
- fazer `UPDATE` controlado no mesmo registro dentro da mesma transação, quando seguro;
- confirmar que a trigger executa;
- confirmar que a validação funcionário/empresa aceita dados coerentes da mesma empresa;
- confirmar rejeição de vínculo funcionário/empresa inválido, se viável sem persistência;
- confirmar que nenhuma alteração persiste.

Cuidados:

- usar funcionário real da empresa apenas dentro de transação com `ROLLBACK`, ou criar empresa/funcionário mínimos dentro da própria transação;
- não registrar laudos, resultados, CID, diagnósticos, documentos, anexos, uploads ou links públicos;
- não usar dado crítico;
- não alterar exame real fora de transação;
- se não for seguro criar registro de teste, documentar a impossibilidade e não prosseguir com `REVOKE`.

Alternativa segura se o `INSERT` controlado não for viável:

- executar somente diagnóstico de catálogo;
- testar em ambiente de banco restaurado ou branch de banco quando disponível;
- adiar a restrição até existir cenário de validação funcional confiável.

## SQL futuro proposto

Não executar sem novo ciclo autorizado.

```sql
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from anon;
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from authenticated;
-- revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from public;
```

## Diagnóstico depois do REVOKE futuro

Depois da restrição, repetir:

- grants diretos;
- `has_function_privilege` para `PUBLIC`, `anon` e `authenticated`;
- existência e hash da função;
- trigger ativo;
- consulta ao Supabase Advisor.

Critério esperado:

- `PUBLIC` sem `EXECUTE` efetivo;
- `anon` sem `EXECUTE` efetivo;
- `authenticated` sem `EXECUTE` efetivo;
- função intacta;
- hash preservado;
- trigger ativo;
- Advisor reduz ou remove o alerta da função.

## Validação funcional depois

Repetir o mesmo teste funcional usado antes da restrição:

- `INSERT` controlado em `df_funcionarios_exames_periodicos` com `ROLLBACK`;
- `UPDATE` controlado no mesmo registro com `ROLLBACK`;
- confirmar que o trigger continua executando;
- confirmar que a validação funcionário/empresa continua funcionando;
- confirmar que nenhum dado persiste;
- quando operacionalmente seguro, validar que tela/fluxo de exames periódicos continua salvando.

## Rollback futuro proposto

Não executar sem necessidade real em ciclo futuro.

```sql
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to public;
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to anon;
-- grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to authenticated;
```

Após rollback, repetir:

- diagnóstico de grants;
- validação funcional de `INSERT`/`UPDATE`;
- confirmação de que fluxo de exames periódicos voltou a funcionar;
- registro documental da falha e do motivo.

## Riscos

- Pode haver campos obrigatórios ligados a funcionário, empresa e filial.
- Pode haver FK exigindo funcionário real da empresa.
- O trigger provavelmente continua funcionando após `REVOKE`, mas isso precisa ser validado.
- Se algum RPC externo existir fora do código versionado, poderá quebrar.
- Sem homologação, executar somente em ciclo curto, com rollback imediato.
- Não misturar esta restrição com ajustes de RLS, policies, views, índices ou frontend.

## Execução da restrição em 2026-06-28

Restrição executada em ciclo curto autorizado, após validação funcional antes com transação e `ROLLBACK`.

Atenção LGPD aplicada: os testes usaram apenas dados técnicos mínimos criados dentro da transação. Não foram registrados laudos, resultados, CID, diagnósticos, documentos, anexos, uploads, links públicos ou dados médicos reais.

SQL executado:

```sql
revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from anon;
revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from authenticated;
revoke execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() from public;
```

### Diagnóstico antes

ACL observada antes:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

Privilégios efetivos antes:

| Role | EXECUTE efetivo |
| --- | --- |
| `PUBLIC` | `true` |
| `anon` | `true` |
| `authenticated` | `true` |
| `postgres` | `true` |
| `service_role` | `true` |

Função antes:

- `SECURITY DEFINER`: `true`;
- retorno: `trigger`;
- linguagem: `plpgsql`;
- owner: `postgres`;
- `search_path=public`;
- hash da definição: `0d8991e6d2fe071de5bc2a3e1ffb2b90`.

Trigger antes:

- `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre`;
- tabela: `public.df_funcionarios_exames_periodicos`;
- status: habilitado (`tgenabled=O`);
- definição: `BEFORE INSERT OR UPDATE OF empresa_id, funcionario_id`.

Não foi encontrada policy citando textualmente a função. A busca local também não encontrou chamada RPC direta no app, Edge Functions ou scripts.

### Validação funcional antes

Foi executado teste controlado em transação com `ROLLBACK`.

O teste:

- criou dados técnicos mínimos de empresa e funcionário dentro da transação;
- inseriu um registro em `public.df_funcionarios_exames_periodicos` apenas com `empresa_id`, `funcionario_id` e `data_exame`;
- atualizou `data_exame` no mesmo registro;
- tentou trocar `funcionario_id` para funcionário de outra empresa;
- confirmou rejeição por `check_violation`, validando que o trigger executou a regra funcionário/empresa;
- executou `ROLLBACK`;
- confirmou `0` registros de teste persistidos.

Resultado antes:

```text
insert_update_ok_invalid_rejected_ok_rollback_ok
registros_teste_persistidos=0
```

### Diagnóstico depois

ACL observada depois:

```text
{postgres=X/postgres,service_role=X/postgres}
```

Privilégios efetivos depois:

| Role | EXECUTE efetivo |
| --- | --- |
| `PUBLIC` | `false` |
| `anon` | `false` |
| `authenticated` | `false` |
| `postgres` | `true` |
| `service_role` | `true` |

Grants diretos finais:

| Grantee | Privilégio | Grantable |
| --- | --- | --- |
| `postgres` | `EXECUTE` | `YES` |
| `service_role` | `EXECUTE` | `NO` |

Função depois:

- `SECURITY DEFINER`: `true`;
- retorno: `trigger`;
- linguagem: `plpgsql`;
- owner: `postgres`;
- `search_path=public`;
- hash da definição preservado: `0d8991e6d2fe071de5bc2a3e1ffb2b90`.

Trigger depois:

- `trg_df_funcionarios_exames_periodicos_validar_funcionario_empre` permaneceu habilitado;
- definição preservada.

### Validação funcional depois

Foi repetido o mesmo teste controlado em transação com `ROLLBACK`.

Resultado depois:

```text
insert_update_ok_invalid_rejected_ok_rollback_ok
registros_teste_persistidos=0
```

Leitura: a restrição de `EXECUTE` não quebrou a execução interna do trigger no teste transacional. A validação funcionário/empresa continuou funcionando.

### Advisor

O Supabase Security Advisor foi consultado após a restrição.

Resultado: `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()` deixou de aparecer nos alertas `anon_security_definer_function_executable` e `authenticated_security_definer_function_executable`.

### Rollback

Não houve rollback neste ciclo.

Rollback Supabase, se necessário:

```sql
grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to public;
grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to anon;
grant execute on function public.df_funcionarios_exames_periodicos_validar_funcionario_empresa() to authenticated;
```

## Estado final deste ciclo

- Banco: alterado somente nos grants autorizados da função alvo.
- Grants: `EXECUTE` removido de `PUBLIC`, `anon` e `authenticated`.
- Função: não alterada.
- Trigger: não alterado.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: nenhum dado persistente alterado; testes executados com `ROLLBACK`.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
