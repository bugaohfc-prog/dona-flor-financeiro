# Diagnóstico anon da função `df_funcionarios_pode_escrever`

Data do diagnóstico: 2026-07-01

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Diagnóstico específico para avaliar se o `EXECUTE` de `anon` pode ser removido da função:

```sql
public.df_funcionarios_pode_escrever(p_empresa_id uuid)
```

Este ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres e busca textual no código versionado.

Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de RLS, policy, Auth, Edge Function, frontend, service, script, migration ou dados.

## Resumo executivo

A função `df_funcionarios_pode_escrever` segue intacta, com hash `72b0de412fdc4e2c3dd14c8d0b48a787`, `search_path=public`, `SECURITY DEFINER` e retorno `boolean`.

O estado atual de grants confirma:

- `PUBLIC` já está sem `EXECUTE` efetivo;
- `anon` ainda tem `EXECUTE` efetivo direto;
- `authenticated` tem `EXECUTE` efetivo e deve ser mantido;
- `postgres` e `service_role` preservam `EXECUTE`.

Foram analisadas 21 policies que citam `df_funcionarios_pode_escrever`, todas para role `{authenticated}`, em 7 tabelas de Gestão de Pessoas/Folha. Não há policy-alvo para `anon` nem dependência da função para role `anon`.

Nas 7 tabelas afetadas, `anon` não tem privilégio real de `SELECT`, `INSERT`, `UPDATE` ou `DELETE`. `authenticated` tem `SELECT`, `INSERT` e `UPDATE`, sem `DELETE`, e depende das policies.

Não foi encontrada chamada direta em `src` ou `supabase/functions`. O uso direto no código versionado está restrito ao script `scripts/validar-rls-df-funcionarios.mjs`, que usa anon/publishable key, bloqueia service_role e autentica usuário antes de chamar a RPC.

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
| Assinatura | `df_funcionarios_pode_escrever(uuid)` |
| Argumentos | `p_empresa_id uuid` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Volatilidade | `STABLE` |
| SECURITY DEFINER | sim |
| Owner | `postgres` |
| Search path | `public` |
| Hash | `72b0de412fdc4e2c3dd14c8d0b48a787` |

## Análise por policy/role

Foram encontradas 21 policies que citam `df_funcionarios_pode_escrever`.

