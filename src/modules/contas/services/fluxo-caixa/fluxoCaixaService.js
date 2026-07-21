import { selecionarPorEmpresa } from '../../../../services/supabaseQueryService.js'
import { executarConsultaPaginada } from '../../../../services/supabasePaginationService.js'

const COLUNAS_CONTAS_FLUXO = [
  'id', 'empresa_id', 'descricao', 'valor', 'valor_pago', 'juros_multa', 'desconto',
  'observacao', 'observacao_pagamento', 'imposto_tipo', 'data_pagamento', 'data_vencimento',
  'status', 'centro', 'filial_id', 'centro_custo_id', 'oculto', 'excluido', 'deletado',
  'excluido_em', 'df_centros_custo(nome)', 'df_filiais(nome)'
].join(', ')

const COLUNAS_RECEITAS_FLUXO = [
  'id', 'empresa_id', 'filial_id', 'data_receita', 'ano', 'mes', 'valor', 'origem',
  'descricao', 'observacao', 'status', 'arquivado', 'df_filiais(nome)'
].join(', ')

const COLUNAS_FILIAIS_FLUXO = [
  'id', 'nome', 'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual',
  'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'telefone', 'email'
].join(', ')

const COLUNAS_PAGAMENTOS_FLUXO = 'id, empresa_id, conta_id, valor_pago, data_pagamento, observacao, arquivado, arquivado_em, criado_em, atualizado_em'
const LIMITE_FALLBACK_HISTORICO = '2026-05-31'

function filtrosContaAtiva(query) {
  return query
    .or('oculto.is.null,oculto.eq.false')
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
}

function consultarPaginado(criarConsulta) {
  return executarConsultaPaginada(criarConsulta, { tamanhoPagina: 500 })
}

function mesclarPorId(...listas) {
  const mapa = new Map()
  listas.flat().forEach((registro) => {
    if (registro?.id) mapa.set(registro.id, registro)
  })
  return Array.from(mapa.values())
}

async function consultarContasPagasNoPeriodo(supabase, empresaId, dataInicial, dataFinal) {
  const consultas = [
    consultarPaginado(() => filtrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS_FLUXO)
        .eq('status', 'pago')
        .gte('data_pagamento', dataInicial)
        .lte('data_pagamento', dataFinal)
    ).order('data_pagamento', { ascending: true }).order('id', { ascending: true }))
  ]

  const fimFallback = dataFinal < LIMITE_FALLBACK_HISTORICO ? dataFinal : LIMITE_FALLBACK_HISTORICO
  if (dataInicial <= fimFallback) {
    consultas.push(consultarPaginado(() => filtrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS_FLUXO)
        .eq('status', 'pago')
        .is('data_pagamento', null)
        .gte('data_vencimento', dataInicial)
        .lte('data_vencimento', fimFallback)
    ).order('data_vencimento', { ascending: true }).order('id', { ascending: true })))
  }

  const respostas = await Promise.all(consultas)
  const erro = respostas.find((resposta) => resposta.error)?.error
  return erro ? { data: [], error: erro } : { data: mesclarPorId(...respostas.map((resposta) => resposta.data || [])), error: null }
}

async function consultarContasPorIds(supabase, empresaId, ids) {
  const unicos = Array.from(new Set(ids.filter(Boolean)))
  const contas = []
  for (let indice = 0; indice < unicos.length; indice += 100) {
    const lote = unicos.slice(indice, indice + 100)
    const resposta = await consultarPaginado(() => filtrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS_FLUXO).in('id', lote)
    ).order('data_vencimento', { ascending: true }).order('id', { ascending: true }))
    if (resposta.error) return { data: contas, error: resposta.error }
    contas.push(...(resposta.data || []))
  }
  return { data: contas, error: null }
}
async function consultarPagamentosPorContas(supabase, empresaId, ids) {
  const unicos = Array.from(new Set(ids.filter(Boolean)))
  const pagamentos = []
  for (let indice = 0; indice < unicos.length; indice += 100) {
    const lote = unicos.slice(indice, indice + 100)
    const resposta = await consultarPaginado(() => selecionarPorEmpresa(
      supabase,
      'df_contas_pagamentos',
      empresaId,
      COLUNAS_PAGAMENTOS_FLUXO
    )
      .in('conta_id', lote)
      .or('arquivado.is.null,arquivado.eq.false')
      .order('data_pagamento', { ascending: true })
      .order('id', { ascending: true }))
    if (resposta.error) return { data: pagamentos, error: resposta.error }
    pagamentos.push(...(resposta.data || []))
  }
  return { data: pagamentos, error: null }
}

