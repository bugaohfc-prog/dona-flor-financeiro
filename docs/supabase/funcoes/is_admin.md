# Auditoria da função `is_admin`

Data da auditoria: 2026-06-29

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Este documento audita exclusivamente a função `public.is_admin()`, apontada como ponto crítico `SECURITY DEFINER` por estar ligada à verificação de permissão administrativa.

O ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, `DROP FUNCTION`, alteração de Auth, senha, RLS, policy, view, índice, migration, dados, frontend, service ou hook.

## Resumo executivo

`public.is_admin()` é uma função `sql`, `SECURITY DEFINER`, sem argumentos, com retorno `boolean`, owner `postgres` e `search_path=public`.

A função lê `public.df_usuarios_empresas` e retorna `true` quando existe vínculo do usuário autenticado com `perfil = 'admin'`.

Não foram encontradas dependências por trigger, policy, view ou outra função. Também não foi encontrada chamada direta pelo app atual em `src`, `supabase/functions` ou `scripts`.

O código versionado usa outros caminhos para permissão administrativa:

- `supabase/functions/convidar-usuario/index.ts` chama `is_master` e `df_usuario_eh_admin`;
- `src/services/permissoesService.js` normaliza perfis carregados do vínculo do usuário;
- `src/services/tenantService.js` lê `df_usuarios_empresas` diretamente para resolver tenant/perfil.

Classificação desta auditoria: **alto**.

Motivo: a função é `SECURITY DEFINER`, calcula status administrativo por contexto de Auth, está executável por `PUBLIC`, `anon` e `authenticated`, e parece legado/incerto no código atual. `anon` e `PUBLIC` são candidatos fortes a restrição em ciclo futuro. `authenticated` deve ser tratado apenas após plano próprio e checagem de uso legado externo.

## Assinatura

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Função | `is_admin` |
| Assinatura | `public.is_admin()` |
| Argumentos | nenhum |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | `public` |
| Hash da definição | `c3007d22aaf6abfbf756dba7debffdb6` |

Definição catalogada:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.df_usuarios_empresas
    where user_id = auth.uid()
      and perfil = 'admin'
  );
