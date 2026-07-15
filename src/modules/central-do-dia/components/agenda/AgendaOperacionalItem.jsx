function rotuloSituacao(item) {
  if (item?.dias < 0) return `Vencido há ${Math.abs(item.dias)} dia(s)`
  if (item?.dias === 0) return 'Hoje'
  if (item?.dias > 0) return `Em ${item.dias} dia(s)`
  return item?.inconsistencia ? 'Atenção' : 'Informação'
}

export default function AgendaOperacionalItem({ item, formatarValor, formatarData, onAbrir }) {
  const temValor = Number.isFinite(item?.valor)
  return (
    <article className="agenda-operacional-item">
      <div className="agenda-operacional-item-topo">
        <span className={`agenda-operacional-situacao agenda-operacional-situacao-${item?.prioridade || 'baixa'}`}>
          {rotuloSituacao(item)}
        </span>
        <span className="agenda-operacional-origem">{item?.modulo}</span>
      </div>
      <div className="agenda-operacional-item-conteudo">
        <h3>{item?.titulo}</h3>
        {item?.descricao && <p>{item.descricao}</p>}
        <div className="agenda-operacional-item-meta">
          {item?.dataReferencia && <span>Data: {formatarData(item.dataReferencia)}</span>}
          {temValor && <strong>{formatarValor(item.valor)}</strong>}
        </div>
      </div>
      <div className="agenda-operacional-item-acao">
        <span>{item?.proximaAcao}</span>
        <button type="button" className="outline" onClick={() => onAbrir(item)} disabled={!item?.destino}>
          Abrir origem
        </button>
      </div>
    </article>
  )
}
