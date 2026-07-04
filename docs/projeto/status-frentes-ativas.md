# Status das frentes ativas

Data: 2026-07-03

## Decisão atual

- A V2 está pausada/abandonada.
- Não continuar V2.
- Não trazer código, rotas, mocks, contratos ou arquitetura V2 para produção.
- O caminho oficial volta a ser V1 atual na branch `main`, em produção real.

## Ativas

- V1 atual em `main` / produção real.
- Fechamento de Folha V1.
- Fechamento da competência 06/2026.
- Contas / Fluxo de Caixa V1.

## Pausadas

- V2 / `v2/virada-controlada`.
- Central V2.
- Fluxo de Caixa V2.
- Gestão de Pessoas V2.
- Admin V2.
- Auditoria V2.
- PDF Vales com backend real.
- Logs/Auditoria com banco real.
- Banco crítico / SECURITY DEFINER.
- Performance Supabase.
- Workspace de Lançamentos com gravação real.

## Concluídas/controladas

- Backup Git e congelamento pré-V2 documentados.
- Redesenho operacional do Fechamento de Folha V1 aplicado na `main`.
- Rearquitetura inicial do Fechamento de Folha V1 em componentes dedicados.
- Refatoração ampla da frente de Fechamento de Folha V1 com lista, ações, itens detalhados e formatadores separados.
- Fluxo de Caixa V1 com leitura real de pagamentos, filtro por ano/filial, consolidado e exportação CSV/Excel.
- Correções críticas de banco parcialmente tratadas.
- Consolidação INSS/CP-SEGUR.
- Contas a vencer com período ampliado.
- Filtro múltiplo de centro de custo em relatórios.
- Mapeamento Fluxo de Caixa.
- Planejamento PDF Vales.
- Auditoria operacional inicial em Logs.

## Pendentes

- Validar Fechamento de Folha V1 na competência 06/2026 com uso real.
- Avaliar hook/view model para Fechamento de Folha se os handlers continuarem crescendo.
- Revisar textos operacionais e acentuação da tela de folha em ciclo próprio.
- Origem confiável de entradas/faturamento bruto para Fluxo de Caixa.
- Rubricas detalhadas do modelo de Fluxo de Caixa por plano de contas/centro de custo.
- Cadastro completo de empresas.
- CNPJ/endereço/dados empresariais.
- Logs/Auditoria tela.
- Segurança Supabase/RLS/functions/grants remanescente.

## Regra atual

Mudanças devem ser feitas por frente, diretamente na `main`, com tag de backup quando houver risco, build obrigatório quando alterar `src`, e rollback claro. Banco, RLS, migrations, secrets, Edge Functions e permissões continuam exigindo ciclo próprio e autorização explícita.

## Atualizacao 2026-07-04

- Fluxo de Caixa V1 evoluido para separar saidas pelas rubricas fixas do modelo do cliente.
- Exportacao CSV/Excel passa a usar rubricas em vez de uma linha unica de desembolsos.
- Classificacao automatica centralizada tambem prepara sugestao segura de centro de custo em novos lancamentos.
- Dados antigos continuam intactos; a classificacao historica e logica, feita no relatorio/exportacao.
- Pendencia principal: frente de Receitas/Entradas para preencher `FATURAMENTO BRUTO` com origem confiavel.

## Atualizacao 2026-07-04 � Receitas V1

- Criada frente Receitas / Entradas V1 em `Financeiro > Receitas`.
- Criada tabela `public.df_receitas` com RLS habilitada/forcada, sem acesso anon e sem DELETE fisico.
- Inserida carga inicial idempotente do PDF `Resultados de vendas 2025.pdf` com 48 receitas mensais.
- Fluxo de Caixa V1 passa a preencher `FATURAMENTO BRUTO` com receitas ativas por `data_receita`.
- Exportacao CSV/Excel do Fluxo de Caixa passa a sair com entradas, saidas por rubrica e total geral.
- Pendencia: validar operacionalmente a rotina mensal de cadastro/importacao de receitas futuras.
