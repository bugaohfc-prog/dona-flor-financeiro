import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  inserirLoteComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

export async function listarContasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas', empresaId, '*, df_centros_custo(nome), df_contas_recorrentes(tipo_recorrencia)')
    .eq('excluido', false)
    .order('data_vencimento')
}

export async function listarRecorrenciasAtivas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId)
    .eq('ativo', true)
}

export async function criarContasEmLote(supabase, contas) {
  return inserirLoteComEmpresa(supabase, 'df_contas', contas, {
    select: '*, df_centros_custo(nome), df_contas_recorrentes(tipo_recorrencia)'
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
  return inserirComEmpresa(supabase, 'df_contas_recorrentes', payload, { select: true })
}

export async function atualizarRecorrencia(supabase, id, empresaId, payload) {
  return atualizarPorEmpresa(supabase, 'df_contas_recorrentes', id, empresaId, payload)
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

export async function enviarContaParaLixeira(supabase, id, empresaId) {
  return atualizarConta(supabase, id, empresaId, {
    excluido: true,
    excluido_em: new Date().toISOString()
  })
}
