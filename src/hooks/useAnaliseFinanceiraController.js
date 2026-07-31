import { useCallback, useMemo, useState } from 'react'
import { useRelatorioFinanceiro } from './useRelatorioFinanceiro.js'
import { gerarCopilotFinanceiro } from '../services/ai/copilotEngine.js'
import {
  agruparRegistrosAnalise,
  calcularComparacaoPeriodo,
  calcularIndicadoresAnalise,
  calcularPeriodoAnterior,
  calcularProjecoesAnalise,
  filtrarRegistrosAnalise,
  identificarExcecoesAnalise,
  periodoMesAtual,
} from '../utils/analiseFinanceira.js'

export { AGRUPAMENTOS_ANALISE } from '../utils/analiseFinanceira.js'

export function useAnaliseFinanceiraController({ empresaId, empresaNome, centros = [], filiais = [] }) {
  const periodoInicial = useMemo(() => periodoMesAtual(), [])
  const [filtros, setFiltros] = useState({ ...periodoInicial, base: 'vencimento', status: 'todas', filialId: '', centrosSelecionados: [], origem: 'todas', busca: '', incluirOcultas: false, agrupamento: 'status', metaMensal: '' })
  const alterarFiltro = useCallback((campo, valor) => setFiltros((atuais) => ({ ...atuais, [campo]: valor })), [])
  const criterios = useMemo(() => ({ base: filtros.base, dataInicial: filtros.dataInicial, dataFinal: filtros.dataFinal, status: filtros.status, filialId: filtros.filialId, centroCustoId: filtros.centrosSelecionados.length === 1 ? filtros.centrosSelecionados[0] : '', origem: filtros.origem, incluirOcultas: filtros.incluirOcultas, busca: filtros.busca }), [filtros])
  const periodoAnterior = useMemo(() => calcularPeriodoAnterior(filtros), [filtros.dataFinal, filtros.dataInicial])
  const criteriosAnteriores = useMemo(() => ({ ...criterios, ...periodoAnterior }), [criterios, periodoAnterior])
  const atual = useRelatorioFinanceiro({ empresaId, criterios })
  const anterior = useRelatorioFinanceiro({ empresaId, criterios: criteriosAnteriores })
  const registros = useMemo(() => filtrarRegistrosAnalise(atual.registros, filtros, centros, filiais), [atual.registros, centros, filiais, filtros])
  const registrosAnteriores = useMemo(() => filtrarRegistrosAnalise(anterior.registros, filtros, centros, filiais), [anterior.registros, centros, filiais, filtros])
  const indicadores = useMemo(() => calcularIndicadoresAnalise(registros, undefined, { base: filtros.base }), [filtros.base, registros])
  const indicadoresAnteriores = useMemo(() => calcularIndicadoresAnalise(registrosAnteriores, undefined, { base: filtros.base }), [filtros.base, registrosAnteriores])
  const comparacao = useMemo(() => calcularComparacaoPeriodo(indicadores, indicadoresAnteriores), [indicadores, indicadoresAnteriores])
  const copilot = useMemo(() => gerarCopilotFinanceiro({ contasFiltradas: registros, empresaId, periodo: { inicio: filtros.dataInicial, fim: filtros.dataFinal }, carregando: atual.carregando, erro: atual.erro }), [atual.carregando, atual.erro, empresaId, filtros.dataFinal, filtros.dataInicial, registros])
  const projecoes = useMemo(() => calcularProjecoesAnalise(registros, filtros), [filtros, registros])
  const excecoes = useMemo(() => identificarExcecoesAnalise(registros), [registros])
  const grupos = useMemo(() => agruparRegistrosAnalise(registros, filtros.agrupamento, centros, filiais), [centros, filiais, filtros.agrupamento, registros])
  const atualizar = useCallback(async () => Promise.all([atual.consultar(), anterior.consultar()]), [anterior.consultar, atual.consultar])
  const limparFiltros = useCallback(() => setFiltros({ ...periodoMesAtual(), base: 'vencimento', status: 'todas', filialId: '', centrosSelecionados: [], origem: 'todas', busca: '', incluirOcultas: false, agrupamento: 'status', metaMensal: '' }), [])
  return { filtros, alterarFiltro, limparFiltros, criterios, periodoAnterior, registros, indicadores, indicadoresAnteriores, comparacao, copilot, projecoes, excecoes, grupos, carregando: atual.carregando || anterior.carregando, carregado: atual.carregado && anterior.carregado, erro: atual.erro || anterior.erro, atualizar, contextoExportacao: { tipoRelatorio: 'Análise Financeira', empresaNome: empresaNome || 'Empresa ativa', filialNome: filiais.find((item) => item.id === filtros.filialId)?.nome || 'Todas', centroNome: filtros.centrosSelecionados.length ? centros.filter((item) => filtros.centrosSelecionados.includes(item.id)).map((item) => item.nome).join(', ') : 'Todos', periodo: `${filtros.dataInicial} até ${filtros.dataFinal}`, base: filtros.base === 'pagamento' ? 'Por pagamento' : 'Por vencimento', status: filtros.status, totalRegistros: registros.length, dataGeracao: new Date().toLocaleString('pt-BR'), resumoFinanceiro: { totalPrevisto: indicadores.previsto, totalPago: indicadores.pago, totalPagoPeriodo: filtros.base === 'pagamento' ? indicadores.pago : 0, saldoEmAberto: indicadores.saldo } } }
}
