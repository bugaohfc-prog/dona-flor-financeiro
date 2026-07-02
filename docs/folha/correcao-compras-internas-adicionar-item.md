# Correção - compras internas ao adicionar item na folha

Data: 2026-07-02

## Problema relatado

Na tela de fechamento de folha, em lançamentos de compras internas/vales, o usuário preenchia o primeiro item e acionava `Adicionar item`. O formulário era limpo e fechado, causando a percepção de que o primeiro item preenchido havia sido perdido e precisava ser lançado novamente.

## Causa encontrada

O fluxo de salvamento do item detalhado executava o `INSERT` pelo hook da folha e, após sucesso, fazia:

- fechamento do formulário de item;
- reset do estado local `formItem`;
- reabertura dependente de nova ação do usuário.

Além disso, o botão de abertura `+ item` sempre reinicializava `formItem`, mesmo quando o formulário do mesmo lançamento já estava aberto com um rascunho preenchido.

## Arquivos alterados

- `src/pages/FechamentoFolhaPage.jsx`
- `docs/folha/correcao-compras-internas-adicionar-item.md`

## Comportamento antes

Ao salvar o primeiro item:

- o formulário era fechado;
- o rascunho local era descartado;
- o usuário precisava abrir novamente a inclusão;
- em uso real, isso parecia perda do primeiro item.

## Comportamento depois

Ao salvar um item com sucesso:

- o painel do lançamento permanece aberto;
- o formulário continua aberto e pronto para o próximo item;
- o item salvo permanece no contexto do lançamento;
- um novo formulário vazio é preparado para o próximo item;
- clicar novamente em `+ item` no mesmo lançamento não apaga um rascunho já preenchido.

## Cenário de teste manual

1. Abrir `Folha / Fechamento`.
2. Selecionar uma competência aberta.
3. Abrir um lançamento de categoria `Compras internas / vales`.
4. Acionar `+ item`.
5. Preencher valor e, se necessário, descrição/observação administrativa.
6. Clicar em `Adicionar item`.
7. Confirmar que o painel de itens continua aberto.
8. Confirmar que o primeiro item aparece na lista após o salvamento/recarregamento.
9. Confirmar que o formulário fica pronto para o próximo item.
10. Preencher um segundo item e confirmar que o primeiro não é apagado.
11. Testar edição/arquivamento de item existente, se operacionalmente seguro.

## Confirmações

- Banco: não alterado.
- RLS/policies/functions/grants: não alterados.
- Migration: não criada.
- Logs/auditoria: não alterados.
- Regra de fechamento da folha: não alterada fora da preservação do formulário/lista de itens.
- Layout amplo: não redesenhado neste ciclo.

## Próximo ciclo recomendado

Avaliar melhoria visual específica da área de itens detalhados da folha, separada desta correção funcional, para deixar mais claro o estado "item salvo" e o formulário "novo item".
