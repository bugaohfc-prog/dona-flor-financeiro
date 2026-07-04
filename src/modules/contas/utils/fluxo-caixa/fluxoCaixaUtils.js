import {
  RUBRICA_FATURAMENTO_BRUTO,
  RUBRICA_OUTRAS_OPERACIONAIS,
  RUBRICA_TOTAL_GERAL,
  RUBRICAS_SAIDA_FLUXO_CAIXA,
  classificarRubricaFluxoCaixa
} from './classificarRubricaFluxoCaixa'

export const MESES_FLUXO_CAIXA = [
  { numero: 1, chave: 'jan', nome: 'Janeiro' },
  { numero: 2, chave: 'fev', nome: 'Fevereiro' },
  { numero: 3, chave: 'mar', nome: 'Março' },
  { numero: 4, chave: 'abr', nome: 'Abril' },
  { numero: 5, chave: 'mai', nome: 'Maio' },
  { numero: 6, chave: 'jun', nome: 'Junho' },
  { numero: 7, chave: 'jul', nome: 'Julho' },
  { numero: 8, chave: 'ago', nome: 'Agosto' },
  { numero: 9, chave: 'set', nome: 'Setembro' },
  { numero: 10, chave: 'out', nome: 'Outubro' },
  { numero: 11, chave: 'nov', nome: 'Novembro' },
  { numero: 12, chave: 'dez', nome: 'Dezembro' }
]

export function anoAtual() {
  return new Date().getFullYear()
}

