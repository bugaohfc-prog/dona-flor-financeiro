# Redesenho operacional - Fechamento de Folha V1

Data: 2026-07-03
Branch: `v2/virada-controlada`

## Objetivo

Melhorar a tela atual de Fechamento de Folha V1 para apoiar o fechamento da competência 06/2026 com menos perda de contexto e mais clareza por colaborador.

## Mudanças aplicadas

- Modo de trabalho por colaborador reforçado ao clicar em `+ lançamento`.
- Após salvar lançamento, o colaborador permanece selecionado.
- O formulário limpa apenas os campos do próximo lançamento e mantém funcionário/filial do colaborador ativo.
- Painel operacional do colaborador ativo com cargo, filial, competência, totais, vales/compras, horas extras, faltas, itens e pendências.
- Resumo rápido da conferência geral com colaboradores, pendentes, conferidos, vales/compras, lançamentos sem itens e saldo atual.
- Ação para marcar ou reabrir conferência do lançamento usando o campo existente `conferido`.
- Área de itens detalhados mostra total dos itens ativos, com destaque para vales/compras.

## Preservado

- Nenhuma regra de cálculo trabalhista nova foi criada.
- Nenhuma estrutura de banco foi alterada.
- Nenhuma migration foi criada.
- Nenhum SQL foi executado.
- V2, Contas, Relatórios, Admin e Auditoria não foram alterados.
- A V1 continua usando `useFolha` e `folhaService`.

## Checklist manual

1. Abrir Fechamento de Folha.
2. Selecionar a competência 06/2026.
3. Clicar em `+ lançamento` em uma colaboradora.
4. Confirmar que a tela entra no contexto da colaboradora.
5. Salvar um lançamento.
6. Confirmar que a colaboradora permanece selecionada.
7. Confirmar que o formulário fica pronto para novo lançamento da mesma colaboradora.
8. Abrir `+ itens` em compras internas / vales.
9. Adicionar item e confirmar que o painel permanece aberto.
10. Confirmar que o total de itens aparece na área de itens.
11. Marcar lançamento como conferido e confirmar atualização visual.
12. Voltar para todos os colaboradores.
13. Confirmar que a lista geral e a busca continuam disponíveis.

## Rollback

Usar:

```bash
git revert <commit>
```
