# Auditoria Supabase Advisor

Projeto: `contas-donaflor`
Project ID: `vyhjjtzdvofoqoericak`
Data: 2026-06-28
Status: inventario documental, sem correcao aplicada.

## Escopo

Este documento organiza os avisos do Supabase Advisor em ordem segura de tratamento.

Este ciclo nao altera banco, dados, RLS, policies, funcoes, views, indices, frontend, services ou hooks.

## Fonte e limitacao

Foram feitas tentativas de reconsulta pelo conector Supabase MCP para:

- Security Advisor;
- Performance Advisor.

As chamadas falharam antes de retornar dados por timeout no handshake do MCP. A CLI `supabase` tambem nao esta disponivel no PATH local. Por isso, esta auditoria registra os achados ja levantados no ciclo operacional e os exemplos informados para priorizacao. Antes de qualquer correcao, o proximo ciclo deve reexecutar o Advisor ou diagnosticos SQL de catalogo e anexar o resultado bruto ao plano de execucao.

## Resumo executivo

Prioridade recomendada:

1. Auditar funcoes `SECURITY DEFINER` executaveis por `anon`, `authenticated` ou `PUBLIC`.
2. Auditar views com comportamento de `SECURITY DEFINER` ou sem `security_invoker`.
3. Corrigir `search_path` de funcoes sensiveis quando confirmado que a mudanca e segura.
4. Criar indices faltantes em foreign keys de alto uso.
5. Revisar RLS auth initplan e policies permissivas/duplicadas em ciclo separado.
6. Avaliar indices duplicados ou unused somente depois de medir uso real.

Nao remover policy, nao revogar funcao e nao apagar indice apenas com base no Advisor sem confirmar impacto no app.

## A. Seguranca critica ou alta prioridade

### A1. `SECURITY DEFINER` executavel por `anon`/`authenticated`

- Alerta: funcoes privilegiadas potencialmente executaveis por papeis publicos.
- Afetado: funcoes em schema exposto, especialmente `public`.
- Risco pratico: uma funcao `SECURITY DEFINER` roda com privilegio do dono e pode contornar RLS. Se estiver executavel por `PUBLIC`, `anon` ou `authenticated`, vira superficie de API privilegiada.
- Legado ou ativo: precisa inventario. O projeto possui historico de funcoes `SECURITY DEFINER` em migrations de auditoria, folha, usuarios e triggers.
- Decisao: corrigir depois de auditoria individual.
- Proposta de correcao: listar funcoes, argumentos, dono, `prosecdef`, `proconfig`, grants de execute e uso no app; depois decidir entre `REVOKE EXECUTE`, migrar para schema privado, adicionar checagem explicita de `auth.uid()`/empresa ou manter com justificativa.
- Risco de quebra: alto, porque algumas funcoes podem ser triggers ou helpers de RLS/cadastro.
- Rollback previsto: restaurar grants anteriores e definicao original da funcao a partir de snapshot `pg_proc`/`pg_get_functiondef`.

### A2. View com comportamento de `SECURITY DEFINER`

- Alerta: view que pode bypassar RLS por nao usar `security_invoker`.
- Afetado: views publicas, se existirem no schema exposto.
- Risco pratico: usuarios podem ler dados que a RLS da tabela base bloquearia.
- Legado ou ativo: precisa inventario por `pg_views`/`pg_class`.
- Decisao: auditar antes de corrigir.
- Proposta de correcao: confirmar se a view e usada pelo app; para Postgres 17, preferir `ALTER VIEW ... SET (security_invoker = true)` quando compativel com a regra de negocio.
- Risco de quebra: medio/alto, pois views administrativas podem depender de privilegio do dono.
- Rollback previsto: remover `security_invoker` ou restaurar definicao anterior da view.

### A3. RLS habilitado sem policy em tabela publica

- Alerta: tabela publica com RLS habilitado e sem policy efetiva.
- Afetado: tabelas publicas que aparecam no Advisor.
- Risco pratico: pode bloquear uso legitimo do app, ou indicar tabela exposta sem modelo de acesso revisado.
- Legado ou ativo: precisa cruzar com services/hooks e migrations.
- Decisao: revisar em ciclo de RLS proprio.
- Proposta de correcao: decidir se a tabela deve ficar privada, se precisa grants minimos ou policies por `empresa_id`.
- Risco de quebra: alto se a tabela for usada em producao.
- Rollback previsto: restaurar policies/grants anteriores a partir de snapshot.

