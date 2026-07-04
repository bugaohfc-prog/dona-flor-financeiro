export const RUBRICA_FATURAMENTO_BRUTO = 'FATURAMENTO BRUTO'
export const RUBRICA_FORNECEDORES_COMPRAS = 'DESEMBOLSO COM FORNECEDORES/COMPRAS'
export const RUBRICA_FOLHA_PAGAMENTO = 'FOLHA DE PAGAMENTO'
export const RUBRICA_IMPOSTOS_FOLHA = 'IMPOSTOS RECOLHIDOS SOBRE FOLHA'
export const RUBRICA_IMPOSTOS_VENDAS = 'IMPOSTOS RECOLHIDOS SOBRE VENDAS'
export const RUBRICA_ALUGUEL = 'ALUGUEL'
export const RUBRICA_UTILIDADES = 'ÁGUA + LUZ + TELEFONE'
export const RUBRICA_PRO_LABORE = 'PRÓ-LABORE'
export const RUBRICA_IMPOSTOS_PARCELADOS = 'IMPOSTOS PARCELADOS'
export const RUBRICA_OUTRAS_OPERACIONAIS = 'OUTRAS DESPESAS OPERACIONAIS *'
export const RUBRICA_OUTRAS_NAO_OPERACIONAIS = 'OUTRAS DESPESAS NÃO OPERACIONAIS *'
export const RUBRICA_JUROS = 'DESPESAS FINANCEIRAS ( JUROS )'
export const RUBRICA_BANCOS_PRINCIPAL = 'DESEMBOLSO MENSAL COM BANCOS (PRINCIPAL)'
export const RUBRICA_TOTAL_GERAL = 'TOTAL GERAL'

export const RUBRICAS_FLUXO_CAIXA = [
  RUBRICA_FATURAMENTO_BRUTO,
  RUBRICA_FORNECEDORES_COMPRAS,
  RUBRICA_FOLHA_PAGAMENTO,
  RUBRICA_IMPOSTOS_FOLHA,
  RUBRICA_IMPOSTOS_VENDAS,
  RUBRICA_ALUGUEL,
  RUBRICA_UTILIDADES,
  RUBRICA_PRO_LABORE,
  RUBRICA_IMPOSTOS_PARCELADOS,
  RUBRICA_OUTRAS_OPERACIONAIS,
  RUBRICA_OUTRAS_NAO_OPERACIONAIS,
  RUBRICA_JUROS,
  RUBRICA_BANCOS_PRINCIPAL,
  RUBRICA_TOTAL_GERAL
]

export const RUBRICAS_SAIDA_FLUXO_CAIXA = RUBRICAS_FLUXO_CAIXA.filter(
  (rubrica) => rubrica !== RUBRICA_FATURAMENTO_BRUTO && rubrica !== RUBRICA_TOTAL_GERAL
)

const CENTROS_DIRETOS = new Map([
  ['mercadoria', RUBRICA_FORNECEDORES_COMPRAS],
  ['rh', RUBRICA_FOLHA_PAGAMENTO],
  ['ocupacao', RUBRICA_ALUGUEL],
  ['utilidades', RUBRICA_UTILIDADES],
  ['administrativo', RUBRICA_OUTRAS_OPERACIONAIS],
  ['operacional', RUBRICA_OUTRAS_OPERACIONAIS],
  ['marketing', RUBRICA_OUTRAS_OPERACIONAIS],
  ['sistemas', RUBRICA_OUTRAS_OPERACIONAIS],
  ['veiculos', RUBRICA_OUTRAS_OPERACIONAIS]
])

