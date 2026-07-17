const MESES_PT_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function obterPartesData(valor) {
  const correspondencia = String(valor || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!correspondencia) return null

  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  const dia = Number(correspondencia[3])
  const data = new Date(Date.UTC(ano, mes - 1, dia))

  if (
    data.getUTCFullYear() !== ano
    || data.getUTCMonth() !== mes - 1
    || data.getUTCDate() !== dia
  ) return null

  return { ano, mes, dia }
}

function valorNumericoSeguro(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function criarResumoVazio() {
  return {
    totalContas: 0,
    valorTotal: 0,
    abertas: 0,
    vencidas: 0,
    pagas: 0
  }
}

function acumularResumo(resumo, conta, estaVencida) {
  resumo.totalContas += 1
  resumo.valorTotal += valorNumericoSeguro(conta?.valor)

  if (conta?.status === 'pago') resumo.pagas += 1
  else resumo.abertas += 1

  if (estaVencida?.(conta?.data_vencimento, conta?.status)) resumo.vencidas += 1
}

function compararMeses(ano, anoAtual, mesAtual) {
  if (ano !== anoAtual) return (a, b) => b.mes - a.mes

  return (a, b) => {
    const ordem = (mes) => {
      if (mes === mesAtual) return [0, 0]
      if (mes > mesAtual) return [1, mes]
      return [2, -mes]
    }
    const ordemA = ordem(a.mes)
    const ordemB = ordem(b.mes)
    return ordemA[0] - ordemB[0] || ordemA[1] - ordemB[1]
  }
}

function escolherMesPadrao(meses, mesAtual) {
  const atual = meses.find((mes) => mes.mes === mesAtual)
  if (atual) return atual.chave

  const futuro = meses
    .filter((mes) => mes.mes > mesAtual)
    .sort((a, b) => a.mes - b.mes)[0]
  if (futuro) return futuro.chave

  return meses
    .filter((mes) => mes.mes < mesAtual)
    .sort((a, b) => b.mes - a.mes)[0]?.chave || null
}

export function agruparContasPorAnoMes(contas = [], opcoes = {}) {
  const dataReferencia = opcoes.dataReferencia instanceof Date && !Number.isNaN(opcoes.dataReferencia.getTime())
    ? opcoes.dataReferencia
    : new Date()
  const estaVencida = typeof opcoes.estaVencida === 'function' ? opcoes.estaVencida : () => false
  const anoAtual = dataReferencia.getFullYear()
  const mesAtual = dataReferencia.getMonth() + 1
  const anos = new Map()
  let semData = null

  for (const conta of contas) {
    const partes = obterPartesData(conta?.data_vencimento)

    if (!partes) {
      if (!semData) {
        semData = {
          chave: 'sem-data',
          ano: null,
          rotulo: 'Sem data',
          periodo: 'sem-data',
          ...criarResumoVazio(),
          meses: [{
            chave: 'sem-data',
            ano: null,
            mes: null,
            nome: 'Sem data',
            rotulo: 'Sem data',
            periodo: 'sem-data',
            contas: [],
            ...criarResumoVazio()
          }]
        }
      }
      semData.meses[0].contas.push(conta)
      acumularResumo(semData, conta, estaVencida)
      acumularResumo(semData.meses[0], conta, estaVencida)
      continue
    }

    const { ano, mes } = partes
    const chaveAno = String(ano)
    const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`

    if (!anos.has(ano)) {
      anos.set(ano, {
        chave: chaveAno,
        ano,
        rotulo: String(ano),
        periodo: ano === anoAtual ? 'atual' : ano < anoAtual ? 'anterior' : 'futuro',
        ...criarResumoVazio(),
        meses: new Map()
      })
    }

    const grupoAno = anos.get(ano)
    if (!grupoAno.meses.has(mes)) {
      grupoAno.meses.set(mes, {
        chave: chaveMes,
        ano,
        mes,
        nome: MESES_PT_BR[mes - 1],
        rotulo: `${MESES_PT_BR[mes - 1]} de ${ano}`,
        periodo: ano === anoAtual && mes === mesAtual
          ? 'atual'
          : ano === anoAtual && mes > mesAtual ? 'futuro' : 'anterior',
        contas: [],
        ...criarResumoVazio()
      })
    }

    const grupoMes = grupoAno.meses.get(mes)
    grupoMes.contas.push(conta)
    acumularResumo(grupoAno, conta, estaVencida)
    acumularResumo(grupoMes, conta, estaVencida)
  }

  const resultado = Array.from(anos.values())
    .sort((a, b) => b.ano - a.ano)
    .map((grupoAno) => {
      const meses = Array.from(grupoAno.meses.values())
        .sort(compararMeses(grupoAno.ano, anoAtual, mesAtual))
      const mesPadrao = grupoAno.ano === anoAtual ? escolherMesPadrao(meses, mesAtual) : null
      return { ...grupoAno, meses, mesPadrao }
    })

  if (semData) resultado.push({ ...semData, mesPadrao: null })
  return resultado
}

export function criarEstadoExpansaoPadrao(grupos = []) {
  const anos = {}
  const meses = {}

  for (const grupoAno of grupos) {
    anos[grupoAno.chave] = grupoAno.periodo === 'atual'
    for (const grupoMes of grupoAno.meses) {
      meses[grupoMes.chave] = grupoMes.chave === grupoAno.mesPadrao
    }
  }

  return { anos, meses }
}

export function reconciliarEstadoExpansao(estado = {}, grupos = [], opcoes = {}) {
  if (opcoes.reiniciar) return criarEstadoExpansaoPadrao(grupos)

  const anos = {}
  const meses = {}
  const anterioresAnos = estado.anos || {}
  const anterioresMeses = estado.meses || {}

  for (const grupoAno of grupos) {
    anos[grupoAno.chave] = Object.hasOwn(anterioresAnos, grupoAno.chave)
      ? anterioresAnos[grupoAno.chave] === true
      : false

    for (const grupoMes of grupoAno.meses) {
      meses[grupoMes.chave] = Object.hasOwn(anterioresMeses, grupoMes.chave)
        ? anterioresMeses[grupoMes.chave] === true
        : false
    }
  }

  return { anos, meses }
}
