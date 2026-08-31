import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260831124142_adicionar_data_acerto_agenda_lote2.sql',
  'utf8'
)
const service = fs.readFileSync('src/services/funcionariosDesligamentosService.js', 'utf8')

test('migration preserva legado nulo e registra antes/depois append-only', () => {
  assert.match(migration, /add column data_acerto date null/i)
  assert.match(migration, /add column data_acerto_antes date null/i)
  assert.match(migration, /add column data_acerto_depois date null/i)
  assert.doesNotMatch(migration, /update\s+public\.df_funcionarios_desligamentos\s+set\s+data_acerto/i)
  assert.match(migration, /coalesce\(r\.data_acerto_depois, d\.data_acerto\) as data_acerto_efetiva/i)
})

test('migration troca assinaturas operacionais sem manter overload antigo', () => {
  assert.match(migration, /drop function public\.abrir_desligamento_funcionario_controlado\(uuid,uuid,text,date,text,text\)/i)
  assert.match(migration, /drop function public\.atualizar_desligamento_funcionario_controlado\(uuid,uuid,text,date,text,text\)/i)
  assert.match(migration, /drop function public\.retificar_desligamento_concluido_controlado\(uuid,uuid,date,text,text,text,text\)/i)
  assert.match(migration, /p_data_acerto date/i)
  assert.match(migration, /DATA_ACERTO_DESLIGAMENTO_OBRIGATORIA/g)
})

test('abertura atualizacao e retificacao auditam a data do acerto', () => {
  assert.match(migration, /rh\.desligamento\.aberto[\s\S]*?'data_acerto',v_workflow\.data_acerto/i)
  assert.match(migration, /rh\.desligamento\.atualizado[\s\S]*?'data_acerto',v_antes\.data_acerto[\s\S]*?'data_acerto',v_depois\.data_acerto/i)
  assert.match(migration, /'data_acerto',v_correcao\.data_acerto_antes[\s\S]*?'data_acerto',v_correcao\.data_acerto_depois/i)
})

test('service normalizado expoe e envia os campos de acerto', () => {
  assert.match(service, /'data_acerto'/)
  assert.match(service, /'data_acerto_efetiva'/)
  assert.match(service, /'data_acerto_antes'/)
  assert.match(service, /'data_acerto_depois'/)
  assert.equal((service.match(/p_data_acerto:/g) || []).length, 3)
})
