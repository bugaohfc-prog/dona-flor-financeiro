import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  inserirLoteComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'
import { executarConsultaPaginada } from './supabasePaginationService.js'
import { interpretarTermoBuscaContas } from '../utils/contasConsultasOperacionais.js'

export const STATUS_OPERACIONAL_PAGAMENTO_PARCIAL = Object.freeze({
  ABERTA: 'aberta',
  PARCIAL: 'parcial',
  PAGA: 'paga'
})

function arredondarValorFinanceiro(valor) {
  const numero = Number(valor || 0)
  if (!Number.isFinite(numero)) return 0
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

function obterValorPagamentoParcial(pagamento) {
  return arredondarValorFinanceiro(pagamento?.valor_pago)
}

function pagamentoParcialEstaAtivo(pagamento) {
  return pagamento && pagamento.arquivado !== true && obterValorPagamentoParcial(pagamento) > 0
}

function obterUltimoPagamentoEm(pagamentos) {
  return pagamentos.reduce((ultimo, pagamento) => {
    if (!pagamento?.data_pagamento) return ultimo
    if (!ultimo || pagamento.data_pagamento > ultimo) return pagamento.data_pagamento
    return ultimo
  }, null)
}

function dataAtualBanco() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function acrescentarObservacaoPagamento(observacaoAtual, texto) {
  const atual = String(observacaoAtual || '').trim()
  return atual ? `${atual} | ${texto}` : texto
}

const COLUNAS_CONTA_LISTAGEM = '*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia, valor_variavel)'
const TAMANHO_PAGINA_CONTAS = 500

function aplicarFiltrosContaAtiva(query, { incluirOcultas = false } = {}) {
  let filtrada = query
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
  if (!incluirOcultas) filtrada = filtrada.or('oculto.is.null,oculto.eq.false')
  return filtrada
}

function ordenarContasEstavelmente(query, ascending = true) {
  return query
    .order('data_vencimento', { ascending })
    .order('id', { ascending: true })
}

export async function listarContasAtivas(supabase, empresaId) {
  return listarContasOperacionais(supabase, empresaId)
}

export async function listarContasOperacionais(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return executarConsultaPaginada(() => ordenarContasEstavelmente(
    aplicarFiltrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTA_LISTAGEM)
        .neq('status', 'pago')
    )
  ), { tamanhoPagina: TAMANHO_PAGINA_CONTAS })
}

export async function listarContasContextuais(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return executarConsultaPaginada(() => ordenarContasEstavelmente(
    aplicarFiltrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTA_LISTAGEM)
    )
  ), { tamanhoPagina: TAMANHO_PAGINA_CONTAS })
}

export async function listarContasPagas(supabase, empresaId, opcoes = {}) {
  assertEmpresaId(empresaId)
  const pagina = Math.max(0, Number(opcoes.pagina) || 0)
  const tamanhoPagina = Math.max(1, Number(opcoes.tamanhoPagina) || 100)
  let query = aplicarFiltrosContaAtiva(
    selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTA_LISTAGEM)
      .eq('status', 'pago')
  )
  if (opcoes.dataInicial) query = query.gte('data_vencimento', opcoes.dataInicial)
  if (opcoes.dataFinal) query = query.lte('data_vencimento', opcoes.dataFinal)
  query = ordenarContasEstavelmente(query, false)
  return query.range(pagina * tamanhoPagina, ((pagina + 1) * tamanhoPagina) - 1)
}

export async function listarContasOcultas(supabase, empresaId, opcoes = {}) {
  assertEmpresaId(empresaId)
  const pagina = Math.max(0, Number(opcoes.pagina) || 0)
  const tamanhoPagina = Math.max(1, Number(opcoes.tamanhoPagina) || 100)
  const query = ordenarContasEstavelmente(
    aplicarFiltrosContaAtiva(
      selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTA_LISTAGEM)
        .eq('oculto', true),
      { incluirOcultas: true }
    ), false
  )
  return query.range(pagina * tamanhoPagina, ((pagina + 1) * tamanhoPagina) - 1)
}

