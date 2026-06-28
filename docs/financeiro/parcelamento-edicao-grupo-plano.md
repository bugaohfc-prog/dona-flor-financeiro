# Plano: edição e cancelamento em grupo de parcelamento

## Estado atual

O parcelamento já possui estrutura mínima em `public.df_contas`:

- `grupo_parcelamento_id uuid null`
- `parcela_numero integer null`
- `parcelas_total integer null`
- `valor_total_parcelamento numeric(12,2) null`

A constraint `df_contas_parcelamento_consistente` garante que uma conta sem parcelamento mantenha todos os campos nulos e que uma conta parcelada tenha grupo, número da parcela e total de parcelas coerentes.

A criação atual gera várias contas independentes no mesmo lote. Todas compartilham o mesmo `grupo_parcelamento_id`, mas baixa, estorno, pagamento parcial, edição, ocultação e lixeira continuam funcionando no nível da conta individual.

## Primeira etapa implementada

Foi implementada apenas a visão/resumo do grupo de parcelamento ao abrir uma parcela parcelada.

- O modal de conta carrega as contas do mesmo `grupo_parcelamento_id`.
- A consulta respeita `empresa_id` e ignora contas enviadas para lixeira.
- O resumo mostra parcela atual, valor total, soma das parcelas, quantidade de parcelas, abertas, pagas, vencidas e próximo vencimento aberto.
- A lista mostra parcela, vencimento, valor, status e marcação de oculta quando aplicável.
- Não há botão de edição em lote.
- Não há botão de ocultação/cancelamento em lote.
- Baixa, estorno, pagamento parcial, recorrência, impostos e relatórios não foram alterados.

## Arquivos e fluxos auditados

- `src/hooks/useContas.js`
  - `montarParcelasConta` gera valores, vencimentos mensais e `grupo_parcelamento_id`.
  - `salvarContaInterno` cria parcelas em lote com `criarContasEmLote`.
  - edição atual usa `atualizarConta` em uma conta por vez.
  - baixa, estorno, ocultação, reexibição e lixeira atuam em um `id` por vez.
- `src/services/contasService.js`
  - `listarContasAtivas` retorna `*`, então os campos de parcelamento chegam no frontend.
  - `registrarPagamentoParcial` e `estornarPagamentoParcial` validam uma conta por vez.
  - `baixarContaComoPaga`, `estornarBaixaConta`, `ocultarConta`, `reexibirConta` e `enviarContaParaLixeira` alteram uma conta por vez.
- `src/pages/ContasPage.jsx`
  - cards mostram `Parcelado` e `Parcela X/Y`.
  - ações continuam individuais: baixar, estornar, corrigir, parcial, editar, ocultar, excluir.
- `supabase/migrations/20260627180000_add_parcelamento_df_contas.sql`
  - adiciona os campos e a constraint de consistência.
  - não cria tabela de cabeçalho do parcelamento.

## Riscos encontrados

1. **Parcelas já pagas:** alterar valor, vencimento, filial ou centro em lote pode distorcer histórico financeiro e relatórios.
2. **Parcelas com pagamento parcial:** alterar valor ou vencimento em lote pode quebrar o saldo parcial e a expectativa operacional.
3. **Arredondamento em centavos:** alterar valor total do grupo exige redistribuição e pode mudar parcelas já conferidas.
4. **Parcelas ocultas ou na lixeira:** edição em lote pode reintroduzir ou alterar itens que o usuário tirou da operação diária.
5. **Parcelas vencidas:** mudança de vencimento em massa pode mascarar atraso real.
6. **Cancelamento de grupo com parcelas pagas:** ocultar ou excluir tudo em lote apagaria a leitura operacional de pagamentos já realizados.
7. **Edição individual depois da criação:** uma parcela pode ter sido ajustada manualmente e não deve ser sobrescrita sem aviso.
8. **Relatórios:** cada parcela é uma conta independente; ações em lote devem preservar essa lógica.

## Regra recomendada para edição individual

- Manter a edição individual como fluxo principal e sempre disponível conforme permissões atuais.
- Editar uma parcela individual deve continuar alterando somente aquela conta.
- Não recalcular automaticamente `valor_total_parcelamento`.
- Não alterar outras parcelas do grupo.
- Não alterar pagamento parcial, baixa ou estorno da parcela.

## Regra recomendada para edição em lote

A edição em lote deve ser opcional, explícita e separada da edição individual.

Campos seguros para primeira versão:

- `descricao`
- `observacao`
- `centro_custo_id`
- `filial_id`, se a validação de filial por empresa permanecer igual à conta individual
- campos de notificação, se o fluxo atual permitir

Campos que devem ficar bloqueados na primeira versão quando qualquer parcela do grupo estiver paga ou tiver pagamento parcial:

- `valor`
- `valor_total_parcelamento`
- `data_vencimento` / `vencimento`
- `status`
- `valor_pago`
- `data_pagamento`
- `observacao_pagamento`

Regras de segurança:

