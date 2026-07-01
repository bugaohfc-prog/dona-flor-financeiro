# Auditoria da função `df_funcionarios_pode_escrever`

Data da auditoria: 2026-07-01

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Auditoria exclusiva da função:

```sql
public.df_funcionarios_pode_escrever(p_empresa_id uuid)
```

Este ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS, policy, Auth, Edge Function, frontend, service, migration ou dados.

## Resumo executivo

`df_funcionarios_pode_escrever` é um helper `SECURITY DEFINER` usado para verificar se o usuário autenticado pode escrever em dados de Gestão de Pessoas/Folha de uma empresa.

A função retorna `boolean`, lê `public.df_usuarios_empresas`, `public.df_usuarios_master` e `auth.users`, usa `auth.uid()` e e-mail do JWT, e valida perfis administrativos (`admin`, `master`, `owner`, `superadmin`, `super_admin`).

Ela está com `EXECUTE` efetivo para `anon` e `authenticated`. `PUBLIC` já está sem `EXECUTE` efetivo. Foram encontradas 21 policies que citam a função, todas para role `{authenticated}`, em 7 tabelas de Gestão de Pessoas/Folha.

Não há chamada direta no frontend ou em Edge Functions. Há uso direto apenas no script operacional/diagnóstico `scripts/validar-rls-df-funcionarios.mjs`.

Classificação: **crítico**.

Recomendação: criar diagnóstico específico para avaliar remoção de `anon`, manter `PUBLIC` sem `EXECUTE`, manter `authenticated`, e não alterar RLS/policies neste ciclo.

## Assinatura e catálogo

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `df_funcionarios_pode_escrever` |
| Assinatura | `public.df_funcionarios_pode_escrever(uuid)` |
| Argumentos | `p_empresa_id uuid` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Volatilidade | `STABLE` |
| SECURITY DEFINER | sim |
| Owner | `postgres` |
| Search path | `public` |
| Hash da definição | `72b0de412fdc4e2c3dd14c8d0b48a787` |

## Definição funcional

A função retorna `true` quando:

- existe vínculo em `public.df_usuarios_empresas` para `p_empresa_id`;
- o perfil do vínculo está entre `admin`, `master`, `owner`, `superadmin` ou `super_admin`;
- o vínculo corresponde ao usuário autenticado por `auth.uid()` ou por e-mail do JWT;
- ou existe registro em `public.df_usuarios_master` para o usuário autenticado, também validando `auth.uid()` ou e-mail associado em `auth.users`.

Ela não executa `INSERT`, `UPDATE` ou `DELETE`.

## Definição SQL

```sql
CREATE OR REPLACE FUNCTION public.df_funcionarios_pode_escrever(p_empresa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.df_usuarios_empresas ue
    where ue.empresa_id = p_empresa_id
      and lower(ue.perfil) in ('admin', 'master', 'owner', 'superadmin', 'super_admin')
      and (
        ue.user_id = auth.uid()
        or lower(ue.email) = lower(auth.jwt() ->> 'email')
      )
  )
  or exists (
    select 1
    from public.df_usuarios_master um
    left join auth.users au on au.id = um.user_id
    where
      um.user_id = auth.uid()
      or lower(au.email) = lower(auth.jwt() ->> 'email')
  );
$function$
```

## Grants atuais

| Role | EXECUTE direto | EXECUTE efetivo | Leitura |
| --- | --- | --- | --- |
| `PUBLIC` | não | não | já está sem exposição efetiva por `PUBLIC` |
| `anon` | sim | sim | exposição direta ainda ativa |
| `authenticated` | sim | sim | manter por dependência de policies/RLS |
| `postgres` | sim | sim | preservar |
| `service_role` | sim | sim | preservar |

## Tabelas lidas ou afetadas

| Tabela | Tipo de uso | Observação |
| --- | --- | --- |
| `public.df_usuarios_empresas` | leitura | verifica vínculo, empresa e perfil administrativo |
| `public.df_usuarios_master` | leitura | verifica usuário Master |
| `auth.users` | leitura | cruza e-mail do usuário Master |

A função não altera dados.

## Dados retornados

A função retorna somente `boolean`. Mesmo assim, o retorno revela se o usuário atual pode escrever em dados de funcionários/folha para a empresa informada.

## Dependências encontradas

### Triggers

Nenhum trigger encontrado usando a função.

### Views

Nenhuma view encontrada dependendo da função.

### Outras funções

Nenhuma chamada textual encontrada em outras funções `public` comuns.

### RLS/policies

Foram encontradas 21 policies que citam `df_funcionarios_pode_escrever`, todas para role `{authenticated}`.

