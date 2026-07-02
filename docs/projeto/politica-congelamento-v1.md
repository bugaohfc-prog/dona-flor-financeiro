# Política de congelamento da V1

Data: 2026-07-02

## Objetivo

Congelar a V1 do DNA Gestão para interromper o ciclo de remendos e permitir uma virada controlada para V2 sem quebrar produção.

## Regras

- V1 continua em produção.
- `main` continua sendo produção.
- Não fazer redesign na V1.
- Não criar novos fluxos grandes na V1.
- Não fazer remendos pequenos sem análise.
- Corrigir na V1 apenas bug crítico operacional.
- Relatórios antigos devem continuar acessíveis.
- Nenhuma tela V1 deve ser removida antes da virada.
- Toda melhoria estrutural deve ir para o plano V2 ou para documentação V2.
- V1 deve permanecer disponível até V2 ser validada e aprovada.

## O que ainda pode entrar na V1

- Bug crítico que bloqueia operação real.
- Correção de segurança autorizada.
- Correção de dado com rollback claro.
- Ajuste mínimo para manter produção funcionando.

## O que deve ir para V2

- Redesign de tela.
- Nova experiência de relatórios.
- Refatoração de páginas grandes.
- Reorganização de módulos.
- Novos relatórios estruturais.
- Melhorias amplas de UX.
- Alterações de arquitetura.
- Mudanças de banco, salvo plano próprio autorizado.

## Regra prática

Antes de qualquer nova alteração, perguntar:

1. Isso é bug crítico de produção?
2. A V1 quebra sem essa correção?
3. Existe rollback simples?
4. A mudança pode esperar a V2?

Se não for crítico, documentar para V2.
