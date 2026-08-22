import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const MIGRATION = 'supabase/migrations/20260822022738_concluir_desligamento_2b.sql'
const sql = fs.readFileSync(MIGRATION, 'utf8')
const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const folha = fs.readFileSync('src/pages/FechamentoFolhaPage.jsx', 'utf8')
const eventos = fs.readFileSync('src/modules/central-do-dia/domain/centralDoDiaPeopleRules.js', 'utf8')
const ferias = fs.readFileSync('supabase/migrations/20260816132530_corrigir_retry_observabilidade_proximo_ciclo_ferias_2b2b.sql', 'utf8')

function corpoFuncao(nome) {
  const inicio = sql.indexOf(`create or replace function public.${nome}(`)
  assert.notEqual(inicio, -1, `Função ${nome} ausente`)
  const proxima = sql.indexOf('create or replace function public.', inicio + 30)
  return sql.slice(inicio, proxima === -1 ? sql.length : proxima)
}

test('migration roll-forward adiciona CONCLUIDO sem editar o contrato 2A', () => {
  assert.match(sql, /check \(estado in \('ABERTO', 'CANCELADO', 'CONCLUIDO'\)\)/)
  assert.match(sql, /add column concluido_por uuid null/)
  assert.match(sql, /add column concluido_em timestamptz null/)
  assert.match(sql, /df_funcionarios_desligamentos_ciclo_vida_check/)
})

test('conclusão serializa funcionário e workflow na ordem canônica', () => {
  const concluir = corpoFuncao('concluir_desligamento_funcionario_controlado')
  assert.match(concluir, /df_desligamento_bloquear_funcionario_interno/)
  assert.match(concluir, /from public\.df_funcionarios_desligamentos[\s\S]*for update/)
  assert.ok(concluir.indexOf('df_desligamento_bloquear_funcionario_interno') < concluir.indexOf('for update;'))
  assert.match(concluir, /set estado = 'CONCLUIDO'/)
  assert.match(concluir, /update public\.df_funcionarios[\s\S]*set status = 'desligado'/)
})

test('invariantes bloqueiam repetição, cancelado, arquivado e status já desligado', () => {
  const concluir = corpoFuncao('concluir_desligamento_funcionario_controlado')
  for (const codigo of [
    'DESLIGAMENTO_JA_CONCLUIDO',
    'DESLIGAMENTO_CANCELADO_NAO_PODE_CONCLUIR',
    'DATA_EFETIVA_DESLIGAMENTO_OBRIGATORIA',
    'FUNCIONARIO_ARQUIVADO',
    'FUNCIONARIO_JA_DESLIGADO'
  ]) assert.match(concluir, new RegExp(codigo))
  assert.doesNotMatch(concluir, /set\s+arquivado\s*=/i)
})

test('auditorias de workflow e status pertencem à mesma transação', () => {
  const concluir = corpoFuncao('concluir_desligamento_funcionario_controlado')
  assert.match(sql, /^begin;/)
  assert.match(sql, /commit;\s*$/)
  assert.match(concluir, /rh\.desligamento\.concluido/)
  assert.match(concluir, /rh\.funcionario\.status_alterado/)
  assert.match(concluir, /dados_antes, dados_depois/)
  assert.match(concluir, /data_efetiva/)
  assert.match(concluir, /correlation_id/)
})

test('grants expõem somente a RPC controlada para authenticated', () => {
  assert.match(sql, /security definer\s+set search_path = ''/)
  assert.match(sql, /revoke all on function public\.concluir_desligamento_funcionario_controlado[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /grant execute on function public\.concluir_desligamento_funcionario_controlado[\s\S]*to authenticated/)
})

test('trigger exige workflow concluído e não implementa readmissão', () => {
  const trigger = corpoFuncao('df_funcionarios_bloquear_desligamento_direto_2a')
  assert.match(trigger, /DESLIGAMENTO_REQUER_WORKFLOW_CONCLUIDO/)
  assert.match(trigger, /d\.estado = 'CONCLUIDO'/)
  assert.match(trigger, /READMISSAO_REQUER_FLUXO_CONTROLADO/)
})

test('conclusão preserva Férias, Folha, Exames e zero exclusão física', () => {
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_funcionarios_ferias_/i)
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_folha_/i)
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.df_funcionarios_exames_/i)
  assert.doesNotMatch(sql, /delete\s+from/i)
  assert.match(ferias, /v_funcionario\.status <> 'ativo'/)
  assert.match(folha, /new Map\(\(funcionarios \|\| \[\]\)\.map/)
  assert.match(folha, /\.filter\(\(item\) => !item\.arquivado\)/)
})

test('Agenda e Dashboard preservam projeção canônica e lote sem N+1', () => {
  assert.match(eventos, /function funcionarioAtivo/)
  assert.match(eventos, /texto\(funcionario\.status\)\.toLowerCase\(\) !== 'ativo'/)
  assert.match(eventos, /export function projetarEventosPessoas/)
  assert.match(page, /Concluir desligamento/)
  assert.match(page, /Confirmar conclusão/)
  assert.match(page, /O cadastro NÃO será arquivado/)
})

test('UI mantém histórico e indisponibiliza edição, cancelamento e readmissão após conclusão', () => {
  assert.match(page, /item\.estado === 'CONCLUIDO'/)
  assert.match(page, /funcionario\.status === 'desligado'[\s\S]*'Ver histórico'/)
  assert.match(page, /disabled=\{funcionarioEditando\?\.status === 'desligado'\}/)
  assert.match(page, /desligamentoAbertoSelecionado && \(/)
})
