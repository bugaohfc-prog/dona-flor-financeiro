export const FONTES_EVENTOS_PESSOAS = Object.freeze([
  'funcionarios',
  'ciclosFerias',
  'periodosFerias',
  'exames',
  'folha',
  'desligamentos'
])
function normalizarResposta(resposta) {
  if (resposta.status === 'rejected') return { dados: [], erro: resposta.reason }
  if (resposta.value?.error) return { dados: [], erro: resposta.value.error }
  return { dados: resposta.value?.data || [], erro: null }
}
export async function executarConsultasEventosPessoas({ consultas, parametros } = {}) {
  const respostas = await Promise.allSettled(
    FONTES_EVENTOS_PESSOAS.map((fonte) => Promise.resolve().then(() => consultas[fonte](parametros)))
  )
  const resultados = respostas.map(normalizarResposta)

  return FONTES_EVENTOS_PESSOAS.reduce((acumulado, fonte, indice) => {
    acumulado.dados[fonte] = resultados[indice].dados
    acumulado.erros[fonte] = resultados[indice].erro
    if (resultados[indice].erro) acumulado.fontesComErro.push(fonte)
    return acumulado
  }, {
    dados: {
      funcionarios: [],
      ciclosFerias: [],
      periodosFerias: [],
      exames: [],
      folha: [],
      desligamentos: []
    },
    erros: {},
    fontesComErro: [],
    quantidadeConsultas: FONTES_EVENTOS_PESSOAS.length
  })
}
