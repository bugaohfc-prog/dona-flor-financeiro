# Auditoria da função `df_usuario_tem_perfil_empresa`

Data da auditoria: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])`, por ser `SECURITY DEFINER` sensível ligada à verificação de perfil/permissão por empresa.

O ciclo foi somente leitura/documentação. Foram executadas apenas consultas `SELECT` em catálogos/metadados do Postgres e busca textual no código versionado. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, Edge Function, frontend, service ou hook.

## Resumo executivo

`public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])` é uma função `sql`, `STABLE`, `SECURITY DEFINER`, com retorno `boolean`, owner `postgres` e `search_path=public`.

A função lê `public.df_usuarios_empresas` e retorna `true` quando o usuário autenticado possui vínculo na empresa informada com perfil contido em `p_perfis`. A identificação do usuário usa `auth.uid()` e também compara `ue.email` com o e-mail presente em `auth.jwt()`.

Achados principais:

- `PUBLIC` já está sem `EXECUTE` efetivo;
- `anon` ainda tem `EXECUTE` efetivo por grant direto;
- `authenticated`, `postgres` e `service_role` têm `EXECUTE` efetivo;
- a função é citada por 14 policies em 5 tabelas, todas para role `{authenticated}`;
- não foram encontradas dependências por trigger, view ou chamada textual em outra função `public`;
- não foi encontrada chamada direta em `src`, `supabase/functions` ou `scripts`;
- há uso histórico em migrations e documentação de RLS.

Classificação desta auditoria: **crítico**.

Motivo: a função participa de autorização por perfil/empresa em policies de produção de financeiro, notas, destinatários de alertas e Gestão de Pessoas. `authenticated` não deve ser revogado enquanto houver dependência de RLS. `anon` é candidato forte a remoção em ciclo futuro curto, pois nenhuma policy dependente usa role `anon`. `PUBLIC` já deve permanecer sem `EXECUTE`.

## Assinatura

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `df_usuario_tem_perfil_empresa` |
| Assinatura | `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])` |
| Argumentos | `p_empresa_id uuid, p_perfis text[]` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Volatility | `STABLE` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| `search_path` | `public` |
| Hash da definição | `99044d6cf258c6b12172ac972d96c78e` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    auth.uid() is not null
    and p_empresa_id is not null
    and exists (
      select 1
      from public.df_usuarios_empresas ue
      where ue.empresa_id = p_empresa_id
        and lower(coalesce(ue.perfil, '')) = any (p_perfis)
        and (
          ue.user_id = auth.uid()
          or lower(coalesce(ue.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    );
$function$
```

## Definição funcional

Em linguagem simples, a função verifica se o usuário logado tem algum dos perfis informados em uma empresa específica.

Ela usa:

- `auth.uid()` para identificar o usuário autenticado;
- `auth.jwt() ->> 'email'` para comparar o e-mail do JWT com `df_usuarios_empresas.email`;
- parâmetro `p_empresa_id` para limitar a empresa;
- parâmetro `p_perfis` para listar perfis aceitos;
- tabela `public.df_usuarios_empresas`;
- colunas `empresa_id`, `perfil`, `user_id` e `email`.

Ela não altera dados.

## Grants atuais

ACL catalogada:

