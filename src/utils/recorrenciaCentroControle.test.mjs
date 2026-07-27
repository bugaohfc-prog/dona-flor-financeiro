import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  calcularCoberturaRecorrencias,
  classificarOcorrenciaCentroControle,
  filtrarCoberturaRecorrencias,
  resumirCentroControle
} from './recorrenciaCobertura.js'
import {
  criarEstadoCobertura,
  falharAtualizacaoCobertura,
  iniciarAtualizacaoCobertura
} from './recorrenciaCoberturaEstado.js'

const serie = (extra = {}) => ({
  id: 'r1',
  empresa_id: 'e1',
  descricao: 'Aluguel',
  valor: 100,
  valor_variavel: false,
  dia_vencimento: 15,
  tipo_recorrencia: 'mensal',
  ativo: true,
  data_inicio: '2026-01-01',
  filial_id: 'f1',
  centro_custo_id: 'c1',
  ...extra
})

const conta = (extra = {}) => ({
  id: 'c1',
  empresa_id: 'e1',
  descricao: 'Aluguel',
  valor: 100,
  data_vencimento: '2026-07-15',
  recorrencia_id: 'r1',
  filial_id: 'f1',
  centro_custo_id: 'c1',
  status: 'pendente',
  ...extra
})

test('centro de controle resume os cinco indicadores operacionais', () => {
  const resumo = resumirCentroControle({
    resumo: {
      recorrenciasAtivas: 12,
      cobertas: 18,
      faltantes: 7,
      duplicadas: 2,
      possiveisManuais: 3
    }
  })
  assert.deepEqual(resumo, { ativas: 12, cobertas: 18, faltantes: 7, duplicadas: 2, sugestoes: 3 })
})

test('visoes separam ocorrencias que exigem atencao das cobertas', () => {
  const resultado = calcularCoberturaRecorrencias({
    series: [serie()],
    contas: [conta()],
    horizonte: { inicio: '2026-07-01', fim: '2026-08-31' }
  })
  assert.equal(classificarOcorrenciaCentroControle(resultado.ocorrencias[0]), 'coberta')
  assert.equal(classificarOcorrenciaCentroControle(resultado.ocorrencias[1]), 'atencao')
  assert.deepEqual(filtrarCoberturaRecorrencias(resultado, { visao: 'cobertas' }).ocorrencias.map((item) => item.cobertura), ['coberta'])
  assert.deepEqual(filtrarCoberturaRecorrencias(resultado, { visao: 'atencao' }).ocorrencias.map((item) => item.cobertura), ['faltante'])
  assert.equal(filtrarCoberturaRecorrencias(resultado, { visao: 'todas' }).ocorrencias.length, 2)
})

test('troca de horizonte preserva o ultimo resultado e usa loading discreto', () => {
  const resultado = { resumo: { recorrenciasAtivas: 1 }, recorrencias: [] }
  const anterior = { ...criarEstadoCobertura(), empresaId: 'e1', resultado, carregado: true }
  const atualizando = iniciarAtualizacaoCobertura(anterior, 'e1')
  assert.equal(atualizando.carregando, true)
  assert.equal(atualizando.resultado, resultado)
  assert.equal(atualizando.carregado, true)
})

test('erro de recalculo mantem resultado valido e troca de empresa o descarta', () => {
  const resultado = { resumo: { recorrenciasAtivas: 1 }, recorrencias: [] }
  const anterior = { ...criarEstadoCobertura(), empresaId: 'e1', resultado, carregado: true }
  const falha = falharAtualizacaoCobertura(anterior, 'e1', new Error('indisponivel'))
  assert.equal(falha.resultado, resultado)
  assert.equal(falha.carregado, true)
  assert.equal(falha.carregando, false)
  const outraEmpresa = iniciarAtualizacaoCobertura(anterior, 'e2')
  assert.equal(outraEmpresa.resultado, null)
  assert.equal(outraEmpresa.carregado, false)
})

test('filtros mobile recolhem sem overflow e preservam acoes protegidas', async () => {
  const [pagina, estilos] = await Promise.all([
    readFile(new URL('../pages/RecorrenciasFinanceirasPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../pages/RecorrenciasFinanceirasPage.css', import.meta.url), 'utf8')
  ])
  assert.match(pagina, /aria-controls="recurring-control-toolbar"/)
  assert.match(pagina, /recurring-control-toolbar \$\{filtrosMobileAbertos \? 'is-open'/)
  assert.match(estilos, /@media \(max-width: 700px\)/)
  assert.match(estilos, /\.recurring-control-toolbar\s*\{\s*display: none;/s)
  assert.match(estilos, /\.recurring-control-toolbar\.is-open\s*\{\s*display: grid;/s)
  assert.match(estilos, /max-width: 100%;\s*overflow-wrap: anywhere;/s)
  assert.match(pagina, /Vincular após revisão/)
  assert.match(pagina, /Gerar ocorrência/)
})
