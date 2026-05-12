import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { money as formatarValor, dateBR as formatarData } from '../utils/format'

export default function Relatorios({ voltar, empresaId, mostrarAviso }) {
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
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
    if (percentual >= 20) return '#ffc107'
    return '#198754'
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

  // =========================
  // BLOCO 1 — STATES
  // =========================
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroMes, setFiltroMes] = useState(mesAtualPadrao())
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [metaMensal, setMetaMensal] = useState('')

  useEffect(() => {
    buscarDados()
  }, [empresaId])

  // =========================
  // BLOCO 2 — BUSCAS
  // =========================
  async function buscarDados() {
    if (!empresaId) {
      setContas([])
      setCentros([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: contasData, error: contasError } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('empresa_id', empresaId)
      .order('data_vencimento', { ascending: true })

    const { data: centrosData, error: centrosError } = await supabase
      .from('df_centros_custo')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    if (contasError) mostrarAviso?.(contasError.message, 'erro')
    if (centrosError) mostrarAviso?.(centrosError.message, 'erro')

    setContas(contasData || [])
    setCentros(centrosData || [])
    setLoading(false)
  }

  // =========================
  // BLOCO 3 — FILTROS
  // =========================
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
  }, [contas, filtroMes, filtroStatus, filtroCentro])

  const contasMesAnterior = useMemo(() => {
    const mesBase = filtroMes ? mesAnterior(filtroMes) : mesAnterior(mesAtualPadrao())

    return contas
      .filter((conta) => pegarMes(conta.data_vencimento) === mesBase)
      .filter((conta) => {
        if (!filtroCentro) return true
        return conta.centro_custo_id === filtroCentro
      })
  }, [contas, filtroMes, filtroCentro])

  // =========================
  // BLOCO 4 — CÁLCULOS GERAIS
  // =========================
  const totalGeral = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalVencido = contasFiltradas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPendente = totalGeral - totalPago
  const totalMesAnterior = contasMesAnterior.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const diferencaMes = totalGeral - totalMesAnterior

  const percentualMes = totalMesAnterior
    ? (diferencaMes / totalMesAnterior) * 100
    : 0

  const previsaoProximoMes = totalMesAnterior
    ? Math.max(totalGeral + diferencaMes, 0)
    : totalGeral

  const meta = Number(String(metaMensal || '').replace(',', '.'))
  const metaValida = !isNaN(meta) && meta > 0
  const percentualMeta = metaValida ? (totalGeral / meta) * 100 : 0

  // =========================
  // BLOCO 5 — RANKING E QUALIDADE DOS DADOS
  // =========================
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

      const pago = lista
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      const vencido = lista
        .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

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

  const topDespesas = [...contasFiltradas]
    .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))
    .slice(0, 3)

  // =========================
  // BLOCO 6 — SCORE PRO+
  // =========================
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
    etiqueta: '🟢 Saudável',
    emoji: '✅',
    cor: '#198754',
    descricao: 'Os indicadores estão equilibrados para o filtro atual.'
  }

  if (scoreSaude < 75 && scoreSaude >= 45) {
    statusSaude = {
      titulo: 'Saúde financeira em atenção',
      etiqueta: '🟡 Atenção',
      emoji: '⚠️',
      cor: '#ffc107',
      descricao: 'Existem pontos que merecem acompanhamento, principalmente concentração, variação mensal, meta e classificação dos custos.'
    }
  }

  if (scoreSaude < 45) {
    statusSaude = {
      titulo: 'Saúde financeira crítica',
      etiqueta: '🔴 Crítico',
      emoji: '🚨',
      cor: '#dc3545',
      descricao: 'Há sinais relevantes de risco. Priorize vencidos, metas estouradas, concentração e contas sem centro.'
    }
  }

  let qualidadeDados = {
    titulo: 'Qualidade dos dados boa',
    emoji: '✅',
    cor: '#198754',
    descricao: 'A maioria das contas está classificada por centro de custo.'
  }

  if (percentualClassificacao < 80 && percentualClassificacao >= 40) {
    qualidadeDados = {
      titulo: 'Qualidade dos dados em atenção',
      emoji: '⚠️',
      cor: '#ffc107',
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

  // =========================
  // BLOCO 7 — INSIGHTS PRO+
  // =========================
  const insights = []

  if (percentualClassificacao < 40 && contasFiltradas.length > 0) {
    insights.push({
      tipo: 'critico',
      texto: 'A análise gerencial está limitada porque a maior parte das despesas está sem centro de custo. Classifique os lançamentos antes de tomar decisões estratégicas.'
    })
  }

  if (metaValida) {
    if (percentualMeta > 100) {
      insights.push({
        tipo: 'meta',
        texto: `Meta mensal estourada: o total filtrado atingiu ${formatarPercentual(percentualMeta)} da meta de ${formatarValor(meta)}.`
      })
    } else if (percentualMeta >= 80) {
      insights.push({
        tipo: 'meta',
        texto: `Atenção à meta: você já consumiu ${formatarPercentual(percentualMeta)} da meta mensal.`
      })
    } else {
      insights.push({
        tipo: 'meta',
        texto: `Meta sob controle: consumo atual em ${formatarPercentual(percentualMeta)} da meta mensal.`
      })
    }
  }

  if (totalVencido > 0) {
    const qtd = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).length
    insights.push({
      tipo: 'risco',
      texto: `Contas vencidas detectadas: ${qtd} conta(s), somando ${formatarValor(totalVencido)}. Priorize pagamento para evitar juros.`
    })
  }

  if (!filtroCentro && principalCentro?.percentual >= 60 && principalCentro.id !== 'sem-centro') {
    insights.push({
      tipo: 'risco',
      texto: `Alto risco de concentração: ${principalCentro.nome} representa ${formatarPercentual(principalCentro.percentual)} dos custos filtrados.`
    })
  }

  if (filtroMes && totalGeral > 0) {
    if (totalMesAnterior === 0) {
      insights.push({
        tipo: 'previsao',
        texto: `${nomeMes(filtroMes)} tem ${formatarValor(totalGeral)} em contas. Ainda não há base anterior suficiente para tendência.`
      })
    } else if (diferencaMes > 0) {
      insights.push({
        tipo: 'alta',
        texto: `Crescimento de ${formatarValor(diferencaMes)} frente a ${nomeMes(mesAnterior(filtroMes))}, variação de ${formatarPercentual(percentualMes)}.`
      })
    } else if (diferencaMes < 0) {
      insights.push({
        tipo: 'queda',
        texto: `Redução de ${formatarValor(Math.abs(diferencaMes))} frente ao mês anterior, queda de ${formatarPercentual(Math.abs(percentualMes))}.`
      })
    }

    insights.push({
      tipo: 'previsao',
      texto: `Se o padrão continuar, o próximo mês pode fechar próximo de ${formatarValor(previsaoProximoMes)}.`
    })
  }

  if (insights.length === 0) {
    insights.push({
      tipo: 'info',
      texto: 'Nenhum alerta relevante encontrado para os filtros selecionados.'
    })
  }

  // =========================
  // BLOCO 8 — EXPORTAÇÃO
  // =========================
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

  function limparFiltros() {
    setFiltroMes('')
    setFiltroStatus('todas')
    setFiltroCentro('')
    setMetaMensal('')
  }

  // =========================
  // BLOCO 9 — UI
  // =========================
  return (
    <div className="relatorios-page" style={styles.page}>
      <style>
        {`
          .relatorio-print-header,
          .relatorio-print-footer {
            display: none;
          }

          @media print {
            html, body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .no-print {
              display: none !important;
            }

            .relatorios-page {
              background: #fff !important;
              padding: 0 !important;
              color: #111 !important;
              max-width: none !important;
              font-size: 11px !important;
            }

            .relatorios-page h1 {
              font-size: 20px !important;
              margin: 0 0 4px 0 !important;
            }

            .relatorios-page h2 {
              font-size: 15px !important;
              margin: 14px 0 8px 0 !important;
            }

            .relatorios-page p {
              margin: 4px 0 !important;
              line-height: 1.35 !important;
            }

            .relatorio-print-header {
              display: block !important;
              text-align: center;
              border-bottom: 1px solid #ddd;
              margin-bottom: 12px;
              padding-bottom: 8px;
            }

            .relatorio-print-header h1 {
              font-size: 18px !important;
              margin-bottom: 4px !important;
            }

            .relatorio-print-header p {
              font-size: 10px !important;
              color: #555 !important;
              margin: 2px 0 !important;
            }

            .relatorio-print-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 9px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 5px;
              background: #fff;
            }

            .relatorio-print-footer::after {
              content: " • Página " counter(page);
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd !important;
              margin-bottom: 8px !important;
              padding: 8px !important;
            }

            .print-keep {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            section {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            @page {
              size: A4;
              margin: 10mm 10mm 16mm 10mm;
            }
          }
        `}
      </style>

      <div className="relatorio-print-header">
        <h1>Relatório Financeiro Gerencial</h1>
        <p>Empresa: Dona Flor</p>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        <p>
          Centro: {filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} •
          Mês: {filtroMes || 'Todos'} •
          Status: {filtroStatus}
        </p>
      </div>

      <div className="relatorio-print-footer">
        Relatório gerado pelo Sistema Dona Flor Financeiro
      </div>

      <div className="no-print" style={styles.topo}>
        <button style={styles.btnVoltar} onClick={voltar}>← Voltar</button>
        <button style={styles.btnPDF} onClick={imprimirPDF}>PDF</button>
        <button style={styles.btnCSV} onClick={exportarCSV}>CSV</button>
      </div>

      <h1 style={styles.titulo}>📊 Relatórios PRO+</h1>
      <p style={styles.descricaoTela}>Painel gerencial com score, meta, previsão e alertas automáticos.</p>

      <section style={styles.resumo}>
        <div style={styles.boxTotal}>
          <span>Total</span>
          <strong>{formatarValor(totalGeral)}</strong>
        </div>

        <div style={styles.boxPago}>
          <span>Pago</span>
          <strong>{formatarValor(totalPago)}</strong>
        </div>

        <div style={styles.boxPendente}>
          <span>Pendente</span>
          <strong>{formatarValor(totalPendente)}</strong>
          {totalGeral > 0 && <small>{formatarPercentual((totalPendente / totalGeral) * 100)} das despesas</small>}
        </div>

        <div style={styles.boxVencido}>
          <span>Vencido</span>
          <strong>{formatarValor(totalVencido)}</strong>
        </div>
      </section>

      <section className="print-card" style={styles.cardExecutivo}>
        <strong>📌 Resumo executivo</strong>
        <p>
          {percentualClassificacao < 40
            ? 'A análise gerencial está limitada por falta de classificação em centros de custo.'
            : totalVencido > 0
              ? 'Existem pendências vencidas que devem ser priorizadas.'
              : metaValida && percentualMeta > 100
                ? 'A meta mensal foi ultrapassada no filtro atual.'
                : diferencaMes > 0
                  ? 'Os custos cresceram em relação ao mês anterior. Acompanhe os maiores centros.'
                  : 'O cenário atual está controlado para os filtros selecionados.'}
        </p>
      </section>

      <section className="print-card" style={styles.cardSaude}>
        <div style={styles.cardLinha}>
          <strong>{statusSaude.emoji} {statusSaude.titulo}</strong>
          <span style={{ ...styles.badge, color: statusSaude.cor, borderColor: statusSaude.cor }}>{statusSaude.etiqueta}</span>
        </div>
        <p>{statusSaude.descricao}</p>
        <div style={styles.barraFundo}>
          <div style={{ ...styles.barraValor, width: `${Math.max(scoreSaude, 4)}%`, background: statusSaude.cor }} />
        </div>
        <small>{scoreSaude}/100</small>
      </section>

      <section className="print-card" style={styles.cardQualidade}>
        <div style={styles.cardLinha}>
          <strong>{qualidadeDados.emoji} {qualidadeDados.titulo}</strong>
          <span style={{ ...styles.badge, color: qualidadeDados.cor, borderColor: qualidadeDados.cor }}>
            {formatarPercentual(percentualClassificacao)}
          </span>
        </div>
        <p>{qualidadeDados.descricao}</p>
        <div style={styles.grid3}>
          <div><strong>{contasFiltradas.length}</strong><small>Total</small></div>
          <div><strong>{contasComCentro}</strong><small>Com centro</small></div>
          <div><strong>{contasSemCentro}</strong><small>Sem centro</small></div>
        </div>
      </section>

      {mostrarAcaoPrioritaria && (
        <section className="print-card" style={styles.cardAlerta}>
          <strong>🚨 Ação prioritária</strong>
          <p>{formatarPercentual(semCentro.percentual)} das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise.</p>
          <button className="no-print" style={styles.btnAcao} onClick={voltar}>Ir para contas e classificar</button>
        </section>
      )}

      <section className="print-card" style={styles.cardComparativo}>
        <strong>📅 Comparativo mensal</strong>
        <div style={styles.grid2}>
          <div style={styles.caixaCinza}><span>Mês atual</span><strong>{formatarValor(totalGeral)}</strong><small>{nomeMes(filtroMes || mesAtualPadrao())}</small></div>
          <div style={styles.caixaCinza}><span>Mês anterior</span><strong>{formatarValor(totalMesAnterior)}</strong><small>{nomeMes(mesAnterior(filtroMes || mesAtualPadrao()))}</small></div>
          <div style={styles.caixaCinza}><span>Variação</span><strong>{diferencaMes > 0 ? '↑ +' : diferencaMes < 0 ? '↓ ' : ''}{formatarValor(diferencaMes)}</strong><small>{formatarPercentual(percentualMes)}</small></div>
          <div style={styles.caixaCinza}><span>Previsão</span><strong>{formatarValor(previsaoProximoMes)}</strong><small>próximo mês</small></div>
        </div>
      </section>

      <section className="no-print" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Meta mensal. Ex: 5000"
          value={metaMensal}
          onChange={(e) => setMetaMensal(e.target.value)}
        />

        <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
          <option value="">Todos os centros</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>{centro.nome}</option>
          ))}
        </select>

        <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />

        <div className="report-status-tabs" style={styles.filtros}>
          <button className={filtroStatus === 'todas' ? 'report-filter-active' : 'report-filter'} style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
          <button className={filtroStatus === 'pendentes' ? 'report-filter-active' : 'report-filter'} style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
          <button className={filtroStatus === 'pagas' ? 'report-filter-active' : 'report-filter'} style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
          <button className={filtroStatus === 'vencidas' ? 'report-filter-active' : 'report-filter'} style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
        </div>

        <button style={styles.btnLimpar} onClick={limparFiltros}>Limpar filtros</button>
      </section>

      {metaValida && (
        <section className="print-card" style={styles.cardMeta}>
          <strong>🎯 Meta mensal</strong>
          <p>Meta: {formatarValor(meta)} • Atual: {formatarValor(totalGeral)} • Uso: {formatarPercentual(percentualMeta)}</p>
          <div style={styles.barraFundo}>
            <div style={{ ...styles.barraValor, width: `${Math.min(percentualMeta, 100)}%`, background: percentualMeta > 100 ? '#dc3545' : percentualMeta >= 80 ? '#ffc107' : '#198754' }} />
          </div>
        </section>
      )}

      <section className="print-card" style={styles.cardInsights}>
        <strong>💡 Insights automáticos</strong>
        {insights.map((insight, index) => (
          <div key={index} style={styles.insightItem}>
            <span>{emojiInsight(insight.tipo)}</span>
            <p>{insight.texto}</p>
          </div>
        ))}
      </section>

      {!filtroCentro && ranking.length > 0 && (
        <section className="print-card" style={styles.cardGrafico}>
          <strong>📊 Distribuição por centro</strong>
          {ranking.slice(0, 5).map((item) => (
            <div key={item.id} style={styles.itemGrafico}>
              <div style={styles.cardLinha}><span>{item.nome}</span><strong>{formatarPercentual(item.percentual)}</strong></div>
              <div style={styles.barraFundo}>
                <div style={{ ...styles.barraValor, width: `${Math.max(item.percentual, 4)}%`, background: corPorPercentual(item.percentual) }} />
              </div>
              <small>{formatarValor(item.total)}</small>
              {item.id === 'sem-centro' && <small style={styles.alertaTexto}>⚠️ Classifique para análise real</small>}
            </div>
          ))}
        </section>
      )}

      {topDespesas.length > 0 && (
        <section className="print-card" style={styles.cardTop}>
          <strong>🔥 Top 3 despesas</strong>
          {topDespesas.map((conta, index) => (
            <div key={conta.id} style={styles.topItem}>
              <div>
                <strong>{index + 1}. {conta.descricao}</strong>
                <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}</small>
              </div>
              <strong>{formatarValor(conta.valor)}</strong>
            </div>
          ))}
        </section>
      )}

      <section style={styles.infoFiltro}>
        <strong>Resultado</strong>
        <span>{ranking.length} centro(s) • {contasFiltradas.length} conta(s)</span>
        <small>Centro: {filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} • Status: {filtroStatus} • Mês: {filtroMes || 'Todos'}</small>
        {principalCentro && <small>Centro dominante: {principalCentro.nome} ({formatarPercentual(principalCentro.percentual)})</small>}
      </section>

      {loading && <p>Carregando...</p>}

      {!filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>🏆 Ranking por Centro</h2>
          {ranking.length === 0 && <p style={styles.vazio}>Nenhum dado encontrado.</p>}
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
              <div style={styles.barraFundo}>
                <div style={{ ...styles.barraValor, width: `${Math.max(maiorValor ? (item.total / maiorValor) * 100 : 0, 4)}%`, background: corPorPercentual(item.percentual) }} />
              </div>
              <div style={styles.grid3}>
                <small>Pago: {formatarValor(item.pago)}</small>
                <small>Pend: {formatarValor(item.pendente)}</small>
                <small>Venc: {formatarValor(item.vencido)}</small>
              </div>
            </div>
          ))}
        </section>
      )}

      {filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>📊 Resumo do Centro</h2>
          <div className="print-card" style={styles.cardRanking}>
            <div style={styles.cardLinha}>
              <strong>{centroSelecionado?.nome || 'Centro selecionado'}</strong>
              <strong>{formatarValor(totalGeral)}</strong>
            </div>
            <div style={styles.grid3}>
              <small>Pago: {formatarValor(totalPago)}</small>
              <small>Pend: {formatarValor(totalPendente)}</small>
              <small>Venc: {formatarValor(totalVencido)}</small>
            </div>
          </div>
        </section>
      )}

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📄 Contas do relatório</h2>
        {contasFiltradas.map((conta) => (
          <div className="print-card" key={conta.id} style={styles.cardConta}>
            <div style={styles.cardLinha}>
              <strong>{conta.descricao}</strong>
              <span>{formatarValor(conta.valor)}</span>
            </div>
            <small>{formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'} • {estaVencida(conta.data_vencimento, conta.status) ? 'VENCIDO' : conta.status}</small>
          </div>
        ))}
      </section>
    </div>
  )
}

