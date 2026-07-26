import { statusRelatorioConta } from './relatoriosFinanceiros.js'

const DIA_MS = 86400000

function textoNormalizado(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function dataUtc(valor) {
  const partes = String(valor || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!partes) return null
  const data = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])))
  return Number.isNaN(data.getTime()) ? null : data
}

function dataLocalISO(data = new Date()) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-')
}

function diferencaDias(data, referencia) {
  const atual = dataUtc(data)
  const base = dataUtc(referencia)
  if (!atual || !base) return null
  return Math.round((atual.getTime() - base.getTime()) / DIA_MS)
}

function paraCentavos(valor) {
  const numero = Number(valor || 0)
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0
}

function deCentavos(valor) {
  return Number((Number(valor || 0) / 100).toFixed(2))
}

function saldoConta(conta) {
  return deCentavos(Math.max(0, paraCentavos(conta?.saldo_restante_relatorio ?? conta?.valor ?? 0)))
}

function contaElegivel(conta, opcoes) {
  if (!conta?.id || conta.oculto === true || conta.excluido === true || conta.deletado === true) return false
  if (opcoes.empresaId && String(conta.empresa_id || '') !== String(opcoes.empresaId)) return false
  if (opcoes.filialId && String(conta.filial_id || '') !== String(opcoes.filialId)) return false
  if (opcoes.centroCustoId && String(conta.centro_custo_id || '') !== String(opcoes.centroCustoId)) return false
  const status = statusRelatorioConta(conta, opcoes.hoje)
  return saldoConta(conta) > 0 && !['paga', 'quitada_por_parciais'].includes(status)
}

function chaveFornecedor(conta) {
  const explicito = conta?.fornecedor_id || conta?.fornecedor_nome || conta?.fornecedor || conta?.favorecido
  return textoNormalizado(explicito || conta?.descricao)
}

function classificarNivel(score) {
  if (score >= 60) return 'critica'
  if (score >= 30) return 'atencao'
  return 'acompanhamento'
}

function pontuarConta(conta, contexto) {
  const saldo = saldoConta(conta)
  const dias = diferencaDias(conta.data_vencimento, contexto.hoje)
  const motivos = []
  let score = 0

  if (dias !== null && dias < 0) {
    const atraso = Math.abs(dias)
    score += 30 + Math.min(30, Math.floor(atraso / 7) * 3)
    motivos.push(`${atraso} dia(s) em atraso`)
  } else if (dias === 0) {
    score += 24
    motivos.push('Vence hoje')
  } else if (dias !== null && dias <= 7) {
    score += 16
    motivos.push(`Vence em ${dias} dia(s)`)
  } else if (dias !== null && dias <= 30) {
    score += 7
    motivos.push(`Vence em ${dias} dia(s)`)
  }

  if (saldo >= 10000) {
    score += 18
    motivos.push('Alto impacto financeiro')
  } else if (saldo >= 5000) {
    score += 12
    motivos.push('Impacto financeiro relevante')
  } else if (saldo >= 1000) {
    score += 6
  }

  if (conta.recorrencia_id) {
    score += 6
    motivos.push('Compromisso recorrente')
  }
  if (conta.imposto_tipo) {
    score += 10
    motivos.push('Obrigação fiscal')
  }
  if (!conta.filial_id) {
    score += 8
    motivos.push('Sem filial')
  }
  if (!conta.centro_custo_id) {
    score += 8
    motivos.push('Sem centro de custo')
  }

  const fornecedor = chaveFornecedor(conta)
  const concentracao = fornecedor ? contexto.fornecedores.get(fornecedor) : null
  if (concentracao?.quantidade >= 2) {
    score += Math.min(10, concentracao.quantidade * 2)
    motivos.push('Concentração do mesmo fornecedor/descrição')
  }

  return {
    id: conta.id,
    conta,
    score,
    nivel: classificarNivel(score),
    saldo,
    diasParaVencimento: dias,
    motivos,
    semFilial: !conta.filial_id,
    semCentro: !conta.centro_custo_id
  }
}

