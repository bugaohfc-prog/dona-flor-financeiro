# Fase 6.2 — Correção raiz recorrência ao editar conta

Correção conservadora aplicada em `src/hooks/useContas.js`.

## Problema observado
Ao editar uma conta comum e marcar como recorrente, o cadastro podia criar a recorrência, mas a conta atual não voltava marcada como recorrente ao abrir novamente.

## Ajuste feito
- Mantido UX, CSS, layout, auth e Supabase existentes.
- Adicionado fallback seguro para localizar a recorrência ativa da conta quando o `recorrencia_id` não vier preenchido.
- Ao abrir edição, o hook agora tenta encontrar a recorrência também por empresa, descrição, valor e dia de vencimento.
- Ao salvar edição, se o insert da recorrência não devolver o ID diretamente, o hook localiza a recorrência criada e vincula a conta.
- Após vincular, o estado local de `contas` também é atualizado para evitar reabrir o modal com dado antigo.

## Validação
- `npm run build` aprovado.
