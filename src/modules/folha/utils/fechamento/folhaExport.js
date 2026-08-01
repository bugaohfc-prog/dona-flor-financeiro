import { createXlsxBlob, downloadBlob } from '../../../../services/export/reportExportService.js'
import {
  horasFolhaParaTexto,
  itensAtivosDoLancamento,
  numeroFolha,
  quantidadeFaltasFolha,
  quantidadeHorasFolha,
  resolverValorLancamentoFolha
} from './folhaDomain.js'

function texto(valor) {
  return String(valor ?? '').trim()
}

function ordenarTexto(a, b) {
  return texto(a).localeCompare(texto(b), 'pt-BR', { sensitivity: 'base' })
}

function criarContexto(params = {}) {
  const funcionariosPorId = new Map((params.funcionarios || []).map((item) => [item.id, item]))
  const filiaisPorId = new Map((params.filiais || []).map((item) => [item.id, item]))
  const itensAtivos = (params.itensLancamentos || []).filter((item) => !item?.arquivado)
  const lancamentosAtivos = (params.lancamentos || []).filter((item) => !item?.arquivado)

  return { funcionariosPorId, filiaisPorId, itensAtivos, lancamentosAtivos }
}

function resolverFilial(contexto, lancamento) {
  const funcionario = contexto.funcionariosPorId.get(lancamento.funcionario_id)
  const filialId = lancamento.filial_id || funcionario?.filial_id || '__sem_filial'
  return {
    id: filialId,
    nome: contexto.filiaisPorId.get(filialId)?.nome || (filialId === '__sem_filial' ? 'Sem filial' : 'Filial não identificada')
  }
}

function resolverFuncionario(contexto, lancamento) {
  return {
    id: lancamento.funcionario_id || '__sem_funcionario',
    nome: contexto.funcionariosPorId.get(lancamento.funcionario_id)?.nome || 'Colaborador não identificado'
  }
}

function chaveGrupo(filialId, funcionarioId) {
  return `${filialId}::${funcionarioId}`
}

function obterOuCriarGrupo(mapa, contexto, lancamento) {
  const filial = resolverFilial(contexto, lancamento)
  const funcionario = resolverFuncionario(contexto, lancamento)
  const chave = chaveGrupo(filial.id, funcionario.id)

  if (!mapa.has(chave)) {
    mapa.set(chave, {
      filialId: filial.id,
      filial: filial.nome,
      funcionarioId: funcionario.id,
      colaboradora: funcionario.nome,
      compras: [],
      planoSaude: 0,
      premiacao: 0,
      he50: 0,
      he60: 0,
      he100: 0,
      faltas: 0,
      datasFaltas: new Set(),
      observacoes: new Set()
    })
  }

  return mapa.get(chave)
}

function comprasDoLancamento(contexto, lancamento) {
  const itens = itensAtivosDoLancamento(contexto.itensAtivos, lancamento.id)
  if (itens.length > 0) return itens.map((item) => numeroFolha(item.valor)).filter((valor) => valor > 0)
  const valorLegado = numeroFolha(lancamento.valor)
  return valorLegado > 0 ? [valorLegado] : []
}

function observacoesLancamento(contexto, lancamento) {
  const itens = itensAtivosDoLancamento(contexto.itensAtivos, lancamento.id)
  return [lancamento.observacao_administrativa, lancamento.descricao, ...itens.flatMap((item) => [item.observacao_administrativa, item.descricao])]
    .map(texto)
    .filter(Boolean)
}

function consolidarFolha(params = {}) {
  const contexto = criarContexto(params)
  const mapa = new Map()

  for (const lancamento of contexto.lancamentosAtivos) {
    const grupo = obterOuCriarGrupo(mapa, contexto, lancamento)
    const itens = itensAtivosDoLancamento(contexto.itensAtivos, lancamento.id)

    if (lancamento.categoria === 'compras_vales') grupo.compras.push(...comprasDoLancamento(contexto, lancamento))
    if (lancamento.categoria === 'plano_saude') grupo.planoSaude += numeroFolha(lancamento.valor)
    if (lancamento.categoria === 'premiacao') grupo.premiacao += resolverValorLancamentoFolha(lancamento, contexto.itensAtivos)
    if (lancamento.categoria === 'hora_extra_50') grupo.he50 += quantidadeHorasFolha(lancamento, contexto.itensAtivos)
    if (lancamento.categoria === 'hora_extra_60') grupo.he60 += quantidadeHorasFolha(lancamento, contexto.itensAtivos)
    if (lancamento.categoria === 'hora_extra_100') grupo.he100 += quantidadeHorasFolha(lancamento, contexto.itensAtivos)
    if (lancamento.categoria === 'falta_injustificada') {
      grupo.faltas += quantidadeFaltasFolha(lancamento, contexto.itensAtivos)
      const datas = itens.length > 0 ? itens.map((item) => item.data_referencia) : [lancamento.data_referencia]
      datas.map(texto).filter(Boolean).forEach((data) => grupo.datasFaltas.add(data))
    }

    observacoesLancamento(contexto, lancamento).forEach((observacao) => grupo.observacoes.add(observacao))
  }

  return Array.from(mapa.values())
    .map((grupo) => ({
      ...grupo,
      totalCompras: Math.round(grupo.compras.reduce((total, valor) => total + valor, 0) * 100) / 100,
      datasFaltas: Array.from(grupo.datasFaltas).sort(),
      observacoes: Array.from(grupo.observacoes)
    }))
    .sort((a, b) => ordenarTexto(a.filial, b.filial) || ordenarTexto(a.colaboradora, b.colaboradora) || ordenarTexto(a.funcionarioId, b.funcionarioId))
}

