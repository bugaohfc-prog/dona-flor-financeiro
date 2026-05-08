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
    <div style={styles.overlay} onClick={fecharTudo}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

        <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
        <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
        <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(limitarDataInput(e.target.value))} />

        <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
          <option value="">Centro de custo</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>{centro.nome}</option>
          ))}
        </select>

        <textarea
          style={styles.textareaModal}
          placeholder="Observação ou comentário da conta..."
          value={observacaoConta}
          onChange={(e) => setObservacaoConta(primeiraLetraMaiuscula(e.target.value))}
        />

        <div className="recurrence-box" style={styles.blocoRecorrenciaConta}>
          <label className="checkbox-row-fix" style={styles.switchLinhaCompacta}>
            <span>
              <strong>🔁 Conta recorrente</strong>
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
            <div className="recurrence-fields">
              <select style={styles.inputModal} value={tipoRecorrencia} onChange={(e) => setTipoRecorrencia(e.target.value)}>
                <option value="mensal">Mensal</option>
              </select>

              <input
                style={styles.inputModal}
                type="number"
                min="1"
                max="31"
                placeholder="Dia de vencimento mensal. Ex: 5"
                value={diaVencimentoRecorrencia || (dataVencimento ? String(Number(formatarDataParaBanco(dataVencimento).slice(8, 10))) : '')}
                onChange={(e) => setDiaVencimentoRecorrencia(e.target.value)}
              />

              <small style={styles.textoAjuda}>
                O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir.
              </small>
            </div>
          )}
        </div>

        <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
        <button style={styles.btnCancelar} onClick={fecharConta}>Cancelar</button>
      </div>
    </div>
  )
}
