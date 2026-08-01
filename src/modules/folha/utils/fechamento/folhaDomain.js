const CATEGORIAS_HORAS = new Set(['hora_extra_50', 'hora_extra_60', 'hora_extra_100'])

export function numeroFolha(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  const hora = String(valor).trim().match(/^(\d+)\s*:\s*([0-5]\d)$/)
  if (hora) return Number(hora[1]) + (Number(hora[2]) / 60)
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

export function calcularPremiacaoFolha(valorVendas, percentual) {
  return Math.round((numeroFolha(valorVendas) * numeroFolha(percentual) / 100 + Number.EPSILON) * 100) / 100
}

export function horasFolhaParaPersistencia(valor) {
  const texto = String(valor ?? '').trim()
  if (!/^(\d+):([0-5]\d)$/.test(texto)) return null
  return numeroFolha(texto)
}

export function horasFolhaParaTexto(valor) {
  const totalMinutos = Math.round(numeroFolha(valor) * 60)
  if (totalMinutos <= 0) return '00:00'
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

export function itensAtivosDoLancamento(itens = [], lancamentoId) {
  return itens.filter((item) => item?.lancamento_id === lancamentoId && !item?.arquivado)
}

export function totalItensFinanceirosFolha(itens = []) {
  return Math.round(itens.filter((item) => !item?.arquivado).reduce((total, item) => total + numeroFolha(item?.valor), 0) * 100) / 100
}

export function planejarInclusaoCompraFolha({ lancamento, itens = [], novaCompra }) {
  const ativos = itensAtivosDoLancamento(itens, lancamento?.id)
  const valorLegado = numeroFolha(lancamento?.valor)
  const criacoes = []

  if (ativos.length === 0 && valorLegado > 0) {
    criacoes.push({
      descricao: lancamento?.descricao || 'Compra 1',
      valor: valorLegado,
      origem_item: 'transicao_lancamento_legado'
    })
  }

  criacoes.push({
    descricao: String(novaCompra?.descricao || '').trim() || null,
    valor: numeroFolha(novaCompra?.valor)
  })

  return Object.freeze(criacoes.map((item) => Object.freeze(item)))
}

export function resolverValorLancamentoFolha(lancamento, itens = []) {
  const ativos = itensAtivosDoLancamento(itens, lancamento?.id)
  if (ativos.length > 0) return totalItensFinanceirosFolha(ativos)
  return numeroFolha(lancamento?.valor)
}

export function quantidadeFaltasFolha(lancamento, itens = []) {
  const ativos = itensAtivosDoLancamento(itens, lancamento?.id)
  if (ativos.length > 0) return ativos.reduce((total, item) => total + Math.max(1, numeroFolha(item?.quantidade)), 0)
  return numeroFolha(lancamento?.quantidade)
}

export function quantidadeHorasFolha(lancamento, itens = []) {
  const ativos = itensAtivosDoLancamento(itens, lancamento?.id)
  if (ativos.length > 0) return ativos.reduce((total, item) => total + numeroFolha(item?.quantidade), 0)
  return numeroFolha(lancamento?.quantidade)
}

export function categoriaFolhaUsaItens(categoria) {
  return categoria === 'compras_vales' || categoria === 'falta_injustificada' || CATEGORIAS_HORAS.has(categoria)
}

export function categoriaFolhaEhHora(categoria) {
  return CATEGORIAS_HORAS.has(categoria)
}