- Não editar em lote parcelas com `status = 'pago'`.
- Não editar em lote parcelas com `quantidadePagamentosParciais > 0` ou `pagamentosParciaisTotal > 0`.
- Não editar em lote parcelas excluídas/deletadas.
- Parcelas ocultas devem aparecer em resumo antes da ação e, por padrão, não devem ser alteradas.
- Se o grupo tiver qualquer parcela paga ou parcial, permitir somente campos administrativos seguros e mostrar aviso claro.
- Alteração de vencimentos em lote deve ser ciclo separado, com prévia das datas e bloqueio de pagas/parciais.
- Alteração de valor total ou redistribuição de parcelas deve ser ciclo separado, exigindo nenhuma baixa e nenhum pagamento parcial no grupo.

## Regra recomendada para ocultação/cancelamento em lote

Cancelamento deve ser reversível e usar os campos existentes:

- `oculto = true`
- `oculto_em = now()`

Regras:

- Permitir ocultar em lote somente parcelas abertas, não excluídas e sem pagamento parcial.
- Se houver parcela paga, bloquear a ocultação em lote e orientar tratamento manual.
- Se houver parcela com pagamento parcial, bloquear a ocultação em lote.
- Se houver parcela já oculta, manter como está e informar no resumo.
- Não usar `DELETE`.
- Não mover para lixeira em lote na primeira versão.
- Não alterar `status`, `valor_pago`, `data_pagamento` ou histórico.
- Reexibição em lote pode ser ciclo posterior, usando `oculto = false` e `oculto_em = null` somente para o mesmo `grupo_parcelamento_id`.

## Campos existentes que serão usados

- Identificação do grupo: `grupo_parcelamento_id`
- Ordem: `parcela_numero`
- Total de parcelas: `parcelas_total`
- Conferência do total: `valor_total_parcelamento`
- Proteções operacionais:
  - `status`
  - `valor_pago`
  - `data_pagamento`
  - `oculto`
  - `oculto_em`
  - `excluido`
  - `deletado`
  - campos derivados de pagamento parcial no frontend

## Precisa de migration?

Não precisa de migration para a próxima etapa mínima.

O `grupo_parcelamento_id` já permite localizar o grupo. A primeira evolução pode ser feita com leitura das contas do mesmo grupo e atualização controlada das parcelas elegíveis.

Índice futuro pode ser útil se houver lentidão:

```sql
create index if not exists idx_df_contas_empresa_grupo_parcelamento
on public.df_contas (empresa_id, grupo_parcelamento_id)
where grupo_parcelamento_id is not null;
```

Não criar agora sem evidência de necessidade, porque a frente atual é funcional e de baixo volume.

## Plano em etapas

1. **Auditoria visual do grupo**
   - Ao abrir uma parcela, permitir ver as demais parcelas do mesmo `grupo_parcelamento_id`.
   - Mostrar totais: abertas, pagas, parciais, ocultas e vencidas.

2. **Edição em lote administrativa**
   - Criar ação explícita `Editar grupo`.
   - Permitir somente campos administrativos seguros.
   - Antes de salvar, mostrar quantas parcelas serão alteradas e quantas serão ignoradas.
   - Atualizar apenas parcelas elegíveis.

3. **Ocultação/cancelamento em lote**
   - Criar ação explícita `Ocultar parcelas abertas`.
   - Bloquear se houver paga ou parcial no conjunto selecionado.
   - Usar somente `oculto/oculto_em`.

4. **Vencimentos em lote**
   - Ciclo separado.
   - Exigir prévia das novas datas.
   - Bloquear pagas/parciais.

5. **Recalcular valor do parcelamento**
   - Ciclo separado e de maior risco.
   - Só permitir se todas as parcelas estiverem abertas, sem baixa, sem parcial, sem lixeira e sem ocultação.

## Checklist de validação futura

- Grupo com todas as parcelas abertas permite edição administrativa em lote.
- Grupo com parcela paga bloqueia alteração de valor/vencimento em lote.
- Grupo com pagamento parcial bloqueia alteração de valor/vencimento e ocultação em lote.
- Edição individual continua alterando somente uma parcela.
- Baixa individual continua funcionando após edição administrativa do grupo.
- Pagamento parcial individual continua funcionando após edição administrativa do grupo.
- Ocultação em lote não altera parcelas pagas.
- Lixeira continua individual.
- Filtros de abertas, pagas, ocultas e vencidas continuam iguais.
- Mobile não ganha rolagem lateral.

## Rollback previsto

Para código futuro:

```bash
git revert <commit>
```

Para dados, se uma ação em lote futura for executada por engano:

- capturar snapshot antes de qualquer UPDATE;
- restaurar apenas os IDs afetados;
- nunca usar rollback por `grupo_parcelamento_id` sem conferir se houve edição individual posterior.

Exemplo de rollback de ocultação em lote, se autorizado e com IDs validados:

```sql
update public.df_contas
set oculto = false,
    oculto_em = null
where empresa_id = '<empresa_id>'
  and id in ('<id_1>', '<id_2>');
```
