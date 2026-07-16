import { montarDataRecorrente } from './recorrencia.js'

const DIAS_HORIZONTE_PADRAO = 90
export const INDICE_RECORRENCIA_ATIVA = 'uq_df_contas_recorrencia_vencimento_ativas'

export function ehConflitoRecorrenciaAtiva(erro) {
  if (String(erro?.code || '') !== '23505') return false

  return [erro?.constraint, erro?.message, erro?.details, erro?.hint]
    .filter(Boolean)
    .some((valor) => String(valor).includes(INDICE_RECORRENCIA_ATIVA))
}

export async function inserirPlanejamentoComRepeticaoUnica({
  ocorrencias = [],
  inserir,
  recarregarEPlanejar
} = {}) {
  const inserirOuFalhar = async (itens) => {
    const resposta = await inserir(itens)
    if (resposta?.error) throw resposta.error
    return resposta?.data || []
  }

  if (!Array.isArray(ocorrencias) || ocorrencias.length === 0) {
    return { criadas: [], repetiu: false }
  }

  try {
    return { criadas: await inserirOuFalhar(ocorrencias), repetiu: false }
  } catch (erro) {
    if (!ehConflitoRecorrenciaAtiva(erro)) throw erro

    const restantes = await recarregarEPlanejar()
    if (!Array.isArray(restantes) || restantes.length === 0) {
      return { criadas: [], repetiu: true }
    }

    return { criadas: await inserirOuFalhar(restantes), repetiu: true }
  }
}

function dataLocalSegura(valor) {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate())
  }

  const partes = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!partes) return null
  const data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
  return Number.isNaN(data.getTime()) ? null : data
}

function chaveMes(ano, mesIndice) {
  return `${ano}-${String(mesIndice + 1).padStart(2, '0')}`
}

function indiceMes(data) {
  return data.getFullYear() * 12 + data.getMonth()
}

function formatarCompetencia(ano, mesIndice) {
  const data = new Date(ano, mesIndice, 1)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`
}

function obterReferenciaFiscal(contas, recorrenciaId) {
  return (contas || [])
    .filter((conta) => String(conta?.recorrencia_id || '') === String(recorrenciaId || '') && conta?.imposto_tipo)
    .filter((conta) => dataLocalSegura(conta?.data_vencimento) && dataLocalSegura(conta?.competencia))
    .sort((a, b) => String(b.data_vencimento).localeCompare(String(a.data_vencimento)))[0] || null
}

function metadadosFiscaisParaOcorrencia(referencia, dataVencimento) {
  if (!referencia?.imposto_tipo) return { impostoTipo: null, competencia: null }
  const vencimentoReferencia = dataLocalSegura(referencia.data_vencimento)
  const competenciaReferencia = dataLocalSegura(referencia.competencia)
  const vencimentoGerado = dataLocalSegura(dataVencimento)
  if (!vencimentoReferencia || !competenciaReferencia || !vencimentoGerado) {
    return { impostoTipo: null, competencia: null }
  }

  const diferencaMeses = indiceMes(competenciaReferencia) - indiceMes(vencimentoReferencia)
  return {
    impostoTipo: referencia.imposto_tipo,
    competencia: formatarCompetencia(vencimentoGerado.getFullYear(), vencimentoGerado.getMonth() + diferencaMeses)
  }
}

export function calcularHorizonteRecorrencias(dataBase = new Date(), diasMinimos = DIAS_HORIZONTE_PADRAO) {
  const base = dataLocalSegura(dataBase)
  if (!base) return { inicio: null, fim: null, meses: [], chavesMeses: [] }
  const dias = Math.max(DIAS_HORIZONTE_PADRAO, Number(diasMinimos) || DIAS_HORIZONTE_PADRAO)
  const limite = new Date(base)
  limite.setDate(limite.getDate() + dias)
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1)
  const fim = new Date(limite.getFullYear(), limite.getMonth() + 1, 0)
  const meses = []

  for (let cursor = new Date(inicio); cursor <= fim; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    meses.push({ ano: cursor.getFullYear(), mes: cursor.getMonth() + 1, chave: chaveMes(cursor.getFullYear(), cursor.getMonth()) })
  }

  return { inicio, fim, meses, chavesMeses: meses.map((mes) => mes.chave) }
}

export function planejarContasRecorrentes({
  dataBase = new Date(),
  diasMinimos = DIAS_HORIZONTE_PADRAO,
  seriesRecorrentes = [],
  contasExistentes = []
} = {}) {
  const horizonte = calcularHorizonteRecorrencias(dataBase, diasMinimos)
  const identidadesExistentes = new Set(
    (contasExistentes || [])
      .filter((conta) => conta?.recorrencia_id && conta?.data_vencimento)
      .map((conta) => `${conta.recorrencia_id}|${conta.data_vencimento}`)
  )
  const ocorrencias = []

  for (const recorrencia of (seriesRecorrentes || [])) {
    const tipo = recorrencia?.tipo_recorrencia || recorrencia?.frequencia || 'mensal'
    if (!recorrencia?.id || recorrencia?.ativo !== true || tipo !== 'mensal') continue
    const inicioSerie = recorrencia.data_inicio ? dataLocalSegura(recorrencia.data_inicio) : null
    if (recorrencia.data_inicio && !inicioSerie) continue
    const referenciaFiscal = obterReferenciaFiscal(contasExistentes, recorrencia.id)

    for (const mes of horizonte.meses) {
      const dataVencimento = montarDataRecorrente(mes.ano, mes.mes, recorrencia.dia_vencimento)
      const vencimento = dataLocalSegura(dataVencimento)
      if (!vencimento || (inicioSerie && vencimento < inicioSerie)) continue
      const identidade = `${recorrencia.id}|${dataVencimento}`
      if (identidadesExistentes.has(identidade)) continue
      identidadesExistentes.add(identidade)
      const fiscal = metadadosFiscaisParaOcorrencia(referenciaFiscal, dataVencimento)
      ocorrencias.push({
        identidade,
        recorrencia,
        dataVencimento,
        impostoTipo: fiscal.impostoTipo,
        competencia: fiscal.competencia
      })
    }
  }

  return { horizonte, ocorrencias }
}

export function criarEstadoInicialGruposPeriodo({
  grupos = [],
  dataBase = new Date(),
  diasMinimos = DIAS_HORIZONTE_PADRAO,
  chaveDestacada = ''
} = {}) {
  const chavesHorizonte = new Set(calcularHorizonteRecorrencias(dataBase, diasMinimos).chavesMeses)
  const estado = {}
  for (const grupo of grupos) {
    if (chavesHorizonte.has(grupo?.chave) || grupo?.chave === chaveDestacada) estado[grupo.chave] = true
  }
  return estado
}

export function adicionarGruposPadraoAoEstado(estadoAtual = {}, opcoes = {}) {
  const padrao = criarEstadoInicialGruposPeriodo(opcoes)
  const proximo = { ...estadoAtual }
  let alterado = false
  for (const [chave, aberto] of Object.entries(padrao)) {
    if (!Object.prototype.hasOwnProperty.call(proximo, chave)) {
      proximo[chave] = aberto
      alterado = true
    }
  }
  return alterado ? proximo : estadoAtual
}
