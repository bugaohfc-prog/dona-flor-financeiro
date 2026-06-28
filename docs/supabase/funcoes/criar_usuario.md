# Auditoria da função criar_usuario

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)`

## Escopo

Auditoria específica, somente leitura, para avaliar uma função crítica ligada à criação de usuários legados.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de senha/autenticação, RLS/policy/view/índice, migration, alteração de dados, frontend, service, hook ou outras permissões.

## Resumo executivo

A função `public.criar_usuario(...)` é `plpgsql`, `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, e está exposta com `EXECUTE` efetivo para `PUBLIC`, `anon` e `authenticated`.

Ela insere diretamente em `public.df_usuarios`, grava `senha_hash` a partir de `p_senha` usando `crypt(p_senha, gen_salt('bf'))`, grava perfil/tipo (`p_tipo`), loja (`p_loja`), permissão de pagamento (`p_pode_pagar`) e ativa o usuário.

Não foi encontrada chamada RPC direta a `criar_usuario` no app atual. O fluxo atual de criação manual de usuário passa por `src/services/usuariosService.js`, que invoca a Edge Function `criar-usuario-manual`; essa Edge Function valida usuário autenticado/admin e usa `auth.admin.createUser`, `profiles` e `df_usuarios_empresas`.

Classificação desta auditoria: **crítico**.

Recomendação segura: não alterar neste ciclo. Preparar plano próprio de autenticação/legado para restringir `anon` e `PUBLIC` com prioridade alta. Manter `authenticated` temporariamente até confirmar se há algum fluxo legado externo; restringir `authenticated` somente após matriz de testes do app e validação operacional.

## Definição funcional em linguagem simples

A função recebe nome, usuário, senha, e-mail, tipo/perfil, loja e permissão de pagamento.

Ela cria um registro em `public.df_usuarios` com:

- `nome = p_nome`;
- `usuario = lower(p_usuario)`;
- `email = p_email`;
- `senha_hash = crypt(p_senha, gen_salt('bf'))`;
- `tipo = p_tipo`;
- `loja = p_loja`;
- `pode_pagar = p_pode_pagar`;
- `ativo = true`.

Ela retorna os campos públicos do usuário criado, sem retornar `senha_hash`.

## Evidências do catálogo Postgres

