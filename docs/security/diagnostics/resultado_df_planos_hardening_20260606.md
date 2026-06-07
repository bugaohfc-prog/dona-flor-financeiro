# Resultado - hardening df_planos - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Migration aplicada: `20260606130000_harden_df_planos_catalog_grants.sql`

## Escopo

Hardening minimo da tabela `public.df_planos`, preservando leitura legitima do catalogo e removendo escrita pelo client.

Motivos:

- tabela com 3 registros ativos;
- catalogo global de planos, sem dados pessoais;
- sem `empresa_id`/`user_id` por desenho;
- uso localizado em `src/services/billingService.js` para leitura;
- RLS habilitada sem `FORCE RLS`;
- policy anterior `planos_select` com role `public` e `using true`;
- grants amplos para `anon` e `authenticated`, incluindo escrita e privilegios extras.

## Estado antes

### Estrutura

- Tabela: `public.df_planos`
- Tipo: tabela fisica (`relkind = r`)
- Colunas observadas: `id`, `nome`, `slug`, `limite_filiais`, `limite_usuarios`, `preco_mensal`, `ativo`, `criado_em`
- Registros: `3`
- Registros ativos: `3`

Observacao: o frontend atual consulta `codigo`, `descricao` e `valor_mensal`, enquanto o schema remoto possui `slug` e `preco_mensal`. Esse desalinhamento ja existia antes deste ciclo e nao foi alterado. O service possui fallback local para planos.

### RLS

- RLS habilitada: `true`
- FORCE RLS: `false`

### Policy

- `planos_select`: `SELECT`, roles `{public}`, using `true`

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
3. Policy ampla `planos_select` removida.
4. Grants de `anon` e `authenticated` removidos e recriados somente com `SELECT`.
5. Nova policy `df_planos_select_catalogo` criada para `anon, authenticated`, somente `SELECT`, com `using (ativo = true)`.
6. `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER` removidos de `anon` e `authenticated`.

## Estado depois

### RLS

- RLS habilitada: `true`
- FORCE RLS: `true`

### Policies

- `df_planos_select_catalogo`: `SELECT`, roles `{anon, authenticated}`, using `(ativo = true)`
- Policies `ALL`: `0`
- Policies `DELETE`: `0`
- Policies `using true`: `0`
- Policies `with check true`: `0`

### Grants

`anon`:

- `SELECT`: preservado
- escrita e privilegios extras: removidos

`authenticated`:

- `SELECT`: preservado
- escrita e privilegios extras: removidos

### Acesso efetivo por role

`anon`:

- `SELECT`: `true`
- `INSERT`: `false`
- `UPDATE`: `false`
- `DELETE`: `false`
- `TRUNCATE`: `false`
- `REFERENCES`: `false`
- `TRIGGER`: `false`

`authenticated`:

- `SELECT`: `true`
- `INSERT`: `false`
- `UPDATE`: `false`
- `DELETE`: `false`
- `TRUNCATE`: `false`
- `REFERENCES`: `false`
- `TRIGGER`: `false`

## Impacto funcional

- Leitura do catalogo de planos foi preservada por grant/policy de `SELECT`.
- Escrita pelo client foi bloqueada.
- Nenhum frontend, service, hook, script, workflow ou secret foi alterado.
- Nenhuma assinatura (`df_assinaturas`) foi alterada.

## Rollback

Rollback disponivel em:

`docs/security/rollback/rollback_df_planos_hardening_20260606.sql`

O rollback recria o estado remoto observado antes da migration, incluindo grants amplos e policy `planos_select` com `using true`. Deve ser usado somente se a leitura do catalogo for afetada de forma inesperada.

## Proximo passo recomendado

Antes de novo hardening, diagnosticar a proxima candidata com menor risco. Evitar `df_usuarios*`, `profiles`, `df_empresas`, `df_filiais`, `df_centros_custo` e `df_contas_recorrentes` sem ciclo proprio, pois sao fluxos ativos.
