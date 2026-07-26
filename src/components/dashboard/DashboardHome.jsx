import ContasContextualGuard from '../feedback/ContasContextualGuard.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRelatorioFinanceiro } from '../../hooks/useRelatorioFinanceiro.js'
import {
  criarDestinoContasDashboard,
  criarPeriodoConsultaDashboard,
  resumirDashboardFinanceiro,
  resumirProjecaoMensalDashboard
} from '../../utils/consumidoresFinanceiros.js'
import { useResumoGestaoPessoasPainel } from '../../hooks/useResumoGestaoPessoasPainel.js'
import { ResumoOperacionalDashboard } from '../../modules/central-do-dia/components/dashboard/ResumoOperacionalDashboard.jsx'
import { useCentralDoDia } from '../../modules/central-do-dia/hooks/useCentralDoDia.js'

function DashboardAction({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`dashboard-home-action dashboard-home-action-${variant} ${className}`} type="button" {...props}>
      {children}
    </button>
  )
}

function DashboardCollapseButton({ expanded, onClick, label }) {
  return (
    <button
      className="dashboard-home-icon-button"
      type="button"
      onClick={onClick}
      title={expanded ? `Recolher ${label}` : `Expandir ${label}`}
      aria-label={expanded ? `Recolher ${label}` : `Expandir ${label}`}
      aria-expanded={expanded}
    >
      {expanded ? '\u2212' : '+'}
    </button>
  )
}

function DashboardWidgetHeader({ kicker, title, subtitle, badge, actions, expanded, onToggle, label }) {
  return (
    <div className="dashboard-home-widget-header">
      <div className="dashboard-home-header-copy">
        <span className="dashboard-home-kicker">{kicker}</span>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <div className="dashboard-home-header-tools">
        {badge && <span className="dashboard-home-badge">{badge}</span>}
        {actions}
        {onToggle && (
          <DashboardCollapseButton expanded={expanded} onClick={onToggle} label={label || title} />
        )}
      </div>
    </div>
  )
}

