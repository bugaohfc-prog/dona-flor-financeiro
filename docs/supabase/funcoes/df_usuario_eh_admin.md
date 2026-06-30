# Auditoria da função `df_usuario_eh_admin`

Data da auditoria: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.df_usuario_eh_admin(p_empresa_id uuid)`, por ser `SECURITY DEFINER` sensível ligada à verificação de permissão Admin por empresa.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service, hook ou Edge Function.

## Resumo executivo

`public.df_usuario_eh_admin(p_empresa_id uuid)` é uma função `sql`, `SECURITY DEFINER`, com retorno `boolean`, owner `postgres` e `search_path=public`.

A função lê `public.df_usuarios_empresas` e retorna `true` quando o usuário autenticado (`auth.uid()`) possui vínculo na empresa informada com `perfil = 'admin'`.

Achados principais:

- `PUBLIC`, `anon` e `authenticated` têm `EXECUTE` efetivo;
- `postgres` e `service_role` também têm `EXECUTE`;
- a função é chamada diretamente pela Edge Function `supabase/functions/convidar-usuario/index.ts`;
- a função é citada por 24 policies em 8 tabelas, todas para role `{authenticated}`;
- não foram encontradas dependências por trigger, view ou chamada textual em outra função `public`;
- não há chamada direta em `src`.

Classificação desta auditoria: **crítico**.

Motivo: a função participa de autorização Admin em policies de produção e em fluxo de convite de usuário. `authenticated` não deve ser revogado enquanto houver dependência de RLS/app. `anon` e `PUBLIC` são candidatos a diagnóstico específico, mas não devem ser alterados sem matriz própria e ciclo curto autorizado.

## Assinatura

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `df_usuario_eh_admin` |
| Assinatura | `public.df_usuario_eh_admin(p_empresa_id uuid)` |
| Argumentos | `p_empresa_id uuid` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| `search_path` | `public` |
| Hash da definição | `cf45999529ac743d9db7696a3e4ad53c` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.df_usuario_eh_admin(p_empresa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.df_usuarios_empresas due
    where due.empresa_id = p_empresa_id
      and due.user_id = auth.uid()
      and due.perfil = 'admin'
  );
$function$
```

## Definição funcional

Em linguagem simples, a função verifica se o usuário logado é Admin da empresa informada.

Ela usa:

- `auth.uid()` para identificar o usuário autenticado;
- parâmetro `p_empresa_id` para limitar a empresa;
- tabela `public.df_usuarios_empresas`;
- coluna `perfil`, exigindo valor literal `admin`.

Ela não usa:

- `auth.email()`;
- `tipo`;
- `role`;
- `loja`;
- senha;
- dados de Auth além de `auth.uid()`.

Ela não altera dados.

## Grants atuais

ACL catalogada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Role | EXECUTE efetivo |
| --- | --- |
| `PUBLIC` | sim |
| `anon` | sim |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

Leitura de risco: `PUBLIC` mantém execução efetiva aberta; `anon` também tem grant direto. `authenticated` é necessário para policies e para a Edge Function `convidar-usuario`.

Diagnóstico específico de `anon`/`PUBLIC` criado em ciclo posterior:

- `docs/supabase/funcoes/df_usuario_eh_admin-diagnostico-anon-public.md`

Esse diagnóstico confirmou que as 24 policies com `df_usuario_eh_admin` são para `{authenticated}` e não há policy dependente da função para `anon` ou `PUBLIC`. A conclusão documental é favorável a preparar ciclo futuro para remover `EXECUTE` de `anon` e `PUBLIC`, mantendo `authenticated`.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies/RLS | 24 policies em 8 tabelas |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual em outra função normal encontrada |

Resumo das policies:

| Métrica | Resultado |
| --- | ---: |
| Policies com `df_usuario_eh_admin` | 24 |
| Tabelas afetadas | 8 |
| Policies para `{authenticated}` | 24 |
| Policies para `anon` | 0 |
| Policies para `PUBLIC` | 0 |
| Hash agregado das dependências | `98860ce191664440158ecc0fd8e9de44` |

Tabelas com policies que citam a função:

- `public.df_assinaturas`
- `public.df_auditoria_admin`
- `public.df_contas`
- `public.df_contas_pagamentos`
- `public.df_destinatarios_alertas`
- `public.df_notas`
- `public.df_usuarios_empresas`
- `public.df_usuarios_filiais`

Policies encontradas:

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

## Evidência de uso no código

Chamadas diretas encontradas:

- `supabase/functions/convidar-usuario/index.ts`: chama `supabaseUser.rpc('df_usuario_eh_admin', params)`.

Detalhe do fluxo:

- a Edge Function tenta parâmetros compatíveis com nomes diferentes: `{ p_empresa_id: empresaId }`, `{ empresa_id: empresaId }`, `{ empresaId }`;
- a chamada é usada junto com `is_master` para autorizar convite/reset de usuário na empresa;
- o client `supabaseUser` usa service role key com `Authorization` do usuário chamador;
- a Edge Function exige sessão via `supabaseUser.auth.getUser()`.

