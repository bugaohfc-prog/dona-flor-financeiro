import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const COLUNAS_ESPERADAS = [
  'descricao',
  'filial_unidade',
  'centro_custo',
  'imposto_tipo',
  'competencia',
  'competencia_referencia',
  'vencimento_sugerido',
  'valor',
  'status_sugerido',
  'observacao'
]

const ARQUIVOS_ESPERADOS = [
  'brilho_dourado_fgts_importacao_contas.csv',
  'dona_flor_andradina_fgts_importacao_contas.csv',
  'dona_flor_tres_lagoas_fgts_importacao_contas.csv',
  'dona_flor_paranaiba_fgts_importacao_contas.csv'
]

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function dividirLinhaCsv(linha, separador = ';') {
  const campos = []
  let atual = ''
  let emAspas = false

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i]
    const proximo = linha[i + 1]

    if (caractere === '"' && emAspas && proximo === '"') {
      atual += '"'
      i += 1
      continue
    }

    if (caractere === '"') {
      emAspas = !emAspas
      continue
    }

    if (caractere === separador && !emAspas) {
      campos.push(atual)
      atual = ''
      continue
    }

    atual += caractere
  }

  campos.push(atual)
  return campos.map((campo) => campo.trim())
}

function lerCsv(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf8').replace(/^\uFEFF/, '')
  const linhas = conteudo.split(/\r?\n/).filter((linha) => linha.trim())
  const cabecalho = dividirLinhaCsv(linhas[0]).map((coluna) => coluna.replace(/^"|"$/g, '').trim())

  const registros = linhas.slice(1).map((linha, indice) => {
    const valores = dividirLinhaCsv(linha)
    return cabecalho.reduce((registro, coluna, posicao) => {
      registro[coluna] = valores[posicao] || ''
      registro.__linha = indice + 2
      return registro
    }, {})
  })

  return { cabecalho, registros }
}

function normalizarValor(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return 0

  const semMoeda = texto.replace(/[R$\s]/g, '')
  const comCentavosPorEspaco = texto.match(/^(\d{1,3}(?:\.\d{3})*|\d+)\s+(\d{2})$/)
  const normalizado = comCentavosPorEspaco
    ? `${comCentavosPorEspaco[1].replace(/\./g, '')}.${comCentavosPorEspaco[2]}`
    : semMoeda.replace(/\./g, '').replace(',', '.')

  const numero = Number(normalizado)
  if (!Number.isFinite(numero)) return NaN
  return Math.round((numero + Number.EPSILON) * 100) / 100
}

function ehDataIso(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))
}

function competenciaEhPrimeiroDiaMes(valor) {
  return ehDataIso(valor) && String(valor).slice(8, 10) === '01'
}

function localizarArquivos(baseDir) {
  const encontrados = []

  function visitar(diretorio) {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
      const caminho = path.join(diretorio, entrada.name)
      if (entrada.isDirectory()) {
        visitar(caminho)
      } else if (ARQUIVOS_ESPERADOS.includes(entrada.name)) {
        encontrados.push(caminho)
      }
    }
  }

  visitar(baseDir)
  return encontrados.sort()
}

function validarCabecalho(cabecalho, arquivo) {
  const faltantes = COLUNAS_ESPERADAS.filter((coluna) => !cabecalho.includes(coluna))
  if (faltantes.length) {
    throw new Error(`Arquivo ${arquivo} sem colunas obrigatórias: ${faltantes.join(', ')}`)
  }
}

function normalizarRegistro(registro, arquivo) {
  const valor = normalizarValor(registro.valor)
  const observacao = String(registro.observacao || '').trim()
  const competenciaReferencia = String(registro.competencia_referencia || '').trim()
  const ehDecimoTerceiro = competenciaReferencia.startsWith('13/')

  return {
    arquivo,
    linha: registro.__linha,
    descricao: String(registro.descricao || '').trim(),
    filial_unidade: String(registro.filial_unidade || '').trim(),
    centro_custo: String(registro.centro_custo || '').trim(),
    imposto_tipo: String(registro.imposto_tipo || '').trim(),
    competencia: String(registro.competencia || '').trim(),
    competencia_referencia: competenciaReferencia,
    vencimento_sugerido: String(registro.vencimento_sugerido || '').trim(),
    valor,
    status_sugerido: String(registro.status_sugerido || '').trim(),
    observacao: ehDecimoTerceiro && !normalizarTexto(observacao).includes('13 salario')
      ? `${observacao} Competência referente ao 13º salário.`
      : observacao,
    ehDecimoTerceiro
  }
}

