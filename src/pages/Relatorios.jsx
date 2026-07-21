import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { consultarRelatorioFinanceiro } from '../services/relatoriosFinanceirosService.js'
import { periodoMes } from '../utils/relatoriosFinanceiros.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import { money as formatarValor, dateBR as formatarData } from '../utils/format'
import { createXlsxBlob, downloadBlob, exportCsv, printHtmlReport } from '../services/export/reportExportService'
import { gerarCopilotFinanceiro } from '../services/ai/copilotEngine.js'

export default function Relatorios({ voltar, empresaId, empresaNome, mostrarAviso, podeExportarDados = true }) {
  const nomeEmpresaRelatorio = String(empresaNome || '').trim() || 'Empresa ativa'

  function formatarPercentual(valor) {
    return `${Number(valor || 0).toFixed(1)}%`
  }

  function slugEmpresa(nome) {
    return String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function nomeArquivoRelatorio(extensao) {
    const slug = slugEmpresa(empresaNome)
    return slug ? `relatorio-financeiro-${slug}.${extensao}` : `relatorio-financeiro.${extensao}`
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)
    return vencimento < hoje
  }

  function valorPrevistoConta(conta) {
    return Number(conta?.valor || 0)
  }

  function valorRealizadoConta(conta) {
    if (conta?.status !== 'pago') return 0
    return Number(conta.valor_pago ?? conta.valor ?? 0)
  }

  function encargosConta(conta) {
    return Number(conta?.juros_multa || 0)
  }

  function descontoConta(conta) {
    return Number(conta?.desconto || 0)
  }

  function contaEntraNoStatus(conta) {
    if (filtroStatus === 'pendentes') return conta.status !== 'pago'
    if (filtroStatus === 'pagas') return conta.status === 'pago'
    if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
    return true
  }

  function pegarMes(data) {
    if (!data) return ''
    return String(data).slice(0, 7)
  }

  function mesAtualPadrao() {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  }

  function mesAnterior(mes) {
    if (!mes) return ''
    const [ano, mesNumero] = mes.split('-').map(Number)
    const data = new Date(ano, mesNumero - 2, 1)
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
  }

  function nomeMes(mes) {
    if (!mes) return 'Todos'
    const [ano, mesNumero] = mes.split('-').map(Number)
    return new Date(ano, mesNumero - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  }

  function corPorPercentual(percentual) {
    if (percentual >= 50) return '#dc3545'
    if (percentual >= 20) return '#f59f00'
    return '#12b886'
  }

  function emojiInsight(tipo) {
    if (tipo === 'critico') return '🚨'
    if (tipo === 'risco') return '⚠️'
    if (tipo === 'queda') return '✅'
    if (tipo === 'alta') return '📈'
    if (tipo === 'acao') return '🎯'
    if (tipo === 'previsao') return '🔮'
    if (tipo === 'meta') return '🎯'
    return 'ℹ️'
  }

  const [contas, setContas] = useState([])
  const [contasComparacao, setContasComparacao] = useState([])
  const [centros, setCentros] = useState([])
  const [filiais, setFiliais] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const consultaRef = useRef(0)
  const [filtroMes, setFiltroMes] = useState(mesAtualPadrao())
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [visaoExecutiva, setVisaoExecutiva] = useState('dre')
  const [metaMensal, setMetaMensal] = useState('')
  const [exportMenuAberto, setExportMenuAberto] = useState(false)
  const [blocosAbertos, setBlocosAbertos] = useState({
    filtros: true,
    kpis: true,
    analise: true,
    indicadores: true,
    projecoes: false,
    prioridade: true,
    meta: true,
    insights: false,
    listas: false,
    ranking: false,
    contas: true
  })
  const [limiteContasRelatorio, setLimiteContasRelatorio] = useState(10)

  const blocoAberto = (chave) => blocosAbertos[chave] !== false
  const alternarBloco = (chave) => {
    setBlocosAbertos((atual) => ({ ...atual, [chave]: !blocoAberto(chave) }))
  }

  useEffect(() => {
    buscarDados()
    return () => { consultaRef.current += 1 }
  }, [empresaId, filtroMes, filtroCentro, filtroFilial])

  async function buscarDados() {
    const token = ++consultaRef.current
    if (!empresaId) {
      setContas([])
      setContasComparacao([])
      setCentros([])
      setFiliais([])
      setErro(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setErro(null)
    const periodo = periodoMes(filtroMes || mesAtualPadrao())
    const periodoComparacao = periodoMes(mesAnterior(filtroMes || mesAtualPadrao()))
    const filtrosRelatorio = {
      empresaId,
      base: 'vencimento',
      status: 'todas',
      filialId: filtroFilial,
      centroCustoId: filtroCentro
    }
    const [respostaRelatorio, respostaComparacao, respostaCentros, respostaFiliais] = await Promise.all([
      consultarRelatorioFinanceiro(supabase, {
        ...filtrosRelatorio,
        dataInicial: periodo.dataInicial,
        dataFinal: periodo.dataFinal
      }),
      consultarRelatorioFinanceiro(supabase, {
        ...filtrosRelatorio,
        dataInicial: periodoComparacao.dataInicial,
        dataFinal: periodoComparacao.dataFinal
      }),
      supabase.from('df_centros_custo').select('*').eq('empresa_id', empresaId).order('nome', { ascending: true }),
      supabase.from('df_filiais').select('*').eq('empresa_id', empresaId).order('nome', { ascending: true })
    ])
    if (token !== consultaRef.current) return

    const falha = respostaRelatorio.error || respostaComparacao.error || respostaCentros.error || respostaFiliais.error
    if (falha) {
      setContas([])
      setContasComparacao([])
      setErro(falha)
      setLoading(false)
      mostrarAviso?.('Nao foi possivel carregar o relatorio financeiro.', 'erro')
      return
    }

    setContas(respostaRelatorio.data?.registros || [])
    setContasComparacao(respostaComparacao.data?.registros || [])
    setCentros(respostaCentros.data || [])
    setFiliais(respostaFiliais.data || [])
    setLoading(false)
  }

  const contasFiltradas = useMemo(() => {
    return contas
      .filter((conta) => {
        if (filtroStatus === 'pendentes') return conta.status !== 'pago'
        if (filtroStatus === 'pagas') return conta.status === 'pago'
        if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
        return true
      })
      .filter((conta) => {
        if (!filtroMes) return true
        return pegarMes(conta.data_vencimento) === filtroMes
      })
      .filter((conta) => {
        if (!filtroCentro) return true
        return conta.centro_custo_id === filtroCentro
      })
      .filter((conta) => {
        if (!filtroFilial) return true
        return conta.filial_id === filtroFilial
      })
  }, [contas, filtroMes, filtroStatus, filtroCentro, filtroFilial])

  const contasMesAnterior = useMemo(() => {
    return contasComparacao.filter(contaEntraNoStatus)
  }, [contasComparacao, filtroStatus])

  const totalGeral = contasFiltradas.reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
  const totalPago = contasFiltradas.reduce((acc, conta) => acc + valorRealizadoConta(conta), 0)
  const totalEncargos = contasFiltradas.reduce((acc, conta) => acc + encargosConta(conta), 0)
  const totalDescontos = contasFiltradas.reduce((acc, conta) => acc + descontoConta(conta), 0)
  const totalVencido = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
  const totalPendente = contasFiltradas.filter((conta) => conta.status !== 'pago').reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
  const totalMesAnterior = contasMesAnterior.reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
  const diferencaMes = totalGeral - totalMesAnterior
  const percentualMes = totalMesAnterior ? (diferencaMes / totalMesAnterior) * 100 : 0
  const previsaoProximoMes = totalMesAnterior ? Math.max(totalGeral + diferencaMes, 0) : totalGeral
  const meta = Number(String(metaMensal || '').replace(',', '.'))
  const metaValida = !isNaN(meta) && meta > 0
  const percentualMeta = metaValida ? (totalGeral / meta) * 100 : 0
  const taxaPago = totalGeral ? (totalPago / totalGeral) * 100 : 0
  const taxaVencido = totalGeral ? Math.min((totalVencido / totalGeral) * 100, 100) : 0

  const centrosComContas = contasFiltradas.reduce((acc, conta) => {
    const chave = conta.centro_custo_id || 'sem-centro'
    if (!acc[chave]) acc[chave] = []
    acc[chave].push(conta)
    return acc
  }, {})

  const ranking = Object.keys(centrosComContas)
    .map((centroId) => {
      const lista = centrosComContas[centroId]
      const centro = centros.find((c) => c.id === centroId)
      const total = lista.reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
      const pago = lista.reduce((acc, conta) => acc + valorRealizadoConta(conta), 0)
      const pendenteCentro = lista.filter((conta) => conta.status !== 'pago').reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
      const vencido = lista.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).reduce((acc, conta) => acc + valorPrevistoConta(conta), 0)
      const encargos = lista.reduce((acc, conta) => acc + encargosConta(conta), 0)
      const descontos = lista.reduce((acc, conta) => acc + descontoConta(conta), 0)
      return {
        id: centroId,
        nome: centro?.nome || 'Sem centro',
        total,
        pago,
        pendente: pendenteCentro,
        vencido,
        encargos,
        descontos,
        percentual: totalGeral ? (total / totalGeral) * 100 : 0
      }
    })
    .sort((a, b) => b.total - a.total)

  const principalCentro = ranking[0] || null
  const maiorValor = ranking[0]?.total || 0
  const centroSelecionado = centros.find((centro) => centro.id === filtroCentro)
  const contasComCentro = contasFiltradas.filter((conta) => conta.centro_custo_id).length
  const contasSemCentro = contasFiltradas.filter((conta) => !conta.centro_custo_id).length
  const percentualClassificacao = contasFiltradas.length ? (contasComCentro / contasFiltradas.length) * 100 : 0
  const semCentro = ranking.find((item) => item.id === 'sem-centro')
  const mostrarAcaoPrioritaria = Boolean(semCentro && semCentro.total > 0)
  const topDespesas = [...contasFiltradas].sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0)).slice(0, 5)

  let scoreSaude = 100
  if (totalVencido > 0) scoreSaude -= 30
  if (principalCentro?.percentual >= 60) scoreSaude -= 20
  if (percentualClassificacao < 40 && contasFiltradas.length > 0) scoreSaude -= 25
  if (diferencaMes > 0 && percentualMes >= 20) scoreSaude -= 15
  if (metaValida && percentualMeta > 100) scoreSaude -= 25
  if (totalPendente > totalPago && totalGeral > 0) scoreSaude -= 10
  scoreSaude = Math.max(scoreSaude, 0)

  let statusSaude = {
    titulo: 'Saúde financeira boa',
    etiqueta: 'Saudável',
    emoji: '✅',
    cor: '#12b886',
    descricao: 'Os indicadores estão equilibrados para o filtro atual.'
  }
  if (scoreSaude < 75 && scoreSaude >= 45) {
    statusSaude = {
      titulo: 'Saúde financeira em atenção',
      etiqueta: 'Atenção',
      emoji: '⚠️',
      cor: '#f59f00',
      descricao: 'Existem pontos que merecem acompanhamento: concentração, variação mensal, meta e classificação.'
    }
  }
  if (scoreSaude < 45) {
    statusSaude = {
      titulo: 'Saúde financeira crítica',
      etiqueta: 'Crítico',
      emoji: '🚨',
      cor: '#dc3545',
      descricao: 'Há sinais relevantes de risco. Priorize vencidos, metas estouradas, concentração e contas sem centro.'
    }
  }

  let qualidadeDados = {
    titulo: 'Qualidade dos dados boa',
    emoji: '✅',
    cor: '#12b886',
    descricao: 'A maioria das contas está classificada por centro de custo.'
  }
  if (percentualClassificacao < 80 && percentualClassificacao >= 40) {
    qualidadeDados = {
      titulo: 'Qualidade dos dados em atenção',
      emoji: '⚠️',
      cor: '#f59f00',
      descricao: 'Parte das contas ainda está sem centro. A análise pode ficar parcialmente limitada.'
    }
  }
  if (percentualClassificacao < 40 && contasFiltradas.length > 0) {
    qualidadeDados = {
      titulo: 'Qualidade dos dados crítica',
      emoji: '🚨',
      cor: '#dc3545',
      descricao: 'Grande parte das contas está sem centro. Classifique as despesas para liberar análises confiáveis.'
    }
  }

  const insights = []
  if (percentualClassificacao < 40 && contasFiltradas.length > 0) {
    insights.push({ tipo: 'critico', texto: 'A análise gerencial está limitada porque a maior parte das despesas está sem centro de custo. Classifique os lançamentos antes de tomar decisões estratégicas.' })
  }
  if (metaValida) {
    if (percentualMeta > 100) insights.push({ tipo: 'meta', texto: `Meta mensal estourada: o total filtrado atingiu ${formatarPercentual(percentualMeta)} da meta de ${formatarValor(meta)}.` })
    else if (percentualMeta >= 80) insights.push({ tipo: 'meta', texto: `Atenção à meta: você já consumiu ${formatarPercentual(percentualMeta)} da meta mensal.` })
    else insights.push({ tipo: 'meta', texto: `Meta sob controle: consumo atual em ${formatarPercentual(percentualMeta)} da meta mensal.` })
  }
  if (totalVencido > 0) {
    const qtd = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).length
    insights.push({ tipo: 'risco', texto: `Contas vencidas detectadas: ${qtd} conta(s), somando ${formatarValor(totalVencido)}. Priorize pagamento para evitar juros.` })
  }
  if (!filtroCentro && principalCentro?.percentual >= 60 && principalCentro.id !== 'sem-centro') {
    insights.push({ tipo: 'risco', texto: `Alto risco de concentração: ${principalCentro.nome} representa ${formatarPercentual(principalCentro.percentual)} dos custos filtrados.` })
  }
  if (filtroMes && totalGeral > 0) {
    if (totalMesAnterior === 0) insights.push({ tipo: 'previsao', texto: `${nomeMes(filtroMes)} tem ${formatarValor(totalGeral)} em contas. Ainda não há base anterior suficiente para tendência.` })
    else if (diferencaMes > 0) insights.push({ tipo: 'alta', texto: `Crescimento de ${formatarValor(diferencaMes)} frente a ${nomeMes(mesAnterior(filtroMes))}, variação de ${formatarPercentual(percentualMes)}.` })
    else if (diferencaMes < 0) insights.push({ tipo: 'queda', texto: `Redução de ${formatarValor(Math.abs(diferencaMes))} frente ao mês anterior, queda de ${formatarPercentual(Math.abs(percentualMes))}.` })
    insights.push({ tipo: 'previsao', texto: `Se o padrão continuar, o próximo mês pode fechar próximo de ${formatarValor(previsaoProximoMes)}.` })
  }
  if (insights.length === 0) insights.push({ tipo: 'info', texto: 'Nenhum alerta relevante encontrado para os filtros selecionados.' })


  const contasPorMes = useMemo(() => {
    const mapa = {}
    const mesReferencia = filtroMes || mesAtualPadrao()
    contas.filter(contaEntraNoStatus).forEach((conta) => {
      if (filtroCentro && conta.centro_custo_id !== filtroCentro) return
      if (filtroFilial && conta.filial_id !== filtroFilial) return
      const mes = pegarMes(conta.data_vencimento)
      if (!mes || mes > mesReferencia) return
      if (!mapa[mes]) mapa[mes] = { mes, total: 0, pago: 0, pendente: 0, vencido: 0 }
      const valor = valorPrevistoConta(conta)
      mapa[mes].total += valor
      if (conta.status === 'pago') mapa[mes].pago += valorRealizadoConta(conta)
      else mapa[mes].pendente += valor
      if (estaVencida(conta.data_vencimento, conta.status)) mapa[mes].vencido += valor
    })
    return Object.values(mapa).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6)
  }, [contas, filtroMes, filtroStatus, filtroCentro, filtroFilial])

  const rankingFiliais = useMemo(() => {
    const mapa = {}
    contasFiltradas.forEach((conta) => {
      const chave = conta.filial_id || 'sem-filial'
      const nome = conta.df_filiais?.nome || 'Sem filial'
      if (!mapa[chave]) mapa[chave] = { id: chave, nome, total: 0, pago: 0, pendente: 0, vencido: 0, qtd: 0 }
      const valor = valorPrevistoConta(conta)
      const realizado = valorRealizadoConta(conta)
      mapa[chave].total += valor
      mapa[chave].qtd += 1
      if (conta.status === 'pago') mapa[chave].pago += realizado
      else mapa[chave].pendente += valor
      if (estaVencida(conta.data_vencimento, conta.status)) mapa[chave].vencido += valor
    })
    return Object.values(mapa).map((item) => ({ ...item, percentual: totalGeral ? (item.total / totalGeral) * 100 : 0 })).sort((a, b) => b.total - a.total)
  }, [contasFiltradas, totalGeral])

  const dreGerencial = useMemo(() => {
    const realizado = totalPago
    const emAberto = totalPendente
    const risco = totalVencido
    const provisao = previsaoProximoMes
    const eficiencia = totalGeral ? Math.max(0, 100 - taxaVencido) : 100
    return [
      { linha: 'Realizado', valor: realizado, descricao: 'Contas pagas no filtro' },
      { linha: 'A realizar', valor: emAberto, descricao: 'Pendências abertas' },
      ...(totalEncargos > 0 ? [{ linha: 'Encargos', valor: totalEncargos, descricao: 'Juros e multas pagos acima do previsto' }] : []),
      ...(totalDescontos > 0 ? [{ linha: 'Descontos', valor: totalDescontos, descricao: 'Descontos ou ajustes pagos abaixo do previsto' }] : []),
      { linha: 'Risco vencido', valor: risco, descricao: 'Parte atrasada que exige ação' },
      { linha: 'Previsão próximo mês', valor: provisao, descricao: 'Tendência gerencial simples' },
      { linha: 'Eficiência', valor: eficiencia, descricao: 'Quanto menor o vencido, melhor', percentual: true }
    ]
  }, [totalPago, totalPendente, totalEncargos, totalDescontos, totalVencido, previsaoProximoMes, totalGeral, taxaVencido])

  const chartStatus = useMemo(() => ([
    { name: 'Realizado', value: totalPago, color: '#12b886' },
    { name: 'Pendente', value: Math.max(totalPendente - totalVencido, 0), color: '#f59f00' },
    { name: 'Vencido', value: totalVencido, color: '#dc3545' }
  ].filter((item) => item.value > 0)), [totalPago, totalPendente, totalVencido])

  const chartCentros = useMemo(() => ranking.slice(0, 6).map((item) => ({ nome: item.nome.length > 14 ? `${item.nome.slice(0, 14)}…` : item.nome, total: Number(item.total.toFixed(2)) })), [ranking])


  const inteligenciaFinanceira = useMemo(() => {
    const ticketMedio = contasFiltradas.length ? totalGeral / contasFiltradas.length : 0
    const pendentesAbertas = contasFiltradas.filter((conta) => conta.status !== 'pago')
    const vencidas = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    const maiorDespesa = topDespesas[0] || null
    const maiorDespesaPercentual = maiorDespesa && totalGeral ? (Number(maiorDespesa.valor || 0) / totalGeral) * 100 : 0
    const paretoTop3 = topDespesas.slice(0, 3).reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const paretoTop3Percentual = totalGeral ? (paretoTop3 / totalGeral) * 100 : 0
    const recorrentes = contasFiltradas.filter((conta) => conta.df_contas_recorrentes?.tipo_recorrencia)
    const totalRecorrente = recorrentes.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const percentualRecorrente = totalGeral ? (totalRecorrente / totalGeral) * 100 : 0
    const concentracaoCentro = principalCentro?.percentual || 0
    const riscoCaixa = totalGeral ? Math.min((totalPendente / totalGeral) * 100, 100) : 0
    const riscoVencido = totalGeral ? Math.min((totalVencido / totalGeral) * 100, 100) : 0
    const anomalias = contasFiltradas
      .filter((conta) => ticketMedio > 0 && Number(conta.valor || 0) >= ticketMedio * 2.5)
      .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))
      .slice(0, 5)

    let nivel = 'baixo'
    let cor = '#12b886'
    let titulo = 'Análise financeira saudável'
    if (scoreSaude < 45 || riscoCaixa >= 55 || taxaVencido >= 25) {
      nivel = 'alto'
      cor = '#dc3545'
      titulo = 'Análise financeira em alerta'
    } else if (scoreSaude < 75 || riscoCaixa >= 30 || concentracaoCentro >= 50 || percentualClassificacao < 80) {
      nivel = 'medio'
      cor = '#f59f00'
      titulo = 'Análise financeira em atenção'
    }

    const acoes = []
    if (vencidas.length > 0) acoes.push(`Priorizar ${vencidas.length} conta(s) vencida(s), somando ${formatarValor(totalVencido)}.`)
    if (percentualClassificacao < 80 && contasSemCentro > 0) acoes.push(`Classificar ${contasSemCentro} conta(s) sem centro para aumentar a confiabilidade da análise.`)
    if (principalCentro && principalCentro.id !== 'sem-centro' && concentracaoCentro >= 50) acoes.push(`Revisar concentração em ${principalCentro.nome}, que representa ${formatarPercentual(concentracaoCentro)} do filtro.`)
    if (metaValida && percentualMeta >= 80) acoes.push(percentualMeta > 100 ? 'Revisar meta mensal: o limite foi ultrapassado.' : 'Acompanhar meta mensal: consumo acima de 80%.')
    if (anomalias.length > 0) acoes.push(`Auditar ${anomalias.length} lançamento(s) acima de 2,5x o ticket médio.`)
    if (acoes.length === 0) acoes.push('Manter acompanhamento semanal dos indicadores e revisar centros de maior valor.')

    const previsoes = [
      { label: 'Próximo mês', value: previsaoProximoMes, sub: 'projeção por tendência simples' },
      { label: 'Risco em aberto', value: totalPendente, sub: `${formatarPercentual(riscoCaixa)} ainda não pago` },
      { label: 'Risco vencido', value: totalVencido, sub: `${formatarPercentual(riscoVencido)} do previsto` },
      { label: 'Recorrente', value: totalRecorrente, sub: `${formatarPercentual(percentualRecorrente)} do total` },
      { label: 'Top 3 despesas', value: paretoTop3, sub: `${formatarPercentual(paretoTop3Percentual)} do total` }
    ]

    return {
      titulo,
      nivel,
      cor,
      ticketMedio,
      riscoCaixa,
      riscoVencido,
      paretoTop3,
      paretoTop3Percentual,
      percentualRecorrente,
      maiorDespesa,
      maiorDespesaPercentual,
      anomalias,
      acoes,
      previsoes,
      pendentesAbertas: pendentesAbertas.length
    }
  }, [contasFiltradas, totalGeral, totalPendente, totalVencido, taxaVencido, scoreSaude, principalCentro, percentualClassificacao, contasSemCentro, metaValida, percentualMeta, topDespesas, previsaoProximoMes])


  const copilotFinanceiro = useMemo(() => gerarCopilotFinanceiro({ contas, contasFiltradas }), [contas, contasFiltradas])

  const camadaPreditiva = useMemo(() => {
    const historico = contasPorMes.length ? contasPorMes : []
    const totais = historico.map((item) => Number(item.total || 0))
    const mediaMovel = totais.length ? totais.reduce((acc, valor) => acc + valor, 0) / totais.length : totalGeral
    const ultimo = totais.length ? totais[totais.length - 1] : totalGeral
    const penultimo = totais.length > 1 ? totais[totais.length - 2] : ultimo
    const variacao = ultimo - penultimo
    const fatorRisco = totalGeral ? Math.min(totalPendente / totalGeral, 1) : 0
    const fatorVencido = totalGeral ? Math.min(totalVencido / totalGeral, 1) : 0
    const previsao30 = Math.max(ultimo + variacao * 0.35, 0)
    const previsao60 = Math.max(previsao30 + variacao * 0.55, 0)
    const previsao90 = Math.max(previsao60 + variacao * 0.75, 0)
    const riscoProjetado = Math.min(100, Math.max(0, fatorRisco * 35 + fatorVencido * 35 + (principalCentro?.percentual >= 60 ? 12 : 0) + (percentualClassificacao < 80 ? 10 : 0)))
    const statusRisco = riscoProjetado >= 65 ? 'Alto' : riscoProjetado >= 35 ? 'Moderado' : 'Baixo'
    const corRisco = riscoProjetado >= 65 ? '#dc3545' : riscoProjetado >= 35 ? '#f59f00' : '#12b886'
    const tendencia = variacao > 0 ? 'alta' : variacao < 0 ? 'queda' : 'estável'
    const metaForecast = metaValida ? {
      meta,
      atual: totalGeral,
      falta: Math.max(meta - totalGeral, 0),
      projetado: previsao30,
      chance: previsao30 <= meta ? 'Alta' : previsao30 <= meta * 1.15 ? 'Média' : 'Baixa',
      percentualProjetado: meta ? (previsao30 / meta) * 100 : 0
    } : null
    const alertas = []
    if (riscoProjetado >= 65) alertas.push('Risco projetado alto para os próximos 30 dias. Priorize vencidos e reduza concentração.')
    if (previsao90 > Math.max(mediaMovel, 1) * 1.25) alertas.push('A previsão de 90 dias indica possível aumento de despesas acima da média histórica.')
    if (metaForecast && metaForecast.percentualProjetado > 100) alertas.push('A previsão de 30 dias pode ultrapassar a meta mensal cadastrada.')
    if (percentualClassificacao < 80 && contasFiltradas.length > 0) alertas.push('A qualidade da previsão melhora após classificar contas sem centro de custo.')
    if (alertas.length === 0) alertas.push('Cenário projetado controlado para os filtros atuais.')
    return {
      mediaMovel,
      variacao,
      tendencia,
      previsao30,
      previsao60,
      previsao90,
      riscoProjetado,
      statusRisco,
      corRisco,
      metaForecast,
      alertas,
      serie: [
        ...historico.map((item) => ({ mes: item.mes, realizado: item.total, previsto: null })),
        { mes: '+30d', realizado: null, previsto: previsao30 },
        { mes: '+60d', realizado: null, previsto: previsao60 },
        { mes: '+90d', realizado: null, previsto: previsao90 }
      ]
    }
  }, [contasPorMes, totalGeral, totalVencido, totalPendente, taxaVencido, principalCentro, percentualClassificacao, metaValida, meta, contasFiltradas.length])

  function criarLinhasContasExportacao() {
    return contasFiltradas.map((conta) => [
      conta.descricao || 'Sem descrição',
      valorPrevistoConta(conta),
      conta.status === 'pago' ? Number(conta.valor_pago ?? conta.valor ?? 0) : '',
      encargosConta(conta),
      descontoConta(conta),
      conta.data_pagamento ? formatarData(conta.data_pagamento) : '',
      conta.observacao_pagamento || '',
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
      conta.df_centros_custo?.nome || 'Sem centro',
      conta.df_filiais?.nome || 'Sem filial',
      conta.df_contas_recorrentes?.tipo_recorrencia || 'Não recorrente'
    ])
  }


  function imprimirPDF() {
    if (loading || erro) {
      mostrarAviso?.('Aguarde o relatorio ficar disponivel para exportar.', 'aviso')
      return
    }
    if (!podeExportarDados) {
      mostrarAviso?.('Você não tem permissão para realizar esta ação.', 'erro')
      return
    }

    const linhasDre = dreGerencial.map((linha) => `
      <tr>
        <td>${escapeHtml(linha.linha)}</td>
        <td class="valor">${linha.percentual ? formatarPercentual(linha.valor) : formatarValor(linha.valor)}</td>
        <td>${escapeHtml(linha.descricao)}</td>
      </tr>
    `).join('')

    const linhasContas = criarLinhasContasExportacao().map((linha) => `
      <tr>${linha.map((campo, index) => {
        const ehValor = index >= 1 && index <= 4
        const valor = ehValor && campo !== '' ? formatarValor(campo) : escapeHtml(campo || '-')
        return `<td class="${ehValor ? 'valor' : ''}">${valor}</td>`
      }).join('')}</tr>
    `).join('')

    const linhasRanking = ranking.map((item) => `
      <tr>
        <td>${escapeHtml(item.nome)}</td>
        <td class="valor">${formatarValor(item.total)}</td>
        <td class="valor">${formatarValor(item.pago)}</td>
        <td class="valor">${formatarValor(item.pendente)}</td>
        <td class="valor">${formatarValor(item.vencido)}</td>
        <td class="valor">${formatarValor(item.encargos)}</td>
        <td class="valor">${formatarValor(item.descontos)}</td>
        <td class="valor">${formatarPercentual(item.percentual)}</td>
      </tr>
    `).join('')

    const linhasPrioridadesCopilot = copilotFinanceiro.priorities.map((item) => `
      <tr>
        <td>${escapeHtml(item.level)}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="valor">${escapeHtml(item.impact)}</td>
        <td>${escapeHtml(item.action)}</td>
      </tr>
    `).join('')

    const linhasRecomendacoesCopilot = copilotFinanceiro.recomendacoes.map((item, index) => `
      <div class="insight"><strong>${index + 1}.</strong> ${escapeHtml(item)}</div>
    `).join('')

    const dataEmissao = new Date()
    const dataEmissaoFormatada = dataEmissao.toLocaleString('pt-BR')

    const html = `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório Financeiro - ${escapeHtml(nomeEmpresaRelatorio)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; background: #fff; }
            h1 { margin: 0 0 4px; font-size: 24px; }
            h2 { margin: 24px 0 10px; font-size: 17px; color: #0f766e; }
            .meta { color: #64748b; margin-bottom: 18px; font-size: 12px; }
            .brand { color: #ccfbf1; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
            .subtitle { margin-top: 4px; color: rgba(255,255,255,.88); font-size: 13px; font-weight: 700; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .numero { display: block; font-size: 18px; font-weight: 800; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; vertical-align: top; }
            th { background: #ecfdf5; color: #065f46; }
            .valor { text-align: right; white-space: nowrap; }
            .insight { border-left: 4px solid #0d9488; padding: 8px 10px; background: #f0fdfa; margin: 6px 0; }
            .narrative { border: 1px solid #c7d2fe; border-radius: 14px; padding: 12px; background: #eef2ff; margin: 8px 0; }
            .narrative strong { display: block; color: #3730a3; margin-bottom: 4px; }
            .cover { border-radius: 18px; padding: 18px; background: linear-gradient(135deg, #052e2b, #0f766e); color: #fff; margin-bottom: 16px; }
            .cover h1 { color: #fff; }
            .cover .meta { color: rgba(255,255,255,.78); margin-bottom: 0; }
            .score { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.12); font-weight: 800; }
            .footer { margin-top: 24px; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
            @page { size: A4; margin: 12mm; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="cover">
            <div class="brand">DNA Gestão</div>
            <h1>Relatório financeiro</h1>
            <div class="subtitle">Relatório gerencial para conferência de indicadores, resumo de despesas, prioridades e contas filtradas.</div>
            <div class="meta">
              Empresa: ${escapeHtml(nomeEmpresaRelatorio)}<br />
              Emitido em ${escapeHtml(dataEmissaoFormatada)} • ${escapeHtml(nomeMes(filtroMes || mesAtualPadrao()))}<br />
              Centro: ${escapeHtml(filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos')} • Filial: ${escapeHtml(filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas')} • Status: ${escapeHtml(filtroStatus)}
            </div>
            <div class="score">Saúde financeira: ${copilotFinanceiro.score}/100 • ${escapeHtml(copilotFinanceiro.status.label)}</div>
          </div>
          <h2>Resumo financeiro</h2>
          <div class="insight">${escapeHtml(copilotFinanceiro.executiveSummary)}</div>
          <h2>Análise financeira</h2>
          <div class="narrative"><strong>Resumo do período</strong>${escapeHtml(copilotFinanceiro.narrativa?.parecer || copilotFinanceiro.executiveSummary)}</div>
          <div class="narrative"><strong>Liquidez</strong>${escapeHtml(copilotFinanceiro.narrativa?.liquidez || '')}</div>
          <div class="narrative"><strong>Concentração</strong>${escapeHtml(copilotFinanceiro.narrativa?.concentracao || '')}</div>
          <div class="narrative"><strong>Curto prazo</strong>${escapeHtml(copilotFinanceiro.narrativa?.curtoPrazo || '')}</div>
          <div class="cards">
            <div class="card"><span class="label">Previsto</span><span class="numero">${formatarValor(totalGeral)}</span></div>
            <div class="card"><span class="label">Realizado</span><span class="numero">${formatarValor(totalPago)}</span></div>
            <div class="card"><span class="label">Pendente</span><span class="numero">${formatarValor(totalPendente)}</span></div>
            <div class="card"><span class="label">Vencido</span><span class="numero">${formatarValor(totalVencido)}</span></div>
            <div class="card"><span class="label">Encargos</span><span class="numero">${formatarValor(totalEncargos)}</span></div>
            <div class="card"><span class="label">Descontos</span><span class="numero">${formatarValor(totalDescontos)}</span></div>
          </div>
          <h2>Prioridades financeiras</h2>
          <table><thead><tr><th>Nível</th><th>Prioridade</th><th>Leitura</th><th>Impacto</th><th>Ação</th></tr></thead><tbody>${linhasPrioridadesCopilot || '<tr><td colspan="5">Nenhuma prioridade crítica encontrada.</td></tr>'}</tbody></table>
          <h2>Recomendações</h2>
          ${linhasRecomendacoesCopilot}
          <h2>Resumo de despesas</h2>
          <table><thead><tr><th>Linha</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>${linhasDre}</tbody></table>
          <h2>Análises financeiras</h2>
          ${insights.map((insight) => `<div class="insight">${escapeHtml(insight.texto)}</div>`).join('')}
          <h2>Ranking por centro</h2>
          <table><thead><tr><th>Centro</th><th>Previsto</th><th>Realizado</th><th>Pendente</th><th>Vencido</th><th>Encargos</th><th>Desconto</th><th>Participação</th></tr></thead><tbody>${linhasRanking || '<tr><td colspan="8">Nenhum centro encontrado.</td></tr>'}</tbody></table>
          <h2>Contas filtradas</h2>
          <table><thead><tr><th>Descrição</th><th>Previsto</th><th>Realizado</th><th>Encargos</th><th>Desconto</th><th>Data pagamento</th><th>Obs. pagamento</th><th>Vencimento</th><th>Status</th><th>Centro</th><th>Filial</th><th>Recorrência</th></tr></thead><tbody>${linhasContas || '<tr><td colspan="12">Nenhuma conta encontrada.</td></tr>'}</tbody></table>
          <div class="footer"><span>DNA Gestão • Documento para conferência interna.</span><span>Emitido em ${escapeHtml(dataEmissaoFormatada)}</span></div>
        </body>
      </html>`

    printHtmlReport(html, () => mostrarAviso?.('Não foi possível abrir a impressão do relatório.', 'erro'))
  }

  function exportarCSV() {
    if (loading || erro) {
      mostrarAviso?.('Aguarde o relatorio ficar disponivel para exportar.', 'aviso')
      return
    }
    if (!podeExportarDados) {
      mostrarAviso?.('Você não tem permissão para realizar esta ação.', 'erro')
      return
    }

    const headers = ['Descrição', 'Valor previsto', 'Valor pago', 'Encargos', 'Desconto', 'Data pagamento', 'Observação pagamento', 'Vencimento', 'Status', 'Centro', 'Filial', 'Recorrência']
    const rows = criarLinhasContasExportacao().map((linha) => [
      linha[0],
      Number(linha[1] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      linha[2] === '' ? '' : Number(linha[2] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Number(linha[3] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Number(linha[4] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      linha[5],
      linha[6],
      linha[7],
      linha[8],
      linha[9],
      linha[10],
      linha[11]
    ])

    exportCsv({ filename: nomeArquivoRelatorio('csv'), headers, rows })
  }

  function exportarExcel() {
    if (loading || erro) {
      mostrarAviso?.('Aguarde o relatorio ficar disponivel para exportar.', 'aviso')
      return
    }
    if (!podeExportarDados) {
      mostrarAviso?.('Você não tem permissão para realizar esta ação.', 'erro')
      return
    }

    const sheets = [
      {
        name: 'Resumo',
        rows: [
          ['Relatório financeiro'],
          ['Gerado em', new Date().toLocaleString('pt-BR')],
          ['Mês', filtroMes || 'Todos'],
          ['Centro', filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'],
          ['Filial', filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'],
          [],
          ['Indicador', 'Valor'],
          ['Previsto', totalGeral],
          ['Realizado', totalPago],
          ['Pendente', totalPendente],
          ['Vencido', totalVencido],
          ['Encargos', totalEncargos],
          ['Descontos', totalDescontos],
          ['Saúde financeira', copilotFinanceiro.score],
          ['Situação financeira', copilotFinanceiro.status.label],
          ['Nível de atenção', inteligenciaFinanceira.nivel],
          ['Risco caixa %', inteligenciaFinanceira.riscoCaixa],
          ['Ticket médio', inteligenciaFinanceira.ticketMedio]
        ]
      },
      {
        name: 'Resumo despesas',
        rows: [
          ['Linha', 'Valor', 'Descrição'],
          ...dreGerencial.map((linha) => [linha.linha, linha.valor, linha.descricao])
        ]
      },
      {
        name: 'Contas',
        rows: [
          ['Descrição', 'Valor previsto', 'Valor pago', 'Encargos', 'Desconto', 'Data pagamento', 'Observação pagamento', 'Vencimento', 'Status', 'Centro', 'Filial', 'Recorrência'],
          ...criarLinhasContasExportacao()
        ]
      },
      {
        name: 'Ranking',
        rows: [
          ['Centro', 'Previsto', 'Realizado', 'Pendente', 'Vencido', 'Encargos', 'Desconto', 'Participação'],
          ...ranking.map((item) => [item.nome, item.total, item.pago, item.pendente, item.vencido, item.encargos, item.descontos, `${formatarPercentual(item.percentual)}`])
        ]
      },
      {
        name: 'Analise',
        rows: [
          ['Indicador', 'Valor', 'Observação'],
          ['Nível', inteligenciaFinanceira.nivel, inteligenciaFinanceira.titulo],
          ['Ticket médio', inteligenciaFinanceira.ticketMedio, 'Média por conta filtrada'],
          ['Risco caixa %', inteligenciaFinanceira.riscoCaixa, 'Pendente ainda não pago sobre previsto'],
          ['Risco vencido %', inteligenciaFinanceira.riscoVencido, 'Parte vencida dentro do pendente'],
          ['Top 3 despesas', inteligenciaFinanceira.paretoTop3, `${formatarPercentual(inteligenciaFinanceira.paretoTop3Percentual)} do total`],
          ['Recorrente %', inteligenciaFinanceira.percentualRecorrente, 'Peso das contas recorrentes'],
          [],
          ['Ações recomendadas'],
          ...inteligenciaFinanceira.acoes.map((acao, index) => [index + 1, acao])
        ]
      },
      {
        name: 'Assistente financeiro',
        rows: [
          ['Resumo financeiro'],
          [copilotFinanceiro.executiveSummary],
          [],
          ['Índice financeiro', copilotFinanceiro.score, copilotFinanceiro.status.label],
          [],
          ['Análise financeira'],
          ['Resumo do período', copilotFinanceiro.narrativa?.parecer || ''],
          ['Liquidez', copilotFinanceiro.narrativa?.liquidez || ''],
          ['Concentração', copilotFinanceiro.narrativa?.concentracao || ''],
          ['Curto prazo', copilotFinanceiro.narrativa?.curtoPrazo || ''],
          ['Comportamento', copilotFinanceiro.narrativa?.comportamento || ''],
          [],
          ['Pontos de atenção'],
          ...(copilotFinanceiro.narrativa?.anomalias || []).map((item, index) => [index + 1, item]),
          [],
          ['Previsto', copilotFinanceiro.totals.total],
          ['Realizado', copilotFinanceiro.totals.pago],
          ['Pendente', copilotFinanceiro.totals.pendente],
          ['Vencido', copilotFinanceiro.totals.vencido],
          ['Encargos', copilotFinanceiro.totals.encargos || 0],
          ['Descontos', copilotFinanceiro.totals.descontos || 0],
          [],
          ['Prioridades'],
          ['Nível', 'Prioridade', 'Descrição', 'Impacto', 'Ação'],
          ...copilotFinanceiro.priorities.map((item) => [item.level, item.title, item.description, item.impact, item.action]),
          [],
          ['Recomendações'],
          ...copilotFinanceiro.recomendacoes.map((item, index) => [index + 1, item]),
          [],
          ['Centros de custo'],
          ['Centro', 'Previsto', 'Realizado', 'Pendente', 'Vencido', 'Encargos', 'Desconto', 'Peso', 'Risco'],
          ...copilotFinanceiro.rankingCentros.map((item) => [item.nome, item.total, item.pago, item.pendente, item.vencido, item.encargos || 0, item.descontos || 0, `${item.peso}%`, `${item.risco}%`])
        ]
      },
      {
        name: 'Projecoes',
        rows: [
          ['Indicador', 'Valor', 'Observação'],
          ['Previsão 30 dias', camadaPreditiva.previsao30, camadaPreditiva.tendencia],
          ['Previsão 60 dias', camadaPreditiva.previsao60, 'Projeção intermediária'],
          ['Previsão 90 dias', camadaPreditiva.previsao90, 'Projeção estendida'],
          ['Risco projetado %', camadaPreditiva.riscoProjetado, camadaPreditiva.statusRisco],
          ['Média móvel', camadaPreditiva.mediaMovel, 'Histórico filtrado'],
          ['Variação base', camadaPreditiva.variacao, 'Último mês vs anterior'],
          [],
          ['Pontos de atenção'],
          ...camadaPreditiva.alertas.map((alerta, index) => [index + 1, alerta])
        ]
      }
    ]

    downloadBlob(nomeArquivoRelatorio('xlsx'), createXlsxBlob(sheets))
  }

  function limparFiltros() {
    setFiltroMes('')
    setFiltroStatus('todas')
    setFiltroCentro('')
    setFiltroFilial('')
    setMetaMensal('')
  }

  const resumoExecutivo = percentualClassificacao < 40
    ? 'A análise gerencial está limitada por falta de classificação em centros de custo.'
    : totalVencido > 0
      ? 'Existem pendências vencidas que devem ser priorizadas.'
      : metaValida && percentualMeta > 100
        ? 'A meta mensal foi ultrapassada no filtro atual.'
        : diferencaMes > 0
          ? 'Os custos cresceram em relação ao mês anterior. Acompanhe os maiores centros.'
          : 'O cenário atual está controlado para os filtros selecionados.'
  const contasRelatorioVisiveis = contasFiltradas.slice(0, limiteContasRelatorio)
  const exibindoTodasContasRelatorio = limiteContasRelatorio >= contasFiltradas.length

  return (
    <div className="relatorios-page" style={styles.page}>
      <style>{cssPrint}</style>
      <style>{cssAntiFlicker}</style>

      <div className="relatorio-print-header">
        <h1>Relatório Financeiro Gerencial</h1>
        <p>Empresa: {nomeEmpresaRelatorio}</p>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        <p>Centro: {filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} • Filial: {filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'} • Mês: {filtroMes || 'Todos'} • Status: {filtroStatus}</p>
      </div>
      <div className="relatorio-print-footer">Relatório gerado pelo DNA Gestão</div>

      <header className="no-print finance-report-header" style={styles.hero}>
        <div className="finance-report-title">
          <span className="finance-report-kicker">Relatório executivo</span>
          <h1 style={styles.titulo}>Análise Financeira</h1>
          <p style={styles.descricaoTela}>Decida com base em previsto, realizado, pendências e riscos do período.</p>
        </div>
        <div className="finance-report-header-actions" style={styles.actionsTop}>
          <button className="finance-report-back" style={styles.btnVoltar} onClick={voltar}>Voltar</button>
          {podeExportarDados && (
            <div className="finance-report-export">
              <button
                type="button"
                className="finance-report-export-toggle"
                disabled={loading || Boolean(erro)}
                onClick={() => setExportMenuAberto((aberto) => !aberto)}
              >
                Exportar
              </button>
              {exportMenuAberto && (
                <div className="finance-report-export-menu">
                  <button type="button" onClick={() => { imprimirPDF(); setExportMenuAberto(false) }}>PDF</button>
                  <button type="button" onClick={() => { exportarExcel(); setExportMenuAberto(false) }}>Excel</button>
                  <button type="button" onClick={() => { exportarCSV(); setExportMenuAberto(false) }}>CSV</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="finance-report-score" style={styles.heroBadge}>
          <span>{statusSaude.emoji}</span>
          <strong>{scoreSaude}/100</strong>
          <small>{statusSaude.etiqueta}</small>
        </div>
      </header>

      <section className="no-print relatorio-sticky-filtros finance-report-filters" style={styles.filtrosBox}>
        <div className="finance-report-filter-head" style={styles.filtroHeader}>
          <div>
            <span className="finance-report-kicker">Filtros</span>
            <strong>Recorte financeiro</strong>
          </div>
          <span style={styles.filtroResumo}>{nomeMes(filtroMes || mesAtualPadrao())} • {filtroCentro ? centroSelecionado?.nome || 'Centro selecionado' : 'Todos os centros'} • {filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Filial selecionada' : 'Todas as filiais'}</span>
          <div className="finance-report-head-actions">
            <button className="finance-report-clear" style={styles.btnLimpar} onClick={limparFiltros}>Limpar</button>
            <BlockToggle aberto={blocoAberto('filtros')} onClick={() => alternarBloco('filtros')} label="filtros" />
          </div>
        </div>
        {blocoAberto('filtros') && (
          <>
            <div className="finance-report-filter-grid" style={styles.filtrosGrid}>
              <label>
                <span>Meta mensal</span>
                <input style={styles.input} placeholder="Ex: 5000" value={metaMensal} onChange={(e) => setMetaMensal(e.target.value)} />
              </label>
              <label>
                <span>Centro</span>
                <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
                  <option value="">Todos os centros</option>
                  {centros.map((centro) => <option key={centro.id} value={centro.id}>{centro.nome}</option>)}
                </select>
              </label>
              <label>
                <span>Filial</span>
                <select style={styles.input} value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
                  <option value="">Todas as filiais</option>
                  {filiais.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
                </select>
              </label>
              <label>
                <span>Visão</span>
                <select style={styles.input} value={visaoExecutiva} onChange={(e) => setVisaoExecutiva(e.target.value)}>
                  <option value="dre">Resumo de despesas</option>
                  <option value="graficos">Visão Gráficos</option>
                  <option value="filiais">Visão Filiais</option>
                  <option value="inteligencia">Análise financeira</option>
                  <option value="preditiva">Projeções financeiras</option>
                  <option value="copilot">Assistente financeiro</option>
                </select>
              </label>
              <label>
                <span>Mês</span>
                <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
              </label>
            </div>
            <div className="finance-report-status-tabs" style={styles.filtros}>
              {[
                ['todas', 'Todas'],
                ['pendentes', 'Pendentes'],
                ['pagas', 'Pagas'],
                ['vencidas', 'Vencidas']
              ].map(([valor, label]) => (
                <button key={valor} className={`finance-report-status-${valor} ${filtroStatus === valor ? 'is-active' : ''}`} style={filtroStatus === valor ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus(valor)}>{label}</button>
              ))}
            </div>
          </>
        )}
      </section>
      {erro ? (
        <section style={styles.cardAlerta} role="alert">
          <div>
            <strong>Relatorio indisponivel</strong>
            <p style={styles.muted}>Nao foi possivel consultar os dados do periodo. Nenhum total foi calculado.</p>
          </div>
          <button type="button" style={styles.btnAcao} onClick={buscarDados}>Tentar novamente</button>
        </section>
      ) : loading ? <RelatorioSkeleton /> : (
        <>
      <section className="finance-report-list-section finance-report-kpi-section">
        <div className="finance-report-section-head">
          <div>
            <span className="finance-report-kicker">Resumo</span>
            <strong>Indicadores financeiros</strong>
          </div>
          <BlockToggle aberto={blocoAberto('kpis')} onClick={() => alternarBloco('kpis')} label="indicadores financeiros" />
        </div>
        {blocoAberto('kpis') && (
          <div className="executive-kpi-grid finance-report-kpis" style={styles.executiveKpiGrid}>
            <ExecutiveKpiCard titulo="Previsto" valor={formatarValor(totalGeral)} detalhe={`${contasFiltradas.length} conta(s)`} tom="#364fc7" />
            <ExecutiveKpiCard titulo="Realizado" valor={formatarValor(totalPago)} detalhe={`${formatarPercentual(taxaPago)} do previsto`} tom="#12b886" />
            <ExecutiveKpiCard titulo="Pendente" valor={formatarValor(totalPendente)} detalhe="Ainda não pago" tom="#f59f00" />
            <ExecutiveKpiCard titulo="Vencido" valor={formatarValor(totalVencido)} detalhe={totalVencido > 0 ? `${formatarPercentual(taxaVencido)} do previsto` : 'Sem vencidos'} tom="#dc3545" />
            <ExecutiveKpiCard titulo="Encargos" valor={formatarValor(totalEncargos)} detalhe="Juros/multa" tom="#ea580c" />
            <ExecutiveKpiCard titulo="Descontos" valor={formatarValor(totalDescontos)} detalhe="Ajustes a menor" tom="#059669" />
          </div>
        )}
      </section>

      <section className="finance-report-analysis-panel" style={styles.advancedPanel}>
        <div className="finance-report-section-head" style={styles.widgetHeader}>
          <div>
            <strong>Relatórios financeiros</strong>
            <p style={styles.muted}>Visualize indicadores, tendências, filiais, projeções e recomendações em um só lugar.</p>
          </div>
          <div className="finance-report-head-actions">
            <span style={styles.badge}>Completo</span>
            <BlockToggle aberto={blocoAberto('analise')} onClick={() => alternarBloco('analise')} label="relatórios financeiros" />
          </div>
        </div>

        {blocoAberto('analise') && visaoExecutiva === 'dre' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="Resumo de despesas" emoji="🧮">
              {dreGerencial.map((linha) => (
                <div key={linha.linha} style={styles.dreLinha}>
                  <div style={styles.dreTexto}>
                    <strong style={styles.dreTitulo}>{linha.linha}</strong>
                    <small style={styles.dreDescricao}>{linha.descricao}</small>
                  </div>
                  <strong style={styles.dreValor}>{linha.percentual ? formatarPercentual(linha.valor) : formatarValor(linha.valor)}</strong>
                </div>
              ))}
            </Widget>
            <Widget titulo="Tendência do período" emoji="📉">
              <div style={styles.chartBox}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={contasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarValor(value)} />
                    <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="vencido" stroke="#dc3545" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Widget>
          </div>
        )}

        {blocoAberto('analise') && visaoExecutiva === 'graficos' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="Centros por valor" emoji="📊">
              <div style={styles.chartBox}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartCentros}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarValor(value)} />
                    <Bar dataKey="total" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Widget>
            <Widget titulo="Status financeiro" emoji="🧭">
              <div style={styles.chartBox}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={chartStatus} dataKey="value" nameKey="name" outerRadius={85} label>
                      {chartStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatarValor(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Widget>
          </div>
        )}

        {blocoAberto('analise') && visaoExecutiva === 'filiais' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="Ranking por filial" emoji="🏢">
              {rankingFiliais.length === 0 && <p style={styles.vazio}>Nenhuma filial encontrada nos filtros.</p>}
              {rankingFiliais.map((filial, index) => (
                <div key={filial.id} style={styles.dreLinha}>
                  <div><strong>{index + 1}. {filial.nome}</strong><small>{filial.qtd} conta(s) • {formatarPercentual(filial.percentual)}</small></div>
                  <strong>{formatarValor(filial.total)}</strong>
                </div>
              ))}
            </Widget>
            <Widget titulo="Análise por filial" emoji="🧠">
              <p style={styles.executivoTexto}>{rankingFiliais[0] ? `${rankingFiliais[0].nome} concentra ${formatarPercentual(rankingFiliais[0].percentual)} do total filtrado. Compare as unidades e acompanhe onde há maior impacto financeiro.` : 'Sem dados por filial para o filtro atual.'}</p>
              <div style={styles.grid3Compacto}>
                <MiniStat label="Filiais" value={rankingFiliais.length} />
                <MiniStat label="Maior unidade" value={rankingFiliais[0]?.nome || '-'} />
                <MiniStat label="Valor" value={rankingFiliais[0] ? formatarValor(rankingFiliais[0].total) : '-'} />
              </div>
            </Widget>
          </div>
        )}


        {blocoAberto('analise') && visaoExecutiva === 'inteligencia' && (
          <div style={styles.advancedGrid}>
            <Widget titulo={inteligenciaFinanceira.titulo} emoji="🧠" badge={inteligenciaFinanceira.nivel.toUpperCase()} badgeColor={inteligenciaFinanceira.cor}>
              <p style={styles.executivoTexto}>Análise dos principais sinais financeiros para os filtros atuais.</p>
              <Progress value={scoreSaude} color={inteligenciaFinanceira.cor} />
              <div style={styles.grid3Compacto}>
                <MiniStat label="Ticket médio" value={formatarValor(inteligenciaFinanceira.ticketMedio)} />
                <MiniStat label="Risco caixa" value={formatarPercentual(inteligenciaFinanceira.riscoCaixa)} />
                <MiniStat label="Risco vencido" value={formatarPercentual(inteligenciaFinanceira.riscoVencido)} />
                <MiniStat label="Pendências" value={inteligenciaFinanceira.pendentesAbertas} />
              </div>
            </Widget>

            <Widget titulo="Previsões e maiores despesas" emoji="🔮">
              <div style={styles.compareGrid}>
                {inteligenciaFinanceira.previsoes.map((item) => (
                  <MiniStat key={item.label} label={item.label} value={formatarValor(item.value)} sub={item.sub} />
                ))}
              </div>
              {inteligenciaFinanceira.maiorDespesa && (
                <p style={styles.muted}>Maior despesa: <strong>{inteligenciaFinanceira.maiorDespesa.descricao}</strong> representa {formatarPercentual(inteligenciaFinanceira.maiorDespesaPercentual)} do total filtrado.</p>
              )}
            </Widget>

            <Widget titulo="Ações recomendadas" emoji="✅">
              <div style={styles.insightList}>
                {inteligenciaFinanceira.acoes.map((acao, index) => (
                  <div key={index} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>{index + 1}</span>
                    <p>{acao}</p>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget titulo="Pontos de atenção" emoji="🕵️">
              {inteligenciaFinanceira.anomalias.length === 0 && <p style={styles.vazio}>Nenhum lançamento fora do padrão foi encontrado.</p>}
              {inteligenciaFinanceira.anomalias.map((conta) => (
                <div key={conta.id} style={styles.topItem}>
                  <div style={styles.medalha}>!</div>
                  <div style={styles.topText}>
                    <strong>{conta.descricao}</strong>
                    <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}</small>
                  </div>
                  <strong>{formatarValor(conta.valor)}</strong>
                </div>
              ))}
            </Widget>
          </div>
        )}


        {blocoAberto('analise') && visaoExecutiva === 'copilot' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="Resumo financeiro" emoji="✨" badge={`${copilotFinanceiro.score}/100`} badgeColor={copilotFinanceiro.status.tone === 'danger' ? '#dc3545' : copilotFinanceiro.status.tone === 'warning' ? '#f59f00' : '#12b886'}>
              <p style={styles.executivoTexto}>{copilotFinanceiro.executiveSummary}</p>
              <div style={styles.grid3Compacto}>
                <MiniStat label="Previsto" value={formatarValor(copilotFinanceiro.totals.total)} />
                <MiniStat label="Realizado" value={formatarValor(copilotFinanceiro.totals.pago)} />
                <MiniStat label="Pendente" value={formatarValor(copilotFinanceiro.totals.pendente)} />
                <MiniStat label="Vencido" value={formatarValor(copilotFinanceiro.totals.vencido)} />
              </div>
            </Widget>

            <Widget titulo="Análise financeira" emoji="🧠" badge="Atual" badgeColor="#7c3aed">
              <p style={styles.executivoTexto}>{copilotFinanceiro.narrativa?.parecer || copilotFinanceiro.executiveSummary}</p>
              <div style={styles.insightList}>
                {[copilotFinanceiro.narrativa?.liquidez, copilotFinanceiro.narrativa?.concentracao, copilotFinanceiro.narrativa?.curtoPrazo, copilotFinanceiro.narrativa?.comportamento].filter(Boolean).map((item, index) => (
                  <div key={`${item}-${index}`} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>✦</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget titulo="Pontos de atenção" emoji="⚠️" badge={`${copilotFinanceiro.narrativa?.anomalias?.length || 0} sinais`} badgeColor="#dc3545">
              <div style={styles.insightList}>
                {(copilotFinanceiro.narrativa?.anomalias || []).map((item, index) => (
                  <div key={`${item}-${index}`} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>!</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget titulo="Prioridades" emoji="🚦" badge={`${copilotFinanceiro.priorities.length} ações`} badgeColor="#0f766e">
              <div style={styles.insightList}>
                {copilotFinanceiro.priorities.map((item, index) => (
                  <div key={`${item.title}-${index}`} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>{index + 1}</span>
                    <p><strong>{item.title}</strong><br />{item.description}<br /><small>{item.level} impacto • {item.impact} • {item.action}</small></p>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget titulo="Recomendações" emoji="✅">
              <div style={styles.insightList}>
                {copilotFinanceiro.recomendacoes.map((item, index) => (
                  <div key={`${item}-${index}`} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>✓</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </Widget>

            <Widget titulo="Centros de custo" emoji="🔎">
              {copilotFinanceiro.rankingCentros.length === 0 && <p style={styles.vazio}>Sem centros suficientes para análise.</p>}
              {copilotFinanceiro.rankingCentros.map((centro) => (
                <div key={centro.nome} style={styles.itemGrafico}>
                  <div style={styles.cardLinha}><span>{centro.nome}</span><strong>{formatarValor(centro.total)}</strong></div>
                  <Progress value={Math.max(centro.peso, 4)} color={corPorPercentual(centro.peso)} />
                  <small>{centro.peso}% do recorte • risco {centro.risco}% • vencido {formatarValor(centro.vencido)}</small>
                </div>
              ))}
            </Widget>
          </div>
        )}
      </section>

      <section className="finance-report-list-section">
        <div className="finance-report-section-head">
          <div>
            <span className="finance-report-kicker">Leitura executiva</span>
            <strong>Resumo e qualidade</strong>
          </div>
          <BlockToggle aberto={blocoAberto('indicadores')} onClick={() => alternarBloco('indicadores')} label="resumo e qualidade" />
        </div>
        {blocoAberto('indicadores') && (
          <div className="finance-report-dashboard-grid" style={styles.dashboardGrid}>
            <Widget titulo="Resumo financeiro" emoji="📌" destaque>
              <p style={styles.executivoTexto}>{resumoExecutivo}</p>
              <div style={styles.miniStats}>
                <MiniStat label="Mês" value={nomeMes(filtroMes || mesAtualPadrao())} />
                <MiniStat label="Centro" value={filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} />
                <MiniStat label="Status" value={filtroStatus} />
              </div>
            </Widget>

            <Widget titulo={statusSaude.titulo} emoji={statusSaude.emoji} badge={statusSaude.etiqueta} badgeColor={statusSaude.cor}>
              <p style={styles.muted}>{statusSaude.descricao}</p>
              <Progress value={scoreSaude} color={statusSaude.cor} />
              <small>{scoreSaude}/100 pontos de saúde financeira</small>
            </Widget>

            <Widget titulo={qualidadeDados.titulo} emoji={qualidadeDados.emoji} badge={formatarPercentual(percentualClassificacao)} badgeColor={qualidadeDados.cor}>
              <p style={styles.muted}>{qualidadeDados.descricao}</p>
              <Progress value={percentualClassificacao} color={qualidadeDados.cor} />
              <div style={styles.grid3Compacto}>
                <MiniStat label="Total" value={contasFiltradas.length} />
                <MiniStat label="Com centro" value={contasComCentro} />
                <MiniStat label="Sem centro" value={contasSemCentro} />
              </div>
            </Widget>

            <Widget titulo="Comparativo mensal" emoji="📅">
              <div style={styles.compareGrid}>
                <MiniStat label="Mês atual" value={formatarValor(totalGeral)} sub={nomeMes(filtroMes || mesAtualPadrao())} />
                <MiniStat label="Mês anterior" value={formatarValor(totalMesAnterior)} sub={nomeMes(mesAnterior(filtroMes || mesAtualPadrao()))} />
                <MiniStat label="Variação" value={`${diferencaMes > 0 ? '↑ +' : diferencaMes < 0 ? '↓ ' : ''}${formatarValor(diferencaMes)}`} sub={formatarPercentual(percentualMes)} />
                <MiniStat label="Previsão" value={formatarValor(previsaoProximoMes)} sub="próximo mês" />
              </div>
            </Widget>
          </div>
        )}
      </section>


      <section className="finance-report-predictive-panel" style={styles.predictivePanel}>
        <div className="finance-report-section-head" style={styles.widgetHeader}>
          <div>
            <strong>Projeções financeiras</strong>
            <p style={styles.muted}>Estimativa para 30, 60 e 90 dias, com risco projetado e acompanhamento da meta.</p>
          </div>
          <div className="finance-report-head-actions">
            <span style={{ ...styles.badge, color: camadaPreditiva.corRisco }}>{camadaPreditiva.statusRisco}</span>
            <BlockToggle aberto={blocoAberto('projecoes')} onClick={() => alternarBloco('projecoes')} label="projeções financeiras" />
          </div>
        </div>
        {blocoAberto('projecoes') && (
          <>
            <div style={styles.predictiveGrid}>
              <MiniStat label="Previsão 30d" value={formatarValor(camadaPreditiva.previsao30)} sub={camadaPreditiva.tendencia} />
              <MiniStat label="Previsão 60d" value={formatarValor(camadaPreditiva.previsao60)} sub="projeção" />
              <MiniStat label="Previsão 90d" value={formatarValor(camadaPreditiva.previsao90)} sub="cenário" />
              <MiniStat label="Risco projetado" value={`${formatarPercentual(camadaPreditiva.riscoProjetado)}`} sub={camadaPreditiva.statusRisco} />
            </div>
            <Progress value={camadaPreditiva.riscoProjetado} color={camadaPreditiva.corRisco} />
            <div style={styles.advancedGrid}>
              <Widget titulo="Curva de previsão" emoji="📈">
                <div style={styles.chartBox}>
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={camadaPreditiva.serie}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value) => value == null ? '-' : formatarValor(value)} />
                      <Line type="monotone" dataKey="realizado" stroke="#0d9488" strokeWidth={3} connectNulls dot={false} />
                      <Line type="monotone" dataKey="previsto" stroke="#7c3aed" strokeWidth={3} strokeDasharray="6 4" connectNulls dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Widget>
              <Widget titulo="Pontos de atenção" emoji="🚦">
                <div style={styles.insightList}>
                  {camadaPreditiva.alertas.map((alerta, index) => (
                    <div key={index} style={styles.insightItem}>
                      <span style={styles.insightEmoji}>🔎</span>
                      <p>{alerta}</p>
                    </div>
                  ))}
                </div>
                {camadaPreditiva.metaForecast && (
                  <div style={styles.metaForecastBox}>
                    <strong>Meta projetada</strong>
                    <small>Chance de cumprir: {camadaPreditiva.metaForecast.chance}</small>
                    <small>Falta: {formatarValor(camadaPreditiva.metaForecast.falta)}</small>
                    <Progress value={Math.min(camadaPreditiva.metaForecast.percentualProjetado, 100)} color={camadaPreditiva.metaForecast.percentualProjetado > 100 ? '#dc3545' : '#12b886'} />
                  </div>
                )}
              </Widget>
            </div>
          </>
        )}
      </section>

      {mostrarAcaoPrioritaria && (
        <section className="print-card finance-report-priority-card" style={styles.cardAlerta}>
          <div>
            <div className="finance-report-section-head">
              <strong>🚨 Ação prioritária</strong>
              <BlockToggle aberto={blocoAberto('prioridade')} onClick={() => alternarBloco('prioridade')} label="ação prioritária" />
            </div>
            {blocoAberto('prioridade') && (
              <p>{formatarPercentual(semCentro.percentual)} das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise.</p>
            )}
          </div>
          {blocoAberto('prioridade') && <button className="no-print" style={styles.btnAcao} onClick={voltar}>Ir para contas</button>}
        </section>
      )}

      {metaValida && (
        <section className="print-card finance-report-meta-card" style={styles.cardMeta}>
          <div className="finance-report-section-head" style={styles.widgetHeader}>
            <strong>🎯 Meta mensal</strong>
            <div className="finance-report-head-actions">
              <span style={styles.badge}>{formatarPercentual(percentualMeta)}</span>
              <BlockToggle aberto={blocoAberto('meta')} onClick={() => alternarBloco('meta')} label="meta mensal" />
            </div>
          </div>
          {blocoAberto('meta') && (
            <>
              <p>Meta: {formatarValor(meta)} • Atual: {formatarValor(totalGeral)}</p>
              <Progress value={Math.min(percentualMeta, 100)} color={percentualMeta > 100 ? '#dc3545' : percentualMeta >= 80 ? '#f59f00' : '#12b886'} />
            </>
          )}
        </section>
      )}

      <section className="finance-report-list-section">
        <div className="finance-report-section-head">
          <div>
            <span className="finance-report-kicker">Leituras</span>
            <strong>Insights e distribuição</strong>
          </div>
          <BlockToggle aberto={blocoAberto('insights')} onClick={() => alternarBloco('insights')} label="insights e distribuição" />
        </div>
        {blocoAberto('insights') && (
          <div className="finance-report-two-columns" style={styles.twoColumns}>
            <Widget titulo="Insights automáticos" emoji="💡">
              <div style={styles.insightList}>
                {insights.map((insight, index) => (
                  <div key={index} style={styles.insightItem}>
                    <span style={styles.insightEmoji}>{emojiInsight(insight.tipo)}</span>
                    <p>{insight.texto}</p>
                  </div>
                ))}
              </div>
            </Widget>

            {!filtroCentro && ranking.length > 0 && (
              <Widget titulo="Distribuição por centro" emoji="📊">
                {ranking.slice(0, 5).map((item) => (
                  <div key={item.id} style={styles.itemGrafico}>
                    <div style={styles.cardLinha}><span>{item.nome}</span><strong>{formatarPercentual(item.percentual)}</strong></div>
                    <Progress value={Math.max(item.percentual, 4)} color={corPorPercentual(item.percentual)} />
                    <small>{formatarValor(item.total)} {item.id === 'sem-centro' && <b style={styles.alertaTexto}> • Classificar</b>}</small>
                  </div>
                ))}
              </Widget>
            )}
          </div>
        )}
      </section>

      <section className="finance-report-list-section">
        <div className="finance-report-section-head">
          <div>
            <span className="finance-report-kicker">Listas</span>
            <strong>Top despesas e resultado</strong>
          </div>
          <BlockToggle aberto={blocoAberto('listas')} onClick={() => alternarBloco('listas')} label="top despesas e resultado" />
        </div>
        {blocoAberto('listas') && (
          <div className="finance-report-two-columns" style={styles.twoColumns}>
            {topDespesas.length > 0 && (
              <Widget titulo="Top despesas" emoji="🔥">
                {topDespesas.map((conta, index) => (
                  <div key={conta.id} style={styles.topItem}>
                    <div style={styles.medalha}>{index + 1}</div>
                    <div style={styles.topText}>
                      <strong>{conta.descricao}</strong>
                      <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}</small>
                    </div>
                    <strong>{formatarValor(conta.valor)}</strong>
                  </div>
                ))}
              </Widget>
            )}

            <Widget titulo="Resultado do filtro" emoji="🧾">
              <div style={styles.resultGrid}>
                <MiniStat label="Centros" value={ranking.length} />
                <MiniStat label="Contas" value={contasFiltradas.length} />
                <MiniStat label="Dominante" value={principalCentro ? principalCentro.nome : '-'} sub={principalCentro ? formatarPercentual(principalCentro.percentual) : ''} />
              </div>
            </Widget>
          </div>
        )}
      </section>

      {!filtroCentro && (
        <section className="finance-report-list-section" style={styles.bloco}>
          <div className="finance-report-section-head">
            <div>
              <span className="finance-report-kicker">Ranking</span>
              <h2 style={styles.subtitulo}>🏆 Ranking por Centro</h2>
            </div>
            <BlockToggle aberto={blocoAberto('ranking')} onClick={() => alternarBloco('ranking')} label="ranking por centro" />
          </div>
          {blocoAberto('ranking') && (
            <>
              {ranking.length === 0 && <p style={styles.vazio}>Nenhum dado encontrado.</p>}
              <div className="finance-report-ranking-grid" style={styles.rankingGrid}>
                {ranking.map((item, index) => (
                  <div className="print-card" key={item.id} style={styles.cardRanking}>
                    <div style={styles.cardLinha}>
                      <div>
                        <strong>{index + 1}. {item.nome}{item.id === 'sem-centro' ? ' ⚠️' : ''}</strong>
                        {index === 0 && <small style={styles.maiorCusto}>🔝 Maior custo</small>}
                        <small>{formatarPercentual(item.percentual)} do total</small>
                      </div>
                      <strong>{formatarValor(item.total)}</strong>
                    </div>
                    <Progress value={Math.max(maiorValor ? (item.total / maiorValor) * 100 : 0, 4)} color={corPorPercentual(item.percentual)} />
                    <div style={styles.grid3Compacto}>
                      <small>Realizado: {formatarValor(item.pago)}</small>
                      <small>Pend: {formatarValor(item.pendente)}</small>
                      <small>Venc: {formatarValor(item.vencido)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {filtroCentro && (
        <section className="finance-report-list-section" style={styles.bloco}>
          <div className="finance-report-section-head">
            <div>
              <span className="finance-report-kicker">Centro selecionado</span>
              <h2 style={styles.subtitulo}>📊 Resumo do Centro</h2>
            </div>
            <BlockToggle aberto={blocoAberto('ranking')} onClick={() => alternarBloco('ranking')} label="resumo do centro" />
          </div>
          {blocoAberto('ranking') && (
            <div className="print-card" style={styles.cardRanking}>
              <div style={styles.cardLinha}><strong>{centroSelecionado?.nome || 'Centro selecionado'}</strong><strong>{formatarValor(totalGeral)}</strong></div>
              <div style={styles.grid3Compacto}><small>Realizado: {formatarValor(totalPago)}</small><small>Pend: {formatarValor(totalPendente)}</small><small>Venc: {formatarValor(totalVencido)}</small></div>
            </div>
          )}
        </section>
      )}

      <section className="finance-report-list-section finance-report-accounts-section" style={styles.bloco}>
        <div className="finance-report-section-head">
          <div>
            <span className="finance-report-kicker">Detalhamento</span>
            <h2 style={styles.subtitulo}>📄 Contas do relatório</h2>
            <p style={styles.muted}>{contasFiltradas.length} conta(s) no recorte atual</p>
          </div>
          <div className="finance-report-head-actions">
            <span style={styles.badge}>{Math.min(limiteContasRelatorio, contasFiltradas.length)} de {contasFiltradas.length}</span>
            <BlockToggle aberto={blocoAberto('contas')} onClick={() => alternarBloco('contas')} label="contas do relatório" />
          </div>
        </div>
        {blocoAberto('contas') && (
          <>
            <div className="finance-report-accounts-grid" style={styles.contasGrid}>
              {contasRelatorioVisiveis.map((conta) => {
                const realizado = valorRealizadoConta(conta)
                const ajuste = encargosConta(conta) > 0
                  ? ` • Encargos: ${formatarValor(encargosConta(conta))}`
                  : descontoConta(conta) > 0
                    ? ` • Desconto: ${formatarValor(descontoConta(conta))}`
                    : ''

                return (
                  <div className="print-card" key={conta.id} style={styles.cardConta}>
                    <div style={styles.cardLinha}><strong>{conta.descricao}</strong><span>{formatarValor(valorPrevistoConta(conta))}</span></div>
                    <small>
                      {conta.status === 'pago' ? `Realizado: ${formatarValor(realizado)} • ` : ''}
                      {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'} • {estaVencida(conta.data_vencimento, conta.status) ? 'VENCIDO' : conta.status}{ajuste}
                    </small>
                  </div>
                )
              })}
            </div>
            {contasFiltradas.length === 0 && <p style={styles.vazio}>Nenhuma conta encontrada.</p>}
            {contasFiltradas.length > 10 && (
              <div className="finance-report-list-actions">
                {!exibindoTodasContasRelatorio && (
                  <button type="button" onClick={() => setLimiteContasRelatorio((limite) => Math.min(limite + 10, contasFiltradas.length))}>
                    Carregar mais 10
                  </button>
                )}
                {!exibindoTodasContasRelatorio && (
                  <button type="button" onClick={() => setLimiteContasRelatorio(contasFiltradas.length)}>
                    Ver todos
                  </button>
                )}
                {limiteContasRelatorio > 10 && (
                  <button type="button" onClick={() => setLimiteContasRelatorio(10)}>
                    Recolher
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
        </>
      )}
    </div>
  )
}


function RelatorioSkeleton() {
  return (
    <div style={styles.skeletonArea} aria-busy="true" aria-label="Carregando relatório">
      <section style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((item) => <div key={item} style={styles.skeletonCard} />)}
      </section>
      <section style={styles.skeletonPanel}>
        <div style={styles.skeletonLineGrande} />
        <div style={styles.skeletonLine} />
        <div style={styles.skeletonLineCurta} />
      </section>
      <section style={styles.skeletonGrid}> 
        {[1, 2].map((item) => <div key={item} style={styles.skeletonCardAlto} />)}
      </section>
    </div>
  )
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function Widget({ titulo, emoji, badge, badgeColor = '#0d9488', children, destaque }) {
  return (
    <section className={`print-card finance-report-widget ${destaque ? 'finance-report-widget-featured' : ''}`} style={destaque ? { ...styles.card, ...styles.cardDestaque } : styles.card}>
      <div className="finance-report-widget-head" style={styles.widgetHeader}>
        <strong>{emoji} {titulo}</strong>
        {badge && <span style={{ ...styles.badge, color: badgeColor, borderColor: badgeColor }}>{badge}</span>}
      </div>
      {children}
    </section>
  )
}

function BlockToggle({ aberto, onClick, label }) {
  return (
    <button
      type="button"
      className="finance-report-toggle"
      aria-label={`${aberto ? 'Recolher' : 'Expandir'} ${label}`}
      onClick={onClick}
    >
      {aberto ? '−' : '+'}
    </button>
  )
}

function KpiCard({ titulo, valor, detalhe, emoji, cor, progresso }) {
  return (
    <section className="print-card" style={styles.kpiCard}>
      <div style={styles.kpiIcon}>{emoji}</div>
      <span style={styles.kpiTitulo}>{titulo}</span>
      <strong style={styles.kpiValor}>{valor}</strong>
      <small style={styles.muted}>{detalhe}</small>
      <Progress value={Math.min(Math.max(progresso || 0, 0), 100)} color={cor} />
    </section>
  )
}

function ExecutiveKpiCard({ titulo, valor, detalhe, tom }) {
  return (
    <section className="executive-kpi-card print-card finance-report-kpi-card" style={{ ...styles.executiveKpiCard, borderLeftColor: tom }}>
      <small style={styles.executiveKpiLabel}>{titulo}</small>
      <strong style={styles.executiveKpiValue}>{valor}</strong>
      <span style={styles.executiveKpiDetail}>{detalhe}</span>
    </section>
  )
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="finance-report-mini-stat" style={styles.miniStat}>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub && <span>{sub}</span>}
    </div>
  )
}

function Progress({ value, color }) {
  return (
    <div className="finance-report-progress" style={styles.barraFundo}>
      <div style={{ ...styles.barraValor, width: `${Math.min(Math.max(value || 0, 3), 100)}%`, background: color }} />
    </div>
  )
}


const cssAntiFlicker = `
  /* Ajuste visual para evitar piscadas nas transições da página de relatórios. */
  .relatorios-page,
  .relatorios-page *,
  .relatorios-page > section,
  .relatorios-page > header {
    animation: none !important;
    animation-delay: 0s !important;
    transition-property: background-color, border-color, color, box-shadow !important;
    filter: none !important;
  }

  .relatorios-page > section,
  .relatorios-page > header {
    opacity: 1 !important;
    transform: none !important;
    will-change: auto !important;
  }

  .relatorios-page .relatorio-sticky-filtros {
    position: relative !important;
    top: auto !important;
    z-index: 1 !important;
    transform: none !important;
    backface-visibility: visible !important;
    contain: layout paint !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .relatorios-page,
    .relatorios-page * {
      scroll-behavior: auto !important;
      animation: none !important;
      transition: none !important;
    }
  }
`

const cssPrint = `
  .relatorio-print-header, .relatorio-print-footer { display: none; }
  @media (max-width: 900px) {
    .relatorios-page { padding: 12px !important; }
    .executive-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }
    .executive-kpi-card { min-height: 0 !important; padding: 10px !important; border-radius: 14px !important; }
    .executive-kpi-card strong { font-size: 15px !important; line-height: 1.15 !important; }
  }
  @media print {
    html, body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .relatorios-page { background: #fff !important; padding: 0 !important; color: #111 !important; max-width: none !important; font-size: 11px !important; }
    .relatorios-page h1 { font-size: 20px !important; margin: 0 0 4px 0 !important; }
    .relatorios-page h2 { font-size: 15px !important; margin: 14px 0 8px 0 !important; }
    .relatorios-page p { margin: 4px 0 !important; line-height: 1.35 !important; }
    .relatorio-print-header { display: block !important; text-align: center; border-bottom: 1px solid #ddd; margin-bottom: 12px; padding-bottom: 8px; }
    .relatorio-print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 5px; background: #fff; }
    .relatorio-print-footer::after { content: " • Página " counter(page); }
    .print-card { page-break-inside: avoid; break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; margin-bottom: 8px !important; padding: 8px !important; }
    section { page-break-inside: avoid; break-inside: avoid; }
    @page { size: A4; margin: 10mm 10mm 16mm 10mm; }
  }
`

const styles = {
  page: {
    padding: 20,
    maxWidth: 1180,
    margin: 'auto',
    fontFamily: 'Inter, Arial, sans-serif',
    background: 'linear-gradient(180deg, #f8fbfb 0%, #eef7f5 100%)',
    minHeight: '100vh',
    paddingBottom: 90,
    color: '#0f172a'
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap'
  },
  actionsTop: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  titulo: { fontSize: 30, margin: 0 },
  descricaoTela: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 },
  heroBadge: {
    minWidth: 130,
    background: '#fff',
    border: '1px solid #dbeafe',
    borderRadius: 20,
    padding: 16,
    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3
  },
  subtitulo: { fontSize: 22, marginBottom: 12 },
  bloco: { marginTop: 20 },
  filtrosBox: {
    ...cardBase(),
    position: 'relative',
    top: 'auto',
    zIndex: 1,
    border: '1px solid #e2e8f0',
    marginBottom: 12,
    padding: 12,
    boxShadow: '0 8px 22px rgba(15,23,42,0.05)',
    background: 'rgba(255,255,255,0.92)'
  },
  filtroHeader: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10, marginBottom: 8 },
  filtroResumo: { color: '#64748b', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  filtrosGrid: { display: 'grid', gridTemplateColumns: '1.05fr 1.2fr 1.2fr 0.9fr 0.9fr', gap: 8, alignItems: 'center' },
  input: { width: '100%', padding: '9px 11px', borderRadius: 11, border: '1px solid #d1d5db', boxSizing: 'border-box', background: '#fff', minHeight: 38, fontWeight: 700, color: '#0f172a' },
  filtros: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 },
  filtro: { border: '1px solid #d1d5db', background: '#fff', padding: '7px 12px', borderRadius: 999, fontWeight: 800, color: '#334155' },
  filtroAtivo: { border: '1px solid #0d9488', background: '#0d9488', color: '#fff', padding: '7px 12px', borderRadius: 999, fontWeight: 800 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 16 },
  executiveKpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, marginBottom: 16 },
  executiveKpiCard: { background: '#fff', border: '1px solid rgba(226,232,240,0.9)', borderLeft: '4px solid #0d9488', borderRadius: 16, padding: 12, minHeight: 92, boxShadow: '0 8px 20px rgba(15,23,42,0.05)', display: 'grid', alignContent: 'start', gap: 4, minWidth: 0 },
  executiveKpiLabel: { color: '#64748b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1.1 },
  executiveKpiValue: { color: '#0f172a', fontSize: 18, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  executiveKpiDetail: { color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.2 },
  kpiCard: { ...cardBase(), minHeight: 130 },
  kpiIcon: { width: 38, height: 38, borderRadius: 14, background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: 20, marginBottom: 8 },
  kpiTitulo: { color: '#64748b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValor: { display: 'block', fontSize: 22, marginTop: 4, marginBottom: 4 },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 14 },
  advancedPanel: { ...cardBase(), marginBottom: 16, border: '1px solid #bfdbfe', background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' },
  advancedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14 },
  dreLinha: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, padding: '12px 0', borderBottom: '1px solid #eef2f7', alignItems: 'center' },
  dreTexto: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  dreTitulo: { fontSize: 16, lineHeight: 1.2 },
  dreDescricao: { color: '#64748b', fontSize: 13, lineHeight: 1.25, display: 'block' },
  dreValor: { fontSize: 16, whiteSpace: 'nowrap', textAlign: 'right' },
  chartBox: { width: '100%', height: 250, minWidth: 0 },
  twoColumns: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14, marginBottom: 14 },
  card: cardBase(),
  cardDestaque: { background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)', border: '1px solid #ccfbf1' },
  cardAlerta: { ...cardBase(), background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  cardMeta: { ...cardBase(), border: '1px solid #fef3c7' },
  predictivePanel: { ...cardBase(), marginBottom: 16, border: '1px solid #ddd6fe', background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' },
  predictiveGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 8 },
  metaForecastBox: { marginTop: 12, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: 4 },
  widgetHeader: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  executivoTexto: { fontSize: 16, lineHeight: 1.5, margin: '6px 0 12px 0' },
  miniStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 },
  miniStat: { background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 14, padding: 10, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  grid3Compacto: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 10 },
  compareGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 },
  badge: { border: '1px solid', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 800, background: '#fff' },
  barraFundo: { height: 9, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', margin: '10px 0' },
  barraValor: { height: '100%', borderRadius: 99 },
  insightList: { display: 'grid', gap: 8 },
  insightItem: { display: 'grid', gridTemplateColumns: '30px 1fr', gap: 8, alignItems: 'flex-start', background: '#f8fafc', borderRadius: 14, padding: 10, fontSize: 14 },
  insightEmoji: { width: 30, height: 30, borderRadius: 12, background: '#fff', display: 'grid', placeItems: 'center' },
  itemGrafico: { marginTop: 10 },
  topItem: { display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eef2f7' },
  medalha: { width: 30, height: 30, borderRadius: 999, background: '#eef2ff', color: '#3730a3', display: 'grid', placeItems: 'center', fontWeight: 800 },
  topText: { display: 'flex', flexDirection: 'column', gap: 2 },
  rankingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 },
  cardRanking: cardBase(),
  contasGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 },
  cardConta: cardBase(),
  cardLinha: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' },
  maiorCusto: { display: 'block', color: '#12b886', fontWeight: 'bold', fontSize: 12 },
  alertaTexto: { color: '#dc3545', fontWeight: 'bold' },
  vazio: { opacity: 0.7, fontSize: 14 },
  skeletonArea: { display: 'grid', gap: 14, marginTop: 12 },
  skeletonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 },
  skeletonCard: { height: 130, borderRadius: 20, border: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)' },
  skeletonCardAlto: { height: 250, borderRadius: 20, border: '1px solid #e2e8f0', background: 'linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)' },
  skeletonPanel: { ...cardBase(), display: 'grid', gap: 12 },
  skeletonLineGrande: { height: 22, width: '55%', borderRadius: 999, background: '#e2e8f0' },
  skeletonLine: { height: 14, width: '80%', borderRadius: 999, background: '#e2e8f0' },
  skeletonLineCurta: { height: 14, width: '35%', borderRadius: 999, background: '#e2e8f0' },
  muted: { color: '#64748b', lineHeight: 1.45 },
  btnVoltar: btn('#64748b'),
  btnExcel: btn('#16a34a'),
  btnPDF: btn('#7c3aed'),
  btnCSV: btn('#0d9488'),
  btnLimpar: { ...btn('#64748b'), padding: '7px 10px' },
  btnAcao: btn('#dc3545')
}

function cardBase() {
  return {
    background: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 0,
    boxShadow: '0 12px 30px rgba(15,23,42,0.07)',
    border: '1px solid rgba(226,232,240,0.9)'
  }
}

function btn(background) {
  return {
    background,
    color: '#fff',
    border: 'none',
    padding: '9px 13px',
    borderRadius: 12,
    fontWeight: 800,
    cursor: 'pointer'
  }
}
