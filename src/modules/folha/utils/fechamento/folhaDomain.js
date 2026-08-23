const CATEGORIAS_HORAS = new Set(['hora_extra_50', 'hora_extra_60', 'hora_extra_100'])
const CATEGORIAS_REPETIVEIS_POR_LANCAMENTO = new Set([
  'plano_saude',
  'outro_credito',
  'outro_desconto',
  'observacao_administrativa'
])

export const CATEGORIAS_OPERACIONAIS_FOLHA = Object.freeze([
  'compras_vales',
  'plano_saude',
  'premiacao',
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'falta_injustificada',
  'pensao_alimenticia',
  'outro_desconto',
  'outro_credito',
  'observacao_administrativa'
])

export function funcionarioSelecionavelParaNovaFolha(funcionario) {
  return Boolean(funcionario && !funcionario.arquivado && String(funcionario.status || '').toLowerCase() !== 'desligado')
}

export function resolverIdentidadeHistoricaFolha(lancamento, funcionario, filiaisPorId = new Map()) {
  const filialId = lancamento?.filial_id_snapshot || lancamento?.filial_id || funcionario?.filial_id || null
  const filialAtual = filialId ? filiaisPorId.get(filialId) : null

  return Object.freeze({
    funcionarioId: lancamento?.funcionario_id || funcionario?.id || null,
    pessoaId: lancamento?.pessoa_id_snapshot || funcionario?.pessoa_id || null,
    nome: String(lancamento?.funcionario_nome_snapshot || funcionario?.nome || '').trim() || 'Colaborador não identificado',
    filialId,
    filialNome: String(
      lancamento?.filial_nome_snapshot
      || filialAtual?.razao_social
      || filialAtual?.nome
      || (filialId ? 'Filial não identificada' : 'Sem filial cadastrada')
    ).trim(),
    cargo: String(lancamento?.cargo_snapshot || funcionario?.cargo || '').trim() || null,
    dataAdmissao: lancamento?.data_admissao_snapshot || funcionario?.data_admissao || null,
    origemSnapshot: lancamento?.snapshot_origem || 'fallback_legado'
  })
}

function textoComparavel(valor) {
  return String(valor ?? '').trim()
}

function instanteCriacao(item) {
  const valor = item?.created_at || item?.criado_em
  if (!valor) return null
  const instante = Date.parse(valor)
  return Number.isFinite(instante) ? instante : null
}

export function ordenarItensFolha(itens = []) {
  return [...itens].sort((a, b) => {
    const legadoA = Boolean(a?.legado || a?.origem_item === 'transicao_lancamento_legado')
    const legadoB = Boolean(b?.legado || b?.origem_item === 'transicao_lancamento_legado')
    if (legadoA !== legadoB) return legadoA ? -1 : 1
    const instanteA = instanteCriacao(a)
    const instanteB = instanteCriacao(b)
    if (instanteA !== null && instanteB !== null && instanteA !== instanteB) return instanteA - instanteB
    if (instanteA === null && instanteB !== null) return -1
    if (instanteA !== null && instanteB === null) return 1
    return textoComparavel(a?.id).localeCompare(textoComparavel(b?.id), 'pt-BR', { numeric: true })
  })
}

export function parseMoedaEntradaFolha(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  let texto = textoComparavel(valor).replace(/\s/g, '').replace(/^R\$/i, '')
  if (!texto) return 0
  if (texto.includes(',')) texto = texto.replaceAll('.', '').replace(',', '.')
  else if ((texto.match(/\./g) || []).length > 1) texto = texto.replaceAll('.', '')
  texto = texto.replace(/[^\d.-]/g, '')
  const numero = Number(texto)
  return Number.isFinite(numero) ? Math.round((numero + Number.EPSILON) * 100) / 100 : 0
}

export function formatarMoedaEntradaFolha(valor) {
  if (valor === '' || valor === null || valor === undefined) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseMoedaEntradaFolha(valor))
}