const RUBRICA_CENTRO_SUGERIDO = new Map([
  [RUBRICA_FORNECEDORES_COMPRAS, 'Mercadoria'],
  [RUBRICA_FOLHA_PAGAMENTO, 'RH'],
  [RUBRICA_IMPOSTOS_FOLHA, 'Impostos e Taxas'],
  [RUBRICA_IMPOSTOS_VENDAS, 'Impostos e Taxas'],
  [RUBRICA_ALUGUEL, 'Ocupação'],
  [RUBRICA_UTILIDADES, 'Utilidades'],
  [RUBRICA_PRO_LABORE, 'Pessoais'],
  [RUBRICA_IMPOSTOS_PARCELADOS, 'Impostos e Taxas'],
  [RUBRICA_OUTRAS_OPERACIONAIS, 'Administrativo'],
  [RUBRICA_OUTRAS_NAO_OPERACIONAIS, 'Pessoais'],
  [RUBRICA_JUROS, 'Impostos e Taxas'],
  [RUBRICA_BANCOS_PRINCIPAL, 'Administrativo']
])

const termos = {
  juros: ['juros', 'multa', 'mora', 'encargos financeiros', 'tarifa atraso', 'acrescimo', 'acréscimo'],
  proLabore: ['pro labore', 'pró-labore', 'pró labore', 'retirada socio', 'retirada sócio', 'salario socio', 'salário sócio', 'salario dono', 'salário dono', 'pagamento socio', 'pagamento sócio'],
  utilidades: ['agua', 'água', 'daea', 'luz', 'energia', 'cpfl', 'telefone', 'vivo', 'claro', 'tim', ' oi ', 'internet', 'fibra', 'telecom', 'wi-fi', 'wifi'],
  compras: ['fornecedor', 'compra', 'compras', 'mercadoria', 'materia-prima', 'matéria-prima', 'materia prima', 'matéria prima', 'insumo', 'embalagem', 'produto', 'produtos', 'estoque', 'hortifruti', 'acougue', 'açougue', 'mercado', 'supermercado', 'distribuidora'],
  folha: ['salario', 'salário', 'folha', 'pagamento funcionario', 'pagamento funcionário', 'colaborador', 'funcionaria', 'funcionária', 'funcionario', 'funcionário', 'comissao', 'comissão', 'premiacao', 'premiação', 'ajuda de custo', 'diaria', 'diária'],
  impostosFolha: ['fgts', 'inss', 'inss folha', 'darf folha', 'imposto folha', 'guia folha', 'esocial', 'dctfweb', 'encargos folha', 'encargos sobre folha'],
  impostosVendas: ['simples nacional', 'das', 'imposto venda', 'imposto vendas', 'icms', 'iss', 'pis', 'cofins', 'receita federal', 'sefaz'],
  aluguel: ['aluguel', 'locacao', 'locação', 'imovel', 'imóvel', 'sala comercial', 'ponto comercial'],
  parcelados: ['parcelamento', 'imposto parcelado', 'parcela receita', 'negociacao fiscal', 'negociação fiscal', 'divida ativa', 'dívida ativa', 'parcelado receita'],
  bancos: ['banco', 'emprestimo', 'empréstimo', 'financiamento', 'parcela banco', 'principal', 'capital de giro', 'bradesco', 'santander', 'itau', 'itaú', 'caixa', 'sicredi', 'sicoob'],
  naoOperacionais: ['nao operacional', 'não operacional', 'extraordinaria', 'extraordinária', 'indenizacao', 'indenização', 'pessoal', 'pessoais', 'donos']
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function possuiTermo(texto, lista) {
  const normalizado = ` ${normalizarTexto(texto)} `
  return lista.some((termo) => {
    const termoNormalizado = normalizarTexto(termo)
    return normalizado.includes(` ${termoNormalizado} `) || normalizado.includes(termoNormalizado)
  })
}

function obterTextoBusca(movimento = {}) {
  return [
    movimento.descricao,
    movimento.fornecedor,
    movimento.categoria,
    movimento.observacao,
    movimento.observacao_pagamento,
    movimento.tipo,
    movimento.forma_pagamento,
    movimento.filial_nome,
    movimento.centro_custo_nome,
    movimento.centro,
    movimento.imposto_tipo
  ].filter(Boolean).join(' ')
}

function classificarPorTermos(texto, criterio = 'descricao') {
  if (possuiTermo(texto, termos.proLabore)) return { rubrica: RUBRICA_PRO_LABORE, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.utilidades)) return { rubrica: RUBRICA_UTILIDADES, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.parcelados)) return { rubrica: RUBRICA_IMPOSTOS_PARCELADOS, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.impostosFolha)) return { rubrica: RUBRICA_IMPOSTOS_FOLHA, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.impostosVendas)) return { rubrica: RUBRICA_IMPOSTOS_VENDAS, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.aluguel)) return { rubrica: RUBRICA_ALUGUEL, confianca: 'alta', criterio }
  if (possuiTermo(texto, termos.folha)) return { rubrica: RUBRICA_FOLHA_PAGAMENTO, confianca: 'media', criterio }
  if (possuiTermo(texto, termos.compras)) return { rubrica: RUBRICA_FORNECEDORES_COMPRAS, confianca: 'media', criterio }
  if (possuiTermo(texto, termos.bancos)) return { rubrica: RUBRICA_BANCOS_PRINCIPAL, confianca: 'media', criterio }
  if (possuiTermo(texto, termos.naoOperacionais)) return { rubrica: RUBRICA_OUTRAS_NAO_OPERACIONAIS, confianca: 'media', criterio }
  return null
}

