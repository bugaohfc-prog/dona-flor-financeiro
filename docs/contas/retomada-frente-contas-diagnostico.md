# Retomada da frente Contas - diagnóstico

Data: 2026-07-01

## Resumo executivo

O módulo Contas/Financeiro está funcionalmente avançado e deve ser tratado como frente estável. Os fluxos principais de conta avulsa, baixa, correção de baixa, estorno, pagamento parcial, recorrência, parcelamento, ocultação, lixeira, impostos e relatórios já existem no app.

Este ciclo foi somente leitura/documentação. Não houve alteração de banco, app, services/hooks, migrations, RLS, policies, grants, funções Supabase ou dados.

Recomendação: retomar com um ciclo curto de usabilidade e diagnóstico visual da lista de contas, sem tocar em banco nem nas regras sensíveis de pagamento/parcelamento.

## Estado atual do módulo

Arquivos principais revisados:

- `src/hooks/useContas.js`
- `src/services/contasService.js`
- `src/components/modals/AccountModal.jsx`
- `src/components/modals/AccountPaymentModal.jsx`
- `src/components/modals/AccountPartialPaymentModal.jsx`
- `src/pages/ContasPage.jsx`
- `src/pages/ControleImpostosPage.jsx`
- `src/pages/RelatoriosContasPage.jsx`
- `src/pages/RecorrenciasFinanceirasPage.jsx`
- `src/pages/LixeiraPage.jsx`
- `src/utils/relatoriosContasExport.js`
- `src/utils/recorrencia.js`
- `src/utils/contasStatus.js`

Documentação relacionada revisada:

- `docs/financeiro/pagamento-parcial-estado-atual.md`
- `docs/financeiro/recorrencia-valor-variavel-plano.md`
- `docs/financeiro/recorrencia-valor-variavel-geracao-auditoria.md`
- `docs/financeiro/parcelamento-contas-plano.md`
- `docs/financeiro/parcelamento-edicao-grupo-plano.md`
- `docs/financeiro/pagamento-real-contas-planejamento-20260603.md`
- `docs/operacional/contas-consolidacao-inss-cp-segur-receitas-1082-1099.md`
- `docs/operacional/contas-revisao-pendentes-inss-cp-segur-1099.md`

## O que já está fechado

- Conta avulsa com descrição, valor, vencimento, filial, centro, observação, imposto e alertas.
- Listagem com abas `Abertas`, `Vencidas`, `Pagas`, `Ocultas` e `Todas`.
- Busca textual e filtros por filial, centro, mês e intervalo de datas.
- Ordenação por vencimento, valor, nome e status.
- Baixa real com valor pago, data e observação.
- Correção de pagamento de conta já paga.
- Estorno de baixa voltando a conta para pendente.
- Pagamento parcial em tabela própria `df_contas_pagamentos`.
- Estorno parcial por arquivamento lógico do pagamento parcial.
- Baixa manual quando parciais quitam a conta.
- Recorrência mensal com geração da competência atual.
- Recorrência de valor variável, com valor tratado como estimativa.
- Separação de escopo: editar somente a conta ou editar a série recorrente.
- Parcelamento como múltiplas contas independentes.
- Resumo de grupo de parcelamento no modal.
- Cancelamento de parcelamento por ocultação reversível, bloqueado quando há paga, baixa, parcial, lixeira ou ocultação.
- Ocultação/reexibição reversível de conta.
- Lixeira lógica por `excluido/excluido_em`.
- Controle de impostos com classificação por `imposto_tipo` e fallback por descrição/centro.
- Relatórios de contas com filtros, agrupamentos e exportação PDF/CSV/Excel.
- Consolidação operacional INSS / CP-SEGUR 1082+1099 documentada e concluída.
- Revisão dos 4 pendentes sem 1099 documentada.

## Pendências conhecidas

