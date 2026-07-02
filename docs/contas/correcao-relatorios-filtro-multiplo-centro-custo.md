# Correção do filtro múltiplo de centro de custo nos relatórios

Data: 2026-07-02

## Problema relatado

Nos Relatórios de Contas, o filtro de centro de custo permitia selecionar apenas um centro por vez. Para comparar ou consolidar mais de um centro, o usuário precisava gerar relatórios separados.

## Causa encontrada

O filtro usava um `select` simples com estado único (`filtroCentro`). A lista filtrada aplicava a condição `centro_custo_id === filtroCentro`, portanto só um centro podia participar do relatório por vez.

Como PDF, CSV e Excel usam a mesma lista `contasFiltradas`, a limitação impactava também as exportações.

## Nova lógica

O filtro de centro de custo agora usa uma lista de IDs selecionados:

- nenhum centro selecionado: mostra todos os centros;
- um centro selecionado: mantém comportamento equivalente ao filtro antigo;
- vários centros selecionados: inclui contas cujo `centro_custo_id` esteja em qualquer centro selecionado.

## Interface

Foi criado um dropdown com checkboxes, seguindo o padrão visual já usado no filtro de tipo de contas.

Estados exibidos:

- `Todos os centros de custo`
- `1 centro selecionado`
- `X centros selecionados`

Ações disponíveis:

- selecionar todos;
- limpar seleção.

## Impacto em PDF/CSV/Excel

Não foi criado novo caminho de exportação. A tela, o PDF compacto, o PDF gerencial, CSV e Excel continuam usando a mesma lista filtrada (`contasFiltradas`).

Com isso, quando dois ou mais centros são selecionados, a visualização e todas as exportações usam exatamente o mesmo recorte.

## Arquivos alterados

- `src/pages/RelatoriosContasPage.jsx`
- `src/styles.css`
- `docs/contas/correcao-relatorios-filtro-multiplo-centro-custo.md`

## Confirmações de escopo

- Banco não foi alterado.
- RLS, policies, functions, grants e migrations não foram alterados.
- Services/hooks não foram alterados.
- Regras de pagamento, baixa, estorno, parcial, importação e recorrência não foram alteradas.

## Checklist manual

1. Abrir Relatórios de Contas.
2. Deixar nenhum centro de custo selecionado e confirmar que mostra todos.
3. Selecionar 1 centro e confirmar comportamento equivalente ao antigo.
4. Selecionar 2 centros e confirmar que consolida ambos no mesmo relatório.
5. Selecionar 3 ou mais centros, se houver.
6. Limpar seleção.
7. Testar junto com filtro de tipo.
8. Testar junto com período.
9. Testar junto com contas a vencer 30/60/90 dias.
10. Gerar PDF compacto e confirmar múltiplos centros.
11. Gerar PDF gerencial e confirmar múltiplos centros.
12. Gerar CSV e confirmar múltiplos centros.
13. Gerar Excel e confirmar múltiplos centros.

## Rollback

Rollback Git:

```bash
git revert <commit>
```
