import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260826164344_gerenciar_catalogo_checklist_2c6c.sql',
  'utf8'
)

test('RPCs do catálogo exigem Admin ou Master tenant-local', () => {
  assert.match(migration, /public\.is_master\(\) or public\.df_usuario_eh_admin\(p_empresa_id\)/)
  assert.match(migration, /auth\.uid\(\) is null/)
  assert.match(migration, /SEM_PERMISSAO_ADMIN_CATALOGO_CHECKLIST/)
  assert.doesNotMatch(migration, /df_funcionarios_pode_escrever\(p_empresa_id\)/)
})

test('criação gera código interno estável e não semeia catálogo', () => {
  assert.match(migration, /'CATALOGO_' \|\| replace\(gen_random_uuid\(\)::text, '-', ''\)/)
  assert.match(migration, /insert into public\.df_funcionarios_desligamentos_checklist_catalogo/)
  assert.doesNotMatch(migration, /devolu[cç][aã]o|contabilidade|exame demissional/i)
  assert.doesNotMatch(migration, /update public\.df_funcionarios_desligamentos_checklist_catalogo[\s\S]*set codigo/i)
})

test('edição altera somente catálogo e preserva snapshot histórico', () => {
  const editar = migration.match(/create or replace function public\.editar_titulo_item_catalogo[\s\S]*?end;\r?\n\$\$;/)?.[0] || ''
  assert.match(editar, /set titulo = v_titulo/)
  assert.doesNotMatch(editar, /df_funcionarios_desligamentos_checklist\s/)
  assert.doesNotMatch(editar, /titulo_snapshot/)
})

test('inativação é reversível, auditada e não exclui dados', () => {
  assert.match(migration, /set ativo = p_ativo/)
  assert.match(migration, /rh\.checklist_catalogo\.atividade_alterada/)
  assert.match(migration, /insert into public\.df_auditoria_eventos/)
  assert.doesNotMatch(migration, /delete from/i)
})

test('RPCs revogam PUBLIC e anon e concedem somente authenticated', () => {
  for (const rpc of [
    'criar_item_catalogo_checklist_desligamento_controlado',
    'editar_titulo_item_catalogo_checklist_desligamento_controlado',
    'alterar_atividade_item_catalogo_checklist_desligamento_controlado'
  ]) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${rpc}[\\s\\S]*from public, anon, authenticated`))
    assert.match(migration, new RegExp(`grant execute on function public\\.${rpc}[\\s\\S]*to authenticated`))
  }
})
