import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  inserirLoteComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

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

export async function listarContasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, '*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)')
    .or('excluido.is.null,excluido.eq.false')
    .order('data_vencimento', { ascending: true })
}

export async function listarContasDoMesParaRecorrencia(supabase, empresaId, dataInicial, dataFinal) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, 'id, descricao, valor, data_vencimento, centro_custo_id, filial_id, recorrencia_id, excluido, excluido_em')
    .gte('data_vencimento', dataInicial)
    .lte('data_vencimento', dataFinal)
    .or('excluido.is.null,excluido.eq.false')
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

  return selecionarPorEmpresa(
    supabase,
    'df_contas_pagamentos',
    empresaId,
    'id, empresa_id, conta_id, valor_pago, data_pagamento, observacao, arquivado, arquivado_em, criado_em, atualizado_em'
  )
    .in('conta_id', idsNormalizados)
    .eq('arquivado', false)
    .order('data_pagamento', { ascending: true })
    .order('criado_em', { ascending: true })
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
    select: '*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)'
  })
}

export async function criarConta(supabase, payload) {
  return inserirComEmpresa(supabase, 'df_contas', payload, { select: true })
}

export async function buscarRecorrenciaSemelhante(supabase, payload) {
  assertEmpresaId(payload?.empresa_id)

  let consulta = selecionarPorEmpresa(supabase, 'df_contas_recorrentes', payload.empresa_id)
    .eq('ativo', true)
    .eq('descricao', payload.descricao)
    .eq('valor', payload.valor)
    .eq('tipo_recorrencia', payload.tipo_recorrencia || 'mensal')
    .eq('dia_vencimento', payload.dia_vencimento)
    .order('created_at', { ascending: false })
    .limit(1)

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
