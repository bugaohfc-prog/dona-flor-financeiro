# Diagnóstico anon da função `df_usuario_alvo_eh_master`

Data do diagnóstico: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Diagnóstico específico para avaliar se o `EXECUTE` de `anon` pode ser removido da função:

```sql
public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)
```

Este ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres e busca textual no código versionado.

Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de RLS, policy, Auth, Edge Function, frontend, service, migration ou dados.

## Resumo executivo

A função `df_usuario_alvo_eh_master` segue intacta, com hash `1992f08acf3d76c506b58b7a3485bbc7`, `search_path=public, pg_temp`, `SECURITY DEFINER` e retorno `boolean`.

O estado atual de grants confirma:

- `PUBLIC` já está sem `EXECUTE` efetivo;
- `anon` ainda tem `EXECUTE` efetivo direto;
- `authenticated` tem `EXECUTE` efetivo e deve ser mantido;
- `postgres` e `service_role` preservam `EXECUTE`.

Foram analisadas 6 policies que citam `df_usuario_alvo_eh_master`, todas para role `{authenticated}`, nas tabelas `df_usuarios_empresas` e `df_usuarios_filiais`. Não há policy-alvo para `anon` nem dependência da função para role `anon`.

Não foi encontrada chamada direta em `src`, `supabase/functions` ou `scripts`.

Conclusão: **favorável a remover `EXECUTE` de `anon` em ciclo futuro controlado**, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

## Grants atuais

| Role | EXECUTE efetivo | Leitura |
| --- | --- | --- |
| `PUBLIC` | não | já está sem exposição efetiva |
| `anon` | sim | grant direto ainda ativo; principal alvo de restrição futura |
| `authenticated` | sim | manter por dependência de RLS/policies |
| `postgres` | sim | preservar |
| `service_role` | sim | preservar |

Catálogo confirmado:

| Campo | Valor |
| --- | --- |
| Assinatura | `df_usuario_alvo_eh_master(uuid,text,uuid)` |
| Argumentos | `p_user_id uuid, p_email text, p_usuario_id uuid` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Volatilidade | `STABLE` |
| SECURITY DEFINER | sim |
| Owner | `postgres` |
| Search path | `public, pg_temp` |
| Hash | `1992f08acf3d76c506b58b7a3485bbc7` |

## Análise por policy/role

Foram encontradas 6 policies que citam `df_usuario_alvo_eh_master`.

| Tabela | Policy | Comando | Roles | Onde aparece |
| --- | --- | --- | --- | --- |
| `df_usuarios_empresas` | `df_usuarios_empresas_delete_admin_saneado` | `DELETE` | `{authenticated}` | `USING` |
| `df_usuarios_empresas` | `df_usuarios_empresas_insert_admin_saneado` | `INSERT` | `{authenticated}` | `WITH CHECK` |
| `df_usuarios_empresas` | `df_usuarios_empresas_update_admin_saneado` | `UPDATE` | `{authenticated}` | `USING` e `WITH CHECK` |
| `df_usuarios_filiais` | `df_usuarios_filiais_delete_admin_saneado` | `DELETE` | `{authenticated}` | `USING` |
| `df_usuarios_filiais` | `df_usuarios_filiais_insert_admin_saneado` | `INSERT` | `{authenticated}` | `WITH CHECK` |
| `df_usuarios_filiais` | `df_usuarios_filiais_update_admin_saneado` | `UPDATE` | `{authenticated}` | `USING` e `WITH CHECK` |

Leitura:

- todas as policies que citam a função são `{authenticated}`;
- nenhuma dessas 6 policies é para `anon`;
- nenhuma dessas 6 policies é para `PUBLIC`;
- o uso real identificado é proteger operações autenticadas de `INSERT`, `UPDATE` e `DELETE` envolvendo alvo Master;
- `authenticated` deve ser mantido.

## Análise por tabela

### `public.df_usuarios_empresas`

Finalidade provável: vínculos de usuários com empresas, perfil e permissão operacional por empresa.

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios de tabela confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | sim | sim | sim | sim |
| `authenticated` | sim | sim | sim | sim |

Policies gerais observadas:

- há 3 policies `{public}` de `SELECT` na tabela;
- essas policies `{public}` não citam `df_usuario_alvo_eh_master`;
- as policies que citam `df_usuario_alvo_eh_master` são somente `{authenticated}` e cobrem `INSERT`, `UPDATE` e `DELETE`.

Impacto provável de remover `anon` da função:

- baixo para RLS desta função, porque `anon` não usa `df_usuario_alvo_eh_master` em policy;
- reduz exposição direta por RPC para consulta de status Master;
- não corrige nem altera grants/policies de tabela, que devem permanecer fora deste ciclo.

Risco operacional: baixo para remoção de `anon` da função; alto se `authenticated` for removido.

### `public.df_usuarios_filiais`

Finalidade provável: vínculos de usuários com filiais/unidades.

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios de tabela confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | sim | sim | sim | sim |
| `authenticated` | sim | sim | sim | sim |

Policies gerais observadas:

- não há policy `{anon}` ou `{public}` na tabela;
- há policies `{authenticated}` para operações operacionais;
- as 3 policies que citam `df_usuario_alvo_eh_master` são `{authenticated}` e cobrem `INSERT`, `UPDATE` e `DELETE`.

Impacto provável de remover `anon` da função:

- baixo para RLS desta função, porque `anon` não tem policy-alvo usando `df_usuario_alvo_eh_master`;
- reduz exposição direta por RPC para consulta de status Master;
- não altera a capacidade de `authenticated` executar as policies de proteção.

Risco operacional: baixo para remoção de `anon` da função; alto se `authenticated` for removido.

## Chamadas diretas no código versionado

Busca executada em:

- `src`
- `supabase/functions`
- `scripts`

Padrão buscado:

```bash
rg -n "df_usuario_alvo_eh_master" src supabase/functions scripts
```

Resultado: nenhuma chamada direta encontrada.

Leitura:

- não há evidência de uso direto pelo frontend;
- não há evidência de uso direto por Edge Functions;
- não há evidência de uso direto por scripts versionados;
- `anon` não é necessário em fluxo versionado identificado;
- `authenticated` deve ser mantido por causa das policies.

## Impacto provável de revogar `anon`

Impacto esperado:

- remove a possibilidade de chamada RPC direta anônima;
- deve retirar a função de `anon_security_definer_function_executable`, se o Advisor estiver alinhado com os grants atuais;
- não deve afetar as 6 policies analisadas, pois todas são `{authenticated}`;
- não deve afetar `PUBLIC`, que já está sem `EXECUTE` efetivo;
- não deve afetar `authenticated`, que deve permanecer com `EXECUTE`.

Risco residual:

- pode haver uso externo não versionado chamando `/rpc/df_usuario_alvo_eh_master` com chave anon;
- as tabelas relacionadas ainda possuem grants de tabela para `anon`, mas isso não cria dependência desta função nas 6 policies analisadas;
- sem homologação, qualquer restrição real deve ocorrer em ciclo curto, com diagnóstico antes/depois e rollback imediato.

## Motivo para manter `authenticated`

`authenticated` deve ser mantido porque a função participa de 6 policies em tabelas sensíveis de usuários/filiais:

- `df_usuarios_empresas`;
- `df_usuarios_filiais`.

As policies usam a função para bloquear alterações indevidas envolvendo alvo Master. Remover `authenticated` pode quebrar `INSERT`, `UPDATE` e `DELETE` autorizados para Admin/Master ou alterar o comportamento de proteção de RLS.

## Motivo para manter `PUBLIC` sem EXECUTE

`PUBLIC` já está sem `EXECUTE` efetivo. Esse estado deve ser preservado porque a função identifica status Master e aceita e-mail como parâmetro. Reintroduzir `PUBLIC` reabriria exposição ampla por herança de roles.

## Conclusão

Conclusão: **seguro preparar ciclo futuro para remover `EXECUTE` de `anon`**, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

Não executar neste ciclo. O próximo ciclo deve ser curto, com:

- diagnóstico antes;
- `REVOKE` apenas de `anon`;
- diagnóstico depois;
- confirmação de que as 6 policies continuam `{authenticated}`;
- consulta ao Security Advisor, se possível;
- rollback imediato pronto.

## SQL futuro proposto

Somente em ciclo futuro autorizado:

```sql
-- revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) from anon;
```

Não executar:

```sql
-- revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) from authenticated;
```

`PUBLIC` já está sem `EXECUTE` efetivo. Preservar esse estado.

## Rollback futuro proposto

Se a remoção futura de `anon` quebrar fluxo operacional:

```sql
-- grant execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) to anon;
```

Se `authenticated` for alterado por engano:

```sql
-- grant execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) to authenticated;
```

## Pendências manuais

- Confirmar se existe integração externa não versionada chamando `/rpc/df_usuario_alvo_eh_master` com chave anon.
- Em ciclo futuro de execução, consultar o Supabase Advisor antes/depois.
- Não revisar grants de tabela ou policies gerais neste ciclo; isso é uma frente separada.
