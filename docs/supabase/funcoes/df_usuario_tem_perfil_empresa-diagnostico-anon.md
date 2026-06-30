# Diagnóstico anon da função `df_usuario_tem_perfil_empresa`

Data do diagnóstico: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento diagnostica se `anon` parece necessário para executar `public.df_usuario_tem_perfil_empresa(uuid, text[])`.

O ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres e busca textual no código versionado. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `ALTER POLICY`, alteração de Auth, senha, RLS, view, índice, migration, dados, Edge Function, frontend, service ou hook.

## Resumo executivo

Conclusão do diagnóstico: **favorável a preparar ciclo futuro para remover `EXECUTE` de `anon` em `public.df_usuario_tem_perfil_empresa(uuid, text[])`**, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

Motivos:

- `PUBLIC` já está sem `EXECUTE` efetivo;
- `anon` ainda tem `EXECUTE` efetivo por grant direto;
- as 14 policies que citam `df_usuario_tem_perfil_empresa` são para role `{authenticated}`;
- nenhuma policy que cita a função é explicitamente para `anon`;
- nenhuma das 5 tabelas afetadas tem privilégio real de tabela para `anon`;
- não foi encontrada chamada direta em `src`, `supabase/functions` ou `scripts`;
- o uso real identificado é em RLS/policies de usuário autenticado;
- `authenticated` é dependência real e deve ser mantido.

Limite da conclusão: este diagnóstico avalia apenas a remoção de `EXECUTE` de `anon` na função. Ele não corrige grants de tabelas, policies, Auth, frontend, Edge Functions ou desenho de RLS.

## Grants atuais

| Item | Resultado |
| --- | --- |
| Função | `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])` |
| Linguagem | `sql` |
| Volatility | `STABLE` |
| `SECURITY DEFINER` | `true` |
| Owner | `postgres` |
| `search_path` | `public` |
| Hash da definição | `99044d6cf258c6b12172ac972d96c78e` |
| ACL | `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` |
| `PUBLIC` com `EXECUTE` efetivo | não |
| `anon` com `EXECUTE` efetivo | sim |
| `authenticated` com `EXECUTE` efetivo | sim |
| `postgres` com `EXECUTE` efetivo | sim |
| `service_role` com `EXECUTE` efetivo | sim |

Leitura: a função segue intacta, com `search_path=public`. A exposição herdada por `PUBLIC` já está mitigada, mas `anon` ainda consegue executar a RPC diretamente por grant próprio.

## Análise por policy/role

Foram confirmadas 14 policies com `df_usuario_tem_perfil_empresa` em 5 tabelas.

| Tabela | Policies com `df_usuario_tem_perfil_empresa` | Policies para `authenticated` | Policies para `anon` | Policies para `PUBLIC` |
| --- | ---: | ---: | ---: | ---: |
| `df_contas` | 4 | 4 | 0 | 0 |
| `df_contas_pagamentos` | 3 | 3 | 0 | 0 |
| `df_destinatarios_alertas` | 2 | 2 | 0 | 0 |
| `df_funcionarios` | 1 | 1 | 0 | 0 |
| `df_notas` | 4 | 4 | 0 | 0 |

Resumo:

| Métrica | Resultado |
| --- | ---: |
| Policies com a função | 14 |
| Tabelas afetadas | 5 |
| Policies para `{authenticated}` | 14 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das policies | `d05469c16cc7e57ee06591a78cd65c3c` |

Leitura: o uso da função nas policies mapeadas é para `authenticated`. Remover `EXECUTE` de `anon` não deve afetar essas policies se `authenticated` for mantido.

### Policies confirmadas

| Tabela | Policies |
| --- | --- |
| `df_contas` | `df_contas_delete_admin_master`, `df_contas_insert_empresa_operacional`, `df_contas_select_empresa`, `df_contas_update_empresa_operacional` |
| `df_contas_pagamentos` | `df_contas_pagamentos_insert_empresa_operacional`, `df_contas_pagamentos_select_empresa`, `df_contas_pagamentos_update_empresa_operacional` |
| `df_destinatarios_alertas` | `df_destinatarios_alertas_insert_admin_master`, `df_destinatarios_alertas_update_admin_master` |
| `df_funcionarios` | `df_funcionarios_select_rh_inicial` |
| `df_notas` | `df_notas_delete_admin_master`, `df_notas_insert_empresa_operacional`, `df_notas_select_empresa`, `df_notas_update_empresa_operacional` |

## Análise por tabela

