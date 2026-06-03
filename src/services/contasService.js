import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  inserirLoteComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

export async function listarContasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, '*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)')
    .or('excluido.is.null,excluido.eq.false')
    .order('data_vencimento', { ascending: true })
}

export async function listarContasDoMesParaRecorrencia(supabase, empresaId, dataInicial, dataFinal) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, 'id, descricao, valor, data_vencimento, recorrencia_id, excluido, excluido_em')
    .gte('data_vencimento', dataInicial)
    .lte('data_vencimento', dataFinal)
}

export async function listarRecorrenciasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .eq('ativo', true)
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

export async function atualizarStatusConta(supabase, id, empresaId, status) {
  return atualizarConta(supabase, id, empresaId, { status })
}

export async function baixarContaComoPaga(supabase, id, empresaId, payload = {}) {
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