export async function buscarContasHistorico(supabase, empresaId, termo, opcoes = {}) {
  assertEmpresaId(empresaId)
  const pagina = Math.max(0, Number(opcoes.pagina) || 0)
  const tamanhoPagina = Math.max(1, Number(opcoes.tamanhoPagina) || 100)
  const { termoTexto: termoSeguro, valor: numero, data } = interpretarTermoBuscaContas(termo)
  if (!termoSeguro) return { data: [], error: null }

  let query = aplicarFiltrosContaAtiva(
    selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTA_LISTAGEM),
    { incluirOcultas: opcoes.incluirOcultas === true }
  )
  if (opcoes.status === 'pagas') query = query.eq('status', 'pago')
  if (opcoes.status === 'abertas') query = query.neq('status', 'pago')
  if (opcoes.status === 'vencidas') query = query.neq('status', 'pago').lt('data_vencimento', opcoes.hoje)
  if (opcoes.status === 'futuras') query = query.neq('status', 'pago').gt('data_vencimento', opcoes.hoje)

  const [respostaCentros, respostaFiliais] = await Promise.all([
    selecionarPorEmpresa(supabase, 'df_centros_custo', empresaId, 'id').ilike('nome', `%${termoSeguro}%`).limit(20),
    selecionarPorEmpresa(supabase, 'df_filiais', empresaId, 'id').ilike('nome', `%${termoSeguro}%`).limit(20)
  ])
  const filtros = [
    `descricao.ilike.%${termoSeguro}%`,
    `observacao.ilike.%${termoSeguro}%`
  ]
  const centrosIds = (respostaCentros.data || []).map((item) => item.id).filter(Boolean)
  const filiaisIds = (respostaFiliais.data || []).map((item) => item.id).filter(Boolean)
  if (centrosIds.length) filtros.push(`centro_custo_id.in.(${centrosIds.join(',')})`)
  if (filiaisIds.length) filtros.push(`filial_id.in.(${filiaisIds.join(',')})`)
  if (numero !== null) filtros.push(`valor.eq.${numero}`)
  if (data) filtros.push(`data_vencimento.eq.${data}`)
  query = query.or(filtros.join(','))
  query = ordenarContasEstavelmente(query, false)
  return query.range(pagina * tamanhoPagina, ((pagina + 1) * tamanhoPagina) - 1)
}

export async function listarParcelasParcelamento(supabase, empresaId, grupoParcelamentoId) {
  assertEmpresaId(empresaId)
  if (!grupoParcelamentoId) return { data: [], error: null }

  return selecionarPorEmpresa(
    supabase,
    'df_contas',
    empresaId,
    'id, descricao, valor, data_vencimento, vencimento, status, valor_pago, data_pagamento, oculto, excluido, deletado, grupo_parcelamento_id, parcela_numero, parcelas_total, valor_total_parcelamento'
  )
    .eq('grupo_parcelamento_id', grupoParcelamentoId)
    .order('parcela_numero', { ascending: true })
    .order('data_vencimento', { ascending: true })
}

export async function cancelarGrupoParcelamento(supabase, empresaId, grupoParcelamentoId) {
  assertEmpresaId(empresaId)
  if (!grupoParcelamentoId) {
    return { data: null, error: new Error('Grupo de parcelamento nao informado.') }
  }

  const { data: parcelas, error: erroParcelas } = await selecionarPorEmpresa(
    supabase,
    'df_contas',
    empresaId,
    'id, status, valor_pago, data_pagamento, oculto, excluido, deletado, grupo_parcelamento_id'
  )
    .eq('grupo_parcelamento_id', grupoParcelamentoId)

  if (erroParcelas) return { data: null, error: erroParcelas }
  if (!Array.isArray(parcelas) || parcelas.length === 0) {
    return { data: null, error: new Error('Nenhuma parcela encontrada para este parcelamento.') }
  }

  const possuiPaga = parcelas.some((parcela) => parcela?.status === 'pago')
  if (possuiPaga) {
    return { data: null, error: new Error('Este parcelamento nao pode ser cancelado porque ha parcela paga.') }
  }

  const possuiBaixa = parcelas.some((parcela) => (
    Number(parcela?.valor_pago || 0) > 0 || Boolean(parcela?.data_pagamento)
  ))
  if (possuiBaixa) {
    return { data: null, error: new Error('Este parcelamento nao pode ser cancelado porque ha dados de baixa em uma parcela.') }
  }

  const possuiOcultaOuLixeira = parcelas.some((parcela) => (
    parcela?.oculto === true || parcela?.excluido === true || parcela?.deletado === true
  ))
  if (possuiOcultaOuLixeira) {
    return { data: null, error: new Error('Este parcelamento possui parcelas ocultas ou na lixeira e precisa de revisao individual.') }
  }

  const idsParcelas = parcelas.map((parcela) => parcela.id).filter(Boolean)
  const { data: pagamentosParciais, error: erroPagamentos } = await selecionarPorEmpresa(
    supabase,
    'df_contas_pagamentos',
    empresaId,
    'id, conta_id, arquivado'
  )
    .in('conta_id', idsParcelas)
    .or('arquivado.is.null,arquivado.eq.false')

  if (erroPagamentos) return { data: null, error: erroPagamentos }
  if (Array.isArray(pagamentosParciais) && pagamentosParciais.length > 0) {
    return { data: null, error: new Error('Este parcelamento nao pode ser cancelado porque ha pagamento parcial registrado.') }
  }

  const ocultoEm = new Date().toISOString()
  const { data, error } = await supabase
    .from('df_contas')
    .update({ oculto: true, oculto_em: ocultoEm })
    .eq('empresa_id', empresaId)
    .eq('grupo_parcelamento_id', grupoParcelamentoId)
    .or('oculto.is.null,oculto.eq.false')
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
    .select('id, oculto, oculto_em, grupo_parcelamento_id')

  if (error) return { data: null, error }
  if (!Array.isArray(data) || data.length !== parcelas.length) {
    return { data, error: new Error('Nem todas as parcelas elegiveis foram ocultadas. Revise o grupo antes de continuar.') }
  }

  return { data, error: null }
}