| Tabela | Policy para `anon` com a função | Grant direto de tabela para `anon` | Grant direto de tabela para `authenticated` | Impacto provável de remover `anon` da função | Risco por tabela |
| --- | --- | --- | --- | --- | --- |
| `df_contas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para RLS, pois as policies dependentes são `{authenticated}` e `anon` não tem privilégio de tabela. | Médio pela criticidade financeira, mas baixo para o `REVOKE` de `anon` da função |
| `df_contas_pagamentos` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para RLS, pois `anon` não tem privilégio de tabela e as policies são `{authenticated}`. | Médio pela criticidade de baixas/pagamentos |
| `df_destinatarios_alertas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE` | Baixo para RLS; manter `authenticated` preserva configuração de alertas. | Médio |
| `df_funcionarios` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `REFERENCES`, `TRIGGER`, `TRUNCATE` | Baixo para RLS da função; o grant amplo de `authenticated` é tema separado de Gestão de Pessoas. | Alto como domínio LGPD, baixo para remoção de `anon` da função |
| `df_notas` | não | nenhum | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Baixo para RLS; manter `authenticated` preserva Notas/Pendências. | Médio |

Observação: nenhuma das 5 tabelas afetadas tem privilégio real de `SELECT`, `INSERT`, `UPDATE` ou `DELETE` para `anon`.

## Chamadas diretas

Busca textual em `src`, `supabase/functions` e `scripts` confirmou:

- nenhuma chamada direta encontrada;
- nenhuma chamada RPC direta encontrada;
- nenhuma Edge Function versionada chama `df_usuario_tem_perfil_empresa`.

Busca ampliada em `docs` e `supabase/migrations` mostra uso histórico/documental em migrations de RLS e inventários anteriores, mas não fluxo operacional versionado chamando RPC diretamente.

Leitura: não há evidência de que `anon` seja necessário para qualquer fluxo versionado.

## Impacto provável de revogar `anon`

Impacto provável: **baixo para RLS/policies de produção mapeadas**, porque:

- nenhuma policy que cita `df_usuario_tem_perfil_empresa` é para `anon`;
- nenhuma das tabelas afetadas tem privilégio real para `anon`;
- não há chamada direta da RPC em `src`, `supabase/functions` ou `scripts`;
- `authenticated` será preservado.

Efeito esperado:

- bloquear chamada RPC anônima direta a `public.df_usuario_tem_perfil_empresa(uuid, text[])`;
- reduzir superfície de exposição de função `SECURITY DEFINER`;
- não afetar as 14 policies `{authenticated}`;
- não afetar `PUBLIC`, que já está sem `EXECUTE` efetivo.

Risco residual:

- integração externa não versionada poderia chamar `/rpc/df_usuario_tem_perfil_empresa` como `anon`;
- sem homologação, a execução futura deve ser curta e com rollback imediato.

## Motivo para manter `authenticated`

`authenticated` deve ser mantido porque:

- as 14 policies que citam `df_usuario_tem_perfil_empresa` são para `{authenticated}`;
- a função participa de autorização em financeiro, notas, destinatários de alertas e Gestão de Pessoas;
- revogar `authenticated` poderia quebrar SELECT/INSERT/UPDATE/DELETE em fluxos reais;
- qualquer remoção de `authenticated` seria refatoração de RLS/policies, não hardening simples de grant.

## Motivo para manter `PUBLIC` sem EXECUTE

`PUBLIC` deve permanecer sem `EXECUTE` porque:

- evita execução herdada por roles não planejadas;
- impede que `anon` volte a executar por herança caso o grant direto seja removido;
- mantém o padrão já adotado nos helpers críticos tratados anteriormente.

Não há motivo identificado para conceder `EXECUTE` a `PUBLIC`.

## Conclusão

Conclusão: **seguro o suficiente para preparar ciclo futuro de remoção de `EXECUTE` de `anon` em `public.df_usuario_tem_perfil_empresa(uuid, text[])`**, mantendo `authenticated` e `PUBLIC` sem `EXECUTE`.

Essa conclusão não autoriza mudança neste ciclo. O próximo ciclo deve ser curto, com:

- diagnóstico antes;
- execução somente do `REVOKE` de `anon`;
- diagnóstico depois;
- confirmação de que `PUBLIC` segue sem `EXECUTE`;
- confirmação de que `authenticated` segue com `EXECUTE`;
- confirmação de que as 14 policies seguem existentes e `{authenticated}`;
- rollback imediato pronto.

## SQL futuro proposto, comentado

Não executar sem ciclo autorizado:

```sql
-- revoke execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from anon;
```

Não executar:

```sql
-- revoke execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from authenticated;
-- grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to public;
```

## Rollback futuro comentado

```sql
-- grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to anon;
```

Se algum ciclo futuro mexer indevidamente em `authenticated`, rollback separado:

```sql
-- grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to authenticated;
```

## Pendências manuais

- Validar operacionalmente fluxos autenticados que dependem das 14 policies se o próximo ciclo executar o `REVOKE` de `anon`.
- Confirmar novamente que não há chamada externa conhecida usando `/rpc/df_usuario_tem_perfil_empresa` como `anon`.
- Não misturar este hardening com refatoração de RLS, Auth, frontend, Edge Functions ou services.
