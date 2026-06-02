# Relatorio tecnico - baseline estavel de homologacao

Projeto: Dona Flor Financeiro
Data: 2026-05-18
Baseline: restaurada a partir do ZIP funcional informado pelo usuario
Pacote sugerido: dona-flor-financeiro-baseline-estavel-homologacao-2026-05-18.zip

## Resumo executivo

Esta baseline foi restaurada usando o ZIP fornecido como fonte confiavel. As alteracoes quebradas posteriores nao foram reaproveitadas. A estrutura original foi mantida, com configuracoes e rotas apenas em `src/config` e `src/routes`.

Nao houve refactor estrutural. Foram feitos somente ajustes pequenos e seguros para estabilizar o build e alinhar o preload das rotas lazy com o menu existente.

## Validacoes executadas

- `npm install`: OK.
- `npm run build`: OK.
- Build de producao gerado em `dist`.
- `lazyRoutes.js`: estabilizado.
- Menu lateral/mobile: estabilizado por verificacao dos nomes de tela e renderizacao correspondente.
- Importador CSV: preservado.
- Automacao de email: preservada, sem alteracoes nesta estabilizacao.
- Baseline restaurada: OK.
- Sem refactor estrutural: OK.

## Arquivos modificados nesta estabilizacao

- `package.json`
  - Ajuste do script `build` para `vite build --configLoader runner`.
  - Motivo: neste ambiente, o carregador padrao do Vite acionava o esbuild para carregar `vite.config.js` e falhava com acesso negado ao procurar diretorios pais. O carregador `runner` e uma opcao oficial do Vite e manteve o build funcional sem alterar o codigo da aplicacao.

- `src/routes/lazyRoutes.js`
  - Adicionado o alias `master-empresas` apontando para `masterPanel`.
  - Motivo: o menu usa a tela `master-empresas`; o alias evita perda de preload lazy para essa tela e preserva o comportamento existente.

## Estrutura preservada

- Mantido `src/config/menuSections.js`.
- Mantido `src/routes/lazyRoutes.js`.
- Nao foram criadas pastas `config` ou `routes` na raiz.
- Nao foram movidas pastas.
- Nao houve reorganizacao estrutural.

## Causa do problema corrigido

O problema principal nao estava no codigo funcional do app. A falha ocorria antes da compilacao da aplicacao, no carregamento do `vite.config.js`, porque o Vite usando o carregador padrao tentava resolver o arquivo via esbuild e o ambiente bloqueava leitura de diretorios pais. Com `--configLoader runner`, o build executa corretamente.

Tambem havia um desalinhamento pequeno entre o nome de tela usado no menu (`master-empresas`) e o mapa de preload de rotas lazy, corrigido por alias.

## Estado atual

Baseline estavel para continuidade da homologacao.

O pacote desta baseline deve ser usado como ponto de recuperacao antes de novas mudancas. Para recuperar:

1. Extrair o ZIP.
2. Rodar `npm install`.
3. Rodar `npm run build`.
4. Continuar homologacao a partir dos fluxos listados em `HOMOLOGACAO_STATUS.md`.

## Observacoes importantes para proximas alteracoes

- Evitar refactors enquanto a homologacao estiver em andamento.
- Manter `src/config` e `src/routes` como unicas pastas de configuracao/rotas.
- Nao recriar `config` ou `routes` na raiz.
- Validar `npm run build` apos qualquer ajuste.
- Testar importacao CSV com usuario autenticado e empresa vinculada antes de considerar o fluxo 100% homologado em banco real.
- Preservar automacoes de email e configuracoes existentes ate haver uma tarefa especifica para altera-las.
