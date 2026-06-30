# Diagnóstico anon/PUBLIC da função `is_master`

Data do diagnóstico: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento diagnostica se `anon` e `PUBLIC` parecem necessários para executar `public.is_master()`.

O ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `ALTER POLICY`, alteração de Auth, senha, RLS, view, índice, migration, dados, Edge Function, frontend, service ou hook.

## Resumo executivo

Conclusão do diagnóstico inicial: **favorável a preparar um ciclo futuro para remover `EXECUTE` de `anon` e `PUBLIC` em `public.is_master()`**, mantendo `authenticated`.

Motivos:

- as 27 policies que citam `is_master()` são para role `{authenticated}`;
- nenhuma policy que cita `is_master()` é explicitamente para `anon`;
- nenhuma policy que cita `is_master()` é para `PUBLIC`;
- o uso direto versionado da RPC está em contexto autenticado: Edge Function `convidar-usuario` e script diagnóstico;
- `authenticated` é dependência real e deve ser mantido;
- `anon` e `PUBLIC` mantêm exposição RPC desnecessária de um helper de permissão Master.

Limite da conclusão: este diagnóstico avalia o grant de execução da função `is_master()`. Ele não corrige grants ou policies das tabelas afetadas. Há riscos separados de hardening em tabelas como `df_assinaturas`, `df_usuarios_empresas` e `df_usuarios_filiais`, que aparecem com grants diretos para `anon` e devem ser tratados em ciclo próprio.

Status em 2026-06-30: a remoção de `EXECUTE` de `anon` e `PUBLIC` foi executada em ciclo curto autorizado. `authenticated`, `postgres` e `service_role` foram preservados.

## Grants atuais da função

