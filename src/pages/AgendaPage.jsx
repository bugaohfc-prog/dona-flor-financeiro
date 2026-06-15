import { useMemo, useState } from 'react'
import { calcularProximoPeriodico } from '../services/funcionariosExamesPeriodicosService'

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function criarDataLocal(dataISO) {
  const texto = String(dataISO || '').slice(0, 10)
  const partes = texto.split('-').map(Number)
  if (partes.length !== 3 || partes.some((parte) => !parte)) return null

  const [ano, mes, dia] = partes
  const data = new Date(ano, mes - 1, dia)
  return Number.isNaN(data.getTime()) ? null : data
}

function formatarISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function obterAniversarioAtual(dataNascimento) {
  const nascimento = criarDataLocal(dataNascimento)
  if (!nascimento) return null

  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const aniversario = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate())

  if (aniversario < inicioHoje) return null
  return formatarISO(aniversario)
}

function obterUltimoDiaCompetencia(competencia) {
  const texto = String(competencia || '').trim()
  const match = texto.match(/^(\d{4})-(\d{2})/)
  if (!match) return null

  const ano = Number(match[1])
  const mes = Number(match[2])
  if (!ano || !mes || mes < 1 || mes > 12) return null

  return formatarISO(new Date(ano, mes, 0))
}

function formatarCompetencia(competencia) {
  const texto = String(competencia || '').trim()
  const match = texto.match(/^(\d{4})-(\d{2})/)
  if (!match) return texto || 'Competencia'

  return `${match[2]}/${match[1]}`
}

function formatarStatusFolha(status) {
  if (status === 'em_conferencia') return 'Folha em conferência'
  if (status === 'pendente') return 'Folha pendente'
  return 'Folha em aberto'
}

