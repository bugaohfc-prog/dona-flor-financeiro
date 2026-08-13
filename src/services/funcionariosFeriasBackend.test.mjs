import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260813112847_alinhar_autoridade_transacional_ferias.sql', import.meta.url),
  'utf8'
)
const service = readFileSync(new URL('./funcionariosFeriasService.js', import.meta.url), 'utf8')
const page = readFileSync(new URL('../pages/FeriasPage.jsx', import.meta.url), 'utf8')

test('migration serializa mutacoes pelo lock do ciclo e valida saldo, parcelas e sobreposicao', () => {
  assert.match(migration, /from public\.df_funcionarios_ferias_ciclos[\s\S]*for update;/i)
  assert.match(migration, /SALDO_FERIAS_INSUFICIENTE/)
  assert.match(migration, /LIMITE_TRES_PARCELAS/)
  assert.match(migration, /PERIODO_FERIAS_SOBREPOSTO/)
  assert.match(migration, /df_funcionarios_ferias_periodos_sem_sobreposicao/)
  assert.match(migration, /uq_df_ferias_periodo_parcela_ativa/)
  assert.match(migration, /uq_df_ferias_ciclo_ativo_periodo/)
})

test('migration audita dentro das RPCs e fecha escrita direta do cliente', () => {
  assert.match(migration, /perform public\.df_ferias_auditar_interno/g)
  assert.match(migration, /revoke all on public\.df_funcionarios_ferias_periodos from public, anon, authenticated/)
  assert.match(migration, /revoke all on public\.df_funcionarios_ferias_ciclos from public, anon, authenticated/)
  assert.doesNotMatch(service, /\.from\(['"]df_funcionarios_ferias_(ciclos|periodos)['"]\)[\s\S]{0,100}\.(insert|update|delete)\(/)
})

test('RPCs publicas possuem search_path fixo, grants minimos e validacao de tenant', () => {
  for (const nome of [
    'criar_ciclo_ferias_controlado',
    'ajustar_dias_ciclo_ferias_controlado',
    'alterar_estado_ciclo_ferias_controlado',
    'criar_periodo_ferias_controlado',
    'atualizar_periodo_ferias_controlado',
    'alterar_estado_periodo_ferias_controlado'
  ]) {
    assert.match(migration, new RegExp(`create or replace function public\\.${nome}`))
    assert.match(migration, new RegExp(`grant execute on function public\\.${nome}`))
  }
  assert.match(migration, /security definer[\s\S]*set search_path = public, pg_temp/i)
  assert.match(migration, /not public\.df_funcionarios_pode_escrever\(p_empresa_id\)/)
})

test('interface nao oferece status manual e apresenta os dois saldos com proxima parcela', () => {
  assert.doesNotMatch(page, />Status inicial</)
  assert.doesNotMatch(page, /value=\{formularioPeriodo\.status\}/)
  assert.doesNotMatch(page, /value=\{formularioEdicaoPeriodo\.status\}/)
  assert.match(page, /Saldo livre para programar/)
  assert.match(page, /Saldo ainda não gozado/)
  assert.match(page, /Próxima parcela/)
})