- Edição em lote de parcelamento ainda não existe; a edição individual segue como fluxo principal.
- Reexibição em lote de parcelamento não existe.
- Recalcular valor total de parcelamento ou redistribuir parcelas deve continuar fora de ciclos pequenos.
- Relatórios não possuem visão gerencial específica por grupo de parcelamento.
- Controle de impostos é visual/operacional; não executa validação fiscal automática.
- Grupos INSS / CP-SEGUR sem 1099 seguem aguardando conferência manual no relatório fiscal original.
- Filtros/listagens podem ficar densos em telas menores.
- Histórico/auditoria exibida ao usuário ainda é limitada; o app mostra estados atuais, mas não uma linha do tempo completa de alterações.
- Recorrência ignora contas na lixeira ao prevenir geração, o que pode permitir nova geração se uma conta recorrente foi enviada à lixeira.

## Riscos de mexer agora

- Pagamento parcial, baixa e estorno afetam saldo, relatórios e experiência operacional; não misturar com ajustes visuais amplos.
- Parcelamento toca vários registros por grupo; qualquer ação em lote precisa snapshot e rollback específico.
- Recorrência gera dados automaticamente; mudanças em duplicidade, lixeira ou valor variável exigem testes dedicados.
- Impostos e correções INSS já tiveram alterações reais recentes; evitar nova alteração sem evidência fiscal.
- Banco crítico, RLS, policies, grants e funções Supabase devem permanecer fora desta frente.

## Sugestões de próximas melhorias

### P1 essencial

1. Diagnóstico visual da lista de contas em desktop/mobile.
   - Revisar densidade dos cards, botões, badges e textos longos.
   - Garantir que badges de recorrência, valor variável, parcelamento, pagamento parcial e oculto não poluam a leitura.
   - Sem alterar regra de negócio.

2. Melhorar clareza dos filtros ativos.
   - Exibir chips/resumo compacto dos filtros aplicados.
   - Facilitar limpar filtros específicos.
   - Manter comportamento atual dos dados.

3. Revisar relatórios de contas para refletir pagamentos parciais.
   - Avaliar se relatório deve mostrar `pago parcial`, `saldo` e `quantidade de parciais`.
   - Não alterar cálculo de pagamento neste primeiro diagnóstico.

### P2 importante

4. Visão de parcelamento em relatórios.
   - Mostrar grupo, parcela X/Y e total do parcelamento quando aplicável.
   - Não implementar ações em lote.

5. Melhorar Controle de Impostos.
   - Separar `origem informada` e `origem estimada`.
   - Destacar possíveis duplicidades fiscais de forma menos ruidosa.
   - Incluir filtro por competência fiscal.

6. Vencimentos e alertas.
   - Revisar como alertas por e-mail/push/WhatsApp aparecem na conta.
   - Avaliar destaque para contas próximas do vencimento por janela configurável.

7. Auditoria/histórico visível.
   - Planejar exibição de eventos relevantes: baixa, estorno, parcial, ocultação, reexibição e lixeira.
   - Não mexer em triggers/auditoria de banco neste ciclo.

### P3 melhoria futura

8. Reexibição em lote de parcelamento.
   - Só depois de validar cancelamento atual em produção.

9. Edição administrativa em lote de parcelamento.
   - Apenas campos seguros, com bloqueio para parcelas pagas/parciais.

10. Relatório gerencial de fluxo de caixa por competência.
    - Separar previsto, realizado, parcial pago, saldo e impostos.

11. Diagnóstico de recorrência com lixeira.
    - Avaliar se conta recorrente na lixeira deve ou não bloquear nova geração.

12. Guia operacional interno de Contas.
    - Documento curto para diferenciar conta avulsa, recorrência, parcelamento, ocultação e lixeira.

## Próximo ciclo curto recomendado

Executar uma revisão de usabilidade da tela `Contas` sem alterar regras:

- foco em layout mobile/desktop;
- chips de filtros ativos;
- legibilidade de badges;
- clareza de ações `Baixar`, `Parcial`, `Estornar`, `Corrigir`, `Ocultar` e `Excluir`;
- sem mexer em pagamentos, parciais, recorrência, parcelamento, banco ou services.

Essa é a menor frente útil porque melhora operação diária sem tocar em lógica financeira sensível.

## Confirmações

- Banco: não alterado.
- Dados: não alterados.
- Schema/migration: não alterados.
- RLS/policies/grants/functions Supabase: não alterados.
- Frontend: não alterado.
- Services/hooks: não alterados.
- Scripts: não alterados.
- Correções INSS / CP-SEGUR: não alteradas.
