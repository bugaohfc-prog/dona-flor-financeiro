import test from 'node:test'
import assert from 'node:assert/strict'

import {
  agruparContasPorAnoMes,
  criarEstadoExpansaoPadrao,
  reconciliarEstadoExpansao
} from './contasAgrupamento.js'

const referencia = new Date(2026, 6, 17)
const vencida = (data, status) => status !== 'pago' && data < '2026-07-17'

function conta(id, data, status = 'pendente', valor = 100, extras = {}) {
  return { id, data_vencimento: data, status, valor, ...extras }
}

function agrupar(lista) {
  return agruparContasPorAnoMes(lista, { dataReferencia: referencia, estaVencida: vencida })
}

test('separa contas entre 2024, 2025 e 2026', () => {
  const grupos = agrupar([conta('a', '2024-01-10'), conta('b', '2025-02-10'), conta('c', '2026-07-10')])
  assert.deepEqual(grupos.map((grupo) => grupo.ano), [2026, 2025, 2024])
})

test('ordena anos do mais recente para o mais antigo', () => {
  const grupos = agrupar([conta('a', '2025-01-10'), conta('b', '2023-01-10'), conta('c', '2026-01-10')])
  assert.deepEqual(grupos.map((grupo) => grupo.ano), [2026, 2025, 2023])
})

test('abre o ano atual por padrao', () => {
  const estado = criarEstadoExpansaoPadrao(agrupar([conta('a', '2026-07-10'), conta('b', '2025-12-10')]))
  assert.equal(estado.anos['2026'], true)
})

test('mantem anos anteriores recolhidos por padrao', () => {
  const estado = criarEstadoExpansaoPadrao(agrupar([conta('a', '2026-07-10'), conta('b', '2025-12-10')]))
  assert.equal(estado.anos['2025'], false)
})

test('abre o mes atual por padrao', () => {
  const estado = criarEstadoExpansaoPadrao(agrupar([conta('a', '2026-07-10'), conta('b', '2026-08-10')]))
  assert.equal(estado.meses['2026-07'], true)
  assert.equal(estado.meses['2026-08'], false)
})

test('ordena meses futuros depois do atual', () => {
  const [ano] = agrupar([conta('a', '2026-09-10'), conta('b', '2026-07-10'), conta('c', '2026-08-10')])
  assert.deepEqual(ano.meses.map((mes) => mes.chave), ['2026-07', '2026-08', '2026-09'])
})

test('ordena meses anteriores depois dos futuros e em ordem decrescente', () => {
  const [ano] = agrupar([
    conta('a', '2026-06-10'), conta('b', '2026-08-10'), conta('c', '2026-07-10'), conta('d', '2026-05-10')
  ])
  assert.deepEqual(ano.meses.map((mes) => mes.chave), ['2026-07', '2026-08', '2026-06', '2026-05'])
})

test('ordena meses de anos anteriores de dezembro para janeiro', () => {
  const [ano] = agrupar([conta('a', '2025-01-10'), conta('b', '2025-12-10'), conta('c', '2025-06-10')])
  assert.deepEqual(ano.meses.map((mes) => mes.chave), ['2025-12', '2025-06', '2025-01'])
})

test('nao cria meses sem contas', () => {
  const [ano] = agrupar([conta('a', '2026-07-10'), conta('b', '2026-09-10')])
  assert.equal(ano.meses.length, 2)
})

test('agrupa somente a lista visivel recebida apos os filtros', () => {
  const visiveis = [conta('aberta', '2026-07-10')]
  assert.deepEqual(agrupar(visiveis)[0].meses[0].contas.map((item) => item.id), ['aberta'])
})

test('calcula totais do ano', () => {
  const [ano] = agrupar([conta('a', '2026-07-10', 'pendente', 100), conta('b', '2026-08-10', 'pago', 50)])
  assert.equal(ano.totalContas, 2)
  assert.equal(ano.valorTotal, 150)
})

