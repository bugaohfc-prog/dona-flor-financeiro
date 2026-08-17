import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const MIGRATION = 'supabase/migrations/20260817234032_criar_workflow_desligamento_2a.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const hardening = fs.readFileSync('supabase/migrations/20260817234923_bloquear_cadastro_desligado_direto_2a.sql', 'utf8')
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const service = fs.readFileSync('src/services/funcionariosDesligamentosService.js', 'utf8')

test('workflow possui histórico e unicidade concorrente de ABERTO', () => {
  assert.match(sql, /create table if not exists public\.df_funcionarios_desligamentos/)
  assert.match(sql, /check \(estado in \('ABERTO', 'CANCELADO'\)\)/)
  assert.match(sql, /create unique index if not exists uq_df_funcionarios_desligamentos_aberto[\s\S]*where estado = 'ABERTO'/)
  assert.match(sql, /foreign key \(empresa_id, funcionario_id\)/)
})

test('três autoridades usam tenant, locks, auditoria e grants mínimos', () => {
  for (const nome of [
    'abrir_desligamento_funcionario_controlado',
    'atualizar_desligamento_funcionario_controlado',
    'cancelar_desligamento_funcionario_controlado'
  ]) {
    assert.match(sql, new RegExp(`create or replace function public\\.${nome}`))
    assert.match(sql, new RegExp(`revoke all on function public\\.${nome}[\\s\\S]*from public, anon, authenticated`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${nome}[\\s\\S]*to authenticated`))
  }
  assert.match(sql, /security definer\s+set search_path = public, pg_temp/g)
  assert.match(sql, /df_funcionarios_pode_escrever\(p_empresa_id\)/)
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /from public\.df_funcionarios[\s\S]*for update/)
  assert.match(sql, /rh\.desligamento\.aberto/)
  assert.match(sql, /rh\.desligamento\.atualizado/)
  assert.match(sql, /rh\.desligamento\.cancelado/)
})

test('tabela não aceita escrita direta e anon não executa RPCs', () => {
  assert.match(sql, /revoke all on table public\.df_funcionarios_desligamentos from public, anon, authenticated/)
  assert.match(sql, /grant select on table public\.df_funcionarios_desligamentos to authenticated/)
  assert.doesNotMatch(sql, /grant (?:insert|update|delete)[\s\S]*df_funcionarios_desligamentos[\s\S]*authenticated/i)
})

test('2A bloqueia conclusão e preserva status e arquivamento', () => {
  assert.match(sql, /DESLIGAMENTO_CONCLUSAO_BLOQUEADA_ATE_2B/)
  assert.match(hardening, /before insert or update on public\.df_funcionarios/)
  assert.match(hardening, /tg_op = 'INSERT'/)
  assert.doesNotMatch(sql, /update\s+public\.df_funcionarios\s+set\s+status/)
  assert.doesNotMatch(sql, /update\s+public\.df_funcionarios\s+set\s+arquivado/)
  assert.doesNotMatch(sql, /concluir_desligamento_funcionario_controlado/)
  assert.match(page, /Processo em andamento — colaborador ainda não foi desligado/)
  assert.match(page, /funcionarioEditando\?\.status === 'desligado'/)
  assert.doesNotMatch(page, /<option value="desligado">Desligado<\/option>/)
})

test('UI e service usam fluxo real para abrir, editar, cancelar e consultar histórico', () => {
  assert.match(page, /useFuncionariosDesligamentos/)
  assert.match(page, /Iniciar desligamento/)
  assert.match(page, /salvarWorkflowDesligamento/)
  assert.match(page, /cancelarWorkflowDesligamento/)
  assert.match(page, /Histórico/)
  assert.match(service, /selecionarPorEmpresa\(supabase, TABELA/)
  assert.match(service, /supabase\.rpc\('abrir_desligamento_funcionario_controlado'/)
  assert.match(service, /supabase\.rpc\('atualizar_desligamento_funcionario_controlado'/)
  assert.match(service, /supabase\.rpc\('cancelar_desligamento_funcionario_controlado'/)
})

test('migration não toca Férias, Folha ou Exames', () => {
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_funcionarios_ferias_/i)
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_folha_/i)
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_funcionarios_exames_/i)
})