function ordenarPrioridades(a, b) {
  return b.score - a.score
    || Number(a.diasParaVencimento ?? Number.MAX_SAFE_INTEGER) - Number(b.diasParaVencimento ?? Number.MAX_SAFE_INTEGER)
    || b.saldo - a.saldo
    || String(a.conta?.data_vencimento || '9999-12-31').localeCompare(String(b.conta?.data_vencimento || '9999-12-31'))
    || String(a.id).localeCompare(String(b.id))
}

function filtrarCobertura(ocorrencias, opcoes) {
  return (ocorrencias || [])
    .filter((item) => ['faltante', 'possivel_manual'].includes(item?.cobertura))
    .filter((item) => !opcoes.filialId || String(item?.serie?.filial_id || '') === String(opcoes.filialId))
    .filter((item) => !opcoes.centroCustoId || String(item?.serie?.centro_custo_id || '') === String(opcoes.centroCustoId))
    .sort((a, b) => String(a.dataVencimento || '').localeCompare(String(b.dataVencimento || '')) || String(a.recorrenciaId).localeCompare(String(b.recorrenciaId)))
}

export function montarCentralPrioridadesFinanceiras({
  contas = [],
  ocorrenciasCobertura = [],
  dataBase = new Date(),
  empresaId = '',
  filialId = '',
  centroCustoId = ''
} = {}) {
  const hoje = typeof dataBase === 'string' ? dataBase.slice(0, 10) : dataLocalISO(dataBase)
  const opcoes = { hoje, empresaId, filialId, centroCustoId }
  const unicas = new Map()
  ;(contas || []).forEach((conta) => {
    if (conta?.id && !unicas.has(conta.id)) unicas.set(conta.id, conta)
  })
  const elegiveis = Array.from(unicas.values()).filter((conta) => contaElegivel(conta, opcoes))
  const fornecedores = new Map()
  elegiveis.forEach((conta) => {
    const chave = chaveFornecedor(conta)
    if (!chave) return
    const atual = fornecedores.get(chave) || { quantidade: 0, saldoCentavos: 0 }
    atual.quantidade += 1
    atual.saldoCentavos += paraCentavos(saldoConta(conta))
    fornecedores.set(chave, atual)
  })

  const prioridades = elegiveis
    .map((conta) => pontuarConta(conta, { hoje, fornecedores }))
    .sort(ordenarPrioridades)
  const grupos = {
    criticas: prioridades.filter((item) => item.nivel === 'critica'),
    atencao: prioridades.filter((item) => item.nivel === 'atencao'),
    acompanhamento: prioridades.filter((item) => item.nivel === 'acompanhamento')
  }
  const meses = new Map()
  elegiveis.forEach((conta) => {
    const chave = String(conta.data_vencimento || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(chave)) return
    const atual = meses.get(chave) || { chave, quantidade: 0, saldoCentavos: 0 }
    atual.quantidade += 1
    atual.saldoCentavos += paraCentavos(saldoConta(conta))
    meses.set(chave, atual)
  })
  const concentracoesMensais = Array.from(meses.values())
    .map((item) => ({ chave: item.chave, quantidade: item.quantidade, saldo: deCentavos(item.saldoCentavos) }))
    .sort((a, b) => b.saldo - a.saldo || a.chave.localeCompare(b.chave))
  const recorrenciasSemCobertura = filtrarCobertura(ocorrenciasCobertura, opcoes)

  return {
    prioridades,
    grupos,
    recorrenciasSemCobertura,
    concentracoesMensais,
    resumo: {
      criticas: grupos.criticas.length,
      atencao: grupos.atencao.length,
      acompanhamento: grupos.acompanhamento.length,
      semFilial: prioridades.filter((item) => item.semFilial).length,
      semCentro: prioridades.filter((item) => item.semCentro).length,
      recorrenciasSemCobertura: recorrenciasSemCobertura.length
    }
  }
}
