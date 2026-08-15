import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const MIGRATION = 'supabase/migrations/20260815233000_fortalecer_proveniencia_concorrencia_ferias_2b2a.sql'
const sql = readFileSync(MIGRATION, 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('ciclo derivado recebe ledger e fingerprint forte versionado', () => {
  const admissao = corpoFuncao('alterar_admissao_funcionario_controlado')

  assert.match(admissao, /'rh\.ferias_ciclo\.derivado'/)
  assert.match(admissao, /'proveniencia', 'sistema_derivado'/)
  assert.match(admissao, /'regra', 'ferias_2b1'/)
  assert.match(admissao, /'fingerprint_versao', 'ferias_ciclo_v1'/)
  assert.match(admissao, /'fingerprint_inicial', v_fingerprint/)
  assert.match(admissao, /'empresa_id', p_empresa_id/)
  assert.match(admissao, /'correlation_id', v_correlation_id/)
})

test('fingerprint cobre identidade, datas, direito e estado sem timestamps voláteis', () => {
  const fingerprint = corpoFuncao('df_ferias_fingerprint_ciclo_interno')
  for (const campo of [
    'id', 'empresa_id', 'funcionario_id', 'periodo_aquisitivo_inicio',
    'periodo_aquisitivo_fim', 'data_limite_gozo', 'dias_direito',
    'status', 'arquivado'
  ]) {
    assert.match(fingerprint, new RegExp(`'${campo}'`))
  }
  assert.match(fingerprint, /sha256/)
  assert.doesNotMatch(fingerprint, /updated_at|atualizado_em|created_at|criado_em/)
})

test('classificação rejeita ledger duplicado ou inconsistente e preserva legado', () => {
  const proveniencia = corpoFuncao('df_ferias_proveniencia_ciclo_interno')

  assert.match(proveniencia, /v_derivacoes_fortes = 1 and v_total_derivacoes = 1/)
  assert.match(proveniencia, /PROVENIENCIA_FORTE/)
  assert.match(proveniencia, /PROVENIENCIA_INSUFICIENTE/)
  assert.match(proveniencia, /LEGADO_OU_DESCONHECIDO/)
  assert.match(proveniencia, /fingerprint_atual = v_fingerprint_inicial/)
  assert.match(proveniencia, /v_periodos = 0/)
})

test('intervenções em ciclo ou período invalidam automação permanentemente', () => {
  assert.match(sql, /rh\.ferias_ciclo\.automacao_invalidada/)
  assert.match(sql, /trg_df_ferias_ciclo_invalidar_automacao/)
  assert.match(sql, /trg_df_ferias_periodo_invalidar_automacao/)
  assert.match(sql, /dias_direito_ajustados/)
  assert.match(sql, /datas_ciclo_alteradas/)
  assert.match(sql, /estado_ciclo_alterado/)
  assert.match(sql, /periodo_criado/)
  assert.match(sql, /periodo_alterado/)
  assert.match(sql, /and acao = 'rh\.ferias_ciclo\.automacao_invalidada'/)
})

test('as sete autoridades compartilham o lock determinístico por funcionário', () => {
  const funcoes = [
    'alterar_admissao_funcionario_controlado',
    'criar_ciclo_ferias_controlado',
    'ajustar_dias_ciclo_ferias_controlado',
    'alterar_estado_ciclo_ferias_controlado',
    'criar_periodo_ferias_controlado',
    'atualizar_periodo_ferias_controlado',
    'alterar_estado_periodo_ferias_controlado'
  ]

  for (const nome of funcoes) {
    assert.match(corpoFuncao(nome), /df_ferias_bloquear_funcionario_interno/)
  }

  const lock = corpoFuncao('df_ferias_bloquear_funcionario_interno')
  assert.match(lock, /pg_advisory_xact_lock/)
  assert.match(lock, /from public\.df_funcionarios[\s\S]*for update/)
  assert.match(lock, /order by periodo_aquisitivo_inicio, id[\s\S]*for update/)
  assert.match(lock, /order by ciclo_ferias_id, data_inicio, id[\s\S]*for update/)
})

test('2B-2A não reconcilia datas nem reclassifica ciclos legados', () => {
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_inicio\s*=/i)
  assert.doesNotMatch(sql, /set\s+periodo_aquisitivo_fim\s*=/i)
  assert.doesNotMatch(sql, /set\s+data_limite_gozo\s*=/i)
  assert.doesNotMatch(sql, /update\s+public\.df_auditoria_eventos/i)
  assert.doesNotMatch(sql, /insert\s+into\s+public\.df_auditoria_eventos[^;]*\)\s*select\b[^;]*df_funcionarios_ferias_ciclos/i)
})

test('bloqueio de 29 de fevereiro e grants existentes são preservados', () => {
  const admissao = corpoFuncao('alterar_admissao_funcionario_controlado')
  assert.match(admissao, /ADMISSAO_29FEV_REQUER_DECISAO/)
  assert.match(sql, /has_function_privilege\('authenticated'/)
  assert.match(sql, /has_function_privilege\('anon'/)
  assert.match(sql, /revoke all on function public\.df_ferias_proveniencia_ciclo_interno/)
})
