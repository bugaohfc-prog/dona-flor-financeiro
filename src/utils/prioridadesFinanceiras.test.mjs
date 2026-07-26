import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { montarCentralPrioridadesFinanceiras } from './prioridadesFinanceiras.js'

const base = {
  empresa_id: 'e1',
  status: 'pendente',
  data_vencimento: '2026-07-30',
  valor: 1000,
  saldo_restante_relatorio: 1000,
  oculto: false,
  excluido: false,
  deletado: false,
  filial_id: 'f1',
  centro_custo_id: 'c1'
}

function conta(id, extra = {}) {
  return { ...base, id, descricao: `Fornecedor ${id}`, ...extra }
}

test('score prioriza vencida de alto valor, imposto e recorrencia', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [
      conta('normal'),
      conta('critica', {
        data_vencimento: '2026-06-01',
        saldo_restante_relatorio: 15000,
        imposto_tipo: 'inss',
        recorrencia_id: 'r1'
      })
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  assert.equal(resultado.prioridades[0].id, 'critica')
  assert.equal(resultado.prioridades[0].nivel, 'critica')
  assert.ok(resultado.prioridades[0].score > resultado.prioridades[1].score)
})

test('ordenacao possui desempate estavel por atraso valor vencimento e id', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [conta('b'), conta('a')],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  assert.deepEqual(resultado.prioridades.map((item) => item.id), ['a', 'b'])
})

test('vencidas e proximas do vencimento recebem sinais distintos', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [
      conta('vencida', { data_vencimento: '2026-07-01' }),
      conta('proxima', { data_vencimento: '2026-07-28' }),
      conta('distante', { data_vencimento: '2026-10-30' })
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  const mapa = new Map(resultado.prioridades.map((item) => [item.id, item]))
  assert.ok(mapa.get('vencida').score > mapa.get('proxima').score)
  assert.ok(mapa.get('proxima').score > mapa.get('distante').score)
})

test('concentracao do mesmo fornecedor ou descricao compoe o score', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [
      conta('a', { descricao: 'Fornecedor recorrente' }),
      conta('b', { descricao: 'Fornecedor recorrente' }),
      conta('unica', { descricao: 'Fornecedor único' })
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  const mapa = new Map(resultado.prioridades.map((item) => [item.id, item]))
  assert.ok(mapa.get('a').score > mapa.get('unica').score)
  assert.match(mapa.get('a').motivos.join(' '), /fornecedor\/descrição/)
})

test('pagamento parcial usa somente o saldo restante', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [conta('parcial', { valor: 10000, saldo_restante_relatorio: 400 })],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  assert.equal(resultado.prioridades[0].saldo, 400)
  assert.doesNotMatch(resultado.prioridades[0].motivos.join(' '), /Alto impacto/)
})

test('destaca ausencia de filial e centro de custo', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [conta('incompleta', { filial_id: null, centro_custo_id: null })],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  assert.equal(resultado.resumo.semFilial, 1)
  assert.equal(resultado.resumo.semCentro, 1)
  assert.equal(resultado.prioridades[0].semFilial, true)
  assert.equal(resultado.prioridades[0].semCentro, true)
})

test('identifica recorrencias futuras faltantes e possiveis manuais', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [],
    ocorrenciasCobertura: [
      { identidade: 'r1|1', recorrenciaId: 'r1', cobertura: 'faltante', dataVencimento: '2026-08-10', serie: { filial_id: 'f1', centro_custo_id: 'c1' } },
      { identidade: 'r2|1', recorrenciaId: 'r2', cobertura: 'possivel_manual', dataVencimento: '2026-08-11', serie: { filial_id: 'f1', centro_custo_id: 'c1' } },
      { identidade: 'r3|1', recorrenciaId: 'r3', cobertura: 'coberta', dataVencimento: '2026-08-12', serie: { filial_id: 'f1', centro_custo_id: 'c1' } }
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1',
    filialId: 'f1',
    centroCustoId: 'c1'
  })
  assert.equal(resultado.resumo.recorrenciasSemCobertura, 2)
})

test('filtros por empresa filial e centro isolam o ranking e a cobertura', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [
      conta('correta'),
      conta('outra-empresa', { empresa_id: 'e2' }),
      conta('outra-filial', { filial_id: 'f2' }),
      conta('outro-centro', { centro_custo_id: 'c2' })
    ],
    ocorrenciasCobertura: [
      { identidade: 'r1|1', cobertura: 'faltante', serie: { filial_id: 'f1', centro_custo_id: 'c1' } },
      { identidade: 'r2|1', cobertura: 'faltante', serie: { filial_id: 'f2', centro_custo_id: 'c1' } }
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1',
    filialId: 'f1',
    centroCustoId: 'c1'
  })
  assert.deepEqual(resultado.prioridades.map((item) => item.id), ['correta'])
  assert.equal(resultado.recorrenciasSemCobertura.length, 1)
})

test('concentracoes mensais usam saldo e ordenam maior necessidade', () => {
  const resultado = montarCentralPrioridadesFinanceiras({
    contas: [
      conta('jul', { data_vencimento: '2026-07-30', saldo_restante_relatorio: 500 }),
      conta('ago1', { data_vencimento: '2026-08-10', saldo_restante_relatorio: 800 }),
      conta('ago2', { data_vencimento: '2026-08-20', saldo_restante_relatorio: 700 })
    ],
    dataBase: '2026-07-26',
    empresaId: 'e1'
  })
  assert.deepEqual(resultado.concentracoesMensais[0], { chave: '2026-08', quantidade: 2, saldo: 1500 })
})

test('grande volume acima de mil registros e processado sem perda', () => {
  const contas = Array.from({ length: 1505 }, (_, indice) => conta(`c${String(indice).padStart(4, '0')}`))
  const resultado = montarCentralPrioridadesFinanceiras({ contas, dataBase: '2026-07-26', empresaId: 'e1' })
  assert.equal(resultado.prioridades.length, 1505)
})

test('fontes usadas pelo painel permanecem paginadas', async () => {
  const relatorios = await readFile(new URL('../services/relatoriosFinanceirosService.js', import.meta.url), 'utf8')
  const cobertura = await readFile(new URL('../services/recorrenciaCoberturaService.js', import.meta.url), 'utf8')
  assert.match(relatorios, /executarConsultaPaginada/)
  assert.match(cobertura, /executarConsultaPaginada/)
})

test('painel possui navegacao direta para conta e nao possui escrita', async () => {
  const painel = await readFile(new URL('../components/dashboard/PrioridadesFinanceirasPanel.jsx', import.meta.url), 'utf8')
  const utilitario = await readFile(new URL('./prioridadesFinanceiras.js', import.meta.url), 'utf8')
  assert.match(painel, /onAbrirConta\?\.\(item\.id\)/)
  assert.doesNotMatch(`${painel}\n${utilitario}`, /\.(insert|update|delete|upsert|rpc)\s*\(/)
})