export async function listarContasDoMesParaRecorrencia(supabase, empresaId, dataInicial, dataFinal) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, 'id, descricao, valor, data_vencimento, centro_custo_id, filial_id, recorrencia_id, excluido, excluido_em')
    .gte('data_vencimento', dataInicial)
    .lte('data_vencimento', dataFinal)
    .or('excluido.is.null,excluido.eq.false')
}
export async function listarContasHorizonteRecorrencias(supabase, empresaId, dataInicial, dataFinal) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, 'id, recorrencia_id, data_vencimento, imposto_tipo, competencia, excluido, deletado')
    .gte('data_vencimento', dataInicial)
    .lte('data_vencimento', dataFinal)
    .not('recorrencia_id', 'is', null)
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
}

export async function listarCentrosCustoValidosPorIds(supabase, empresaId, ids = []) {
  assertEmpresaId(empresaId)
  const unicos = Array.from(new Set(ids.filter(Boolean)))
  if (!unicos.length) return { data: [], error: null }
  return selecionarPorEmpresa(supabase, 'df_centros_custo', empresaId, 'id').in('id', unicos)
}

export async function listarFiliaisValidasPorIds(supabase, empresaId, ids = []) {
  assertEmpresaId(empresaId)
  const unicos = Array.from(new Set(ids.filter(Boolean)))
  if (!unicos.length) return { data: [], error: null }
  return selecionarPorEmpresa(supabase, 'df_filiais', empresaId, 'id').in('id', unicos).eq('ativo', true)
}

export async function listarRecorrenciasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .eq('ativo', true)
}

