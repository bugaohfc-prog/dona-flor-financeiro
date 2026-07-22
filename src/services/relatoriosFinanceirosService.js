import { executarConsultaPaginada } from './supabasePaginationService.js'
import { selecionarPorEmpresa } from './supabaseQueryService.js'
import {
  calcularResumoRelatorioFinanceiro,
  consolidarContasComPagamentos,
  filtrarDatasetRelatorio,
  normalizarCriteriosRelatorio
} from '../utils/relatoriosFinanceiros.js'

export const COLUNAS_CONTAS_RELATORIO = [
  'id', 'empresa_id', 'descricao', 'observacao', 'valor', 'valor_pago', 'juros_multa', 'desconto',
  'data_vencimento', 'data_pagamento', 'competencia', 'imposto_tipo', 'status', 'filial_id', 'centro_custo_id', 'recorrencia_id',
  'oculto', 'excluido', 'deletado', 'excluido_em',
  'df_centros_custo(nome)', 'df_filiais(nome)', 'df_contas_recorrentes(tipo_recorrencia)'
].join(', ')

const COLUNAS_PAGAMENTOS_RELATORIO = [
  'id', 'empresa_id', 'conta_id', 'valor_pago', 'data_pagamento', 'observacao',
  'arquivado', 'arquivado_em', 'criado_em', 'atualizado_em'
].join(', ')

function aplicarFiltrosAtivos(query, incluirOcultas) {
  let resultado = query
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
  if (!incluirOcultas) resultado = resultado.or('oculto.is.null,oculto.eq.false')
  return resultado
}

function aplicarFiltrosConta(query, criterios, campoData) {
  const dataInicial = campoData === 'competencia' ? criterios.dataInicial.slice(0, 7) : criterios.dataInicial
  const dataFinal = campoData === 'competencia' ? criterios.dataFinal.slice(0, 7) : criterios.dataFinal
  let resultado = aplicarFiltrosAtivos(query, criterios.incluirOcultas)
    .gte(campoData, dataInicial)
    .lte(campoData, dataFinal)

  if (criterios.filialId) resultado = resultado.eq('filial_id', criterios.filialId)
  if (criterios.centroCustoId) resultado = resultado.eq('centro_custo_id', criterios.centroCustoId)
  if (criterios.origem === 'manual') resultado = resultado.is('recorrencia_id', null)
  if (criterios.origem === 'recorrente') resultado = resultado.not('recorrencia_id', 'is', null)
  return resultado.order(campoData, { ascending: true }).order('id', { ascending: true })
}

async function consultarContasPorPeriodo(supabase, criterios, campoData) {
  return executarConsultaPaginada(() => aplicarFiltrosConta(
    selecionarPorEmpresa(supabase, 'df_contas', criterios.empresaId, COLUNAS_CONTAS_RELATORIO),
    criterios,
    campoData
  ))
}

async function consultarPagamentosNoPeriodo(supabase, criterios) {
  return executarConsultaPaginada(() => selecionarPorEmpresa(
    supabase,
    'df_contas_pagamentos',
    criterios.empresaId,
    COLUNAS_PAGAMENTOS_RELATORIO
  )
    .or('arquivado.is.null,arquivado.eq.false')
    .gte('data_pagamento', criterios.dataInicial)
    .lte('data_pagamento', criterios.dataFinal)
    .order('data_pagamento', { ascending: true })
    .order('id', { ascending: true }))
}

async function consultarPorIdsEmLotes({ ids, consultarLote }) {
  const unicos = Array.from(new Set(ids.filter(Boolean)))
  const registros = []
  for (let indice = 0; indice < unicos.length; indice += 100) {
    const resposta = await consultarLote(unicos.slice(indice, indice + 100))
    if (resposta.error) return { data: registros, error: resposta.error }
    registros.push(...(resposta.data || []))
  }
  return { data: registros, error: null }
}

async function consultarContasPorIds(supabase, empresaId, ids, incluirOcultas) {
  return consultarPorIdsEmLotes({
    ids,
    consultarLote: (lote) => executarConsultaPaginada(() => aplicarFiltrosAtivos(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS_RELATORIO).in('id', lote),
      incluirOcultas
    ).order('data_vencimento', { ascending: true }).order('id', { ascending: true }))
  })
}

async function consultarPagamentosPorContas(supabase, empresaId, ids) {
  return consultarPorIdsEmLotes({
    ids,
    consultarLote: (lote) => executarConsultaPaginada(() => selecionarPorEmpresa(
      supabase,
      'df_contas_pagamentos',
      empresaId,
      COLUNAS_PAGAMENTOS_RELATORIO
    )
      .in('conta_id', lote)
      .or('arquivado.is.null,arquivado.eq.false')
      .order('data_pagamento', { ascending: true })
      .order('id', { ascending: true }))
  })
}

function mesclarPorId(...listas) {
  const mapa = new Map()
  listas.flat().forEach((registro) => {
    if (registro?.id) mapa.set(registro.id, registro)
  })
  return Array.from(mapa.values())
}

