# Auditoria de funções SECURITY DEFINER expostas

Data: 2026-06-28

Projeto Supabase: `contas-donaflor`

Project ID: `vyhjjtzdvofoqoericak`

Branch Git: `main` em produção. Não há ambiente de homologação.

## Objetivo

Inventariar as funções `SECURITY DEFINER` do schema `public` executáveis por `anon` e/ou `authenticated`, cruzar com Advisor, catálogo Postgres e código versionado, e definir recomendações iniciais para ciclos futuros.

Este ciclo é somente leitura e documentação. Não houve `REVOKE`, `GRANT`, `ALTER FUNCTION`, alteração de `search_path`, RLS, policies, views, índices, dados, frontend, services, hooks, Auth, secrets ou migration.

## Fontes consultadas

- Supabase Security Advisor em 2026-06-28.
- Catálogo Postgres via consultas somente leitura em `pg_proc`, `pg_namespace`, `pg_language`, `information_schema.triggers` e `pg_policies`.
- Busca no repositório com `rg` para chamadas `.rpc(...)`, migrations, scripts e Edge Functions.

## Resumo executivo

Foram inventariadas 18 funções `SECURITY DEFINER` em `public` que aparecem no Advisor como executáveis por `anon` e por `authenticated`.

Principais conclusões:

- Há funções sensíveis de autenticação/legado (`criar_usuario`, `login_usuario`, `handle_new_user`, `vincular_usuario_logado`) que não devem ser alteradas sem plano próprio.
- Há helpers usados por RLS/policies (`is_master`, `df_usuario_eh_admin`, `df_usuario_tem_perfil_empresa`, `df_usuario_alvo_eh_master`, `df_funcionarios_pode_escrever`, `df_empresas_do_usuario`), com alto risco de quebra se houver revogação direta.
- Há funções de trigger/validação interna expostas como RPC (`df_funcionarios_*_validar_*`, `df_folha_lancamentos_validar_vinculos`, `df_auditoria_admin_sanitize_destinatario_alerta`) que são candidatas naturais a restringir execução pública em ciclo futuro, depois de confirmar que nenhum app/script chama diretamente.
- `criar_usuario`, `login_usuario` e `handle_new_user` também aparecem com `search_path` ausente no Advisor; isso deve ser tratado em ciclo separado e sem misturar com revogação de permissões.

## Evidência de uso no código

Chamadas RPC diretas encontradas:

- `src/pages/Login.jsx`: chama `supabase.rpc('vincular_usuario_logado')` após login.
- `src/services/tenantService.js`: chama `supabase.rpc('vincular_usuario_logado')` para sincronização de vínculo.
- `supabase/functions/convidar-usuario/index.ts`: chama `is_master` e `df_usuario_eh_admin`.
- `scripts/validar-rls-df-funcionarios.mjs`: chama `is_master` e `df_funcionarios_pode_escrever` em diagnóstico.

Uso por policies confirmado no catálogo:

- `is_master`
- `df_usuario_eh_admin`
- `df_usuario_tem_perfil_empresa`
- `df_usuario_alvo_eh_master`
- `df_funcionarios_pode_escrever`
- `df_empresas_do_usuario`

Uso por triggers confirmado no catálogo:

- `handle_new_user`
- `df_auditoria_admin_sanitize_destinatario_alerta`
- `df_folha_lancamentos_validar_vinculos`
- `df_funcionarios_validar_filial_empresa`
- `df_funcionarios_exames_periodicos_validar_funcionario_empresa`
- `df_funcionarios_ferias_ciclos_validar_funcionario_empresa`
- `df_funcionarios_ferias_periodos_validar_vinculos`

## Classificação por grupo

### A. Provavelmente usadas no login/autenticação - não mexer sem plano próprio

- `public.login_usuario(p_usuario text, p_senha text)`
- `public.criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)`
- `public.handle_new_user()`
- `public.vincular_usuario_logado()`

Risco: quebrar login legado, criação/provisionamento de usuário, criação de `profiles` no trigger de Auth ou vínculo automático de usuário à empresa.

Recomendação: manter por enquanto. Antes de qualquer restrição, mapear fluxo Auth atual, fluxo legado, Edge Functions, onboarding e testes reais de login.

