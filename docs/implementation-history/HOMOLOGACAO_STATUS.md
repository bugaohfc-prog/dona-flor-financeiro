# Homologacao - status da baseline estavel

Projeto: Dona Flor Financeiro
Data: 2026-05-18
Estado: baseline estavel restaurada e pronta para continuidade da homologacao

## Funcionalidades homologadas

- Restauracao da baseline funcional a partir do ZIP informado.
- Instalacao de dependencias com `npm install`.
- Build de producao com `npm run build`.
- Estrutura de pastas preservada:
  - `src/config`
  - `src/routes`
- Ausencia de `config` e `routes` na raiz.
- `lazyRoutes.js` estabilizado.
- Menu estabilizado:
  - itens do menu apontam para telas existentes;
  - alias `master-empresas` ajustado para preload lazy;
  - telas internas seguem renderizadas no `App.jsx`.
- Importador CSV preservado:
  - aceita arquivo `.csv`;
  - faz leitura UTF-8;
  - aceita separador `;` ou `,`;
  - respeita aspas;
  - prepara linhas para revisao;
  - valida descricao, valor e vencimento antes de importar.
- Automacao de email preservada, sem alteracao nesta estabilizacao.
- Sem refactor estrutural.

## Funcionalidades pendentes

- Teste de importacao CSV em ambiente autenticado com Supabase ativo.
- Teste real de insert em `df_contas` com empresa vinculada.
- Teste de criacao automatica de centro de custo e filial durante importacao.
- Teste ponta a ponta das automacoes de email.
- Homologacao visual completa do menu em desktop e mobile com usuario real.
- Homologacao dos fluxos de billing, filiais, usuarios e onboarding com dados reais.
- Validacao de permissoes por perfil em ambiente de homologacao.

## Riscos conhecidos

- O projeto declara Node `20.x`, mas a maquina usada na estabilizacao estava com Node `24.15.0`; o `npm install` funcionou com aviso de engine.
- O build padrao do Vite falhou neste ambiente usando o config loader padrao por restricao de acesso a diretorios pais. O script foi estabilizado com `--configLoader runner`.
- A importacao CSV compila e o fluxo foi preservado, mas a confirmacao final depende de sessao Supabase, empresa vinculada e tabelas acessiveis.
- A automacao de email foi preservada, mas nao foi executada ponta a ponta nesta rodada.
- Como a baseline vem de ZIP restaurado, novas alteracoes devem ser aplicadas de forma incremental e sempre com build apos cada passo.

## Proximos passos recomendados

1. Guardar o ZIP desta baseline como ponto de recuperacao.
2. Extrair a baseline em ambiente limpo e validar `npm install` e `npm run build`.
3. Rodar homologacao manual autenticada dos fluxos principais:
   - login;
   - menu desktop/mobile;
   - contas;
   - importacao CSV;
   - relatorios;
   - filiais;
   - usuarios;
   - automacao de email.
4. Corrigir apenas bugs encontrados na homologacao, um por vez.
5. Evitar mudancas estruturais ate concluir a homologacao da baseline.
