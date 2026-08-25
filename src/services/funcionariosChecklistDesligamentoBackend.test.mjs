import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260825151243_criar_checklist_rescisorio_2c6b.sql',
  'utf8'
)
const migrationAuditoria = fs.readFileSync(
  'supabase/migrations/20260825152405_corrigir_acoes_auditoria_checklist_2c6b.sql',
  'utf8'
)

test('migration cria catálogo tenant-local sem semear obrigações', () => {
  assert.match(migration, /create table public\.df_funcionarios_desligamentos_checklist_catalogo/)
  assert.match(migration, /unique \(empresa_id, codigo\)/)
  assert.match(migration, /enable row level security/)
  assert.match(migration, /force row level security/)
  assert.match(migration, /grant select on table public\.df_funcionarios_desligamentos_checklist_catalogo to authenticated/)
  assert.doesNotMatch(migration, /insert into public\.df_funcionarios_desligamentos_checklist_catalogo/i)
})

test('item preserva workflow e vínculo com estados simples e snapshot imutável', () => {
  assert.match(migration, /foreign key \(empresa_id, desligamento_id\)[\s\S]*references public\.df_funcionarios_desligamentos\(empresa_id, id\)/)
  assert.match(migration, /foreign key \(empresa_id, funcionario_id\)[\s\S]*references public\.df_funcionarios\(empresa_id, id\)/)
  assert.match(migration, /estado in \('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL'\)/)
  assert.match(migration, /new\.titulo_snapshot is distinct from old\.titulo_snapshot/)
  assert.match(migration, /CHECKLIST_DESLIGAMENTO_DELETE_BLOQUEADO/)
  assert.match(migration, /estado = 'CONCLUIDO' and concluido_em is not null and concluido_por is not null/)
})

test('autoridades bloqueiam workflow não concluído e conclusão revertida', () => {
  assert.match(migration, /CHECKLIST_EXIGE_DESLIGAMENTO_CONCLUIDO/)
  assert.match(migration, /c\.tipo = 'REVERSAO_ERRO'/)
  assert.match(migration, /CHECKLIST_DESLIGAMENTO_REVERTIDO/)
  assert.match(migration, /df_desligamento_bloquear_funcionario_interno/)
  assert.match(migration, /for update/)
})

test('mutações são RPCs auditadas atomicamente e não são públicas', () => {
  for (const rpc of [
    'criar_item_checklist_desligamento_controlado',
    'atualizar_item_checklist_desligamento_controlado',
    'alterar_estado_item_checklist_desligamento_controlado'
  ]) {
    assert.match(migration, new RegExp(`security definer[\\s\\S]*revoke all on function public\\.${rpc}`))
    assert.match(migration, new RegExp(`grant execute on function public\\.${rpc}[\\s\\S]*to authenticated`))
  }
  assert.match(migrationAuditoria, /rh\.checklist_item\.criado/)
  assert.match(migrationAuditoria, /rh\.checklist_item\.atualizado/)
  assert.match(migrationAuditoria, /rh\.checklist_item\.estado_alterado/)
  assert.match(migrationAuditoria, /pg_get_functiondef/)
  assert.match(migration, /insert into public\.df_auditoria_eventos/)
  assert.doesNotMatch(migration, /registrar_exame_ocupacional_controlado|df_funcionarios_exames_ocupacionais|useEventosPessoas|Agenda|Dashboard/)
})

test('RLS limita leitura ao tenant e cliente não recebe escrita direta', () => {
  assert.match(migration, /df_funcionarios_pode_escrever\(empresa_id\)/)
  assert.match(migration, /revoke all on table public\.df_funcionarios_desligamentos_checklist from public, anon, authenticated/)
  assert.match(migration, /grant select on table public\.df_funcionarios_desligamentos_checklist to authenticated/)
  assert.doesNotMatch(migration, /grant (insert|update|delete)/i)
})
