import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync(
  new URL('../../.github/workflows/redteam-p0-banco-isolado.yml', import.meta.url),
  'utf8'
)
const authenticated = readFileSync(
  new URL('./redteam_p0_authenticated.test.sql', import.meta.url),
  'utf8'
)
const concurrency = readFileSync(
  new URL('./redteam_p0_concurrency.sh', import.meta.url),
  'utf8'
)

test('workflow P0 e manual, isolado e usa Supabase CLI fixada', () => {
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /runs-on: ubuntu-latest/)
  assert.match(workflow, /version: 2\.110\.0/)
  assert.match(workflow, /supabase db start/)
  assert.match(workflow, /supabase migration up --local --include-all/)
})

test('workflow P0 nao possui caminho de deploy ou Supabase remoto', () => {
  assert.doesNotMatch(workflow, /secrets\./)
  assert.doesNotMatch(workflow, /supabase (?:link|db push|functions deploy)/)
  assert.doesNotMatch(workflow, /project-ref|service_role/i)
  assert.match(workflow, /postgresql:\/\/postgres:postgres@127\.0\.0\.1:54322\/postgres/)
})

test('matriz autenticada cobre todos os P0 e bypasses pedidos', () => {
  for (const id of ['P0-1', 'P0-2', 'P0-3', 'P0-4']) {
    assert.match(authenticated, new RegExp(id))
  }
  assert.match(authenticated, /update public\.df_contas_pagamentos set valor_pago/)
  assert.match(authenticated, /delete from public\.df_contas/)
  assert.match(authenticated, /delete from public\.df_notas/)
  assert.match(authenticated, /df_folha_lancamentos/)
  assert.match(authenticated, /df_folha_lancamento_itens/)
  assert.match(authenticated, /df_contas_recorrentes/)
})

test('P0-1 usa duas sessoes PostgreSQL reais em paralelo', () => {
  assert.match(concurrency, /run_payment "\$KEY_A"[^&]+&/s)
  assert.match(concurrency, /run_payment "\$KEY_B"[^&]+&/s)
  assert.match(concurrency, /wait "\$PID_A"/)
  assert.match(concurrency, /wait "\$PID_B"/)
  assert.match(concurrency, /count\(\*\).*sum\(valor_pago\)/s)
})

test('workflow sempre publica relatorio e logs como artefato', () => {
  assert.match(workflow, /actions\/upload-artifact@v4/)
  assert.match(workflow, /if: always\(\)/)
  assert.match(workflow, /RELATORIO\.md/)
  assert.match(workflow, /P0_1=.*P0_2=.*P0_3=.*P0_4=/s)
  assert.match(
    workflow,
    /steps\.pgtap\.outcome[\s\S]+p0_1=BLOQUEADO[\s\S]+p0_2=BLOQUEADO[\s\S]+p0_3=BLOQUEADO[\s\S]+p0_4=BLOQUEADO/
  )
})