test('calcula totais do mes', () => {
  const [mes] = agrupar([conta('a', '2026-07-10', 'pendente', 100), conta('b', '2026-07-20', 'pago', 50)])[0].meses
  assert.equal(mes.totalContas, 2)
  assert.equal(mes.valorTotal, 150)
})

test('conta abertas', () => {
  const [ano] = agrupar([conta('a', '2026-07-20'), conta('b', '2026-07-20', 'pago')])
  assert.equal(ano.abertas, 1)
})

test('conta vencidas', () => {
  const [ano] = agrupar([conta('a', '2026-07-10'), conta('b', '2026-07-20')])
  assert.equal(ano.vencidas, 1)
})

test('conta pagas', () => {
  const [ano] = agrupar([conta('a', '2026-07-10', 'pago'), conta('b', '2026-07-20')])
  assert.equal(ano.pagas, 1)
})

test('ignora valores nulos e invalidos na soma', () => {
  const [ano] = agrupar([conta('a', '2026-07-10', 'pendente', null), conta('b', '2026-07-20', 'pendente', 'invalido')])
  assert.equal(ano.valorTotal, 0)
})

test('mantem contas com data invalida em grupo seguro', () => {
  const grupos = agrupar([conta('a', 'data-invalida')])
  assert.equal(grupos.at(-1).chave, 'sem-data')
  assert.equal(grupos.at(-1).totalContas, 1)
})

test('nao altera os objetos originais', () => {
  const original = conta('a', '2026-07-10')
  const copia = structuredClone(original)
  agrupar([original])
  assert.deepEqual(original, copia)
})

test('usa ano e mes na chave mensal', () => {
  assert.equal(agrupar([conta('a', '2026-07-10')])[0].meses[0].chave, '2026-07')
})

test('lista vazia retorna estrutura vazia', () => {
  assert.deepEqual(agrupar([]), [])
})

test('sem conta no mes atual escolhe o futuro mais proximo', () => {
  const estado = criarEstadoExpansaoPadrao(agrupar([conta('a', '2026-09-10'), conta('b', '2026-08-10'), conta('c', '2026-06-10')]))
  assert.equal(estado.meses['2026-08'], true)
})

test('sem mes futuro escolhe o anterior mais recente', () => {
  const estado = criarEstadoExpansaoPadrao(agrupar([conta('a', '2026-05-10'), conta('b', '2026-06-10')]))
  assert.equal(estado.meses['2026-06'], true)
})

test('reinicio por troca de empresa reaplica o estado padrao', () => {
  const grupos = agrupar([conta('a', '2026-07-10'), conta('b', '2025-12-10')])
  const alterado = { anos: { '2026': false, '2025': true }, meses: { '2026-07': false, '2025-12': true } }
  assert.deepEqual(reconciliarEstadoExpansao(alterado, grupos, { reiniciar: true }), criarEstadoExpansaoPadrao(grupos))
})

test('atualizacao preserva grupos fechados pelo usuario', () => {
  const grupos = agrupar([conta('a', '2026-07-10'), conta('b', '2026-08-10')])
  const estado = { anos: { '2026': true }, meses: { '2026-07': false, '2026-08': true } }
  assert.deepEqual(reconciliarEstadoExpansao(estado, grupos), estado)
})

test('filtro remove grupos inexistentes e eles retornam recolhidos', () => {
  const completos = agrupar([conta('a', '2026-07-10'), conta('b', '2025-12-10')])
  const filtrados = agrupar([conta('a', '2026-07-10')])
  const aberto = { anos: { '2026': true, '2025': true }, meses: { '2026-07': true, '2025-12': true } }
  const semHistorico = reconciliarEstadoExpansao(aberto, filtrados)
  const restaurado = reconciliarEstadoExpansao(semHistorico, completos)
  assert.equal(restaurado.anos['2025'], false)
  assert.equal(restaurado.meses['2025-12'], false)
})
