import { SummarySkeleton, NotesSkeleton } from '../feedback/Skeletons.jsx'
import { useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useResumoGestaoPessoasPainel } from '../../hooks/useResumoGestaoPessoasPainel.js'

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
  const valorSeguro = (valor) => Number(valor || 0)
  const filialSelecionada = (filiais || []).find((filial) => filial.id === filtroFilial)
  const LIMITE_NOTAS_PAINEL = 5
  const operacionalCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 18
  }
  const agendaCardStyle = {
    ...operacionalCardStyle,
    minHeight: 236
  }
  const gestaoPessoasCardStyle = {
    ...operacionalCardStyle,
    alignSelf: 'flex-start',
    flex: '0 0 auto',
    gap: 10,
    gridRow: 'auto',
    height: 'auto',
    maxHeight: 'none',
    minHeight: 0,
    width: '100%'
  }
  const operacionalHeaderStyle = {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 46
  }
  const operacionalBadgeStyle = {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    minHeight: 34,
    padding: '7px 12px'
  }
  const operacionalItemStyle = {
    alignItems: 'flex-start',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 58,
    padding: '10px 12px'
  }
  const gestaoPessoasItemStyle = {
    ...operacionalItemStyle,
    justifyContent: 'flex-start',
    minHeight: 'auto',
    padding: '9px 11px'
  }
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
        titulo: 'Exames Atrasados',
        descricao: 'Pendências de acompanhamento',
        quantidade: resumoPessoas.examesVencidos,
        rotaDestino: 'relatorios-pessoas'
      })
    } else if (resumoPessoas.examesAVencer > 0) {
      itens.push({
        id: 'exames-a-vencer',
        tipo: 'exames',
        titulo: 'Exames a Vencer',
        descricao: 'Próximos 30 dias',
        quantidade: resumoPessoas.examesAVencer,
        rotaDestino: 'relatorios-pessoas'
      })
    }

    if (resumoPessoas.feriasVencidas > 0) {
      itens.push({
        id: 'ferias-vencidas',
        tipo: 'ferias',
        titulo: 'Férias a Vencer',
        descricao: 'Ciclos exigem revisão',
        quantidade: resumoPessoas.feriasVencidas,
        rotaDestino: 'relatorios-ferias'
      })
    } else if (resumoPessoas.feriasProximas > 0) {
      itens.push({
        id: 'ferias-proximas',
        tipo: 'ferias',
        titulo: 'Férias a Vencer',
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
      <style>{`
        .dashboard-notes-card .note-toggle-small {
          border-radius: 999px !important;
          font-size: 15px !important;
          font-weight: 900 !important;
          line-height: 1 !important;
        }
        .dashboard-note-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .dashboard-note-actions button {
          width: auto !important;
          min-width: 0 !important;
          min-height: 30px !important;
          padding: 6px 10px !important;
          border-radius: 999px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          box-shadow: none !important;
        }
        .dashboard-note-actions .dashboard-note-secondary,
        .dashboard-note-actions .dashboard-note-danger {
          opacity: 0.78;
        }
        .dashboard-note-actions .dashboard-note-secondary {
          background: #ffffff !important;
          color: #475569 !important;
          border: 1px solid #cbd5e1 !important;
        }
        .dashboard-note-actions .dashboard-note-danger {
          background: #fffafa !important;
          color: #991b1b !important;
          border: 1px solid #fecaca !important;
        }
        @media (max-width: 640px) {
          .dashboard-notes-card {
            padding: 12px !important;
          }
          .dashboard-notes-card .notes-header-clean {
            gap: 8px !important;
            margin-bottom: 10px !important;
          }
          .dashboard-notes-card .notes-title {
            font-size: 15px !important;
          }
          .dashboard-notes-card .notes-stats-row {
            gap: 5px !important;
          }
          .dashboard-notes-card .note-stat {
            font-size: 10.5px !important;
            padding: 4px 7px !important;
          }
          .dashboard-notes-card .dashboard-see-all-link {
            min-height: 30px !important;
            padding: 5px 9px !important;
            font-size: 11px !important;
          }
          .dashboard-notes-card .note-toggle-small {
            width: 30px !important;
            min-width: 30px !important;
            height: 30px !important;
            min-height: 30px !important;
            padding: 0 !important;
          }
          .dashboard-notes-card .note-card-action {
            padding: 12px !important;
          }
          .dashboard-notes-card .note-card-action p {
            font-size: 12px !important;
            line-height: 1.38 !important;
            margin-top: 6px !important;
          }
          .dashboard-note-actions {
            gap: 5px;
            margin-top: 7px;
          }
          .dashboard-note-actions button {
            min-height: 28px !important;
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          .dashboard-note-actions .dashboard-note-secondary,
          .dashboard-note-actions .dashboard-note-danger {
            padding-inline: 7px !important;
          }
        }
      `}</style>
      <section className="dashboard-branch-filter no-print" aria-label="Filtro de filial do painel">
        <div className="dashboard-branch-filter-card">
          <div>
            <span className="analytics-kicker">Visão por filial</span>
            <strong>{filialSelecionada ? filialSelecionada.nome : 'Todas as filiais'}</strong>
            <small>O resumo e os próximos vencimentos respeitam a filial selecionada.</small>
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
              border: '1px solid #dbe7e3',
              borderRadius: 18,
              padding: 14,
              marginBottom: 12,
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <span style={{ color: '#0f766e', fontSize: 12, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase' }}>Resumo financeiro rápido</span>
              <button
                type="button"
                onClick={() => navegarPara('relatorios')}
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  borderRadius: 999,
                  color: '#0f766e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 10px'
                }}
              >
                Ver Análise Financeira
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8
              }}
            >
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Total</span>
                <strong style={{ color: '#111827', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(total)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Pago</span>
                <strong style={{ color: '#166534', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(pago)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Pendente</span>
                <strong style={{ color: '#92400e', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(pendente)}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 12, padding: '9px 10px', minWidth: 0 }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Vencido</span>
                <strong style={{ color: '#991b1b', display: 'block', fontSize: 15, lineHeight: 1.25, marginTop: 3 }}>{formatarValor(vencido)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {!loading && (
        <section className="dashboard-operational-grid dashboard-analytics-grid no-print" style={{ alignItems: 'flex-start' }}>
          <div className="dashboard-analytics-card executive-agenda-widget" style={agendaCardStyle}>
            <div className="analytics-card-header" style={operacionalHeaderStyle}>
              <div>
                <span className="analytics-kicker">Agenda</span>
                <strong>Próximos vencimentos</strong>
              </div>
              <span className="analytics-badge neutral" style={operacionalBadgeStyle}>{contasAgenda.length} abertas</span>
            </div>

            <div className="executive-agenda-metrics" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div style={operacionalItemStyle}>
                <small>Hoje</small>
                <strong>{formatarValor(totalHoje)}</strong>
              </div>
              <div style={operacionalItemStyle}>
                <small>7 dias</small>
                <strong>{formatarValor(totalSemana)}</strong>
              </div>
            </div>

            {proximaConta ? (
              <div className="executive-agenda-next" style={operacionalItemStyle}>
                <span>Próximo compromisso</span>
                <strong>{proximaConta.descricao}</strong>
                <small>{formatarData(proximaConta.data_vencimento)} • {formatarValor(proximaConta.valor)}</small>
              </div>
            ) : (
              <div className="analytics-empty executive-agenda-empty" style={{ ...operacionalItemStyle, alignItems: 'center' }}>Agenda financeira limpa.</div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
              <button className="executive-agenda-cta" style={{ flex: '1 1 140px' }} onClick={() => navegarPara('agenda')}>Ver agenda</button>
              <button
                className="executive-agenda-cta"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: 'none',
                  color: '#0f172a',
                  flex: '0 1 auto',
                  minWidth: 0,
                  opacity: 1,
                  paddingInline: 12
                }}
                onClick={() => navegarPara('contas')}
              >
                Ver contas
              </button>
            </div>
          </div>

          {podeVisualizarResumoPessoas && (
            <div className="dashboard-people-card dashboard-analytics-card" style={gestaoPessoasCardStyle} aria-label="Resumo de Gestão de Pessoas">
              <div className="analytics-card-header" style={operacionalHeaderStyle}>
                <div>
                  <span className="analytics-kicker">Gestão de Pessoas</span>
                  <strong>Resumo da equipe</strong>
                </div>
                <span className="analytics-badge neutral" style={operacionalBadgeStyle}>Equipe Ativa: {resumoPessoas.funcionariosAtivos}</span>
              </div>

              {loadingResumoPessoas ? (
                <div className="dashboard-people-item analytics-empty" style={{ ...gestaoPessoasItemStyle, alignItems: 'center' }}>Carregando resumo de pessoas...</div>
              ) : erroResumoPessoas ? (
                <div className="dashboard-people-item analytics-empty" style={{ ...gestaoPessoasItemStyle, alignItems: 'center' }}>Não foi possível carregar o resumo de Gestão de Pessoas.</div>
              ) : (
                <>
                  {itensPessoas.length === 0 ? (
                    <div className="dashboard-people-item analytics-empty" style={{ ...gestaoPessoasItemStyle, alignItems: 'center' }}>{'Sem alertas principais no momento.'}</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                      {itensPessoas.map((item) => (
                        <button
                          className="dashboard-people-item"
                          key={item.id}
                          type="button"
                          onClick={() => item.rotaDestino && navegarPara(item.rotaDestino)}
                          style={{
                            background: '#f8fafc',
                            color: '#111827',
                            cursor: item.rotaDestino ? 'pointer' : 'default',
                            textAlign: 'left',
                            gap: 8,
                            ...gestaoPessoasItemStyle
                          }}
                        >
                          <span style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%' }}>
                            <strong style={{ display: 'block', fontSize: 13, lineHeight: 1.2 }}>{item.titulo}</strong>
                            <span style={{
                              background: item.tipo === 'folha' ? '#fef3c7' : item.tipo === 'exames' ? '#fee2e2' : '#e0f2fe',
                              border: '1px solid rgba(15, 23, 42, .08)',
                              borderRadius: 999,
                              color: item.tipo === 'folha' ? '#92400e' : item.tipo === 'exames' ? '#991b1b' : '#0369a1',
                              flex: '0 0 auto',
                              fontSize: 12,
                              fontWeight: 900,
                              lineHeight: 1,
                              padding: '5px 8px'
                            }}>
                              {item.quantidade}
                            </span>
                          </span>
                          <small style={{ color: '#64748b', display: 'block', fontSize: 12, lineHeight: 1.35 }}>{item.descricao}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="dashboard-people-item"
                    type="button"
                    onClick={() => agendaEquipePessoas.rotaDestino && navegarPara(agendaEquipePessoas.rotaDestino)}
                    style={{
                      ...gestaoPessoasItemStyle,
                      alignItems: 'center',
                      background: '#ffffff',
                      borderStyle: 'dashed',
                      color: '#334155',
                      cursor: agendaEquipePessoas.rotaDestino ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 10,
                      justifyContent: 'space-between',
                      marginTop: 2,
                      textAlign: 'left'
                    }}
                  >
                    <span>
                      <strong style={{ display: 'block', fontSize: 12 }}>{agendaEquipePessoas.titulo}</strong>
                      <small style={{ color: '#64748b', display: 'block', marginTop: 2 }}>Aniversariantes nos próximos 7 dias</small>
                    </span>
                    <span style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 999,
                      color: '#475569',
                      flex: '0 0 auto',
                      fontSize: 12,
                      fontWeight: 900,
                      padding: '5px 9px'
                    }}>
                      Aniversariantes: {agendaEquipePessoas.aniversarios}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </section>
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
        <section className={`no-print dashboard-notes-card ${mostrarNotas ? 'notes-expanded' : 'notes-collapsed'}`} style={{ marginTop: 16, padding: 18 }}>
          <div style={{ ...styles.notasHeaderNovo, alignItems: 'flex-start', gap: 12, marginBottom: mostrarNotas ? 14 : 0 }} className="notes-header-clean dashboard-notes-content">
            <div className="notes-title-wrap">
              <strong className="notes-title">{'Notas e pend\u00eancias'}</strong>
              <div className="notes-stats-row">
                <span className="note-stat note-stat-pendente">{notasPendentes.length} pendente(s)</span>
                <span className="note-stat note-stat-critico">{notasCriticas} {'cr\u00edtica(s)'}</span>
                <span className="note-stat note-stat-urgente">{notasUrgentes} urgente(s)</span>
              </div>
            </div>
            <div className="notes-header-actions">
              <button className="dashboard-see-all-link" type="button" onClick={() => navegarPara('notas')}>Ver notas</button>
              <button
                className="note-toggle-small"
                type="button"
                onClick={() => setMostrarNotas(!mostrarNotas)}
                title={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
                aria-label={mostrarNotas ? 'Recolher bloco de notas' : 'Expandir bloco de notas'}
              >
                {mostrarNotas ? '▴' : '▾'}
              </button>
            </div>
          </div>

          {mostrarNotas && notasPainel.length === 0 && (
            <p style={styles.mensagemVazia}>{'Nenhuma nota cr\u00edtica ou urgente nos pr\u00f3ximos dias.'}</p>
          )}

          {mostrarNotas && notasPainel.length > 0 && (
            <div style={styles.notasListaNova} className="notes-list-dashboard">
              {notasPainel.map((nota) => {
                const prioridade = nota.prioridade || 'normal'
                return (
                  <div key={nota.id} className={`note-card-action note-card-${prioridade}`} style={{ ...styles.cardNotaAcao, ...(prioridade === 'critico' ? styles.cardNotaCritico : prioridade === 'urgente' ? styles.cardNotaUrgente : styles.cardNotaNormal), opacity: nota.concluida ? 0.65 : 1 }}>
                    <div style={styles.cardTopo}>
                      <strong style={{ textDecoration: nota.concluida ? 'line-through' : 'none' }}>{nota.titulo}</strong>
                      <span className={`note-priority-badge note-priority-${prioridade}`} style={{ ...styles.badgePrioridade, ...(prioridade === 'critico' ? styles.badgeCritico : prioridade === 'urgente' ? styles.badgeUrgente : styles.badgeNormal) }}>
                        {prioridade === 'critico' ? 'Cr\u00edtico' : prioridade === 'urgente' ? 'Urgente' : 'Normal'}
                      </span>
                    </div>

                    {nota.data_evento && <small className="note-event-date">Data: {formatarData(nota.data_evento)}</small>}

                    {nota.conteudo && <p style={styles.textoNota}>{nota.conteudo}</p>}

                    {podeEditarFinanceiro && (
                      <div className="dashboard-note-actions">
                        <button className="dashboard-note-primary" style={styles.btnPago} onClick={() => alternarNotaConcluida(nota)}>{nota.concluida ? 'Reabrir' : 'Concluir'}</button>
                        <button className="dashboard-note-secondary" style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
                        <button className="dashboard-note-danger" style={styles.btnExcluir} onClick={() => abrirConfirmacao({ titulo: 'Mover nota para lixeira', mensagem: `Deseja mover a nota ${nota.titulo} para a lixeira? Ela ficar\u00e1 em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirNota(nota.id) })}>Excluir</button>
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