Não foi encontrada chamada direta em:

- `src`;
- `scripts`.

Uso relacionado:

- migrations e documentos de RLS usam `public.df_usuario_eh_admin(empresa_id)` como helper ativo de autorização;
- o helper aparece em policies centrais de financeiro, usuários, filiais, destinatários, auditoria e notas.

## Tabelas afetadas/lidas

| Tabela | Uso pela função |
| --- | --- |
| `public.df_usuarios_empresas` | lê vínculo por `empresa_id`, `user_id = auth.uid()` e `perfil = 'admin'` |

Dados retornados:

- `boolean`: `true` se o usuário autenticado for Admin da empresa informada; `false` caso contrário.

Dados não retornados:

- `empresa_id`;
- perfil textual;
- lista de permissões;
- e-mail;
- senha;
- dados de Auth.

## Riscos práticos

### Risco se `anon` puder executar

**Alto.** Em contexto anônimo, `auth.uid()` tende a ser nulo e a função provavelmente retorna `false`. Ainda assim, expor uma função `SECURITY DEFINER` de permissão Admin para `anon` é desnecessário e aumenta superfície de ataque.

### Risco se `PUBLIC` mantiver EXECUTE

**Alto.** Enquanto `PUBLIC` tiver `EXECUTE`, roles que herdam de `PUBLIC` podem manter execução efetiva. Para remover exposição pública real, `PUBLIC` precisa ser tratado junto com `anon`.

### Risco se `authenticated` puder executar

**Alto, mas necessário no desenho atual.** A função retorna status Admin por empresa para o usuário autenticado. Ela é usada por 24 policies e pela Edge Function `convidar-usuario`.

### Risco de exposição de status Admin

**Alto.** Mesmo retornando apenas booleano, a função permite inferir se o usuário logado possui perfil Admin em uma empresa específica.

### Risco de impacto em RLS/policies

**Crítico.** Revogar `authenticated` pode quebrar SELECT/INSERT/UPDATE/DELETE em áreas financeiras, usuários, filiais, destinatários de alertas, auditoria e notas.

## Classificação

Classificação final: **crítico**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- calcula permissão Admin por empresa;
- usada por 24 policies;
- chamada pela Edge Function `convidar-usuario`;
- impacto potencial em RLS, administração, financeiro, usuários, filiais, destinatários, auditoria e notas.

## Recomendação segura

Recomendação desta auditoria:

- **manter temporariamente** até diagnóstico específico de `anon`/`PUBLIC`;
- **avaliar restrição de `anon`** somente com matriz/diagnóstico e validação;
- **avaliar restrição de `PUBLIC`** somente com matriz/diagnóstico e validação;
- **manter `authenticated`**;
- **não restringir `authenticated` enquanto usado por RLS/app**;
- **precisa plano próprio** antes de qualquer alteração.

Não executar `REVOKE` neste ciclo.

## SQL futuro proposto, comentado

Diagnóstico antes de qualquer restrição futura:

```sql
-- select
--   has_function_privilege('public', 'public.df_usuario_eh_admin(uuid)', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.df_usuario_eh_admin(uuid)', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.df_usuario_eh_admin(uuid)', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.df_usuario_eh_admin(uuid)', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.df_usuario_eh_admin(uuid)', 'EXECUTE') as service_role_has_execute;
```

Fase futura candidata, somente após ciclo autorizado:

```sql
-- revoke execute on function public.df_usuario_eh_admin(uuid) from anon;
-- revoke execute on function public.df_usuario_eh_admin(uuid) from public;
```

Não planejar neste momento:

```sql
-- revoke execute on function public.df_usuario_eh_admin(uuid) from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.df_usuario_eh_admin(uuid) to public;
-- grant execute on function public.df_usuario_eh_admin(uuid) to anon;
```

Se `authenticated` for tratado em algum ciclo posterior:

```sql
-- grant execute on function public.df_usuario_eh_admin(uuid) to authenticated;
```

## Próximos passos

1. Criar diagnóstico específico de `anon`/`PUBLIC` para confirmar se a remoção é segura, como foi feito para `is_master`.
2. Revisar `docs/supabase/funcoes/df_usuario_eh_admin-diagnostico-anon-public.md`.
3. Manter `authenticated` preservado.
4. Validar impacto na Edge Function `convidar-usuario` no ciclo de restrição.
5. Só depois avaliar remoção de `anon` e `PUBLIC` em ciclo curto futuro com rollback imediato.
6. Não planejar revogar `authenticated` enquanto a função for usada por RLS/policies/app.

## O que não mexer agora

- Não revogar `anon`, `PUBLIC` ou `authenticated` neste ciclo.
- Não alterar a função.
- Não alterar Auth, senha, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
