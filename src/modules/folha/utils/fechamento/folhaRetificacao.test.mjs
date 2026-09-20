import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { competenciaPermiteRetificacao, ocorrenciaPermiteRetificacao, validarRetificacao } from './folhaRetificacao.js'
import { funcionarioSelecionavelParaNovaFolha } from './folhaDomain.js'

const destino = { id: 'destino', status: 'aberta', competencia: '2026-08', arquivado: true }
for (const status of ['aberta', 'em_conferencia', 'validada', 'enviada_contabilidade', 'fechada', 'arquivada']) {
  test(`mutabilidade: ${status}`, () => assert.equal(competenciaPermiteRetificacao({ ...destino, status }), ['aberta', 'em_conferencia'].includes(status)))
}
test('fechado_em prevalece e arquivamento isolado não bloqueia', () => {
  assert.equal(competenciaPermiteRetificacao(destino), true)
  assert.equal(competenciaPermiteRetificacao({ ...destino, fechado_em: '2026-09-01' }), false)
})
const origem = { item: { id: 'i', lancamento_id: 'l', categoria: 'falta_injustificada' }, lancamento: { id: 'l', categoria: 'falta_injustificada' }, competencia: destino, podeEditar: true }
test('desligado fora do fluxo normal, histórico pode oferecer retificação', () => {
  assert.equal(funcionarioSelecionavelParaNovaFolha({ status: 'desligado' }), false)
  assert.equal(ocorrenciaPermiteRetificacao(origem), true)
})
test('permissão, categoria e arquivamento da ocorrência são obrigatórios', () => {
  assert.equal(ocorrenciaPermiteRetificacao({ ...origem, podeEditar: false }), false)
  assert.equal(ocorrenciaPermiteRetificacao({ ...origem, item: { ...origem.item, categoria: 'premiacao' } }), false)
  assert.equal(ocorrenciaPermiteRetificacao({ ...origem, item: { ...origem.item, arquivado: true } }), false)
})
test('data, mês, motivo e destino são validados', () => {
  const entrada = { destino, origemId: 'origem', data: '2026-08-01', motivo: 'Correção histórica' }
  assert.doesNotThrow(() => validarRetificacao(entrada))
  for (const alteracao of [{ data: '2026-07-01' }, { data: '2026-08-32' }, { motivo: ' ' }, { origemId: 'destino' }]) assert.throws(() => validarRetificacao({ ...entrada, ...alteracao }))
})
const service = fs.readFileSync('src/services/folhaService.js', 'utf8')
const trecho = service.slice(service.indexOf('export async function retificarOcorrenciaFolha'), service.indexOf('export const obterResumoFolhaCompetencia'))
const executar = new Function(`${trecho.replace('export ', '')}; return retificarOcorrenciaFolha`)()
const uuid = '11111111-1111-4111-8111-111111111111'
const dados = { item_original_id: uuid, competencia_destino_id: uuid, data_referencia_corrigida: '2026-08-01', motivo: 'Retificação', correlation_id: uuid }
test('service chama uma RPC e propaga o resultado', async () => {
  const chamadas = []
  const resultado = { data: { ok: true } }
  assert.equal(await executar({ dados, supabase: { rpc: (...args) => { chamadas.push(args); return resultado } } }), resultado)
  assert.equal(chamadas.length, 1)
  assert.equal(chamadas[0][0], 'df_retificar_ocorrencia_folha')
})
for (const campo of ['funcionario_id', 'empresa_id', 'categoria', 'funcionario_nome_snapshot', 'snapshot_origem']) {
  test(`cliente rejeita campo arbitrário: ${campo}`, async () => assert.rejects(executar({ dados: { ...dados, [campo]: 'x' }, supabase: {} })))
}
test('UI não permite alterar funcionário nem categoria e tem estado vazio/erro/loading', () => {
  const ui = fs.readFileSync('src/modules/folha/components/fechamento/FolhaRetificacao.jsx', 'utf8')
  assert.doesNotMatch(ui, /setFuncionario|setCategoria/)
  for (const texto of ['Nenhuma competência destino elegível', 'Carregando competências', 'role="alert"', 'Arquivada']) assert.ok(ui.includes(texto))
})
test('contrato SQL: snapshots copiados, update protegido, auditoria sem exceção engolida', () => {
  const sql = fs.readFileSync('supabase/migrations/20260913145856_criar_retificacao_historica_folha_e_preservar_snapshots.sql', 'utf8')
  for (const campo of ['funcionario_nome_snapshot', 'pessoa_id_snapshot', 'filial_id_snapshot', 'filial_nome_snapshot', 'cargo_snapshot', 'data_admissao_snapshot']) assert.ok(sql.includes(`new.${campo} := v_original.${campo}`))
  assert.ok(sql.includes('SNAPSHOT_FOLHA_IMUTAVEL'))
  assert.ok(sql.includes("current_user <> 'postgres'"))
  assert.ok(sql.includes('pg_advisory_xact_lock'))
  assert.ok(sql.includes('insert into public.df_auditoria_eventos'))
  assert.doesNotMatch(sql, /exception\s+when/i)
  assert.doesNotMatch(sql, /disable trigger|disable row level|delete from/i)
})
