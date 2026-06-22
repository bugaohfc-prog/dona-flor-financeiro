import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const IMPOSTOS = new Set(['fgts', 'simples_nacional', 'inss'])
const OUTPUT_DIR = process.env.CONFERENCIA_IMPOSTOS_OUTPUT_DIR || '.tmp'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`)
  return value
}

function criarSupabaseClient() {
  const url = requiredEnv('SUPABASE_URL')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!key) throw new Error('Informe SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY para consulta.')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

function normalizarTexto(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function inferirImposto(conta) {
  if (IMPOSTOS.has(conta.imposto_tipo)) return conta.imposto_tipo

  const texto = normalizarTexto(`${conta.descricao || ''} ${conta.observacao || ''}`)
  if (texto.includes('fgts')) return 'fgts'
  if (texto.includes('simples')) return 'simples_nacional'
  if (texto.includes('inss') || texto.includes('cp-segur') || texto.includes('segur')) return 'inss'
  return ''
}

function parseData(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatarData(value) {
  return value ? String(value).slice(0, 10) : ''
}

function calcularStatusOperacional(conta) {
  if (conta.status === 'pago') return 'pago'

  const vencimento = parseData(conta.data_vencimento || conta.vencimento)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return vencimento && vencimento < hoje ? 'vencido' : (conta.status || 'pendente')
}

function competenciaDaConta(conta) {
  if (conta.competencia) return String(conta.competencia).slice(0, 10)
  const vencimento = parseData(conta.data_vencimento || conta.vencimento)
  if (!vencimento) return ''
  return `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, '0')}-01`
}

function extrairDocumento(observacao) {
  const match = String(observacao || '').match(/documento\s+([0-9]+)/i)
  return match ? match[1] : ''
}

function extrairOrigem(observacao) {
  const texto = String(observacao || '')
  if (/Relatorio de Pagamentos Receita Federal/i.test(texto)) return 'Relatorio de Pagamentos Receita Federal'
  if (/Relatorio de Situacao Fiscal Receita Federal/i.test(texto)) return 'Relatorio de Situacao Fiscal Receita Federal'
  if (/FGTS/i.test(texto)) return 'FGTS'
  return ''
}

function arredondar(value) {
  const number = Number(value || 0)
  return Math.round((number + Number.EPSILON) * 100) / 100
}

function valorParecido(a, b) {
  return Math.abs(arredondar(a) - arredondar(b)) <= 1
}

function mesmaDataOuCompetencia(a, b) {
  const vencA = formatarData(a.data_vencimento || a.vencimento)
  const vencB = formatarData(b.data_vencimento || b.vencimento)
  return vencA === vencB || competenciaDaConta(a) === competenciaDaConta(b)
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows) {
  const headers = [
    'grupo_revisao',
    'filial',
    'imposto_tipo',
    'competencia',
    'vencimento',
    'descricao',
    'valor',
    'status',
    'valor_pago',
    'data_pagamento',
    'centro_custo',
    'origem',
    'documento',
    'observacao',
    'acao_sugerida',
    'motivo_revisao',
    'id_conta'
  ]

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')
}

async function buscarTodos(supabase, tabela, select) {
  const pageSize = 1000
  const registros = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase.from(tabela).select(select).range(from, to)
    if (error) throw error
    registros.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return registros
}

function montarLinhas({ contas, filiaisPorId, centrosPorId }) {
  const contasAtivas = contas.filter((conta) => !conta.excluido && !conta.deletado)
  const importadas = contasAtivas.filter((conta) => IMPOSTOS.has(conta.imposto_tipo))
  const antigasSemTipo = contasAtivas.filter((conta) => {
    const centro = centrosPorId.get(conta.centro_custo_id) || conta.centro || ''
    return !conta.imposto_tipo
      && normalizarTexto(centro) === 'impostos e taxas'
      && IMPOSTOS.has(inferirImposto(conta))
  })

  const duplicidades = new Map()
  const gruposMesmaCompetencia = new Map()
  for (const conta of importadas) {
    const key = [
      conta.filial_id || '',
      conta.imposto_tipo || '',
      competenciaDaConta(conta),
      formatarData(conta.data_vencimento || conta.vencimento),
      arredondar(conta.valor)
    ].join('|')
    const grupo = duplicidades.get(key) || []
    grupo.push(conta.id)
    duplicidades.set(key, grupo)

    const keyCompetencia = [
      conta.filial_id || '',
      conta.imposto_tipo || '',
      competenciaDaConta(conta)
    ].join('|')
    const grupoCompetencia = gruposMesmaCompetencia.get(keyCompetencia) || []
    grupoCompetencia.push(conta.id)
    gruposMesmaCompetencia.set(keyCompetencia, grupoCompetencia)
  }

  const idsDuplicados = new Set(
    [...duplicidades.values()]
      .filter((ids) => ids.length > 1)
      .flat()
  )
  const idsMesmaCompetencia = new Set(
    [...gruposMesmaCompetencia.values()]
      .filter((ids) => ids.length > 1)
      .flat()
  )

  const idsComAntigaParecida = new Set()
  for (const antiga of antigasSemTipo) {
    const impostoAntigo = inferirImposto(antiga)
    for (const importada of importadas) {
      if (
        importada.filial_id === antiga.filial_id
        && importada.imposto_tipo === impostoAntigo
        && valorParecido(importada.valor, antiga.valor)
        && mesmaDataOuCompetencia(importada, antiga)
      ) {
        idsComAntigaParecida.add(importada.id)
      }
    }
  }

  function linhaBase(conta, grupo, acao, motivo) {
    const filial = filiaisPorId.get(conta.filial_id) || ''
    const centro = centrosPorId.get(conta.centro_custo_id) || conta.centro || ''
    const observacao = conta.observacao || ''
    return {
      grupo_revisao: grupo,
      filial,
      imposto_tipo: conta.imposto_tipo || inferirImposto(conta),
      competencia: competenciaDaConta(conta),
      vencimento: formatarData(conta.data_vencimento || conta.vencimento),
      descricao: conta.descricao || '',
      valor: arredondar(conta.valor).toFixed(2),
      status: calcularStatusOperacional(conta),
      valor_pago: conta.valor_pago === null || conta.valor_pago === undefined ? '' : arredondar(conta.valor_pago).toFixed(2),
      data_pagamento: formatarData(conta.data_pagamento),
      centro_custo: centro,
      origem: extrairOrigem(observacao),
      documento: extrairDocumento(observacao),
      observacao,
      acao_sugerida: acao,
      motivo_revisao: motivo,
      id_conta: conta.id
    }
  }

  const linhasImportadas = importadas.map((conta) => {
    const documento = extrairDocumento(conta.observacao)
    const origem = extrairOrigem(conta.observacao)
    const motivos = []
    let grupo = conta.status === 'pago' ? 'pago_importado' : 'pendente_importado'
    let acao = 'manter'

    if (idsDuplicados.has(conta.id)) {
      grupo = 'possivel_duplicidade'
      acao = 'possível_duplicidade_nao_alterar'
      motivos.push('mesma filial, imposto, competencia, vencimento e valor')
    }

    if (idsComAntigaParecida.has(conta.id)) {
      grupo = 'possivel_duplicidade'
      acao = 'possível_duplicidade_nao_alterar'
      motivos.push('existe conta antiga parecida sem imposto_tipo')
    }

    if (idsMesmaCompetencia.has(conta.id) && grupo !== 'possivel_duplicidade') {
      grupo = 'revisar_valor'
      acao = 'conferir'
      motivos.push('mesma filial, imposto e competencia com mais de uma conta')
    }

    if (conta.status === 'pago' && origem.includes('Pagamentos') && !documento) {
      grupo = 'revisar_status'
      acao = 'revisar_com_documento'
      motivos.push('pagamento importado sem documento na observacao')
    }

    if (!motivos.length) motivos.push('registro importado com campos fiscais')
    return linhaBase(conta, grupo, acao, motivos.join('; '))
  })

  const linhasAntigas = antigasSemTipo.map((conta) => linhaBase(
    conta,
    'conta_antiga_para_classificar',
    'classificar_antiga',
    'conta antiga em Impostos e Taxas com descricao semelhante a imposto importado'
  ))

  return [...linhasImportadas, ...linhasAntigas].sort((a, b) => (
    `${a.filial}|${a.imposto_tipo}|${a.competencia}|${a.vencimento}|${a.descricao}`
      .localeCompare(`${b.filial}|${b.imposto_tipo}|${b.competencia}|${b.vencimento}|${b.descricao}`)
  ))
}

function resumo(rows) {
  const porImposto = {}
  const porFilial = {}
  for (const row of rows) {
    porImposto[row.imposto_tipo] = (porImposto[row.imposto_tipo] || 0) + 1
    porFilial[row.filial] = (porFilial[row.filial] || 0) + 1
  }

  return {
    total_linhas_csv: rows.length,
    total_importadas: rows.filter((row) => ['fgts', 'simples_nacional', 'inss'].includes(row.imposto_tipo) && row.grupo_revisao !== 'conta_antiga_para_classificar').length,
    total_pagas: rows.filter((row) => row.status === 'pago').length,
    total_pendentes: rows.filter((row) => row.status === 'pendente' || row.status === 'vencido').length,
    possiveis_duplicidades: rows.filter((row) => row.grupo_revisao === 'possivel_duplicidade').length,
    contas_antigas_para_classificar: rows.filter((row) => row.grupo_revisao === 'conta_antiga_para_classificar').length,
    porImposto,
    porFilial
  }
}

async function main() {
  const supabase = criarSupabaseClient()
  const [contas, filiais, centros] = await Promise.all([
    buscarTodos(supabase, 'df_contas', 'id,empresa_id,filial_id,centro_custo_id,descricao,valor,status,valor_pago,data_pagamento,vencimento,data_vencimento,competencia,imposto_tipo,observacao,centro,excluido,deletado'),
    buscarTodos(supabase, 'df_filiais', 'id,nome'),
    buscarTodos(supabase, 'df_centros_custo', 'id,nome')
  ])

  const filiaisPorId = new Map(filiais.map((filial) => [filial.id, filial.nome]))
  const centrosPorId = new Map(centros.map((centro) => [centro.id, centro.nome]))
  const rows = montarLinhas({ contas, filiaisPorId, centrosPorId })

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')
  const outputPath = path.join(OUTPUT_DIR, `conferencia-impostos-${stamp}.csv`)
  fs.writeFileSync(outputPath, `${toCsv(rows)}\n`, 'utf8')

  console.log(JSON.stringify({
    arquivo: outputPath,
    ...resumo(rows)
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