export async function consultarRelatorioFinanceiro(supabase, criteriosEntrada) {
  let criterios
  try {
    criterios = normalizarCriteriosRelatorio(criteriosEntrada)
  } catch (error) {
    return { data: null, error }
  }
  if (!criterios.empresaId) return { data: null, error: new Error('Empresa ativa nao selecionada.') }

  let contas = []
  let pagamentos = []

  if (criterios.base === 'pagamento') {
    const [respostaContasPagas, respostaPagamentosPeriodo] = await Promise.all([
      consultarContasPorPeriodo(supabase, { ...criterios, status: 'pagas' }, 'data_pagamento'),
      consultarPagamentosNoPeriodo(supabase, criterios)
    ])
    if (respostaContasPagas.error) return { data: null, error: respostaContasPagas.error }
    if (respostaPagamentosPeriodo.error) return { data: null, error: respostaPagamentosPeriodo.error }

    const idsParciais = (respostaPagamentosPeriodo.data || []).map((pagamento) => pagamento.conta_id)
    const respostaContasParciais = await consultarContasPorIds(supabase, criterios.empresaId, idsParciais, criterios.incluirOcultas)
    if (respostaContasParciais.error) return { data: null, error: respostaContasParciais.error }
    contas = mesclarPorId(respostaContasPagas.data || [], respostaContasParciais.data || [])

    const respostaTodosPagamentos = await consultarPagamentosPorContas(supabase, criterios.empresaId, contas.map((conta) => conta.id))
    if (respostaTodosPagamentos.error) return { data: null, error: respostaTodosPagamentos.error }
    pagamentos = respostaTodosPagamentos.data || []
  } else {
    const respostaContas = await consultarContasPorPeriodo(supabase, criterios, criterios.campoPeriodo)
    if (respostaContas.error) return { data: null, error: respostaContas.error }
    contas = respostaContas.data || []
    const respostaPagamentos = await consultarPagamentosPorContas(supabase, criterios.empresaId, contas.map((conta) => conta.id))
    if (respostaPagamentos.error) return { data: null, error: respostaPagamentos.error }
    pagamentos = respostaPagamentos.data || []
  }

  const consolidadas = consolidarContasComPagamentos(contas, pagamentos, criterios)
  const registros = filtrarDatasetRelatorio(consolidadas, criterios)
    .sort((a, b) => String(a.data_referencia_relatorio || '9999-12-31').localeCompare(String(b.data_referencia_relatorio || '9999-12-31')) || String(a.id).localeCompare(String(b.id)))

  return {
    data: {
      registros,
      resumo: calcularResumoRelatorioFinanceiro(registros, criterios.hoje),
      criterios,
      limitacaoHistorica: criterios.base === 'pagamento'
        ? 'Contas pagas sem data de pagamento nao sao atribuidas a nenhum mes. Consulte-as pela base de vencimento.'
        : '',
      geradoEm: new Date().toISOString()
    },
    error: null
  }
}

export async function consultarVencidosFinanceiros(supabase, criteriosEntrada = {}) {
  const hoje = String(criteriosEntrada.hoje || new Date().toISOString().slice(0, 10)).slice(0, 10)
  let criterios
  try {
    criterios = normalizarCriteriosRelatorio({
      ...criteriosEntrada,
      base: 'vencimento',
      dataInicial: '1900-01-01',
      dataFinal: hoje,
      status: 'vencidas',
      hoje
    })
  } catch (error) {
    return { data: null, error }
  }
  if (!criterios.empresaId) return { data: null, error: new Error('Empresa ativa nao selecionada.') }

  const respostaContas = await executarConsultaPaginada(() => {
    let query = aplicarFiltrosAtivos(
      selecionarPorEmpresa(supabase, 'df_contas', criterios.empresaId, COLUNAS_CONTAS_RELATORIO),
      criterios.incluirOcultas
    )
      .neq('status', 'pago')
      .lt('data_vencimento', hoje)
    if (criterios.filialId) query = query.eq('filial_id', criterios.filialId)
    if (criterios.centroCustoId) query = query.eq('centro_custo_id', criterios.centroCustoId)
    return query.order('data_vencimento', { ascending: true }).order('id', { ascending: true })
  })
  if (respostaContas.error) return { data: null, error: respostaContas.error }

  const contas = respostaContas.data || []
  const respostaPagamentos = await consultarPagamentosPorContas(
    supabase,
    criterios.empresaId,
    contas.map((conta) => conta.id)
  )
  if (respostaPagamentos.error) return { data: null, error: respostaPagamentos.error }

  const registros = filtrarDatasetRelatorio(
    consolidarContasComPagamentos(contas, respostaPagamentos.data || [], criterios),
    criterios
  ).sort((a, b) => String(a.data_vencimento || '').localeCompare(String(b.data_vencimento || '')) || String(a.id).localeCompare(String(b.id)))

  return {
    data: {
      registros,
      resumo: calcularResumoRelatorioFinanceiro(registros, hoje),
      criterios,
      geradoEm: new Date().toISOString()
    },
    error: null
  }
}