function CardAgenda({
  styles,
  titulo,
  resumo,
  lista,
  cor,
  formatarValor,
  formatarData,
  diferencaDias,
  navegarPara,
  navegarParaOrigemAgenda,
  podeEditarFinanceiro
}) {
  return (
    <section className="agenda-group-card">
      <div className="agenda-group-head">
        <strong>{titulo}</strong>
        <span>{resumo}</span>
      </div>

      {lista.length === 0 && (
        <EmptyState icon="✓" title="Agenda limpa" description="Não há eventos neste grupo no momento." />
      )}

      {lista.map((evento) => {
        const dias = diferencaDias(evento.data)
        const ehNota = evento.tipo === 'nota'
        const ehPessoa = evento.tipo === 'pessoa'
        const ehFerias = evento.categoria === 'ferias'
        const ehExame = evento.categoria === 'exame'
        const ehFolha = evento.categoria === 'folha'
        const ehRh = ehPessoa || ehFerias || ehExame || ehFolha

        return (
          <div
            key={evento.chave}
            className={`agenda-event-item ${ehRh ? 'agenda-event-item-rh' : ''}`}
            style={{ '--agenda-event-color': cor }}
          >
            <div className="agenda-event-main">
              <div className="agenda-event-title">
                <strong>{evento.titulo}</strong>
                <span className={`agenda-event-badge agenda-event-badge-${evento.categoria || evento.tipo}`}>
                  {ehFolha ? 'Folha' : ehExame ? 'Exame' : ehFerias ? 'Férias' : ehPessoa ? 'Aniversário' : ehNota ? 'Nota' : 'Conta'}
                </span>
              </div>

              <div className="agenda-event-info">
                {formatarData(evento.data)} • {evento.descricaoSecundaria}
                {ehFerias && evento.dataFim ? ` • Fim: ${formatarData(evento.dataFim)}` : ''}
                {ehFerias && evento.dataRetorno ? ` • Retorno: ${formatarData(evento.dataRetorno)}` : ''}
              </div>

              <small style={dias < 0 ? styles.textoVencidoAgenda : styles.textoAgenda}>
                {ehExame
                  ? dias < 0
                    ? `Exame atrasado há ${Math.abs(dias)} dia(s)`
                    : dias === 0
                      ? 'Exame previsto para hoje'
                      : `Exame a vencer em ${dias} dia(s)`
                  : ehFolha
                  ? dias < 0
                    ? `Prazo gerencial vencido há ${Math.abs(dias)} dia(s)`
                    : dias === 0
                      ? 'Prazo gerencial para hoje'
                      : `Prazo gerencial em ${dias} dia(s)`
                  : ehFerias
                  ? dias === 0
                    ? 'Férias começam hoje'
                    : `Férias começam em ${dias} dia(s)`
                  : ehPessoa
                    ? dias === 0
                      ? 'Aniversário hoje'
                      : `Aniversário em ${dias} dia(s)`
                    : dias < 0
                      ? `${ehNota ? 'Atrasada' : 'Vencida'} há ${Math.abs(dias)} dia(s)`
                      : dias === 0
                        ? `${ehNota ? 'Para hoje' : 'Vence hoje'}`
                        : ehNota
                          ? `Para daqui ${dias} ${dias === 1 ? 'dia' : 'dias'}`
                          : `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
              </small>
            </div>

            <div className="agenda-event-side">
              {!ehNota && !ehPessoa && <strong>{formatarValor(evento.valor)}</strong>}

              {!ehNota && !ehPessoa && podeEditarFinanceiro && (
                <button className="agenda-event-action agenda-event-action-context" style={styles.btnPago} onClick={() => navegarParaOrigemAgenda('conta', evento.id)}>
                  Ver em Contas
                </button>
              )}

              {ehNota && (
                <button className="agenda-event-action agenda-event-action-context" style={styles.btnPago} onClick={() => navegarParaOrigemAgenda('nota', evento.id)}>
                  Ver em Notas
                </button>
              )}

              {ehPessoa && !ehFerias && !ehExame && !ehFolha && (
                <button className="agenda-event-action agenda-event-action-context agenda-event-action-rh" style={styles.btnPago} onClick={() => navegarPara('relatorios-pessoas')}>
                  Ver em Pessoas
                </button>
              )}

              {ehFerias && (
                <button className="agenda-event-action agenda-event-action-context agenda-event-action-rh" style={styles.btnPago} onClick={() => navegarPara('ferias')}>
                  Ver em Férias
                </button>
              )}

              {ehExame && (
                <button className="agenda-event-action agenda-event-action-context agenda-event-action-rh" style={styles.btnPago} onClick={() => navegarPara('relatorios-pessoas')}>
                  Ver em Pessoas
                </button>
              )}

              {ehFolha && (
                <button className="agenda-event-action agenda-event-action-context agenda-event-action-rh" style={styles.btnPago} onClick={() => navegarPara('fechamento-folha')}>
                  Ver folha
                </button>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function AgendaPage({
  styles,
  contas = [],
  notas = [],
  funcionarios = [],
  loadingFuncionarios = false,
  feriasAgendadas = [],
  loadingFerias = false,
  examesPeriodicos = [],
  loadingExames = false,
  competenciasFolha = [],
  loadingFolha = false,
  formatarValor,
  formatarData,
  dataLocal,
  diferencaDias,
  mesmoMesAtual,
  navegarPara,
  navegarParaOrigemAgenda,
  podeEditarFinanceiro = true
}) {
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [mostrarMesCompleto, setMostrarMesCompleto] = useState(false)

  const contasAgenda = useMemo(() => {
    return contas
      .filter((conta) => conta.status !== 'pago')
      .map((conta) => ({
        ...conta,
        chave: `conta-${conta.id}`,
        tipo: 'conta',
        data: conta.data_vencimento,
        titulo: conta.descricao,
        descricaoSecundaria: conta.df_centros_custo?.nome || 'Sem centro',
        valor: Number(conta.valor || 0)
      }))
  }, [contas])

  const notasAgenda = useMemo(() => {
    return notas
      .filter((nota) => !nota.concluida && nota.data_evento)
      .map((nota) => ({
        ...nota,
        chave: `nota-${nota.id}`,
        tipo: 'nota',
        data: nota.data_evento,
        titulo: nota.titulo,
        descricaoSecundaria: `Notas e pendências${nota.prioridade ? ` • ${nota.prioridade}` : ''}`,
        valor: 0
      }))
  }, [notas])

  const aniversariosAgenda = useMemo(() => {
    return funcionarios
      .filter((funcionario) => !funcionario.arquivado && funcionario.status === 'ativo')
      .map((funcionario) => {
        const dataAniversario = obterAniversarioAtual(funcionario.data_nascimento)
        if (!dataAniversario) return null

        return {
          id: funcionario.id,
          chave: `pessoa-aniversario-${funcionario.id}`,
          tipo: 'pessoa',
          data: dataAniversario,
          titulo: funcionario.nome,
          descricaoSecundaria: `Aniversário${funcionario.cargo ? ` • ${funcionario.cargo}` : ''}`,
          valor: 0
        }
      })
      .filter(Boolean)
  }, [funcionarios])

  const funcionariosPorId = useMemo(() => {
    return (funcionarios || []).reduce((mapa, funcionario) => {
      if (funcionario?.id) mapa.set(funcionario.id, funcionario)
      return mapa
    }, new Map())
  }, [funcionarios])

  const feriasAgenda = useMemo(() => {
    return feriasAgendadas
      .filter((periodo) => periodo?.data_inicio && periodo.status === 'agendada' && !periodo.arquivado)
      .map((periodo) => {
        const funcionario = funcionariosPorId.get(periodo.funcionario_id)
        const nome = funcionario?.nome || 'Colaborador'
        const cargo = funcionario?.cargo

        return {
          id: periodo.id,
          chave: `pessoa-ferias-${periodo.id}`,
          tipo: 'pessoa',
          categoria: 'ferias',
          data: periodo.data_inicio,
          dataFim: periodo.data_fim_calculada,
          dataRetorno: periodo.data_retorno_trabalho,
          titulo: nome,
          descricaoSecundaria: `Férias agendadas${cargo ? ` • ${cargo}` : ''}`,
          valor: 0
        }
      })
  }, [feriasAgendadas, funcionariosPorId])

  const ultimoExamePorFuncionario = useMemo(() => {
    return (examesPeriodicos || []).reduce((mapa, exame) => {
      if (!exame?.funcionario_id || !exame.data_exame || exame.arquivado) return mapa

      const atual = mapa.get(exame.funcionario_id)
      if (!atual || String(exame.data_exame).localeCompare(String(atual.data_exame || '')) > 0) {
        mapa.set(exame.funcionario_id, exame)
      }

      return mapa
    }, new Map())
  }, [examesPeriodicos])

  const examesAgenda = useMemo(() => {
    return (funcionarios || [])
      .filter((funcionario) => !funcionario.arquivado && funcionario.status === 'ativo')
      .map((funcionario) => {
        const ultimoExame = ultimoExamePorFuncionario.get(funcionario.id)
        const dataBase = ultimoExame?.data_exame || funcionario.data_exame_admissional
        const dataPrevista = calcularProximoPeriodico(dataBase)
        if (!dataPrevista) return null

        const dias = diferencaDias(dataPrevista)
        const cargo = funcionario?.cargo

        return {
          id: funcionario.id,
          chave: `pessoa-exame-${funcionario.id}`,
          tipo: 'pessoa',
          categoria: 'exame',
          data: dataPrevista,
          titulo: funcionario.nome || 'Colaborador',
          descricaoSecundaria: `${dias < 0 ? 'Exame atrasado' : 'Exame a vencer'}${cargo ? ` • ${cargo}` : ''}`,
          valor: 0
        }
      })
      .filter(Boolean)
  }, [diferencaDias, examesPeriodicos, funcionarios, ultimoExamePorFuncionario])

  const folhaAgenda = useMemo(() => {
    const statusPermitidos = new Set(['aberta', 'em_conferencia', 'pendente'])

    return (competenciasFolha || [])
      .filter((competencia) => competencia?.competencia && !competencia.arquivado && statusPermitidos.has(competencia.status))
      .map((competencia) => {
        const dataPrazo = obterUltimoDiaCompetencia(competencia.competencia)
        if (!dataPrazo) return null

        return {
          id: competencia.id,
          chave: `pessoa-folha-${competencia.id}`,
          tipo: 'pessoa',
          categoria: 'folha',
          data: dataPrazo,
          titulo: formatarStatusFolha(competencia.status),
          descricaoSecundaria: `Competência ${formatarCompetencia(competencia.competencia)}`,
          valor: 0
        }
      })
      .filter(Boolean)
  }, [competenciasFolha])

  const eventosAgenda = useMemo(() => {
    return [...contasAgenda, ...notasAgenda, ...aniversariosAgenda, ...feriasAgenda, ...examesAgenda, ...folhaAgenda]
      .filter((evento) => filtroTipo === 'todas' || evento.tipo === filtroTipo)
      .sort((a, b) => dataLocal(a.data) - dataLocal(b.data))
  }, [contasAgenda, notasAgenda, aniversariosAgenda, feriasAgenda, examesAgenda, folhaAgenda, filtroTipo, dataLocal])

  const mostrarLoadingPessoas = loadingFuncionarios && (filtroTipo === 'todas' || filtroTipo === 'pessoa')
  const mostrarLoadingFerias = loadingFerias && (filtroTipo === 'todas' || filtroTipo === 'pessoa')
  const mostrarLoadingExames = loadingExames && (filtroTipo === 'todas' || filtroTipo === 'pessoa')
  const mostrarLoadingFolha = loadingFolha && (filtroTipo === 'todas' || filtroTipo === 'pessoa')

  const eventosVencidos = eventosAgenda.filter((evento) => (
    (evento.tipo !== 'pessoa' || evento.categoria === 'exame' || evento.categoria === 'folha') && diferencaDias(evento.data) < 0
  ))
  const eventosHoje = eventosAgenda.filter((evento) => diferencaDias(evento.data) === 0)
  const eventosSemana = eventosAgenda.filter((evento) => {
    const dias = diferencaDias(evento.data)
    return dias > 0 && dias <= 7
  })
  const eventosMes = eventosAgenda.filter((evento) => {
    const dias = diferencaDias(evento.data)
    return dias > 7 && mesmoMesAtual(evento.data)
  })

  const somarContas = (lista) => lista.reduce((acc, evento) => {
    return acc + (evento.tipo === 'conta' ? Number(evento.valor || 0) : 0)
  }, 0)
  const contarTipo = (lista, tipo) => lista.filter((evento) => evento.tipo === tipo).length
  const formatarNotas = (quantidade) => `${quantidade} nota(s)`
  const formatarPessoas = (quantidade) => `${quantidade} evento(s)`
  const formatarResumo = (lista) => {
    const totalContas = somarContas(lista)
    const totalNotas = contarTipo(lista, 'nota')
    const totalPessoas = contarTipo(lista, 'pessoa')

    if (filtroTipo === 'pessoa') return formatarPessoas(totalPessoas)
    if (filtroTipo === 'nota') return formatarNotas(totalNotas)
    if (filtroTipo === 'conta') return formatarValor(totalContas)
    return `${formatarValor(totalContas)} em contas • ${formatarNotas(totalNotas)} • ${formatarPessoas(totalPessoas)}`
  }

  const tituloVencidos = filtroTipo === 'nota'
    ? 'Atrasadas'
    : filtroTipo === 'conta'
      ? 'Vencidas'
      : 'Vencidas/Atrasadas'
  const tituloGrupoVencidos = filtroTipo === 'conta' ? '🚨 Vencidas' : '🚨 Vencidas / atrasadas'

  const filtrosTipo = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'conta', label: 'Contas' },
    { valor: 'nota', label: 'Notas' },
    { valor: 'pessoa', label: 'Pessoas' }
  ]

  const gruposBase = [
    { chave: 'vencidas', label: tituloVencidos, titulo: tituloGrupoVencidos, lista: eventosVencidos, cor: '#dc3545', style: styles.boxVencido },
    { chave: 'hoje', label: 'Hoje', titulo: '📌 Hoje', lista: eventosHoje, cor: '#ffc107', style: styles.boxPendente },
    { chave: 'semana', label: '7 dias', titulo: '🗓️ Próximos 7 dias', lista: eventosSemana, cor: '#0d6efd', style: styles.boxTotal },
    { chave: 'mes', label: 'Mês', titulo: '📆 Restante do mês', lista: eventosMes, cor: '#14b8a6', style: styles.boxPago }
  ]
  const grupos = gruposBase

  return (
    <main className="agenda-page">
      <style>{`
        .agenda-type-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0 14px;
        }
        .agenda-type-tab {
          border: 1px solid #dbe3ef;
          background: #ffffff;
          color: #334155;
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .agenda-type-tab-active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .agenda-event-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .agenda-event-item {
          min-width: 0;
        }
        .agenda-event-item-rh {
          gap: 10px !important;
          padding: 10px 12px !important;
          align-items: center !important;
        }
        .agenda-event-item-rh .agenda-event-main {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .agenda-event-item-rh .agenda-event-title {
          gap: 6px;
        }
        .agenda-event-item-rh .agenda-event-title strong {
          font-size: 14px;
          line-height: 1.2;
        }
        .agenda-event-item-rh small {
          line-height: 1.25;
        }
        .agenda-event-badge {
          border-radius: 999px;
          padding: 3px 7px;
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          border: 1px solid transparent;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .agenda-event-badge-conta {
          background: #e0f2fe;
          color: #075985;
          border-color: #bae6fd;
        }
        .agenda-event-badge-nota {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }
        .agenda-event-badge-pessoa {
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }
        .agenda-event-badge-ferias {
          background: #f0fdfa;
          color: #0f766e;
          border-color: #99f6e4;
        }
        .agenda-event-badge-exame {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .agenda-event-badge-folha {
          background: #ede9fe;
          color: #5b21b6;
          border-color: #ddd6fe;
        }
        .agenda-event-action-context {
          min-height: 30px !important;
          min-width: 0 !important;
          padding: 6px 10px !important;
          border-radius: 999px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #334155 !important;
          box-shadow: none !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          white-space: nowrap;
        }
        .agenda-event-action-context:hover {
          border-color: #0f766e !important;
          color: #0f766e !important;
        }
        .agenda-page-grid .empty-state-card {
          min-height: 0 !important;
          padding: 12px !important;
          gap: 4px !important;
        }
        .agenda-page-grid .empty-state-icon {
          font-size: 20px !important;
          margin-bottom: 2px !important;
        }
        .agenda-page-grid .empty-state-card strong {
          font-size: 13px !important;
        }
        .agenda-page-grid .empty-state-card p {
          font-size: 12px !important;
          line-height: 1.3 !important;
          margin: 2px 0 0 !important;
        }
        .agenda-event-action-rh {
          min-height: 30px !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
          line-height: 1.1 !important;
          white-space: nowrap;
        }
        .agenda-show-more {
          margin-top: 10px;
          border: 1px solid #dbe3ef;
          border-radius: 999px;
          background: #ffffff;
          color: #334155;
          font-weight: 800;
          padding: 8px 12px;
          cursor: pointer;
        }
        .agenda-people-loading {
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          padding: 9px 12px;
          margin: 0 0 12px;
        }
        @media (max-width: 640px) {
          .agenda-type-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .agenda-type-tab {
            padding: 8px 6px;
          }
          .agenda-event-item-rh {
            grid-template-columns: 1fr;
            padding: 9px 10px !important;
          }
          .agenda-event-action-rh {
            min-height: 28px !important;
            padding: 5px 8px !important;
          }
          .agenda-event-action-context {
            min-height: 28px !important;
            padding: 5px 8px !important;
            font-size: 11px !important;
          }
          .agenda-page-grid .empty-state-card {
            padding: 10px !important;
          }
          .agenda-page-grid .empty-state-icon {
            font-size: 18px !important;
          }
        }
      `}</style>

      <h1 style={styles.titulo}>📅 Agenda</h1>

      <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <header className="agenda-page-hero">
        <div className="agenda-page-hero-copy">
          <span>Área de trabalho</span>
          <h1>Agenda</h1>
          <p>Organize vencimentos, pendências e compromissos de pessoas em uma visão operacional única.</p>
        </div>
        <button className="agenda-page-back" type="button" onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>
      </header>

      <div className="agenda-type-tabs" role="tablist" aria-label="Filtro de tipo da agenda">
        {filtrosTipo.map((filtro) => (
          <button
            key={filtro.valor}
            type="button"
            className={`agenda-type-tab ${filtroTipo === filtro.valor ? 'agenda-type-tab-active' : ''}`}
            onClick={() => setFiltroTipo(filtro.valor)}
            aria-pressed={filtroTipo === filtro.valor}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      <section className="agenda-summary-grid agenda-kpi-grid">
        {grupos.map((grupo) => (
          <div key={grupo.chave} className={`agenda-kpi-card agenda-kpi-${grupo.chave}`}>
            <span>{grupo.label}</span>
            <strong>{formatarResumo(grupo.lista)}</strong>
          </div>
        ))}
      </section>

      {mostrarLoadingPessoas && (
        <div className="agenda-people-loading">Carregando eventos de pessoas...</div>
      )}

      {mostrarLoadingFerias && (
        <div className="agenda-people-loading">Carregando eventos de férias...</div>
      )}

      {mostrarLoadingExames && (
        <div className="agenda-people-loading">Carregando eventos de exames...</div>
      )}

      {mostrarLoadingFolha && (
        <div className="agenda-people-loading">Carregando eventos de folha...</div>
      )}

      <div className="agenda-page-grid">
        {grupos.map((grupo) => {
          const limitarMes = grupo.chave === 'mes' && grupo.lista.length > 10
          const listaVisivel = limitarMes && !mostrarMesCompleto ? grupo.lista.slice(0, 10) : grupo.lista

          return (
            <div key={grupo.chave}>
              <CardAgenda
                styles={styles}
                titulo={grupo.titulo}
                resumo={formatarResumo(grupo.lista)}
                lista={listaVisivel}
                cor={grupo.cor}
                formatarValor={formatarValor}
                formatarData={formatarData}
                diferencaDias={diferencaDias}
                navegarPara={navegarPara}
                navegarParaOrigemAgenda={navegarParaOrigemAgenda}
                podeEditarFinanceiro={podeEditarFinanceiro}
              />

              {limitarMes && (
                <button
                  type="button"
                  className="agenda-show-more"
                  onClick={() => setMostrarMesCompleto((atual) => !atual)}
                >
                  {mostrarMesCompleto ? 'Ver menos' : `Ver mais ${grupo.lista.length - 10} item(ns)`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
