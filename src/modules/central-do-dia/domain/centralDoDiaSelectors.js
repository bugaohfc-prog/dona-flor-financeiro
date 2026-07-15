import {
  agruparProximosVencimentos,
  compararPrioridade,
  montarBaseOperacional
} from './centralDoDiaRules.js'

const LIMITES_LEGADOS = Object.freeze({
  acoesImediatas: 6,
  itensPorFaixa: 4,
  excecoes: 6,
  atividadeRecente: 6
})

function ordenar(itens) {
  return [...(itens || [])].sort(compararPrioridade)
}

function ehPessoa(item) {
  return item?.origemOperacional === 'pessoas'
}

function possuiAcaoObjetiva(item) {
  return Boolean(item?.destino && String(item?.proximaAcao || '').trim())
}

export function selecionarAgendaOperacional(base = {}) {
  const itens = ordenar(base.itensOperacionais)
  const secoes = {
    atrasados: [],
    hoje: [],
    proximosSeteDias: [],
    proximosQuinzeDias: [],
    proximosTrintaDias: [],
    excecoes: [],
    semDataAcionaveis: []
  }

  itens.forEach((item) => {
    if (Number.isFinite(item?.dias)) {
      if (item.dias < 0) secoes.atrasados.push(item)
      else if (item.dias === 0) secoes.hoje.push(item)
      else if (item.dias <= 7) secoes.proximosSeteDias.push(item)
      else if (item.dias <= 15) secoes.proximosQuinzeDias.push(item)
      else if (item.dias <= 30) secoes.proximosTrintaDias.push(item)
      return
    }

    if (item?.inconsistencia) secoes.excecoes.push(item)
    else if (possuiAcaoObjetiva(item)) secoes.semDataAcionaveis.push(item)
  })

  const itensPrincipais = [
    ...secoes.atrasados,
    ...secoes.hoje,
    ...secoes.proximosSeteDias,
    ...secoes.proximosQuinzeDias,
    ...secoes.proximosTrintaDias,
    ...secoes.excecoes,
    ...secoes.semDataAcionaveis
  ]

  return {
    secoes,
    atencaoPrimeiro: ordenar(itensPrincipais),
    totalItens: itensPrincipais.length
  }
}

export function selecionarResumoDashboard(base = {}, { limitePrioridades = 3 } = {}) {
  const agenda = selecionarAgendaOperacional(base)
  const itens = base.itensOperacionais || []
  const limite = Math.max(0, Number(limitePrioridades) || 0)

  return {
    contadores: {
      vencidos: agenda.secoes.atrasados.length,
      hoje: agenda.secoes.hoje.length,
      proximosSeteDias: agenda.secoes.proximosSeteDias.length,
      excecoes: agenda.secoes.excecoes.length,
      // Pessoas é um recorte por origem e pode se sobrepor às faixas temporais.
      pessoas: itens.filter(ehPessoa).length
    },
    prioridades: agenda.atencaoPrimeiro.slice(0, limite),
    possuiDados: itens.length > 0
  }
}

export function selecionarCentralLegada(base = {}) {
  const itens = base.itensOperacionais || []
  const atividade = base.atividadeRecente || []
  const contas = itens.filter((item) => ['financeiro', 'impostos'].includes(item.origemOperacional))
  const notas = itens.filter((item) => item.origemOperacional === 'notas')
  const pessoas = itens.filter(ehPessoa)

  const acoesImediatas = ordenar([
    ...contas.filter((item) => item.dias !== null && item.dias <= 0),
    ...notas.filter((item) => item.inconsistencia || item.dias === 0),
    ...pessoas,
    ...atividade.filter((item) => item.inconsistencia)
  ]).slice(0, LIMITES_LEGADOS.acoesImediatas)

  const proximosVencimentos = agruparProximosVencimentos([
    ...contas,
    ...notas.filter((item) => item.dataReferencia)
  ]).map((grupo) => ({
    ...grupo,
    itens: grupo.itens.slice(0, LIMITES_LEGADOS.itensPorFaixa)
  }))

  const excecoes = ordenar([
    ...contas.filter((item) => item.status === 'vencido'),
    ...notas.filter((item) => item.inconsistencia),
    ...pessoas.filter((item) => item.inconsistencia),
    ...atividade.filter((item) => item.inconsistencia)
  ]).slice(0, LIMITES_LEGADOS.excecoes)

  const atividadeRecente = [...atividade]
    .sort((a, b) => String(b.dataHora || '').localeCompare(String(a.dataHora || '')) || String(a.id).localeCompare(String(b.id)))
    .slice(0, LIMITES_LEGADOS.atividadeRecente)

  return {
    acoesImediatas,
    proximosVencimentos,
    excecoes,
    atividadeRecente,
    totalProximos: proximosVencimentos.reduce((total, grupo) => total + grupo.itens.length, 0)
  }
}

export function montarCentralDoDia(fontes = {}) {
  return selecionarCentralLegada(montarBaseOperacional(fontes))
}