export function carregarFgtsCsvs(baseDir) {
  const arquivos = localizarArquivos(baseDir)
  const porArquivo = []
  const validos = []
  const erros = []
  const ignoradosValorZero = []

  for (const arquivo of arquivos) {
    const nomeArquivo = path.basename(arquivo)
    const { cabecalho, registros } = lerCsv(arquivo)
    validarCabecalho(cabecalho, nomeArquivo)

    const resumoArquivo = {
      arquivo: nomeArquivo,
      caminho: arquivo,
      lidas: registros.length,
      validas: 0,
      ignoradasValorZero: 0,
      erros: 0
    }

    for (const registro of registros) {
      const normalizado = normalizarRegistro(registro, nomeArquivo)
      const errosRegistro = []

      if (normalizado.imposto_tipo !== 'fgts') errosRegistro.push('imposto_tipo diferente de fgts')
      if (normalizado.centro_custo !== 'RH') errosRegistro.push('centro_custo diferente de RH')
      if (!competenciaEhPrimeiroDiaMes(normalizado.competencia)) errosRegistro.push('competencia inválida ou não é primeiro dia do mês')
      if (!ehDataIso(normalizado.vencimento_sugerido)) errosRegistro.push('vencimento_sugerido inválido')
      if (!Number.isFinite(normalizado.valor)) errosRegistro.push('valor inválido')
      if (!normalizado.descricao) errosRegistro.push('descricao vazia')
      if (!normalizado.filial_unidade) errosRegistro.push('filial_unidade vazia')

      if (errosRegistro.length) {
        resumoArquivo.erros += 1
        erros.push({ ...normalizado, erros: errosRegistro })
        continue
      }

      if (normalizado.valor <= 0) {
        resumoArquivo.ignoradasValorZero += 1
        ignoradosValorZero.push(normalizado)
        continue
      }

      resumoArquivo.validas += 1
      validos.push(normalizado)
    }

    porArquivo.push(resumoArquivo)
  }

  return {
    baseDir,
    arquivosEsperados: ARQUIVOS_ESPERADOS,
    arquivosEncontrados: arquivos.map((arquivo) => path.basename(arquivo)),
    porArquivo,
    validos,
    erros,
    ignoradosValorZero
  }
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const baseDir = process.env.FGTS_IMPORT_DIR || 'tmp_fgts_import'
  const resultado = carregarFgtsCsvs(baseDir)
  const porFilial = resultado.validos.reduce((resumo, registro) => {
    const atual = resumo[registro.filial_unidade] || { total: 0, valorTotal: 0 }
    atual.total += 1
    atual.valorTotal = Math.round((atual.valorTotal + registro.valor + Number.EPSILON) * 100) / 100
    resumo[registro.filial_unidade] = atual
    return resumo
  }, {})

  if (process.env.IMPORTAR_FGTS === '1') {
    throw new Error('Este script valida os CSVs em dry-run local. A importacao real deve ser executada por SQL revisado contra o Supabase.')
  }

  const relatorio = {
    modo: 'DRY_RUN_LOCAL',
    baseDir,
    arquivosEncontrados: resultado.arquivosEncontrados,
    porArquivo: resultado.porArquivo,
    porFilial,
    totalLido: resultado.porArquivo.reduce((total, arquivo) => total + arquivo.lidas, 0),
    totalValido: resultado.validos.length,
    totalIgnoradoValorZero: resultado.ignoradosValorZero.length,
    totalErros: resultado.erros.length,
    erros: resultado.erros
  }

  console.log(JSON.stringify(relatorio, null, 2))
}
