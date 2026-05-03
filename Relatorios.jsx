import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

export default function Relatorios({ voltar }) {
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarPercentual(valor) {
    return `${Number(valor || 0).toFixed(1)}%`
  }

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
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

  // =========================
  // BLOCO 1 — STATES
  // =========================
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroMes, setFiltroMes] = useState(mesAtualPadrao())
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')

  useEffect(() => {
    buscarDados()
  }, [])

  // =========================
  // BLOCO 2 — BUSCAS
  // =========================
  async function buscarDados() {
    setLoading(true)

    const { data: contasData, error: contasError } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

    const { data: centrosData, error: centrosError } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    if (contasError) {
      alert(contasError.message)
    }

    if (centrosError) {
      alert(centrosError.message)
    }

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

  // =========================
  // BLOCO 5 — RANKING POR CENTRO
  // =========================
  const centrosComContas = contasFiltradas.reduce((acc, conta) => {
    const chave = conta.centro_custo_id || 'sem-centro'

    if (!acc[chave]) {
      acc[chave] = []
    }

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

  const maiorValor = ranking[0]?.total || 0
  const principalCentro = ranking[0] || null
  const quantidadeVencidas = contasFiltradas.filter((conta) => estaVencida(conta.data_vencimento, conta.status)).length
  const centroSelecionado = centros.find((centro) => centro.id === filtroCentro)

  const resumoCentro = contasFiltradas.reduce((acc, conta) => {
    const valorConta = Number(conta.valor || 0)

    acc.total += valorConta

    if (conta.status === 'pago') {
      acc.pago += valorConta
    }

    if (estaVencida(conta.data_vencimento, conta.status)) {
      acc.vencido += valorConta
    }

    return acc
  }, {
    total: 0,
    pago: 0,
    vencido: 0
  })

  resumoCentro.pendente = resumoCentro.total - resumoCentro.pago

  const temSemCentro = ranking.some((item) => item.id === 'sem-centro')
  const semCentro = ranking.find((item) => item.id === 'sem-centro')
  const mostrarAcaoPrioritaria = Boolean(semCentro && semCentro.total > 0)

  // =========================
  // BLOCO 6 — SAÚDE FINANCEIRA E INSIGHTS
  // =========================
  let scoreSaude = 100

  if (totalVencido > 0) scoreSaude -= 35
  if (principalCentro?.percentual >= 50) scoreSaude -= 25
  if (diferencaMes > 0 && percentualMes >= 20) scoreSaude -= 20
  if (totalPendente > totalPago && totalGeral > 0) scoreSaude -= 10
  if (temSemCentro) scoreSaude -= 10

  scoreSaude = Math.max(scoreSaude, 0)

  let statusSaude = {
    titulo: 'Saúde financeira boa',
    emoji: '✅',
    cor: '#198754',
    descricao: 'Os indicadores estão equilibrados para o filtro atual.'
  }

  if (scoreSaude < 75 && scoreSaude >= 45) {
    statusSaude = {
      titulo: 'Saúde financeira em atenção',
      emoji: '⚠️',
      cor: '#ffc107',
      descricao: 'Existem pontos que merecem acompanhamento, principalmente concentração, variação mensal e classificação dos custos.'
    }
  }

  if (scoreSaude < 45) {
    statusSaude = {
      titulo: 'Saúde financeira crítica',
      emoji: '🚨',
      cor: '#dc3545',
      descricao: 'Há sinais relevantes de risco. Priorize vencidos, concentração de custos, aumento mensal e contas sem centro.'
    }
  }

  const insights = []

  if (!filtroCentro && principalCentro && principalCentro.percentual >= 50) {
    insights.push({
      tipo: 'risco',
      texto: `${principalCentro.nome} concentra ${formatarPercentual(principalCentro.percentual)} do total. Isso indica alta dependência ou concentração de custo.`
    })
  } else if (!filtroCentro && principalCentro && principalCentro.percentual >= 30) {
    insights.push({
      tipo: 'atenção',
      texto: `${principalCentro.nome} é o maior centro do período, representando ${formatarPercentual(principalCentro.percentual)} do total.`
    })
  }

  if (temSemCentro) {
    insights.push({
      tipo: 'ação',
      texto: `Existem despesas sem centro de custo, somando ${formatarValor(semCentro?.total || 0)}. Classificar essas contas melhora a análise gerencial.`
    })
  }

  if (filtroCentro && resumoCentro.total > 0) {
    insights.push({
      tipo: 'centro',
      texto: `${centroSelecionado?.nome || 'Centro selecionado'} possui ${formatarValor(resumoCentro.total)} no período filtrado.`
    })
  }

  if (totalVencido > 0) {
    insights.push({
      tipo: 'risco',
      texto: `Existem ${quantidadeVencidas} conta(s) vencida(s), somando ${formatarValor(totalVencido)}. Priorize a regularização.`
    })
  }

  if (filtroMes) {
    if (totalMesAnterior === 0 && totalGeral > 0) {
      insights.push({
        tipo: 'info',
        texto: `${nomeMes(filtroMes)} tem ${formatarValor(totalGeral)} em contas. Não há base no mês anterior para comparação.`
      })
    } else if (diferencaMes > 0) {
      insights.push({
        tipo: percentualMes >= 20 ? 'risco' : 'alta',
        texto: `Crescimento de ${formatarValor(diferencaMes)} em relação a ${nomeMes(mesAnterior(filtroMes))}, variação de ${formatarPercentual(percentualMes)}.`
      })
    } else if (diferencaMes < 0) {
      insights.push({
        tipo: 'queda',
        texto: `Redução de ${formatarValor(Math.abs(diferencaMes))} em relação a ${nomeMes(mesAnterior(filtroMes))}, queda de ${formatarPercentual(Math.abs(percentualMes))}.`
      })
    } else if (totalGeral > 0) {
      insights.push({
        tipo: 'ok',
        texto: 'O total ficou estável em relação ao mês anterior.'
      })
    }

    if (totalGeral > 0) {
      insights.push({
        tipo: 'previsao',
        texto: `Mantido o ritmo atual, o próximo mês pode fechar próximo de ${formatarValor(previsaoProximoMes)}.`
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      tipo: 'ok',
      texto: 'Nenhum alerta relevante encontrado para os filtros selecionados.'
    })
  }

  // =========================
  // BLOCO 7 — GRÁFICO DE DISTRIBUIÇÃO
  // =========================
  const topGrafico = ranking.slice(0, 5)
  const totalGrafico = topGrafico.reduce((acc, item) => acc + item.total, 0)

  // =========================
  // BLOCO 8 — EXPORTAÇÃO
  // =========================
  function imprimirPDF() {
    window.print()
  }

  function exportarCSV() {
    const cabecalho = ['Centro', 'Total', 'Pago', 'Pendente', 'Vencido', 'Percentual']
    const linhas = ranking.map((item) => [
      item.nome,
      Number(item.total || 0).toFixed(2).replace('.', ','),
      Number(item.pago || 0).toFixed(2).replace('.', ','),
      Number(item.pendente || 0).toFixed(2).replace('.', ','),
      Number(item.vencido || 0).toFixed(2).replace('.', ','),
      `${item.percentual.toFixed(1)}%`
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-centros.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function limparFiltros() {
    setFiltroMes('')
    setFiltroStatus('todas')
    setFiltroCentro('')
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
            body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            .relatorios-page {
              background: #fff !important;
              padding: 0 !important;
            }

            .relatorio-print-header {
              display: block !important;
              text-align: center;
              border-bottom: 1px solid #ddd;
              margin-bottom: 16px;
              padding-bottom: 8px;
            }

            .relatorio-print-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 6px;
              background: #fff;
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd;
            }

            @page {
              size: A4;
              margin: 12mm 12mm 18mm 12mm;
            }
          }
        `}
      </style>

      <div className="relatorio-print-header">
        <h1>Relatório Inteligente por Centro de Custo</h1>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="relatorio-print-footer">
        Relatório gerado pelo Sistema Dona Flor Financeiro
      </div>

      <div className="no-print" style={styles.topo}>
        <button style={styles.btnVoltar} onClick={voltar}>
          ← Voltar
        </button>

        <button style={styles.btnPDF} onClick={imprimirPDF}>
          PDF
        </button>

        <button style={styles.btnCSV} onClick={exportarCSV}>
          CSV
        </button>
      </div>

      <h1 style={styles.titulo}>📊 Relatórios Inteligentes</h1>
      <p style={styles.descricaoTela}>Visão estratégica dos seus custos por centro, mês e status.</p>

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
        </div>

        <div style={styles.boxVencido}>
          <span>Vencido</span>
          <strong>{formatarValor(totalVencido)}</strong>
        </div>
      </section>

      <section className="print-card" style={styles.cardSaude}>
        <div>
          <strong>{statusSaude.emoji} {statusSaude.titulo}</strong>
          <p>{statusSaude.descricao}</p>
        </div>

        <div style={styles.saudeLinha}>
          <div style={styles.saudeFundo}>
            <div style={{ ...styles.saudeBarra, width: `${Math.max(scoreSaude, 5)}%`, background: statusSaude.cor }} />
          </div>
          <span>{scoreSaude}/100</span>
        </div>
      </section>

      {mostrarAcaoPrioritaria && (
        <section className="print-card" style={styles.cardAlertaPrincipal}>
          <strong>🚨 Ação prioritária</strong>

          <p>
            {formatarPercentual(semCentro.percentual)} das despesas filtradas estão sem centro de custo.
            Isso dificulta a análise gerencial e o controle financeiro.
          </p>

          <small>
            Sugestão: volte em Contas, edite as contas sem centro e classifique cada lançamento.
          </small>
        </section>
      )}

      <section className="print-card" style={styles.cardComparativo}>
        <strong>📅 Comparativo mensal</strong>

        <div style={styles.comparativoGrid}>
          <div style={styles.comparativoItem}>
            <span>Mês atual</span>
            <strong>{formatarValor(totalGeral)}</strong>
            <small>{nomeMes(filtroMes || mesAtualPadrao())}</small>
          </div>

          <div style={styles.comparativoItem}>
            <span>Mês anterior</span>
            <strong>{formatarValor(totalMesAnterior)}</strong>
            <small>{nomeMes(mesAnterior(filtroMes || mesAtualPadrao()))}</small>
          </div>

          <div style={styles.comparativoItem}>
            <span>Variação</span>
            <strong style={{ color: diferencaMes > 0 ? '#dc3545' : diferencaMes < 0 ? '#198754' : '#333' }}>
              {diferencaMes > 0 ? '↑ +' : diferencaMes < 0 ? '↓ ' : ''}{formatarValor(diferencaMes)}
            </strong>
            <small>{formatarPercentual(percentualMes)}</small>
          </div>

          <div style={styles.comparativoItem}>
            <span>Previsão</span>
            <strong>{formatarValor(previsaoProximoMes)}</strong>
            <small>próximo mês</small>
          </div>
        </div>
      </section>

      <section className="print-card" style={styles.cardInsights}>
        <strong>💡 Insights automáticos</strong>

        {insights.map((insight, index) => (
          <div key={index} style={styles.insightItem}>
            <span>
              {insight.tipo === 'risco'
                ? '🚨'
                : insight.tipo === 'queda'
                  ? '✅'
                  : insight.tipo === 'alta'
                    ? '📈'
                    : insight.tipo === 'ação'
                      ? '🎯'
                      : insight.tipo === 'previsao'
                        ? '🔮'
                        : 'ℹ️'}
            </span>
            <p>{insight.texto}</p>
          </div>
        ))}
      </section>

      {!filtroCentro && ranking.length > 0 && (
        <section className="print-card" style={styles.cardGrafico}>
          <strong>📊 Distribuição por centro</strong>

          <div style={styles.graficoLista}>
            {topGrafico.map((item) => {
              const percentualGrafico = totalGrafico ? (item.total / totalGrafico) * 100 : 0

              return (
                <div key={item.id} style={styles.graficoItem}>
                  <div style={styles.graficoLinha}>
                    <span>{item.nome}</span>
                    <strong>{formatarPercentual(percentualGrafico)}</strong>
                  </div>

                  <div style={styles.barraFundo}>
                    <div
                      style={{
                        ...styles.barraValor,
                        width: `${Math.max(percentualGrafico, 4)}%`,
                        background: corPorPercentual(percentualGrafico)
                      }}
                    />
                  </div>

                  <small>{formatarValor(item.total)}</small>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="no-print" style={styles.filtrosBox}>
        <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
          <option value="">Todos os centros</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />

        <div style={styles.filtros}>
          <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
          <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
          <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
          <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
        </div>

        <button style={styles.btnLimpar} onClick={limparFiltros}>
          Limpar filtros
        </button>
      </section>

      <section style={styles.infoFiltro}>
        <strong>Resultado</strong>
        <span>{ranking.length} centro(s) • {contasFiltradas.length} conta(s)</span>
        <small>
          Centro: {filtroCentro ? centroSelecionado?.nome || 'Selecionado' : 'Todos'} •
          Status: {filtroStatus} •
          Mês: {filtroMes || 'Todos'}
        </small>

        {principalCentro && (
          <small>
            Centro dominante: {principalCentro.nome} ({formatarPercentual(principalCentro.percentual)})
          </small>
        )}
      </section>

      {loading && <p>Carregando...</p>}

      {!filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>🏆 Ranking por Centro</h2>

          {ranking.length === 0 && (
            <p style={styles.vazio}>Nenhum dado encontrado para os filtros selecionados.</p>
          )}

          {ranking.map((item, index) => {
            const largura = maiorValor ? `${Math.max((item.total / maiorValor) * 100, 4)}%` : '0%'
            const cor = corPorPercentual(item.percentual)

            return (
              <div className="print-card" key={item.id} style={styles.cardRanking}>
                <div style={styles.rankingTopo}>
                  <div>
                    <strong>{index + 1}. {item.nome}</strong>
                    <div style={styles.textoSecundario}>
                      {formatarPercentual(item.percentual)} do total
                    </div>
                  </div>

                  <strong>{formatarValor(item.total)}</strong>
                </div>

                <div style={styles.barraFundo}>
                  <div style={{ ...styles.barraValor, width: largura, background: cor }} />
                </div>

                <div style={styles.gridValores}>
                  <span>Pago: {formatarValor(item.pago)}</span>
                  <span>Pend: {formatarValor(item.pendente)}</span>
                  <span>Venc: {formatarValor(item.vencido)}</span>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {filtroCentro && (
        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>📊 Resumo do Centro</h2>

          <div className="print-card" style={styles.cardRanking}>
            <div style={styles.rankingTopo}>
              <strong>{centroSelecionado?.nome || 'Centro selecionado'}</strong>
              <strong>{formatarValor(resumoCentro.total)}</strong>
            </div>

            <div style={styles.gridValores}>
              <span>Pago: {formatarValor(resumoCentro.pago)}</span>
              <span>Pend: {formatarValor(resumoCentro.pendente)}</span>
              <span>Venc: {formatarValor(resumoCentro.vencido)}</span>
            </div>
          </div>
        </section>
      )}

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📄 Contas do relatório</h2>

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div className="print-card" key={conta.id} style={styles.cardConta}>
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.textoSecundario}>
                {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || '-'} • {vencida ? 'VENCIDO' : conta.status}
              </div>
            </div>
          )
        })}
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
    maxWidth: 760,
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

  cardSaude: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  saudeLinha: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 8
  },

  saudeFundo: {
    flex: 1,
    height: 10,
    background: '#e9ecef',
    borderRadius: 99,
    overflow: 'hidden'
  },

  saudeBarra: {
    height: '100%',
    borderRadius: 99
  },

  cardAlertaPrincipal: {
    background: '#fff5f5',
    border: '1px solid #f5c2c7',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  cardComparativo: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  comparativoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
    marginTop: 10
  },

  comparativoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: '#f8f9fa',
    padding: 10,
    borderRadius: 10
  },

  cardInsights: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  insightItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 8,
    fontSize: 14
  },

  cardGrafico: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  graficoLista: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  graficoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5
  },

  graficoLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    fontSize: 13
  },

  filtrosBox: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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

  infoFiltro: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    fontSize: 14
  },

  cardRanking: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },

  rankingTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },

  barraFundo: {
    height: 10,
    background: '#e9ecef',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 8
  },

  barraValor: {
    height: '100%',
    borderRadius: 99
  },

  gridValores: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 6,
    fontSize: 12,
    color: '#444'
  },

  cardConta: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4
  },

  textoSecundario: {
    fontSize: 12,
    color: '#666'
  },

  vazio: {
    opacity: 0.7,
    fontSize: 14
  },

  btnVoltar: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnPDF: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnCSV: {
    background: '#198754',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnLimpar: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  }
}
