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
- Exportação Fluxo de Caixa, se retomada em V1.
- Cadastro completo de empresas.
- CNPJ/endereço/dados empresariais.
- Logs/Auditoria tela.
- Segurança Supabase/RLS/functions/grants remanescente.

## Regra atual

Mudanças devem ser feitas por frente, diretamente na `main`, com tag de backup quando houver risco, build obrigatório quando alterar `src`, e rollback claro. Banco, RLS, migrations, secrets, Edge Functions e permissões continuam exigindo ciclo próprio e autorização explícita.