export function classificarRubricaFluxoCaixa(movimento = {}) {
  if (movimento.rubrica_forcada) {
    return completarClassificacao({
      rubrica: movimento.rubrica_forcada,
      confianca: 'alta',
      criterio: movimento.rubrica_criterio_forcado || 'juros_multa'
    })
  }

  const textoBusca = obterTextoBusca(movimento)
  const centro = normalizarTexto(movimento.centro_custo_nome || movimento.centro)
  const filial = normalizarTexto(movimento.filial_nome)

  if (possuiTermo(textoBusca, termos.impostosFolha)) {
    return completarClassificacao({ rubrica: RUBRICA_IMPOSTOS_FOLHA, confianca: 'alta', criterio: 'descricao' })
  }

  if (centro === 'impostos e taxas') {
    const porTermos = classificarPorTermos(textoBusca, 'descricao')
    if (porTermos) return completarClassificacao(porTermos)
    return completarClassificacao({ rubrica: RUBRICA_IMPOSTOS_VENDAS, confianca: 'baixa', criterio: 'centro_custo' })
  }

  if (centro === 'pessoais' || filial === 'pessoal') {
    if (possuiTermo(textoBusca, termos.proLabore)) {
      return completarClassificacao({ rubrica: RUBRICA_PRO_LABORE, confianca: 'alta', criterio: 'descricao' })
    }
    return completarClassificacao({ rubrica: RUBRICA_OUTRAS_NAO_OPERACIONAIS, confianca: 'alta', criterio: centro === 'pessoais' ? 'centro_custo' : 'filial' })
  }

  if (CENTROS_DIRETOS.has(centro)) {
    return completarClassificacao({ rubrica: CENTROS_DIRETOS.get(centro), confianca: 'alta', criterio: 'centro_custo' })
  }

  const porTermos = classificarPorTermos(textoBusca, 'descricao')
  if (porTermos) return completarClassificacao(porTermos)

  return completarClassificacao({ rubrica: RUBRICA_OUTRAS_OPERACIONAIS, confianca: 'baixa', criterio: 'fallback' })
}

export function deveSepararJurosFluxoCaixa(movimento = {}) {
  const textoBusca = obterTextoBusca(movimento)
  const jurosValor = Number(movimento.juros_multa || 0)
  return jurosValor > 0 && !possuiTermo(textoBusca, termos.impostosFolha)
}

function completarClassificacao(classificacao) {
  return {
    centroCustoSugerido: RUBRICA_CENTRO_SUGERIDO.get(classificacao.rubrica) || '',
    ...classificacao
  }
}
