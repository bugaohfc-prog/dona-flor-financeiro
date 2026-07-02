# Estado atual da produção pré-V2

Data/hora do registro: 2026-07-02 19:45:08 -03:00

## Resumo executivo

O DNA Gestão está em produção na branch `main` e passou por meses de correções pontuais em Contas, Gestão de Pessoas, Folha, Auditoria/Logs e segurança Supabase. A partir deste registro, o projeto entra em preparação para virada controlada V2: V1 continua disponível, mas deve ser congelada para evitar novos remendos fora de bugs críticos.

## Commit de referência da produção

- Branch: `main`
- Commit registrado antes da virada: `161a5e809d0e73ceaf507e78a9155ac3e627d51d`
- Status Git no registro: worktree limpo
- Regra operacional: `main` é produção

## Backup Git criado

- Tag de segurança: `backup-pre-v2-2026-07-02`
- Branch de backup: `backup/pre-v2-2026-07-02`
- Ambas apontam para o commit de produção pré-V2 `161a5e809d0e73ceaf507e78a9155ac3e627d51d`.
- A branch de trabalho V2 deve ser criada após este commit documental, sem desenvolvimento neste ciclo.

## Módulos existentes

- Contas / Financeiro
- Relatórios de Contas
- Controle de Impostos
- Recorrências e parcelamentos
- Gestão de Pessoas
- Funcionários
- Férias
- Fechamento de Folha
- Notas/Pendências
- Agenda
- Configurações
- Usuários e permissões
- Filiais/Unidades
- Destinatários de alertas
- Logs/Auditoria em preparação
- Edge Functions administrativas e de auditoria

## Frentes concluídas/controladas recentes

- SECURITY DEFINER: remoções controladas de `anon`/`PUBLIC` em funções críticas, mantendo `authenticated` quando necessário.
- Consolidação INSS / CP-SEGUR receitas 1082 e 1099.
- Revisão dos pendentes INSS / CP-SEGUR sem par 1099.
- Retomada e diagnóstico do módulo Contas.
- Relatório de contas a vencer com períodos 15/30/60/90 dias e todas em aberto.
- Filtro múltiplo de centro de custo em relatórios de contas.
- Mapeamento do Fluxo de Caixa por filial.
- Fase 0.5 de contratos API/JSON da Gestão de Pessoas.
- Planejamento do PDF de Compras Internas / Vales.
- Fase 1 e 2A de auditoria operacional com `df_auditoria_eventos`.
- Auditoria e planejamento de redesenho do Fechamento de Folha.

## Frentes pausadas

- Gestão de Pessoas V2 implementação.
- PDF de Vales implementação direta.
- Logs/Auditoria tela.
- Banco crítico / SECURITY DEFINER.
- Performance Supabase.
- Central de Relatórios V2.
- Workspace de Lançamentos.

## Frentes pendentes

- Virada V2 controlada.
- Contas V2 e relatórios financeiros.
- Fluxo de Caixa por filial com exportação.
- Cadastro completo de empresas com CNPJ/endereço/dados legais.
- Separação visual e técnica Empresa x Filial.
- Gestão de Pessoas V2 completa.
- Folha V2 / Fechamento / workspace de lançamentos.
- Funcionários V2 e Férias V2.
- PDF Compras Internas / Vales.
- Logs/Auditoria com tela.
- Painel administrativo.
- Curso/módulo pendente.
- Infraestrutura Vercel/Node/build.
- Arquitetura modular e desmembramento de páginas grandes.

## Riscos conhecidos

- `main` é produção e não há homologação.
- V1 acumula telas grandes e fluxos com estados acoplados.
- Relatórios financeiros podem divergir se misturarem vencimento, competência e caixa.
- Pagamentos parciais exigem regra anti-duplicidade.
- Segurança Supabase ainda tem funções críticas mantidas para `authenticated`.
- Vercel pode estar usando versão Node diferente da declarada no projeto.
- Supabase CLI não foi localizada localmente neste ciclo.
- Backups reais de banco ainda precisam ser confirmados fora do Git.

## Documentos de referência

- `docs/projeto/plano-macro-v2-dna-gestao.md`
- `docs/projeto/checklist-backup-supabase-pre-v2.md`
- `docs/projeto/politica-congelamento-v1.md`
- `docs/projeto/auditoria-infra-arquitetura-v2.md`
- `docs/projeto/status-frentes-ativas.md`
- `docs/contas/mapeamento-fluxo-caixa-12-meses.md`
- `docs/gestao-pessoas/fase-0-5-contratos-api-json.md`
- `docs/folha/auditoria-redesenho-fechamento-folha.md`
- `docs/logs/frente-logs-diagnostico.md`
- `docs/supabase/security-definer-diagnostico-resultado.md`
