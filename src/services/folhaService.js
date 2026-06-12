import {
  atualizarPorEmpresa,
  inserirComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'
import { assertEmpresaId } from './tenantService'

const TABELA_FOLHA_COMPETENCIAS = 'df_folha_competencias'
const TABELA_FOLHA_LANCAMENTOS = 'df_folha_lancamentos'
const TABELA_FOLHA_LANCAMENTO_ITENS = 'df_folha_lancamento_itens'

const COMPETENCIA_SELECT = [
  'id',
  'empresa_id',
  'competencia',
  'status',
  'observacao_administrativa',
  'fechado_em',
  'fechado_por',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

const LANCAMENTO_SELECT = [
  'id',
  'empresa_id',
  'competencia_id',
  'funcionario_id',
  'filial_id',
  'natureza',
  'categoria',
  'descricao',
  'data_referencia',
  'quantidade',
  'percentual',
  'valor',
  'observacao_administrativa',
  'origem_lancamento',
  'origem_id',
  'conferido',
  'conferido_em',
  'conferido_por',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

const COMPETENCIA_AGENDA_SELECT = [
  'id',
  'empresa_id',
  'competencia',
  'status',
  'arquivado',
  'criado_em',
  'atualizado_em'
].join(', ')

const LANCAMENTO_ITEM_SELECT = [
  'id',
  'empresa_id',
  'competencia_id',
  'lancamento_id',
  'funcionario_id',
  'filial_id',
  'categoria',
  'descricao',
  'data_referencia',
  'quantidade',
  'percentual',
  'valor_base',
  'valor',
  'observacao_administrativa',
  'origem_item',
  'conferido',
  'conferido_em',
  'conferido_por',
  'arquivado',
  'arquivado_em',
  'criado_em',
  'atualizado_em'
].join(', ')

export const STATUS_COMPETENCIA_FOLHA = Object.freeze([
  'aberta',
  'em_conferencia',
  'validada',
  'enviada_contabilidade',
  'fechada',
  'arquivada'
])

export const NATUREZAS_FOLHA = Object.freeze(['credito', 'desconto', 'informativo'])

export const CATEGORIAS_CREDITO_FOLHA = Object.freeze([
  'premiacao',
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'outro_credito'
])

export const CATEGORIAS_DESCONTO_FOLHA = Object.freeze([
  'compras_vales',
  'plano_saude',
  'falta_injustificada',
  'pensao_alimenticia',
  'outro_desconto'
])

export const CATEGORIAS_INFORMATIVO_FOLHA = Object.freeze([
  'observacao_administrativa',
  'data_falta',
  'status_conferencia',
  'origem_lancamento'
])

export const CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO = Object.freeze([
  'premiacao',
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'outro_credito',
  'compras_vales',
  'plano_saude',
  'pensao_alimenticia',
  'outro_desconto'
])

export const CATEGORIAS_ITENS_DETALHADOS_FOLHA = Object.freeze([
  'compras_vales',
  'falta_injustificada',
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'premiacao'
])

const STATUS_COMPETENCIA_SET = new Set(STATUS_COMPETENCIA_FOLHA)
const NATUREZAS_SET = new Set(NATUREZAS_FOLHA)
const CATEGORIAS_CREDITO_SET = new Set(CATEGORIAS_CREDITO_FOLHA)
const CATEGORIAS_DESCONTO_SET = new Set(CATEGORIAS_DESCONTO_FOLHA)
const CATEGORIAS_INFORMATIVO_SET = new Set(CATEGORIAS_INFORMATIVO_FOLHA)
const CATEGORIAS_VALOR_OBRIGATORIO_SET = new Set(CATEGORIAS_FINANCEIRAS_COM_VALOR_OBRIGATORIO)
const CATEGORIAS_ITENS_DETALHADOS_SET = new Set(CATEGORIAS_ITENS_DETALHADOS_FOLHA)

const CAMPOS_PROIBIDOS = new Set([
  'empresa_id',
  'empresaId',
  'id',
  'cid',
  'CID',
  'laudo',
  'laudos',
  'diagnostico',
  'diagnóstico',
  'doenca',
  'doença',
  'dado_medico',
  'dados_medicos',
  'dadosMédicos',
  'resultado_exame',
  'resultadoExame',
  'documento',
  'documentos',
  'anexo',
  'anexos',
  'upload',
  'uploads',
  'base64',
  'link_publico',
  'linkPublico',
  'url_documento',
  'urlDocumento'
])

const CAMPOS_COMPETENCIA_CRIAR = new Set([
  'competencia',
  'status',
  'observacao_administrativa',
  'observacaoAdministrativa'
])

const CAMPOS_COMPETENCIA_ATUALIZAR = new Set([
  'status',
  'observacao_administrativa',
  'observacaoAdministrativa',
  'fechado_em',
  'fechadoEm',
  'arquivado',
  'arquivado_em',
  'arquivadoEm'
])

const CAMPOS_LANCAMENTO_CRIAR = new Set([
  'competencia_id',
  'competenciaId',
  'funcionario_id',
  'funcionarioId',
  'filial_id',
  'filialId',
  'natureza',
  'categoria',
  'descricao',
  'data_referencia',
  'dataReferencia',
  'quantidade',
  'percentual',
  'valor',
  'observacao_administrativa',
  'observacaoAdministrativa',
  'origem_lancamento',
  'origemLancamento',
  'origem_id',
  'origemId'
])

const CAMPOS_LANCAMENTO_ATUALIZAR = new Set([
  'natureza',
  'categoria',
  'descricao',
  'data_referencia',
  'dataReferencia',
  'quantidade',
  'percentual',
  'valor',
  'observacao_administrativa',
  'observacaoAdministrativa',
  'origem_lancamento',
  'origemLancamento',
  'origem_id',
  'origemId',
  'conferido',
  'conferido_em',
  'conferidoEm',
  'arquivado',
  'arquivado_em',
  'arquivadoEm'
])

const CAMPOS_LANCAMENTO_ITEM_CRIAR = new Set([
  'competencia_id',
  'competenciaId',
  'lancamento_id',
  'lancamentoId',
  'funcionario_id',
  'funcionarioId',
  'filial_id',
  'filialId',
  'categoria',
  'descricao',
  'data_referencia',
  'dataReferencia',
  'quantidade',
  'percentual',
  'valor_base',
  'valorBase',
  'valor',
  'observacao_administrativa',
  'observacaoAdministrativa',
  'origem_item',
  'origemItem'
])

const CAMPOS_LANCAMENTO_ITEM_ATUALIZAR = new Set([
  'categoria',
  'descricao',
  'data_referencia',
  'dataReferencia',
  'quantidade',
  'percentual',
  'valor_base',
  'valorBase',
  'valor',
  'observacao_administrativa',
  'observacaoAdministrativa',
  'origem_item',
  'origemItem',
  'conferido',
  'conferido_em',
  'conferidoEm',
  'arquivado',
  'arquivado_em',
  'arquivadoEm'
])

function normalizarId(valor, mensagem) {
  const id = String(valor || '').trim()
  if (!id) throw new Error(mensagem)
  return id
}

function validarEmpresaId(empresaId) {
  return assertEmpresaId(normalizarId(empresaId, 'Empresa ativa nao identificada.'))
}

function validarCompetenciaId(competenciaId) {
  return normalizarId(competenciaId, 'Competencia de folha nao identificada.')
}

function validarLancamentoId(lancamentoId) {
  return normalizarId(lancamentoId, 'Lancamento de folha nao identificado.')
}

function validarFuncionarioId(funcionarioId) {
  return normalizarId(funcionarioId, 'Funcionario nao identificado.')
}

function entradaObjeto(dados) {
  return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {}
}

function obterCampo(entrada, nomeSnake, nomeCamel) {
  if (Object.prototype.hasOwnProperty.call(entrada, nomeSnake)) return entrada[nomeSnake]
  if (Object.prototype.hasOwnProperty.call(entrada, nomeCamel)) return entrada[nomeCamel]
  return undefined
}

function garantirCamposPermitidos(entrada, camposPermitidos) {
  Object.keys(entrada).forEach((campo) => {
    if (CAMPOS_PROIBIDOS.has(campo)) {
      throw new Error(`Campo nao permitido para folha: ${campo}.`)
    }

    if (!camposPermitidos.has(campo)) {
      throw new Error(`Campo desconhecido para folha: ${campo}.`)
    }
  })
}

function normalizarTexto(valor) {
  const texto = String(valor || '').trim().replace(/\s+/g, ' ')
  return texto || null
}

function normalizarData(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return null
  const data = texto.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Data invalida.')
  return data
}

function normalizarCompetencia(valor) {
  const competencia = String(valor || '').trim()
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) {
    throw new Error('Competencia deve estar no formato YYYY-MM.')
  }
  return competencia
}

function normalizarStatusCompetencia(valor, obrigatorio = false) {
  const status = String(valor || '').trim().toLowerCase()
  if (!status && !obrigatorio) return undefined
  const statusFinal = status || 'aberta'

  if (!STATUS_COMPETENCIA_SET.has(statusFinal)) {
    throw new Error('Status da competencia de folha invalido.')
  }

  return statusFinal
}

function normalizarNatureza(valor) {
  const natureza = String(valor || '').trim().toLowerCase()
  if (!NATUREZAS_SET.has(natureza)) throw new Error('Natureza do lancamento de folha invalida.')
  return natureza
}

function normalizarCategoria(valor) {
  const categoria = String(valor || '').trim().toLowerCase()
  if (
    !CATEGORIAS_CREDITO_SET.has(categoria) &&
    !CATEGORIAS_DESCONTO_SET.has(categoria) &&
    !CATEGORIAS_INFORMATIVO_SET.has(categoria)
  ) {
    throw new Error('Categoria do lancamento de folha invalida.')
  }
  return categoria
}

function normalizarCategoriaItem(valor) {
  const categoria = String(valor || '').trim().toLowerCase()
  if (!CATEGORIAS_ITENS_DETALHADOS_SET.has(categoria)) {
    throw new Error('Categoria de item detalhado de folha invalida.')
  }
  return categoria
}

function normalizarNumero(valor, nomeCampo) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`${nomeCampo} deve ser maior ou igual a zero.`)
  }
  return numero
}

