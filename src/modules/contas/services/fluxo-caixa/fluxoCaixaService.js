import { selecionarPorEmpresa } from '../../../../services/supabaseQueryService'

const COLUNAS_CONTAS_FLUXO = [
  'id',
  'empresa_id',
  'descricao',
  'valor',
  'valor_pago',
  'juros_multa',
  'desconto',
  'observacao',
  'observacao_pagamento',
  'imposto_tipo',
  'data_pagamento',
  'data_vencimento',
  'status',
  'centro',
  'filial_id',
  'centro_custo_id',
  'oculto',
  'excluido',
  'deletado',
  'excluido_em',
  'df_centros_custo(nome)',
  'df_filiais(nome)'
].join(', ')

const COLUNAS_RECEITAS_FLUXO = [
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
  'df_filiais(nome)'
].join(', ')

export async function carregarFluxoCaixaRealizadoV1(supabase, empresaId, ano) {
  const anoNumero = Number(ano)
  if (!empresaId) return { data: null, error: new Error('Empresa ativa não selecionada.') }
  if (!Number.isInteger(anoNumero)) return { data: null, error: new Error('Ano inválido para o fluxo de caixa.') }

  const dataInicial = `${anoNumero}-01-01`
  const dataFinal = `${anoNumero}-12-31`

  const [respostaContasPagas, respostaPagamentos, respostaFiliais, respostaReceitas] = await Promise.all([
    selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS_FLUXO)
      .eq('status', 'pago')
      .or('oculto.is.null,oculto.eq.false')
      .or('excluido.is.null,excluido.eq.false')
      .or('deletado.is.null,deletado.eq.false')
      .order('data_vencimento', { ascending: true }),
    selecionarPorEmpresa(
      supabase,
      'df_contas_pagamentos',
      empresaId,
      'id, empresa_id, conta_id, valor_pago, data_pagamento, observacao, arquivado, arquivado_em, criado_em, atualizado_em'
    )
      .or('arquivado.is.null,arquivado.eq.false')
      .order('data_pagamento', { ascending: true }),
    selecionarPorEmpresa(supabase, 'df_filiais', empresaId, 'id, nome')
      .order('nome', { ascending: true }),
    selecionarPorEmpresa(supabase, 'df_receitas', empresaId, COLUNAS_RECEITAS_FLUXO)
      .gte('data_receita', dataInicial)
      .lte('data_receita', dataFinal)
      .eq('status', 'ativo')
      .or('arquivado.is.null,arquivado.eq.false')
      .order('data_receita', { ascending: true })
  ])

  if (respostaContasPagas.error) return { data: null, error: respostaContasPagas.error }
  if (respostaPagamentos.error) return { data: null, error: respostaPagamentos.error }
  if (respostaFiliais.error) return { data: null, error: respostaFiliais.error }
  if (respostaReceitas.error) return { data: null, error: respostaReceitas.error }

  const pagamentosParciais = respostaPagamentos.data || []
  const idsContasParciais = Array.from(new Set(pagamentosParciais.map((pagamento) => pagamento.conta_id).filter(Boolean)))
  let contasParciais = []

  if (idsContasParciais.length > 0) {
    const respostaContasParciais = await selecionarPorEmpresa(
      supabase,
      'df_contas',
      empresaId,
      COLUNAS_CONTAS_FLUXO
    )
      .in('id', idsContasParciais)
      .or('oculto.is.null,oculto.eq.false')
      .or('excluido.is.null,excluido.eq.false')
      .or('deletado.is.null,deletado.eq.false')

    if (respostaContasParciais.error) return { data: null, error: respostaContasParciais.error }
    contasParciais = respostaContasParciais.data || []
  }

  const contasPagas = respostaContasPagas.data || []
  const contasPorId = new Map([...contasPagas, ...contasParciais].map((conta) => [conta.id, conta]))

  return {
    data: {
      contasPagas,
      pagamentosParciais,
      receitas: respostaReceitas.data || [],
      contasPorId,
      filiais: respostaFiliais.data || []
    },
    error: null
  }
}
