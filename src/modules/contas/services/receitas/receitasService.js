import { atualizarPorEmpresa, inserirComEmpresa, selecionarPorEmpresa } from '../../../../services/supabaseQueryService'

const COLUNAS_RECEITAS = [
  'id',
  'empresa_id',
  'filial_id',
  'data_receita',
  'ano',
  'mes',
  'valor',
  'origem',
  'descricao',
  'observacao',
  'status',
  'arquivado',
  'created_at',
  'updated_at',
  'df_filiais(nome)'
].join(', ')

export async function listarReceitasV1(supabase, empresaId) {
  return selecionarPorEmpresa(supabase, 'df_receitas', empresaId, COLUNAS_RECEITAS)
    .order('data_receita', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function salvarReceitaV1(supabase, empresaId, receita) {
  const payload = normalizarReceitaPayload(empresaId, receita)

  if (receita.id) {
    return atualizarPorEmpresa(supabase, 'df_receitas', receita.id, empresaId, payload)
      .select(COLUNAS_RECEITAS)
      .single()
  }

  return inserirComEmpresa(supabase, 'df_receitas', payload, { select: COLUNAS_RECEITAS })
    .single()
}

export async function arquivarReceitaV1(supabase, empresaId, receitaId) {
  return atualizarPorEmpresa(supabase, 'df_receitas', receitaId, empresaId, {
    arquivado: true,
    status: 'arquivado'
  }).select(COLUNAS_RECEITAS).single()
}

export async function restaurarReceitaV1(supabase, empresaId, receitaId) {
  return atualizarPorEmpresa(supabase, 'df_receitas', receitaId, empresaId, {
    arquivado: false,
    status: 'ativo'
  }).select(COLUNAS_RECEITAS).single()
}

function normalizarReceitaPayload(empresaId, receita) {
  return {
    empresa_id: empresaId,
    filial_id: receita.filial_id,
    data_receita: receita.data_receita,
    valor: receita.valor,
    origem: receita.origem || 'Venda de Loja',
    descricao: receita.descricao || 'Receita',
    observacao: receita.observacao || null,
    status: receita.status || 'ativo',
    arquivado: receita.arquivado === true
  }
}
