# Arquitetura - Fechamento de Folha V1

Data: 2026-07-03
Branch: `main`

## Objetivo

Registrar a reorganização inicial da frente de Fechamento de Folha V1 depois da decisão de pausar/abandonar a V2 e evoluir a V1 atual em produção.

## Arquivos criados

- `src/modules/folha/components/fechamento/FolhaSectionHeader.jsx`
- `src/modules/folha/components/fechamento/FolhaContextoColaboradorAtivo.jsx`

## Arquivos alterados

- `src/pages/FechamentoFolhaPage.jsx`
- `docs/projeto/status-frentes-ativas.md`

## Responsabilidades

### `src/pages/FechamentoFolhaPage.jsx`

Continua sendo a página V1 atual da rota de Fechamento de Folha.

Responsabilidades mantidas:

- Orquestrar competência selecionada.
- Carregar funcionários, lançamentos e itens pelo fluxo existente.
- Controlar formulários de competência, lançamento e item.
- Chamar `useFolha` e `useFuncionarios`.
- Preservar o fluxo atual de persistência.

### `FolhaSectionHeader.jsx`

Componentes visuais reutilizáveis para seções e subseções da tela.

Responsabilidades:

- Cabeçalho de seção.
- Cabeçalho de subseção.
- Botão de expandir/recolher.

### `FolhaContextoColaboradorAtivo.jsx`

Painel operacional do colaborador em edição.

Responsabilidades:

- Mostrar colaborador ativo.
- Mostrar cargo, filial e competência.
- Mostrar totais e pendências do colaborador.
- Expor ações de continuar lançando e voltar para todos.

## O que foi preservado

- Mesma rota da V1.
- Mesmo hook `useFolha`.
- Mesmo service `folhaService`.
- Mesmas tabelas e persistência existentes.
- Mesma lógica principal de lançamento, itens, vales/compras, horas extras, faltas e conferência.
- Nenhuma regra financeira/trabalhista nova.
- Nenhuma alteração de banco.

## Próximos ajustes recomendados

- Extrair cálculos auxiliares para `src/modules/folha/utils/fechamento/`.
- Extrair a área de itens detalhados para componente próprio.
- Extrair a lista desktop/mobile de lançamentos para componentes menores.
- Revisar textos com acentuação em uma limpeza controlada.
- Validar uso real na competência 06/2026 antes de novas mudanças amplas.

## Rollback

```bash
git revert <commit>
git push origin main
```
