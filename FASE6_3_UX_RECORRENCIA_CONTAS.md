# Fase 6.3 — UX recorrência nas contas

## Objetivo
Melhorar a leitura visual das contas, sem alterar regras financeiras, Supabase, auth ou fluxo de salvar/editar.

## Alterações
- Data das contas exibida em badge visual no padrão do Bloco de Notas.
- Contas com `recorrencia_id` exibem badge de recorrência diretamente na listagem.
- Quando disponível via relacionamento `df_contas_recorrentes`, exibe o tipo da recorrência:
  - Mensal
  - Semanal
  - Anual
  - Quinzenal
- Mantido fallback seguro para `Mensal` quando a conta tem `recorrencia_id`, mas o tipo ainda não veio carregado.

## Arquivos alterados
- `src/hooks/useContas.js`
- `src/App.jsx`
- `src/components/dashboard/OpenAccountsList.jsx`
- `src/styles.css`

## Validação
- Build local aprovado.
- Sem alteração de CSS estrutural/responsividade.
- Sem alteração de handlers de salvar/editar.
