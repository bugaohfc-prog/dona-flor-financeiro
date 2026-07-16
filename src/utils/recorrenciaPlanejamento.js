import { montarDataRecorrente } from './recorrencia.js'

const DIAS_HORIZONTE_PADRAO = 90
const MOTIVOS_AUTORIZADOS = new Set(['criacao', 'atualizacao', 'reativacao'])
export const INDICE_RECORRENCIA_ATIVA = 'uq_df_contas_recorrencia_vencimento_ativas'

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

function indiceMes(data) { return data.getFullYear() * 12 + data.getMonth() }
function formatarCompetencia(ano, mesIndice) {
  const data = new Date(ano, mesIndice, 1)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`
}
function chaveMes(data) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}` }

function obterReferenciaFiscal(contas, recorrenciaId) {
  return (contas || [])
    .filter((conta) => String(conta?.recorrencia_id || '') === String(recorrenciaId || '') && conta?.imposto_tipo)
    .sort((a, b) => String(b.data_vencimento || '').localeCompare(String(a.data_vencimento || '')))[0] || null
}

function obterMetadadosFiscais(referencia, dataVencimento, inconsistencias, recorrenciaId) {
  if (!referencia?.imposto_tipo) return { impostoTipo: null, competencia: null }
  const vencimentoReferencia = dataLocalSegura(referencia.data_vencimento)
  const competenciaReferencia = dataLocalSegura(referencia.competencia)
  const vencimentoGerado = dataLocalSegura(dataVencimento)
  if (!vencimentoReferencia || !competenciaReferencia || !vencimentoGerado) {
    if (!inconsistencias.some((item) => item.tipo === 'referencia_fiscal_invalida' && item.recorrenciaId === recorrenciaId)) {
      inconsistencias.push({ tipo: 'referencia_fiscal_invalida', recorrenciaId })
    }
    return { impostoTipo: null, competencia: null }
  }
  const deslocamento = indiceMes(competenciaReferencia) - indiceMes(vencimentoReferencia)
  return {
    impostoTipo: referencia.imposto_tipo,
    competencia: formatarCompetencia(vencimentoGerado.getFullYear(), vencimentoGerado.getMonth() + deslocamento)
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
    meses.push({ ano: cursor.getFullYear(), mes: cursor.getMonth() + 1, chave: chaveMes(cursor) })
  }
  return { inicio, fim, meses, chavesMeses: meses.map((mes) => mes.chave) }
}

export function planejarContasRecorrentes({ dataBase = new Date(), diasMinimos = DIAS_HORIZONTE_PADRAO, seriesRecorrentes = [], contasExistentes = [] } = {}) {
  const horizonte = calcularHorizonteRecorrencias(dataBase, diasMinimos)
  const identidadesExistentes = new Set((contasExistentes || [])
    .filter((conta) => conta?.recorrencia_id && conta?.data_vencimento)
    .map((conta) => `${conta.recorrencia_id}|${conta.data_vencimento}`))
  const ocorrencias = []
  const inconsistencias = []
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
      const fiscal = obterMetadadosFiscais(referenciaFiscal, dataVencimento, inconsistencias, recorrencia.id)
      ocorrencias.push({ identidade, recorrencia, dataVencimento, ...fiscal })
    }
  }
  return { horizonte, ocorrencias, inconsistencias }
}

export function ehConflitoRecorrenciaAtiva(erro) {
  if (String(erro?.code || '') !== '23505') return false
  return [erro?.constraint, erro?.message, erro?.details, erro?.hint].filter(Boolean)
    .some((valor) => String(valor).includes(INDICE_RECORRENCIA_ATIVA))
}

function resultadoBase(sobrescritas = {}) {
  return { criadas: [], jaExistentes: [], ignoradas: [], inconsistencias: [], erro: null, parcial: false, ignorado: false, ...sobrescritas }
}

export async function executarPlanejamentoRecorrencias({ motivo, planejar, inserir, reconciliar } = {}) {
  if (motivo && !MOTIVOS_AUTORIZADOS.has(motivo)) return resultadoBase({ ignorado: true })
  try {
    const planejadas = await planejar?.() || []
    if (!planejadas.length) return resultadoBase()
    const primeira = await inserir(planejadas)
    if (!primeira?.error) return resultadoBase({ criadas: primeira?.data || [] })
    if (!ehConflitoRecorrenciaAtiva(primeira.error)) return resultadoBase({ erro: primeira.error })
    const restantes = await reconciliar()
    const identidadesRestantes = new Set((restantes || []).map((item) => item.identidade))
    const jaExistentes = planejadas.filter((item) => !identidadesRestantes.has(item.identidade))
    if (!restantes?.length) return resultadoBase({ jaExistentes })
    const segunda = await inserir(restantes)
    if (!segunda?.error) return resultadoBase({ criadas: segunda?.data || [], jaExistentes })
    if (ehConflitoRecorrenciaAtiva(segunda.error)) return resultadoBase({ jaExistentes, ignoradas: restantes, parcial: true })
    return resultadoBase({ jaExistentes, erro: segunda.error, parcial: true })
  } catch (erro) {
    return resultadoBase({ erro })
  }
}

export function criarControleLoading() {
  let pendentesVisiveis = 0
  let montado = true
  return {
    iniciar(visivel = true) {
      if (visivel) pendentesVisiveis += 1
      return { visivel, finalizada: false }
    },
    finalizar(operacao) {
      if (!operacao || operacao.finalizada) return false
      operacao.finalizada = true
      if (operacao.visivel) pendentesVisiveis = Math.max(0, pendentesVisiveis - 1)
      return montado && operacao.visivel && pendentesVisiveis === 0
    },
    desmontar() {
      montado = false
      pendentesVisiveis = 0
    }
  }
}

export function criarControleOperacao() {
  let sequencia = 0
  let montado = true
  let atual = null
  return {
    iniciar(empresaId) { atual = { empresaId, id: ++sequencia }; return atual },
    estaAtual(operacao) { return Boolean(montado && operacao && atual?.id === operacao.id && atual?.empresaId === operacao.empresaId) },
    desmontar() { montado = false; atual = null }
  }
}

export async function executarCarregamentoContas({ carregarContas, carregarSeries, enriquecerContas, finalizar } = {}) {
  try {
    const [contas, seriesRecorrentes] = await Promise.all([carregarContas(), carregarSeries()])
    const contasEnriquecidas = await enriquecerContas(contas || [])
    return { contas: contasEnriquecidas, seriesRecorrentes: seriesRecorrentes || [] }
  } finally {
    finalizar?.()
  }
}