export async function carregarFluxoCaixaRealizadoV1(supabase, empresaId, ano) {
  const anoNumero = Number(ano)
  if (!empresaId) return { data: null, error: new Error('Empresa ativa nao selecionada.') }
  if (!Number.isInteger(anoNumero)) return { data: null, error: new Error('Ano invalido para o fluxo de caixa.') }

  const dataInicial = `${anoNumero}-01-01`
  const dataFinal = `${anoNumero}-12-31`
  const [respostaContasPagas, respostaPagamentos, respostaFiliais, respostaReceitas] = await Promise.all([
    consultarContasPagasNoPeriodo(supabase, empresaId, dataInicial, dataFinal),
    consultarPaginado(() => selecionarPorEmpresa(supabase, 'df_contas_pagamentos', empresaId, COLUNAS_PAGAMENTOS_FLUXO)
      .or('arquivado.is.null,arquivado.eq.false')
      .gte('data_pagamento', dataInicial)
      .lte('data_pagamento', dataFinal)
      .order('data_pagamento', { ascending: true })
      .order('id', { ascending: true })),
    consultarPaginado(() => selecionarPorEmpresa(supabase, 'df_filiais', empresaId, COLUNAS_FILIAIS_FLUXO)
      .order('nome', { ascending: true }).order('id', { ascending: true })),
    consultarPaginado(() => selecionarPorEmpresa(supabase, 'df_receitas', empresaId, COLUNAS_RECEITAS_FLUXO)
      .gte('data_receita', dataInicial)
      .lte('data_receita', dataFinal)
      .eq('status', 'ativo')
      .or('arquivado.is.null,arquivado.eq.false')
      .order('data_receita', { ascending: true })
      .order('id', { ascending: true }))
  ])

  if (respostaContasPagas.error) return { data: null, error: respostaContasPagas.error }
  if (respostaPagamentos.error) return { data: null, error: respostaPagamentos.error }
  if (respostaFiliais.error) return { data: null, error: respostaFiliais.error }
  if (respostaReceitas.error) return { data: null, error: respostaReceitas.error }

  const pagamentosParciais = respostaPagamentos.data || []
  const respostaContasParciais = await consultarContasPorIds(
    supabase,
    empresaId,
    pagamentosParciais.map((pagamento) => pagamento.conta_id)
  )
  if (respostaContasParciais.error) return { data: null, error: respostaContasParciais.error }

  const contasPagas = respostaContasPagas.data || []
  const contasPorId = new Map(mesclarPorId(contasPagas, respostaContasParciais.data || []).map((conta) => [conta.id, conta]))
  const respostaTodosPagamentos = await consultarPagamentosPorContas(
    supabase,
    empresaId,
    Array.from(contasPorId.keys())
  )
  if (respostaTodosPagamentos.error) return { data: null, error: respostaTodosPagamentos.error }

  return {
    data: {
      contasPagas,
      pagamentosParciais: respostaTodosPagamentos.data || [],
      receitas: respostaReceitas.data || [],
      contasPorId,
      filiais: respostaFiliais.data || [],
      periodo: { dataInicial, dataFinal },
      fallbackHistoricoAte: LIMITE_FALLBACK_HISTORICO
    },
    error: null
  }
}
