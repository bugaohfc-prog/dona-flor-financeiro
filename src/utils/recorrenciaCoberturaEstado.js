export function criarEstadoCobertura() {
  return {
    empresaId: null,
    resultado: null,
    carregando: false,
    erro: null,
    carregado: false
  }
}

export function iniciarAtualizacaoCobertura(estado, empresaId) {
  const mesmaEmpresa = estado?.empresaId === empresaId
  return {
    empresaId,
    resultado: mesmaEmpresa ? estado?.resultado || null : null,
    carregando: true,
    erro: null,
    carregado: mesmaEmpresa && Boolean(estado?.resultado)
  }
}

export function concluirAtualizacaoCobertura(empresaId, resultado) {
  return {
    empresaId,
    resultado,
    carregando: false,
    erro: null,
    carregado: true
  }
}

export function falharAtualizacaoCobertura(estado, empresaId, erro) {
  const mesmaEmpresa = estado?.empresaId === empresaId
  const resultadoAnterior = mesmaEmpresa ? estado?.resultado || null : null
  return {
    empresaId,
    resultado: resultadoAnterior,
    carregando: false,
    erro,
    carregado: Boolean(resultadoAnterior)
  }
}
