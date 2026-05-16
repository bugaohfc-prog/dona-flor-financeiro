# FASE 11.2B — Lixeira Empty State Stability

## Objetivo

Corrigir o flicker remanescente da página **Lixeira**, especialmente quando uma das seções está vazia.

## Correções aplicadas

- Empty states da Lixeira estabilizados.
- Remoção de animação de entrada/reentrada nos cards vazios da Lixeira.
- Atualização de listas da Lixeira com comparação estável para evitar `setState` desnecessário.
- Se a lista recebida do Supabase é igual à lista atual, o estado é preservado.
- Mantida a estabilidade global da fase 11.2.

## Escopo

Correção isolada, sem avançar novas features.

Áreas preservadas:

- Contas
- Notas
- Agenda
- Relatórios
- Formulários
- Sincronização sem F5

## Validação

1. Acessar **Lixeira** sem itens.
2. Confirmar que o empty state não pisca.
3. Enviar contas para a lixeira e manter notas vazias.
4. Confirmar que apenas a seção de notas vazia permanece estável.
5. Enviar notas para a lixeira e validar que os cards também não piscam.
6. Voltar para Contas/Notas/Agenda e garantir que formulários continuam sem perder foco.
