# Resultado - hardening public.contas - 2026-06-06

Projeto Supabase: contas-donaflor  
Project ref: vyhjjtzdvofoqoericak  
Migration aplicada: `20260606120000_harden_public_contas_legacy_grants.sql`

## Escopo

Hardening minimo da tabela legada `public.contas`, identificada no diagnostico LGPD/Security como ponto critico por combinar:

- policy `ALL` para role `public`;
- `using true`;
- `with check true`;
- grants amplos para `anon`;
- grants extras para `authenticated`, incluindo `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`.

O frontend atual nao apresentou uso direto de `.from('contas')` ou `.from("contas")`. O fluxo financeiro atual usa `public.df_contas`. No Supabase remoto, `public.contas` estava vazia no momento da validacao.

## Estado antes

### Estrutura

- Tabela: `public.contas`
- Colunas observadas: `id`, `descricao`, `valor`, `vencimento`, `centro`, `status`, `observacao`, `created_at`, `empresa_id`.
- Registros: `0`
- Empresas distintas: `0`

### RLS

- RLS habilitada: `true`
- FORCE RLS: `false`

### Policy perigosa

- Policy: `Permitir tudo`
- Comando: `ALL`
- Roles: `{public}`
- Using: `true`
- With check: `true`

### Grants perigosos

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
3. Policy `Permitir tudo` removida.
4. Todos os grants de `anon` removidos em `public.contas`.
5. Todos os grants de `authenticated` removidos em `public.contas`.

## Estado depois

### RLS

- RLS habilitada: `true`
- FORCE RLS: `true`

### Policies

- Nenhuma policy restante em `public.contas`.
- Policies `ALL`: `0`
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

## Validacao funcional e impacto

- `public.contas` foi tratada como tabela legada/inativa por estar vazia e sem consumo direto localizado no frontend.
- O fluxo financeiro ativo `public.df_contas` nao foi alterado.
- Nenhum frontend, service, hook, script ou workflow foi alterado.
- O bloqueio cross-tenant em `public.contas` passa a ser negar acesso util para `anon` e `authenticated`, ja que a tabela legada nao possui uso legitimo ativo.

## Rollback

Rollback disponivel em:

`docs/security/rollback/rollback_public_contas_hardening_20260606.sql`

O rollback recria o estado remoto observado antes da migration, incluindo grants amplos e a policy `Permitir tudo`. Deve ser usado somente se algum consumidor legado externo depender explicitamente de `public.contas`.

## Proximo passo recomendado

Abrir novo ciclo pequeno para revisar grants perigosos em outra tabela legada ou administrativa, sem misturar com frontend. Candidatos naturais: `df_centros_custo`, `df_configuracoes`, `df_empresas`, `df_filiais`, `df_usuarios` ou `df_usuarios_master`, priorizando impacto e fluxo ativo.
