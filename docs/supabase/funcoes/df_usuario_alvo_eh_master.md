# Auditoria da função `df_usuario_alvo_eh_master`

Data da auditoria: 2026-06-30

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Escopo

Auditoria exclusiva da função:

```sql
public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)
```

Este ciclo foi somente leitura/documentação. Não foram executados `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de RLS, policy, Auth, Edge Function, frontend, service, migration ou dados.

## Resumo executivo

`df_usuario_alvo_eh_master` é um helper `SECURITY DEFINER` usado para identificar se um usuário alvo é Master. A função retorna `boolean`, consulta `public.df_usuarios_master` e aceita como entrada `user_id`, `usuario_id` ou e-mail.

A função está com `EXECUTE` efetivo para `anon` e `authenticated`. `PUBLIC` já está sem `EXECUTE` efetivo. Foram encontradas 6 policies que citam a função, todas para role `{authenticated}`, nas tabelas `df_usuarios_empresas` e `df_usuarios_filiais`.

Não foi encontrada chamada direta em `src`, `supabase/functions` ou `scripts`. O principal risco atual é exposição para `anon`, porque a função permite consultar, por RPC, se um alvo informado corresponde a usuário Master. `authenticated` não deve ser revogado sem plano próprio, pois a função participa de policies de proteção contra alterações indevidas envolvendo usuários Master.

Classificação: **crítico**.

Recomendação: criar diagnóstico específico para remoção de `anon`, manter `PUBLIC` sem `EXECUTE`, manter `authenticated`, e não alterar RLS/policies neste ciclo.

Status em 2026-06-30: diagnóstico específico para remoção de `anon` criado em `docs/supabase/funcoes/df_usuario_alvo_eh_master-diagnostico-anon.md`. A conclusão documental é favorável a preparar ciclo futuro para remover apenas `anon`, mantendo `authenticated` e preservando `PUBLIC` sem `EXECUTE`.

## Assinatura e catálogo

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `df_usuario_alvo_eh_master` |
| Assinatura | `public.df_usuario_alvo_eh_master(uuid, text, uuid)` |
| Argumentos | `p_user_id uuid, p_email text, p_usuario_id uuid` |
| Retorno | `boolean` |
| Linguagem | `sql` |
| Volatilidade | `STABLE` |
| SECURITY DEFINER | sim |
| Owner | `postgres` |
| Search path | `public, pg_temp` |
| Hash da definição | `1992f08acf3d76c506b58b7a3485bbc7` |

## Definição funcional

A função verifica se existe registro em `public.df_usuarios_master` que corresponda a pelo menos um dos identificadores recebidos:

- `p_user_id`, quando informado;
- `p_usuario_id`, quando informado;
- `p_email`, quando informado e não vazio, comparado em minúsculas após `btrim`.

Ela retorna apenas `true` ou `false`.

## Definição SQL

```sql
CREATE OR REPLACE FUNCTION public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.df_usuarios_master m
    where (
      p_user_id is not null
      and m.user_id = p_user_id
    )
    or (
      p_usuario_id is not null
      and m.user_id = p_usuario_id
    )
    or (
      nullif(btrim(p_email), '') is not null
      and lower(coalesce(m.email, '')) = lower(btrim(p_email))
    )
  );
