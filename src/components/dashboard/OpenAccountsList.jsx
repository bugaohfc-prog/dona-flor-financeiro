import { formatarTipoRecorrencia, obterTipoRecorrenciaConta } from '../../utils/recorrencia'

export default function OpenAccountsList({
  styles,
  formatarValor,
  navegarPara,
  contasAbertasDashboard,
  mostrarContasDashboard,
  setMostrarContasDashboard,
  busca,
  setBusca,
  estaVencida,
  formatarData,
  abrirConfirmacao,
  marcarComoPago,
  podeEditarFinanceiro = true
}) {


  return (
    <section className={`dashboard-open-accounts content-block ${mostrarContasDashboard ? 'accounts-expanded' : 'accounts-collapsed'}`} style={styles.bloco}>
      <div className="dashboard-section-header dashboard-section-header-accounts">
        <div className="dashboard-section-title-wrap">
          <strong>💳 Contas em aberto</strong>
          <small>Mais novas primeiro • {contasAbertasDashboard.length} conta(s)</small>
        </div>
        <div className="dashboard-section-actions">
          <button className="dashboard-see-all-link" type="button" onClick={() => navegarPara('contas')}>Ver todas</button>
          <button
            className="note-toggle-small"
            type="button"
            onClick={() => setMostrarContasDashboard(!mostrarContasDashboard)}
            title={mostrarContasDashboard ? 'Recolher contas em aberto' : 'Expandir contas em aberto'}
            aria-label={mostrarContasDashboard ? 'Recolher contas em aberto' : 'Expandir contas em aberto'}
          >
            {mostrarContasDashboard ? '−' : '+'}
          </button>
        </div>
      </div>

      {mostrarContasDashboard && (
        <>
          <div className="dashboard-inline-filter">
            <input
              style={styles.input}
              placeholder="Buscar por conta, data, centro ou observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {contasAbertasDashboard.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma conta em aberto para os filtros atuais.</p>
          )}

          <div className="dashboard-open-list">
            {contasAbertasDashboard.slice(0, 8).map((conta) => {
              const vencida = estaVencida(conta.data_vencimento, conta.status)
              return (
                <div key={conta.id} className={`dashboard-account-row ${vencida ? 'account-row-vencido' : 'account-row-pendente'}`}>
                  <div>
                    <strong>{conta.descricao}</strong>
                    <div className="dashboard-account-meta">
                      <span className="account-date-badge">📅 {formatarData(conta.data_vencimento)}</span>
                      <span className="account-center-label">{conta.df_centros_custo?.nome || 'Sem centro'}</span>
                      {conta.recorrencia_id && (
                        <span className="account-recurring-badge">🔁 {formatarTipoRecorrencia(obterTipoRecorrenciaConta(conta))}</span>
                      )}
                    </div>
                    {conta.observacao && <small className="account-note-preview">Obs: {conta.observacao}</small>}
                  </div>
                  <div className="dashboard-account-row-actions">
                    <span className="dashboard-account-value">{formatarValor(conta.valor)}</span>
                    <span className={`status-pill ${vencida ? 'status-vencido' : 'status-pendente'}`}>{vencida ? 'Vencido' : 'Pendente'}</span>
                    {podeEditarFinanceiro && (
                      <button className="dashboard-paid-button" style={styles.btnPago} onClick={() => abrirConfirmacao({ titulo: 'Confirmar pagamento', mensagem: `Deseja marcar a conta ${conta.descricao} como paga?`, textoConfirmar: 'Marcar como pago', tipo: 'sucesso', acao: () => marcarComoPago(conta.id) })}>Pago</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
