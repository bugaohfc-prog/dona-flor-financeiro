# FASE 10.8A — Billing UX Harden

Objetivo: melhorar a experiência de alteração do billing antes do onboarding SaaS.

## Incluído

- estado de alterações pendentes;
- aviso visual quando plano/status/limites forem alterados;
- botão desabilitado quando não há nada para salvar;
- botão muda para **Salvar alterações do billing** quando há mudança;
- loading preservado;
- toast de sucesso/erro preservado;
- data do trial formatada em pt-BR;
- sem alteração em RLS;
- sem bloqueio comercial ainda.

## SQL

Não há SQL obrigatório nesta microfase.

Como você já corrigiu a compatibilidade de `created_at` em `df_assinaturas`, basta subir o ZIP e validar.

## Validação

1. Abrir Billing.
2. Confirmar botão como **Billing salvo**.
3. Trocar plano ou status.
4. Confirmar aviso **Alterações pendentes**.
5. Confirmar botão **Salvar alterações do billing**.
6. Salvar.
7. Recarregar página e confirmar persistência.
