import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260827191837_adicionar_descricao_operacional_checklist_2c6d.sql',
  'utf8'
)

function funcao(nome) {
  return migration.match(new RegExp(`create(?: or replace)? function public\\.${nome}[\\s\\S]*?end;\\n\\$\\$;`))?.[0] || ''
}

test('descrições são opcionais, limitadas e não recebem backfill', () => {
  const ddl = migration.split('drop function public.criar_item_catalogo')[0]
  assert.match(migration, /add column descricao_operacional text null/)
  assert.match(migration, /add column descricao_snapshot text null/)
  assert.match(migration, /length\(descricao_operacional\) <= 500/)
  assert.match(migration, /length\(descricao_snapshot\) <= 500/)
  assert.doesNotMatch(ddl, /update public\.df_funcionarios_desligamentos_checklist(?:_catalogo)?/i)
})

test('criação e edição aceitam descrição, inclusive limpeza explícita', () => {
  const criar = funcao('criar_item_catalogo_checklist_desligamento_controlado')
  const editar = funcao('editar_titulo_item_catalogo_checklist_desligamento_controlado')
  assert.match(criar, /p_descricao_operacional text default null/)
  assert.match(criar, /descricao_operacional, ativo/)
  assert.match(editar, /p_descricao_operacional text default null/)
  assert.match(editar, /descricao_operacional = v_descricao/)
  assert.match(editar, /nullif\(btrim\(p_descricao_operacional\), ''\)/)
})

test('snapshot copia a descrição na instanciação e não é reescrito pela edição do catálogo', () => {
  const criarChecklist = funcao('criar_item_checklist_desligamento_controlado')
  const editarCatalogo = funcao('editar_titulo_item_catalogo_checklist_desligamento_controlado')
  assert.match(criarChecklist, /titulo_snapshot, descricao_snapshot, estado/)
  assert.match(criarChecklist, /v_catalogo\.titulo, v_catalogo\.descricao_operacional, 'PENDENTE'/)
  assert.doesNotMatch(editarCatalogo, /df_funcionarios_desligamentos_checklist\s/)
  assert.doesNotMatch(editarCatalogo, /descricao_snapshot/)
})

test('RPCs mantêm autorização Admin ou Master, tenant e auditoria transacional', () => {
  for (const nome of [
    'criar_item_catalogo_checklist_desligamento_controlado',
    'editar_titulo_item_catalogo_checklist_desligamento_controlado'
  ]) {
    const rpc = funcao(nome)
    assert.match(rpc, /auth\.uid\(\) is null/)
    assert.match(rpc, /public\.is_master\(\) or public\.df_usuario_eh_admin\(p_empresa_id\)/)
    assert.match(rpc, /insert into public\.df_auditoria_eventos/)
    assert.match(migration, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.match(migration, new RegExp(`grant execute on function public\\.${nome}[\\s\\S]*to authenticated`))
  }
})

test('descrição não introduz DELETE nem regra obrigatória automática', () => {
  assert.doesNotMatch(migration, /delete from/i)
  assert.doesNotMatch(migration, /descricao_(?:operacional|snapshot)\s+text\s+not null/i)
  assert.doesNotMatch(migration, /data_prevista[^\n]*interval/i)
  assert.match(migration, /descricao_operacional text null/)
})
