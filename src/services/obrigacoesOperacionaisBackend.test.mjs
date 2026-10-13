import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL('../../supabase/migrations/20261013095402_p0_obrigacoes_central_lote1.sql', import.meta.url)
const serviceUrl = new URL('./obrigacoesOperacionaisService.js', import.meta.url)

test('migration cria uma unica autoridade tenant-local com RLS forcada e sem escrita direta', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  assert.match(sql, /create table public\.df_obrigacoes_operacionais/i)
  assert.match(sql, /unique index uq_df_obrigacoes_desligamento_regra[\s\S]*\(empresa_id, desligamento_id, regra_codigo\)/i)
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /force row level security/i)
  assert.match(sql, /revoke all on table public\.df_obrigacoes_operacionais from public, anon, authenticated/i)
  assert.match(sql, /grant select on table public\.df_obrigacoes_operacionais to authenticated/i)
  assert.doesNotMatch(sql, /grant (insert|update|delete)/i)
})

test('abertura e cancelamento tratam obrigacao na mesma transacao', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  assert.match(sql, /create or replace function public\.abrir_desligamento_funcionario_controlado[\s\S]*insert into public\.df_obrigacoes_operacionais[\s\S]*rh\.obrigacao\.criada/i)
  assert.match(sql, /create or replace function public\.cancelar_desligamento_funcionario_controlado[\s\S]*estado = 'CANCELADA'[\s\S]*rh\.obrigacao\.cancelada/i)
  assert.match(sql, /desligamento\.conferencia_inicial/i)
})

test('RPCs controlam reatribuicao, acompanhamento e resolucao com auditoria', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  for (const rpc of [
    'reatribuir_obrigacao_operacional_controlado',
    'atualizar_acompanhamento_obrigacao_controlado',
    'resolver_obrigacao_operacional_controlado'
  ]) assert.match(sql, new RegExp(`security definer[\\s\\S]*${rpc}|${rpc}[\\s\\S]*security definer`, 'i'))
  assert.match(sql, /p_snooze_minutos not in \(30,60\)/i)
  assert.match(sql, /NAO_APLICAVEL','DISPENSADA/i)
  assert.match(sql, /MOTIVO_RESOLUCAO_OBRIGATORIO/i)
})

test('frontend usa somente SELECT e RPCs controladas para obrigacoes', async () => {
  const fonte = await readFile(serviceUrl, 'utf8')
  assert.match(fonte, /\.from\('df_obrigacoes_operacionais'\)[\s\S]*\.select/i)
  assert.match(fonte, /\.from\('df_usuarios_empresas'\)[\s\S]*\.select/i)
  assert.doesNotMatch(fonte, /\.from\('df_obrigacoes_operacionais'\)[\s\S]*\.(insert|update|delete)\(/i)
  assert.doesNotMatch(fonte, /\.from\('df_usuarios_empresas'\)[\s\S]*\.(insert|update|delete)\(/i)
  assert.match(fonte, /reatribuir_obrigacao_operacional_controlado/)
  assert.match(fonte, /atualizar_acompanhamento_obrigacao_controlado/)
  assert.match(fonte, /resolver_obrigacao_operacional_controlado/)
})