function formatarMesDashboard(chave) {
  const [ano, mes] = String(chave || '').split('-').map(Number)
  if (!ano || !mes) return chave
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[mes - 1]} ${ano}`
}

export default function DashboardHome({
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  navegarPara,
  loading = false,
  loadingHistoricoFinanceiro = false,
  historicoFinanceiroCarregado = false,
  erroHistoricoFinanceiro = null,
  onRetryHistoricoFinanceiro,
  filiais = [],
  centros = [],
  contasCentral = [],
  notasCentral = [],
  onAtualizarContasCentral,
  onAtualizarNotasCentral,
  navegarParaOrigemAgenda,
  onAbrirContasPlanejamento
}) {
  const { empresaId, perfilEmpresaAtiva } = useApp()
  const [mostrarResumoFinanceiro, setMostrarResumoFinanceiro] = useState(true)
  const [filtroFilialDashboard, setFiltroFilialDashboard] = useState('')
  const [filtroCentroDashboard, setFiltroCentroDashboard] = useState('')
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilialDashboard)
  const centroSelecionado = (centros || []).find((centro) => centro.id === filtroCentroDashboard)
  const perfilUsuario = String(perfilEmpresaAtiva || '').trim().toLowerCase()
  const podeAcessarGestaoPessoas = ['admin', 'master'].includes(perfilUsuario)
  useEffect(() => {
    setFiltroFilialDashboard('')
    setFiltroCentroDashboard('')
  }, [empresaId])
  const hoje = useMemo(() => {
    const data = new Date()
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  }, [])
  const criteriosFinanceiros = useMemo(() => ({
    ...criarPeriodoConsultaDashboard(hoje),
    base: 'vencimento',
    status: 'todas',
    filialId: filtroFilialDashboard,
    centroCustoId: filtroCentroDashboard,
    origem: 'todas',
    incluirOcultas: false,
    busca: '',
    hoje
  }), [filtroCentroDashboard, filtroFilialDashboard, hoje])
  const fonteFinanceira = useRelatorioFinanceiro({ empresaId, criterios: criteriosFinanceiros })
  const criteriosVencidos = useMemo(() => ({
    hoje,
    filialId: filtroFilialDashboard,
    centroCustoId: filtroCentroDashboard,
    incluirOcultas: false
  }), [filtroCentroDashboard, filtroFilialDashboard, hoje])
  const fonteVencidos = useRelatorioFinanceiro({
    empresaId,
    criterios: criteriosVencidos,
    tipoConsulta: 'vencidos_historicos'
  })
  const resumoDashboard = useMemo(() => resumirDashboardFinanceiro(fonteFinanceira.registros, {
    dataBase: hoje,
    empresaId,
    filialId: filtroFilialDashboard,
    centroCustoId: filtroCentroDashboard,
    vencidosHistoricos: fonteVencidos.registros
  }), [empresaId, filtroCentroDashboard, filtroFilialDashboard, fonteFinanceira.registros, fonteVencidos.registros, hoje])
  const projecaoDashboard = useMemo(() => resumirProjecaoMensalDashboard(fonteFinanceira.registros, {
    dataBase: hoje,
    empresaId,
    filialId: filtroFilialDashboard,
    centroCustoId: filtroCentroDashboard
  }), [empresaId, filtroCentroDashboard, filtroFilialDashboard, fonteFinanceira.registros, hoje])
  const {
    erro: erroResumoPessoas,
    podeVisualizar: podeVisualizarResumoPessoas,
    alertas: alertasPessoas
  } = useResumoGestaoPessoasPainel({
    empresaId,
    perfilUsuario,
    podeAcessarGestaoPessoas
  })
  const dadosCentral = useCentralDoDia({
    empresaId,
    filialId: filtroFilialDashboard,
    contas: contasCentral,
    notas: notasCentral,
    alertasPessoas,
    erroPessoas: erroResumoPessoas,
    podeAcessarPessoas: podeVisualizarResumoPessoas,
    podeAcessarAuditoria: false,
    modoCompacto: true,
    onAtualizarContas: onAtualizarContasCentral,
    onAtualizarNotas: onAtualizarNotasCentral
  })

  function abrirOrigemResumo(item) {
    const referencia = item?.referenciaOrigem
    if (referencia?.tipo === 'conta' && referencia.id && typeof navegarParaOrigemAgenda === 'function') {
      navegarParaOrigemAgenda('conta', referencia.id)
      return
    }
    if (referencia?.tipo === 'nota' && referencia.id && typeof navegarParaOrigemAgenda === 'function') {
      navegarParaOrigemAgenda('nota', referencia.id)
      return
    }
    if (item?.destino) navegarPara(item.destino)
  }

  const resumoFinanceiro = [
    { label: 'Previsto', valor: formatarValor(resumoDashboard.previsto), detalhe: `Ano de ${hoje.slice(0, 4)}`, tone: 'default' },
    { label: 'Realizado', valor: formatarValor(resumoDashboard.realizado), detalhe: 'Pagamentos efetivos', tone: 'success' },
    { label: 'Saldo', valor: formatarValor(resumoDashboard.saldo), detalhe: 'Ainda em aberto', tone: 'warning' },
    { label: 'Vencido', valor: formatarValor(resumoDashboard.vencido), detalhe: 'Todo o saldo vencido', tone: 'danger', destino: 'vencidas' },
    { label: 'Vence hoje', valor: formatarValor(resumoDashboard.faixas.hoje.valor), detalhe: `${resumoDashboard.faixas.hoje.quantidade} compromisso(s)`, tone: 'warning', destino: 'hoje' },
    { label: 'Próximos 7 dias', valor: formatarValor(resumoDashboard.faixas.proximos7.valor), detalhe: 'De amanhã até o 7º dia', tone: 'default', destino: 'proximos7' },
    { label: 'Próximos 30 dias', valor: formatarValor(resumoDashboard.faixas.proximos30.valor), detalhe: 'Do 8º ao 30º dia', tone: 'default', destino: 'proximos30' },
    { label: 'Próximos 90 dias', valor: formatarValor(resumoDashboard.faixas.proximos90.valor), detalhe: 'Do 31º ao 90º dia', tone: 'default', destino: 'proximos90' }
  ]
  const maiorSaldoMensal = Math.max(...projecaoDashboard.meses.map((mes) => mes.saldo), 0)

  function abrirContas(tipo, referencia = {}) {
    const filtros = criarDestinoContasDashboard(tipo, { hoje, ...referencia })
    onAbrirContasPlanejamento?.({
      ...filtros,
      filialId: filtroFilialDashboard,
      centroCustoId: filtroCentroDashboard
    })
  }

  async function atualizarDashboard() {
    await Promise.all([dadosCentral.atualizar(), fonteFinanceira.consultar(), fonteVencidos.consultar()])
  }

  async function tentarNovamenteResumoFinanceiro() {
    await Promise.all([fonteFinanceira.consultar(), fonteVencidos.consultar()])
  }

  return (
    <>
      <section className="dashboard-home-branch no-print" aria-label="Filtros financeiros do painel">
        <div className="dashboard-home-branch-copy">
          <span className="dashboard-home-kicker">Escopo da projeção</span>
          <strong>
            {filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}
            {' · '}
            {centroSelecionado ? centroSelecionado.nome : 'Todos os centros'}
          </strong>
          <small>Indicadores e projeção usam consultas próprias, completas e delimitadas por período.</small>
        </div>

        <div className="dashboard-home-filter-controls">
          <label>
            <span>Filial</span>
            <select
              className="dashboard-home-select"
              value={filtroFilialDashboard}
              onChange={(e) => setFiltroFilialDashboard(e.target.value)}
              aria-label="Filtrar projeção por filial"
            >
              <option value="">Todas as filiais</option>
              {(filiais || []).map((filial) => (
                <option key={filial.id} value={filial.id}>{filial.nome}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Centro de custo</span>
            <select
              className="dashboard-home-select"
              value={filtroCentroDashboard}
              onChange={(e) => setFiltroCentroDashboard(e.target.value)}
              aria-label="Filtrar projeção por centro de custo"
            >
              <option value="">Todos os centros</option>
              {(centros || []).map((centro) => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <ResumoOperacionalDashboard
        empresaId={empresaId}
        carregando={loading}
        erroParcial={dadosCentral.erroPessoas}
        formatarValor={formatarValor}
        dados={dadosCentral}
        onAtualizar={atualizarDashboard}
        onAbrirAgenda={() => navegarPara('agenda')}
        onAbrirOrigem={abrirOrigemResumo}
      />

      <section className="dashboard-home-finance" aria-label="Resumo financeiro rápido">
        <ContasContextualGuard
          carregando={fonteFinanceira.carregando || fonteVencidos.carregando}
          carregada={fonteFinanceira.carregado && fonteVencidos.carregado}
          erro={fonteFinanceira.erro || fonteVencidos.erro}
          onRetry={tentarNovamenteResumoFinanceiro}
        >
          <div className="dashboard-home-card dashboard-home-finance-card">
            <DashboardWidgetHeader
              kicker="Resumo financeiro rápido"
              title="Visão operacional"
              actions={(
                <DashboardAction variant="secondary" onClick={() => navegarPara('relatorios')}>
                  Ver relatórios
                </DashboardAction>
              )}
              expanded={mostrarResumoFinanceiro}
              onToggle={() => setMostrarResumoFinanceiro((atual) => !atual)}
              label="Resumo financeiro rápido"
            />

            {mostrarResumoFinanceiro && (
              <div className="dashboard-home-kpi-grid">
                {resumoFinanceiro.map((item) => item.destino ? (
                  <button
                    type="button"
                    className={`dashboard-home-kpi dashboard-home-kpi-${item.tone} is-action`}
                    key={item.label}
                    onClick={() => abrirContas(item.destino)}
                    aria-label={`${item.label}: ${item.valor}. Abrir contas correspondentes.`}
                  >
                    <span>{item.label}</span>
                    <strong>{item.valor}</strong>
                    <small>{item.detalhe}</small>
                  </button>
                ) : (
                  <div className={`dashboard-home-kpi dashboard-home-kpi-${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.valor}</strong>
                    <small>{item.detalhe}</small>
                  </div>
                ))}
              </div>
            )}

            {mostrarResumoFinanceiro && (
              <>
                <div className="dashboard-home-projection-header">
                  <div>
                    <span className="dashboard-home-kicker">Necessidade de caixa</span>
                    <strong>Projeção mensal dos próximos 12 meses</strong>
                    <small>
                      {projecaoDashboard.periodo.inicio} a {projecaoDashboard.periodo.fim}
                      {projecaoDashboard.maiorNecessidade
                        ? ` · Maior necessidade em ${projecaoDashboard.maiorNecessidade.chave}`
                        : ''}
                    </small>
                  </div>
                </div>

                <div className="dashboard-home-breakdown" aria-label="Classificação dos compromissos projetados">
                  {Object.entries({
                    'Contas fixas': projecaoDashboard.classificacoes.fixa,
                    'Contas variáveis': projecaoDashboard.classificacoes.variavel,
                    'Contas manuais': projecaoDashboard.classificacoes.manual,
                    'Contas recorrentes': projecaoDashboard.classificacoes.recorrente
                  }).map(([rotulo, item]) => (
                    <div className="dashboard-home-breakdown-item" key={rotulo}>
                      <span>{rotulo}</span>
                      <strong>{formatarValor(item.valor)}</strong>
                      <small>{item.quantidade} compromisso(s)</small>
                    </div>
                  ))}
                </div>

                <div className="dashboard-home-projection-table-wrap">
                  <table className="dashboard-home-projection-table">
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th>Previsto</th>
                        <th>Pago</th>
                        <th>Saldo</th>
                        <th>Contas</th>
                        <th aria-label="Proporção da necessidade financeira">Necessidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projecaoDashboard.meses.map((mes) => {
                        const destaque = projecaoDashboard.maiorNecessidade?.chave === mes.chave
                        const largura = maiorSaldoMensal > 0 ? Math.round((mes.saldo / maiorSaldoMensal) * 100) : 0
                        return (
                          <tr className={destaque ? 'is-highest' : ''} key={mes.chave}>
                            <th scope="row">
                              <button type="button" onClick={() => abrirContas('mes', { mes: mes.chave })}>
                                {formatarMesDashboard(mes.chave)}
                                {destaque && <span>Maior necessidade</span>}
                              </button>
                            </th>
                            <td>{formatarValor(mes.previsto)}</td>
                            <td>{formatarValor(mes.pago)}</td>
                            <td><strong>{formatarValor(mes.saldo)}</strong></td>
                            <td>{mes.quantidade}</td>
                            <td>
                              <span className="dashboard-home-projection-bar" aria-hidden="true">
                                <i style={{ width: `${largura}%` }} />
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </ContasContextualGuard>
      </section>
    </>
  )
}
