import assert from 'node:assert/strict'
import test from 'node:test'
import {
  agruparProximosVencimentos,
  calcularIndicePrioridade,
  compararPrioridade,
  criarItemCentral,
  normalizarAtividadeCentral,
  normalizarContasCentral,
  normalizarDataISO,
  normalizarNotasCentral,
  resolverEstadoBloco
} from './centralDoDiaRules.js'
import { montarCentralDoDia } from './centralDoDiaSelectors.js'

const hoje = '2026-07-14'

test('prioriza falha crítica, bloqueio, atraso e vencimento de hoje nessa ordem', () => {
  assert.equal(calcularIndicePrioridade({ status: 'falha', severidade: 'critical' }), 0)
  assert.equal(calcularIndicePrioridade({ status: 'bloqueado' }), 1)
  assert.equal(calcularIndicePrioridade({ dias: -1 }), 2)
  assert.equal(calcularIndicePrioridade({ dias: 0 }), 3)
  assert.equal(calcularIndicePrioridade({ dias: 5 }), 4)
})

test('desempata por atraso, severidade, valor, data e id de forma estável', () => {
  const itens = [
    { id: 'b', dias: -2, severidade: 'warning', valor: 50, dataReferencia: '2026-07-12' },
    { id: 'a', dias: -4, severidade: 'warning', valor: 20, dataReferencia: '2026-07-10' },
    { id: 'c', dias: -2, severidade: 'critical', valor: 10, dataReferencia: '2026-07-12' }
  ]
  assert.deepEqual([...itens].sort(compararPrioridade).map((item) => item.id), ['a', 'c', 'b'])
})

test('agrupa somente vencimentos de hoje até trinta dias', () => {
  const grupos = agruparProximosVencimentos([
    { id: 'atrasado', dias: -1 },
    { id: 'hoje', dias: 0 },
    { id: 'sete', dias: 7 },
    { id: 'quinze', dias: 15 },
    { id: 'trinta', dias: 30 },
    { id: 'depois', dias: 31 }
  ])
  assert.deepEqual(grupos.map((grupo) => grupo.itens.map((item) => item.id)), [['hoje'], ['sete'], ['quinze'], ['trinta']])
})

test('exclui contas pagas e notas concluídas ou na lixeira', () => {
  const contas = normalizarContasCentral([
    { id: 'aberta', descricao: 'Conta aberta', status: 'pendente', data_vencimento: hoje },
    { id: 'paga', descricao: 'Conta paga', status: 'pago', data_vencimento: hoje },
    { id: 'lixeira', descricao: 'Conta excluída', status: 'pendente', excluido: true, data_vencimento: hoje }
  ], { dataBaseISO: hoje })
  const notas = normalizarNotasCentral([
    { id: 'aberta', titulo: 'Nota aberta', prioridade: 'urgente' },
    { id: 'concluida', titulo: 'Nota concluída', concluida: true },
    { id: 'lixeira', titulo: 'Nota excluída', excluido: true }
  ], { dataBaseISO: hoje })

  assert.deepEqual(contas.map((item) => item.id), ['conta:aberta'])
  assert.deepEqual(notas.map((item) => item.id), ['nota:aberta'])
})

test('normaliza valor ausente e rejeita data inválida', () => {
  const item = criarItemCentral({ id: 'x', tipo: 'conta', modulo: 'Contas', titulo: 'Sem valor', valor: '' })
  assert.equal(item.valor, null)
  assert.equal(normalizarDataISO('2026-02-30'), null)
  assert.equal(normalizarDataISO('texto'), null)
})

test('mantém item sem destino como informativo e não inventa navegação', () => {
  const item = criarItemCentral({ id: 'x', tipo: 'pessoas', modulo: 'Pessoas', titulo: 'Atenção', destino: null })
  assert.equal(item.destino, null)
  assert.equal(item.proximaAcao, 'Abrir o módulo de origem')
})

test('não normaliza atividade quando o usuário não possui permissão', () => {
  assert.deepEqual(normalizarAtividadeCentral([{ id: 'evento', acao: 'financeiro.conta.criada' }], false), [])
})

test('resolve estados de empresa, permissão, loading, erro, vazio e preenchido', () => {
  assert.equal(resolverEstadoBloco({}), 'empresa_ausente')
  assert.equal(resolverEstadoBloco({ empresaId: 'empresa', permitido: false }), 'sem_permissao')
  assert.equal(resolverEstadoBloco({ empresaId: 'empresa', carregando: true }), 'carregando')
  assert.equal(resolverEstadoBloco({ empresaId: 'empresa', erro: 'falha' }), 'erro')
  assert.equal(resolverEstadoBloco({ empresaId: 'empresa', itens: [] }), 'vazio')
  assert.equal(resolverEstadoBloco({ empresaId: 'empresa', itens: [{ id: 'x' }] }), 'preenchido')
})

test('monta blocos independentes e mantém ordenação estável', () => {
  const central = montarCentralDoDia({
    dataBaseISO: hoje,
    contas: [
      { id: 'b', descricao: 'B', status: 'pendente', valor: 10, data_vencimento: '2026-07-13' },
      { id: 'a', descricao: 'A', status: 'pendente', valor: 10, data_vencimento: '2026-07-13' }
    ],
    notas: [{ id: 'n', titulo: 'Nota', prioridade: 'normal', data_evento: '2026-07-20' }]
  })

  assert.deepEqual(central.acoesImediatas.map((item) => item.id), ['conta:a', 'conta:b'])
  assert.equal(central.totalProximos, 1)
  assert.equal(central.atividadeRecente.length, 0)
})
