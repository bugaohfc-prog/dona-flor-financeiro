# Consolidação dos Ciclos 0 a 5 — V1 DNA Gestão / Dona Flor Financeiro

Data de fechamento: 12/07/2026
Repositório: `bugaohfc-prog/dona-flor-financeiro`
Branch oficial: `main`
Produção: <https://dona-flor-financeiro.vercel.app>
Baseline anterior aos ciclos: `9652e87210ec8dcd76f3f2ab8e0424478cff471e`
HEAD ao iniciar esta documentação: `095d5144cca559a07a6a8a9fe6aa6c30b36ed566`

## 1. Diretrizes mantidas

- Trabalho restrito à V1 atual.
- V2 permaneceu pausada e não recebeu evolução ou migração.
- Alterações foram divididas em ciclos e commits pequenos, com build e deploy separados.
- Não houve atualização de dependências durante a padronização visual.
- Não foram incluídos `dist/`, `node_modules/`, `.codex/`, logs ou arquivos temporários.
- Migrations adicionadas no acompanhamento de segurança já estavam aplicadas em produção e foram registradas no Git apenas para sincronizar o histórico.

## 2. Ciclo 0 — confirmação e publicação da refatoração visual

Objetivo: recuperar exatamente do workspace anterior a refatoração visual do shell e publicá-la antes de qualquer migração de runtime.

Resultado:

- estilos estáticos do shell foram extraídos de `src/App.jsx`;
- foram criados:
  - `src/components/shell/DesktopRefinementStyles.jsx`;
  - `src/components/shell/MobileFinalStyles.jsx`;
  - `src/components/shell/MobileUxPatchStyles.jsx`;
- as funções `renderDesktopRefinoStyle`, `renderMobileFinalStyle` e `renderMobileUxFinalPatchStyle` foram removidas;
- referências a `dashboard-operational-*` e `branch-ranking-*` foram removidas;
- seletores, ordem de aplicação e comportamento visual foram preservados;
- nenhuma regra financeira ou funcional foi alterada.

Commit:

- `75dec49` — `refactor: separa estilos do shell e remove legado visual`

Backup já existente e preservado:

- `backup-main-antes-auditoria-refatoracao-completa-20260710`

## 3. Ciclo 1 — migração isolada para Node 24

Objetivo: atualizar somente as declarações ativas de runtime, sem atualizar dependências.

Alterações:

- `.nvmrc`: Node 24;
- `package.json`: `engines.node` em `24.x`;
- `README.md`: referência operacional atualizada para Node 24.

Não alterado:

- `package-lock.json`;
- dependências;
- workflows;
- configurações históricas arquivadas.

Commit:

- `4a68985` — `chore: atualiza runtime para node 24`

Backup:

- `backup-main-antes-node-24-20260710`

## 4. Ciclo 2 — auditoria visual completa da V1

A auditoria cobriu desktop e mobile nas áreas principais da V1, incluindo shell, menu, cabeçalho, Painel, Contas, Recorrências, Agenda, Relatórios, Fluxo de Caixa, Funcionários, Férias, Fechamento de Folha e Configurações.

Critérios observados:

- carregamento e tela branca;
- console;
- cortes, sobreposições e scroll horizontal;
- alinhamento de botões e campos;
- menu mobile e sidebar compacta;
- modais, tabelas, filtros, formulários, vazios e loading.

A validação visual consolidada foi posteriormente confirmada pelo responsável do projeto. Não foi criado commit vazio para a auditoria.

## 5. Ciclo 3 — limpeza segura de CSS legado

Objetivo: remover somente CSS comprovadamente sem uso, sem apagar seletores dinâmicos, globais, de impressão ou de bibliotecas.

Resultado:

- remoções restritas a estilos comprovadamente órfãos;
- `legacy-dashboard.css` foi preservado;
- classes dinâmicas, lazy components e seletores Recharts não foram removidos automaticamente;
- build e `git diff --check` foram executados.

