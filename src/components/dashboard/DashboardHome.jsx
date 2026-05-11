import OpenAccountsList from './OpenAccountsList.jsx'
import NotesPanel from './NotesPanel.jsx'
import { SummarySkeleton, AccountListSkeleton, NotesSkeleton } from '../feedback/Skeletons.jsx'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function DashboardHome({
  styles,
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  contas,
  diferencaDias,
  navegarPara,
  contasAbertasDashboard,
  mostrarContasDashboard,
  setMostrarContasDashboard,
  busca,
  setBusca,
  estaVencida,
  formatarData,
  abrirConfirmacao,
  marcarComoPago,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  alternarNotaConcluida,
  abrirEdicaoNota,
  excluirNota,
  loading = false
}) {
  const valorSeguro = (valor) => Number(valor || 0)
  const contasPagas = contas.filter((conta) => conta.status === 'pago')
  const contasPendentes = contas.filter((conta) => conta.status !== 'pago')

  const statusChartData = [
    { name: 'Pago', value: valorSeguro(pago), color: '#22c55e' },
    { name: 'Pendente', value: Math.max(valorSeguro(pendente) - valorSeguro(vencido), 0), color: '#f59e0b' },
    { name: 'Vencido', value: valorSeguro(vencido), color: '#ef4444' }
  ].filter((item) => item.value > 0)

  const fluxoChartData = [
    { name: 'Pago', valor: valorSeguro(pago) },
    { name: 'Aberto', valor: valorSeguro(pendente) },
    { name: 'Vencido', valor: valorSeguro(vencido) }
  ]

  const centroChartData = Object.values(
    contas.reduce((acc, conta) => {
      const centro = conta.df_centros_custo?.nome || 'Sem centro'
      if (!acc[centro]) acc[centro] = { name: centro, valor: 0 }
      acc[centro].valor += valorSeguro(conta.valor)
      return acc
    }, {})
  )
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  const percentualPago = total > 0 ? Math.round((pago / total) * 100) : 0
  const percentualRisco = total > 0 ? Math.round((vencido / total) * 100) : 0

  const contasAgenda = contas
    .filter((conta) => conta.status !== 'pago')
    .sort((a, b) => diferencaDias(a.data_vencimento) - diferencaDias(b.data_vencimento))

  const contasHoje = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) === 0)
  const contasSemana = contasAgenda.filter((conta) => {
    const dias = diferencaDias(conta.data_vencimento)
    return dias > 0 && dias <= 7
  })
  const proximaConta = contasAgenda.find((conta) => diferencaDias(conta.data_vencimento) >= 0) || contasAgenda[0]
  const totalHoje = contasHoje.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
  const totalSemana = contasSemana.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)

  return (
    <>
      <section className="dashboard-title-row">
        <div className="dashboard-heading-actions">
          <h1 className="main-title" style={styles.titulo}>📊 Dashboard Financeiro</h1>
        </div>

        {loading ? (
          <SummarySkeleton items={4} />
        ) : (
          <div className="summary-grid" style={styles.resumo}>
            <div style={styles.boxTotal}>
              <span>Total</span>
              <strong>{formatarValor(total)}</strong>
            </div>

            <div style={styles.boxPago}>
              <span>Pago</span>
              <strong>{formatarValor(pago)}</strong>
            </div>

            <div style={styles.boxPendente}>
              <span>Pendente</span>
              <strong>{formatarValor(pendente)}</strong>
            </div>

            <div style={styles.boxVencido}>
              <span>Vencido</span>
              <strong>{formatarValor(vencido)}</strong>
            </div>
          </div>
        )}
      </section>

      {!loading && (
        <section className="dashboard-analytics-grid no-print">
          <div className="dashboard-analytics-card dashboard-analytics-card-primary">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-kicker">Saúde financeira</span>
                <strong>Distribuição das contas</strong>
              </div>
              <span className="analytics-badge">{percentualPago}% pago</span>
            </div>

            {statusChartData.length > 0 ? (
              <div className="analytics-chart-row">
                <div className="donut-chart-wrap">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>
                        {statusChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarValor(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center-label">
                    <strong>{percentualPago}%</strong>
                    <span>quitado</span>
                  </div>
                </div>

                <div className="analytics-legend">
                  {statusChartData.map((item) => (
                    <div key={item.name}>
                      <span style={{ background: item.color }} />
                      <small>{item.name}</small>
                      <strong>{formatarValor(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="analytics-empty">Sem dados financeiros para montar o gráfico.</div>
            )}
          </div>

          <div className="dashboard-analytics-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-kicker">Fluxo atual</span>
                <strong>Pago x Aberto x Vencido</strong>
              </div>
              <span className={percentualRisco > 0 ? 'analytics-badge danger' : 'analytics-badge success'}>
                {percentualRisco}% risco
              </span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fluxoChartData} margin={{ top: 12, right: 20, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis width={62} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Bar dataKey="valor" radius={[10, 10, 4, 4]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-analytics-card dashboard-cost-center-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-kicker">Centros de custo</span>
                <strong>Top 5 por volume financeiro</strong>
              </div>
              <span className="analytics-badge neutral">{centroChartData.length} centros</span>
            </div>

            {centroChartData.length > 0 ? (
              <div className="cost-center-bars">
                {centroChartData.map((centro) => {
                  const percentual = total > 0 ? Math.max(4, Math.round((centro.valor / total) * 100)) : 0
                  return (
                    <div key={centro.name} className="cost-center-row">
                      <div>
                        <strong>{centro.name}</strong>
                        <span>{formatarValor(centro.valor)}</span>
                      </div>
                      <div className="cost-center-track">
                        <span style={{ width: `${percentual}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="analytics-empty">Cadastre centros de custo para visualizar o ranking.</div>
            )}
          </div>

          <div className="dashboard-analytics-card executive-agenda-widget">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-kicker">Agenda executiva</span>
                <strong>Próximos vencimentos</strong>
              </div>
              <span className="analytics-badge neutral">{contasAgenda.length} abertas</span>
            </div>

            <div className="executive-agenda-metrics">
              <div>
                <small>Hoje</small>
                <strong>{formatarValor(totalHoje)}</strong>
              </div>
              <div>
                <small>7 dias</small>
                <strong>{formatarValor(totalSemana)}</strong>
              </div>
            </div>

            {proximaConta ? (
              <div className="executive-agenda-next">
                <span>Próximo compromisso</span>
                <strong>{proximaConta.descricao}</strong>
                <small>{formatarData(proximaConta.data_vencimento)} • {formatarValor(proximaConta.valor)}</small>
              </div>
            ) : (
              <div className="analytics-empty executive-agenda-empty">Agenda financeira limpa.</div>
            )}

            <button className="executive-agenda-cta" onClick={() => navegarPara('agenda')}>Abrir agenda completa</button>
          </div>
        </section>
      )}

      {loading ? (
        <section className="content-block" style={styles.bloco}>
          <div className="dashboard-section-header-accounts">
            <div>
              <h2 style={styles.subtitulo}>💰 Contas em aberto</h2>
              <p style={styles.textoNota}>Carregando contas e vencimentos...</p>
            </div>
          </div>
          <AccountListSkeleton items={2} />
        </section>
      ) : (
      <OpenAccountsList
        styles={styles}
        formatarValor={formatarValor}
        navegarPara={navegarPara}
        contasAbertasDashboard={contasAbertasDashboard}
        mostrarContasDashboard={mostrarContasDashboard}
        setMostrarContasDashboard={setMostrarContasDashboard}
        busca={busca}
        setBusca={setBusca}
        estaVencida={estaVencida}
        formatarData={formatarData}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
      />
      )}

      {loading ? (
        <section className="content-block" style={styles.bloco}>
          <div className="notes-header-clean">
            <div>
              <h2 style={styles.subtitulo}>📝 Notas</h2>
              <p style={styles.textoNota}>Carregando lembretes...</p>
            </div>
          </div>
          <NotesSkeleton items={2} />
        </section>
      ) : (
      <NotesPanel
        styles={styles}
        navegarPara={navegarPara}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        mostrarNotas={mostrarNotas}
        setMostrarNotas={setMostrarNotas}
        formatarData={formatarData}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        abrirConfirmacao={abrirConfirmacao}
        excluirNota={excluirNota}
      />
      )}
    </>
  )
}