```text
{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Role | EXECUTE efetivo | Observação |
| --- | --- | --- |
| `PUBLIC` | não | sem exposição herdada por `PUBLIC` |
| `anon` | sim | grant direto ainda existente |
| `authenticated` | sim | necessário para policies/RLS atuais |
| `postgres` | sim | preservado |
| `service_role` | sim | preservado |

Grants diretos encontrados:

| Grantee | Privilégio |
| --- | --- |
| `anon` | `EXECUTE` |
| `authenticated` | `EXECUTE` |
| `postgres` | `EXECUTE` |
| `service_role` | `EXECUTE` |

Leitura de risco: a exposição por `PUBLIC` já está mitigada, mas `anon` ainda consegue executar a RPC diretamente. `authenticated` deve ser mantido porque a função é usada por 14 policies `{authenticated}`.

Diagnóstico específico de `anon` criado em ciclo posterior:

- `docs/supabase/funcoes/df_usuario_tem_perfil_empresa-diagnostico-anon.md`

Esse diagnóstico confirmou que as 14 policies com `df_usuario_tem_perfil_empresa` são para `{authenticated}`, nenhuma das 5 tabelas afetadas tem privilégio real para `anon`, não há chamada direta em `src`, `supabase/functions` ou `scripts`, e a conclusão documental é favorável a preparar ciclo futuro para remover `EXECUTE` de `anon`, mantendo `authenticated` e `PUBLIC` sem `EXECUTE`.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies/RLS | 14 policies em 5 tabelas |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual em outra função normal encontrada |

Resumo das policies:

| Métrica | Resultado |
| --- | ---: |
| Policies com `df_usuario_tem_perfil_empresa` | 14 |
| Tabelas afetadas | 5 |
| Policies para `{authenticated}` | 14 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das policies | `d05469c16cc7e57ee06591a78cd65c3c` |

Tabelas com policies que citam a função:

- `public.df_contas`
- `public.df_contas_pagamentos`
- `public.df_destinatarios_alertas`
- `public.df_funcionarios`
- `public.df_notas`

Policies encontradas:

| Tabela | Policies |
| --- | --- |
| `df_contas` | `df_contas_delete_admin_master`, `df_contas_insert_empresa_operacional`, `df_contas_select_empresa`, `df_contas_update_empresa_operacional` |
| `df_contas_pagamentos` | `df_contas_pagamentos_insert_empresa_operacional`, `df_contas_pagamentos_select_empresa`, `df_contas_pagamentos_update_empresa_operacional` |
| `df_destinatarios_alertas` | `df_destinatarios_alertas_insert_admin_master`, `df_destinatarios_alertas_update_admin_master` |
| `df_funcionarios` | `df_funcionarios_select_rh_inicial` |
| `df_notas` | `df_notas_delete_admin_master`, `df_notas_insert_empresa_operacional`, `df_notas_select_empresa`, `df_notas_update_empresa_operacional` |

## Evidência de uso no código

Busca textual em `src`, `supabase/functions` e `scripts`:

- nenhuma chamada direta encontrada;
- nenhuma chamada RPC direta encontrada;
- nenhuma Edge Function versionada chama diretamente `df_usuario_tem_perfil_empresa`.

Busca ampliada em `docs` e `supabase/migrations`:

- há uso histórico em migrations de RLS;
- há referências documentais no inventário SECURITY DEFINER e diagnósticos anteriores.

Leitura: o uso ativo identificado está nas policies/RLS do banco, não no app chamando RPC diretamente.

## Tabelas lidas/afetadas

| Tabela | Uso pela função |
| --- | --- |
| `public.df_usuarios_empresas` | lê vínculo por `empresa_id`, `perfil`, `user_id = auth.uid()` ou e-mail do JWT |

Tabelas afetadas indiretamente por policies que chamam a função:

| Tabela | Módulo provável | Risco se `authenticated` for revogado |
| --- | --- | --- |
| `df_contas` | Financeiro/Contas | alto |
| `df_contas_pagamentos` | Financeiro/Baixas | alto |
| `df_destinatarios_alertas` | Configurações/Alertas | médio/alto |
| `df_funcionarios` | Gestão de Pessoas | alto |
| `df_notas` | Notas/Pendências | médio/alto |

Dados retornados:

- `boolean`: `true` se o usuário autenticado tiver um dos perfis informados na empresa; `false` caso contrário.

Dados não retornados:

- `empresa_id`;
- perfil textual;
- lista de permissões;
- e-mail;
- senha;
- dados de Auth além de `auth.uid()` e e-mail lido do JWT.

## Riscos práticos

### Risco se `anon` puder executar

**Alto.** A função é `SECURITY DEFINER` e expõe via RPC uma verificação de perfil por empresa. Mesmo com `auth.uid() is not null`, manter `anon` com `EXECUTE` direto é desnecessário e preserva superfície pública sobre um helper de autorização.

### Risco se `PUBLIC` mantiver EXECUTE

**Baixo no estado atual, porque `PUBLIC` já está sem `EXECUTE` efetivo.** O risco passa a ser de regressão: `PUBLIC` deve permanecer sem grant para evitar herança futura por `anon`.

### Risco se `authenticated` puder executar

**Alto, mas necessário no desenho atual.** A função retorna status de perfil por empresa para o usuário autenticado e é usada por 14 policies de RLS. Revogar `authenticated` pode quebrar permissões reais de financeiro, notas, destinatários de alertas e Gestão de Pessoas.

### Risco de exposição de perfil/permissão

**Alto.** Mesmo retornando apenas booleano, a função permite inferir se o usuário autenticado possui algum perfil em uma empresa específica.

### Risco de impacto em RLS/policies

**Crítico para `authenticated`.** As 14 policies dependentes são todas `{authenticated}`. Qualquer remoção de `authenticated` deve ser tratada como refatoração de RLS, não como hardening simples de grant.

## Classificação

Classificação final: **crítico**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- `anon` ainda tem `EXECUTE` efetivo por grant direto;
- `authenticated` é usado por 14 policies;
- calcula perfil/permissão por empresa;
- usa `auth.uid()` e e-mail do JWT;
- impacto potencial em financeiro, notas, destinatários de alertas e Gestão de Pessoas.

## Recomendação segura

Recomendação desta auditoria:

- **manter temporariamente** até diagnóstico específico de `anon`;
- **restringir `anon`** em ciclo futuro curto, se o diagnóstico confirmar que não há uso externo necessário;
- **manter `PUBLIC` sem `EXECUTE`**;
- **manter `authenticated`**;
- **não restringir `authenticated` enquanto usado por RLS/policies**;
- **precisa plano próprio** antes de qualquer alteração adicional.

Não executar `REVOKE` neste ciclo.

## SQL futuro proposto, comentado

Diagnóstico antes de qualquer restrição futura:

```sql
-- select
--   has_function_privilege('public', 'public.df_usuario_tem_perfil_empresa(uuid,text[])', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_usuario_tem_perfil_empresa(uuid,text[])', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_usuario_tem_perfil_empresa(uuid,text[])', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.df_usuario_tem_perfil_empresa(uuid,text[])', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.df_usuario_tem_perfil_empresa(uuid,text[])', 'EXECUTE') as service_role_has_execute;
```

Fase futura candidata, somente após ciclo autorizado:

```sql
-- revoke execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from anon;
```

Manter como verificação de não regressão:

```sql
-- revoke execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from public;
```

Não planejar neste momento:

```sql
-- revoke execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) from authenticated;
```

## Rollback futuro proposto, comentado

Se `anon` for removido em ciclo futuro e houver quebra operacional:

```sql
-- grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to anon;
```

Se algum ciclo futuro mexer indevidamente em `authenticated`, rollback separado:

```sql
-- grant execute on function public.df_usuario_tem_perfil_empresa(uuid, text[]) to authenticated;
```

## Próximos passos

1. Revisar `docs/supabase/funcoes/df_usuario_tem_perfil_empresa-diagnostico-anon.md`.
2. Confirmar novamente que as 14 policies seguem todas `{authenticated}` antes de qualquer execução.
3. Manter `PUBLIC` sem `EXECUTE`.
4. Manter `authenticated` preservado enquanto houver uso por RLS/policies.
5. Não misturar esse hardening de grant com refatoração de RLS, Auth, frontend ou services.

## O que não mexer agora

- Não revogar `anon` neste ciclo.
- Não revogar `authenticated`.
- Não conceder `PUBLIC`.
- Não alterar a função.
- Não alterar Auth, senha, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