## B. Seguranca media/baixa

### B1. Funcoes sem `search_path` fixo

- Alerta: function search path mutable.
- Afetado: funcoes sem `SET search_path`.
- Risco pratico: risco de resolucao insegura de objetos, mais sensivel em `SECURITY DEFINER`.
- Legado ou ativo: provavelmente misto.
- Decisao: corrigir em etapa propria, comecando pelas funcoes `SECURITY DEFINER`.
- Proposta de correcao: recriar funcoes com `SET search_path = public` ou schema minimo necessario.
- Risco de quebra: medio, principalmente se a funcao acessa objetos fora de `public`.
- Rollback previsto: restaurar `CREATE OR REPLACE FUNCTION` original.

### B2. Leaked password protection desativado

- Alerta: protecao de senha vazada desativada no Auth.
- Afetado: configuracao de autenticacao Supabase.
- Risco pratico: usuarios podem usar senhas comprometidas conhecidas.
- Legado ou ativo: configuracao de plataforma, nao schema.
- Decisao: tratar em ciclo proprio de autenticacao.
- Proposta de correcao: avaliar impacto de habilitar protecao e comunicacao ao usuario final.
- Risco de quebra: baixo/medio; pode afetar login/troca de senha de usuarios com credenciais fracas.
- Rollback previsto: desabilitar a configuracao se causar bloqueio operacional inesperado.

## C. Performance com impacto provavel

### C1. Foreign keys sem indice em tabelas usadas

- Alerta: foreign key sem indice.
- Afetado conhecido:
  - `df_contas.centro_custo_id`;
  - `df_contas.user_id`;
  - `df_contas.recorrencia_id`;
  - `df_contas_pagamentos.conta_id`.
- Risco pratico: consultas por relacionamento e updates/deletes na tabela referenciada podem ficar mais caros. Em financeiro, `df_contas` e `df_contas_pagamentos` sao tabelas ativas.
- Legado ou ativo: ativo.
- Decisao: corrigir em ciclo de performance separado, depois de confirmar indices existentes reais.
- Proposta de correcao: criar indices `CREATE INDEX CONCURRENTLY` quando permitido pelo fluxo; para `df_contas_pagamentos`, avaliar se o indice composto `(empresa_id, conta_id)` ja cobre o uso real antes de criar indice redundante em `conta_id`.
- Risco de quebra: baixo funcional, medio operacional se criar indice pesado sem janela adequada.
- Rollback previsto: `DROP INDEX CONCURRENTLY IF EXISTS <indice>`.

## D. Performance para ciclo separado

### D1. RLS auth initplan

- Alerta: chamadas a `auth.uid()` ou helpers em policies sem subselect, gerando reavaliacao por linha.
- Afetado: policies de tabelas com RLS.
- Risco pratico: degradacao em tabelas grandes.
- Legado ou ativo: provavelmente ativo em policies antigas.
- Decisao: ciclo separado de RLS/performance.
- Proposta de correcao: trocar chamadas diretas por padrao `(select auth.uid())` e validar resultado identico por perfil.
- Risco de quebra: medio, pois erro em policy pode bloquear ou expor dados.
- Rollback previsto: restaurar policy anterior.

### D2. Multiplas policies permissivas

- Alerta: multiplas policies permissivas cobrindo mesma acao/role.
- Afetado: tabelas com policies legadas ou evoluidas em ciclos anteriores.
- Risco pratico: custo de avaliacao e dificuldade de auditar regra efetiva.
- Legado ou ativo: precisa inventario.
- Decisao: nao mexer junto com seguranca critica.
- Proposta de correcao: consolidar uma tabela por vez, com matriz Admin/Master/Gerente/Operador e cross-tenant.
- Risco de quebra: alto.
- Rollback previsto: recriar policies antigas.

### D3. Indices duplicados