| Tabela | Policies | Comandos |
| --- | ---: | --- |
| `df_folha_competencias` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_folha_lancamento_itens` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_folha_lancamentos` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_funcionarios` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_funcionarios_exames_periodicos` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_funcionarios_ferias_ciclos` | 3 | `SELECT`, `INSERT`, `UPDATE` |
| `df_funcionarios_ferias_periodos` | 3 | `SELECT`, `INSERT`, `UPDATE` |

Leitura: o uso identificado em RLS é amplo e operacionalmente sensível. `authenticated` não deve ser revogado sem plano próprio de RLS e validação dos fluxos de Gestão de Pessoas/Folha.

## Evidência de uso no código

Busca executada em:

- `src`
- `supabase/functions`
- `scripts`

Resultado:

- `src`: sem chamada direta da RPC;
- `supabase/functions`: sem chamada direta da RPC;
- `scripts`: uso direto em `scripts/validar-rls-df-funcionarios.mjs`.

O script chama:

```js
client.rpc('df_funcionarios_pode_escrever', { p_empresa_id: masterEmpresaId })
```

Leitura: trata-se de script de validação/diagnóstico de RLS, não de fluxo operacional de frontend.

## Evidência de uso das tabelas no app

As tabelas protegidas por policies que usam a função aparecem no app em:

- `src/services/funcionariosService.js`;
- `src/services/folhaService.js`;
- `src/services/funcionariosFeriasService.js`;
- `src/services/funcionariosExamesPeriodicosService.js`;
- `src/hooks/useResumoGestaoPessoasPainel.js`.

Leitura: o app depende das tabelas e das policies, ainda que não chame a função diretamente.

## Riscos práticos

| Cenário | Risco |
| --- | --- |
| `anon` com `EXECUTE` | permite chamada RPC não autenticada para tentar inferir permissão de escrita por empresa |
| `PUBLIC` com `EXECUTE` | não está ativo hoje; se regressar, reabriria exposição ampla |
| `authenticated` com `EXECUTE` | necessário para 21 policies, mas permite consulta direta por usuários autenticados se a RPC for chamada |
| Revogar `anon` | tende a baixo impacto em RLS, pois as 21 policies são `{authenticated}` |
| Revogar `PUBLIC` | não deve alterar o estado atual, pois `PUBLIC` já está sem `EXECUTE` efetivo |
| Revogar `authenticated` | risco crítico de quebrar leitura/escrita em funcionários, folha, férias e exames periódicos |

## Classificação

**Crítico**.

Justificativa:

- função `SECURITY DEFINER`;
- decide permissão de escrita em Gestão de Pessoas/Folha;
- usa dados de vínculo, perfil, empresa e Master;
- está executável por `anon`;
- aparece em 21 policies de RLS;
- impacta tabelas com dados sensíveis e potencialmente sujeitos a LGPD;
- revogar `authenticated` pode quebrar fluxos operacionais.

## Recomendação segura

- Manter temporariamente a função sem alteração de definição.
- Criar diagnóstico específico para confirmar remoção segura de `anon`.
- Manter `PUBLIC` sem `EXECUTE`.
- Manter `authenticated`.
- Não restringir `authenticated` enquanto a função for usada por policies/RLS.
- Não alterar RLS/policies neste ciclo.
- Não misturar esta frente com triggers internas, search_path, frontend ou services.

## SQL futuro proposto

Somente após diagnóstico específico e ciclo autorizado:

```sql
-- revoke execute on function public.df_funcionarios_pode_escrever(uuid) from anon;
```

`PUBLIC` já está sem `EXECUTE` efetivo. Em ciclo futuro, pode ser apenas conferido:

```sql
-- revoke execute on function public.df_funcionarios_pode_escrever(uuid) from public;
```

Não executar neste momento:

```sql
-- revoke execute on function public.df_funcionarios_pode_escrever(uuid) from authenticated;
```

## Rollback futuro proposto

Se uma futura remoção de `anon` quebrar fluxo operacional:

```sql
-- grant execute on function public.df_funcionarios_pode_escrever(uuid) to anon;
```

Se houver alteração futura indevida em `PUBLIC`:

```sql
-- grant execute on function public.df_funcionarios_pode_escrever(uuid) to public;
```

Se `authenticated` for alterado por engano:

```sql
-- grant execute on function public.df_funcionarios_pode_escrever(uuid) to authenticated;
```

## Próximos passos

1. Criar diagnóstico específico para remoção de `anon`.
2. Confirmar novamente que as 21 policies seguem `{authenticated}`.
3. Confirmar que o uso direto permanece restrito ao script de validação.
4. Confirmar que `PUBLIC` continua sem `EXECUTE` efetivo.
5. Se o diagnóstico for favorável, preparar ciclo curto para remover apenas `anon`, mantendo `authenticated`.
