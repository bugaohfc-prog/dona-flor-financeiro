import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260824124836_proteger_demissional_pendente_2c5d.sql',
  'utf8'
)

test('backend impede mais de um demissional pendente ativo por vínculo', () => {
  assert.match(migration, /create unique index uq_df_funcionarios_exames_demissional_pendente_ativo/)
  assert.match(migration, /on public\.df_funcionarios_exames_ocupacionais \(empresa_id, funcionario_id\)/)
  assert.match(migration, /where tipo = 'DEMISSIONAL'[\s\S]*estado = 'PENDENTE'[\s\S]*arquivado = false/)
  assert.match(migration, /EXAME_DEMISSIONAL_PENDENTE_JA_EXISTE/)
})

test('novo demissional exige vínculo desligado sem tocar no fluxo de conclusão', () => {
  assert.match(migration, /v_status <> 'desligado' or v_funcionario_arquivado/)
  assert.match(migration, /EXAME_DEMISSIONAL_EXIGE_VINCULO_DESLIGADO/)
  assert.doesNotMatch(migration, /concluir_desligamento_funcionario_controlado/)
  assert.doesNotMatch(migration, /insert into public\.df_funcionarios_exames_ocupacionais/)
})

test('proteção cobre INSERT e transições por UPDATE sem criar automação', () => {
  assert.match(migration, /before insert or update of tipo, estado, arquivado/)
  assert.match(migration, /tg_op = 'INSERT' or old\.tipo <> 'DEMISSIONAL'/)
  assert.doesNotMatch(migration, /pg_cron|cron\.schedule|create event trigger/i)
  assert.doesNotMatch(migration, /interval\s+'[^']+'/i)
})
