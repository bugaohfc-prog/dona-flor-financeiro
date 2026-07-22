import { montarDataRecorrente } from './recorrencia.js'

function dataLocal(valor) {
  const partes = String(valor || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!partes) return null
  const data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
  return Number.isNaN(data.getTime()) ? null : data
}

function dataIso(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function somarDias(data, dias) {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

export function resolverHorizonteCobertura(tipo = '90', dataBase = new Date(), personalizado = {}) {
  const hoje = dataBase instanceof Date
    ? new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate())
    : dataLocal(dataBase)
  if (!hoje) return { inicio: '', fim: '', tipo }
  if (tipo === 'mes_atual') return { inicio: dataIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), fim: dataIso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)), tipo }
  if (tipo === 'proximo_mes') return { inicio: dataIso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)), fim: dataIso(new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)), tipo }
  if (tipo === 'personalizado') {
    const inicio = dataLocal(personalizado.inicio)
    const fim = dataLocal(personalizado.fim)
    return inicio && fim && inicio <= fim ? { inicio: dataIso(inicio), fim: dataIso(fim), tipo } : { inicio: '', fim: '', tipo }
  }
  const dias = ['30', '60', '90'].includes(String(tipo)) ? Number(tipo) : 90
  return { inicio: dataIso(hoje), fim: dataIso(somarDias(hoje, dias)), tipo: String(tipo) }
}

