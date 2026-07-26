import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL(
  '../../supabase/migrations/20260726001346_proteger_recorrencia_id_admin_master.sql',
  import.meta.url
)

async function lerMigration() {
  return readFile(migrationUrl, 'utf8')
}

test('Admin e Master sao as unicas autorizacoes do vinculo no backend', async () => {
  const sql = await lerMigration()
  assert.match(sql, /public\.is_master\(\)/)
  assert.match(sql, /public\.df_usuario_eh_admin\(old\.empresa_id\)/)
  assert.match(sql, /public\.df_usuario_eh_admin\(new\.empresa_id\)/)
  assert.doesNotMatch(sql, /gerente/i)
})

test('Gerente e REST direto recebem erro de privilegio ao alterar recorrencia_id', async () => {
  const sql = await lerMigration()
  assert.match(sql, /before update of recorrencia_id/i)
  assert.match(sql, /errcode\s*=\s*'42501'/i)
  assert.match(sql, /Somente Admin ou Master pode alterar recorrencia_id/)
})

test('trigger atua somente quando recorrencia_id realmente muda', async () => {
  const sql = await lerMigration()
  assert.match(sql, /old\.recorrencia_id is distinct from new\.recorrencia_id/i)
  assert.match(sql, /new\.recorrencia_id is not distinct from old\.recorrencia_id/i)
  assert.doesNotMatch(sql, /before update(?! of recorrencia_id)/i)
})

test('demais updates financeiros permanecem sob as policies existentes', async () => {
  const sql = await lerMigration()
  assert.doesNotMatch(sql, /alter policy|create policy|drop policy/i)
  assert.doesNotMatch(sql, /revoke\s+update\s+on\s+(table\s+)?public\.df_contas/i)
  assert.doesNotMatch(sql, /after update|instead of update/i)
})

test('tenant e seguranca do trigger nao usam metadado editavel ou privilegio elevado', async () => {
  const sql = await lerMigration()
  assert.match(sql, /security invoker/i)
  assert.match(sql, /auth\.uid\(\)/)
  assert.match(sql, /old\.empresa_id/)
  assert.match(sql, /new\.empresa_id/)
  assert.doesNotMatch(sql, /user_metadata|raw_user_meta_data|security definer/i)
})

test('indice protegido e tratamento de concorrencia 23505 permanecem intactos', async () => {
  const [sql, service] = await Promise.all([
    lerMigration(),
    readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(sql, /drop\s+index|alter\s+index|create\s+(unique\s+)?index/i)
  assert.match(service, /uq_df_contas_recorrencia_vencimento_ativas/)
  assert.match(service, /error\?\.code === '23505'/)
  assert.match(service, /\.is\('recorrencia_id', null\)/)
})

test('migration permanece restrita ao vinculo e a geracao exige confirmacao explicita', async () => {
  const [sql, pagina, service] = await Promise.all([
    lerMigration(),
    readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  ])
  assert.doesNotMatch(sql, /\binsert\b|\bdelete\b/i)
  assert.match(pagina, /Gerar ocorrência/)
  assert.match(pagina, /Confirmar geração/)
  assert.match(pagina, /ocorrencia\?\.cobertura !== 'faltante'/)
  assert.match(pagina, /!podeGerarRecorrencia/)
  assert.equal((service.match(/inserirComEmpresa\(supabase, 'df_contas', previa\.payload/g) || []).length, 1)
  assert.doesNotMatch(service, /executarPlanejamento|inserirEmLotes/)
})
