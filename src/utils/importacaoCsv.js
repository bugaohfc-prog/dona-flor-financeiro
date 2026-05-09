import { formatarDataParaBanco, primeiraLetraMaiuscula } from './format'

export function normalizarChaveExcel(chave) {
  return String(chave || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function obterCampoExcel(linha, nomesPossiveis) {
  const entradas = Object.entries(linha || {})
  for (const nome of nomesPossiveis) {
    const alvo = normalizarChaveExcel(nome)
    const encontrado = entradas.find(([chave]) => normalizarChaveExcel(chave) === alvo)
    if (encontrado) return encontrado[1]
  }
  return ''
}

export function converterDataExcel(valor) {
  if (!valor) return null

  if (typeof valor === 'number') {
    const base = new Date(Date.UTC(1899, 11, 30))
    base.setUTCDate(base.getUTCDate() + valor)
    return base.toISOString().slice(0, 10)
  }

  const texto = String(valor).trim()
  if (!texto) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split('/')
    return `${ano}-${mes}-${dia}`
  }

  return formatarDataParaBanco(texto)
}

export function converterValorExcel(valor) {
  if (typeof valor === 'number') return valor
  const texto = String(valor || '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  return Number(texto || 0)
}

export function separarLinhaCsv(linha) {
  const resultado = []
  let atual = ''
  let dentroDeAspas = false

  for (let i = 0; i < linha.length; i += 1) {
    const char = linha[i]
    const proximo = linha[i + 1]

    if (char === '"' && proximo === '"') {
      atual += '"'
      i += 1
      continue
    }

    if (char === '"') {
      dentroDeAspas = !dentroDeAspas
      continue
    }

    if ((char === ';' || char === ',') && !dentroDeAspas) {
      resultado.push(atual.trim())
      atual = ''
      continue
    }

    atual += char
  }

  resultado.push(atual.trim())
  return resultado
}

export function csvParaJson(texto) {
  const linhas = String(texto || '')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim())

  if (linhas.length < 2) return []

  const cabecalho = separarLinhaCsv(linhas[0])

  return linhas.slice(1).map((linha) => {
    const valores = separarLinhaCsv(linha)
    return cabecalho.reduce((obj, chave, index) => {
      obj[chave] = valores[index] || ''
      return obj
    }, {})
  })
}

export function prepararLinhasImportacaoCsv(texto) {
  const linhas = csvParaJson(texto)

  return linhas.map((linha, index) => {
    const descricaoExcel = obterCampoExcel(linha, ['descricao', 'descrição', 'conta', 'nome', 'fornecedor'])
    const valorExcel = obterCampoExcel(linha, ['valor', 'valor pago', 'total'])
    const vencimentoExcel = obterCampoExcel(linha, ['vencimento', 'data vencimento', 'data_vencimento', 'data'])
    const statusExcel = String(obterCampoExcel(linha, ['status', 'situacao', 'situação']) || 'pendente').toLowerCase()
    const centroExcel = obterCampoExcel(linha, ['centro', 'centro de custo', 'categoria', 'setor'])

    return {
      linha: index + 2,
      descricao: primeiraLetraMaiuscula(String(descricaoExcel || '').trim()),
      valor: converterValorExcel(valorExcel),
      data_vencimento: converterDataExcel(vencimentoExcel),
      status: statusExcel.includes('pag') ? 'pago' : 'pendente',
      centro: String(centroExcel || '').trim()
    }
  }).filter((linha) => linha.descricao || linha.valor || linha.data_vencimento)
}
