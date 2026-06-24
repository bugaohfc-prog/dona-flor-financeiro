import { useEffect, useMemo, useState } from 'react'

function dataAtualBanco() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function normalizarValor(valor) {
  if (typeof valor === 'number') return valor
  const bruto = String(valor || '').trim()
  const texto = bruto.includes(',')
    ? bruto.replace(/\./g, '').replace(',', '.')
    : bruto
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : 0
}

export default function AccountPartialPaymentModal({
  styles,
  conta,
  formatarValor,
  limitarDataInput,
  listarPagamentos,
  estornarPagamento,
  baixarContaQuitada,
  onClose,
  onConfirm
}) {
  const valorConta = normalizarValor(conta?.valor)
  const [valorPago, setValorPago] = useState('')
  const [dataPagamento, setDataPagamento] = useState(dataAtualBanco())
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregandoPagamentos, setCarregandoPagamentos] = useState(true)
  const [pagamentos, setPagamentos] = useState([])
  const [pagamentoEmEstorno, setPagamentoEmEstorno] = useState('')
  const [baixandoConta, setBaixandoConta] = useState(false)

  const totalPagoParcial = carregandoPagamentos
    ? normalizarValor(conta?.pagamentosParciaisTotal)
    : pagamentos.reduce((total, pagamento) => total + normalizarValor(pagamento.valor_pago), 0)
  const saldoPendente = Math.max(Number((valorConta - totalPagoParcial).toFixed(2)), 0)
  const podeRegistrarNovo = conta.status !== 'pago' && saldoPendente > 0
  const podeBaixarConta = (
    !carregandoPagamentos
    && pagamentos.length > 0
    && saldoPendente <= 0
    && conta.status !== 'pago'
  )
  const ocupado = salvando || baixandoConta || Boolean(pagamentoEmEstorno)
  const valorNumerico = useMemo(() => normalizarValor(valorPago), [valorPago])
  const saldoDepois = Math.max(Number((saldoPendente - valorNumerico).toFixed(2)), 0)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregandoPagamentos(true)
      const lista = await listarPagamentos(conta.id)
      if (!ativo) return
      setPagamentos(lista)
      setCarregandoPagamentos(false)
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [conta.id, listarPagamentos])

  async function confirmarPagamento() {
    if (salvando) return

    if (!valorPago.trim() || valorNumerico <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }
    if (valorNumerico > saldoPendente) {
      setErro(`O valor não pode superar o saldo de ${formatarValor(saldoPendente)}.`)
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPagamento)) {
      setErro('Informe uma data de pagamento válida.')
      return
    }

    setErro('')
    setSalvando(true)
    const sucesso = await onConfirm({
      valor_pago: valorNumerico,
      data_pagamento: dataPagamento,
      observacao: observacao.trim() || null
    })

    if (!sucesso) {
      setSalvando(false)
      return
    }

    const pagamentosAtualizados = await listarPagamentos(conta.id)
    if (!pagamentosAtualizados.length) {
      setErro('Pagamento salvo, mas não foi possível atualizar o histórico. Feche e abra o modal novamente.')
      setSalvando(false)
      return
    }

    const totalAtualizado = pagamentosAtualizados.reduce(
      (total, pagamento) => total + normalizarValor(pagamento.valor_pago),
      0
    )
    const saldoAtualizado = Math.max(Number((valorConta - totalAtualizado).toFixed(2)), 0)

    setPagamentos(pagamentosAtualizados)
    setCarregandoPagamentos(false)
    setValorPago('')
    setObservacao('')
    setSalvando(false)

    if (saldoAtualizado > 0) onClose()
  }

  async function confirmarEstorno(pagamento) {
    if (pagamentoEmEstorno) return
    const confirmou = window.confirm(
      'Deseja estornar este pagamento parcial? A conta voltará a ter o saldo pendente atualizado.'
    )
    if (!confirmou) return

    setPagamentoEmEstorno(pagamento.id)
    const sucesso = await estornarPagamento(pagamento.id, conta.id)
    if (sucesso) {
      setPagamentos((atuais) => atuais.filter((item) => item.id !== pagamento.id))
    }
    setPagamentoEmEstorno('')
  }

  async function confirmarBaixaDaConta() {
    if (ocupado || !podeBaixarConta) return
    const confirmou = window.confirm(
      'Os pagamentos parciais completam o valor da conta. Deseja marcar esta conta como paga?'
    )
    if (!confirmou) return

    setBaixandoConta(true)
    const sucesso = await baixarContaQuitada(conta.id)
    setBaixandoConta(false)

    if (sucesso) onClose()
  }

  if (!conta) return null

  return (
    <div className="account-modal-backdrop" style={styles.overlay} onClick={ocupado ? undefined : onClose}>
      <div
        className="account-modal-card account-payment-modal-card account-partial-modal-card"
        style={{ ...styles.modal, maxWidth: 500 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-pagamento-parcial"
      >
        <header className="account-modal-header">
          <span>Financeiro</span>
          <h3 id="titulo-pagamento-parcial">Pagamentos parciais</h3>
          <p>Registre, confira ou estorne pagamentos sem alterar automaticamente a baixa integral.</p>
        </header>

        <div className="account-modal-body">
          <section className="account-modal-section account-payment-summary">
            <div>
              <span>Conta</span>
              <strong>{conta.descricao}</strong>
            </div>
            <div>
              <span>Valor total</span>
              <strong>{formatarValor(valorConta)}</strong>
            </div>
            <div>
              <span>Já pago parcialmente</span>
              <strong>{formatarValor(totalPagoParcial)}</strong>
            </div>
            <div>
              <span>Saldo disponível</span>
              <strong>{formatarValor(saldoPendente)}</strong>
            </div>
          </section>

          {podeRegistrarNovo && (
            <section className="account-modal-section">
              <div className="account-modal-section-title">
                <strong>Dados do pagamento parcial</strong>
                <small>O registro ficará no histórico parcial e a conta continuará aberta.</small>
              </div>
              <div className="account-modal-grid">
                <label className="account-modal-field">
                  <span>Valor pago</span>
                  <input
                    id="valor-pagamento-parcial"
                    style={styles.inputModal}
                    inputMode="decimal"
                    value={valorPago}
                    onChange={(event) => {
                      setValorPago(event.target.value)
                      setErro('')
                    }}
                    placeholder="Ex: 300,00"
                    autoFocus
                  />
                </label>

                <label className="account-modal-field">
                  <span>Data do pagamento</span>
                  <input
                    id="data-pagamento-parcial"
                    style={styles.inputModal}
                    type="date"
                    value={dataPagamento}
                    onChange={(event) => {
                      setDataPagamento(limitarDataInput(event.target.value))
                      setErro('')
                    }}
                  />
                </label>

                <label className="account-modal-field account-modal-field-wide">
                  <span>Observação</span>
                  <textarea
                    id="observacao-pagamento-parcial"
                    style={{ ...styles.textareaModal, minHeight: 82 }}
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    placeholder="Comentário opcional..."
                  />
                </label>
              </div>
            </section>
          )}

          {podeBaixarConta && (
            <section className="account-partial-settlement">
              <div>
                <strong>O valor total da conta já foi pago parcialmente.</strong>
                <span>Confirme a baixa para marcar a conta principal como paga.</span>
              </div>
              <button
                type="button"
                onClick={confirmarBaixaDaConta}
                disabled={ocupado}
              >
                {baixandoConta ? 'Baixando...' : 'Baixar conta agora'}
              </button>
            </section>
          )}

          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Pagamentos parciais registrados</strong>
              <small>Estorne apenas o registro incorreto. A conta principal não será alterada.</small>
            </div>

            {carregandoPagamentos ? (
              <p className="account-partial-list-message">Carregando pagamentos...</p>
            ) : pagamentos.length === 0 ? (
              <p className="account-partial-list-message">Nenhum pagamento parcial registrado.</p>
            ) : (
              <div className="account-partial-payment-list">
                {pagamentos.map((pagamento) => (
                  <article className="account-partial-payment-item" key={pagamento.id}>
                    <div className="account-partial-payment-item-copy">
                      <strong>{formatarValor(pagamento.valor_pago)}</strong>
                      <span>{new Date(`${pagamento.data_pagamento}T00:00:00`).toLocaleDateString('pt-BR')}</span>
                      {pagamento.observacao && <small>{pagamento.observacao}</small>}
                    </div>
                    <button
                      type="button"
                      className="account-partial-payment-reverse"
                      onClick={() => confirmarEstorno(pagamento)}
                      disabled={ocupado}
                    >
                      {pagamentoEmEstorno === pagamento.id ? 'Estornando...' : 'Estornar parcial'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {podeRegistrarNovo && valorNumerico > 0 && valorNumerico <= saldoPendente && (
            <div className="account-payment-preview account-partial-payment-preview">
              Saldo após este registro: {formatarValor(saldoDepois)}
              {saldoDepois === 0 && ' — a conta não será baixada automaticamente.'}
            </div>
          )}

          {erro && <div className="account-partial-payment-error" role="alert">{erro}</div>}
        </div>

        <footer className="account-modal-actions">
          {podeRegistrarNovo && (
            <button
              className="account-modal-save"
              style={styles.btnSalvar}
              type="button"
              onClick={confirmarPagamento}
              disabled={ocupado}
            >
              {salvando ? 'Salvando...' : 'Salvar pagamento parcial'}
            </button>
          )}
          <button
            className="account-modal-cancel"
            style={styles.btnCancelar}
            type="button"
            onClick={onClose}
            disabled={ocupado}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  )
}
