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
  onClose,
  onConfirm
}) {
  const valorPrevisto = normalizarValor(conta?.valor)
  const [valorPago, setValorPago] = useState(formatarValorInput(valorPrevisto))
  const [dataPagamento, setDataPagamento] = useState(dataAtualBanco())
  const [observacaoPagamento, setObservacaoPagamento] = useState('')
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 420 }} onClick={(event) => event.stopPropagation()}>
        <h3>Baixar conta</h3>

        <div style={{ marginBottom: 12 }}>
          <strong>{conta.descricao}</strong>
          <small style={styles.textoAjuda}>Valor previsto: {formatarValor(valorPrevisto)}</small>
        </div>

        <label style={styles.textoAjuda} htmlFor="valor-pago-conta">Valor pago</label>
        <input
          id="valor-pago-conta"
          style={styles.inputModal}
          inputMode="decimal"
          value={valorPago}
          onChange={(event) => setValorPago(event.target.value)}
          placeholder="Ex: 105,40"
        />

        <label style={styles.textoAjuda} htmlFor="data-pagamento-conta">Data de pagamento</label>
        <input
          id="data-pagamento-conta"
          style={styles.inputModal}
          type="date"
          value={dataPagamento}
          onChange={(event) => setDataPagamento(limitarDataInput(event.target.value))}
        />

        <label style={styles.textoAjuda} htmlFor="observacao-pagamento-conta">Observacao de pagamento</label>
        <textarea
          id="observacao-pagamento-conta"
          style={{ ...styles.textareaModal, minHeight: 82 }}
          value={observacaoPagamento}
          onChange={(event) => setObservacaoPagamento(event.target.value)}
          placeholder="Comentario opcional da baixa..."
        />

        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '9px 10px',
            marginBottom: 12,
            background: previa.tipo === 'encargo' ? '#fff7ed' : previa.tipo === 'desconto' ? '#ecfdf5' : '#f8fafc',
            color: previa.tipo === 'encargo' ? '#9a3412' : previa.tipo === 'desconto' ? '#047857' : '#475569',
            fontWeight: 800,
            fontSize: 13
          }}
        >
          {previa.texto}
        </div>

        <button style={styles.btnSalvar} type="button" onClick={confirmarBaixa} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Confirmar baixa'}
        </button>
        <button style={styles.btnCancelar} type="button" onClick={onClose} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
