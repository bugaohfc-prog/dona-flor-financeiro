import { useMemo, useState } from 'react'

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
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
  navegarParaOrigemAgenda,
  podeEditarFinanceiro
}) {
  return (
    <section style={styles.cardAgenda}>
      <div style={styles.cardTopo}>
        <strong>{titulo}</strong>
        <span>{resumo}</span>
      </div>

      {lista.length === 0 && (
        <EmptyState icon="✓" title="Agenda limpa" description="Não há eventos neste grupo no momento." />
      )}

      {lista.map((evento) => {
        const dias = diferencaDias(evento.data)
        const ehNota = evento.tipo === 'nota'

        return (
          <div key={evento.chave} style={{ ...styles.itemAgenda, borderLeft: `5px solid ${cor}` }}>
            <div>
              <div className="agenda-event-title">
                <strong>{evento.titulo}</strong>
                <span className={`agenda-event-badge agenda-event-badge-${evento.tipo}`}>
                  {ehNota ? 'Nota' : 'Conta'}
                </span>
              </div>

              <div style={styles.cardInfo}>
                {formatarData(evento.data)} • {evento.descricaoSecundaria}
              </div>

              <small style={dias < 0 ? styles.textoVencidoAgenda : styles.textoAgenda}>
                {dias < 0
                  ? `${ehNota ? 'Atrasada' : 'Vencida'} há ${Math.abs(dias)} dia(s)`
                  : dias === 0
                    ? `${ehNota ? 'Para hoje' : 'Vence hoje'}`
                    : `${ehNota ? 'Para daqui' : 'Vence em'} ${dias} dia(s)`}
              </small>
            </div>

            <div style={styles.agendaDireita}>
              {!ehNota && <strong>{formatarValor(evento.valor)}</strong>}

              {!ehNota && podeEditarFinanceiro && (
                <button style={styles.btnPago} onClick={() => navegarParaOrigemAgenda('conta', evento.id)}>
                  Ver em Contas
                </button>
              )}

              {ehNota && (
                <button style={styles.btnPago} onClick={() => navegarParaOrigemAgenda('nota', evento.id)}>
                  Ver em Notas
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

  const eventosAgenda = useMemo(() => {
    const contasAgenda = contas
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

    const notasAgenda = notas
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

    return [...contasAgenda, ...notasAgenda]
      .filter((evento) => filtroTipo === 'todas' || evento.tipo === filtroTipo)
      .sort((a, b) => dataLocal(a.data) - dataLocal(b.data))
  }, [contas, notas, filtroTipo, dataLocal])

  const eventosVencidos = eventosAgenda.filter((evento) => diferencaDias(evento.data) < 0)
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
  const contarNotas = (lista) => lista.filter((evento) => evento.tipo === 'nota').length
  const formatarNotas = (quantidade) => `${quantidade} nota(s)`
  const formatarResumo = (lista) => {
    const totalContas = somarContas(lista)
    const totalNotas = contarNotas(lista)

    if (filtroTipo === 'nota') return formatarNotas(totalNotas)
    if (filtroTipo === 'conta') return formatarValor(totalContas)
    return `${formatarValor(totalContas)} em contas • ${formatarNotas(totalNotas)}`
  }

  const tituloVencidos = filtroTipo === 'nota'
    ? 'Atrasadas'
    : filtroTipo === 'conta'
      ? 'Vencidas'
      : 'Vencidas/Atrasadas'

  const filtrosTipo = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'conta', label: 'Contas' },
    { valor: 'nota', label: 'Notas' }
  ]

  const grupos = [
    { chave: 'vencidas', label: tituloVencidos, titulo: '🚨 Vencidas / atrasadas', lista: eventosVencidos, cor: '#dc3545', style: styles.boxVencido },
    { chave: 'hoje', label: 'Hoje', titulo: '📌 Hoje', lista: eventosHoje, cor: '#ffc107', style: styles.boxPendente },
    { chave: 'semana', label: '7 dias', titulo: '🗓️ Próximos 7 dias', lista: eventosSemana, cor: '#0d6efd', style: styles.boxTotal },
    { chave: 'mes', label: 'Mês', titulo: '📆 Restante do mês', lista: eventosMes, cor: '#14b8a6', style: styles.boxPago }
  ]

  return (
    <>
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
        .agenda-event-badge {
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
        }
        .agenda-event-badge-conta {
          background: #e0f2fe;
          color: #075985;
        }
        .agenda-event-badge-nota {
          background: #fef3c7;
          color: #92400e;
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
        @media (max-width: 640px) {
          .agenda-type-tabs {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .agenda-type-tab {
            padding: 8px 6px;
          }
        }
      `}</style>

      <h1 style={styles.titulo}>📅 Agenda</h1>

      <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

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

      <section className="agenda-summary-grid" style={styles.resumo}>
        {grupos.map((grupo) => (
          <div key={grupo.chave} style={grupo.style}>
            <span>{grupo.label}</span>
            <strong>{formatarResumo(grupo.lista)}</strong>
          </div>
        ))}
      </section>

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
    </>
  )
}
