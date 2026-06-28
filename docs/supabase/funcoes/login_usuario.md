# Auditoria da função login_usuario

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Função auditada: `public.login_usuario(p_usuario text, p_senha text)`

## Escopo

Auditoria específica, somente leitura, para avaliar uma função crítica ligada a login legado.

Este ciclo não executou `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de senha/autenticação, Edge Function, frontend, service, hook, RLS/policy/view/índice, migration, alteração de dados ou outras permissões.

## Resumo executivo

A função `public.login_usuario(p_usuario text, p_senha text)` é uma função SQL `SECURITY DEFINER`, owner `postgres`, sem `search_path` fixo, executável por `PUBLIC`, `anon` e `authenticated`.

Ela lê `public.df_usuarios`, compara `u.senha_hash` com `crypt(p_senha, u.senha_hash)` e retorna dados operacionais do usuário legado quando o usuário está ativo.

Não foi encontrada chamada RPC direta a `login_usuario` no app atual. A tela de login versionada usa `supabase.auth.signInWithPassword` e, após autenticar, chama `vincular_usuario_logado`.

Classificação desta auditoria: **crítico**.

Recomendação segura: manter temporariamente neste ciclo. Preparar plano próprio para restringir `PUBLIC` e `anon` somente depois de validar que não existe fluxo legado externo usando `/rpc/login_usuario`. Manter `authenticated` temporariamente até confirmar se há uso legado ou administrativo indireto. Não alterar senha, Auth ou `search_path` no mesmo ciclo de grants.

Plano de validação e rollback para restrição futura: `docs/supabase/funcoes/login_usuario-plano-restricao.md`.

## Assinatura da função

| Campo | Valor |
| --- | --- |
| Schema | `public` |
| Nome | `login_usuario` |
| Argumentos | `p_usuario text, p_senha text` |
| Retorno | `TABLE(id uuid, nome text, usuario text, email text, tipo text, loja text, pode_pagar boolean, ativo boolean)` |
| Linguagem | `sql` |
| Owner | `postgres` |
| `SECURITY DEFINER` | `true` |
| Volatilidade | `volatile` |
| `search_path` | não configurado |
| Hash da definição | `a096f36a7170f162bf18c223e121a9b6` |

## Definição funcional em linguagem simples

A função recebe um identificador de usuário (`p_usuario`) e uma senha (`p_senha`).

Ela busca em `public.df_usuarios` um registro ativo em que:

- `lower(u.usuario) = lower(p_usuario)`;
- `u.ativo = true`;
- `u.senha_hash = crypt(p_senha, u.senha_hash)`.

Se encontrar um usuário, retorna até um registro com dados de identificação, perfil e permissões operacionais. A função não retorna `senha_hash`, mas usa a senha recebida em texto para comparar contra o hash armazenado.

Definição observada:

```sql
CREATE OR REPLACE FUNCTION public.login_usuario(p_usuario text, p_senha text)
 RETURNS TABLE(id uuid, nome text, usuario text, email text, tipo text, loja text, pode_pagar boolean, ativo boolean)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
select
  u.id,
  u.nome,
  u.usuario,
  u.email,
  u.tipo,
  u.loja,
  u.pode_pagar,
  u.ativo
from public.df_usuarios u
where lower(u.usuario) = lower(p_usuario)
  and u.ativo = true
  and u.senha_hash = crypt(p_senha, u.senha_hash)
