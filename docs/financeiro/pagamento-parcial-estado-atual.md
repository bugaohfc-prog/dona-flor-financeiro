# Pagamento parcial - estado atual

Data: 24/06/2026

## Fluxo disponível

- Contas abertas, visíveis e fora da lixeira exibem a ação `Parcial`.
- O formulário registra valor, data e observação opcional.
- O registro é inserido em `public.df_contas_pagamentos`.
- A listagem é recarregada após o salvamento e exibe total pago, saldo,
  quantidade de pagamentos e data do último pagamento.

## Validações

- valor obrigatório e maior que zero;
- data obrigatória no formato válido;
- valor limitado ao saldo pendente;
- conta, empresa e pagamentos ativos são consultados novamente antes do
  `INSERT`;
- conta paga, oculta, excluída ou deletada não aceita novo pagamento parcial;
- duplo envio é bloqueado enquanto o salvamento está em andamento.

## Limites deste ciclo

- `df_contas.status` não é alterado;
- `df_contas.valor_pago` e `df_contas.data_pagamento` não são alterados;
- saldo zerado por pagamentos parciais não executa baixa integral automática;
- baixa, correção e estorno existentes permanecem separados;
- não há edição ou estorno de um pagamento parcial neste ciclo;
- nenhuma migration, policy ou regra de RLS foi alterada.