export async function listarRecorrencias(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .order('ativo', { ascending: false })
    .order('data_inicio', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function listarPagamentosParciaisPorContas(supabase, empresaId, contaIds = []) {
  assertEmpresaId(empresaId)
  const idsNormalizados = Array.from(new Set((contaIds || []).filter(Boolean)))
  if (!idsNormalizados.length) return { data: [], error: null }

  const lotes = []
  for (let indice = 0; indice < idsNormalizados.length; indice += 100) lotes.push(idsNormalizados.slice(indice, indice + 100))
  const registros = []
  for (const lote of lotes) {
    const resposta = await selecionarPorEmpresa(
      supabase,
      'df_contas_pagamentos',
      empresaId,
      'id, empresa_id, conta_id, valor_pago, data_pagamento, observacao, arquivado, arquivado_em, criado_em, atualizado_em'
    )
      .in('conta_id', lote)
      .eq('arquivado', false)
      .order('data_pagamento', { ascending: true })
      .order('criado_em', { ascending: true })
    if (resposta.error) return { data: registros, error: resposta.error }
    registros.push(...(resposta.data || []))
  }
  return { data: registros, error: null }
}

function primeiroRegistro(resposta) {
  if (Array.isArray(resposta?.data)) return resposta.data[0] || null
  return resposta?.data || null
}

function montarPayloadAuditoriaPagamentoParcial({ contaAtual, pagamentoCriado, pagamento, consolidacaoAntes, valorNovo }) {
  if (!contaAtual?.id || !pagamentoCriado?.id) return null

  const valorPagoAnterior = arredondarValorFinanceiro(consolidacaoAntes?.totalPagoParcial)
  const valorPagoPosterior = arredondarValorFinanceiro(valorPagoAnterior + valorNovo)
  const saldoAnterior = arredondarValorFinanceiro(consolidacaoAntes?.saldoPendente)
  const saldoPosterior = arredondarValorFinanceiro(Math.max(saldoAnterior - valorNovo, 0))
  const quantidadeParciaisAnterior = Number(consolidacaoAntes?.quantidadePagamentos || 0)
  const possuiObservacao = String(pagamento?.observacao || '').trim().length > 0

  return {
    acao: 'financeiro.pagamento_parcial.criado',
    empresa_id: contaAtual.empresa_id,
    conta_id: contaAtual.id,
    pagamento_id: pagamentoCriado.id,
    filial_id: contaAtual.filial_id || null,
    valor_pagamento: valorNovo,
    data_pagamento: pagamentoCriado.data_pagamento || pagamento.data_pagamento,
    forma_pagamento: null,
    conta_status_anterior: contaAtual.status || null,
    conta_status_posterior: contaAtual.status || null,
    valor_pago_anterior: valorPagoAnterior,
    valor_pago_posterior: valorPagoPosterior,
    saldo_anterior: saldoAnterior,
    saldo_posterior: saldoPosterior,
    quantidade_parciais_anterior: quantidadeParciaisAnterior,
    quantidade_parciais_posterior: quantidadeParciaisAnterior + 1,
    origem_fluxo: 'pagamento_parcial',
    possui_observacao: possuiObservacao,
    competencia: contaAtual.competencia ? String(contaAtual.competencia).slice(0, 7) : null,
    vencimento: contaAtual.data_vencimento || contaAtual.vencimento || null,
    correlation_id: `financeiro.pagamento_parcial.criado:${pagamentoCriado.id}`
  }
}

export async function registrarPagamentoParcial(supabase, contaId, empresaId, pagamento = {}) {
  assertEmpresaId(empresaId)

  const valorNovo = arredondarValorFinanceiro(pagamento.valor_pago)
  if (valorNovo <= 0) {
    return { data: null, error: new Error('Informe um valor de pagamento maior que zero.') }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(pagamento.data_pagamento || ''))) {
    return { data: null, error: new Error('Informe uma data de pagamento válida.') }
  }

  const { data: contaAtual, error: erroConta } = await selecionarPorEmpresa(
    supabase,
    'df_contas',
    empresaId,
    'id, empresa_id, valor, status, oculto, excluido, deletado, filial_id, data_vencimento, vencimento, competencia'
  )
    .eq('id', contaId)
    .maybeSingle()

  if (erroConta) return { data: null, error: erroConta }
  if (!contaAtual?.id) return { data: null, error: new Error('Conta não encontrada.') }
  if (contaAtual.status === 'pago') {
    return { data: null, error: new Error('A conta já está marcada como paga.') }
  }
  if (contaAtual.oculto === true || contaAtual.excluido === true || contaAtual.deletado === true) {
    return { data: null, error: new Error('A conta não está disponível para pagamento parcial.') }
  }

  const { data: pagamentosAtuais, error: erroPagamentos } = await listarPagamentosParciaisPorContas(
    supabase,
    empresaId,
    [contaId]
  )
  if (erroPagamentos) return { data: null, error: erroPagamentos }

  const consolidacao = consolidarPagamentosParciaisDaConta(contaAtual, pagamentosAtuais || [])
  if (valorNovo > consolidacao.saldoPendente) {
    return {
      data: null,
      error: new Error(`O valor informado supera o saldo pendente de R$ ${consolidacao.saldoPendente.toFixed(2).replace('.', ',')}.`)
    }
  }

  const resposta = await inserirComEmpresa(
    supabase,
    'df_contas_pagamentos',
    {
      empresa_id: empresaId,
      conta_id: contaId,
      valor_pago: valorNovo,
      data_pagamento: pagamento.data_pagamento,
      observacao: String(pagamento.observacao || '').trim() || null
    },
    { select: true }
  )

  if (resposta.error) return resposta

  const pagamentoCriado = primeiroRegistro(resposta)
  return {
    ...resposta,
    auditoria: montarPayloadAuditoriaPagamentoParcial({
      contaAtual,
      pagamentoCriado,
      pagamento,
      consolidacaoAntes: consolidacao,
      valorNovo
    })
  }
}

export async function registrarAuditoriaPagamentoParcialCriado(supabase, payloadAuditoria) {
  if (!payloadAuditoria?.pagamento_id || !payloadAuditoria?.conta_id || !payloadAuditoria?.empresa_id) {
    return { data: null, error: new Error('Payload de auditoria incompleto.') }
  }

  const resposta = await supabase.functions.invoke('registrar-auditoria-evento', {
    body: payloadAuditoria
  })
  if (!resposta?.error && resposta?.data?.ok === false) {
    const error = new Error(`Auditoria rejeitada (${resposta.data.code || 'AUDITORIA_REJEITADA'}).`)
    error.code = resposta.data.code || 'AUDITORIA_REJEITADA'
    return { data: resposta.data, error }
  }
  return resposta
}

export async function estornarPagamentoParcial(supabase, pagamentoId, contaId, empresaId) {
  assertEmpresaId(empresaId)

  const { data: contaAtual, error: erroConta } = await selecionarPorEmpresa(
    supabase,
    'df_contas',
    empresaId,
    'id, oculto, excluido, deletado'
  )
    .eq('id', contaId)
    .maybeSingle()

  if (erroConta) return { data: null, error: erroConta }
  if (!contaAtual?.id) return { data: null, error: new Error('Conta não encontrada.') }
  if (contaAtual.oculto === true || contaAtual.excluido === true || contaAtual.deletado === true) {
    return { data: null, error: new Error('A conta não está disponível para estorno parcial.') }
  }

  const { data: pagamentoAtual, error: erroPagamento } = await selecionarPorEmpresa(
    supabase,
    'df_contas_pagamentos',
    empresaId,
    'id, conta_id, arquivado'
  )
    .eq('id', pagamentoId)
    .eq('conta_id', contaId)
    .eq('arquivado', false)
    .maybeSingle()

  if (erroPagamento) return { data: null, error: erroPagamento }
  if (!pagamentoAtual?.id) {
    return { data: null, error: new Error('Pagamento parcial não encontrado ou já estornado.') }
  }

  return atualizarPorEmpresa(
    supabase,
    'df_contas_pagamentos',
    pagamentoId,
    empresaId,
    {
      arquivado: true,
      arquivado_em: new Date().toISOString()
    }
  )
    .eq('conta_id', contaId)
    .eq('arquivado', false)
    .select('id, conta_id, arquivado, arquivado_em')
    .maybeSingle()
}

export async function baixarContaQuitadaPorParciais(supabase, contaId, empresaId) {
  assertEmpresaId(empresaId)

  const { data: contaAtual, error: erroConta } = await selecionarPorEmpresa(
    supabase,
    'df_contas',
    empresaId,
    'id, valor, status, valor_pago, data_pagamento, observacao_pagamento, oculto, excluido, deletado'
  )
    .eq('id', contaId)
    .maybeSingle()

  if (erroConta) return { data: null, error: erroConta }
  if (!contaAtual?.id) return { data: null, error: new Error('Conta não encontrada.') }
  if (contaAtual.status === 'pago') {
    return { data: null, error: new Error('A conta já está marcada como paga.') }
  }
  if (contaAtual.oculto === true || contaAtual.excluido === true || contaAtual.deletado === true) {
    return { data: null, error: new Error('A conta não está disponível para baixa por pagamentos parciais.') }
  }

  const { data: pagamentosAtuais, error: erroPagamentos } = await listarPagamentosParciaisPorContas(
    supabase,
    empresaId,
    [contaId]
  )
  if (erroPagamentos) return { data: null, error: erroPagamentos }

  const consolidacao = consolidarPagamentosParciaisDaConta(contaAtual, pagamentosAtuais || [])
  if (consolidacao.quantidadePagamentos <= 0 || consolidacao.saldoPendente > 0) {
    return { data: null, error: new Error('Os pagamentos parciais ainda não quitaram o valor total da conta.') }
  }

  const observacao = acrescentarObservacaoPagamento(
    contaAtual.observacao_pagamento,
    'Conta baixada após pagamentos parciais completarem o valor total.'
  )

  return atualizarPorEmpresa(
    supabase,
    'df_contas',
    contaId,
    empresaId,
    {
      status: 'pago',
      valor_pago: arredondarValorFinanceiro(contaAtual.valor),
      data_pagamento: consolidacao.ultimoPagamentoEm || dataAtualBanco(),
      observacao_pagamento: observacao
    }
  )
    .eq('status', contaAtual.status)
    .or('oculto.is.null,oculto.eq.false')
    .or('excluido.is.null,excluido.eq.false')
    .or('deletado.is.null,deletado.eq.false')
    .select('id, status, valor_pago, data_pagamento, observacao_pagamento')
    .maybeSingle()
}

export function consolidarPagamentosParciaisDaConta(conta, pagamentos = []) {
  const contaId = conta?.id || null
  const valorOriginal = arredondarValorFinanceiro(conta?.valor)
  const pagamentosAtivos = (pagamentos || []).filter((pagamento) => (
    pagamento?.conta_id === contaId && pagamentoParcialEstaAtivo(pagamento)
  ))
  const totalPagoParcial = arredondarValorFinanceiro(
    pagamentosAtivos.reduce((total, pagamento) => total + obterValorPagamentoParcial(pagamento), 0)
  )
  const saldoPendente = arredondarValorFinanceiro(Math.max(valorOriginal - totalPagoParcial, 0))

  let statusOperacionalDerivado = STATUS_OPERACIONAL_PAGAMENTO_PARCIAL.ABERTA
  if (totalPagoParcial > 0 && totalPagoParcial < valorOriginal) {
    statusOperacionalDerivado = STATUS_OPERACIONAL_PAGAMENTO_PARCIAL.PARCIAL
  } else if (totalPagoParcial > 0 && totalPagoParcial >= valorOriginal) {
    statusOperacionalDerivado = STATUS_OPERACIONAL_PAGAMENTO_PARCIAL.PAGA
  }

  return {
    contaId,
    valorOriginal,
    totalPagoParcial,
    saldoPendente,
    quantidadePagamentos: pagamentosAtivos.length,
    ultimoPagamentoEm: obterUltimoPagamentoEm(pagamentosAtivos),
    statusOperacionalDerivado
  }
}

export function consolidarPagamentosParciaisPorConta(contas = [], pagamentos = []) {
  return new Map(
    (contas || []).map((conta) => [
      conta.id,
      consolidarPagamentosParciaisDaConta(conta, pagamentos)
    ])
  )
}


export async function validarCentroCustoDaEmpresa(supabase, centroCustoId, empresaId) {
  if (!centroCustoId) return null
  assertEmpresaId(empresaId)

  const { data, error } = await supabase
    .from('df_centros_custo')
    .select('id')
    .eq('id', centroCustoId)
    .eq('empresa_id', empresaId)
    .maybeSingle()

  if (error || !data?.id) return null
  return data.id
}

async function contarUsoCentroCusto(supabase, tabela, centroCustoId, empresaId) {
  const { count, error } = await supabase
    .from(tabela)
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
    .eq('centro_custo_id', centroCustoId)

  if (error) throw error
  return count || 0
}

export async function verificarUsoCentroCusto(supabase, centroCustoId, empresaId) {
  if (!centroCustoId) throw new Error('Centro de custo não identificado.')
  assertEmpresaId(empresaId)

  const [contas, recorrencias] = await Promise.all([
    contarUsoCentroCusto(supabase, 'df_contas', centroCustoId, empresaId),
    contarUsoCentroCusto(supabase, 'df_contas_recorrentes', centroCustoId, empresaId)
  ])

  return {
    contas,
    recorrencias,
    emUso: contas > 0 || recorrencias > 0
  }
}


export async function validarFilialDaEmpresa(supabase, filialId, empresaId) {
  if (!filialId) return null
  assertEmpresaId(empresaId)

  const { data, error } = await supabase
    .from('df_filiais')
    .select('id')
    .eq('id', filialId)
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .maybeSingle()

  if (error || !data?.id) return null
  return data.id
}

export async function criarContasEmLote(supabase, contas) {
  return inserirLoteComEmpresa(supabase, 'df_contas', contas, {
    select: '*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia, valor_variavel)'
  })
}

export async function criarConta(supabase, payload) {
  return inserirComEmpresa(supabase, 'df_contas', payload, { select: true })
}

export async function buscarRecorrenciaSemelhante(supabase, payload) {
  assertEmpresaId(payload?.empresa_id)

  const valorVariavel = payload.valor_variavel === true
  let consulta = selecionarPorEmpresa(supabase, 'df_contas_recorrentes', payload.empresa_id)
    .eq('ativo', true)
    .eq('descricao', payload.descricao)
    .eq('tipo_recorrencia', payload.tipo_recorrencia || 'mensal')
    .eq('dia_vencimento', payload.dia_vencimento)
    .eq('valor_variavel', valorVariavel)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!valorVariavel) {
    consulta = consulta.eq('valor', payload.valor)
  }

  consulta = payload.centro_custo_id
    ? consulta.eq('centro_custo_id', payload.centro_custo_id)
    : consulta.is('centro_custo_id', null)

  consulta = payload.filial_id
    ? consulta.eq('filial_id', payload.filial_id)
    : consulta.is('filial_id', null)

  return consulta.maybeSingle()
}