function normalizarBoolean(valor) {
  return Boolean(valor)
}

function naturezaEsperadaCategoria(categoria) {
  if (CATEGORIAS_CREDITO_SET.has(categoria)) return 'credito'
  if (CATEGORIAS_DESCONTO_SET.has(categoria)) return 'desconto'
  return 'informativo'
}

function validarNaturezaCategoria(natureza, categoria) {
  const esperada = naturezaEsperadaCategoria(categoria)
  if (natureza !== esperada) {
    throw new Error('Natureza incoerente com a categoria do lancamento.')
  }
}

function validarDescricaoOutros(categoria, descricao) {
  if ((categoria === 'outro_credito' || categoria === 'outro_desconto') && !normalizarTexto(descricao)) {
    throw new Error('Informe uma descricao para outro credito/outro desconto.')
  }
}

function validarValorCategoria(categoria, valor) {
  if (CATEGORIAS_VALOR_OBRIGATORIO_SET.has(categoria) && valor === null) {
    throw new Error('Informe o valor do lancamento de folha.')
  }
}

function percentualEsperadoHoraExtra(categoria) {
  if (categoria === 'hora_extra_50') return 50
  if (categoria === 'hora_extra_60') return 60
  if (categoria === 'hora_extra_100') return 100
  return null
}

