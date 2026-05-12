# FASE 10.3B — User Profile Edit

## Objetivo
Permitir edição simples do nome de exibição do usuário logado, sem alterar a arquitetura multiempresa validada.

## Implementado

- Botão discreto no topo desktop: `Olá, usuário`.
- Atalho `Meu perfil` no menu mobile.
- Modal de perfil com:
  - nome editável;
  - e-mail somente leitura;
  - salvar/cancelar.
- Persistência no Supabase:
  - `profiles.name`;
  - `df_usuarios_empresas.nome` por `user_id` e por `email`.
- Atualização reativa do nome no header e menu.
- Sem reload bruto.
- Sem alteração no dashboard validado.
- Sem alteração na lógica multiempresa/RLS.

## Validação recomendada

1. Logar com `donafloradm@outlook.com`.
2. Clicar em `Olá, ...` no topo desktop.
3. Alterar nome.
4. Salvar.
5. Confirmar atualização imediata no header.
6. Recarregar página e confirmar persistência.
7. Validar também no mobile pelo menu `Meu perfil`.
8. Trocar Dona Flor ↔ Choco Arte e confirmar que o switch continua funcionando.