- Alerta: indices equivalentes ou redundantes.
- Afetado: indices apontados pelo Performance Advisor.
- Risco pratico: escrita mais lenta e mais armazenamento.
- Legado ou ativo: precisa medir.
- Decisao: nao remover agora.
- Proposta de correcao: coletar `pg_stat_user_indexes`, tamanho, definicao e queries do app antes de decidir.
- Risco de quebra: medio se remover indice usado por consulta critica.
- Rollback previsto: recriar indice com a definicao original.

## E. Nao mexer agora / precisa auditoria antes

### E1. Unused indexes

- Alerta: indices sem uso observado.
- Afetado: indices listados pelo Advisor.
- Risco pratico: consumo de armazenamento e custo de escrita.
- Decisao: nao apagar neste momento.
- Motivo: estatistica de uso pode zerar apos restart, deploy, baixa volumetria ou janela curta.
- Proposta futura: observar por periodo maior e cruzar com queries reais antes de qualquer `DROP INDEX`.
- Rollback previsto: recriar indice removido com definicao exata, se futuramente removido.

### E2. Tabelas legadas

- Alerta: tabelas antigas com grants/policies/indices nao alinhados ao padrao atual.
- Afetado: tabelas legadas identificadas por Advisor ou diagnostico de catalogo.
- Decisao: auditar uso antes de alterar.
- Proposta futura: cruzar com services/hooks, imports, migrations antigas e logs de uso.
- Rollback previsto: restaurar grants/policies/indices originais.

### E3. Policies legadas sem impacto confirmado

- Alerta: policies antigas potencialmente permissivas ou duplicadas.
- Afetado: policies publicas legadas.
- Decisao: nao remover sem matriz de permissao.
- Proposta futura: testar Admin, Master, Gerente, Operador e cross-tenant antes/depois.
- Rollback previsto: recriar policy anterior.

## Plano seguro por etapas

### Etapa 1 - Documentacao e inventario

- Reexecutar Security Advisor e Performance Advisor quando MCP/CLI estiver operacional.
- Exportar ou registrar resultado bruto no relatorio do ciclo.
- Criar inventario de funcoes, views, policies e indices afetados.
- Sem alteracao de banco.

### Etapa 2 - `search_path` de funcoes

- Corrigir primeiro funcoes `SECURITY DEFINER` com `search_path` ausente.
- Fazer uma funcao por vez ou por grupo de mesma familia.
- Validar app, triggers e policies dependentes.

### Etapa 3 - `SECURITY DEFINER` expostas

- Auditar grants de `EXECUTE`.
- Confirmar uso pelo app.
- Remover exposicao publica apenas quando houver certeza e rollback.

### Etapa 4 - Indices faltantes em foreign keys criticas

- Priorizar `df_contas` e `df_contas_pagamentos`.
- Confirmar se indices compostos existentes ja cobrem a consulta.
- Nao misturar com RLS.

### Etapa 5 - RLS/policies duplicadas

- Revisar uma tabela por ciclo.
- Validar matriz de perfis e isolamento por `empresa_id`.
- Evitar policy `ALL` e `DELETE`.

### Etapa 6 - Indices duplicados/unused

- Tratar somente depois de observacao e confirmacao de baixo uso.
- Nao remover indices ligados a filtros financeiros sem plano de rollback.

## Proximo ciclo recomendado

Preferencia operacional: auditar funcoes `SECURITY DEFINER` expostas para `anon`/`authenticated`, sem alterar permissoes ainda.

Entregaveis do proximo ciclo:

1. Lista de funcoes `SECURITY DEFINER` em `public`.
2. Grants de `EXECUTE` por role.
3. `search_path` atual.
4. Se a funcao e trigger, RPC ou helper interno.
5. Uso conhecido no frontend/service/migration.
6. Classificacao: manter, corrigir `search_path`, restringir execute, mover futuramente ou revisar manualmente.
7. Nenhum `REVOKE` ainda.

## Confirmacoes deste ciclo

- Banco nao alterado.
- Dados nao alterados.
- Migrations nao criadas.
- RLS/policies nao alteradas.
- Funcoes/views nao alteradas.
- Indices nao criados, removidos ou alterados.
- Frontend/services/hooks nao alterados.
