# Pagamento parcial - estado atual

Data: 24/06/2026

## Fluxo disponível

- Contas abertas, visíveis e fora da lixeira exibem a ação `Parcial`.
- O formulário registra valor, data e observação opcional.
- O registro é inserido em `public.df_contas_pagamentos`.
- A listagem é recarregada após o salvamento e exibe total pago, saldo,
  quantidade de pagamentos e data do último pagamento.
- O modal lista os pagamentos parciais ativos da conta.
- Um pagamento individual pode ser estornado por inativação lógica:
  `arquivado = true` e `arquivado_em` preenchido.
- Quando os pagamentos ativos quitam o saldo, o modal oferece a ação manual
  `Baixar conta agora`.

## Validações

- valor obrigatório e maior que zero;
- data obrigatória no formato válido;
- valor limitado ao saldo pendente;
- conta, empresa e pagamentos ativos são consultados novamente antes do
  `INSERT`;
- conta paga, oculta, excluída ou deletada não aceita novo pagamento parcial;
- duplo envio é bloqueado enquanto o salvamento está em andamento.
- estorno valida novamente empresa, conta e pagamento antes da atualização;
- exclusão física não é usada e permanece bloqueada pelo banco.
- a baixa por quitação é revalidada no banco e usa como data a do último
  pagamento parcial ativo, com a data atual apenas como fallback;
- os pagamentos parciais não são apagados nem arquivados pela baixa.

## Limites deste ciclo

- registrar ou estornar um parcial não altera `df_contas`;
- somente a ação manual `Baixar conta agora` atualiza `df_contas.status`,
  `valor_pago`, `data_pagamento` e `observacao_pagamento`;
- saldo zerado por pagamentos parciais não executa baixa automática;
- baixa, correção e estorno existentes permanecem separados;
- não há edição de um pagamento parcial neste ciclo;
- nenhuma migration, policy ou regra de RLS foi alterada.
