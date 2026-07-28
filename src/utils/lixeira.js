export const DIAS_RETENCAO_LIXEIRA = 60
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

function assinaturaLixeira(itens = []) {
  return itens
    .map((item) => `${item.id || ''}:${item.excluido_em || ''}:${item.updated_at || ''}`)
    .join('|')
}

function normalizarData(data) {
  const valor = data instanceof Date ? new Date(data.getTime()) : new Date(data)
  return Number.isNaN(valor.getTime()) ? null : valor
}

export function obterEstadoRetencaoLixeira(dataExclusao, dataReferencia = new Date()) {
  const excluidoEm = normalizarData(dataExclusao)
  const referencia = normalizarData(dataReferencia)

  if (!excluidoEm || !referencia) {
    return {
      elegivel: false,
      diasDecorridos: 0,
      diasRestantes: DIAS_RETENCAO_LIXEIRA,
      dataLiberacao: null,
    }
  }

  const dataLiberacao = new Date(
    excluidoEm.getTime() + DIAS_RETENCAO_LIXEIRA * MILISSEGUNDOS_POR_DIA,
  )
  const diasDecorridos = Math.max(
    0,
    Math.floor((referencia.getTime() - excluidoEm.getTime()) / MILISSEGUNDOS_POR_DIA),
  )
  const diasRestantes = Math.max(
    0,
    Math.ceil((dataLiberacao.getTime() - referencia.getTime()) / MILISSEGUNDOS_POR_DIA),
  )

  return {
    elegivel: referencia.getTime() >= dataLiberacao.getTime(),
    diasDecorridos,
    diasRestantes,
    dataLiberacao,
  }
}

export function diasNaLixeira(dataExclusao, dataReferencia = new Date()) {
  return obterEstadoRetencaoLixeira(dataExclusao, dataReferencia).diasDecorridos
}

export function podeExcluirDefinitivo(dataExclusao, dataReferencia = new Date()) {
  return obterEstadoRetencaoLixeira(dataExclusao, dataReferencia).elegivel
}

export function obterLimiteExclusaoDefinitiva(dataReferencia = new Date()) {
  const referencia = normalizarData(dataReferencia)
  if (!referencia) return null
  return new Date(
    referencia.getTime() - DIAS_RETENCAO_LIXEIRA * MILISSEGUNDOS_POR_DIA,
  ).toISOString()
}

export function atualizarListaLixeiraEstavel(setLista, novaLista = []) {
  setLista((listaAtual = []) => (
    assinaturaLixeira(listaAtual) === assinaturaLixeira(novaLista)
      ? listaAtual
      : novaLista
  ))
}
