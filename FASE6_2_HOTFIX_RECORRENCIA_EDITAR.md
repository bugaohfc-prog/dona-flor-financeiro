# Fase 6.2 — Hotfix recorrência ao editar conta

Correção pontual sobre a versão `dona_flor_fase6_2_usecontas_funcoes.zip`.

## Problema corrigido
Ao editar uma conta que não era recorrente para transformá-la em recorrente, o fluxo podia não concluir corretamente.

## Ajustes realizados
- `App.jsx` agora passa `fecharConta` para o hook `useContas` no contexto de `salvarConta`.
- `useContas.js` agora recebe `fecharConta` corretamente.
- O vínculo entre a conta editada e a recorrência criada agora valida erro do Supabase em vez de falhar silenciosamente.
- Mesmo reforço aplicado ao fluxo de nova conta recorrente.

## Não alterado
- UX
- CSS
- responsividade
- autenticação
- regras financeiras
- layout
