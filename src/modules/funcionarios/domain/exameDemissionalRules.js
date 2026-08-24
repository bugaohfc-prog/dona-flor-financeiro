export const FORMULARIO_DEMISSIONAL_INICIAL = {
  tipo: 'DEMISSIONAL',
  estado: 'PENDENTE',
  dataPrevista: '',
  dataRealizada: ''
}

export function podeRegistrarExameDemissional(funcionario, desligamento) {
  return Boolean(
    funcionario?.id
    && funcionario.status === 'desligado'
    && !funcionario.arquivado
    && desligamento?.estado === 'CONCLUIDO'
    && !desligamento.efeito_revertido
  )
}

export function possuiDemissionalPendenteAtivo(exames, ignorarExameId = '') {
  return (Array.isArray(exames) ? exames : []).some((exame) => (
    exame?.id !== ignorarExameId
    && exame?.tipo === 'DEMISSIONAL'
    && exame?.estado === 'PENDENTE'
    && !exame?.arquivado
  ))
}

export function mensagemErroExameDemissional(erro, fallback) {
  const codigo = String(erro?.code || '')
  const texto = `${erro?.message || ''} ${erro?.details || ''} ${erro?.constraint || ''}`.toUpperCase()

  if (texto.includes('EXAME_DEMISSIONAL_EXIGE_VINCULO_DESLIGADO')) {
    return 'O exame demissional só pode ser registrado para um vínculo efetivamente desligado.'
  }
  if (
    texto.includes('EXAME_DEMISSIONAL_PENDENTE_JA_EXISTE')
    || (codigo === '23505' && texto.includes('UQ_DF_FUNCIONARIOS_EXAMES_DEMISSIONAL_PENDENTE_ATIVO'))
  ) {
    return 'Já existe um exame demissional pendente ativo para este vínculo.'
  }

  return fallback
}
