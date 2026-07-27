import ContasContextualGuard from '../feedback/ContasContextualGuard.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRelatorioFinanceiro } from '../../hooks/useRelatorioFinanceiro.js'
import {
  criarDestinoContasDashboard,
  criarPeriodoConsultaDashboard,
  resumirDashboardFinanceiro,
  resumirProximos90Dashboard
} from '../../utils/consumidoresFinanceiros.js'
import { useResumoGestaoPessoasPainel } from '../../hooks/useResumoGestaoPessoasPainel.js'
import { ResumoOperacionalDashboard } from '../../modules/central-do-dia/components/dashboard/ResumoOperacionalDashboard.jsx'
import { useCentralDoDia } from '../../modules/central-do-dia/hooks/useCentralDoDia.js'
import PrioridadesFinanceirasPanel from './PrioridadesFinanceirasPanel.jsx'

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
  const contasPrioridades = useMemo(
    () => [...fonteFinanceira.registros, ...fonteVencidos.registros],
    [fonteFinanceira.registros, fonteVencidos.registros]
  )
  const resumoDashboard = useMemo(() => resumirDashboardFinanceiro(fonteFinanceira.registros, {
    dataBase: hoje,
    empresaId,
    filialId: filtroFilialDashboard,
    centroCustoId: filtroCentroDashboard,
    vencidosHistoricos: fonteVencidos.registros
  }), [empresaId, filtroCentroDashboard, filtroFilialDashboard, fonteFinanceira.registros, fonteVencidos.registros, hoje])
  const proximos90 = useMemo(
    () => resumirProximos90Dashboard(resumoDashboard.faixas),
    [resumoDashboard.faixas]
  )
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
    { label: 'Saldo projetado', valor: formatarValor(resumoDashboard.saldo), tone: 'warning', acao: () => navegarPara('relatorios') },
    { label: 'Vencido', valor: formatarValor(resumoDashboard.vencido), tone: 'danger', destino: 'vencidas' },
    { label: 'Vence hoje', valor: formatarValor(resumoDashboard.faixas.hoje.valor), tone: 'warning', destino: 'hoje' },
    { label: 'Próximos 7 dias', valor: formatarValor(resumoDashboard.faixas.proximos7.valor), tone: 'default', destino: 'proximos7' },
    { label: 'Próximos 90 dias', valor: formatarValor(proximos90.valor), tone: 'default', destino: 'proximos90Completo' }
  ]

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
                {resumoFinanceiro.map((item) => (item.destino || item.acao) ? (
                  <button
                    type="button"
                    className={`dashboard-home-kpi dashboard-home-kpi-${item.tone} is-action`}
                    key={item.label}
                    onClick={item.acao || (() => abrirContas(item.destino))}
                    aria-label={`${item.label}: ${item.valor}. ${item.acao ? 'Abrir relatórios financeiros.' : 'Abrir contas correspondentes.'}`}
                  >
                    <span>{item.label}</span>
                    <strong>{item.valor}</strong>
                  </button>
                ) : (
                  <div className={`dashboard-home-kpi dashboard-home-kpi-${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.valor}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContasContextualGuard>
      </section>

      <ContasContextualGuard
        carregando={fonteFinanceira.carregando || fonteVencidos.carregando}
        carregada={fonteFinanceira.carregado && fonteVencidos.carregado}
        erro={fonteFinanceira.erro || fonteVencidos.erro}
        onRetry={tentarNovamenteResumoFinanceiro}
      >
        <PrioridadesFinanceirasPanel
          contas={contasPrioridades}
          formatarValor={formatarValor}
          filialId={filtroFilialDashboard}
          centroCustoId={filtroCentroDashboard}
          onAbrirConta={(contaId) => navegarParaOrigemAgenda?.('conta', contaId)}
          onAbrirRelatorios={() => navegarPara('relatorios')}
          onAbrirImpostos={() => navegarPara('controle-impostos')}
          onAbrirRecorrencias={() => navegarPara('recorrencias')}
        />
      </ContasContextualGuard>
    </>
  )
}
