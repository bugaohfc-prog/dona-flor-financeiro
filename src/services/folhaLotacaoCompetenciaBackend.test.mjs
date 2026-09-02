import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260902130444_definir_lotacao_folha_competencia_lote3a.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')

test('sem data de referência usa o último dia da competência', () => {
  assert.match(sql, /select c\.competencia[\s\S]*from public\.df_folha_competencias c/)
  assert.match(sql, /v_data_lotacao := coalesce\([\s\S]*new\.data_referencia[\s\S]*interval '1 month - 1 day'/)
})

test('data de referência explícita prevalece sobre a regra mensal', () => {
  const coalesce = sql.match(/v_data_lotacao := coalesce\(([\s\S]*?)\);/)
  assert.ok(coalesce)
  assert.ok(coalesce[1].indexOf('new.data_referencia') < coalesce[1].indexOf("interval '1 month - 1 day'"))
})

test('resolver temporal recebe a data canônica de lotação', () => {
  assert.match(
    sql,
    /df_funcionario_filial_na_data_lote3\([\s\S]*new\.empresa_id,[\s\S]*new\.funcionario_id,[\s\S]*v_data_lotacao[\s\S]*\)/
  )
  assert.match(sql, /df_folha_validar_data_efetiva_2c2\([\s\S]*v_data_lotacao[\s\S]*\)/)
})

test('snapshots existentes continuam imutáveis e não há backfill', () => {
  assert.match(sql, /if tg_op = 'UPDATE'[\s\S]*SNAPSHOT_FOLHA_IMUTAVEL/)
  assert.doesNotMatch(sql, /update\s+public\.df_folha_lancamentos/i)
  assert.doesNotMatch(sql, /delete\s+from\s+public\.df_folha_lancamentos/i)
})

test('regra não cria rateio nem altera cálculo financeiro', () => {
  assert.doesNotMatch(sql, /pr[oó]-?rata|rateio|divis[aã]o\s+por\s+dias/i)
  assert.doesNotMatch(sql, /new\.(valor|quantidade|percentual)\s*:=/i)
})
