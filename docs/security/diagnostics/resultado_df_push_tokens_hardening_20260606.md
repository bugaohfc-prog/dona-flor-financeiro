# Resultado - hardening df_push_tokens - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Migration aplicada: `20260606123000_harden_df_push_tokens_grants.sql`

## Escopo

Hardening minimo da tabela `public.df_push_tokens`, escolhida por baixo risco funcional:

- Push nao esta configurado no produto atual;
- nao foi localizado uso direto da tabela no frontend/services/hooks;
- a tabela estava vazia no ambiente remoto validado;
- a coluna `token` e potencialmente sensivel;
- havia grants amplos para `anon` e `authenticated`;
- havia policies com role `public`, incluindo `DELETE`;
- RLS estava habilitada sem `FORCE RLS`.

## Estado antes

### Estrutura

- Tabela: `public.df_push_tokens`
- Tipo: tabela fisica (`relkind = r`)
- Colunas observadas: `id`, `user_id`, `token`, `created_at`
- Registros: `0`
- Usuarios distintos: `0`

### RLS

- RLS habilitada: `true`
- FORCE RLS: `false`

### Policies

- `df_push_tokens_delete`: `DELETE`, roles `{public}`, using `(user_id = auth.uid())`
- `df_push_tokens_insert`: `INSERT`, roles `{public}`, with check `(user_id = auth.uid())`
- `df_push_tokens_select`: `SELECT`, roles `{public}`, using `(user_id = auth.uid())`
- `df_push_tokens_update`: `UPDATE`, roles `{public}`, using/with check `(user_id = auth.uid())`

### Grants

`anon` possuia:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `TRUNCATE`
- `REFERENCES`
- `TRIGGER`

`authenticated` possuia:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `TRUNCATE`
- `REFERENCES`
- `TRIGGER`

## Alteracao aplicada

1. RLS mantida habilitada.
2. FORCE RLS habilitado.
3. Policies `df_push_tokens_delete`, `df_push_tokens_insert`, `df_push_tokens_select` e `df_push_tokens_update` removidas.
4. Todos os grants de `anon` removidos em `public.df_push_tokens`.
5. Todos os grants de `authenticated` removidos em `public.df_push_tokens`.
6. Estrutura e owner da tabela preservados.

## Estado depois

### RLS

- RLS habilitada: `true`
- FORCE RLS: `true`

### Policies

- Nenhuma policy restante em `public.df_push_tokens`.
- Policies `ALL`: `0`
- Policies `DELETE`: `0`
- Policies `public/anon`: `0`
- Policies `using true`: `0`
- Policies `with check true`: `0`

### Grants

- Grants para `anon`: `0`
- Grants para `authenticated`: `0`
- Grants perigosos `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`: `0`

### Acesso efetivo por role

`anon`:

- `SELECT`: `false`
- `INSERT`: `false`
- `UPDATE`: `false`
- `DELETE`: `false`

`authenticated`:

- `SELECT`: `false`
- `INSERT`: `false`
- `UPDATE`: `false`
- `DELETE`: `false`
- `TRUNCATE`: `false`
- `TRIGGER`: `false`

## Impacto funcional

- Nenhuma funcionalidade de Push foi criada.
- Nenhum frontend, service, hook, script, workflow ou secret foi alterado.
- Como Push nao esta configurado e a tabela estava vazia, o impacto funcional esperado e baixo.
- Se Push for implementado futuramente, deve haver ciclo proprio para desenhar policies e grants minimos.

## Rollback

Rollback disponivel em:

`docs/security/rollback/rollback_df_push_tokens_hardening_20260606.sql`

O rollback recria o estado remoto observado antes da migration, incluindo grants amplos e policies com role `public`. Deve ser usado somente se algum consumidor legado/futuro depender explicitamente desta tabela antes de um redesenho seguro do fluxo de Push.

## Proximo passo recomendado

Continuar hardening por ciclos pequenos. A proxima candidata deve ser escolhida entre tabelas com menor risco funcional restante, evitando misturar com tabelas ativas de Financeiro, Usuarios ou Configuracoes.