function montarPayloadItemDetalhadoBase(entrada) {
  const categoria = normalizarCategoriaItem(entrada.categoria)
  const quantidade = normalizarNumero(entrada.quantidade, 'Quantidade')
  const percentual = normalizarNumero(entrada.percentual, 'Percentual')
  const valorBase = normalizarNumero(obterCampo(entrada, 'valor_base', 'valorBase'), 'Valor base')
  const valor = normalizarNumero(entrada.valor, 'Valor')
  const dataReferencia = normalizarData(obterCampo(entrada, 'data_referencia', 'dataReferencia'))
  const payload = {
    categoria,
    descricao: normalizarTexto(entrada.descricao),
    data_referencia: dataReferencia,
    quantidade,
    percentual,
    valor_base: valorBase,
    valor: valor === null ? 0 : valor,
    observacao_administrativa: normalizarTexto(
      obterCampo(entrada, 'observacao_administrativa', 'observacaoAdministrativa')
    ),
    origem_item: normalizarTexto(obterCampo(entrada, 'origem_item', 'origemItem'))
  }

  if (categoria === 'compras_vales') {
    if (valor === null || valor <= 0) throw new Error('Item de compra/vale exige valor maior que zero.')
    payload.percentual = null
    payload.valor_base = null
  } else if (categoria === 'falta_injustificada') {
    if (!dataReferencia) throw new Error('Item de falta exige data de referencia.')
    if (quantidade === null || quantidade <= 0) throw new Error('Item de falta exige quantidade maior que zero.')
    payload.percentual = null
    payload.valor_base = null
    payload.valor = 0
  } else if (percentualEsperadoHoraExtra(categoria) !== null) {
    const esperado = percentualEsperadoHoraExtra(categoria)
    if (quantidade === null || quantidade <= 0) throw new Error('Item de hora extra exige quantidade de horas maior que zero.')
    if (percentual !== esperado) throw new Error(`Item de hora extra exige percentual ${esperado}.`)
    payload.valor_base = null
    payload.valor = 0
  } else if (categoria === 'premiacao') {
    if (valorBase === null || valorBase <= 0) throw new Error('Item de premiacao exige valor base maior que zero.')
    if (percentual === null || percentual <= 0) throw new Error('Item de premiacao exige percentual maior que zero.')
    payload.quantidade = null
    payload.valor = Number(((valorBase * percentual) / 100).toFixed(2))
  }

  return payload
}

function montarPayloadItemDetalhadoCriacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_LANCAMENTO_ITEM_CRIAR)
  const payload = montarPayloadItemDetalhadoBase(entrada)

  return {
    ...payload,
    competencia_id: validarCompetenciaId(obterCampo(entrada, 'competencia_id', 'competenciaId')),
    lancamento_id: validarLancamentoId(obterCampo(entrada, 'lancamento_id', 'lancamentoId')),
    funcionario_id: validarFuncionarioId(obterCampo(entrada, 'funcionario_id', 'funcionarioId')),
    filial_id: normalizarTexto(obterCampo(entrada, 'filial_id', 'filialId'))
  }
}

function montarPayloadItemDetalhadoAtualizacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_LANCAMENTO_ITEM_ATUALIZAR)
  const payload = montarPayloadItemDetalhadoBase(entrada)

  if (Object.prototype.hasOwnProperty.call(entrada, 'conferido')) {
    payload.conferido = normalizarBoolean(entrada.conferido)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'conferido_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'conferidoEm')) {
    const valor = obterCampo(entrada, 'conferido_em', 'conferidoEm')
    payload.conferido_em = valor ? new Date(valor).toISOString() : null
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado')) {
    payload.arquivado = normalizarBoolean(entrada.arquivado)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'arquivadoEm')) {
    const valor = obterCampo(entrada, 'arquivado_em', 'arquivadoEm')
    payload.arquivado_em = valor ? new Date(valor).toISOString() : null
  }

  return payload
}

function montarPayloadCompetenciaCriacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_COMPETENCIA_CRIAR)

  const payload = {
    competencia: normalizarCompetencia(entrada.competencia),
    status: normalizarStatusCompetencia(entrada.status, false) || 'aberta'
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'observacao_administrativa') ||
      Object.prototype.hasOwnProperty.call(entrada, 'observacaoAdministrativa')) {
    payload.observacao_administrativa = normalizarTexto(
      obterCampo(entrada, 'observacao_administrativa', 'observacaoAdministrativa')
    )
  }

  return payload
}

function montarPayloadCompetenciaAtualizacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_COMPETENCIA_ATUALIZAR)
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(entrada, 'status')) {
    payload.status = normalizarStatusCompetencia(entrada.status, true)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'observacao_administrativa') ||
      Object.prototype.hasOwnProperty.call(entrada, 'observacaoAdministrativa')) {
    payload.observacao_administrativa = normalizarTexto(
      obterCampo(entrada, 'observacao_administrativa', 'observacaoAdministrativa')
    )
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'fechado_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'fechadoEm')) {
    payload.fechado_em = normalizarData(obterCampo(entrada, 'fechado_em', 'fechadoEm'))
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado')) {
    payload.arquivado = normalizarBoolean(entrada.arquivado)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'arquivadoEm')) {
    const valor = obterCampo(entrada, 'arquivado_em', 'arquivadoEm')
    payload.arquivado_em = valor ? new Date(valor).toISOString() : null
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Nenhum dado de competencia informado para salvar.')
  }

  return payload
}

function montarPayloadLancamentoCriacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_LANCAMENTO_CRIAR)
  const competenciaId = validarCompetenciaId(obterCampo(entrada, 'competencia_id', 'competenciaId'))
  const funcionarioId = validarFuncionarioId(obterCampo(entrada, 'funcionario_id', 'funcionarioId'))
  const natureza = normalizarNatureza(entrada.natureza)
  const categoria = normalizarCategoria(entrada.categoria)
  const descricao = normalizarTexto(entrada.descricao)
  const valor = normalizarNumero(entrada.valor, 'Valor')

  validarNaturezaCategoria(natureza, categoria)
  validarDescricaoOutros(categoria, descricao)
  validarValorCategoria(categoria, valor)

  return {
    competencia_id: competenciaId,
    funcionario_id: funcionarioId,
    filial_id: normalizarTexto(obterCampo(entrada, 'filial_id', 'filialId')),
    natureza,
    categoria,
    descricao,
    data_referencia: normalizarData(obterCampo(entrada, 'data_referencia', 'dataReferencia')),
    quantidade: normalizarNumero(entrada.quantidade, 'Quantidade'),
    percentual: normalizarNumero(entrada.percentual, 'Percentual'),
    valor,
    observacao_administrativa: normalizarTexto(
      obterCampo(entrada, 'observacao_administrativa', 'observacaoAdministrativa')
    ),
    origem_lancamento: normalizarTexto(obterCampo(entrada, 'origem_lancamento', 'origemLancamento')),
    origem_id: normalizarTexto(obterCampo(entrada, 'origem_id', 'origemId'))
  }
}

function montarPayloadLancamentoAtualizacao(dados = {}) {
  const entrada = entradaObjeto(dados)
  garantirCamposPermitidos(entrada, CAMPOS_LANCAMENTO_ATUALIZAR)
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(entrada, 'natureza')) {
    payload.natureza = normalizarNatureza(entrada.natureza)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'categoria')) {
    payload.categoria = normalizarCategoria(entrada.categoria)
  }

  if (payload.natureza && payload.categoria) {
    validarNaturezaCategoria(payload.natureza, payload.categoria)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'descricao')) {
    payload.descricao = normalizarTexto(entrada.descricao)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'data_referencia') ||
      Object.prototype.hasOwnProperty.call(entrada, 'dataReferencia')) {
    payload.data_referencia = normalizarData(obterCampo(entrada, 'data_referencia', 'dataReferencia'))
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'quantidade')) {
    payload.quantidade = normalizarNumero(entrada.quantidade, 'Quantidade')
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'percentual')) {
    payload.percentual = normalizarNumero(entrada.percentual, 'Percentual')
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'valor')) {
    payload.valor = normalizarNumero(entrada.valor, 'Valor')
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'observacao_administrativa') ||
      Object.prototype.hasOwnProperty.call(entrada, 'observacaoAdministrativa')) {
    payload.observacao_administrativa = normalizarTexto(
      obterCampo(entrada, 'observacao_administrativa', 'observacaoAdministrativa')
    )
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'origem_lancamento') ||
      Object.prototype.hasOwnProperty.call(entrada, 'origemLancamento')) {
    payload.origem_lancamento = normalizarTexto(obterCampo(entrada, 'origem_lancamento', 'origemLancamento'))
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'origem_id') ||
      Object.prototype.hasOwnProperty.call(entrada, 'origemId')) {
    payload.origem_id = normalizarTexto(obterCampo(entrada, 'origem_id', 'origemId'))
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'conferido')) {
    payload.conferido = normalizarBoolean(entrada.conferido)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'conferido_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'conferidoEm')) {
    const valor = obterCampo(entrada, 'conferido_em', 'conferidoEm')
    payload.conferido_em = valor ? new Date(valor).toISOString() : null
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado')) {
    payload.arquivado = normalizarBoolean(entrada.arquivado)
  }

  if (Object.prototype.hasOwnProperty.call(entrada, 'arquivado_em') ||
      Object.prototype.hasOwnProperty.call(entrada, 'arquivadoEm')) {
    const valor = obterCampo(entrada, 'arquivado_em', 'arquivadoEm')
    payload.arquivado_em = valor ? new Date(valor).toISOString() : null
  }

  if (payload.categoria) {
    validarDescricaoOutros(payload.categoria, Object.prototype.hasOwnProperty.call(payload, 'descricao')
      ? payload.descricao
      : entrada.descricao)
    if (Object.prototype.hasOwnProperty.call(payload, 'valor')) {
      validarValorCategoria(payload.categoria, payload.valor)
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Nenhum dado de lancamento informado para salvar.')
  }

  return payload
}

