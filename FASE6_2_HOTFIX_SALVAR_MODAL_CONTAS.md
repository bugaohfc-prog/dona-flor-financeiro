# Fase 6.2 — Hotfix salvar modal de contas

Correção conservadora baseada no diretório atual do GitHub.

## Corrigido

- Botão Salvar do modal de contas reforçado com `type="button"` e prevenção de propagação.
- Payload de `df_contas_recorrentes` ajustado para o schema real do Supabase.
- Removidos campos inexistentes da recorrência:
  - `frequencia`
  - `observacao`
- Usado campo correto:
  - `tipo_recorrencia`
- Removido `if` duplicado no fluxo de criação com recorrência.
- Ao editar recorrência existente, o vínculo `df_contas.recorrencia_id` é reafirmado.
- Notificações da conta agora salvam a partir do estado do formulário.

## Não alterado

- CSS
- UX
- Layout
- Auth
- Supabase client
- Regras financeiras
