# Plano macro V2 - DNA Gestão

Data: 2026-07-02

## Resumo executivo

O DNA Gestão entra em virada controlada V2. O objetivo é fechar o projeto com menos retrabalho, preservar a V1 em produção, construir a V2 em paralelo e validar antes de substituir fluxos críticos.

## Motivo da decisão

- Excesso de retrabalho em correções pontuais.
- Fluxos antigos confusos, especialmente Folha e relatórios.
- Telas grandes acumulando estado, regras e layout.
- Necessidade de fechar o projeto com estabilidade.
- Risco crescente de continuar corrigindo partes isoladas.

## Frentes pendentes conhecidas

- Contas V2.
- Relatórios financeiros.
- Fluxo de Caixa por filial.
- Exportação Excel/PDF.
- Filtro múltiplo centro de custo.
- Gestão de Pessoas V2.
- Folha V2.
- Funcionários V2.
- Férias V2.
- PDF Compras Internas/Vales.
- Central de Relatórios V2.
- Logs/Auditoria.
- Cadastro de empresas completo.
- CNPJ/endereço/dados empresariais.
- Separação Empresa x Filial.
- Curso/módulo pendente.
- Painel administrativo.
- Segurança Supabase/RLS/functions/grants.
- Performance Supabase.
- Infraestrutura/Vercel/Node.
- Arquitetura do código.
- Documentação técnica.

## Ordem recomendada

### Fase 0 - Backups e congelamento

- GitHub.
- Supabase.
- Status produção.
- Congelamento V1.

### Fase 1 - Infraestrutura e arquitetura base

- Vercel.
- Node.
- Build/deploy.
- `package.json`.
- Arquitetura modular.
- Separação de páginas grandes.
- Organização de services/hooks.
- Padrão Supabase.

### Fase 2 - Base estrutural V2

- Cadastro de empresas completo.
- Modelo empresa/filial.
- CNPJ/endereço/dados legais.
- Permissões básicas.
- Sem quebrar dados atuais.

### Fase 3 - Relatórios financeiros V2

- Contas.
- Fluxo de Caixa por filial.
- Centro de custo múltiplo.
- Exportação Excel/PDF.
- Contas a vencer/vencidas/pagas.

### Fase 4 - Gestão de Pessoas V2

- Funcionários.
- Férias.
- Folha.
- Fechamento.
- Workspace de lançamentos.
- Relatórios.

### Fase 5 - Auditoria/Logs

- Tela de auditoria.
- Eventos críticos.
- Trilha de ações.
- Alertas.

### Fase 6 - Painel/Admin/Curso

- Módulo curso, se ainda necessário.
- Painel administrativo.
- Configurações gerais.

### Fase 7 - Validação e virada

- Comparar V1 x V2.
- Validar relatórios.
- Validar permissões.
- Validar dados por empresa/filial.
- Ocultar V1 gradualmente.

## Regras de desenvolvimento

- V2 em rotas paralelas ou componentes isolados.
- Não remover V1.
- Toda mudança com rollback.
- Ciclos por módulo.
- Não misturar banco/frontend sem plano.
- Migrations só com autorização.
- Backups antes de mudanças estruturais.
- Validar com dados reais.
- Comparar totais V1 x V2.
- Manter `main` protegida como produção.

## Critérios de aceite da V2

- Dados batem com V1.
- Relatórios exportam corretamente.
- Permissões respeitam empresa/filial.
- Sem vazamento entre empresas.
- Sem erro no console.
- Rollback simples.
- Usuário aprova fluxo.

## Critérios para desligar V1

- V2 validada por ciclo completo.
- Backup confirmado.
- Relatórios críticos funcionando.
- Permissões testadas.
- Usuário autoriza virada.

## Riscos

- Divergência V1 x V2.
- Backup incompleto.
- Migration mal planejada.
- Permissões/RLS quebradas.
- Relatórios com totais incorretos.
- Duplicidade em pagamentos parciais.
- Retrabalho por falta de contrato de dados.
- Manutenção dupla prolongada.

## Rollback

- Git revert.
- Ocultar links V2.
- Restaurar backup em caso extremo.
- Manter V1 intacta até aprovação.