### B. Provavelmente usadas por RLS/policies - cuidado antes de revogar

- `public.is_master()`
- `public.df_usuario_eh_admin(p_empresa_id uuid)`
- `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])`
- `public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)`
- `public.df_funcionarios_pode_escrever(p_empresa_id uuid)`
- `public.df_empresas_do_usuario()`

Risco: revogar execução de `authenticated` pode quebrar policies de contas, notas, usuários, filiais, destinatários, assinatura, Gestão de Pessoas e fechamento de folha. Revogar `anon` pode ser seguro para parte delas, mas precisa confirmar se há policy com role `{public}` ou chamada anônima esperada.

Recomendação: revisar antes de revogar. Priorizar diagnóstico de roles/policies por função e teste anon/auth por perfil.

### C. Trigger/validação interna - candidatas a restringir execute público

- `public.df_auditoria_admin_sanitize_destinatario_alerta()`
- `public.df_folha_lancamentos_validar_vinculos()`
- `public.df_funcionarios_validar_filial_empresa()`
- `public.df_funcionarios_exames_periodicos_validar_funcionario_empresa()`
- `public.df_funcionarios_ferias_ciclos_validar_funcionario_empresa()`
- `public.df_funcionarios_ferias_periodos_validar_vinculos()`

Risco: chamadas diretas via RPC podem expor comportamento interno de validação/auditoria, mesmo que a utilidade prática seja limitada por assinatura `trigger`. A exposição é desnecessária para funções acionadas apenas por trigger.

Recomendação: candidatas a restringir `anon` e `authenticated` em ciclo futuro, depois de confirmar que não há chamadas diretas no app, scripts ou automações. Preservar execução por triggers.

### D. Administração/sensíveis - alta prioridade para revisão

- `public.criar_usuario(...)`
- `public.df_usuario_eh_admin(p_empresa_id uuid)`
- `public.df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])`
- `public.df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)`
- `public.is_master()`
- `public.df_funcionarios_pode_escrever(p_empresa_id uuid)`

Risco: funções relacionadas a criação de usuário, perfil, master/admin e autorização por empresa podem ampliar impacto caso sejam chamadas fora do caminho previsto.

Recomendação: alta prioridade de revisão, mas não de alteração imediata. Separar por subgrupo: Auth/admin, helpers de RLS financeiros e helpers de Gestão de Pessoas.

### E. Legado/incerto - precisa rastreio adicional

- `public.login_usuario(p_usuario text, p_senha text)`
- `public.get_empresa_usuario()`
- `public.is_admin()`
- `public.df_empresas_do_usuario()`

Risco: podem ser resquícios de versões antigas ou ainda usadas indiretamente por policy/documentação. Alteração sem rastreio pode quebrar compatibilidade ou revelar lacunas de arquitetura.

Recomendação: rastrear uso histórico e atual antes de propor remoção, revogação ou substituição.

## Inventário por função