export function mascararHorasFolha(valor, opcoes = {}) {
  const texto = textoComparavel(valor)
  if (!texto) return ''
  const digitos = texto.replace(/\D/g, '').slice(0, 4)
  if (!digitos) return ''
  if (opcoes.apagando && !texto.includes(':') && digitos.length <= 2) return digitos
  if (digitos.length === 1) return digitos
  if (digitos.length === 2) return `${digitos}:`
  if (digitos.length === 3) return `${digitos.slice(0, 2)}:${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}:${digitos.slice(2, 4)}`
}

export function validarHorasFolha(valor) {
  return /^\d+:[0-5]\d$/.test(textoComparavel(valor))
}

export function interpretarCompetenciaFolha(competencia) {
  const correspondencia = textoComparavel(competencia).match(/^(\d{4})-(\d{2})$/)
  if (!correspondencia) return null
  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  if (!Number.isInteger(ano) || mes < 1 || mes > 12) return null
  return Object.freeze({ ano, mes, texto: `${correspondencia[1]}-${correspondencia[2]}` })
}

export function obterLimitesCompetenciaFolha(competencia) {
  const valor = interpretarCompetenciaFolha(competencia)
  if (!valor) return null
  const ultimoDia = new Date(Date.UTC(valor.ano, valor.mes, 0)).getUTCDate()
  return Object.freeze({
    primeiroDia: `${valor.texto}-01`,
    ultimoDia: `${valor.texto}-${String(ultimoDia).padStart(2, '0')}`
  })
}

export function dataPertenceCompetenciaFolha(data, competencia) {
  const valor = interpretarCompetenciaFolha(competencia)
  const correspondencia = textoComparavel(data).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!valor || !correspondencia) return false
  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  const dia = Number(correspondencia[3])
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return ano === valor.ano && mes === valor.mes && dia >= 1 && dia <= ultimoDia
}

export function mensagemDataCompetenciaFolha(competencia) {
  const valor = interpretarCompetenciaFolha(competencia)
  return valor
    ? `A data deve pertencer à competência ${String(valor.mes).padStart(2, '0')}/${valor.ano}.`
    : 'Selecione uma competência válida antes de informar a data.'
}

export function validarDatasFaltasFolha(datas = [], competencia) {
  const normalizadas = datas.map(textoComparavel)
  if (normalizadas.length === 0 || normalizadas.some((data) => !data)) {
    return Object.freeze({ valido: false, codigo: 'DATAS_OBRIGATORIAS', mensagem: 'Informe todas as datas das faltas.' })
  }
  if (new Set(normalizadas).size !== normalizadas.length) {
    return Object.freeze({ valido: false, codigo: 'DATAS_DUPLICADAS', mensagem: 'As datas das faltas não podem se repetir.' })
  }
  if (normalizadas.some((data) => !dataPertenceCompetenciaFolha(data, competencia))) {
    return Object.freeze({ valido: false, codigo: 'DATA_FORA_COMPETENCIA', mensagem: mensagemDataCompetenciaFolha(competencia) })
  }
  return Object.freeze({ valido: true, codigo: 'OK', mensagem: '', datas: Object.freeze(normalizadas) })
}

export function ajustarDatasFaltasFolha(datas = [], quantidade = 1) {
  const total = Math.max(1, Math.min(31, Number.parseInt(quantidade, 10) || 1))
  return Object.freeze(Array.from({ length: total }, (_, indice) => textoComparavel(datas[indice])))
}

export function planejarSincronizacaoFaltasFolha(itens = [], datas = []) {
  const ativos = ordenarItensFolha(itens.filter((item) => !item?.arquivado))
  const datasDesejadas = datas.map(textoComparavel)
  const conjuntoDesejado = new Set(datasDesejadas)
  const datasExistentes = new Set(ativos.map((item) => textoComparavel(item?.data_referencia)).filter(Boolean))
  return Object.freeze({
    criar: Object.freeze(datasDesejadas.filter((data) => !datasExistentes.has(data))),
    arquivar: Object.freeze(ativos.filter((item) => !conjuntoDesejado.has(textoComparavel(item?.data_referencia)))),
    manter: Object.freeze(ativos.filter((item) => conjuntoDesejado.has(textoComparavel(item?.data_referencia))))
  })
}