| Item | Resultado |
| --- | --- |
| Função | `public.is_master()` |
| Linguagem | `sql` |
| `SECURITY DEFINER` | `true` |
| Owner | `postgres` |
| `search_path` | `public` |
| Hash da definição | `0ae7a94df00e970385f5cf68ada3925a` |
| ACL | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` com `EXECUTE` efetivo | sim |
| `anon` com `EXECUTE` efetivo | sim |
| `authenticated` com `EXECUTE` efetivo | sim |
| `postgres` com `EXECUTE` efetivo | sim |
| `service_role` com `EXECUTE` efetivo | sim |

Leitura: a função segue intacta, com `search_path=public`, e `anon`/`PUBLIC` ainda conseguem executar diretamente a RPC.

## Análise por policy/role

Foram confirmadas novamente 27 policies com `is_master()` em 8 tabelas.

| Tabela | Policies com `is_master()` | Policies com `is_master()` para `authenticated` | Policies com `is_master()` para `anon` | Policies com `is_master()` para `PUBLIC` |
| --- | ---: | ---: | ---: | ---: |
| `df_assinaturas` | 4 | 4 | 0 | 0 |
| `df_auditoria_admin` | 1 | 1 | 0 | 0 |
| `df_contas` | 4 | 4 | 0 | 0 |
| `df_contas_pagamentos` | 3 | 3 | 0 | 0 |
| `df_destinatarios_alertas` | 3 | 3 | 0 | 0 |
| `df_notas` | 4 | 4 | 0 | 0 |
| `df_usuarios_empresas` | 4 | 4 | 0 | 0 |
| `df_usuarios_filiais` | 4 | 4 | 0 | 0 |

Leitura: o uso real de `is_master()` nas policies mapeadas é para `authenticated`. Remover `EXECUTE` de `anon` e `PUBLIC` da função não deve afetar essas policies se `authenticated` for mantido.

### Policies por tabela

| Tabela | Policies confirmadas |
| --- | --- |
| `df_assinaturas` | `df_assinaturas_delete_master_saneado`, `df_assinaturas_insert_admin_saneado`, `df_assinaturas_select_tenant_saneado`, `df_assinaturas_update_admin_saneado` |
| `df_auditoria_admin` | `df_auditoria_admin_select_admin_master` |
| `df_contas` | `df_contas_delete_admin_master`, `df_contas_insert_empresa_operacional`, `df_contas_select_empresa`, `df_contas_update_empresa_operacional` |
| `df_contas_pagamentos` | `df_contas_pagamentos_insert_empresa_operacional`, `df_contas_pagamentos_select_empresa`, `df_contas_pagamentos_update_empresa_operacional` |
| `df_destinatarios_alertas` | `df_destinatarios_alertas_insert_admin_master`, `df_destinatarios_alertas_select_empresa`, `df_destinatarios_alertas_update_admin_master` |
| `df_notas` | `df_notas_delete_admin_master`, `df_notas_insert_empresa_operacional`, `df_notas_select_empresa`, `df_notas_update_empresa_operacional` |
| `df_usuarios_empresas` | `df_usuarios_empresas_delete_admin_saneado`, `df_usuarios_empresas_insert_admin_saneado`, `df_usuarios_empresas_select_scoped_saneado`, `df_usuarios_empresas_update_admin_saneado` |
| `df_usuarios_filiais` | `df_usuarios_filiais_delete_admin_saneado`, `df_usuarios_filiais_insert_admin_saneado`, `df_usuarios_filiais_select_scoped_saneado`, `df_usuarios_filiais_update_admin_saneado` |

## Análise por tabela

| Tabela | Policy para `anon` com `is_master()` | Grant direto de tabela para `anon` | Grant direto de tabela para `authenticated` | Impacto provável de remover `anon/PUBLIC` de `is_master()` | Risco por tabela |
| --- | --- | --- | --- | --- | --- |
| `df_assinaturas` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para RLS de `is_master()`, pois as policies dependentes são `{authenticated}`. O grant de tabela para `anon` é achado separado. | Médio para o futuro `REVOKE` da função; alto como tema separado de grants da tabela |
| `df_auditoria_admin` | não | nenhum | `SELECT` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva leitura Admin/Master. | Baixo/médio |
| `df_contas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva RLS financeiro. | Médio, por criticidade financeira |
| `df_contas_pagamentos` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva baixa/consulta/edição. | Médio, por criticidade financeira |
| `df_destinatarios_alertas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva configuração de alertas. | Médio |
| `df_notas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva Notas/Pendências. | Médio |
| `df_usuarios_empresas` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `is_master()`, mas há 3 policies `{public}` sem `is_master()` e grants de tabela para `anon`; tratar separadamente. | Médio para o futuro `REVOKE` da função; crítico como tema separado de permissões de usuário/tenant |
| `df_usuarios_filiais` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `is_master()`, pois não há policy `anon` com esse helper. O grant de tabela para `anon` é achado separado. | Médio para o futuro `REVOKE` da função; alto como tema separado de permissões de filial |

## Policies `{public}` encontradas fora de `is_master()`

Nas 8 tabelas analisadas, foram encontradas 3 policies `{public}` em `df_usuarios_empresas`, nenhuma delas citando `is_master()`:

| Tabela | Policy | Comando | Resumo |
| --- | --- | --- | --- |
| `df_usuarios_empresas` | `Usuario vê sua empresa` | `SELECT` | `user_id = auth.uid()` |
| `df_usuarios_empresas` | `df usuarios select empresa` | `SELECT` | usa `df_empresas_do_usuario()` |
| `df_usuarios_empresas` | `ver propria empresa` | `SELECT` | `user_id = auth.uid()` |

Leitura: essas policies são relevantes para hardening RLS futuro, mas não justificam manter `anon`/`PUBLIC` com `EXECUTE` em `public.is_master()`.

## Chamadas diretas

Busca textual em `src`, `supabase/functions`, `scripts`, `docs` e `supabase/migrations` confirmou:

