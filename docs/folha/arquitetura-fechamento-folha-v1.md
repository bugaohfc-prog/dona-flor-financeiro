# Arquitetura - Fechamento de Folha V1

Data: 2026-07-03
Branch: `main`

## Objetivo

Registrar a reorganização da frente de Fechamento de Folha V1 depois da decisão de pausar/abandonar a V2 e evoluir a V1 atual em produção.

## Estrutura atual

### Página orquestradora

- `src/pages/FechamentoFolhaPage.jsx`

Responsabilidades preservadas:

- Orquestrar competência selecionada.
- Carregar funcionários, lançamentos e itens pelo fluxo existente.
- Controlar formulários de competência, lançamento e item.
- Chamar `useFolha` e `useFuncionarios`.
- Preservar o fluxo atual de persistência.
- Delegar apresentação de contexto, lista, ações e itens para componentes dedicados.

### Componentes extraídos

- `src/modules/folha/components/fechamento/FolhaSectionHeader.jsx`
- `src/modules/folha/components/fechamento/FolhaContextoColaboradorAtivo.jsx`
- `src/modules/folha/components/fechamento/FolhaResumoGrupo.jsx`
- `src/modules/folha/components/fechamento/FolhaLancamentoAcoes.jsx`
- `src/modules/folha/components/fechamento/FolhaLancamentosLista.jsx`
- `src/modules/folha/components/fechamento/FolhaItensDetalhados.jsx`

Responsabilidades:

- `FolhaSectionHeader`: cabeçalhos de seção/subseção e botão de expandir/recolher.
- `FolhaContextoColaboradorAtivo`: colaborador ativo, cargo, filial, competência, totais e retorno para todos.
- `FolhaResumoGrupo`: créditos, descontos, saldo e quantidade de lançamentos por grupo.
- `FolhaLancamentoAcoes`: abrir itens, editar, marcar/reabrir conferência e arquivar/reativar.
- `FolhaLancamentosLista`: tabela desktop e cards mobile dos lançamentos.
- `FolhaItensDetalhados`: painel e formulário dos itens detalhados do lançamento.

### Utils extraídos

- `src/modules/folha/utils/fechamento/folhaFormatters.js`

Responsabilidades:

- Formatação de datas.
- Formatação de moeda.
- Formatação de números.
- Normalização de texto/busca.
- Parsing de números de formulário.

## Comportamento preservado

- Mesma rota da V1.
- Mesmo hook `useFolha`.
- Mesmo service `folhaService`.
- Mesmas tabelas e persistência existentes.
- Mesma lógica principal de competência, lançamento, itens, vales/compras, horas extras, faltas e conferência.
- Nenhuma regra financeira/trabalhista nova.
- Nenhuma alteração de banco.

## Limpezas realizadas

- Removido bloco morto de edição de colaborador que estava protegido por `false &&`.
- Removida função antiga de renderização do contexto do colaborador, substituída pelo componente dedicado.
- Removidos formatadores locais da página principal.
- Reduzido o volume de JSX diretamente em `FechamentoFolhaPage.jsx`.
- Separada a lista desktop/mobile da área principal da página.
- Separada a área de itens detalhados, que é crítica para compras internas/vales.

## Pontos ainda pendentes

- Extrair cálculos auxiliares para utils dedicados, se o próximo ciclo exigir manutenção nesses cálculos.
- Avaliar criação de hook/view model dedicado caso os handlers continuem crescendo.
- Validar uso real na competência 06/2026 antes de novas mudanças amplas.
- Revisar textos operacionais e acentuação da página em ciclo próprio, sem misturar com regra financeira.

## Rollback

```bash
git revert <commit>
git push origin main
```
