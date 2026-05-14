# FASE 10.9 — Onboarding SaaS

## Objetivo
Criar um fluxo guiado para preparar uma empresa nova para operar no Dona Flor Financeiro sem reconstruir as telas já validadas.

## Incluído

- Nova tela **Onboarding SaaS** no menu Sistema.
- Progresso visual da implantação inicial.
- Checklist guiado:
  1. empresa ativa;
  2. primeira filial;
  3. primeiro centro de custo;
  4. primeira conta;
  5. dashboard pronto.
- Criação da primeira filial usando `df_filiais`.
- Criação do primeiro centro usando `df_centros_custo`.
- Criação da primeira conta usando `df_contas`, preservando `empresa_id`, `filial_id` e `centro_custo_id`.
- Correção visual do botão de fechar do toast.

## SQL

Nenhum SQL obrigatório nesta fase.

A fase usa as tabelas já existentes e validadas:

- `df_empresas`
- `df_filiais`
- `df_centros_custo`
- `df_contas`

## Validação recomendada

1. Abrir **Sistema → Onboarding**.
2. Validar se o progresso aparece.
3. Em uma empresa sem dados, criar:
   - primeira filial;
   - primeiro centro de custo;
   - primeira conta.
4. Confirmar se o dashboard mostra os novos dados.
5. Testar desktop e mobile.
6. Trocar Dona Flor ↔ Choco Arte e confirmar isolamento.

## Preservado

- RLS atual.
- Multiempresa.
- Multiunidade.
- Billing 10.8A.
- Dashboard operacional.
- Recorrência hardened.