export function normalizarValor(valor) {
  const numero = Number(valor || 0)
  if (!Number.isFinite(numero)) return 0
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

export function formatarMoedaFluxo(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(normalizarValor(valor))
}

export function formatarDataFluxo(data) {
  const texto = String(data || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return '-'
  const [ano, mes, dia] = texto.split('-')
  return `${dia}/${mes}/${ano}`
}

export function obterMesDataPagamento(dataPagamento) {
  const texto = String(dataPagamento || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null
  const mes = Number(texto.slice(5, 7))
  return mes >= 1 && mes <= 12 ? mes : null
}

function criarLinhaMes(mes) {
  return {
    mes: mes.numero,
    chave: mes.chave,
    nome: mes.nome,
    entradas: 0,
    saidas: 0,
    saldo: 0,
    movimentos: 0
  }
}

function criarLinhaRubrica(rubrica) {
  const meses = MESES_FLUXO_CAIXA.reduce((acc, mes) => {
    acc[mes.chave] = 0
    return acc
  }, {})

  return {
    rubrica,
    ...meses,
    total: 0,
    movimentos: 0
  }
}

function enriquecerMovimentoComRubrica(movimento) {
  const classificacao = classificarRubricaFluxoCaixa(movimento)
  return {
    ...movimento,
    rubrica: classificacao.rubrica,
    rubrica_confianca: classificacao.confianca,
    rubrica_criterio: classificacao.criterio
  }
}

export function montarMovimentosFluxoCaixa({
  contasPagas = [],
  pagamentosParciais = [],
  contasPorId = new Map(),
  filiaisPorId = new Map(),
  filialId = ''
}) {
  const pagamentosAtivos = (pagamentosParciais || []).filter((pagamento) => (
    pagamento &&
    pagamento.arquivado !== true &&
    normalizarValor(pagamento.valor_pago) > 0 &&
    pagamento.data_pagamento
  ))
  const contasComParciaisAtivos = new Set(pagamentosAtivos.map((pagamento) => pagamento.conta_id).filter(Boolean))

  const movimentosParciais = pagamentosAtivos
    .map((pagamento) => {
      const conta = contasPorId.get(pagamento.conta_id) || {}
      const filialContaId = conta.filial_id || ''
      if (filialId && filialContaId !== filialId) return null

      return enriquecerMovimentoComRubrica({
        id: pagamento.id,
        origem: 'pagamento_parcial',
        conta_id: pagamento.conta_id,
        pagamento_id: pagamento.id,
        descricao: conta.descricao || 'Pagamento parcial',
        observacao: pagamento.observacao || conta.observacao_pagamento || conta.observacao || '',
        observacao_pagamento: conta.observacao_pagamento || '',
        data_pagamento: pagamento.data_pagamento,
        mes: obterMesDataPagamento(pagamento.data_pagamento),
        valor: normalizarValor(pagamento.valor_pago),
        tipo: 'saida',
        filial_id: filialContaId,
        filial_nome: filiaisPorId.get(filialContaId)?.nome || 'Sem filial',
        centro_custo_id: conta.centro_custo_id || '',
        centro_custo_nome: conta.df_centros_custo?.nome || '',
        imposto_tipo: conta.imposto_tipo || '',
        juros_multa: conta.juros_multa || 0,
        desconto: conta.desconto || 0
      })
    })
    .filter(Boolean)
    .filter((movimento) => movimento.mes)

  const movimentosContasPagas = (contasPagas || [])
    .filter((conta) => conta?.status === 'pago')
    .filter((conta) => conta?.data_pagamento)
    .filter((conta) => !contasComParciaisAtivos.has(conta.id))
    .filter((conta) => !filialId || (conta.filial_id || '') === filialId)
    .map((conta) => enriquecerMovimentoComRubrica({
      id: conta.id,
      origem: 'conta_paga',
      conta_id: conta.id,
      pagamento_id: null,
      descricao: conta.descricao || 'Conta paga',
      observacao: conta.observacao_pagamento || conta.observacao || '',
      observacao_pagamento: conta.observacao_pagamento || '',
      data_pagamento: conta.data_pagamento,
      mes: obterMesDataPagamento(conta.data_pagamento),
      valor: normalizarValor(conta.valor_pago ?? conta.valor),
      tipo: 'saida',
      filial_id: conta.filial_id || '',
      filial_nome: filiaisPorId.get(conta.filial_id || '')?.nome || 'Sem filial',
      centro_custo_id: conta.centro_custo_id || '',
      centro_custo_nome: conta.df_centros_custo?.nome || '',
      imposto_tipo: conta.imposto_tipo || '',
      juros_multa: conta.juros_multa || 0,
      desconto: conta.desconto || 0
    }))
    .filter((movimento) => movimento.mes && movimento.valor > 0)

  return [...movimentosParciais, ...movimentosContasPagas]
}

export function agregarSaidasPorRubrica(movimentos = []) {
  const linhasPorRubrica = new Map(RUBRICAS_SAIDA_FLUXO_CAIXA.map((rubrica) => [rubrica, criarLinhaRubrica(rubrica)]))
  const mesesPorNumero = new Map(MESES_FLUXO_CAIXA.map((mes) => [mes.numero, mes]))

  ;(movimentos || []).forEach((movimento) => {
    if (movimento.tipo === 'entrada') return
    const rubrica = linhasPorRubrica.has(movimento.rubrica) ? movimento.rubrica : RUBRICA_OUTRAS_OPERACIONAIS
    const mes = mesesPorNumero.get(movimento.mes)
    if (!mes) return
    const linha = linhasPorRubrica.get(rubrica)
    const valor = normalizarValor(movimento.valor)
    linha[mes.chave] = normalizarValor(linha[mes.chave] + valor)
    linha.total = normalizarValor(linha.total + valor)
    linha.movimentos += 1
  })

  return RUBRICAS_SAIDA_FLUXO_CAIXA.map((rubrica) => linhasPorRubrica.get(rubrica))
}

export function calcularDiagnosticoRubricas(movimentos = [], rubricas = []) {
  const saidas = (movimentos || []).filter((movimento) => movimento.tipo !== 'entrada')
  const totalMovimentos = saidas.length
  const totalMovimentosRubricas = (rubricas || []).reduce((total, rubrica) => total + (rubrica.movimentos || 0), 0)
  const totalSaidasRubricas = normalizarValor((rubricas || []).reduce((total, rubrica) => total + (rubrica.total || 0), 0))

  return {
    totalMovimentos,
    totalMovimentosRubricas,
    totalSaidasRubricas,
    movimentosOperacionais: saidas.filter((movimento) => movimento.rubrica === 'OUTRAS DESPESAS OPERACIONAIS *').length,
    movimentosNaoOperacionais: saidas.filter((movimento) => movimento.rubrica === 'OUTRAS DESPESAS NÃO OPERACIONAIS *').length,
    classificadosCentroCusto: saidas.filter((movimento) => movimento.rubrica_criterio === 'centro_custo').length,
    classificadosDescricao: saidas.filter((movimento) => ['descricao', 'juros', 'filial'].includes(movimento.rubrica_criterio)).length,
    classificadosFallback: saidas.filter((movimento) => movimento.rubrica_criterio === 'fallback').length,
    movimentosPerdidos: Math.max(totalMovimentos - totalMovimentosRubricas, 0)
  }
}

export function agregarFluxoCaixaMensal(movimentos = []) {
  const linhas = MESES_FLUXO_CAIXA.map(criarLinhaMes)
  const linhasPorMes = new Map(linhas.map((linha) => [linha.mes, linha]))

  ;(movimentos || []).forEach((movimento) => {
    const linha = linhasPorMes.get(movimento.mes)
    if (!linha) return

    const valor = normalizarValor(movimento.valor)
    if (movimento.tipo === 'entrada') linha.entradas += valor
    else linha.saidas += valor
    linha.movimentos += 1
    linha.saldo = normalizarValor(linha.entradas - linha.saidas)
  })

  const totalEntradas = normalizarValor(linhas.reduce((total, linha) => total + linha.entradas, 0))
  const totalSaidas = normalizarValor(linhas.reduce((total, linha) => total + linha.saidas, 0))
  const totalSaldo = normalizarValor(totalEntradas - totalSaidas)
  const totalMovimentos = linhas.reduce((total, linha) => total + linha.movimentos, 0)

  return {
    linhas: linhas.map((linha) => ({
      ...linha,
      entradas: normalizarValor(linha.entradas),
      saidas: normalizarValor(linha.saidas),
      saldo: normalizarValor(linha.saldo)
    })),
    totais: {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalSaldo,
      movimentos: totalMovimentos
    }
  }
}

export function prepararLinhasCsvFluxoCaixa(resultado, rubricas = []) {
  const valoresPorMes = new Map((resultado?.linhas || []).map((linha) => [linha.mes, linha]))
  const linhaFaturamento = [
    RUBRICA_FATURAMENTO_BRUTO,
    ...MESES_FLUXO_CAIXA.map((mes) => numeroCsv(valoresPorMes.get(mes.numero)?.entradas)),
    numeroCsv(resultado?.totais?.entradas)
  ]
  const linhasRubricas = (rubricas || []).map((rubrica) => [
    rubrica.rubrica,
    ...MESES_FLUXO_CAIXA.map((mes) => numeroCsv(rubrica[mes.chave])),
    numeroCsv(rubrica.total)
  ])
  const linhaTotal = [
    RUBRICA_TOTAL_GERAL,
    ...MESES_FLUXO_CAIXA.map((mes) => numeroCsv(valoresPorMes.get(mes.numero)?.saldo)),
    numeroCsv(resultado?.totais?.saldo)
  ]

  return [linhaFaturamento, ...linhasRubricas, linhaTotal]
}

function numeroCsv(valor) {
  return normalizarValor(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function montarAbaModeloFluxoCaixa({ titulo, filialNome, ano, resultado, rubricas, observacao }) {
  const meses = MESES_FLUXO_CAIXA.map((mes) => mes.nome)
  const valoresPorMes = new Map((resultado?.linhas || []).map((linha) => [linha.mes, linha]))
  const linhaPorCampo = (rotulo, campo) => {
    const valores = MESES_FLUXO_CAIXA.map((mes) => normalizarValor(valoresPorMes.get(mes.numero)?.[campo]))
    const total = normalizarValor(valores.reduce((soma, valor) => soma + valor, 0))
    return [rotulo, ...valores, total]
  }
  const linhasRubricas = (rubricas || []).map((rubrica) => [
    rubrica.rubrica,
    ...MESES_FLUXO_CAIXA.map((mes) => normalizarValor(rubrica[mes.chave])),
    normalizarValor(rubrica.total)
  ])

  return [
    [titulo],
    ['Filial', filialNome || 'Todas as filiais'],
    ['Ano', ano],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    ['Observação', observacao],
    [],
    ['Rubrica', ...meses, 'Total anual'],
    linhaPorCampo('FATURAMENTO BRUTO', 'entradas'),
    ...linhasRubricas,
    linhaPorCampo('TOTAL GERAL', 'saldo'),
    [],
    ['Mês', ...meses, 'Total anual'],
    ['Quantidade de movimentos', ...MESES_FLUXO_CAIXA.map((mes) => valoresPorMes.get(mes.numero)?.movimentos || 0), resultado?.totais?.movimentos || 0]
  ]
}

export function agregarMovimentosPorFilial(movimentos = [], filiais = []) {
  const filiaisPorId = new Map((filiais || []).map((filial) => [filial.id, filial]))
  const grupos = new Map()

  ;(movimentos || []).forEach((movimento) => {
    const chave = movimento.filial_id || 'sem-filial'
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        filialId: chave,
        filialNome: filiaisPorId.get(chave)?.nome || movimento.filial_nome || 'Sem filial',
        movimentos: []
      })
    }
    grupos.get(chave).movimentos.push(movimento)
  })

  return Array.from(grupos.values())
    .sort((a, b) => a.filialNome.localeCompare(b.filialNome, 'pt-BR'))
    .map((grupo) => ({
      ...grupo,
      resultado: agregarFluxoCaixaMensal(grupo.movimentos),
      rubricas: agregarSaidasPorRubrica(grupo.movimentos)
    }))
}