function agruparPorFilial(linhas) {
  const mapa = new Map()
  for (const linha of linhas) {
    if (!mapa.has(linha.filialId)) mapa.set(linha.filialId, { filialId: linha.filialId, filial: linha.filial, linhas: [] })
    mapa.get(linha.filialId).linhas.push(linha)
  }
  return Array.from(mapa.values()).sort((a, b) => ordenarTexto(a.filial, b.filial) || ordenarTexto(a.filialId, b.filialId))
}

export function montarControleComprasFolha(params = {}) {
  const consolidados = consolidarFolha(params).filter((linha) => linha.compras.length > 0)
  const maximoCompras = Math.max(0, ...consolidados.map((linha) => linha.compras.length))
  const headers = ['Colaboradora', ...Array.from({ length: maximoCompras }, (_, indice) => `Compra ${indice + 1}`), 'Total']
  const blocos = agruparPorFilial(consolidados).map((bloco) => ({
    filialId: bloco.filialId,
    filial: bloco.filial,
    headers,
    linhas: bloco.linhas.map((linha) => ({
      funcionarioId: linha.funcionarioId,
      colaboradora: linha.colaboradora,
      compras: [...linha.compras],
      total: linha.totalCompras
    }))
  }))
  const rows = [
    ['CONTROLE DE COMPRAS — CONFERÊNCIA'],
    [`Competência: ${texto(params.competencia)}`],
    []
  ]

  for (const bloco of blocos) {
    rows.push([bloco.filial], headers)
    bloco.linhas.forEach((linha) => rows.push([
      linha.colaboradora,
      ...Array.from({ length: maximoCompras }, (_, indice) => linha.compras[indice] ?? ''),
      linha.total
    ]))
    rows.push([])
  }

  return Object.freeze({
    tipo: 'controle_compras',
    competencia: texto(params.competencia),
    arquivo: `controle-compras-conferencia-${texto(params.competencia) || 'folha'}.xlsx`,
    aba: 'Controle de Compras',
    blocos,
    maximoCompras,
    totalGeral: consolidados.reduce((total, linha) => total + linha.totalCompras, 0),
    sheet: {
      name: 'Controle de Compras',
      rows,
      landscape: true,
      fitToWidth: 1,
      currencyColumns: Array.from({ length: maximoCompras + 1 }, (_, indice) => indice + 1)
    }
  })
}

export function montarFechamentoFolhaContabilidade(params = {}) {
  const headers = ['Colaborador', 'Compras', 'Plano de saúde', 'Premiação', 'HE 50%', 'HE 60%', 'HE 100%', 'Faltas', 'Datas das faltas', 'Observações']
  const consolidados = consolidarFolha(params)
  const blocos = agruparPorFilial(consolidados).map((bloco) => ({
    filialId: bloco.filialId,
    filial: bloco.filial,
    headers,
    linhas: bloco.linhas.map((linha) => ({
      funcionarioId: linha.funcionarioId,
      colaborador: linha.colaboradora,
      compras: linha.totalCompras,
      planoSaude: Math.round(linha.planoSaude * 100) / 100,
      premiacao: Math.round(linha.premiacao * 100) / 100,
      he50: horasFolhaParaTexto(linha.he50),
      he60: horasFolhaParaTexto(linha.he60),
      he100: horasFolhaParaTexto(linha.he100),
      faltas: linha.faltas,
      datasFaltas: linha.datasFaltas,
      observacoes: linha.observacoes
    }))
  }))
  const rows = [
    ['FECHAMENTO DE FOLHA — CONTABILIDADE'],
    [`Competência: ${texto(params.competencia)}`],
    []
  ]

  for (const bloco of blocos) {
    rows.push([bloco.filial], headers)
    bloco.linhas.forEach((linha) => rows.push([
      linha.colaborador,
      linha.compras,
      linha.planoSaude,
      linha.premiacao,
      linha.he50,
      linha.he60,
      linha.he100,
      linha.faltas,
      linha.datasFaltas.join(', '),
      linha.observacoes.join(' | ')
    ]))
    rows.push([])
  }

  return Object.freeze({
    tipo: 'fechamento_contabilidade',
    competencia: texto(params.competencia),
    arquivo: `fechamento-folha-contabilidade-${texto(params.competencia) || 'folha'}.xlsx`,
    aba: 'Fechamento de Folha',
    blocos,
    sheet: { name: 'Fechamento de Folha', rows, landscape: true, fitToWidth: 1, currencyColumns: [1, 2, 3] }
  })
}

function baixarModelo(modelo) {
  downloadBlob(modelo.arquivo, createXlsxBlob([modelo.sheet]))
  return modelo
}

export function exportarControleCompras(params) {
  return baixarModelo(montarControleComprasFolha(params))
}

export function exportarConsolidadoContabil(params) {
  return baixarModelo(montarFechamentoFolhaContabilidade(params))
}