export async function atualizarConta(supabase, id, empresaId, payload) {
  return atualizarPorEmpresa(supabase, 'df_contas', id, empresaId, payload)
}

export async function buscarRecorrenciaPorId(supabase, id, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .eq('id', id)
    .maybeSingle()
}

export async function listarRecorrenciasPorDia(supabase, empresaId, diaVencimento) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .eq('ativo', true)
    .eq('dia_vencimento', diaVencimento)
    .order('created_at', { ascending: false })
}

export async function criarRecorrencia(supabase, payload) {
  const resposta = await inserirComEmpresa(supabase, 'df_contas_recorrentes', payload, { select: true })
  if (deveTentarSemFilial(resposta.error, payload)) {
    return inserirComEmpresa(supabase, 'df_contas_recorrentes', removerFilialId(payload), { select: true })
  }
  return resposta
}

export async function atualizarRecorrencia(supabase, id, empresaId, payload) {
  const resposta = await atualizarPorEmpresa(supabase, 'df_contas_recorrentes', id, empresaId, payload)
  if (deveTentarSemFilial(resposta.error, payload)) {
    return atualizarPorEmpresa(supabase, 'df_contas_recorrentes', id, empresaId, removerFilialId(payload))
  }
  return resposta
}

export async function vincularRecorrenciaNaConta(supabase, contaId, empresaId, recorrenciaId) {
  return atualizarConta(supabase, contaId, empresaId, { recorrencia_id: recorrenciaId })
}