// =========================
// BLOCO 10 — STYLES
// =========================
const styles = {
  page: {
    padding: 16,
    maxWidth: 780,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: 80
  },

  topo: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap'
  },

  titulo: {
    fontSize: 28,
    marginBottom: 4
  },

  descricaoTela: {
    fontSize: 13,
    color: '#666',
    marginTop: 0,
    marginBottom: 12
  },

  subtitulo: {
    fontSize: 22,
    marginBottom: 12
  },

  bloco: {
    marginTop: 24
  },

  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 12
  },

  boxTotal: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  boxPago: {
    background: '#d4edda',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  boxPendente: {
    background: '#fff3cd',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  boxVencido: {
    background: '#f8d7da',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  cardExecutivo: cardBase(),
  cardSaude: cardBase(),
  cardQualidade: cardBase(),
  cardComparativo: cardBase(),
  cardInsights: cardBase(),
  cardGrafico: cardBase(),
  cardTop: cardBase(),
  cardMeta: cardBase(),

  cardAlerta: {
    ...cardBase(),
    background: '#fff5f5',
    border: '1px solid #f5c2c7'
  },

  filtrosBox: cardBase(),
  infoFiltro: {
    ...cardBase(),
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 14
  },

  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 8,
    boxSizing: 'border-box'
  },

  filtros: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8
  },

  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },

  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },

  btnVoltar: btn('#6c757d'),
  btnPDF: btn('#6f42c1'),
  btnCSV: btn('#198754'),
  btnLimpar: btn('#6c757d'),
  btnAcao: btn('#dc3545'),

  cardLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },

  badge: {
    border: '1px solid',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 'bold',
    background: '#fff'
  },

  barraFundo: {
    height: 10,
    background: '#e9ecef',
    borderRadius: 99,
    overflow: 'hidden',
    margin: '8px 0'
  },

  barraValor: {
    height: '100%',
    borderRadius: 99
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
    marginTop: 10
  },

  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
    marginTop: 12
  },

  caixaCinza: {
    background: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },

  insightItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 8,
    fontSize: 14
  },

  itemGrafico: {
    marginTop: 10
  },

  topItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },

  cardRanking: cardBase(),
  cardConta: cardBase(),

  maiorCusto: {
    display: 'block',
    color: '#198754',
    fontWeight: 'bold',
    fontSize: 12
  },

  alertaTexto: {
    color: '#dc3545',
    fontWeight: 'bold',
    display: 'block'
  },

  vazio: {
    opacity: 0.7,
    fontSize: 14
  }
}

function cardBase() {
  return {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }
}

function btn(background) {
  return {
    background,
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  }
}