| Tabela | Policies | Comandos | Roles |
| --- | ---: | --- | --- |
| `df_folha_competencias` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_folha_lancamento_itens` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_folha_lancamentos` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_funcionarios` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_funcionarios_exames_periodicos` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_funcionarios_ferias_ciclos` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |
| `df_funcionarios_ferias_periodos` | 3 | `SELECT`, `INSERT`, `UPDATE` | `{authenticated}` |

Leitura:

- todas as policies que citam a função são `{authenticated}`;
- nenhuma dessas 21 policies é para `anon`;
- nenhuma dessas 21 policies é para `PUBLIC`;
- o uso real identificado é para usuários autenticados em fluxos de Gestão de Pessoas/Folha;
- `authenticated` deve ser mantido.

## Análise por tabela

### `public.df_folha_competencias`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS, porque `anon` não tem policy nem privilégio real na tabela. `authenticated` deve ser mantido para preservar os fluxos de folha.

### `public.df_folha_lancamento_itens`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em leitura/escrita de itens de folha.

### `public.df_folha_lancamentos`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em lançamentos de folha.

### `public.df_funcionarios`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em leitura/escrita de funcionários.

### `public.df_funcionarios_exames_periodicos`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em exames periódicos. Manter atenção LGPD: este ciclo não envolve dados médicos, laudos, resultados ou anexos.

### `public.df_funcionarios_ferias_ciclos`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em ciclos de férias.

### `public.df_funcionarios_ferias_periodos`

Policies com a função: 3.

Roles das policies com a função: `{authenticated}`.

Privilégios confirmados:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `anon` | não | não | não | não |
| `authenticated` | sim | sim | sim | não |

Impacto provável de remover `anon` da função: baixo para RLS. A função é necessária para `authenticated` em períodos de férias.

## Chamadas diretas no código versionado

Busca executada em:

- `src`
- `supabase/functions`
- `scripts`

Padrão buscado:

```bash
rg -n "df_funcionarios_pode_escrever" src supabase/functions scripts
```

Resultado:

- `src`: nenhuma chamada direta encontrada;
- `supabase/functions`: nenhuma chamada direta encontrada;
- `scripts`: chamada direta encontrada em `scripts/validar-rls-df-funcionarios.mjs`.

## Impacto no script `scripts/validar-rls-df-funcionarios.mjs`

O script usa anon/publishable key para criar o client, bloqueia explicitamente `service_role` e autentica um usuário antes da chamada RPC.

Evidências:

- bloqueia service_role com mensagem `SUPABASE_SERVICE_ROLE_KEY/service_role detectada. RLS seria bypassada.`;
- usa variáveis `VITE_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY`;
- chama `client.auth.signInWithPassword`;
- somente depois chama:

```js
client.rpc('df_funcionarios_pode_escrever', { p_empresa_id: masterEmpresaId })
```

Leitura: remover `EXECUTE` de `anon` não deve quebrar o uso esperado do script, porque a chamada relevante ocorre com usuário autenticado. `authenticated` deve permanecer com `EXECUTE`.

## Impacto provável de revogar `anon`

Impacto esperado:

- remove a possibilidade de chamada RPC direta anônima;
- deve retirar a função de `anon_security_definer_function_executable`, se o Advisor estiver alinhado com os grants atuais;
- não deve afetar as 21 policies analisadas, pois todas são `{authenticated}`;
- não deve afetar `PUBLIC`, que já está sem `EXECUTE` efetivo;
- não deve afetar `authenticated`, que deve permanecer com `EXECUTE`;
- não deve afetar o script de validação no fluxo normal autenticado.

Risco residual:

- pode haver uso externo não versionado chamando `/rpc/df_funcionarios_pode_escrever` com chave anon;
- sem homologação, qualquer restrição real deve ocorrer em ciclo curto, com diagnóstico antes/depois, Advisor depois e rollback imediato.

## Motivo para manter `authenticated`

`authenticated` deve ser mantido porque a função participa de 21 policies em tabelas sensíveis de Gestão de Pessoas/Folha:

- `df_folha_competencias`;
- `df_folha_lancamento_itens`;
- `df_folha_lancamentos`;
- `df_funcionarios`;
- `df_funcionarios_exames_periodicos`;
- `df_funcionarios_ferias_ciclos`;
- `df_funcionarios_ferias_periodos`.

Remover `authenticated` pode quebrar `SELECT`, `INSERT` e `UPDATE` autorizados nessas tabelas.

## Motivo para manter `PUBLIC` sem EXECUTE

`PUBLIC` já está sem `EXECUTE` efetivo. Esse estado deve ser preservado porque a função expõe uma decisão de permissão de escrita por empresa em área sensível.

## Conclusão

Conclusão: **seguro preparar ciclo futuro para remover `EXECUTE` de `anon`**, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

Não executar neste ciclo. O próximo ciclo deve ser curto, com:

- diagnóstico antes;
- `REVOKE` apenas de `anon`;
- diagnóstico depois;
- confirmação de que as 21 policies continuam `{authenticated}`;
- validação de que o script segue usando usuário autenticado para a RPC;
- consulta ao Security Advisor, se possível;
- rollback imediato pronto.

## SQL futuro proposto

Somente em ciclo futuro autorizado:

```sql
-- revoke execute on function public.df_funcionarios_pode_escrever(uuid) from anon;
```

Não executar:

```sql
-- revoke execute on function public.df_funcionarios_pode_escrever(uuid) from authenticated;
```

`PUBLIC` já está sem `EXECUTE` efetivo. Preservar esse estado.

## Rollback futuro proposto

Se a remoção futura de `anon` quebrar fluxo operacional:

```sql
-- grant execute on function public.df_funcionarios_pode_escrever(uuid) to anon;
```

Se `authenticated` for alterado por engano:

```sql
-- grant execute on function public.df_funcionarios_pode_escrever(uuid) to authenticated;
```

## Pendências manuais

- Confirmar se existe integração externa não versionada chamando `/rpc/df_funcionarios_pode_escrever` com chave anon.
- Em ciclo futuro de execução, consultar o Supabase Advisor antes/depois.
- Não revisar RLS/policies ou grants de tabela neste ciclo; isso é uma frente separada.
