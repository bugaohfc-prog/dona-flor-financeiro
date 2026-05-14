# FASE 11.0 — Relatórios Gerenciais

## Status
Implementada e validada em build local.

## Base
`dona-flor-financeiro-main(52).zip`

## Objetivo
Entregar uma tela gerencial de relatórios para o Dona Flor Financeiro sem alterar as fases já validadas de multiempresa, multiunidade, RLS, recorrência, dashboard, permissões, billing, onboarding e sidebar.

## Arquivos principais alterados
- `src/pages/Relatorios.jsx`
- `dist/` regenerado por build Vite

## Funcionalidades entregues

### 1. Painel de resumo financeiro
- Total geral
- Total pago
- Total pendente
- Total vencido

### 2. Filtros gerenciais
- Filtro por mês
- Filtro por status
- Filtro por centro de custo
- Limpeza rápida dos filtros

### 3. Resumo executivo
- Mensagem executiva automática conforme o cenário filtrado
- Destaque de risco quando há vencidos
- Destaque de meta mensal quando configurada
- Destaque de crescimento em relação ao mês anterior

### 4. Score de saúde financeira
- Score de 0 a 100
- Status saudável, atenção ou crítico
- Penalização por vencidos, concentração, baixa classificação, meta estourada e pendência elevada

### 5. Qualidade dos dados
- Percentual de contas classificadas por centro de custo
- Contagem de contas com centro
- Contagem de contas sem centro
- Alerta quando a classificação está baixa

### 6. Comparativo mensal
- Mês atual
- Mês anterior
- Variação financeira
- Previsão simples do próximo mês

### 7. Meta mensal
- Campo de meta manual
- Barra de consumo da meta
- Alerta quando ultrapassa 80% ou 100%

### 8. Insights automáticos
- Alertas de vencimento
- Risco de concentração
- Qualidade dos dados
- Comparativo com mês anterior
- Previsão simples

### 9. Ranking por centro de custo
- Ranking ordenado pelo maior custo
- Percentual de participação no total
- Pago, pendente e vencido por centro
- Identificação de contas sem centro

### 10. Lista das contas do relatório
- Descrição
- Valor
- Data de vencimento
- Centro de custo
- Status calculado com vencido quando aplicável

### 11. Exportação simples
- Impressão/PDF via navegador
- Exportação CSV
- Layout de impressão com cabeçalho e rodapé

## Segurança e compatibilidade
- Consulta filtrada por `empresa_id`
- Mantém isolamento multiempresa existente
- Não altera políticas RLS
- Não altera estrutura de billing
- Não altera onboarding
- Não altera sidebar hardened

## Validação técnica
Comando executado:

```bash
npm ci
npm run build
```

Resultado:

```txt
✓ built
```

Observação: o Vite emitiu apenas aviso de chunk grande, sem bloquear o build.

## Como validar no app
1. Abrir o menu lateral.
2. Entrar em **Análise > Relatórios**.
3. Validar se a tela carrega sem erro.
4. Testar filtro por mês.
5. Testar filtro por status: Todas, Pendentes, Pagas e Vencidas.
6. Testar filtro por centro de custo.
7. Inserir uma meta mensal e validar a barra de meta.
8. Validar ranking por centro.
9. Testar botão **CSV**.
10. Testar botão **PDF**.

## Próxima fase
Após validação da 11.0, seguir para:

`11.1 — Relatórios avançados / exportação / insights executivos`