$function$
```

## Grants atuais

| Role | EXECUTE direto | EXECUTE efetivo | Leitura |
| --- | --- | --- | --- |
| `PUBLIC` | não | não | já está sem exposição efetiva por `PUBLIC` |
| `anon` | sim | sim | exposição direta ainda ativa |
| `authenticated` | sim | sim | manter por dependência de policies |
| `postgres` | sim | sim | preservar |
| `service_role` | sim | sim | preservar |

## Tabelas lidas ou afetadas

| Tabela | Tipo de uso | Observação |
| --- | --- | --- |
| `public.df_usuarios_master` | leitura | usada para verificar se o alvo é Master |

A função não executa `INSERT`, `UPDATE` ou `DELETE`.

## Dados retornados

A função retorna somente `boolean`. Mesmo assim, o retorno pode revelar se determinado `user_id`, `usuario_id` ou e-mail corresponde a um usuário Master.

## Dependências encontradas

### Triggers

Nenhum trigger encontrado usando a função.

### Views

Nenhuma view encontrada dependendo da função.

### Outras funções

Nenhuma chamada textual encontrada em outras funções no diagnóstico executado.

### RLS/policies

Foram encontradas 6 policies que citam `df_usuario_alvo_eh_master`, todas para role `{authenticated}`.

| Tabela | Policy | Comando | Roles | Uso provável |
| --- | --- | --- | --- | --- |
| `df_usuarios_empresas` | `df_usuarios_empresas_delete_admin_saneado` | `DELETE` | `{authenticated}` | impedir exclusão indevida envolvendo alvo Master |
| `df_usuarios_empresas` | `df_usuarios_empresas_insert_admin_saneado` | `INSERT` | `{authenticated}` | impedir criação/vínculo indevido envolvendo alvo Master |
| `df_usuarios_empresas` | `df_usuarios_empresas_update_admin_saneado` | `UPDATE` | `{authenticated}` | impedir alteração indevida envolvendo alvo Master |
| `df_usuarios_filiais` | `df_usuarios_filiais_delete_admin_saneado` | `DELETE` | `{authenticated}` | impedir exclusão indevida envolvendo alvo Master |
| `df_usuarios_filiais` | `df_usuarios_filiais_insert_admin_saneado` | `INSERT` | `{authenticated}` | impedir criação/vínculo indevido envolvendo alvo Master |
| `df_usuarios_filiais` | `df_usuarios_filiais_update_admin_saneado` | `UPDATE` | `{authenticated}` | impedir alteração indevida envolvendo alvo Master |

Leitura: o uso identificado em RLS é operacionalmente sensível. `authenticated` deve ser mantido até haver plano específico de refatoração ou validação completa das policies.

## Evidência de uso no código

Busca executada em:

- `src`
- `supabase/functions`
- `scripts`

Resultado: nenhuma chamada direta encontrada para `df_usuario_alvo_eh_master`.

Referências encontradas fora do código funcional:

- documentação de auditoria;
- SQL diagnóstico;
- migrations/histórico de RLS.

## Riscos práticos

| Cenário | Risco |
| --- | --- |
| `anon` com `EXECUTE` | permite consulta direta não autenticada para inferir se um alvo é Master por UUID ou e-mail |
| `PUBLIC` com `EXECUTE` | não está ativo hoje; se regressar, reabriria exposição ampla |
| `authenticated` com `EXECUTE` | necessário para policies, mas permite consulta direta por usuários autenticados se a RPC for chamada |
| Revogar `anon` | tende a baixo impacto em RLS, pois as 6 policies são `{authenticated}` |
| Revogar `PUBLIC` | não deve alterar o estado atual, pois `PUBLIC` já está sem `EXECUTE` efetivo |
| Revogar `authenticated` | risco crítico de quebrar policies de `df_usuarios_empresas` e `df_usuarios_filiais` |

## Classificação

**Crítico**.

Justificativa:

- função `SECURITY DEFINER`;
- verifica condição sensível de usuário Master;
- aceita e-mail como parâmetro;
- está executável por `anon`;
- é usada por policies que protegem vínculos de usuários/filiais;
- revogar `authenticated` pode quebrar RLS operacional.

## Recomendação segura

- Manter temporariamente a função sem alteração de definição.
- Criar diagnóstico específico para confirmar remoção segura de `anon`.
- Manter `PUBLIC` sem `EXECUTE`.
- Manter `authenticated`.
- Não restringir `authenticated` enquanto a função for usada por policies/RLS.
- Não alterar RLS/policies neste ciclo.
- Não misturar esta frente com `search_path`, refatoração de Auth, Edge Functions ou frontend.

## SQL futuro proposto

Somente após diagnóstico específico e ciclo autorizado:

```sql
-- revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) from anon;
```

`PUBLIC` já está sem `EXECUTE` efetivo. Em ciclo futuro, pode ser apenas conferido:

```sql
-- revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) from public;
```

Não executar neste momento:

```sql
-- revoke execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) from authenticated;
```

## Rollback futuro proposto

Se uma futura remoção de `anon` quebrar fluxo operacional:

```sql
-- grant execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) to anon;
```

Se houver alteração futura indevida em `PUBLIC`:

```sql
-- grant execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) to public;
```

Se `authenticated` for alterado por engano:

```sql
-- grant execute on function public.df_usuario_alvo_eh_master(uuid, text, uuid) to authenticated;
```

## Próximos passos

1. Preparar ciclo curto para remover apenas `anon`, se aprovado.
2. Confirmar novamente que as 6 policies seguem `{authenticated}` antes/depois.
3. Confirmar que não há chamada direta em `src`, `supabase/functions` ou `scripts`.
4. Confirmar que `PUBLIC` continua sem `EXECUTE` efetivo.
5. Manter `authenticated` por dependência de RLS/policies.
