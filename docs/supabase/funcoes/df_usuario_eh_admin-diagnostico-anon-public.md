# Diagnóstico anon/PUBLIC da função `df_usuario_eh_admin`

Data do diagnóstico: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento diagnostica se `anon` e `PUBLIC` parecem necessários para executar `public.df_usuario_eh_admin(uuid)`.

O ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres e busca textual no código versionado. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `ALTER POLICY`, alteração de Auth, senha, RLS, view, índice, migration, dados, Edge Function, frontend, service ou hook.

## Resumo executivo

Conclusão do diagnóstico: **favorável a preparar um ciclo futuro para remover `EXECUTE` de `anon` e `PUBLIC` em `public.df_usuario_eh_admin(uuid)`**, mantendo `authenticated`.

Motivos:

- as 24 policies que citam `df_usuario_eh_admin` são para role `{authenticated}`;
- nenhuma policy que cita `df_usuario_eh_admin` é explicitamente para `anon`;
- nenhuma policy que cita `df_usuario_eh_admin` é para `PUBLIC`;
- o uso direto versionado da RPC está na Edge Function `convidar-usuario`, que exige sessão autenticada;
- não foi encontrado uso direto em `src`;
- `authenticated` é dependência real e deve ser mantido;
- `anon` e `PUBLIC` mantêm exposição RPC desnecessária de um helper de permissão Admin por empresa.

Limite da conclusão: este diagnóstico avalia o grant de execução da função `df_usuario_eh_admin`. Ele não corrige grants ou policies das tabelas afetadas. Há riscos separados de hardening em tabelas como `df_assinaturas`, `df_usuarios_empresas` e `df_usuarios_filiais`, que aparecem com grants diretos para `anon` e devem ser tratados em ciclo próprio.

## Grants atuais da função

| Item | Resultado |
| --- | --- |
| Função | `public.df_usuario_eh_admin(p_empresa_id uuid)` |
| Linguagem | `sql` |
| `SECURITY DEFINER` | `true` |
| Owner | `postgres` |
| `search_path` | `public` |
| Hash da definição | `cf45999529ac743d9db7696a3e4ad53c` |
| ACL | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` com `EXECUTE` efetivo | sim |
| `anon` com `EXECUTE` efetivo | sim |
| `authenticated` com `EXECUTE` efetivo | sim |
| `postgres` com `EXECUTE` efetivo | sim |
| `service_role` com `EXECUTE` efetivo | sim |

Leitura: a função segue intacta, com `search_path=public`, e `anon`/`PUBLIC` ainda conseguem executar diretamente a RPC.

## Análise por policy/role

Foram confirmadas 24 policies com `df_usuario_eh_admin` em 8 tabelas.

| Tabela | Policies com `df_usuario_eh_admin` | Policies para `authenticated` | Policies para `anon` | Policies para `PUBLIC` |
| --- | ---: | ---: | ---: | ---: |
| `df_assinaturas` | 2 | 2 | 0 | 0 |
| `df_auditoria_admin` | 1 | 1 | 0 | 0 |
| `df_contas` | 4 | 4 | 0 | 0 |
| `df_contas_pagamentos` | 3 | 3 | 0 | 0 |
| `df_destinatarios_alertas` | 2 | 2 | 0 | 0 |
| `df_notas` | 4 | 4 | 0 | 0 |
| `df_usuarios_empresas` | 4 | 4 | 0 | 0 |
| `df_usuarios_filiais` | 4 | 4 | 0 | 0 |

Resumo:

| Métrica | Resultado |
| --- | ---: |
| Policies com a função | 24 |
| Tabelas afetadas | 8 |
| Policies para `{authenticated}` | 24 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das policies | `7e4778c2e4d612251bcc1bbbc9669b0d` |

Leitura: o uso real de `df_usuario_eh_admin` nas policies mapeadas é para `authenticated`. Remover `EXECUTE` de `anon` e `PUBLIC` da função não deve afetar essas policies se `authenticated` for mantido.

### Policies confirmadas

| Tabela | Policies |
| --- | --- |
| `df_assinaturas` | `df_assinaturas_insert_admin_saneado`, `df_assinaturas_update_admin_saneado` |
| `df_auditoria_admin` | `df_auditoria_admin_select_admin_master` |
| `df_contas` | `df_contas_delete_admin_master`, `df_contas_insert_empresa_operacional`, `df_contas_select_empresa`, `df_contas_update_empresa_operacional` |
| `df_contas_pagamentos` | `df_contas_pagamentos_insert_empresa_operacional`, `df_contas_pagamentos_select_empresa`, `df_contas_pagamentos_update_empresa_operacional` |
| `df_destinatarios_alertas` | `df_destinatarios_alertas_insert_admin_master`, `df_destinatarios_alertas_update_admin_master` |
| `df_notas` | `df_notas_delete_admin_master`, `df_notas_insert_empresa_operacional`, `df_notas_select_empresa`, `df_notas_update_empresa_operacional` |
| `df_usuarios_empresas` | `df_usuarios_empresas_delete_admin_saneado`, `df_usuarios_empresas_insert_admin_saneado`, `df_usuarios_empresas_select_scoped_saneado`, `df_usuarios_empresas_update_admin_saneado` |
| `df_usuarios_filiais` | `df_usuarios_filiais_delete_admin_saneado`, `df_usuarios_filiais_insert_admin_saneado`, `df_usuarios_filiais_select_scoped_saneado`, `df_usuarios_filiais_update_admin_saneado` |

## Análise por tabela

| Tabela | Policy para `anon` com a função | Grant direto de tabela para `anon` | Grant direto de tabela para `authenticated` | Impacto provável de remover `anon/PUBLIC` da função | Risco por tabela |
| --- | --- | --- | --- | --- | --- |
| `df_assinaturas` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para RLS da função, pois as policies dependentes são `{authenticated}`. O grant de tabela para `anon` é achado separado. | Médio para o futuro `REVOKE` da função; alto como tema separado de grants da tabela |
| `df_auditoria_admin` | não | nenhum | `SELECT` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva leitura Admin/Master. | Baixo/médio |
| `df_contas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva RLS financeiro. | Médio, por criticidade financeira |
| `df_contas_pagamentos` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva baixa/consulta/edição. | Médio, por criticidade financeira |
| `df_destinatarios_alertas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva configuração de alertas. | Médio |
| `df_notas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para `anon/PUBLIC`; manter `authenticated` preserva Notas/Pendências. | Médio |
| `df_usuarios_empresas` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para esta função, mas há 3 policies `{public}` sem `df_usuario_eh_admin` e grants de tabela para `anon`; tratar separadamente. | Médio para o futuro `REVOKE` da função; crítico como tema separado de permissões de usuário/tenant |
| `df_usuarios_filiais` | não | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para esta função, pois não há policy `anon` com esse helper. O grant de tabela para `anon` é achado separado. | Médio para o futuro `REVOKE` da função; alto como tema separado de permissões de filial |