- `supabase/functions/convidar-usuario/index.ts` chama `supabaseUser.rpc('is_master')`;
- `scripts/validar-rls-df-funcionarios.mjs` chama `client.rpc('is_master')`;
- não há chamada direta em `src`;
- há uso histórico em migrations e documentação de RLS.

### Edge Function `convidar-usuario`

Achados:

- `verificarMaster(supabaseUser)` chama diretamente `supabaseUser.rpc('is_master')`;
- `supabaseUser` é criado com service role key, mas recebe `Authorization` do usuário chamador;
- a função valida `supabaseUser.auth.getUser()` e rejeita chamada sem sessão;
- o fluxo depende de usuário autenticado;
- `authenticated` deve ser mantido;
- `anon` e `PUBLIC` não são necessários para esse fluxo.

Impacto se `authenticated` fosse revogado: alto/crítico, pois a autorização Master na Edge Function pode falhar.

Impacto se apenas `anon`/`PUBLIC` forem revogados: baixo esperado para esse fluxo, desde que `authenticated` permaneça com `EXECUTE`.

### Script `validar-rls-df-funcionarios.mjs`

Achados:

- o script chama `client.rpc('is_master')` em diagnóstico;
- a finalidade aparente é validação operacional/RLS;
- `authenticated` deve ser preservado para cenários de usuário logado;
- eventual teste anônimo do script pode mudar de resultado se `anon` perder `EXECUTE`, o que é esperado em hardening.

## Impacto provável de revogar `anon`

Impacto provável: **baixo para RLS/policies de produção mapeadas**, porque nenhuma policy que cita `is_master()` é para `anon`.

Efeito esperado:

- bloquear chamada RPC direta anônima a `public.is_master()`;
- reduzir superfície de exposição de função `SECURITY DEFINER`;
- não afetar policies `{authenticated}` se `authenticated` for mantido;
- pode alterar apenas testes/diagnósticos anônimos que tentem chamar a RPC diretamente.

## Impacto provável de revogar `PUBLIC`

Impacto provável: **baixo para RLS/policies de produção mapeadas**, desde que `authenticated` seja mantido com grant direto.

Efeito esperado:

- remover execução herdada por `PUBLIC`;
- impedir que `anon` continue com execução efetiva por herança;
- preservar execução de `authenticated` por grant direto;
- preservar execução de `postgres` e `service_role`.

Leitura operacional: se em ciclo futuro for removido `anon` mas `PUBLIC` for mantido, `anon` pode continuar com `EXECUTE` efetivo por herança. Portanto, `anon` e `PUBLIC` devem ser tratados juntos.

## Motivo para manter `authenticated`

`authenticated` deve ser mantido porque:

- todas as 27 policies que citam `is_master()` são para `{authenticated}`;
- a Edge Function `convidar-usuario` chama a RPC no contexto de usuário autenticado;
- o script diagnóstico usa a RPC para validar contexto de usuário;
- revogar `authenticated` pode bloquear fluxos financeiros, usuários, filiais, destinatários, auditoria, notas e convites.

## Conclusão

Conclusão inicial: **seguro o suficiente para preparar ciclo futuro de remoção de `EXECUTE` de `anon` e `PUBLIC` em `public.is_master()`**, com `authenticated` mantido.

Status em 2026-06-30: ciclo futuro executado com sucesso, sem rollback.

## Execução da restrição em 2026-06-30

SQL executado:

```sql
revoke execute on function public.is_master() from anon;
revoke execute on function public.is_master() from public;
```

Não foi executado:

```sql
-- revoke execute on function public.is_master() from authenticated;
```

### Diagnóstico antes

