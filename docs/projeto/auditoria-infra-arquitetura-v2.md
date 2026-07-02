# Auditoria de infraestrutura e arquitetura para V2

Data: 2026-07-02

## Resumo executivo

O projeto é uma aplicação React/Vite com Supabase. A V1 está funcional, mas a arquitetura cresceu em páginas grandes, serviços parcialmente centralizados e lógica financeira ainda relevante no frontend. A V2 deve começar por estabilizar infraestrutura e modularizar por domínio antes de reescrever fluxos.

## Configuração encontrada

Arquivos encontrados:

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `.nvmrc`
- `_redirects`

Arquivos não encontrados no repositório:

- `vercel.json`

## Package/scripts

Scripts:

- `dev`: `vite`
- `build`: `vite build --configLoader runner`
- `preview`: `vite preview`
- `supabase:deploy:auth`: deploy de Edge Functions de usuários
- `supabase:secrets:auth`: exemplo de secrets, não executar sem autorização
- `supabase:db:push`: não executar sem autorização

Dependências principais:

- React `^18.2.0`
- React DOM `^18.2.0`
- Supabase JS `^2.39.0`
- Recharts `^2.12.7`
- Vite `^6.4.2`
- Plugin React Vite `^4.2.1`

## Node 20/22/24

Estado encontrado:

- `package.json` declara `engines.node = 20.x`.
- `.nvmrc` contém `20`.
- Ambiente local reportou `node v24.15.0`.
- `npm` local reportou `11.12.1`.

Recomendação:

- Produção/Vercel deve permanecer em Node 20 enquanto a V1 estiver em produção.
- Node 22 pode ser avaliado em branch/deploy preview após build e smoke test.
- Node 24 não deve ser adotado diretamente sem auditoria de compatibilidade, porque o projeto declara 20.x e Vercel pode usar defaults diferentes em projetos novos.
- Fixar/confirmar Node no painel da Vercel antes da virada.

## Vercel

Não há `vercel.json` no repositório. A configuração pode estar no painel da Vercel.

Verificação manual recomendada:

`Vercel > Project > Settings > Build and Deployment > Node.js Version`

Pontos a conferir:

- Framework: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Node.js Version: recomendado manter 20.x por enquanto.
- Variáveis esperadas sem expor valores:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - secrets das Edge Functions no Supabase, não na Vercel se não forem usados no frontend.

## Build/deploy

Build definido:

- `npm.cmd run build` executa `vite build --configLoader runner`.

Build não foi executado neste ciclo porque a alteração é documental. O projeto possui `vite` em `devDependencies` e `package-lock.json`, então falha por `vite` ausente indicaria ambiente local sem `node_modules`, não necessariamente erro de configuração.

## Dependências de PDF/Excel/exportação

Padrões encontrados:

- Relatórios de Contas usam CSV via `Blob`, Excel HTML `.xls` e impressão/PDF via `window.print`.
- `src/services/export/reportExportService.js` possui utilitário para CSV, impressão HTML e `createXlsxBlob` simples.
- Não há biblioteca dedicada pesada de PDF no `package.json`.
- Não há biblioteca externa dedicada de template XLSX no `package.json`.

Risco:

- Fluxo de Caixa com modelo XLSX fiel pode exigir evolução do utilitário existente ou ciclo próprio para template/biblioteca.
- Não instalar dependência nova sem autorização e análise de bundle/build.

## Páginas grandes

Maiores páginas por linhas:

| Arquivo | Linhas aproximadas | Risco |
| --- | ---: | --- |
| `src/pages/FechamentoFolhaPage.jsx` | 2279 | Muito alto |
| `src/pages/Relatorios.jsx` | 1702 | Alto |
| `src/pages/FeriasPage.jsx` | 1680 | Alto |
| `src/pages/RelatoriosGestaoPessoasPage.jsx` | 942 | Alto |
| `src/pages/FuncionariosPage.jsx` | 881 | Alto |
| `src/pages/RelatoriosFeriasPage.jsx` | 738 | Médio/alto |
| `src/pages/ContasPage.jsx` | 722 | Médio/alto |
| `src/pages/RelatoriosContasPage.jsx` | 631 | Médio/alto |

## Responsabilidades misturadas

- `FechamentoFolhaPage.jsx`: competência, resumo, lançamento, itens, edição, arquivamento e conferência.
- `Relatorios.jsx`: análise financeira, exportação, ranking, widgets e HTML de impressão.
- `FeriasPage.jsx`: regras, formulários, listagem, status e UI.
- `RelatoriosContasPage.jsx`: filtros, agrupamento, período, exportações e preparação visual.
- `App.jsx`: ainda contém fluxos legados de contas/importação/configurações e integração de módulos.

## Proposta de arquitetura futura

Estrutura sugerida:

```text
src/modules/contas/
  pages/
  components/
  services/
  hooks/
  utils/
  reports/

src/modules/gestao-pessoas/
  pages/
  components/
  services/
  hooks/
  reports/

src/modules/admin/
src/modules/auditoria/
src/modules/shared/
```

Ordem de refatoração recomendada:

1. Relatórios de Contas / Fluxo de Caixa, porque há demanda funcional clara.
2. Fechamento de Folha, porque já teve remendos e precisa modo V2.
3. Gestão de Pessoas/Funcionários/Férias.
4. Relatórios gerais e Painel.
5. App shell e estilos globais.

## Supabase/conexões

Client:

- `src/lib/supabase.js` cria o client com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Padrões encontrados:

- Services concentram parte das queries (`contasService`, `usuariosService`, `tenantService`, `filiaisService`, etc.).
- Algumas páginas ainda chamam Supabase diretamente, incluindo `Relatorios.jsx`, `OnboardingPage.jsx` e trechos legados em `App.jsx`.
- Edge Functions existentes:
  - `convidar-usuario`
  - `criar-empresa-master`
  - `criar-usuario-manual`
  - `listar-usuarios-empresa`
  - `registrar-auditoria-evento`
- RPCs ainda usadas em login/tenant e scripts.

Riscos:

- Lógica de negócio no frontend pode divergir de regras de banco.
- Queries espalhadas dificultam rollback.
- `empresa_id` e `filial_id` precisam permanecer explícitos em todos os módulos V2.
- SECURITY DEFINER/RLS continuam frente sensível separada.

## Qualidade do código

Pontos de atenção:

- Páginas com estado demais.
- Filtros duplicados entre relatórios.
- Exportações repetidas em mais de um padrão.
- Cálculos financeiros no frontend.
- CSS global grande e histórico.
- Falta de componentes menores em Folha/Relatórios.
- Serviços bons em alguns módulos, mas ainda não universais.

## O que não alterar ainda

- Node/versionamento de runtime.
- `package.json`.
- RLS/policies/functions/grants.
- Banco/migrations.
- Vercel settings.
- Secrets.
- Remoção de páginas V1.
- Refatoração ampla sem rota/rollback.
