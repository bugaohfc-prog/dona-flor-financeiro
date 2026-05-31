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
  podeEditarFinanceiro = true,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  alternarNotaConcluida,
  abrirEdicaoNota,
  excluirNota,
  loading = false,
  nomeUsuario = 'usuário',
  filiais = [],
  filtroFilial = '',
  setFiltroFilial = () => {},
  contasOperacionaisFiliais = []
}) {
  const valorSeguro = (valor) => Number(valor || 0)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const contasPagas = contas.filter((conta) => conta.status === 'pago')
  const contasPendentes = contas.filter((conta) => conta.status !== 'pago')
  const baseOperacionalFiliais = (contasOperacionaisFiliais && contasOperacionaisFiliais.length > 0)
    ? contasOperacionaisFiliais
    : contas

  const resumoFiliais = (filiais || [])
    .map((filial) => {
      const contasFilial = baseOperacionalFiliais.filter((conta) => conta.filial_id === filial.id)
      const totalFilial = contasFilial.reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const pagoFilial = contasFilial
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const vencidoFilial = contasFilial
        .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
        .reduce((acc, conta) => acc + valorSeguro(conta.valor), 0)
      const pendenteFilial = totalFilial - pagoFilial

      return {
        id: filial.id,
        nome: filial.nome || 'Filial sem nome',
        total: totalFilial,
        pago: pagoFilial,
        pendente: pendenteFilial,
        vencido: vencidoFilial,
        contas: contasFilial.length
      }
    })
    .filter((filial) => filial.total > 0 || filial.contas > 0)
    .sort((a, b) => b.total - a.total)

  const filialMaiorVolume = resumoFiliais[0]
  const filialMaiorPendente = [...resumoFiliais].sort((a, b) => b.pendente - a.pendente)[0]
  const filialMaiorRisco = [...resumoFiliais].sort((a, b) => b.vencido - a.vencido)[0]

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
      <section className="dashboard-branch-filter no-print" aria-label="Filtro de filial do painel">
        <div className="dashboard-branch-filter-card">
          <div>
            <span className="analytics-kicker">Visão por filial</span>
            <strong>{filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}</strong>
            <small>Os indicadores, gráficos e contas em aberto respeitam a filial selecionada.</small>
          </div>

          <select
            style={styles.input}
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            aria-label="Filtrar painel por filial"
          >
            <option value="">Todas as filiais</option>
            {(filiais || []).map((filial) => (
              <option key={filial.id} value={filial.id}>{filial.nome}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="dashboard-kpi-row" aria-label="Resumo financeiro rápido">
        {loading ? (
          <SummarySkeleton items={4} />
        ) : (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '8px 10px',
              marginBottom: 8,
              boxShadow: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Resumo financeiro rápido</span>
              <button
                type="button"
                onClick={() => navegarPara('relatorios')}
                style={{ background: 'transparent', border: 0, color: '#0f766e', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0 }}
              >
                Ver Análise Financeira
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 1,
                background: '#e5e7eb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden'
              }}
            >
              <div style={{ background: '#f8fafc', padding: '7px 9px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, lineHeight: 1.2 }}>Total</span>
                <strong style={{ color: '#111827', display: 'block', fontSize: 14, lineHeight: 1.25, marginTop: 2 }}>{formatarValor(total)}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '7px 9px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, lineHeight: 1.2 }}>Pago</span>
                <strong style={{ color: '#166534', display: 'block', fontSize: 14, lineHeight: 1.25, marginTop: 2 }}>{formatarValor(pago)}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '7px 9px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, lineHeight: 1.2 }}>Pendente</span>
                <strong style={{ color: '#92400e', display: 'block', fontSize: 14, lineHeight: 1.25, marginTop: 2 }}>{formatarValor(pendente)}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '7px 9px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, lineHeight: 1.2 }}>Vencido</span>
                <strong style={{ color: '#991b1b', display: 'block', fontSize: 14, lineHeight: 1.25, marginTop: 2 }}>{formatarValor(vencido)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {!loading && (
        <section className="dashboard-operational-grid no-print" aria-label="Painel operacional por filial">
          <article className="dashboard-operational-card highlight">
            <span className="analytics-kicker">Ranking de unidades</span>
            <strong>{filialMaiorVolume ? filialMaiorVolume.nome : 'Sem movimento'}</strong>
            <small>{filialMaiorVolume ? `${formatarValor(filialMaiorVolume.total)} em volume financeiro` : 'Cadastre contas vinculadas às filiais.'}</small>
          </article>

          <article className="dashboard-operational-card">
            <span className="analytics-kicker">Maior pendência</span>
            <strong>{filialMaiorPendente ? filialMaiorPendente.nome : 'Sem pendências'}</strong>
            <small>{filialMaiorPendente ? formatarValor(filialMaiorPendente.pendente) : 'Nenhuma conta pendente encontrada.'}</small>
          </article>

          <article className="dashboard-operational-card">
            <span className="analytics-kicker">Risco vencido</span>
            <strong>{filialMaiorRisco && filialMaiorRisco.vencido > 0 ? filialMaiorRisco.nome : 'Sem vencidos'}</strong>
            <small>{filialMaiorRisco && filialMaiorRisco.vencido > 0 ? formatarValor(filialMaiorRisco.vencido) : 'Operação sem vencidos no filtro atual.'}</small>
          </article>

          <article className="dashboard-operational-card ranking">
            <div className="analytics-card-header compact">
              <div>
                <span className="analytics-kicker">Comparativo por filial</span>
                <strong>Top unidades</strong>
              </div>
              <span className="analytics-badge neutral">{resumoFiliais.length}</span>
            </div>

            {resumoFiliais.length > 0 ? (
              <div className="branch-ranking-list">
                {resumoFiliais.slice(0, 5).map((filial, index) => {
                  const percentual = filialMaiorVolume?.total > 0
                    ? Math.max(5, Math.round((filial.total / filialMaiorVolume.total) * 100))
                    : 0

                  return (
                    <div key={filial.id} className="branch-ranking-row">
                      <div className="branch-ranking-info">
                        <span>{index + 1}</span>
                        <div>
                          <strong>{filial.nome}</strong>
                          <small>{filial.contas} conta(s) • pendente {formatarValor(filial.pendente)}</small>
                        </div>
                      </div>
                      <div className="branch-ranking-value">
                        <strong>{formatarValor(filial.total)}</strong>
                        <div className="cost-center-track"><span style={{ width: `${percentual}%` }} /></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="analytics-empty">Sem contas com filial no filtro atual.</div>
            )}
          </article>
        </section>
      )}

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
              <BarChart data={fluxoChartData} margin={{ top: 14, right: 18, left: 24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis width={82} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} />
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
          <span className="analytics-kicker">Agenda financeira</span>
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
        podeEditarFinanceiro={podeEditarFinanceiro}
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
        podeEditarFinanceiro={podeEditarFinanceiro}
      />
      )}
    </>
  )
}
