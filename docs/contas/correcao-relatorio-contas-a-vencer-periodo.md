# Correção do período do relatório de contas a vencer

Data: 2026-07-02

## Problema relatado

Ao gerar ou imprimir o relatório de contas a vencer, o usuário ficava limitado ao recorte curto dos próximos 15 dias. Esse comportamento não atendia conferências mais amplas, como vencimentos de 30, 60 ou 90 dias.

## Causa encontrada

O relatório de contas usava a lista filtrada da tela de relatórios e não possuía uma opção objetiva de período operacional para "Contas a vencer". A alternativa existente era preencher datas manualmente, o que não deixava claro como ampliar rapidamente o relatório.

O ajuste foi feito em:

- `src/pages/RelatoriosContasPage.jsx`

O PDF/CSV/Excel continuam usando `contasFiltradas`, portanto o período escolhido no filtro passa a ser respeitado também na impressão/exportação.

## Nova solução

Foi adicionado o filtro "Período do relatório" na página de Relatórios de Contas, com as opções:

- Próximos 15 dias
- Próximos 30 dias
- Próximos 60 dias
- Próximos 90 dias
- Todas em aberto

O padrão permanece "Próximos 15 dias" para manter compatibilidade com o comportamento operacional anterior.

## Comportamento antes

- O usuário não tinha uma seleção clara de janela do relatório de contas a vencer.
- Para ampliar o período, precisava ajustar datas manualmente.
- A impressão/PDF refletia apenas o conjunto filtrado sem indicar a janela operacional escolhida.

## Comportamento depois

- O usuário escolhe o período do relatório antes de gerar PDF/CSV/Excel.
- "Próximos 15 dias" preserva o recorte curto anterior.
- "Próximos 30/60/90 dias" amplia as contas a vencer dentro da janela escolhida.
- "Todas em aberto" remove a limitação de dias e considera contas abertas, sem incluir contas pagas.
- Filtros de filial, centro, busca e datas manuais continuam funcionando em conjunto com o período escolhido.

## Observações de segurança funcional

- Nenhuma regra de baixa, pagamento, estorno, parcial, importação ou recorrência foi alterada.
- Nenhum service/hook foi alterado.
- Nenhum banco, RLS, policy, function, grant ou migration foi alterado.
- O relatório continua respeitando os dados já carregados e as permissões existentes do app.

## Checklist manual

1. Abrir a área de Contas.
2. Acessar Relatórios de Contas.
3. Selecionar tipo "A vencer" ou manter o relatório em aberto.
4. Gerar com "Próximos 15 dias" e confirmar o comportamento antigo.
5. Gerar com "Próximos 30 dias" e confirmar contas além de 15 dias.
6. Gerar com "Próximos 60 dias".
7. Gerar com "Próximos 90 dias".
8. Gerar com "Todas em aberto" e confirmar que a lista não fica limitada a 15 dias.
9. Confirmar que contas pagas não aparecem quando o recorte for "Todas em aberto".
10. Confirmar que filtros de filial e centro continuam funcionando.
11. Confirmar que PDF/impressão respeita o período escolhido.

## Rollback

Rollback Git:

```bash
git revert <commit>
```