Commit:

- `b1e0e88` — `refactor: remove estilos legados sem uso`

## 6. Ciclo 4 — redução gradual do App.jsx

Objetivo: reduzir responsabilidades do componente principal sem alterar navegação, providers, permissões ou regras financeiras.

Resultado:

- composição de responsabilidades foi extraída em pacote coerente;
- ordem de providers, `Suspense`, error boundaries, contexts, hooks e handlers foi preservada;
- não houve reescrita total do aplicativo.

Commit:

- `d1dc883` — `refactor: reduz responsabilidades do app principal`

## 7. Preparação para o Ciclo 5

Antes da padronização visual, `AppShellStyles.jsx` foi normalizado em ciclo isolado para evitar diffs massivos causados por fim de linha e whitespace histórico.

Commit:

- `cc92887` — `chore: normaliza formatacao dos estilos do shell`

Backup:

- `backup-main-antes-normalizacao-app-shell-styles-20260710`

## 8. Ciclo 5 — padronização visual gradual da V1

Objetivo: centralizar cores, superfícies, bordas, sombras e estados em tokens locais por domínio, sem redesenho amplo e sem alterar valores efetivos.

Método aplicado em cada lote:

1. confirmar `main`, HEAD e worktree limpa;
2. ler e delimitar o bloco;
3. criar backup temporário;
4. substituir literais por variáveis locais;
5. comparar seletores e ocorrências de `!important` antes/depois;
6. expandir os tokens automaticamente para confirmar equivalência semântica;
7. executar build, `git diff --check`, stat e status;
8. stagedar somente `src/styles.css` ou o arquivo autorizado;
9. commitar, enviar e confirmar deploy `READY` na Vercel.

### 8.1 Shell e componentes compartilhados

- `803bf4a` — tokens visuais do shell;
- `2b5f067` — menu mobile;
- `b67178a` — cabeçalho;
- `aee8620` — botões compartilhados;
- `e1c7036` — estados de botões compartilhados.

### 8.2 Financeiro

- `e297f2b` — tokens neutros de Contas;
- `c25f892` — Recorrências Financeiras;
- `21f2335` — Fluxo de Caixa;
- `d867115` — Relatórios;
- `e5dcf6c` — Fechamento de Folha;
- `f26eb93` — modais de Contas;
- `2ce0e01` — Relatórios Financeiros;
- `a08d675` — Folha;
- `dcc8f62` — Importação de Contas;
- `9335469` — Relatórios de Contas.

### 8.3 Gestão de Pessoas

- `6d2a706` e `370c6cb` — Funcionários em lotes progressivos;
- `d309e6d` e `5d5fd40` — Férias em lotes progressivos;
- `80e823a` — Relatórios de Pessoas;
- `b61eef7` — Relatórios de Gestão de Pessoas;
- `045a580` — Gestão de Usuários.

### 8.4 Administração, produtividade e navegação

- `e1672c6` e `81194ee` — Administração/Configurações;
- `d42f8ab` — Agenda;
- `f07b19d` — Notas;
- `5c43224` — Notas e Lixeira;
- `c40ebbe` — Perfil;
- `135b5ba` — FAB e menu flutuante;
- `530de39` — filiais e permissões;
- `7d407f4` — topo e configurações.

### 8.5 Domínios finais

- `805cff9` — Plano comercial;
- `0fe1f27` — ajustes de Onboarding integrados pela PR #1;
- `c6084ba` — Painel;
- `095d514` — tela de recuperação da aplicação.

Em todos esses lotes, a intenção foi preservar os valores CSS efetivos. Não foram introduzidas mudanças de regra financeira, permissão ou navegação como parte da padronização.

## 9. Trabalho de segurança e autenticação ocorrido durante os ciclos

Esse trabalho não fez parte da padronização visual, mas entrou na `main` durante o período e precisa permanecer documentado.

### 9.1 Auditoria e hardening

Foram revisados:

