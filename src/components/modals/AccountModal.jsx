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
  contaParcelada,
  setContaParcelada,
  parcelamentoTotal,
  setParcelamentoTotal,
  parcelamentoQuantidade,
  setParcelamentoQuantidade,
  parcelamentoPrimeiroVencimento,
  setParcelamentoPrimeiroVencimento,
  tipoRecorrencia,
  setTipoRecorrencia,
  diaVencimentoRecorrencia,
  setDiaVencimentoRecorrencia,
  valorVariavelRecorrencia,
  setValorVariavelRecorrencia,
  recorrenciaContaId,
  escopoEdicaoRecorrencia,
  recorrenciaEdicaoCarregada,
  parcelamentoGrupoConta,
  parcelamentoGrupoParcelas,
  carregandoParcelamentoGrupo,
  erroParcelamentoGrupo,
  cancelarGrupoParcelamento,
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
  setMenuNavegacaoAberto,
  abrirConfirmacao
}) {
  const contaVinculadaRecorrencia = Boolean(editandoContaId && recorrenciaContaId)
  const editandoSerieRecorrente = contaVinculadaRecorrencia && escopoEdicaoRecorrencia === 'serie'
  const tituloModal = editandoSerieRecorrente ? 'Editar serie recorrente' : editandoContaId ? 'Editar conta' : 'Nova conta'
  const textoHeader = editandoSerieRecorrente
    ? 'Atualize a serie recorrente sem reescrever parcelas ja lancadas.'
    : 'Preencha os dados principais para acompanhar vencimentos, recorrencia e classificacao.'
  const podeParcelarConta = !editandoContaId && !contaVinculadaRecorrencia
  const parcelasDoGrupo = Array.isArray(parcelamentoGrupoParcelas) ? parcelamentoGrupoParcelas : []
  const contaParceladaEmEdicao = Boolean(editandoContaId && parcelamentoGrupoConta?.grupo_parcelamento_id)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const parcelasOrdenadas = [...parcelasDoGrupo].sort((a, b) => (
    Number(a?.parcela_numero || 0) - Number(b?.parcela_numero || 0)
    || String(a?.data_vencimento || '').localeCompare(String(b?.data_vencimento || ''))
  ))
  const somaParcelas = parcelasOrdenadas.reduce((total, parcela) => total + Number(parcela?.valor || 0), 0)
  const totalParcelamento = Number(parcelamentoGrupoConta?.valor_total_parcelamento || parcelasOrdenadas[0]?.valor_total_parcelamento || 0)
  const parcelasPagas = parcelasOrdenadas.filter((parcela) => parcela?.status === 'pago').length
  const parcelasAbertas = parcelasOrdenadas.filter((parcela) => parcela?.status !== 'pago').length
  const possuiPagamentoParcialGrupo = parcelasOrdenadas.some((parcela) => (
    Number(parcela?.quantidadePagamentosParciais || 0) > 0 || Number(parcela?.pagamentosParciaisTotal || 0) > 0
  ))
  const possuiParcelaOcultaOuLixeira = parcelasOrdenadas.some((parcela) => (
    parcela?.oculto === true || parcela?.excluido === true || parcela?.deletado === true
  ))
  const parcelasVencidas = parcelasOrdenadas.filter((parcela) => {
    if (parcela?.status === 'pago' || !parcela?.data_vencimento) return false
    const vencimento = new Date(`${String(parcela.data_vencimento).slice(0, 10)}T00:00:00`)
    return !Number.isNaN(vencimento.getTime()) && vencimento < hoje
  }).length
  const proximoVencimentoAberto = parcelasOrdenadas
    .filter((parcela) => parcela?.status !== 'pago' && parcela?.data_vencimento)
    .sort((a, b) => String(a.data_vencimento).localeCompare(String(b.data_vencimento)))[0]?.data_vencimento || null

  function formatarValorModal(valorEntrada) {
    return Number(valorEntrada || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarDataModal(dataEntrada) {
    if (!dataEntrada) return '-'
    return new Date(`${String(dataEntrada).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
  }

  function obterStatusParcela(parcela) {
    if (parcela?.status === 'pago') return 'Pago'
    if (!parcela?.data_vencimento) return 'Pendente'

    const vencimento = new Date(`${String(parcela.data_vencimento).slice(0, 10)}T00:00:00`)
    if (!Number.isNaN(vencimento.getTime()) && vencimento < hoje) return 'Vencido'
    return 'Pendente'
  }

  function obterMotivoBloqueioCancelamento() {
    if (carregandoParcelamentoGrupo) return ''
    if (erroParcelamentoGrupo) return erroParcelamentoGrupo
    if (!parcelasOrdenadas.length) return 'Este parcelamento ainda nao carregou parcelas suficientes para cancelamento em lote.'
    if (parcelasPagas > 0) return 'Este parcelamento nao pode ser cancelado porque ha parcela paga.'
    if (possuiPagamentoParcialGrupo) return 'Este parcelamento nao pode ser cancelado porque ha pagamento parcial registrado.'
    if (possuiParcelaOcultaOuLixeira) return 'Este parcelamento possui parcelas ocultas ou na lixeira e precisa de revisao individual.'
    return ''
  }

  const motivoBloqueioCancelamento = obterMotivoBloqueioCancelamento()
  const podeCancelarParcelamento = contaParceladaEmEdicao
    && !carregandoParcelamentoGrupo
    && !motivoBloqueioCancelamento
    && Boolean(parcelamentoGrupoConta?.grupo_parcelamento_id)

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
          <h3>{tituloModal}</h3>
          <p>{textoHeader}</p>
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

          {podeParcelarConta && (
            <section className="account-modal-section account-modal-installment">
              <div className="account-modal-section-title">
                <strong>Parcelamento</strong>
                <small>Crie contas independentes para cada parcela. Nao e recorrencia.</small>
              </div>
              <label className="checkbox-row-fix account-modal-switch" style={styles.switchLinhaCompacta}>
                <span>
                  <strong>Parcelar conta</strong>
                  <small style={styles.textoAjuda}>Use para compras ou despesas divididas em parcelas finitas.</small>
                </span>
                <input
                  type="checkbox"
                  checked={contaParcelada}
                  onChange={(e) => {
                    const marcado = e.target.checked
                    setContaParcelada(marcado)
                    if (marcado) {
                      setContaRecorrente(false)
                      setParcelamentoTotal(parcelamentoTotal || valor)
                      setParcelamentoPrimeiroVencimento(parcelamentoPrimeiroVencimento || dataVencimento)
                    }
                  }}
                />
              </label>

              {contaParcelada && (
                <div className="account-modal-grid account-modal-installment-fields">
                  <label className="account-modal-field">
                    <span>Valor total do parcelamento</span>
                    <input
                      style={styles.inputModal}
                      placeholder="Valor total. Ex: 100,00"
                      value={parcelamentoTotal}
                      onChange={(e) => setParcelamentoTotal(e.target.value)}
                    />
                  </label>

                  <label className="account-modal-field">
                    <span>Numero de parcelas</span>
                    <input
                      style={styles.inputModal}
                      type="number"
                      min="2"
                      step="1"
                      value={parcelamentoQuantidade}
                      onChange={(e) => setParcelamentoQuantidade(e.target.value)}
                    />
                  </label>

                  <label className="account-modal-field">
                    <span>Primeiro vencimento</span>
                    <input
                      style={styles.inputModal}
                      type="date"
                      value={parcelamentoPrimeiroVencimento}
                      onChange={(e) => setParcelamentoPrimeiroVencimento(limitarDataInput(e.target.value))}
                    />
                  </label>

                  <div className="account-modal-installment-summary">
                    <strong>Periodicidade mensal</strong>
                    <span>As proximas parcelas vencem mensalmente, preservando o dia quando possivel.</span>
                  </div>

                  <small className="account-modal-help account-modal-field-wide">
                    Cada parcela sera criada como uma conta independente, com baixa, estorno e pagamento parcial proprios.
                  </small>
                </div>
              )}
            </section>
          )}

          {contaParceladaEmEdicao && (
            <section className="account-modal-section account-installment-summary-section">
              <div className="account-modal-section-title">
                <strong>Parcelamento</strong>
                <small>Resumo somente leitura das parcelas vinculadas a este grupo.</small>
              </div>

              <div className="account-installment-current">
                <span>Parcela atual</span>
                <strong>Parcela {parcelamentoGrupoConta?.parcela_numero || '-'}/{parcelamentoGrupoConta?.parcelas_total || '-'}</strong>
              </div>

              {carregandoParcelamentoGrupo ? (
                <p className="account-installment-message">Carregando parcelas do grupo...</p>
              ) : erroParcelamentoGrupo ? (
                <p className="account-installment-message account-installment-message-warning">{erroParcelamentoGrupo}</p>
              ) : (
                <>
                  <div className="account-installment-summary-grid">
                    <span><b>Total</b>{formatarValorModal(totalParcelamento)}</span>
                    <span><b>Soma parcelas</b>{formatarValorModal(somaParcelas)}</span>
                    <span><b>Parcelas</b>{parcelasOrdenadas.length}</span>
                    <span><b>Abertas</b>{parcelasAbertas}</span>
                    <span><b>Pagas</b>{parcelasPagas}</span>
                    <span><b>Vencidas</b>{parcelasVencidas}</span>
                    <span><b>Proximo aberto</b>{formatarDataModal(proximoVencimentoAberto)}</span>
                  </div>

                  <div className="account-installment-list" aria-label="Parcelas do grupo">
                    {parcelasOrdenadas.length === 0 ? (
                      <p className="account-installment-message">Nenhuma parcela do grupo foi carregada.</p>
                    ) : parcelasOrdenadas.map((parcela) => {
                      const statusParcela = obterStatusParcela(parcela)
                      return (
                        <div className="account-installment-row" key={parcela.id}>
                          <strong>Parcela {parcela.parcela_numero}/{parcela.parcelas_total}</strong>
                          <span>{formatarDataModal(parcela.data_vencimento)}</span>
                          <span>{formatarValorModal(parcela.valor)}</span>
                          <span className={`status-pill ${statusParcela === 'Pago' ? 'status-pago' : statusParcela === 'Vencido' ? 'status-vencido' : 'status-pendente'}`}>
                            {statusParcela}
                          </span>
                          {parcela.oculto === true && <span className="status-pill status-oculto">Oculta</span>}
                          {(parcela.excluido === true || parcela.deletado === true) && <span className="status-pill status-oculto">Lixeira</span>}
                        </div>
                      )
                    })}
                  </div>

                  {motivoBloqueioCancelamento ? (
                    <p className="account-installment-message account-installment-message-warning">
                      {motivoBloqueioCancelamento}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="account-installment-cancel-button"
                      onClick={() => abrirConfirmacao?.({
                        titulo: 'Cancelar parcelamento',
                        mensagem: 'Esta acao ocultara todas as parcelas abertas deste parcelamento. Nenhuma conta sera excluida definitivamente.',
                        textoConfirmar: 'Confirmar cancelamento',
                        tipo: 'perigo',
                        acao: () => cancelarGrupoParcelamento?.(parcelamentoGrupoConta?.grupo_parcelamento_id)
                      })}
                      disabled={!podeCancelarParcelamento}
                    >
                      Cancelar parcelamento
                    </button>
                  )}
                </>
              )}
            </section>
          )}

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
                    if (marcado) setContaParcelada(false)
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
