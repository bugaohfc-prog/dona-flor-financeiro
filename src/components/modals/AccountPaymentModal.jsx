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

function formatarValorInput(valor) {
  const numero = normalizarValor(valor)
  return numero ? numero.toFixed(2) : ''
}

export default function AccountPaymentModal({
  styles,
  conta,
  formatarValor,
  limitarDataInput,
  modo = 'baixa',
  onClose,
  onConfirm
}) {
  const corrigindoPagamento = modo === 'corrigir'
  const valorPrevisto = normalizarValor(conta?.valor)
  const valorPagamentoInicial = corrigindoPagamento && conta?.valor_pago != null ? conta.valor_pago : valorPrevisto
  const [valorPago, setValorPago] = useState(formatarValorInput(valorPagamentoInicial))
  const [dataPagamento, setDataPagamento] = useState(corrigindoPagamento && conta?.data_pagamento ? conta.data_pagamento : dataAtualBanco())
  const [observacaoPagamento, setObservacaoPagamento] = useState(corrigindoPagamento ? conta?.observacao_pagamento || '' : '')
  const [salvando, setSalvando] = useState(false)

  const previa = useMemo(() => {
    const pago = normalizarValor(valorPago)
    const diferenca = Number((pago - valorPrevisto).toFixed(2))

    if (diferenca > 0) {
      return { tipo: 'encargo', texto: `Encargos/juros: ${formatarValor(diferenca)}` }
    }

    if (diferenca < 0) {
      return { tipo: 'desconto', texto: `Desconto: ${formatarValor(Math.abs(diferenca))}` }
    }

    return { tipo: 'neutro', texto: 'Sem encargos ou desconto.' }
  }, [formatarValor, valorPago, valorPrevisto])

  async function confirmarBaixa() {
    if (salvando) return

    const valorNumerico = normalizarValor(valorPago)
    if (!valorNumerico || valorNumerico < 0 || !dataPagamento) return

    setSalvando(true)
    const sucesso = await onConfirm({
      valor_pago: valorNumerico,
      data_pagamento: dataPagamento,
      observacao_pagamento: observacaoPagamento.trim() || null
    })
    setSalvando(false)

    if (sucesso) onClose()
  }

  if (!conta) return null

  return (
    <div className="account-modal-backdrop" style={styles.overlay} onClick={onClose}>
      <div className="account-modal-card account-payment-modal-card" style={{ ...styles.modal, maxWidth: 460 }} onClick={(event) => event.stopPropagation()}>
        <header className="account-modal-header">
          <span>Financeiro</span>
          <h3>{corrigindoPagamento ? 'Corrigir pagamento' : 'Baixar conta'}</h3>
          <p>
            {corrigindoPagamento
              ? 'Atualize valor, data ou observação do pagamento. A conta continuará marcada como paga.'
              : 'Registre o pagamento com valor, data e observação administrativa.'}
          </p>
        </header>

        <div className="account-modal-body">
          <section className="account-modal-section account-payment-summary">
            <div>
              <span>Conta</span>
              <strong>{conta.descricao}</strong>
            </div>
            <div>
              <span>Valor previsto</span>
              <strong>{formatarValor(valorPrevisto)}</strong>
            </div>
          </section>

          <section className="account-modal-section">
            <div className="account-modal-section-title">
              <strong>Dados do pagamento</strong>
              <small>{corrigindoPagamento ? 'Ajuste os dados registrados na baixa.' : 'Informe o valor realizado e a data da baixa.'}</small>
            </div>
            <div className="account-modal-grid">
              <label className="account-modal-field">
                <span>Valor pago</span>
                <input
                  id="valor-pago-conta"
                  style={styles.inputModal}
                  inputMode="decimal"
                  value={valorPago}
                  onChange={(event) => setValorPago(event.target.value)}
                  placeholder="Ex: 105,40"
                />
              </label>

              <label className="account-modal-field">
                <span>Data de pagamento</span>
                <input
                  id="data-pagamento-conta"
                  style={styles.inputModal}
                  type="date"
                  value={dataPagamento}
                  onChange={(event) => setDataPagamento(limitarDataInput(event.target.value))}
                />
              </label>

              <label className="account-modal-field account-modal-field-wide">
                <span>Observação de pagamento</span>
                <textarea
                  id="observacao-pagamento-conta"
                  style={{ ...styles.textareaModal, minHeight: 82 }}
                  value={observacaoPagamento}
                  onChange={(event) => setObservacaoPagamento(event.target.value)}
                  placeholder="Comentário opcional da baixa..."
                />
              </label>
            </div>
          </section>

          <div className={`account-payment-preview account-payment-preview-${previa.tipo}`}>
            {previa.texto}
          </div>
        </div>

        <footer className="account-modal-actions">
          <button className="account-modal-save" style={styles.btnSalvar} type="button" onClick={confirmarBaixa} disabled={salvando}>
            {salvando ? 'Salvando...' : corrigindoPagamento ? 'Salvar correção' : 'Confirmar baixa'}
          </button>
          <button className="account-modal-cancel" style={styles.btnCancelar} type="button" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  )
}
