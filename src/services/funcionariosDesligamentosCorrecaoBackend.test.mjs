import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync('supabase/migrations/20260823175453_corrigir_reverter_desligamento_2c3.sql', 'utf8')
const hardening = fs.readFileSync('supabase/migrations/20260823180846_corrigir_severidade_auditoria_reversao_2c3.sql', 'utf8')
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const service = fs.readFileSync('src/services/funcionariosDesligamentosService.js', 'utf8')

test('correções são estruturadas, tenant-safe, append-only e sem escrita cliente', () => {
  assert.match(migration, /create table public\.df_funcionarios_desligamentos_correcoes/)
  assert.match(migration, /tipo in \('RETIFICACAO', 'REVERSAO_ERRO'\)/)
  assert.match(migration, /data_efetiva_antes date not null[\s\S]*data_efetiva_depois date not null/)
  assert.match(migration, /alter table public\.df_funcionarios_desligamentos_correcoes force row level security/)
  assert.match(migration, /CORRECAO_DESLIGAMENTO_APPEND_ONLY/)
  assert.match(migration, /revoke all on table public\.df_funcionarios_desligamentos_correcoes from public, anon, authenticated/)
  assert.doesNotMatch(migration, /grant (?:insert|update|delete)[^;]*df_funcionarios_desligamentos_correcoes[^;]*authenticated/i)
})

test('estado anterior é estrutural, comprovado e nunca presumido como ativo', () => {
  assert.match(migration, /add column status_anterior text null/)
  assert.match(migration, /a\.dados_antes ->> 'status' in \('ativo', 'afastado'\)/)
  assert.match(migration, /having count\(\*\) = 1/)
  assert.match(migration, /STATUS_ANTERIOR_NAO_COMPROVADO/)
  assert.doesNotMatch(migration, /coalesce\(v_workflow\.status_anterior,\s*'ativo'\)/)
})

test('visão efetiva centraliza retificações e reversão sem sobrescrever workflow', () => {
  assert.match(migration, /create view public\.df_funcionarios_desligamentos_efetivos/)
  assert.match(migration, /with \(security_invoker = true\)/)
  assert.match(migration, /data_efetiva_efetiva/)
  assert.match(migration, /efeito_revertido/)
  assert.doesNotMatch(migration, /update public\.df_funcionarios_desligamentos\s+set\s+(?:data_efetiva|motivo|observacoes)/i)
})

test('retificação bloqueia contradições temporais e não altera dependências', () => {
  assert.match(migration, /RETIFICACAO_DATA_CONFLITO_FOLHA/)
  assert.match(migration, /RETIFICACAO_DATA_CONFLITO_FERIAS/)
  assert.match(migration, /RETIFICACAO_DATA_CONFLITO_EXAMES/)
  assert.doesNotMatch(migration, /update public\.df_(?:folha|funcionarios_ferias|funcionarios_exames)/i)
  assert.match(migration, /DESLIGAMENTO_REVERTIDO_NAO_PODE_SER_RETIFICADO/)
})

test('reversão restaura apenas estado comprovado, é única e mantém CONCLUIDO', () => {
  assert.match(migration, /uq_df_desligamentos_correcoes_reversao/)
  assert.match(migration, /DESLIGAMENTO_JA_REVERTIDO/)
  assert.match(migration, /REVERSAO_BLOQUEADA_POR_WORKFLOW_POSTERIOR/)
  assert.match(migration, /set status=v_workflow\.status_anterior/)
  assert.doesNotMatch(migration, /set estado='CANCELADO'/)
  assert.match(migration, /READMISSAO_REQUER_FLUXO_CONTROLADO/)
})

test('operações compartilham locks, correlation e auditoria atômica', () => {
  for (const nome of ['retificar_desligamento_concluido_controlado', 'reverter_desligamento_concluido_por_erro_controlado']) {
    assert.match(migration, new RegExp(`create or replace function public\\.${nome}`))
  }
  assert.match(migration, /df_desligamento_bloquear_funcionario_interno/)
  assert.match(migration, /for update/)
  assert.match(migration, /rh\.desligamento\.retificado/)
  assert.match(migration, /rh\.desligamento\.revertido/)
  assert.match(migration, /rh\.funcionario\.status_alterado/)
  assert.match(migration, /v_correlation/)
  assert.match(hardening, /rh\.desligamento\.revertido','warning'/)
  assert.doesNotMatch(hardening, /'alerta'/)
})

test('Folha usa data efetiva canônica e snapshots não são reescritos', () => {
  assert.match(migration, /from public\.df_funcionarios_desligamentos_efetivos/)
  assert.match(migration, /and not d\.efeito_revertido/)
  assert.doesNotMatch(migration, /update public\.df_folha_lancamentos/)
  assert.doesNotMatch(migration, /update public\.df_folha_lancamento_itens/)
})

test('service e UI separam retificação, reversão e histórico original', () => {
  assert.match(service, /retificar_desligamento_concluido_controlado/)
  assert.match(service, /reverter_desligamento_concluido_por_erro_controlado/)
  assert.match(page, />Retificar</)
  assert.match(page, /Reverter conclusão por erro/)
  assert.match(page, /não representa readmissão/i)
  assert.match(page, /registro original da conclusão nunca é sobrescrito/i)
})