export function numeroFolha(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  const hora = String(valor).trim().match(/^(\d+)\s*:\s*([0-5]\d)$/)
  if (hora) return Number(hora[1]) + (Number(hora[2]) / 60)
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

export function calcularPremiacaoFolha(valorVendas, percentual) {
  const taxa = Number(String(percentual ?? '').replace(',', '.'))
  return Math.round((parseMoedaEntradaFolha(valorVendas) * (Number.isFinite(taxa) ? taxa : 0) / 100 + Number.EPSILON) * 100) / 100
}

export function horasFolhaParaPersistencia(valor) {
  const texto = String(valor ?? '').trim()
  if (!validarHorasFolha(texto)) return null
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
  return ordenarItensFolha(itens.filter((item) => item?.lancamento_id === lancamentoId && !item?.arquivado))
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

export function planejarInclusaoPremiacaoFolha({ lancamento, itens = [], novaPremiacao }) {
  const itensDoLancamento = itens.filter((item) => item?.lancamento_id === lancamento?.id)
  const valorLegado = numeroFolha(lancamento?.valor)
  const criacoes = []

  if (itensDoLancamento.length === 0 && valorLegado > 0) {
    const valorBaseLegado = numeroFolha(lancamento?.quantidade)
    const percentualLegado = numeroFolha(lancamento?.percentual)
    const valorCalculado = calcularPremiacaoFolha(valorBaseLegado, percentualLegado)

    if (valorBaseLegado <= 0 || percentualLegado <= 0 || Math.abs(valorCalculado - valorLegado) > 0.01) {
      return Object.freeze({
        erro: 'A premiação legada não possui base e percentual confiáveis para preservar a ocorrência original.',
        criacoes: Object.freeze([])
      })
    }

    criacoes.push({
      valor_base: valorBaseLegado,
      percentual: percentualLegado,
      valor: valorLegado,
      observacao_administrativa: lancamento?.observacao_administrativa || null,
      origem_item: 'transicao_lancamento_legado'
    })
  }

  const valorBase = numeroFolha(novaPremiacao?.valor_base)
  const percentual = numeroFolha(novaPremiacao?.percentual)
  criacoes.push({
    valor_base: valorBase,
    percentual,
    valor: calcularPremiacaoFolha(valorBase, percentual),
    observacao_administrativa: String(novaPremiacao?.observacao_administrativa || '').trim() || null
  })

  return Object.freeze({ erro: null, criacoes: Object.freeze(criacoes.map((item) => Object.freeze(item))) })
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
  return categoria === 'compras_vales' || categoria === 'falta_injustificada' || categoria === 'premiacao' || CATEGORIAS_HORAS.has(categoria)
}

export function categoriaFolhaEhHora(categoria) {
  return CATEGORIAS_HORAS.has(categoria)
}

export function categoriaFolhaEhRepetivelPorLancamento(categoria) {
  return CATEGORIAS_REPETIVEIS_POR_LANCAMENTO.has(categoria)
}

export function localizarLancamentoParaSalvarFolha({ lancamentos = [], funcionarioId, categoria, lancamentoEditandoId }) {
  const ativosDaCategoria = lancamentos.filter((item) => (
    !item?.arquivado
    && item?.funcionario_id === funcionarioId
    && item?.categoria === categoria
  ))
  if (lancamentoEditandoId) {
    return ativosDaCategoria.find((item) => item.id === lancamentoEditandoId) || null
  }
  if (categoriaFolhaEhRepetivelPorLancamento(categoria)) return null
  return ativosDaCategoria[0] || null
}
