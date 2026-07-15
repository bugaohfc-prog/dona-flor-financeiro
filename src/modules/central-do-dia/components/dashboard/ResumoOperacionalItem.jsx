const ROTULOS_ORIGEM = Object.freeze({
  financeiro: 'Financeiro',
  impostos: 'Impostos',
  notas: 'Notas',
  pessoas: 'Pessoas'
})

function situacaoItem(item) {
  if (Number.isFinite(item?.dias)) {
    if (item.dias < 0) return `Vencido há ${Math.abs(item.dias)} dia(s)`
    if (item.dias === 0) return 'Hoje'
    return `Em ${item.dias} dia(s)`
  }
  return item?.inconsistencia ? 'Atenção' : 'Pendente'
}

export function ResumoOperacionalItem({ item, formatarValor, onAbrirOrigem }) {
  const possuiDestino = Boolean(item?.destino)

  return (
    <article className="resumo-operacional-dashboard-item">
      <div className="resumo-operacional-dashboard-item-topo">
        <span className="resumo-operacional-dashboard-origem">
          {ROTULOS_ORIGEM[item.origemOperacional] || item.modulo}
        </span>
        <span className="resumo-operacional-dashboard-situacao">{situacaoItem(item)}</span>
      </div>

      <h4>{item.titulo}</h4>

      <div className="resumo-operacional-dashboard-item-rodape">
        <span className="resumo-operacional-dashboard-proxima-acao">{item.proximaAcao}</span>
        {item.valor !== null && <strong>{formatarValor(item.valor)}</strong>}
        <button
          type="button"
          className="dashboard-home-action dashboard-home-action-secondary resumo-operacional-dashboard-acao-origem"
          onClick={() => onAbrirOrigem(item)}
          disabled={!possuiDestino}
        >
          {possuiDestino ? 'Abrir' : 'Indisponível'}
        </button>
      </div>
    </article>
  )
}