| Função | Linguagem | Execute | Advisor | Uso identificado | Tabelas acessadas | Classificação | Recomendação inicial |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `criar_usuario(p_nome text, p_usuario text, p_senha text, p_email text, p_tipo text, p_loja text, p_pode_pagar boolean)` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos; sem `search_path` | Sem chamada direta encontrada em `src`; provável legado/admin | `df_usuarios` | A/D | Manter por enquanto; revisar em plano Auth/admin antes de restringir |
| `login_usuario(p_usuario text, p_senha text)` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos; sem `search_path` | Sem chamada direta encontrada; provável login legado | `df_usuarios` | A/E | Não mexer sem confirmar se fluxo legado ainda existe |
| `handle_new_user()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos; sem `search_path` | Trigger `auth.users.on_auth_user_created` | `profiles` | A/C | Manter; depois avaliar restringir RPC direta sem quebrar trigger |
| `vincular_usuario_logado()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Chamada direta em `Login.jsx` e `tenantService.js` | `df_usuarios_empresas` | A | Manter para `authenticated`; candidata a restringir `anon` após teste de login |
| `is_master()` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Edge Function `convidar-usuario`, script de validação, muitas policies | `df_usuarios_master` | B/D | Revisar antes de revogar; não restringir `authenticated` sem matriz RLS |
| `df_usuario_eh_admin(p_empresa_id uuid)` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Edge Function `convidar-usuario`; muitas policies | `df_usuarios_empresas` | B/D | Revisar antes de revogar; candidata a restringir `anon` após mapear policies `{public}` |
| `df_usuario_tem_perfil_empresa(p_empresa_id uuid, p_perfis text[])` | `sql` | `anon`, `authenticated` | Exposta para ambos | Policies de contas, notas, RH e destinatários | `df_usuarios_empresas` | B/D | Manter `authenticated`; avaliar `anon` com cuidado |
| `df_usuario_alvo_eh_master(p_user_id uuid, p_email text, p_usuario_id uuid)` | `sql` | `anon`, `authenticated` | Exposta para ambos | Policies de `df_usuarios_empresas` e `df_usuarios_filiais` | `df_usuarios_master` | B/D | Revisar antes de revogar; sensível por proteção de Master |
| `df_funcionarios_pode_escrever(p_empresa_id uuid)` | `sql` | `anon`, `authenticated` | Exposta para ambos | Policies de Gestão de Pessoas/folha; script de validação | `df_usuarios_empresas`, `df_usuarios_master`, `auth.users` | B/D | Manter `authenticated`; avaliar `anon` só com teste RLS completo |
| `df_empresas_do_usuario()` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Policy legada `{public}` em `df_usuarios_empresas` | `df_usuarios_empresas` | B/E | Não mexer antes de revisar policy legada que chama a função |
| `get_empresa_usuario()` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Sem chamada direta atual; docs indicam legado | `df_usuarios_empresas` | E | Candidata a ciclo de rastreio legado |
| `is_admin()` | `sql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Sem chamada direta no frontend; docs indicam legado | `df_usuarios_empresas` | E/D | Rastrear antes de substituir/restringir |
| `df_auditoria_admin_sanitize_destinatario_alerta()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_destinatarios_alertas` | `df_auditoria_admin`; dados do trigger de `df_destinatarios_alertas` | C | Candidata forte a restringir execução direta |
| `df_folha_lancamentos_validar_vinculos()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_folha_lancamentos` | `df_folha_competencias`, `df_funcionarios`, `df_filiais` | C | Candidata a restringir execução direta |
| `df_funcionarios_validar_filial_empresa()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_funcionarios` | `df_filiais` | C | Candidata a restringir execução direta |
| `df_funcionarios_exames_periodicos_validar_funcionario_empresa()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_funcionarios_exames_periodicos` | `df_funcionarios` | C | Candidata a restringir execução direta |
| `df_funcionarios_ferias_ciclos_validar_funcionario_empresa()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_funcionarios_ferias_ciclos` | `df_funcionarios` | C | Candidata a restringir execução direta |
| `df_funcionarios_ferias_periodos_validar_vinculos()` | `plpgsql` | `anon`, `authenticated`; ACL também inclui `PUBLIC` | Exposta para ambos | Trigger em `df_funcionarios_ferias_periodos` | `df_funcionarios`, `df_funcionarios_ferias_ciclos` | C | Candidata a restringir execução direta |

## Observações sobre definição das funções

As definições foram consultadas via `pg_get_functiondef`. O relatório não replica todos os corpos SQL para evitar excesso documental, mas registra as tabelas acessadas e o comportamento essencial.

Pontos relevantes:

- `criar_usuario`, `login_usuario` e `handle_new_user` não têm `SET search_path` no catálogo atual.
- A maioria dos helpers novos usa `SET search_path TO 'public'`; `df_usuario_alvo_eh_master` usa `public, pg_temp`.
- Funções trigger retornam `trigger` e não deveriam precisar de chamada RPC direta por `anon` ou `authenticated`.
- Helpers de policy dependem de `auth.uid()` e/ou `auth.jwt()`, portanto alteração de grants pode mudar o comportamento real das policies.

## Recomendações por risco

Alta prioridade de revisão:

- `criar_usuario`
- `is_master`
- `df_usuario_eh_admin`
- `df_usuario_tem_perfil_empresa`
- `df_usuario_alvo_eh_master`
- `df_funcionarios_pode_escrever`

Candidatas a restringir `anon` em ciclo futuro:

- `vincular_usuario_logado`
- `df_auditoria_admin_sanitize_destinatario_alerta`
- `df_folha_lancamentos_validar_vinculos`
- `df_funcionarios_validar_filial_empresa`
- `df_funcionarios_exames_periodicos_validar_funcionario_empresa`
- `df_funcionarios_ferias_ciclos_validar_funcionario_empresa`
- `df_funcionarios_ferias_periodos_validar_vinculos`

Candidatas a restringir `authenticated` somente após prova de não uso direto:

- funções trigger/validação interna listadas no grupo C.

Não restringir `authenticated` agora:

- `vincular_usuario_logado`
- `is_master`
- `df_usuario_eh_admin`
- `df_usuario_tem_perfil_empresa`
- `df_usuario_alvo_eh_master`
- `df_funcionarios_pode_escrever`
- `df_empresas_do_usuario`

Rastreio legado antes de qualquer decisão:

- `login_usuario`
- `get_empresa_usuario`
- `is_admin`
- `criar_usuario`

## Plano seguro em etapas

### Etapa 1 - relatório e inventário

Status: concluída neste ciclo.

Sem alteração de banco.

### Etapa 2 - diagnóstico SQL versionado para próximo ciclo

Status em 2026-06-28: SQL somente leitura criado em `docs/supabase/sql/diagnostico-security-definer.sql`, com documentação de uso em `docs/supabase/security-definer-diagnostico-sql.md`.

Resultado da execução somente leitura registrado em `docs/supabase/security-definer-diagnostico-resultado.md`.

O diagnóstico captura:

- definição atual por `pg_get_functiondef`;
- `proacl`;
- `has_function_privilege` para `anon` e `authenticated`;
- triggers que usam cada função;
- policies que referenciam cada helper.

Não executar correção nessa etapa.

### Etapa 3 - pacote trigger-only

Planejar restrição de execução direta para funções trigger/validação interna.

Pré-condições:

- confirmar zero chamadas `.rpc(...)`;
- validar que triggers continuam executando;
- preparar rollback de grants exatamente como estão hoje.

### Etapa 4 - pacote `anon`

Avaliar remoção de execução por `anon` em funções que só fazem sentido com sessão autenticada.

Pré-condições:

- testar login;
- testar policies com role `{public}`;
- testar Edge Function `convidar-usuario`;
- testar Gestão de Pessoas.

### Etapa 5 - pacote Auth/legado

Tratar `criar_usuario`, `login_usuario`, `handle_new_user`, `is_admin` e `get_empresa_usuario` em plano próprio de autenticação/legado.

Não misturar com RLS/policies.

## O que não mexer agora

- Não executar `REVOKE`.
- Não executar `GRANT`.
- Não alterar `SECURITY DEFINER` para `SECURITY INVOKER`.
- Não alterar `search_path`.
- Não mover função de schema.
- Não alterar policies que dependem desses helpers.
- Não apagar funções legadas sem prova de não uso.
- Não alterar Auth ou fluxo de login.

## Rollback previsto para ciclos futuros

Cada ciclo futuro que alterar permissões deve ter rollback explícito com:

- grants anteriores por função e role;
- definição anterior da função, se houver `ALTER FUNCTION` ou recriação;
- diagnóstico antes/depois de `has_function_privilege`;
- smoke test de login;
- smoke test de `convidar-usuario`;
- validação por perfil Admin, Master, Gerente e Operador;
- validação cross-tenant para funções usadas em RLS.

Modelo conceitual de rollback futuro:

- restaurar `EXECUTE` para as roles removidas;
- restaurar definição anterior quando houver alteração de função;
- recriar policy anterior se alguma policy for alterada em ciclo próprio.

Este documento não autoriza nem executa essas ações.

## Estado final deste ciclo

- Banco: não alterado.
- RLS/policies: não alteradas.
- Funções: não alteradas.
- Grants: não alterados.
- Views: não alteradas.
- Índices: não alterados.
- Dados: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- GitHub Actions/scripts/secrets: não alterados.
- Envio real: não executado.
- Build: não necessário, pois houve somente documentação.
