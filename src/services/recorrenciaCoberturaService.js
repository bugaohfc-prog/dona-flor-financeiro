import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { executarConsultaPaginada } from './supabasePaginationService.js'
import { assertEmpresaId } from './tenantService.js'

const COLUNAS_SERIES = 'id, empresa_id, descricao, valor, valor_variavel, dia_vencimento, tipo_recorrencia, ativo, data_inicio, filial_id, centro_custo_id'
const COLUNAS_CONTAS = 'id, empresa_id, descricao, valor, data_vencimento, competencia, imposto_tipo, status, recorrencia_id, filial_id, centro_custo_id, oculto, excluido, deletado'

export async function consultarCoberturaRecorrencias(supabase, { empresaId, inicio, fim } = {}) {
  assertEmpresaId(empresaId)
  const [respostaSeries, respostaContas] = await Promise.all([
    executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas_recorrentes', empresaId, COLUNAS_SERIES)
      .order('descricao', { ascending: true }).order('id', { ascending: true })),
    executarConsultaPaginada(() => selecionarPorEmpresa(supabase, 'df_contas', empresaId, COLUNAS_CONTAS)
      .or(`and(data_vencimento.gte.${inicio},data_vencimento.lte.${fim}),and(competencia.gte.${inicio},competencia.lte.${fim})`)
      .order('data_vencimento', { ascending: true }).order('id', { ascending: true }))
  ])
  if (respostaSeries.error) return { data: null, error: respostaSeries.error }
  if (respostaContas.error) return { data: null, error: respostaContas.error }
  return { data: { series: respostaSeries.data || [], contas: respostaContas.data || [] }, error: null }
}