export function calcularResumoFolhaCompetencia(lancamentos = []) {
  return (lancamentos || []).reduce((resumo, lancamento) => {
    const valor = Number(lancamento?.valor) || 0

    if (lancamento?.arquivado) {
      resumo.quantidadeArquivados += 1
    }

    resumo.quantidadeLancamentos += 1

    if (lancamento?.natureza === 'credito' && !lancamento?.arquivado) {
      resumo.totalCreditos += valor
    } else if (lancamento?.natureza === 'desconto' && !lancamento?.arquivado) {
      resumo.totalDescontos += valor
    } else if (lancamento?.natureza === 'informativo' && !lancamento?.arquivado) {
      resumo.totalInformativos += 1
    }

    resumo.saldoInformativo = resumo.totalCreditos - resumo.totalDescontos
    return resumo
  }, {
    totalCreditos: 0,
    totalDescontos: 0,
    totalInformativos: 0,
    saldoInformativo: 0,
    quantidadeLancamentos: 0,
    quantidadeArquivados: 0
  })
}

export async function listarCompetenciasFolha({ supabase, empresaId, incluirArquivadas = false }) {
  const empresa = validarEmpresaId(empresaId)

  let query = selecionarPorEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, empresa, COMPETENCIA_SELECT)
    .order('competencia', { ascending: false })
    .order('criado_em', { ascending: false })

  if (!incluirArquivadas) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function listarCompetenciasFolhaAgenda({ supabase, empresaId }) {
  const empresa = validarEmpresaId(empresaId)

  return selecionarPorEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, empresa, COMPETENCIA_AGENDA_SELECT)
    .eq('arquivado', false)
    .in('status', ['aberta', 'em_conferencia', 'pendente'])
    .order('competencia', { ascending: false })
    .order('criado_em', { ascending: false })
}

export async function criarCompetenciaFolha({ supabase, empresaId, dados }) {
  const empresa = validarEmpresaId(empresaId)

  const payload = {
    ...montarPayloadCompetenciaCriacao(dados),
    empresa_id: empresa,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, payload, { select: COMPETENCIA_SELECT })
    .single()
}

export async function atualizarCompetenciaFolha({ supabase, empresaId, id, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const competenciaId = validarCompetenciaId(id)
  const payload = montarPayloadCompetenciaAtualizacao(dados)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, competenciaId, empresa, payload)
    .select(COMPETENCIA_SELECT)
    .single()
}

export async function arquivarCompetenciaFolha({ supabase, empresaId, id }) {
  const empresa = validarEmpresaId(empresaId)
  const competenciaId = validarCompetenciaId(id)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, competenciaId, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(COMPETENCIA_SELECT)
    .single()
}

export async function reativarCompetenciaFolha({ supabase, empresaId, id }) {
  const empresa = validarEmpresaId(empresaId)
  const competenciaId = validarCompetenciaId(id)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_COMPETENCIAS, competenciaId, empresa, {
    arquivado: false,
    arquivado_em: null
  })
    .select(COMPETENCIA_SELECT)
    .single()
}

