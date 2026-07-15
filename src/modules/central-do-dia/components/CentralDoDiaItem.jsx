const ROTULOS_STATUS = Object.freeze({
  vencido: 'Vencido',
  vence_hoje: 'Hoje',
  pendente: 'Pendente',
  urgente: 'Urgente',
  atencao: 'Atenção',
  informativo: 'Informação',
  sucesso: 'Sucesso',
  falha: 'Falha',
  bloqueado: 'Bloqueado'
})

function formatarDataHora(valor) {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data)
}

export function CentralDoDiaItem({ item, formatarValor, onNavigate }) {
  const possuiDestino = Boolean(item.destino)
  const dataHora = formatarDataHora(item.dataHora)

  return (
    <article className={`central-day-item central-day-item-${item.prioridade}`}>
      <div className="central-day-item-heading">
        <div>
          <span className="central-day-item-module">{item.modulo}</span>
          <h4>{item.titulo}</h4>
        </div>
        <span className={`central-day-status central-day-status-${item.status}`}>{ROTULOS_STATUS[item.status] || 'Atenção'}</span>
      </div>

      {item.descricao && <p>{item.descricao}</p>}

      <div className="central-day-item-meta">
        {item.valor !== null && <strong>{formatarValor(item.valor)}</strong>}
        {dataHora && <span>{dataHora}</span>}
        {item.ator && <span>por {item.ator}</span>}
      </div>

      <div className="central-day-item-action">
        <span><b>Próxima ação:</b> {item.proximaAcao}</span>
        <button type="button" className="dashboard-home-action dashboard-home-action-secondary" onClick={() => onNavigate(item)} disabled={!possuiDestino}>
          {possuiDestino ? 'Abrir origem' : 'Origem indisponível'}
        </button>
      </div>
    </article>
  )
}
