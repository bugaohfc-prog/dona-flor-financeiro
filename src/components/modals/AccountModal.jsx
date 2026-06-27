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
  impostoTipoConta,
  setImpostoTipoConta,
  competenciaConta,
  setCompetenciaConta,
  contaRecorrente,
  setContaRecorrente,
  tipoRecorrencia,
  setTipoRecorrencia,
  diaVencimentoRecorrencia,
  setDiaVencimentoRecorrencia,
  valorVariavelRecorrencia,
  setValorVariavelRecorrencia,
  recorrenciaContaId,
  escopoEdicaoRecorrencia,
  recorrenciaEdicaoCarregada,
  alterarEscopoEdicaoRecorrencia,
  fecharConta,
  salvarConta,
  salvandoConta,
  primeiraLetraMaiuscula,
  limitarDataInput,
  formatarDataParaBanco,
  fecharNota,
  setModalCentro,
  setMenuAberto,
  setMenuNavegacaoAberto
}) {
  const contaVinculadaRecorrencia = Boolean(editandoContaId && recorrenciaContaId)
  const editandoSerieRecorrente = contaVinculadaRecorrencia && escopoEdicaoRecorrencia === 'serie'
  const tituloModal = editandoSerieRecorrente ? 'Editar serie recorrente' : editandoContaId ? 'Editar conta' : 'Nova conta'
  const textoHeader = editandoSerieRecorrente
    ? 'Atualize a serie recorrente sem reescrever parcelas ja lancadas.'
    : 'Preencha os dados principais para acompanhar vencimentos, recorrencia e classificacao.'

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
          {contaVinculadaRecorrencia && (
            <section className="account-modal-section account-edit-scope-section">
              <div className="account-modal-section-title">
                <strong>Escopo da edicao</strong>
                <small>Escolha se esta alteracao vale so para a conta aberta ou para a serie.</small>
              </div>
              <div className="account-edit-scope-options" role="radiogroup" aria-label="Escopo da edicao de recorrencia">
                <button type="button" className={`account-edit-scope-option ${escopoEdicaoRecorrencia !== 'serie' ? 'active' : ''}`} aria-pressed={escopoEdicaoRecorrencia !== 'serie'} onClick={() => alterarEscopoEdicaoRecorrencia('conta')}>
                  <strong>Editar somente esta conta</strong>
                  <span>Altera apenas esta parcela. A serie permanece igual.</span>
                </button>
                <button type="button" className={`account-edit-scope-option ${escopoEdicaoRecorrencia === 'serie' ? 'active' : ''}`} aria-pressed={escopoEdicaoRecorrencia === 'serie'} disabled={!recorrenciaEdicaoCarregada} onClick={() => alterarEscopoEdicaoRecorrencia('serie')}>
                  <strong>Editar serie recorrente</strong>
                  <span>Altera a serie para proximas geracoes. Parcelas antigas nao sao reescritas.</span>
                </button>
              </div>
            </section>
          )}

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
                <span>{editandoSerieRecorrente ? 'Valor estimado' : 'Valor'}</span>
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
                <span>{editandoSerieRecorrente ? 'Inicio da serie' : 'Vencimento'}</span>
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
              {contaVinculadaRecorrencia ? (
                <div className="account-recurring-linked-note">
                  <strong>{editandoSerieRecorrente ? 'Editando a serie recorrente' : 'Editando somente esta conta'}</strong>
                  <span>{editandoSerieRecorrente ? 'Valor variavel e valor base serao salvos na serie. Parcelas antigas nao serao atualizadas.' : 'As alteracoes abaixo serao salvas apenas nesta conta. A serie permanece igual.'}</span>
                </div>
              ) : (
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
              )}

              {contaRecorrente && (!contaVinculadaRecorrencia || editandoSerieRecorrente) && (
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

                  <label className="checkbox-row-fix account-modal-switch account-modal-variable-switch account-modal-field-wide">
                    <span>
                      <strong>Valor variável</strong>
                      <small>Use quando esta recorrência pode mudar de valor a cada mês. O valor informado será tratado como estimativa.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={valorVariavelRecorrencia}
                      onChange={(e) => setValorVariavelRecorrencia(e.target.checked)}
                    />
                  </label>

                  <small className="account-modal-help">
                    O sistema criará essa conta automaticamente quando ela ainda não existir. Para despesa com valor variável, use o valor como estimativa e revise a conta antes da baixa.
                  </small>
                </div>
              )}
            </div>
          </section>

          {!editandoSerieRecorrente && (
            <>
          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Fiscal</strong>
              <small>Classifique obrigações como Simples Nacional, FGTS ou INSS.</small>
            </div>
            <div className="account-modal-grid">
              <label className="account-modal-field">
                <span>Tipo de imposto</span>
                <select
                  style={styles.inputModal}
                  value={impostoTipoConta}
                  onChange={(e) => {
                    const valorSelecionado = e.target.value
                    setImpostoTipoConta(valorSelecionado)
                    if (!valorSelecionado) setCompetenciaConta('')
                  }}
                >
                  <option value="">Não é imposto</option>
                  <option value="simples_nacional">Simples Nacional</option>
                  <option value="fgts">FGTS</option>
                  <option value="inss">INSS</option>
                  <option value="outro">Outro imposto</option>
                </select>
              </label>

              <label className="account-modal-field">
                <span>Competência</span>
                <input
                  style={styles.inputModal}
                  type="month"
                  value={competenciaConta}
                  disabled={!impostoTipoConta}
                  onChange={(e) => setCompetenciaConta(e.target.value)}
                />
              </label>

              <small className="account-modal-help account-modal-field-wide">
                Competência é opcional. Use quando a obrigação fiscal se referir a um mês específico.
              </small>
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
            </>
          )}
        </div>

        <footer className="account-modal-actions">
          <button
            className="account-modal-save"
            style={styles.btnSalvar}
            type="button"
            disabled={salvandoConta}
            aria-busy={salvandoConta ? 'true' : 'false'}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!salvandoConta) salvarConta()
            }}
          >
            {salvandoConta ? 'Salvando...' : 'Salvar'}
          </button>
          <button className="account-modal-cancel" style={styles.btnCancelar} type="button" onClick={fecharConta}>Cancelar</button>
        </footer>
      </div>
    </div>
  )
}
