import { useMemo, useState } from 'react'

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
  onClose,
  onConfirm
}) {
  const valorConta = normalizarValor(conta?.valor)
  const totalPagoParcial = normalizarValor(conta?.pagamentosParciaisTotal)
  const saldoPendente = Math.max(
    normalizarValor(conta?.saldoPendenteParcial ?? valorConta),
    0
  )
  const [valorPago, setValorPago] = useState('')
  const [dataPagamento, setDataPagamento] = useState(dataAtualBanco())
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const valorNumerico = useMemo(() => normalizarValor(valorPago), [valorPago])
  const saldoDepois = Math.max(Number((saldoPendente - valorNumerico).toFixed(2)), 0)

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
    setSalvando(false)

    if (sucesso) onClose()
  }

  if (!conta) return null

  return (
    <div className="account-modal-backdrop" style={styles.overlay} onClick={salvando ? undefined : onClose}>
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
          <h3 id="titulo-pagamento-parcial">Registrar pagamento parcial</h3>
          <p>Registre uma parte do pagamento sem alterar o status ou a baixa integral da conta.</p>
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

          {valorNumerico > 0 && valorNumerico <= saldoPendente && (
            <div className="account-payment-preview account-partial-payment-preview">
              Saldo após este registro: {formatarValor(saldoDepois)}
              {saldoDepois === 0 && ' — a conta não será baixada automaticamente.'}
            </div>
          )}

          {erro && <div className="account-partial-payment-error" role="alert">{erro}</div>}
        </div>

        <footer className="account-modal-actions">
          <button
            className="account-modal-save"
            style={styles.btnSalvar}
            type="button"
            onClick={confirmarPagamento}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar pagamento parcial'}
          </button>
          <button
            className="account-modal-cancel"
            style={styles.btnCancelar}
            type="button"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  )
}