function normalizarTexto(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function avaliarOrganizacao(serie, conta) {
  return {
    incompativel: Boolean(serie.filial_id && conta.filial_id && serie.filial_id !== conta.filial_id) || Boolean(serie.centro_custo_id && conta.centro_custo_id && serie.centro_custo_id !== conta.centro_custo_id),
    filialConfirmada: Boolean(serie.filial_id && conta.filial_id && serie.filial_id === conta.filial_id),
    centroConfirmado: Boolean(serie.centro_custo_id && conta.centro_custo_id && serie.centro_custo_id === conta.centro_custo_id)
  }
}

function competenciaEsperada(contas, recorrenciaId, dataVencimento) {
  const referencia = (contas || [])
    .filter((conta) => conta?.recorrencia_id === recorrenciaId && dataLocal(conta.data_vencimento) && dataLocal(conta.competencia))
    .sort((a, b) => String(b.data_vencimento).localeCompare(String(a.data_vencimento)))[0]
  if (!referencia) return null
  const vencimentoReferencia = dataLocal(referencia.data_vencimento)
  const competenciaReferencia = dataLocal(referencia.competencia)
  const vencimento = dataLocal(dataVencimento)
  const deslocamento = (competenciaReferencia.getFullYear() * 12 + competenciaReferencia.getMonth()) - (vencimentoReferencia.getFullYear() * 12 + vencimentoReferencia.getMonth())
  return dataIso(new Date(vencimento.getFullYear(), vencimento.getMonth() + deslocamento, 1))
}

function avaliarSugestaoManual(serie, ocorrencia, conta) {
  if (conta.recorrencia_id || conta.excluido === true || conta.deletado === true) return null
  const criterios = []
  const mesmaData = String(conta.data_vencimento || '').slice(0, 10) === ocorrencia.dataVencimento
  const mesmaCompetencia = Boolean(conta.competencia && ocorrencia.competencia && String(conta.competencia).slice(0, 7) === String(ocorrencia.competencia).slice(0, 7))
  const descricaoSerie = normalizarTexto(serie.descricao)
  const descricaoConta = normalizarTexto(conta.descricao)
  const mesmaDescricao = Boolean(descricaoSerie && descricaoConta && (descricaoSerie === descricaoConta || descricaoConta.includes(descricaoSerie) || descricaoSerie.includes(descricaoConta)))
  const organizacao = avaliarOrganizacao(serie, conta)
  const valorCompativel = serie.valor_variavel === true || Math.abs(Number(serie.valor || 0) - Number(conta.valor || 0)) < 0.01
  if (mesmaData) criterios.push('mesmo vencimento')
  if (mesmaCompetencia) criterios.push('mesma competência')
  if (mesmaDescricao) criterios.push('descrição compatível')
  if (organizacao.filialConfirmada) criterios.push('filial compatível')
  if (organizacao.centroConfirmado) criterios.push('centro compatível')
  if (valorCompativel) criterios.push(serie.valor_variavel === true ? 'valor variável' : 'mesmo valor')
  if (!mesmaData && !mesmaCompetencia) return null
  if (organizacao.incompativel) return null
  const organizacaoConfirmada = organizacao.filialConfirmada && organizacao.centroConfirmado
  const confianca = mesmaData && mesmaDescricao && valorCompativel && organizacaoConfirmada ? 'forte' : criterios.length >= 2 ? 'possivel' : null
  return confianca ? { conta, confianca, criterios } : null
}

export function calcularCoberturaRecorrencias({ series = [], contas = [], horizonte } = {}) {
  const inicio = dataLocal(horizonte?.inicio)
  const fim = dataLocal(horizonte?.fim)
  if (!inicio || !fim || inicio > fim) return { recorrencias: [], ocorrencias: [], resumo: { recorrenciasAtivas: 0, esperadas: 0, cobertas: 0, faltantes: 0, faltantesPuras: 0, possiveisManuais: 0, duplicadas: 0, valorFixoProjetado: 0, variaveisSemProjecao: 0, inconsistencias: 0 }, inconsistencias: [] }
  const contasValidas = (contas || []).filter((conta) => conta?.excluido !== true && conta?.deletado !== true)
  const vinculadas = new Map()
  contasValidas.filter((conta) => conta.recorrencia_id && conta.data_vencimento).forEach((conta) => {
    const chave = `${conta.recorrencia_id}|${String(conta.data_vencimento).slice(0, 10)}`
    if (!vinculadas.has(chave)) vinculadas.set(chave, [])
    vinculadas.get(chave).push(conta)
  })
  const manuais = contasValidas.filter((conta) => !conta.recorrencia_id)
  const inconsistencias = []
  const ocorrencias = []

  ;(series || []).forEach((serie) => {
    if (!serie?.id || serie.ativo !== true) return
    const tipo = String(serie.tipo_recorrencia || serie.frequencia || 'mensal').toLowerCase()
    if (tipo !== 'mensal') {
      inconsistencias.push({ tipo: 'frequencia_nao_suportada', recorrenciaId: serie.id })
      return
    }
    const inicioSerie = serie.data_inicio ? dataLocal(serie.data_inicio) : null
    const fimSerie = serie.data_fim ? dataLocal(serie.data_fim) : null
    if (serie.data_inicio && !inicioSerie) {
      inconsistencias.push({ tipo: 'data_inicio_invalida', recorrenciaId: serie.id })
      return
    }
    for (let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1); cursor <= fim; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
      const dataVencimento = montarDataRecorrente(cursor.getFullYear(), cursor.getMonth() + 1, serie.dia_vencimento)
      const vencimento = dataLocal(dataVencimento)
      if (!vencimento || vencimento < inicio || vencimento > fim || (inicioSerie && vencimento < inicioSerie) || (fimSerie && vencimento > fimSerie)) continue
      const identidade = `${serie.id}|${dataVencimento}`
      const contasVinculadas = vinculadas.get(identidade) || []
      const competencia = competenciaEsperada(contasValidas, serie.id, dataVencimento)
      const sugestoes = contasVinculadas.length ? [] : manuais.map((conta) => avaliarSugestaoManual(serie, { dataVencimento, competencia }, conta)).filter(Boolean)
        .sort((a, b) => (a.confianca === 'forte' ? -1 : 1) - (b.confianca === 'forte' ? -1 : 1)).slice(0, 5)
      const cobertura = contasVinculadas.length > 1 ? 'duplicada' : contasVinculadas.length === 1 ? 'coberta' : sugestoes.length ? 'possivel_manual' : 'faltante'
      ocorrencias.push({ identidade, recorrenciaId: serie.id, serie, dataVencimento, competencia, contasVinculadas, cobertura, sugestoes })
    }
  })

  const porSerie = new Map()
  ocorrencias.forEach((ocorrencia) => {
    if (!porSerie.has(ocorrencia.recorrenciaId)) porSerie.set(ocorrencia.recorrenciaId, { serie: ocorrencia.serie, ocorrencias: [] })
    porSerie.get(ocorrencia.recorrenciaId).ocorrencias.push(ocorrencia)
  })
  const resumo = {
    recorrenciasAtivas: (series || []).filter((serie) => serie?.ativo === true).length,
    esperadas: ocorrencias.length,
    cobertas: ocorrencias.filter((item) => item.cobertura === 'coberta').length,
    faltantes: ocorrencias.filter((item) => item.cobertura === 'faltante' || item.cobertura === 'possivel_manual').length,
    faltantesPuras: ocorrencias.filter((item) => item.cobertura === 'faltante').length,
    possiveisManuais: ocorrencias.filter((item) => item.cobertura === 'possivel_manual').length,
    duplicadas: ocorrencias.filter((item) => item.cobertura === 'duplicada').length,
    valorFixoProjetado: ocorrencias.filter((item) => item.serie.valor_variavel !== true).reduce((total, item) => total + Math.round(Number(item.serie.valor || 0) * 100), 0) / 100,
    variaveisSemProjecao: ocorrencias.filter((item) => item.serie.valor_variavel === true).length,
    inconsistencias: inconsistencias.length
  }
  return { recorrencias: Array.from(porSerie.values()), ocorrencias, resumo, inconsistencias }
}

export function filtrarCoberturaRecorrencias(resultado, filtros = {}) {
  const termo = normalizarTexto(filtros.busca)
  const ocorrencias = (resultado?.ocorrencias || []).filter((item) => {
    if (filtros.filialId && item.serie.filial_id !== filtros.filialId) return false
    if (filtros.centroId && item.serie.centro_custo_id !== filtros.centroId) return false
    if (filtros.cobertura && filtros.cobertura !== 'todas' && item.cobertura !== filtros.cobertura) return false
    return !termo || normalizarTexto(item.serie.descricao).includes(termo)
  })
  const ids = new Set(ocorrencias.map((item) => item.recorrenciaId))
  return { ...resultado, ocorrencias, recorrencias: (resultado?.recorrencias || []).filter((item) => ids.has(item.serie.id)).map((item) => ({ ...item, ocorrencias: ocorrencias.filter((ocorrencia) => ocorrencia.recorrenciaId === item.serie.id) })) }
}
