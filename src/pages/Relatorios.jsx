import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import { money as formatarValor, dateBR as formatarData } from '../utils/format'

export default function Relatorios({ voltar, empresaId, mostrarAviso }) {
  function formatarPercentual(valor) {
    return `${Number(valor || 0).toFixed(1)}%`
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)
    return vencimento < hoje
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
  const [centros, setCentros] = useState([])
  const [filiais, setFiliais] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(mesAtualPadrao())
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [visaoExecutiva, setVisaoExecutiva] = useState('dre')
  const [metaMensal, setMetaMensal] = useState('')

  useEffect(() => {
    buscarDados()
  }, [empresaId])

  async function buscarDados() {
    if (!empresaId) {
      setContas([])
      setCentros([])
      setFiliais([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: contasData, error: contasError } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)')
      .eq('empresa_id', empresaId)
      .order('data_vencimento', { ascending: true })

    const { data: centrosData, error: centrosError } = await supabase
      .from('df_centros_custo')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    const { data: filiaisData, error: filiaisError } = await supabase
      .from('df_filiais')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    if (contasError) mostrarAviso?.(contasError.message, 'erro')
    if (centrosError) mostrarAviso?.(centrosError.message, 'erro')
    if (filiaisError) mostrarAviso?.(filiaisError.message, 'erro')

    setContas(contasData || [])
    setCentros(centrosData || [])
    setFiliais(filiaisData || [])
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
    const mesBase = filtroMes ? mesAnterior(filtroMes) : mesAnterior(mesAtualPadrao())
    return contas
      .filter((conta) => pegarMes(conta.data_vencimento) === mesBase)
      .filter((conta) => {
        if (!filtroCentro) return true
        return conta.centro_custo_id === filtroCentro
      })
      .filter((conta) => {
        if (!filtroFilial) return true
        return conta.filial_id === filtroFilial
      })
  }, [contas, filtroMes, filtroCentro, filtroFilial])

  const totalGeral = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalPago = contasFiltradas.filter((conta) => conta.status === 'pago').reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalVencido = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalPendente = totalGeral - totalPago
  const totalMesAnterior = contasMesAnterior.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const diferencaMes = totalGeral - totalMesAnterior
  const percentualMes = totalMesAnterior ? (diferencaMes / totalMesAnterior) * 100 : 0
  const previsaoProximoMes = totalMesAnterior ? Math.max(totalGeral + diferencaMes, 0) : totalGeral
  const meta = Number(String(metaMensal || '').replace(',', '.'))
  const metaValida = !isNaN(meta) && meta > 0
  const percentualMeta = metaValida ? (totalGeral / meta) * 100 : 0
  const taxaPago = totalGeral ? (totalPago / totalGeral) * 100 : 0
  const taxaVencido = totalGeral ? (totalVencido / totalGeral) * 100 : 0

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
      const total = lista.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const pago = lista.filter((conta) => conta.status === 'pago').reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const vencido = lista.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      return {
        id: centroId,
        nome: centro?.nome || 'Sem centro',
        total,
        pago,
        pendente: total - pago,
        vencido,
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
    contas.forEach((conta) => {
      if (filtroCentro && conta.centro_custo_id !== filtroCentro) return
      if (filtroFilial && conta.filial_id !== filtroFilial) return
      const mes = pegarMes(conta.data_vencimento)
      if (!mes) return
      if (!mapa[mes]) mapa[mes] = { mes, total: 0, pago: 0, pendente: 0, vencido: 0 }
      const valor = Number(conta.valor || 0)
      mapa[mes].total += valor
      if (conta.status === 'pago') mapa[mes].pago += valor
      else mapa[mes].pendente += valor
      if (estaVencida(conta.data_vencimento, conta.status)) mapa[mes].vencido += valor
    })
    return Object.values(mapa).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6)
  }, [contas, filtroCentro, filtroFilial])

  const rankingFiliais = useMemo(() => {
    const mapa = {}
    contasFiltradas.forEach((conta) => {
      const chave = conta.filial_id || 'sem-filial'
      const nome = conta.df_filiais?.nome || 'Sem filial'
      if (!mapa[chave]) mapa[chave] = { id: chave, nome, total: 0, pago: 0, pendente: 0, vencido: 0, qtd: 0 }
      const valor = Number(conta.valor || 0)
      mapa[chave].total += valor
      mapa[chave].qtd += 1
      if (conta.status === 'pago') mapa[chave].pago += valor
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
      { linha: 'Risco vencido', valor: risco, descricao: 'Parte atrasada que exige ação' },
      { linha: 'Previsão próximo mês', valor: provisao, descricao: 'Tendência gerencial simples' },
      { linha: 'Eficiência', valor: eficiencia, descricao: 'Quanto menor o vencido, melhor', percentual: true }
    ]
  }, [totalPago, totalPendente, totalVencido, previsaoProximoMes, totalGeral, taxaVencido])

  const chartStatus = useMemo(() => ([
    { name: 'Pago', value: totalPago, color: '#12b886' },
    { name: 'Pendente', value: Math.max(totalPendente - totalVencido, 0), color: '#f59f00' },
    { name: 'Vencido', value: totalVencido, color: '#dc3545' }
  ].filter((item) => item.value > 0)), [totalPago, totalPendente, totalVencido])

  const chartCentros = useMemo(() => ranking.slice(0, 6).map((item) => ({ nome: item.nome.length > 14 ? `${item.nome.slice(0, 14)}…` : item.nome, total: Number(item.total.toFixed(2)) })), [ranking])

  function imprimirPDF() {
    window.print()
  }

  function exportarCSV() {
    const cabecalho = ['Descricao', 'Valor', 'Vencimento', 'Status', 'Centro']
    const linhas = contasFiltradas.map((conta) => [
      conta.descricao,
      Number(conta.valor || 0).toFixed(2).replace('.', ','),
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
      conta.df_centros_custo?.nome || 'Sem centro'
    ])
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo || '').replaceAll('"', '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-financeiro.csv'
    link.click()
    URL.revokeObjectURL(url)
  }


  function exportarExcel() {
    const linhasResumo = [
      ['Relatório Avançado 11.1 - Dona Flor Financeiro'],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      ['Mês', filtroMes || 'Todos'],
      ['Centro', filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'],
      ['Filial', filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'],
      [],
      ['Indicador', 'Valor'],
      ['Total', totalGeral],
      ['Pago', totalPago],
      ['Pendente', totalPendente],
      ['Vencido', totalVencido],
      ['Score financeiro', scoreSaude]
    ]
    const linhasDre = [[''], ['DRE Gerencial'], ['Linha', 'Valor', 'Descrição'], ...dreGerencial.map((linha) => [linha.linha, linha.percentual ? `${formatarPercentual(linha.valor)}` : linha.valor, linha.descricao])]
    const linhasContas = [[''], ['Contas'], ['Descrição', 'Valor', 'Vencimento', 'Status', 'Centro', 'Filial', 'Recorrência'], ...contasFiltradas.map((conta) => [
      conta.descricao,
      Number(conta.valor || 0),
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
      conta.df_centros_custo?.nome || 'Sem centro',
      conta.df_filiais?.nome || 'Sem filial',
      conta.df_contas_recorrentes?.tipo_recorrencia || 'Não recorrente'
    ])]
    const todas = [...linhasResumo, ...linhasDre, ...linhasContas]
    const html = `<html><head><meta charset="UTF-8"></head><body><table>${todas.map((linha) => `<tr>${linha.map((campo) => `<td>${String(campo ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`).join('')}</tr>`).join('')}</table></body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-avancado-dona-flor.xls'
    link.click()
    URL.revokeObjectURL(url)
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

  return (
    <div className="relatorios-page" style={styles.page}>
      <style>{cssPrint}</style>
      <style>{cssAntiFlicker}</style>

      <div className="relatorio-print-header">
        <h1>Relatório Financeiro Gerencial</h1>
        <p>Empresa: Dona Flor</p>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        <p>Centro: {filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} • Filial: {filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'} • Mês: {filtroMes || 'Todos'} • Status: {filtroStatus}</p>
      </div>
      <div className="relatorio-print-footer">Relatório gerado pelo Sistema Dona Flor Financeiro</div>

      <header className="no-print" style={styles.hero}>
        <div>
          <div style={styles.actionsTop}>
            <button style={styles.btnVoltar} onClick={voltar}>← Voltar</button>
            <button style={styles.btnExcel} onClick={exportarExcel}>Excel</button>
            <button style={styles.btnPDF} onClick={imprimirPDF}>PDF</button>
            <button style={styles.btnCSV} onClick={exportarCSV}>CSV</button>
          </div>
          <h1 style={styles.titulo}>📊 Relatórios Gerenciais</h1>
          <p style={styles.descricaoTela}>Fase 11.1: relatórios avançados com DRE gerencial, gráficos, Excel e leitura executiva.</p>
        </div>
        <div style={styles.heroBadge}>
          <span>{statusSaude.emoji}</span>
          <strong>{scoreSaude}/100</strong>
          <small>{statusSaude.etiqueta}</small>
        </div>
      </header>

      <section className="no-print relatorio-sticky-filtros" style={styles.filtrosBox}>
        <div style={styles.filtroHeader}>
          <strong>🎛️ Filtros</strong>
          <span style={styles.filtroResumo}>{nomeMes(filtroMes || mesAtualPadrao())} • {filtroCentro ? centroSelecionado?.nome || 'Centro selecionado' : 'Todos os centros'} • {filtroFilial ? filiais.find((filial) => filial.id === filtroFilial)?.nome || 'Filial selecionada' : 'Todas as filiais'}</span>
          <button style={styles.btnLimpar} onClick={limparFiltros}>Limpar</button>
        </div>
        <div style={styles.filtrosGrid}>
          <input style={styles.input} placeholder="Meta mensal. Ex: 5000" value={metaMensal} onChange={(e) => setMetaMensal(e.target.value)} />
          <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
            <option value="">Todos os centros</option>
            {centros.map((centro) => <option key={centro.id} value={centro.id}>{centro.nome}</option>)}
          </select>
          <select style={styles.input} value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
            <option value="">Todas as filiais</option>
            {filiais.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
          </select>
          <select style={styles.input} value={visaoExecutiva} onChange={(e) => setVisaoExecutiva(e.target.value)}>
            <option value="dre">Visão DRE</option>
            <option value="graficos">Visão Gráficos</option>
            <option value="filiais">Visão Filiais</option>
          </select>
          <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
        </div>
        <div style={styles.filtros}>
          {[
            ['todas', 'Todas'],
            ['pendentes', 'Pendentes'],
            ['pagas', 'Pagas'],
            ['vencidas', 'Vencidas']
          ].map(([valor, label]) => (
            <button key={valor} style={filtroStatus === valor ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus(valor)}>{label}</button>
          ))}
        </div>
      </section>

      {loading && <section style={styles.card}><strong>Carregando relatório...</strong></section>}

      <section style={styles.kpiGrid}>
        <KpiCard titulo="Total" valor={formatarValor(totalGeral)} detalhe={`${contasFiltradas.length} conta(s)`} emoji="💼" cor="#364fc7" progresso={100} />
        <KpiCard titulo="Pago" valor={formatarValor(totalPago)} detalhe={`${formatarPercentual(taxaPago)} do total`} emoji="✅" cor="#12b886" progresso={taxaPago} />
        <KpiCard titulo="Pendente" valor={formatarValor(totalPendente)} detalhe={totalGeral ? `${formatarPercentual((totalPendente / totalGeral) * 100)} das despesas` : 'Sem pendência'} emoji="🟡" cor="#f59f00" progresso={totalGeral ? (totalPendente / totalGeral) * 100 : 0} />
        <KpiCard titulo="Vencido" valor={formatarValor(totalVencido)} detalhe={totalVencido > 0 ? `${formatarPercentual(taxaVencido)} em atraso` : 'Sem vencidos'} emoji="🚨" cor="#dc3545" progresso={taxaVencido} />
      </section>

      <section style={styles.advancedPanel}>
        <div style={styles.widgetHeader}>
          <div>
            <strong>📈 Relatórios Avançados 11.1</strong>
            <p style={styles.muted}>DRE gerencial, gráficos executivos, tendência e leitura multiunidade.</p>
          </div>
          <span style={styles.badge}>Enterprise</span>
        </div>

        {visaoExecutiva === 'dre' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="DRE gerencial" emoji="🧮">
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
            <Widget titulo="Tendência 6 meses" emoji="📉">
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

        {visaoExecutiva === 'graficos' && (
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

        {visaoExecutiva === 'filiais' && (
          <div style={styles.advancedGrid}>
            <Widget titulo="Ranking multiunidade" emoji="🏢">
              {rankingFiliais.length === 0 && <p style={styles.vazio}>Nenhuma filial encontrada nos filtros.</p>}
              {rankingFiliais.map((filial, index) => (
                <div key={filial.id} style={styles.dreLinha}>
                  <div><strong>{index + 1}. {filial.nome}</strong><small>{filial.qtd} conta(s) • {formatarPercentual(filial.percentual)}</small></div>
                  <strong>{formatarValor(filial.total)}</strong>
                </div>
              ))}
            </Widget>
            <Widget titulo="Insight executivo" emoji="🧠">
              <p style={styles.executivoTexto}>{rankingFiliais[0] ? `${rankingFiliais[0].nome} concentra ${formatarPercentual(rankingFiliais[0].percentual)} do total filtrado. Use esta leitura para comparar unidades e priorizar gestão.` : 'Sem dados multiunidade para o filtro atual.'}</p>
              <div style={styles.grid3Compacto}>
                <MiniStat label="Filiais" value={rankingFiliais.length} />
                <MiniStat label="Maior unidade" value={rankingFiliais[0]?.nome || '-'} />
                <MiniStat label="Valor" value={rankingFiliais[0] ? formatarValor(rankingFiliais[0].total) : '-'} />
              </div>
            </Widget>
          </div>
        )}
      </section>

      <section style={styles.dashboardGrid}>
        <Widget titulo="Resumo executivo" emoji="📌" destaque>
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
      </section>

      {mostrarAcaoPrioritaria && (
        <section className="print-card" style={styles.cardAlerta}>
          <div>
            <strong>🚨 Ação prioritária</strong>
            <p>{formatarPercentual(semCentro.percentual)} das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise.</p>
          </div>
          <button className="no-print" style={styles.btnAcao} onClick={voltar}>Ir para contas</button>
        </section>
      )}

      {metaValida && (
        <section className="print-card" style={styles.cardMeta}>
          <div style={styles.widgetHeader}><strong>🎯 Meta mensal</strong><span style={styles.badge}>{formatarPercentual(percentualMeta)}</span></div>
          <p>Meta: {formatarValor(meta)} • Atual: {formatarValor(totalGeral)}</p>
          <Progress value={Math.min(percentualMeta, 100)} color={percentualMeta > 100 ? '#dc3545' : percentualMeta >= 80 ? '#f59f00' : '#12b886'} />
        </section>
      )}

      <section style={styles.twoColumns}>
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
      </section>

      <section style={styles.twoColumns}>
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
      </section>

      {!filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>🏆 Ranking por Centro</h2>
          {ranking.length === 0 && <p style={styles.vazio}>Nenhum dado encontrado.</p>}
          <div style={styles.rankingGrid}>
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
                  <small>Pago: {formatarValor(item.pago)}</small>
                  <small>Pend: {formatarValor(item.pendente)}</small>
                  <small>Venc: {formatarValor(item.vencido)}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>📊 Resumo do Centro</h2>
          <div className="print-card" style={styles.cardRanking}>
            <div style={styles.cardLinha}><strong>{centroSelecionado?.nome || 'Centro selecionado'}</strong><strong>{formatarValor(totalGeral)}</strong></div>
            <div style={styles.grid3Compacto}><small>Pago: {formatarValor(totalPago)}</small><small>Pend: {formatarValor(totalPendente)}</small><small>Venc: {formatarValor(totalVencido)}</small></div>
          </div>
        </section>
      )}

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📄 Contas do relatório</h2>
        <div style={styles.contasGrid}>
          {contasFiltradas.map((conta) => (
            <div className="print-card" key={conta.id} style={styles.cardConta}>
              <div style={styles.cardLinha}><strong>{conta.descricao}</strong><span>{formatarValor(conta.valor)}</span></div>
              <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'} • {estaVencida(conta.data_vencimento, conta.status) ? 'VENCIDO' : conta.status}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Widget({ titulo, emoji, badge, badgeColor = '#0d9488', children, destaque }) {
  return (
    <section className="print-card" style={destaque ? { ...styles.card, ...styles.cardDestaque } : styles.card}>
      <div style={styles.widgetHeader}>
        <strong>{emoji} {titulo}</strong>
        {badge && <span style={{ ...styles.badge, color: badgeColor, borderColor: badgeColor }}>{badge}</span>}
      </div>
      {children}
    </section>
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

function MiniStat({ label, value, sub }) {
  return (
    <div style={styles.miniStat}>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub && <span>{sub}</span>}
    </div>
  )
}

function Progress({ value, color }) {
  return (
    <div style={styles.barraFundo}>
      <div style={{ ...styles.barraValor, width: `${Math.min(Math.max(value || 0, 3), 100)}%`, background: color }} />
    </div>
  )
}


const cssAntiFlicker = `
  /* FASE 11.0D — Anti Flicker real
     O pisca-pisca vinha das animações globais herdadas da Fase 7.7
     aplicadas em .relatorios-page > section a cada entrada na rota. */
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
