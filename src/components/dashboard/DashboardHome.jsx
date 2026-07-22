import ContasContextualGuard from '../feedback/ContasContextualGuard.jsx'
import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useRelatorioFinanceiro } from '../../hooks/useRelatorioFinanceiro.js'
import { criarPeriodoConsultaDashboard, resumirDashboardFinanceiro } from '../../utils/consumidoresFinanceiros.js'
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
  filtroFilial = '',
  setFiltroFilial = () => {},
  contasCentral = [],
  notasCentral = [],
  onAtualizarContasCentral,
  onAtualizarNotasCentral,
  navegarParaOrigemAgenda,
}) {
  const { empresaId, perfilEmpresaAtiva } = useApp()
  const [mostrarResumoFinanceiro, setMostrarResumoFinanceiro] = useState(true)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const perfilUsuario = String(perfilEmpresaAtiva || '').trim().toLowerCase()
  const podeAcessarGestaoPessoas = ['admin', 'master'].includes(perfilUsuario)
  const hoje = useMemo(() => {
    const data = new Date()
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
  }, [])
  const criteriosFinanceiros = useMemo(() => ({
    ...criarPeriodoConsultaDashboard(hoje),
    base: 'vencimento',
    status: 'todas',
    filialId: filtroFilial,
    centroCustoId: '',
    origem: 'todas',
    incluirOcultas: false,
    busca: '',
    hoje
  }), [filtroFilial, hoje])
  const fonteFinanceira = useRelatorioFinanceiro({ empresaId, criterios: criteriosFinanceiros })
  const resumoDashboard = useMemo(() => resumirDashboardFinanceiro(fonteFinanceira.registros, {
    dataBase: hoje,
    empresaId,
    filialId: filtroFilial
  }), [empresaId, filtroFilial, fonteFinanceira.registros, hoje])
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
    filialId: filtroFilial,
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
    { label: 'Vencido', valor: formatarValor(resumoDashboard.vencido), detalhe: 'Saldo vencido', tone: 'danger' },
    { label: 'Próximos 7 dias', valor: formatarValor(resumoDashboard.faixas.proximos7.valor), detalhe: 'De amanhã até o 7º dia', tone: 'default' },
    { label: 'Próximos 30 dias', valor: formatarValor(resumoDashboard.faixas.proximos30.valor), detalhe: 'Do 8º ao 30º dia', tone: 'default' },
    { label: 'Próximos 90 dias', valor: formatarValor(resumoDashboard.faixas.proximos90.valor), detalhe: 'Do 31º ao 90º dia', tone: 'default' }
  ]

  async function atualizarDashboard() {
    await Promise.all([dadosCentral.atualizar(), fonteFinanceira.consultar()])
  }

  return (
    <>
      <section className="dashboard-home-branch no-print" aria-label="Filtro de filial do painel">
        <div className="dashboard-home-branch-copy">
          <span className="dashboard-home-kicker">Visão por filial</span>
          <strong>{filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}</strong>
          <small>Resumo e próximos vencimentos respeitam o filtro selecionado.</small>
        </div>

        <select
          className="dashboard-home-select"
          value={filtroFilial}
          onChange={(e) => setFiltroFilial(e.target.value)}
          aria-label="Filtrar painel por filial"
        >
          <option value="">Todas as filiais</option>
          {(filiais || []).map((filial) => (
            <option key={filial.id} value={filial.id}>{filial.nome}</option>
          ))}
        </select>
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
          carregando={fonteFinanceira.carregando}
          carregada={fonteFinanceira.carregado}
          erro={fonteFinanceira.erro}
          onRetry={fonteFinanceira.consultar}
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
                {resumoFinanceiro.map((item) => (
                  <div className={`dashboard-home-kpi dashboard-home-kpi-${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.valor}</strong>
                    <small>{item.detalhe}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContasContextualGuard>
      </section>
    </>
  )
}