| Item | Resultado antes |
| --- | --- |
| ACL | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` EXECUTE efetivo | sim |
| `anon` EXECUTE efetivo | sim |
| `authenticated` EXECUTE efetivo | sim |
| `postgres` EXECUTE efetivo | sim |
| `service_role` EXECUTE efetivo | sim |
| `search_path` | `public` |
| Hash da função | `0ae7a94df00e970385f5cf68ada3925a` |
| Policies com `is_master()` | 27 |
| Tabelas afetadas | 8 |
| Policies para `{authenticated}` | 27 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das policies | `33d87b723f5431f3dc52a22e3c0e15fe` |

### Diagnóstico depois

| Item | Resultado depois |
| --- | --- |
| ACL | `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` EXECUTE efetivo | não |
| `anon` EXECUTE efetivo | não |
| `authenticated` EXECUTE efetivo | sim |
| `postgres` EXECUTE efetivo | sim |
| `service_role` EXECUTE efetivo | sim |
| `search_path` | `public` |
| Hash da função | `0ae7a94df00e970385f5cf68ada3925a` |
| Policies com `is_master()` | 27 |
| Tabelas afetadas | 8 |
| Policies para `{authenticated}` | 27 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das policies | `33d87b723f5431f3dc52a22e3c0e15fe` |

Leitura: a função e as policies permaneceram intactas. A alteração ficou restrita aos grants de execução de `anon` e `PUBLIC`.

### Advisor após a restrição

O Security Advisor foi consultado após a execução.

Resultado para `is_master`:

- `is_master` não apareceu mais em `anon_security_definer_function_executable`;
- `is_master` permaneceu em `authenticated_security_definer_function_executable`, conforme esperado, porque `authenticated` foi mantido;
- `is_master` não apareceu em `function_search_path_mutable`, pois a função mantém `search_path=public`.

### Validação funcional

Não houve teste operacional real da Edge Function `convidar-usuario` neste ciclo, para evitar alteração de usuário, Auth, convite, senha ou envio real.

Validação feita:

- código da Edge Function confirmado com chamada `supabaseUser.rpc('is_master')`;
- `supabaseUser` usa service role com `Authorization` do usuário chamador;
- `auth.getUser()` rejeita chamada sem sessão;
- `authenticated` foi preservado.

Pendência manual: validar convite autorizado em janela operacional se a equipe considerar necessário.

### Rollback Supabase preparado

Se houver quebra operacional relacionada a essa alteração:

```sql
grant execute on function public.is_master() to public;
grant execute on function public.is_master() to anon;
```

Se algum ciclo futuro mexer indevidamente em `authenticated`, rollback separado:

```sql
grant execute on function public.is_master() to authenticated;
```

## Plano original do ciclo futuro

O ciclo planejado deveria ser curto, com:

- diagnóstico antes;
- execução somente dos dois `REVOKE` planejados;
- diagnóstico depois;
- validação da Edge Function `convidar-usuario`, se operacionalmente possível;
- validação do script de RLS, se for usado como checklist;
- rollback imediato pronto.

## SQL futuro proposto, comentado

Não executar sem ciclo autorizado:

```sql
-- revoke execute on function public.is_master() from anon;
-- revoke execute on function public.is_master() from public;
```

Não executar:

```sql
-- revoke execute on function public.is_master() from authenticated;
```

## Rollback futuro comentado

```sql
-- grant execute on function public.is_master() to public;
-- grant execute on function public.is_master() to anon;
```

Se algum ciclo futuro mexer indevidamente em `authenticated`, rollback separado:

```sql
-- grant execute on function public.is_master() to authenticated;
```

## Pendências manuais

- Validar operacionalmente convite de usuário pela Edge Function antes/depois no ciclo de restrição.
- Se o script `validar-rls-df-funcionarios.mjs` continuar sendo checklist oficial, rodá-lo antes/depois no ciclo de restrição.
- Abrir ciclo separado para avaliar grants diretos de `anon` nas tabelas `df_assinaturas`, `df_usuarios_empresas` e `df_usuarios_filiais`.
- Abrir ciclo separado para revisar as 3 policies `{public}` de `df_usuarios_empresas`.