export async function desativarRecorrencia(supabase, id, empresaId) {
  return atualizarRecorrencia(supabase, id, empresaId, { ativo: false })
}

export async function reativarRecorrencia(supabase, id, empresaId) {
  return atualizarRecorrencia(supabase, id, empresaId, { ativo: true })
}

export async function atualizarStatusConta(supabase, id, empresaId, status) {
  return atualizarConta(supabase, id, empresaId, { status })
}

export async function estornarBaixaConta(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, { status: 'pendente' })
}

export async function baixarContaComoPaga(supabase, id, empresaId, payload = {}) {
  return atualizarConta(supabase, id, empresaId, {
    status: 'pago',
    valor_pago: payload.valor_pago,
    data_pagamento: payload.data_pagamento,
    observacao_pagamento: payload.observacao_pagamento || null
  })
}

export async function corrigirPagamentoConta(supabase, id, empresaId, payload = {}) {
  return atualizarConta(supabase, id, empresaId, {
    status: 'pago',
    valor_pago: payload.valor_pago,
    data_pagamento: payload.data_pagamento,
    observacao_pagamento: payload.observacao_pagamento || null
  })
}

export async function enviarContaParaLixeira(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, {
    excluido: true,
    excluido_em: new Date().toISOString()
  })
}

export async function ocultarConta(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, {
    oculto: true,
    oculto_em: new Date().toISOString()
  })
}

export async function reexibirConta(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, {
    oculto: false,
    oculto_em: null
  })
}


function deveTentarSemFilial(error, payload) {
  return Boolean(error && payload && Object.prototype.hasOwnProperty.call(payload, 'filial_id') && ehErroColunaFilialAusente(error))
}

function ehErroColunaFilialAusente(error) {
  const mensagem = String(error?.message || error?.details || error?.hint || '').toLowerCase()
  return mensagem.includes('filial_id') && (mensagem.includes('schema cache') || mensagem.includes('column') || mensagem.includes('coluna'))
}

function removerFilialId(payload) {
  const { filial_id, ...restante } = payload || {}
  return restante
}
