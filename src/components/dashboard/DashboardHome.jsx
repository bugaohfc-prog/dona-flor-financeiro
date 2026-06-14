import { SummarySkeleton, NotesSkeleton } from '../feedback/Skeletons.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useResumoGestaoPessoasPainel } from '../../hooks/useResumoGestaoPessoasPainel.js'

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
  styles,
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  contas,
  diferencaDias,
  navegarPara,
  formatarData,
  abrirConfirmacao,
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
  filiais = [],
  filtroFilial = '',
  setFiltroFilial = () => {},
}) {
  const { empresaId, perfilEmpresaAtiva } = useApp()
  const [mostrarResumoFinanceiro, setMostrarResumoFinanceiro] = useState(true)
  const [mostrarAgendaPainel, setMostrarAgendaPainel] = useState(true)
  const [mostrarPessoasPainel, setMostrarPessoasPainel] = useState(true)
  const valorSeguro = (valor) => Number(valor || 0)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const LIMITE_NOTAS_PAINEL = 5
  const perfilUsuario = String(perfilEmpresaAtiva || '').trim().toLowerCase()
  const podeAcessarGestaoPessoas = ['admin', 'master'].includes(perfilUsuario)
  const {
    loading: loadingResumoPessoas,
    erro: erroResumoPessoas,
    podeVisualizar: podeVisualizarResumoPessoas,
    resumo: resumoPessoas
  } = useResumoGestaoPessoasPainel({
    empresaId,
    perfilUsuario,
    podeAcessarGestaoPessoas
  })

  useEffect(() => {
    setMostrarNotas(true)
  }, [setMostrarNotas])

  function criarDataLocal(data) {
    const texto = String(data || '').slice(0, 10)
    if (!texto) return null
    const dataLocal = new Date(`${texto}T00:00:00`)
    return Number.isNaN(dataLocal.getTime()) ? null : dataLocal
  }

  function diferencaDiasNota(data) {
    const dataLocal = criarDataLocal(data)
    if (!dataLocal) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    dataLocal.setHours(0, 0, 0, 0)
    return Math.round((dataLocal.getTime() - hoje.getTime()) / 86400000)
  }

  function dataRecenteNota(nota) {
    return criarDataLocal(nota.atualizado_em || nota.updated_at || nota.criado_em || nota.created_at)
  }

  function prioridadeNotaPainel(nota, indice) {
    const prioridade = nota.prioridade || 'normal'
    const dias = diferencaDiasNota(nota.data_evento)
    const recente = dataRecenteNota(nota)?.getTime() || 0

    let grupo = 6
    if (prioridade === 'critico') grupo = 1
    else if (prioridade === 'urgente') grupo = 2
    else if (dias !== null && dias < 0) grupo = 3
    else if (dias === 0) grupo = 4
    else if (dias !== null && dias > 0 && dias <= 7) grupo = 5

    return {
      nota,
      grupo,
      dias: dias ?? 9999,
      recente,
      indice
    }
  }

  function statusFolhaPainel() {
    const status = String(resumoPessoas.folhaEmAberto?.status || '').trim().toLowerCase()
    if (status === 'em_conferencia') return 'Em conferência'
    return 'Pendente'
  }

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
  const resumoFinanceiro = [
    { label: 'Total', valor: formatarValor(total), detalhe: 'Previsto no período', tone: 'default' },
    { label: 'Pago', valor: formatarValor(pago), detalhe: 'Realizado', tone: 'success' },
    { label: 'Pendente', valor: formatarValor(pendente), detalhe: 'Ainda em aberto', tone: 'warning' },
    { label: 'Vencido', valor: formatarValor(vencido), detalhe: 'Atenção operacional', tone: 'danger' }
  ]
  const itensPessoas = useMemo(() => {
    const itens = []

    if (resumoPessoas.folhaEmAberto) {
      itens.push({
        id: 'folha-pendente',
        tipo: 'folha',
        titulo: `Folha: ${statusFolhaPainel()}`,
        descricao: `Competência ${resumoPessoas.folhaEmAberto.competencia || 'em aberto'}`,
        quantidade: '1',
        rotaDestino: 'fechamento-folha'
      })
    }

    if (resumoPessoas.examesVencidos > 0) {
      itens.push({
        id: 'exames-atrasados',
        tipo: 'exames',
        titulo: 'Exames atrasados',
        descricao: 'Pendências de acompanhamento',
        quantidade: resumoPessoas.examesVencidos,
        rotaDestino: 'relatorios-pessoas'
      })
    } else if (resumoPessoas.examesAVencer > 0) {
      itens.push({
        id: 'exames-a-vencer',
        tipo: 'exames',
        titulo: 'Exames a vencer',
        descricao: 'Próximos 30 dias',
        quantidade: resumoPessoas.examesAVencer,
        rotaDestino: 'relatorios-pessoas'
      })
    }

    if (resumoPessoas.feriasVencidas > 0) {
      itens.push({
        id: 'ferias-vencidas',
        tipo: 'ferias',
        titulo: 'Férias a vencer',
        descricao: 'Ciclos exigem revisão',
        quantidade: resumoPessoas.feriasVencidas,
        rotaDestino: 'relatorios-ferias'
      })
    } else if (resumoPessoas.feriasProximas > 0) {
      itens.push({
        id: 'ferias-proximas',
        tipo: 'ferias',
        titulo: 'Férias a vencer',
        descricao: 'Próximos 30 dias',
        quantidade: resumoPessoas.feriasProximas,
        rotaDestino: 'ferias'
      })
    }

    return itens.slice(0, 3)
  }, [resumoPessoas])
  const agendaEquipePessoas = useMemo(() => {
    return {
      id: 'agenda-equipe',
      titulo: 'Agenda da equipe',
      aniversarios: resumoPessoas.aniversariosSemana,
      equipeAtiva: resumoPessoas.funcionariosAtivos,
      rotaDestino: 'relatorios-pessoas'
    }
  }, [resumoPessoas.aniversariosSemana, resumoPessoas.funcionariosAtivos])
  const notasPainel = notasPendentes
    .map(prioridadeNotaPainel)
    .sort((a, b) => {
      if (a.grupo !== b.grupo) return a.grupo - b.grupo
      if (a.grupo <= 5 && a.dias !== b.dias) return a.dias - b.dias
      if (a.recente !== b.recente) return b.recente - a.recente
      return a.indice - b.indice
    })
    .slice(0, LIMITE_NOTAS_PAINEL)
    .map((item) => item.nota)

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

      <section className="dashboard-home-finance" aria-label="Resumo financeiro rápido">
        {loading ? (
          <SummarySkeleton items={4} />
        ) : (
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
        )}
      </section>

      {!loading && (
        <section className="dashboard-home-widgets no-print" aria-label="Widgets operacionais do painel">
          <article className="dashboard-home-card dashboard-home-widget">
            <DashboardWidgetHeader
              kicker="Agenda"
              title="Próximos vencimentos"
              badge={`${contasAgenda.length} abertas`}
              expanded={mostrarAgendaPainel}
              onToggle={() => setMostrarAgendaPainel((atual) => !atual)}
              label="Agenda"
            />

            {mostrarAgendaPainel && (
              <>
                <div className="dashboard-home-mini-grid">
                  <div className="dashboard-home-metric">
                    <span>Hoje</span>
                    <strong>{formatarValor(totalHoje)}</strong>
                  </div>
                  <div className="dashboard-home-metric">
                    <span>7 dias</span>
                    <strong>{formatarValor(totalSemana)}</strong>
                  </div>
                </div>

                {proximaConta ? (
                  <div className="dashboard-home-feature-item">
                    <span>Próximo compromisso</span>
                    <strong>{proximaConta.descricao}</strong>
                    <small>{formatarData(proximaConta.data_vencimento)} • {formatarValor(proximaConta.valor)}</small>
                  </div>
                ) : (
                  <div className="dashboard-home-empty">Agenda financeira limpa.</div>
                )}

                <div className="dashboard-home-actions">
                  <DashboardAction onClick={() => navegarPara('agenda')}>
                    Ver agenda
                  </DashboardAction>
                  <DashboardAction variant="secondary" onClick={() => navegarPara('contas')}>
                    Ver contas
                  </DashboardAction>
                </div>
              </>
            )}
          </article>

          {podeVisualizarResumoPessoas && (
            <article className="dashboard-home-card dashboard-home-widget dashboard-home-people-widget" aria-label="Resumo de Gestão de Pessoas">
              <DashboardWidgetHeader
                kicker="Gestão de Pessoas"
                title="Resumo da equipe"
                badge={`Equipe ativa: ${resumoPessoas.funcionariosAtivos}`}
                expanded={mostrarPessoasPainel}
                onToggle={() => setMostrarPessoasPainel((atual) => !atual)}
                label="Gestão de Pessoas"
              />

              {mostrarPessoasPainel && (
                loadingResumoPessoas ? (
                  <div className="dashboard-home-empty">Carregando resumo de pessoas...</div>
                ) : erroResumoPessoas ? (
                  <div className="dashboard-home-empty">Não foi possível carregar o resumo de Gestão de Pessoas.</div>
                ) : (
                  <div className="dashboard-home-people-grid">
                    {itensPessoas.length === 0 && (
                      <div className="dashboard-home-empty dashboard-home-people-empty">Sem alertas principais no momento.</div>
                    )}

                    {itensPessoas.map((item) => (
                      <button
                        className="dashboard-home-people-item"
                        key={item.id}
                        type="button"
                        onClick={() => item.rotaDestino && navegarPara(item.rotaDestino)}
                      >
                        <span>
                          <strong>{item.titulo}</strong>
                          <small>{item.descricao}</small>
                        </span>
                        <b className={`dashboard-home-count dashboard-home-count-${item.tipo}`}>{item.quantidade}</b>
                      </button>
                    ))}

                    <button
                      className="dashboard-home-team-row"
                      type="button"
                      onClick={() => agendaEquipePessoas.rotaDestino && navegarPara(agendaEquipePessoas.rotaDestino)}
                    >
                      <span>
                        <strong>{agendaEquipePessoas.titulo}</strong>
                        <small>Aniversariantes nos próximos 7 dias</small>
                      </span>
                      <b>{agendaEquipePessoas.aniversarios}</b>
                    </button>
                  </div>
                )
              )}
            </article>
          )}
        </section>
      )}

      {loading ? (
        <section className="content-block dashboard-home-notes-loading" style={styles.bloco}>
          <div className="notes-header-clean">
            <div>
              <h2 style={styles.subtitulo}>Notas</h2>
              <p style={styles.textoNota}>Carregando lembretes...</p>
            </div>
          </div>
          <NotesSkeleton items={2} />
        </section>
      ) : (
        <section className={`no-print dashboard-home-card dashboard-home-notes dashboard-notes-card ${mostrarNotas ? 'notes-expanded' : 'notes-collapsed'}`}>
          <div className="dashboard-home-notes-head">
            <DashboardWidgetHeader
              kicker="Notas/Pendências"
              title="Acompanhamento rápido"
              subtitle={(
                <span className="notes-stats-row">
                <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
                <span className="note-stat note-stat-critico">{notasCriticas} crítica(s)</span>
                <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
                </span>
              )}
              actions={(
                <DashboardAction variant="secondary" onClick={() => navegarPara('notas')}>
                  Ver notas
                </DashboardAction>
              )}
              expanded={mostrarNotas}
              onToggle={() => setMostrarNotas(!mostrarNotas)}
              label="Notas/Pendências"
            />
          </div>

          {mostrarNotas && notasPainel.length === 0 && (
            <p className="dashboard-home-empty-text">Nenhuma nota crítica ou urgente nos próximos dias.</p>
          )}

          {mostrarNotas && notasPainel.length > 0 && (
            <div className="dashboard-home-notes-list notes-list-dashboard">
              {notasPainel.map((nota) => {
                const prioridade = nota.prioridade || 'normal'
                return (
                  <div key={nota.id} className={`dashboard-home-note note-card-action note-card-${prioridade} dashboard-home-note-${prioridade} ${nota.concluida ? 'is-done' : ''}`}>
                    <div className="dashboard-home-note-top">
                      <strong>{nota.titulo}</strong>
                      <span className={`note-priority-badge note-priority-${prioridade}`}>
                        {prioridade === 'critico' ? 'Crítico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                      </span>
                    </div>

                    {nota.data_evento && <small className="note-event-date">Data: {formatarData(nota.data_evento)}</small>}

                    {nota.conteudo && <p>{nota.conteudo}</p>}

                    {podeEditarFinanceiro && (
                      <div className="dashboard-note-actions">
                        <DashboardAction className="dashboard-note-primary" onClick={() => alternarNotaConcluida(nota)}>
                          {nota.concluida ? 'Reabrir' : 'Concluir'}
                        </DashboardAction>
                        <DashboardAction className="dashboard-note-secondary" variant="secondary" onClick={() => abrirEdicaoNota(nota)}>
                          Editar
                        </DashboardAction>
                        <DashboardAction
                          className="dashboard-note-danger"
                          variant="danger"
                          onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}
                        >
                          Excluir
                        </DashboardAction>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </>
  )
}
