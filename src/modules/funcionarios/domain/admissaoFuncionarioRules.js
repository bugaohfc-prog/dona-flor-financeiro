export function normalizarDataAdmissao(valor) {
  return String(valor || '').trim().slice(0, 10)
}

export function admissaoFoiAlterada(funcionario, novaDataAdmissao) {
  return normalizarDataAdmissao(funcionario?.data_admissao) !== normalizarDataAdmissao(novaDataAdmissao)
}

export function separarAdmissaoDoPayload(payload = {}) {
  const { data_admissao: dataAdmissao, ...demaisCampos } = payload
  return {
    dataAdmissao: normalizarDataAdmissao(dataAdmissao),
    demaisCampos
  }
}

export function impactoAdmissaoCorresponde(impacto, novaDataAdmissao) {
  return Boolean(impacto) && normalizarDataAdmissao(impacto.data_admissao_nova) === normalizarDataAdmissao(novaDataAdmissao)
}

export function motivoAdmissaoValido(motivo) {
  return String(motivo || '').trim().length >= 5
}

export function mensagemErroAdmissao(erro, fallback) {
  const mensagem = String(erro?.message || erro || '')
  const mensagens = {
    ADMISSAO_29FEV_REQUER_DECISAO: 'Admissões em 29/02 exigem uma decisão específica antes da criação automática do ciclo.',
    ADMISSAO_POSTERIOR_A_CICLO_EXISTENTE: 'A admissão não pode ficar depois do início de um ciclo de férias já existente.',
    MOTIVO_ADMISSAO_OBRIGATORIO: 'Informe o motivo da alteração para preservar os ciclos existentes.',
    ADMISSAO_REQUER_RPC_CONTROLADA: 'A data de admissão deve ser alterada por este fluxo controlado.'
  }

  const codigo = Object.keys(mensagens).find((item) => mensagem.includes(item))
  return codigo ? mensagens[codigo] : fallback
}
