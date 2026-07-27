function rotuloSituacao(item) {
  if (item?.dias < 0) return `Vencido há ${Math.abs(item.dias)} dia(s)`
  if (item?.dias === 0) return 'Hoje'
  if (item?.dias > 0) return `Em ${item.dias} dia(s)`
  return item?.inconsistencia ? 'Atenção' : 'Informação'
}

export default function AgendaOperacionalItem({
  item,
  conta,
  formatarValor,
  formatarData,
  onAbrir,
  onEditar,
  onPagar,
  podeEditarFinanceiro = false
}) {
  const temValor = Number.isFinite(item?.valor)
  const ehConta = item?.referenciaOrigem?.tipo === 'conta' && Boolean(conta?.id)
  const ehImposto = item?.tipo === 'imposto'
  const ehRecorrente = Boolean(conta?.recorrencia_id || conta?.df_contas_recorrentes)
  const possuiPagamentoParcial = Number(conta?.pagamentosParciaisTotal || 0) > 0

  return (
    <article className="agenda-operacional-item">
      <div className="agenda-operacional-item-topo">
        <span className={`agenda-operacional-situacao agenda-operacional-situacao-${item?.prioridade || 'baixa'}`}>
          {rotuloSituacao(item)}
        </span>
        <div className="agenda-operacional-item-badges">
          {ehImposto && <span className="agenda-operacional-badge agenda-operacional-badge-imposto">Imposto</span>}
          {ehRecorrente && <span className="agenda-operacional-badge agenda-operacional-badge-recorrente">Recorrente</span>}
          {possuiPagamentoParcial && <span className="agenda-operacional-badge agenda-operacional-badge-parcial">Pagamento parcial</span>}
          {!ehImposto && !ehRecorrente && !possuiPagamentoParcial && (
            <span className="agenda-operacional-origem">{item?.modulo}</span>
          )}
        </div>
      </div>
      <div className="agenda-operacional-item-conteudo">
        <h3>{item?.titulo}</h3>
        <div className="agenda-operacional-item-meta">
          {item?.dataReferencia && <span>Data: {formatarData(item.dataReferencia)}</span>}
          {temValor && (
            <strong>
              {possuiPagamentoParcial && <small>Saldo restante</small>}
              {formatarValor(item.valor)}
            </strong>
          )}
        </div>
      </div>
      <div className="agenda-operacional-item-acoes">
        <button type="button" className="outline" onClick={() => onAbrir(item)} disabled={!item?.destino}>
          {ehConta ? 'Abrir conta' : 'Abrir origem'}
        </button>
        {ehConta && podeEditarFinanceiro && (
          <>
            <button type="button" className="outline" onClick={() => onEditar(conta)}>Editar</button>
            <button type="button" onClick={() => onPagar(conta)}>Marcar pagamento</button>
          </>
        )}
      </div>
    </article>
  )
}