export async function listarLancamentosFolha({
  supabase,
  empresaId,
  competenciaId,
  funcionarioId,
  incluirArquivados = false
}) {
  const empresa = validarEmpresaId(empresaId)
  const competencia = validarCompetenciaId(competenciaId)

  let query = selecionarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTOS, empresa, LANCAMENTO_SELECT)
    .eq('competencia_id', competencia)
    .order('data_referencia', { ascending: false, nullsFirst: false })
    .order('criado_em', { ascending: false })

  if (funcionarioId) {
    query = query.eq('funcionario_id', validarFuncionarioId(funcionarioId))
  }

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function listarItensLancamentosFolha({
  supabase,
  empresaId,
  competenciaId,
  lancamentoId,
  incluirArquivados = false
}) {
  const empresa = validarEmpresaId(empresaId)
  const competencia = validarCompetenciaId(competenciaId)

  let query = selecionarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTO_ITENS, empresa, LANCAMENTO_ITEM_SELECT)
    .eq('competencia_id', competencia)
    .order('data_referencia', { ascending: false, nullsFirst: false })
    .order('criado_em', { ascending: false })

  if (lancamentoId) {
    query = query.eq('lancamento_id', validarLancamentoId(lancamentoId))
  }

  if (!incluirArquivados) {
    query = query.eq('arquivado', false)
  }

  return query
}

export async function criarLancamentoFolha({ supabase, empresaId, dados }) {
  const empresa = validarEmpresaId(empresaId)

  const payload = {
    ...montarPayloadLancamentoCriacao(dados),
    empresa_id: empresa,
    conferido: false,
    conferido_em: null,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_FOLHA_LANCAMENTOS, payload, { select: LANCAMENTO_SELECT })
    .single()
}

export async function criarItemLancamentoFolha({ supabase, empresaId, dados }) {
  const empresa = validarEmpresaId(empresaId)

  const payload = {
    ...montarPayloadItemDetalhadoCriacao(dados),
    empresa_id: empresa,
    conferido: false,
    conferido_em: null,
    arquivado: false,
    arquivado_em: null
  }

  return inserirComEmpresa(supabase, TABELA_FOLHA_LANCAMENTO_ITENS, payload, { select: LANCAMENTO_ITEM_SELECT })
    .single()
}

export async function atualizarItemLancamentoFolha({ supabase, empresaId, id, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const itemId = validarLancamentoId(id)
  const payload = montarPayloadItemDetalhadoAtualizacao(dados)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTO_ITENS, itemId, empresa, payload)
    .select(LANCAMENTO_ITEM_SELECT)
    .single()
}

export async function arquivarItemLancamentoFolha({ supabase, empresaId, id }) {
  const empresa = validarEmpresaId(empresaId)
  const itemId = validarLancamentoId(id)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTO_ITENS, itemId, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(LANCAMENTO_ITEM_SELECT)
    .single()
}

export async function atualizarLancamentoFolha({ supabase, empresaId, id, dados }) {
  const empresa = validarEmpresaId(empresaId)
  const lancamentoId = validarLancamentoId(id)
  const payload = montarPayloadLancamentoAtualizacao(dados)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTOS, lancamentoId, empresa, payload)
    .select(LANCAMENTO_SELECT)
    .single()
}

export async function arquivarLancamentoFolha({ supabase, empresaId, id }) {
  const empresa = validarEmpresaId(empresaId)
  const lancamentoId = validarLancamentoId(id)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTOS, lancamentoId, empresa, {
    arquivado: true,
    arquivado_em: new Date().toISOString()
  })
    .select(LANCAMENTO_SELECT)
    .single()
}

export async function reativarLancamentoFolha({ supabase, empresaId, id }) {
  const empresa = validarEmpresaId(empresaId)
  const lancamentoId = validarLancamentoId(id)

  return atualizarPorEmpresa(supabase, TABELA_FOLHA_LANCAMENTOS, lancamentoId, empresa, {
    arquivado: false,
    arquivado_em: null
  })
    .select(LANCAMENTO_SELECT)
    .single()
}

export const obterResumoFolhaCompetencia = calcularResumoFolhaCompetencia