$function$
```

## Definição funcional

Em linguagem simples, a função verifica se o usuário autenticado possui algum vínculo em `df_usuarios_empresas` com perfil `admin`.

Ela usa:

- `auth.uid()` para obter o ID do usuário autenticado.
- `public.df_usuarios_empresas.user_id` para localizar vínculo.
- `public.df_usuarios_empresas.perfil` para verificar perfil administrativo.

Ela não usa:

- `auth.email()`.

Ela não altera dados.

## Grants atuais

ACL catalogada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Role | EXECUTE direto/efetivo |
| --- | --- |
| `PUBLIC` | sim |
| `anon` | sim |
| `authenticated` | sim |
| `postgres` | sim |
| `service_role` | sim |

Leitura de risco: `PUBLIC` mantém execução efetiva aberta; `anon` também tem grant direto; `authenticated` pode executar a função mesmo sem evidência de uso atual no app.

## Dependências encontradas

| Tipo | Resultado |
| --- | --- |
| Triggers | nenhuma dependência encontrada |
| Policies/RLS | nenhuma policy citando textualmente a função |
| Views | nenhuma view dependente encontrada |
| Outras funções | nenhuma chamada textual encontrada |

## Evidência de uso no código

Busca textual em `src`, `supabase/functions`, `scripts`, `docs` e `supabase/migrations` encontrou `is_admin` apenas em documentação histórica, diagnóstico e migration antiga.

Não foi encontrada chamada direta no app atual:

- nenhuma chamada `supabase.rpc('is_admin')`;
- nenhuma chamada literal `/rpc/is_admin`;
- nenhuma chamada em Edge Function.

Uso administrativo atual identificado:

- `supabase/functions/convidar-usuario/index.ts` verifica `is_master` e `df_usuario_eh_admin`;
- `supabase/functions/criar-usuario-manual/index.ts` valida administração por leitura de vínculo/perfil, sem RPC `is_admin`;
- `src/services/permissoesService.js` normaliza perfis a partir do estado/vínculo carregado;
- `src/services/tenantService.js` lê `df_usuarios_empresas` diretamente.

## Tabelas afetadas/lidas

| Tabela | Uso |
| --- | --- |
| `public.df_usuarios_empresas` | lê existência de vínculo por `user_id = auth.uid()` e `perfil = 'admin'` |

Dados retornados:

- `boolean`: `true` se existir vínculo admin; `false` caso contrário.

Dados não retornados:

- `empresa_id`;
- `perfil` textual;
- loja;
- permissões detalhadas;
- e-mail;
- senha;
- dados de Auth.

## Riscos práticos

### Risco se `anon` puder executar

**Alto.** Em contexto anônimo, `auth.uid()` tende a ser nulo e a função provavelmente retorna `false`. Ainda assim, expor uma função `SECURITY DEFINER` de permissão administrativa para `anon` é desnecessário e aumenta superfície de ataque.

### Risco se `PUBLIC` mantiver EXECUTE

**Alto.** Enquanto `PUBLIC` tiver `EXECUTE`, roles que herdam de `PUBLIC` podem manter execução efetiva. Para remover exposição pública real, `PUBLIC` precisa ser tratado junto com `anon`.

### Risco se `authenticated` puder executar

**Médio/alto.** A função retorna apenas booleano, mas esse booleano revela status administrativo do usuário autenticado e pode ser usado por integrações legadas para controle de acesso. Sem evidência de uso atual, o risco principal é legado externo desconhecido.

### Risco de exposição de status admin

**Alto.** Mesmo sem retornar dados de empresa ou perfil completo, a resposta `true/false` informa se o usuário possui privilégio administrativo em algum vínculo.

### Risco de impacto em RLS/policies

**Baixo no estado atual, alto se houver legado externo.** A consulta de policies não encontrou uso textual atual de `is_admin`. Porém, por ser função de permissão, qualquer policy ou integração externa antiga dependeria diretamente dela.

## Classificação

Classificação final: **alto**.

Justificativa:

- `SECURITY DEFINER` em schema `public`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- calcula status administrativo;
- usa contexto de Auth;
- sem evidência de uso direto pelo app atual;
- possível legado externo não mapeado.

## Recomendação segura

Recomendação desta auditoria:

- **manter temporariamente** até plano de restrição próprio;
- **candidata a restringir `anon`**;
- **candidata a restringir `PUBLIC`**;
- **manter `authenticated` inicialmente**, por prudência com possível legado externo;
- **não restringir `authenticated` se for identificado uso por app, RLS/policy ou integração externa**;
- **precisa plano próprio** antes de qualquer alteração.

Não executar `REVOKE` neste ciclo.

## SQL futuro proposto, comentado

Diagnóstico antes de qualquer restrição futura:

```sql
-- select
--   has_function_privilege('public', 'public.is_admin()', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') as authenticated_has_execute,
--   has_function_privilege('postgres', 'public.is_admin()', 'EXECUTE') as postgres_has_execute,
--   has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE') as service_role_has_execute;
```

Fase 1 candidata, somente após ciclo autorizado:

```sql
-- revoke execute on function public.is_admin() from anon;
-- revoke execute on function public.is_admin() from public;
```

Fase posterior, somente após confirmar ausência de uso externo:

```sql
-- revoke execute on function public.is_admin() from authenticated;
```

## Rollback futuro proposto, comentado

```sql
-- grant execute on function public.is_admin() to public;
-- grant execute on function public.is_admin() to anon;
```

Se `authenticated` for tratado em ciclo posterior:

```sql
-- grant execute on function public.is_admin() to authenticated;
```

## Próximos passos

1. Criar plano de restrição específico para `is_admin`.
2. Reconfirmar que o app atual não chama a RPC.
3. Reconfirmar que nenhuma policy/RLS depende da função.
4. Validar fluxos administrativos atuais que usam `df_usuario_eh_admin`, `is_master` e leitura direta de vínculo.
5. Em ciclo curto futuro, avaliar remover `anon` e `PUBLIC`, mantendo `authenticated`.
6. Só avaliar `authenticated` depois de monitoramento e confirmação de ausência de uso legado externo.

## O que não mexer agora

- Não revogar `anon`, `PUBLIC` ou `authenticated` neste ciclo.
- Não alterar a função.
- Não alterar Auth, senha, RLS, policy, view ou índice.
- Não alterar frontend, service, hook ou Edge Function.
- Não criar migration.
- Não alterar dados.