## Policies `{public}` encontradas fora da função

Nas 8 tabelas analisadas, foram encontradas 3 policies `{public}` em `df_usuarios_empresas`, nenhuma delas citando `df_usuario_eh_admin`:

| Tabela | Policy | Comando | Resumo |
| --- | --- | --- | --- |
| `df_usuarios_empresas` | `Usuario vê sua empresa` | `SELECT` | `user_id = auth.uid()` |
| `df_usuarios_empresas` | `df usuarios select empresa` | `SELECT` | usa `df_empresas_do_usuario()` |
| `df_usuarios_empresas` | `ver propria empresa` | `SELECT` | `user_id = auth.uid()` |

Leitura: essas policies são relevantes para hardening RLS futuro, mas não justificam manter `anon`/`PUBLIC` com `EXECUTE` em `public.df_usuario_eh_admin(uuid)`.

## Chamadas diretas

Busca textual em `src`, `supabase/functions`, `scripts`, `docs` e `supabase/migrations` confirmou:

- `supabase/functions/convidar-usuario/index.ts` chama `supabaseUser.rpc('df_usuario_eh_admin', params)`;
- não há chamada direta em `src`;
- não há chamada direta em `scripts`;
- há uso histórico em migrations e documentação de RLS.

### Edge Function `convidar-usuario`

Achados:

- `verificarAdminEmpresa(supabaseUser, empresaId)` chama diretamente `supabaseUser.rpc('df_usuario_eh_admin', params)`;
- `supabaseUser` é criado com service role key, mas recebe `Authorization` do usuário chamador;
- a função valida `supabaseUser.auth.getUser()` e rejeita chamada sem sessão;
- o fluxo depende de usuário autenticado;
- `authenticated` deve ser mantido;
- `anon` e `PUBLIC` não são necessários para esse fluxo.

Impacto se `authenticated` fosse revogado: alto/crítico, pois a autorização Admin na Edge Function pode falhar.

Impacto se apenas `anon`/`PUBLIC` forem revogados: baixo esperado para esse fluxo, desde que `authenticated` permaneça com `EXECUTE`.

## Impacto provável de revogar `anon`

Impacto provável: **baixo para RLS/policies de produção mapeadas**, porque nenhuma policy que cita `df_usuario_eh_admin` é para `anon`.

Efeito esperado:

- bloquear chamada RPC direta anônima a `public.df_usuario_eh_admin(uuid)`;
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

- todas as 24 policies que citam `df_usuario_eh_admin` são para `{authenticated}`;
- a Edge Function `convidar-usuario` chama a RPC no contexto de usuário autenticado;
- revogar `authenticated` pode bloquear fluxos financeiros, usuários, filiais, destinatários, auditoria, notas e convites.

## Conclusão

Conclusão: **seguro o suficiente para preparar ciclo futuro de remoção de `EXECUTE` de `anon` e `PUBLIC` em `public.df_usuario_eh_admin(uuid)`**, com `authenticated` mantido.

Essa conclusão não autoriza mudança neste ciclo. O próximo ciclo deve ser curto, com:

- diagnóstico antes;
- execução somente dos dois `REVOKE` planejados;
- diagnóstico depois;
- validação da Edge Function `convidar-usuario`, se operacionalmente possível;
- rollback imediato pronto.

## SQL futuro proposto, comentado

Não executar sem ciclo autorizado:

```sql
-- revoke execute on function public.df_usuario_eh_admin(uuid) from anon;
-- revoke execute on function public.df_usuario_eh_admin(uuid) from public;
```

Não executar:

```sql
-- revoke execute on function public.df_usuario_eh_admin(uuid) from authenticated;
```

## Rollback futuro comentado

```sql
-- grant execute on function public.df_usuario_eh_admin(uuid) to public;
-- grant execute on function public.df_usuario_eh_admin(uuid) to anon;
```

Se algum ciclo futuro mexer indevidamente em `authenticated`, rollback separado:

```sql
-- grant execute on function public.df_usuario_eh_admin(uuid) to authenticated;
```

## Pendências manuais

- Validar operacionalmente convite de usuário pela Edge Function antes/depois no ciclo de restrição.
- Abrir ciclo separado para avaliar grants diretos de `anon` nas tabelas `df_assinaturas`, `df_usuarios_empresas` e `df_usuarios_filiais`.
- Abrir ciclo separado para revisar as 3 policies `{public}` de `df_usuarios_empresas`.