Metadados consultados por `SELECT` em catálogos Postgres:

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `criar_usuario` |
| Argumentos | `p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean` |
| Retorno | `TABLE(id uuid, nome text, usuario text, email text, tipo text, loja text, pode_pagar boolean, ativo boolean)` |
| Linguagem | `plpgsql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | não configurado |
| `PUBLIC` tem `EXECUTE` efetivo | `true` |
| `anon` tem `EXECUTE` efetivo | `true` |
| `authenticated` tem `EXECUTE` efetivo | `true` |
| Hash da definição | `abd9a262dc9057bcce0ff5fb8b6db1f4` |

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

## Grants atuais de EXECUTE

Grants observados em `information_schema.routine_privileges`:

| Grantee | Privilégio | Grantable |
| --- | --- | --- |
| `PUBLIC` | `EXECUTE` | `NO` |
| `anon` | `EXECUTE` | `NO` |
| `authenticated` | `EXECUTE` | `NO` |
| `postgres` | `EXECUTE` | `YES` |
| `service_role` | `EXECUTE` | `NO` |

Leitura de risco: `PUBLIC` torna a função efetivamente executável por papéis que herdam de `PUBLIC`, incluindo `anon` e `authenticated`. Além disso, há grants diretos para `anon` e `authenticated`.

## Tabelas afetadas

### `public.df_usuarios`

A função faz `INSERT` direto em `public.df_usuarios`.

Campos manipulados:

| Campo | Origem |
| --- | --- |
| `nome` | `p_nome` |
| `usuario` | `lower(p_usuario)` |
| `email` | `p_email` |
| `senha_hash` | `crypt(p_senha, gen_salt('bf'))` |
| `tipo` | `p_tipo` |
| `loja` | `p_loja` |
| `pode_pagar` | `p_pode_pagar` |
| `ativo` | `true` |

Estado observado da tabela:

- RLS habilitado: `true`;
- FORCE RLS: `false`;
- a função é `SECURITY DEFINER`, portanto pode bypassar controles normais de RLS dependendo do owner/permissões.

## Dependências encontradas

### Triggers que usam a função

Nenhum trigger usando `criar_usuario` foi encontrado.

### Policies que citam a função

Nenhuma policy citando textualmente `criar_usuario` foi encontrada em `pg_policies`.

### Views que dependem da função

Nenhuma view em `public` citando textualmente `criar_usuario` foi encontrada em `information_schema.views`.

### Outras funções que chamam a função

Nenhuma função normal chamando textualmente `criar_usuario` foi encontrada na checagem com `pg_get_functiondef`.

### Funções sensíveis chamadas

A definição chama funções de hash/salt:

- `crypt(p_senha, gen_salt('bf'))`;
- `gen_salt('bf')`.

## Evidência de uso no código

Busca textual executada em:

- `src`;
- `supabase/functions`;
- `scripts`;
- `docs`;
- `supabase/migrations`.

Resultado:

- Não foi encontrada chamada RPC direta para `criar_usuario`.
- As ocorrências de `criar_usuario` estão em documentação e SQL diagnóstico.
- O fluxo atual da tela `Usuários` chama `adicionarUsuarioEmpresa` em `src/App.jsx`.
- `src/services/usuariosService.js` invoca a Edge Function `criar-usuario-manual` quando `criarAuthManual=true`.
- `supabase/functions/criar-usuario-manual/index.ts` valida usuário autenticado e vínculo admin da empresa antes de chamar `supabaseAdmin.auth.admin.createUser`.

Leitura: o app atual não parece usar a função RPC `criar_usuario`. A criação manual ativa usa uma Edge Function com validação de admin, e não a função legada auditada aqui.

## Riscos práticos

### Risco se `anon` puder executar

Crítico.

Um cliente não autenticado pode chamar `/rest/v1/rpc/criar_usuario` e criar registros em `df_usuarios`, escolhendo usuário, senha, tipo/perfil, loja e `pode_pagar`. Mesmo que esse fluxo seja legado, a exposição cria risco de criação de identidade fora do fluxo esperado.

### Risco se `authenticated` puder executar

Alto.

Qualquer usuário autenticado pode tentar criar usuário legado com parâmetros arbitrários. O risco inclui criação fora da tela administrativa, escolha indevida de perfil/tipo e permissão operacional (`pode_pagar`), além de possível confusão entre usuários legados e o fluxo atual de Auth.

### Risco se `PUBLIC` mantiver EXECUTE

Crítico.

`PUBLIC` mantém a exposição efetiva mesmo se grants diretos forem removidos de `anon` ou `authenticated`. Qualquer plano de correção precisa tratar `PUBLIC`, não apenas grants diretos.

### Risco relacionado a senha/perfil/permissão

Crítico.

A função recebe senha em texto como argumento, calcula hash no banco e grava `senha_hash`. Também recebe `p_tipo`, `p_loja` e `p_pode_pagar`, que podem alterar perfil/permissão operacional no modelo legado.

### Risco de `search_path`

Alto.

O Advisor também lista `criar_usuario` em `function_search_path_mutable`. Como a função é `SECURITY DEFINER`, ausência de `search_path` fixo aumenta o risco técnico e deve ser tratada em plano próprio.

## Classificação

Classificação final: **crítico**.

Motivos:

- `SECURITY DEFINER` em schema exposto;
- executável por `anon`;
- executável por `authenticated`;
- executável por herança de `PUBLIC`;
- manipula criação de usuário legado;
- grava hash de senha;
- recebe perfil/tipo e permissão como parâmetros;
- não tem `search_path` fixo;
- não há evidência de que o app atual dependa diretamente da RPC.

## Recomendação segura

Recomendação deste ciclo:

- manter temporariamente neste ciclo, sem alteração;
- preparar plano próprio antes de qualquer `REVOKE`;
- priorizar restrição de `anon`;
- priorizar restrição de `PUBLIC`;
- manter `authenticated` temporariamente até confirmar ausência de fluxo legado externo;
- restringir `authenticated` somente após ajuste/validação do app e matriz de testes;
- tratar `search_path` em ciclo separado ou no mesmo plano de autenticação, mas sem misturar com alteração não validada.

Ordem sugerida para ciclo futuro:

1. Confirmar novamente que o app atual não chama `criar_usuario`.
2. Confirmar se existem integrações externas, automações ou usuários operacionais usando `/rpc/criar_usuario`.
3. Criar matriz de validação do fluxo atual `criar-usuario-manual`.
4. Preparar rollback de grants.
5. Se seguro, remover `EXECUTE` de `anon` e `PUBLIC` primeiro.
6. Avaliar `authenticated` em etapa própria, após observação.
7. Tratar `search_path` com `ALTER FUNCTION` somente em ciclo autorizado e com rollback.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('public', 'public.criar_usuario(text,text,text,text,text,text,boolean)', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.criar_usuario(text,text,text,text,text,text,boolean)', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.criar_usuario(text,text,text,text,text,text,boolean)', 'EXECUTE') as authenticated_has_execute;

-- Restrição candidata inicial:
-- revoke execute on function public.criar_usuario(text,text,text,text,text,text,boolean) from anon;
-- revoke execute on function public.criar_usuario(text,text,text,text,text,text,boolean) from public;

-- Restrição de authenticated somente após validação adicional:
-- revoke execute on function public.criar_usuario(text,text,text,text,text,text,boolean) from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem novo ciclo autorizado ou necessidade real de rollback.

```sql
-- Rollback de grants:
-- grant execute on function public.criar_usuario(text,text,text,text,text,text,boolean) to public;
-- grant execute on function public.criar_usuario(text,text,text,text,text,text,boolean) to anon;
-- grant execute on function public.criar_usuario(text,text,text,text,text,text,boolean) to authenticated;
```

## Próximos passos

- Criar plano de restrição específico para `criar_usuario`.
- Validar o fluxo atual de criação manual via Edge Function `criar-usuario-manual`.
- Confirmar se há uso externo do RPC legado.
- Não alterar autenticação, grants ou função sem ciclo próprio e rollback imediato.

## Estado final deste ciclo

- Banco: não alterado.
- Grants: não alterados.
- Função: não alterada.
- Autenticação/senhas: não alteradas.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: não alterados.
- Frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
