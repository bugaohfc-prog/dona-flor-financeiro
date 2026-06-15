export default function AccountModal({
  styles,
  editandoContaId,
  descricao,
  setDescricao,
  valor,
  setValor,
  dataVencimento,
  setDataVencimento,
  centroCustoId,
  setCentroCustoId,
  centros,
  filialId,
  setFilialId,
  filiais,
  observacaoConta,
  setObservacaoConta,
  contaRecorrente,
  setContaRecorrente,
  tipoRecorrencia,
  setTipoRecorrencia,
  diaVencimentoRecorrencia,
  setDiaVencimentoRecorrencia,
  fecharConta,
  salvarConta,
  primeiraLetraMaiuscula,
  limitarDataInput,
  formatarDataParaBanco,
  fecharNota,
  setModalCentro,
  setMenuAberto,
  setMenuNavegacaoAberto
}) {
  function fecharTudo() {
    fecharConta()
    fecharNota()
    setModalCentro(false)
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
  }

  return (
    <div className="account-modal-backdrop" style={styles.overlay} onClick={fecharTudo}>
      <div className="account-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className="account-modal-header">
          <span>Financeiro</span>
          <h3>{editandoContaId ? 'Editar conta' : 'Nova conta'}</h3>
          <p>Preencha os dados principais para acompanhar vencimentos, recorrência e classificação.</p>
        </header>

        <div className="account-modal-body">
          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Dados principais</strong>
              <small>Identificação e valor da conta.</small>
            </div>
            <div className="account-modal-grid">
              <label className="account-modal-field account-modal-field-wide">
                <span>Descrição</span>
                <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
              </label>

              <label className="account-modal-field">
                <span>Valor</span>
                <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
              </label>
            </div>
          </section>

          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Vencimento e classificação</strong>
              <small>Defina prazo, filial e centro de custo.</small>
            </div>
            <div className="account-modal-grid">
              <label className="account-modal-field">
                <span>Vencimento</span>
                <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(limitarDataInput(e.target.value))} />
              </label>

              <label className="account-modal-field">
                <span>Filial / unidade</span>
                <select style={styles.inputModal} value={filialId} onChange={(e) => setFilialId(e.target.value)}>
                  <option value="">Filial / unidade</option>
                  {(filiais || []).map((filial) => (
                    <option key={filial.id} value={filial.id}>{filial.nome}</option>
                  ))}
                </select>
              </label>

              <label className="account-modal-field account-modal-field-wide">
                <span>Centro de custo</span>
                <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
                  <option value="">Centro de custo</option>
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>{centro.nome}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Recorrência</strong>
              <small>Use para contas fixas que se repetem mensalmente.</small>
            </div>
            <div className="recurrence-box account-modal-recurrence" style={styles.blocoRecorrenciaConta}>
              <label className="checkbox-row-fix account-modal-switch" style={styles.switchLinhaCompacta}>
                <span>
                  <strong>Conta recorrente</strong>
                  <small style={styles.textoAjuda}>Ideal para aluguel, internet, sistema, mensalidades e contas fixas.</small>
                </span>
                <input
                  type="checkbox"
                  checked={contaRecorrente}
                  onChange={(e) => {
                    const marcado = e.target.checked
                    setContaRecorrente(marcado)
                    if (marcado && dataVencimento) {
                      setDiaVencimentoRecorrencia(String(Number(formatarDataParaBanco(dataVencimento).slice(8, 10))))
                    }
                  }}
                />
              </label>

              {contaRecorrente && (
                <div className="recurrence-fields account-modal-grid">
                  <label className="account-modal-field">
                    <span>Tipo de recorrência</span>
                    <select style={styles.inputModal} value={tipoRecorrencia} onChange={(e) => setTipoRecorrencia(e.target.value)}>
                      <option value="mensal">Mensal</option>
                    </select>
                  </label>

                  <label className="account-modal-field">
                    <span>Dia de vencimento mensal</span>
                    <input
                      style={styles.inputModal}
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Dia de vencimento mensal. Ex: 5"
                      value={diaVencimentoRecorrencia || (dataVencimento ? String(Number(formatarDataParaBanco(dataVencimento).slice(8, 10))) : '')}
                      onChange={(e) => setDiaVencimentoRecorrencia(e.target.value)}
                    />
                  </label>

                  <small className="account-modal-help">
                    O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir.
                  </small>
                </div>
              )}
            </div>
          </section>

          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Observações</strong>
              <small>Inclua contexto administrativo quando necessário.</small>
            </div>
            <label className="account-modal-field">
              <span>Observação</span>
              <textarea
                style={styles.textareaModal}
                placeholder="Observação ou comentário da conta..."
                value={observacaoConta}
                onChange={(e) => setObservacaoConta(primeiraLetraMaiuscula(e.target.value))}
              />
            </label>
          </section>
        </div>

        <footer className="account-modal-actions">
          <button className="account-modal-save" style={styles.btnSalvar} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); salvarConta() }}>Salvar</button>
          <button className="account-modal-cancel" style={styles.btnCancelar} type="button" onClick={fecharConta}>Cancelar</button>
        </footer>
      </div>
    </div>
  )
}