- login, logout, sessão máxima e inatividade;
- senha provisória e recuperação de senha;
- criação e convite de usuários;
- perfis Master/Admin e isolamento por empresa;
- Edge Functions, RLS, funções `SECURITY DEFINER`, índices e alertas do Supabase.

Principais entregas integradas:

- `AuthSecurityGate`;
- `ResetPasswordPage`;
- bloqueio enquanto `must_change_password=true`;
- senha mínima de 12 caracteres;
- tratamento de `PASSWORD_RECOVERY`;
- melhorias de sessão e remoção de vínculo duplicado no login;
- ajustes em criação e convite de usuários;
- Edge Function `concluir-troca-senha`;
- ajustes nas funções `criar-usuario-manual` e `convidar-usuario`;
- `vercel.json` com rewrite SPA para acesso direto a `/reset-password`.

Commits principais:

- `76c3c5f` — pacote inicial de segurança;
- `1d1d274` — habilitação da rota de recuperação;
- `7ac8cc3` — retorno ao login após troca de senha.

### 9.2 Correção da troca obrigatória de senha

Causa raiz confirmada:

- a atualização administrativa da senha revogava o refresh token atual;
- o frontend chamava `refreshSession()` e `getUser()` após a troca;
- o refresh falhava e o usuário antigo continuava com `must_change_password=true`.

Correção:

- remoção de `refreshSession()` e `getUser()` após o sucesso;
- prevenção de dupla submissão;
- logout e limpeza da URL;
- retorno automático para `/` e reapresentação do login.

Validações:

- mínimo de 12 caracteres preservado;
- build aprovado com 808 módulos;
- `/reset-password` respondeu HTTP 200 em produção.

### 9.3 Sincronização de migrations já aplicadas

Arquivos adicionados ao Git, sem nova execução no Supabase:

- `20260711230519_enforce_password_upgrade_for_existing_users.sql`;
- `20260711231720_performance_drop_duplicate_indexes.sql`;
- `20260711231755_performance_optimize_core_rls_initplan.sql`;
- `20260711231940_rollback_unintended_existing_password_upgrade.sql`.

A última migration desfaz a marcação indevida de usuários antigos e preserva os usuários originalmente provisórios.

## 10. Validações finais

- builds de produção aprovados durante todos os lotes;
- build final: 808 módulos transformados;
- `git diff --check`: aprovado;
- branch `main` sincronizada com `origin/main`;
- worktree limpa ao final dos ciclos;
- deploy final da padronização: `dpl_5GTRM92AvSrN5jT69mhEpQ38qnKu`, estado `READY`;
- rota pública `/reset-password`: HTTP 200;
- validação visual desktop/mobile confirmada pelo responsável do projeto.

## 11. Riscos residuais e backlog

- O teste real completo de autenticação com e-mail depende de credenciais e interação manual: primeiro acesso, troca obrigatória, novo login, recuperação e link expirado/utilizado.
- A auditoria final encontrou 260 linhas com literais CSS em camadas históricas de Contas/Notas e overrides relacionados. Elas não representam regressão comprovada e não foram alteradas em massa por risco de precedência. Devem ser tratadas somente em novo planejamento gradual.
- A branch remota `fix/auth-password-return-login` contém o commit original `e17b60e`; a correção equivalente foi integrada na `main` como `7ac8cc3`.

## 12. Rollback

Para desfazer um lote específico:

```bash
git revert <commit_sha>
git push origin main
```

Para a correção de troca de senha:

```bash
git revert 7ac8cc3
git push origin main
```

Para os dois últimos lotes visuais:

```bash
git revert 095d514
git revert c6084ba
git push origin main
```

Não usar `git reset --hard` como procedimento operacional de rollback.

## 13. Estado de encerramento

Os Ciclos 0–5 foram executados e publicados na V1. O planejamento atual é considerado encerrado, com os riscos residuais registrados como backlog separado. A V2 permaneceu fora do escopo.