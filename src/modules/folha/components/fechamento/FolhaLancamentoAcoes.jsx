export default function FolhaLancamentoAcoes({
  lancamento,
  estilos,
  styles,
  podeEditar,
  salvando,
  podeDetalhar,
  itensAberto,
  onAbrirItens,
  onEditar,
  onAlternarConferencia,
  onAlternarArquivo
}) {
  return (
    <div className="folha-card-actions" style={estilos.acoesTabela}>
      <button
        className="folha-btn folha-btn-secondary"
        type="button"
        style={styles.btnCinza}
        onClick={() => onAbrirItens(lancamento)}
        disabled={!podeDetalhar}
      >
        {itensAberto ? '\u2212 itens' : '+ itens'}
      </button>
      <button
        className="folha-btn folha-btn-secondary"
        type="button"
        style={styles.btnCinza}
        onClick={() => onEditar(lancamento)}
        disabled={!podeEditar || salvando || lancamento.arquivado}
      >
        Editar lançamento
      </button>
      <button
        className="folha-btn folha-btn-secondary"
        type="button"
        style={styles.btnCinza}
        onClick={() => onAlternarConferencia(lancamento)}
        disabled={!podeEditar || salvando || lancamento.arquivado}
      >
        {lancamento.conferido ? 'Reabrir conferência' : 'Marcar conferido'}
      </button>
      <button
        className={`folha-btn ${lancamento.arquivado ? 'folha-btn-positive' : 'folha-btn-danger'}`}
        type="button"
        style={styles.btnCinza}
        onClick={() => onAlternarArquivo(lancamento)}
        disabled={!podeEditar || salvando}
      >
        {lancamento.arquivado ? 'Reativar lançamento' : 'Arquivar lançamento'}
      </button>
    </div>
  )
}
