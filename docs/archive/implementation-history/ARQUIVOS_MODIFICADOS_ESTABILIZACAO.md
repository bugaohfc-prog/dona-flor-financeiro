# Arquivos modificados nesta estabilizacao

Data: 2026-05-18
Projeto: Dona Flor Financeiro
Escopo: restauracao da baseline funcional e ajustes minimos de estabilizacao

## Codigo/configuracao alterados

- `package.json`
  - Script `build` ajustado para `vite build --configLoader runner`.
  - Objetivo: garantir `npm run build` OK no ambiente atual sem alterar o codigo da aplicacao.

- `src/routes/lazyRoutes.js`
  - Adicionado alias `master-empresas` para `masterPanel`.
  - Objetivo: alinhar o preload lazy ao nome de tela usado pelo menu.

## Documentacao gerada para o pacote

- `RELATORIO_TECNICO_BASELINE.md`
  - Relatorio tecnico resumido da estabilizacao.

- `HOMOLOGACAO_STATUS.md`
  - Status atual da homologacao, pendencias, riscos e proximos passos.

- `ARQUIVOS_MODIFICADOS_ESTABILIZACAO.md`
  - Lista auditavel dos arquivos alterados nesta estabilizacao.

## Confirmacao de escopo

- Sem refactor estrutural.
- Sem alteracao nos fluxos de negocio.
- Sem movimentacao de pastas.
- Sem criacao de `config` ou `routes` na raiz.
- Importador CSV preservado.
- Automacao de email preservada.