limit 1;
$function$
```

## Grants atuais de EXECUTE

ACL bruta observada:

```text
{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
```

| Papel | `EXECUTE` efetivo | Leitura |
| --- | --- | --- |
| `PUBLIC` | `true` | Exposição ampla por herança. |
| `anon` | `true` | Tem grant direto e também herda de `PUBLIC`. |
| `authenticated` | `true` | Tem grant direto e também herda de `PUBLIC`. |
| `postgres` | `true` | Preservado. |
| `service_role` | `true` | Preservado. |

Leitura de risco: enquanto `PUBLIC` tiver `EXECUTE`, revogar apenas grants diretos de `anon` ou `authenticated` não remove a execução efetiva. Qualquer plano futuro precisa tratar `PUBLIC`.

## Tabelas afetadas

### `public.df_usuarios`

A função lê `public.df_usuarios`.

Campos lidos ou usados:

| Campo | Uso |
| --- | --- |
| `id` | Retornado |
| `nome` | Retornado |
| `usuario` | Comparado com `p_usuario` e retornado |
| `email` | Retornado |
| `tipo` | Retornado |
| `loja` | Retornado |
| `pode_pagar` | Retornado |
| `ativo` | Filtro e retorno |
| `senha_hash` | Comparado com `crypt(p_senha, u.senha_hash)` |

Não foi identificada escrita de dados pela função. O risco principal é autenticação legada, enumeração indireta e exposição de dados operacionais de usuário após tentativa válida.

## Dados retornados

A função retorna:

- `id`;
- `nome`;
- `usuario`;
- `email`;
- `tipo`;
- `loja`;
- `pode_pagar`;
- `ativo`.

Ela não retorna `senha_hash`, mas retorna perfil/tipo, loja e permissão `pode_pagar`, que são dados sensíveis para autorização operacional.

## Dependências encontradas

Consulta de catálogo não encontrou dependências diretas:

| Dependência | Resultado |
| --- | --- |
| Triggers usando a função | `0` |
| Policies citando a função | `0` |
| Views citando a função | `0` |
| Outras funções normais chamando textualmente a função | `0` |

## Evidência de uso no código

Busca textual executada em:

- `src`;
- `supabase/functions`;
- `scripts`;
- `docs`;
- `supabase/migrations`.

Resultado:

- Não foi encontrada chamada RPC direta para `login_usuario` no app atual.
- Não foi encontrado uso versionado de `/rpc/login_usuario`.
- As ocorrências de `login_usuario` estão em documentação e SQL diagnóstico.
- A tela `src/pages/Login.jsx` usa `supabase.auth.signInWithPassword({ email, password })`.
- Após login pelo Supabase Auth, `src/pages/Login.jsx` chama `supabase.rpc('vincular_usuario_logado')`.

Leitura: o fluxo atual de login versionado usa Supabase Auth, não a função RPC legada `login_usuario`.

## Riscos práticos

### Risco se `anon` puder executar

Crítico.

Um cliente não autenticado pode chamar `/rest/v1/rpc/login_usuario` e testar credenciais contra a tabela legada `df_usuarios`. Isso cria risco de abuso de login legado, tentativa de enumeração por diferença de resposta/tempo e retorno de dados de perfil caso a senha esteja correta.

### Risco se `authenticated` puder executar

Alto.

Um usuário autenticado pode tentar validar credenciais legadas e obter dados de outro usuário caso conheça usuário/senha. Mesmo sem retorno de `senha_hash`, a função expõe dados operacionais como `tipo`, `loja` e `pode_pagar`.

### Risco se `PUBLIC` mantiver EXECUTE

Crítico.

`PUBLIC` mantém execução efetiva para papéis que herdam dele. A exposição por `PUBLIC` torna insuficiente revogar apenas `anon` ou `authenticated`.

### Risco de enumeração de usuários

Médio a alto.

A função retorna linha quando `usuario`, `ativo` e senha batem. A auditoria não testou comportamento via API, mas a exposição da RPC pode permitir diferenciar credenciais válidas por resposta, status ou tempo.

### Risco de vazamento de perfil/permissão

Alto.

Em login bem-sucedido pela função legada, o retorno inclui `tipo`, `loja`, `pode_pagar`, `email`, `usuario` e `ativo`.

### Risco relacionado a senha/hash

Crítico.

A função recebe senha em texto como parâmetro e compara com `senha_hash` usando `crypt`. Mesmo sem expor o hash, a função é uma superfície pública de validação de senha legada.

### Risco de `search_path`

Alto.

O Advisor lista `login_usuario` em `function_search_path_mutable`. Como a função é `SECURITY DEFINER`, ausência de `search_path` fixo deve ser tratada em plano próprio.

## Classificação

Classificação final: **crítico**.

Motivos:

- função ligada a login/autenticação legada;
- `SECURITY DEFINER`;
- executável por `PUBLIC`, `anon` e `authenticated`;
- recebe senha em texto como parâmetro;
- consulta `senha_hash`;
- retorna dados de perfil/permissão;
- não tem `search_path` fixo;
- não há evidência de uso direto pelo app atual.

## Recomendação segura

Recomendação deste ciclo:

- manter temporariamente, sem alteração;
- criar plano específico de restrição antes de qualquer `REVOKE`;
- validar novamente que o login atual usa Supabase Auth e não RPC legada;
- confirmar se há uso externo conhecido de `/rpc/login_usuario`;
- priorizar restrição de `PUBLIC`;
- avaliar restrição de `anon` com cuidado porque login legado, se existir, provavelmente dependeria de `anon`;
- manter `authenticated` temporariamente até confirmar ausência de uso legado;
- tratar `search_path` em ciclo separado, sem misturar com alteração de grants.

Ordem sugerida para ciclo futuro:

1. Confirmar novamente ausência de chamada direta a `login_usuario`.
2. Confirmar com operação se existe login legado externo usando `/rpc/login_usuario`.
3. Validar login atual com `supabase.auth.signInWithPassword`.
4. Preparar rollback de grants.
5. Se seguro, restringir `PUBLIC` e `anon` em fase própria.
6. Avaliar `authenticated` em fase posterior.
7. Tratar `search_path` somente em ciclo autorizado de `ALTER FUNCTION`.

## SQL futuro proposto, comentado

Não executar sem novo ciclo autorizado.

```sql
-- Diagnóstico antes:
-- select
--   has_function_privilege('public', 'public.login_usuario(text,text)', 'EXECUTE') as public_has_execute,
--   has_function_privilege('anon', 'public.login_usuario(text,text)', 'EXECUTE') as anon_has_execute,
--   has_function_privilege('authenticated', 'public.login_usuario(text,text)', 'EXECUTE') as authenticated_has_execute;

-- Restrição candidata, somente após validação de ausência de uso legado:
-- revoke execute on function public.login_usuario(text, text) from anon;
-- revoke execute on function public.login_usuario(text, text) from public;

-- Restrição de authenticated somente após validação adicional:
-- revoke execute on function public.login_usuario(text, text) from authenticated;
```

## Rollback futuro proposto, comentado

Não executar sem necessidade real de rollback ou ciclo autorizado.

```sql
-- Rollback de grants:
-- grant execute on function public.login_usuario(text, text) to public;
-- grant execute on function public.login_usuario(text, text) to anon;
-- grant execute on function public.login_usuario(text, text) to authenticated;
```

## Próximos passos

- Usar o plano em `docs/supabase/funcoes/login_usuario-plano-restricao.md` como matriz antes/depois para qualquer ciclo futuro de `REVOKE`.
- Validar login atual por Supabase Auth sem alterar autenticação.
- Confirmar se existe uso externo ou legado de `/rpc/login_usuario`.
- Não alterar grants, função, Auth, senha ou `search_path` sem ciclo próprio.

## Estado final deste ciclo

- Banco: não alterado.
- Grants: não alterados.
- Função: não alterada.
- Autenticação/senhas: não alteradas.
- RLS/policies: não alteradas.
- Views/índices: não alterados.
- Dados: não alterados.
- Edge Function/frontend/service/hook: não alterados.
- Auth/secrets/GitHub Actions/envio real: não alterados.
