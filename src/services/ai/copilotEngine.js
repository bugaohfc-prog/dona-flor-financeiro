import { gerarNarrativaExecutiva } from './narrativeEngine.js'
function valorConta(conta) {
  return Number(conta?.valor || 0)
}

function dataVencida(data, status) {
  if (!data || status === 'pago') return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const vencimento = new Date(`${data}T00:00:00`)
  vencimento.setHours(0, 0, 0, 0)
  return vencimento < hoje
}

function diasAte(data) {
  if (!data) return 999
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${data}T00:00:00`)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24))
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function percentual(valor) {
  return `${Number(valor || 0).toFixed(1)}%`
}

function nomeCentro(conta) {
  return conta?.df_centros_custo?.nome || conta?.centro_custo_nome || conta?.centro || 'Sem centro'
}

function chaveMes(conta) {
  return String(conta?.data_vencimento || conta?.created_at || '').slice(0, 7) || 'Sem mês'
}

function calcularRankingPorCentro(contas = []) {
  const mapa = new Map()
  contas.forEach((conta) => {
    const chave = nomeCentro(conta)
    const atual = mapa.get(chave) || { nome: chave, total: 0, pago: 0, pendente: 0, vencido: 0, quantidade: 0 }
    const valor = valorConta(conta)
    atual.total += valor
    atual.quantidade += 1
    if (conta.status === 'pago') atual.pago += valor
    else atual.pendente += valor
    if (dataVencida(conta.data_vencimento, conta.status)) atual.vencido += valor
    mapa.set(chave, atual)
  })

  return Array.from(mapa.values())
    .map((centro) => ({
      ...centro,
      risco: centro.total ? Math.round((centro.vencido / centro.total) * 100) : 0,
      peso: 0
    }))
    .sort((a, b) => b.total - a.total)
}

function calcularTendenciaMensal(contas = []) {
  const mapa = new Map()
  contas.forEach((conta) => {
    const mes = chaveMes(conta)
    const atual = mapa.get(mes) || { mes, total: 0, pago: 0, pendente: 0, vencido: 0 }
    const valor = valorConta(conta)
    atual.total += valor
    if (conta.status === 'pago') atual.pago += valor
    else atual.pendente += valor
    if (dataVencida(conta.data_vencimento, conta.status)) atual.vencido += valor
    mapa.set(mes, atual)
  })

  return Array.from(mapa.values()).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6)
}

function calcularScore({ total, pendente, vencido, taxaVencido, contasVencidas, contasPendentes }) {
  if (!total) return 82

  let score = 100
  score -= Math.min(42, taxaVencido * 1.1)
  score -= Math.min(22, (pendente / total) * 18)
  score -= Math.min(16, contasVencidas.length * 4)
  score -= Math.min(10, contasPendentes.length * 0.8)

  return Math.max(0, Math.min(100, Math.round(score)))
}

function classificarScore(score) {
  if (score >= 84) return { label: 'Saudável', tone: 'success' }
  if (score >= 68) return { label: 'Atenção', tone: 'warning' }
  return { label: 'Crítico', tone: 'danger' }
}

function gerarParecerExecutivo({ total, pago, pendente, vencido, taxaPago, taxaVencido, score, status, centroCritico, vencemEm7Dias }) {
  if (!total) {
    return 'Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.'
  }

  const abertura = `O recorte atual soma ${moeda(total)}, com ${moeda(pago)} realizado e ${moeda(pendente)} ainda em aberto.`
  const risco = vencido > 0
    ? `O principal ponto de atenção é o vencido de ${moeda(vencido)}, equivalente a ${percentual(taxaVencido)} do volume analisado.`
    : 'Não há vencido crítico identificado no recorte atual.'
  const eficiencia = taxaPago >= 70
    ? `A eficiência de realização está positiva, com ${percentual(taxaPago)} já liquidado.`
    : `A eficiência de realização está pressionada, com apenas ${percentual(taxaPago)} liquidado.`
  const foco = centroCritico
    ? `O centro de maior peso é ${centroCritico.nome}, concentrando ${moeda(centroCritico.total)}.`
    : 'Não há concentração relevante por centro de custo.'
  const curtoPrazo = vencemEm7Dias.length
    ? `${vencemEm7Dias.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`
    : 'Não há concentração expressiva de vencimentos nos próximos 7 dias.'

  return `${abertura} ${risco} ${eficiencia} ${foco} ${curtoPrazo} O score financeiro está em ${score}/100, classificado como ${status.label.toLowerCase()}.`
}

export function gerarCopilotFinanceiro({ contas = [], contasFiltradas = [] } = {}) {
  const base = contasFiltradas.length ? contasFiltradas : contas
  const total = base.reduce((acc, conta) => acc + valorConta(conta), 0)
  const contasPagas = base.filter((conta) => conta.status === 'pago')
  const contasPendentes = base.filter((conta) => conta.status !== 'pago')
  const contasVencidas = base.filter((conta) => dataVencida(conta.data_vencimento, conta.status))
  const pago = contasPagas.reduce((acc, conta) => acc + valorConta(conta), 0)
  const pendente = contasPendentes.reduce((acc, conta) => acc + valorConta(conta), 0)
  const vencido = contasVencidas.reduce((acc, conta) => acc + valorConta(conta), 0)
  const taxaPago = total ? (pago / total) * 100 : 0
  const taxaVencido = total ? (vencido / total) * 100 : 0
  const rankingCentros = calcularRankingPorCentro(base).map((centro) => ({ ...centro, peso: total ? Math.round((centro.total / total) * 100) : 0 }))
  const centroCritico = rankingCentros[0] || null
  const tendenciaMensal = calcularTendenciaMensal(base)
  const vencemEm7Dias = contasPendentes.filter((conta) => {
    const dias = diasAte(conta.data_vencimento)
    return dias >= 0 && dias <= 7
  })
  const total7Dias = vencemEm7Dias.reduce((acc, conta) => acc + valorConta(conta), 0)
  const score = calcularScore({ total, pendente, vencido, taxaVencido, contasVencidas, contasPendentes })
  const status = classificarScore(score)

  const priorities = []

  if (vencido > 0) {
    priorities.push({
      level: 'Alta',
      title: 'Regularizar contas vencidas',
      description: `${contasVencidas.length} conta(s) em atraso somando ${moeda(vencido)}.`,
      action: 'Abrir Financeiro > Contas',
      impact: moeda(vencido),
      tone: 'danger'
    })
  }

  if (vencemEm7Dias.length) {
    priorities.push({
      level: 'Alta',
      title: 'Antecipar vencimentos próximos',
      description: `${vencemEm7Dias.length} obrigação(ões) vencem nos próximos 7 dias.`,
      action: 'Priorizar caixa semanal',
      impact: moeda(total7Dias),
      tone: 'warning'
    })
  }

  if (centroCritico && total && centroCritico.total / total >= 0.35) {
    priorities.push({
      level: 'Média',
      title: `Revisar centro ${centroCritico.nome}`,
      description: `Este centro concentra ${centroCritico.peso}% do valor analisado.`,
      action: 'Abrir Relatórios',
      impact: moeda(centroCritico.total),
      tone: 'info'
    })
  }

  if (!priorities.length) {
    priorities.push({
      level: 'Baixa',
      title: 'Manter rotina de acompanhamento',
      description: 'Nenhum risco operacional crítico foi identificado no recorte atual.',
      action: 'Revisão semanal',
      impact: 'Controle',
      tone: 'success'
    })
  }

  const executiveSummary = gerarParecerExecutivo({ total, pago, pendente, vencido, taxaPago, taxaVencido, score, status, centroCritico, vencemEm7Dias })
  const narrativa = gerarNarrativaExecutiva({ total, pago, pendente, vencido, taxaPago, taxaVencido, score, centroCritico, total7Dias, tendenciaMensal })

  const recomendacoes = [
    vencido > 0 ? `Priorizar a quitação ou renegociação dos vencidos (${moeda(vencido)}) antes de novas despesas.` : 'Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.',
    total7Dias > 0 ? `Reservar ${moeda(total7Dias)} para vencimentos dos próximos 7 dias.` : 'Usar a folga dos próximos 7 dias para revisar centros de maior peso.',
    centroCritico ? `Auditar lançamentos do centro ${centroCritico.nome}, que representa ${centroCritico.peso}% do recorte.` : 'Classificar centros de custo para melhorar a qualidade analítica.',
    taxaPago < 50 ? 'Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.' : 'Preservar o ritmo de baixas e acompanhar desvios por centro.'
  ]

  const respostas = {
    'Qual meu maior risco agora?': vencido > 0
      ? `O maior risco agora é o saldo vencido de ${moeda(vencido)}, distribuído em ${contasVencidas.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`
      : `O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${moeda(total7Dias)} vencendo em até 7 dias.`,
    'Onde estou gastando mais?': centroCritico
      ? `O maior peso financeiro está em ${centroCritico.nome}, com ${moeda(centroCritico.total)} (${centroCritico.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`
      : 'Ainda não há centro de custo dominante no recorte atual.',
    'Como melhorar meu caixa?': `Priorize três movimentos: reduzir vencidos (${moeda(vencido)}), reservar caixa para 7 dias (${moeda(total7Dias)}) e revisar o centro de maior peso${centroCritico ? ` (${centroCritico.nome})` : ''}.`,
    'Gerar resumo executivo': executiveSummary
  }

  const insights = [
    narrativa.liquidez,
    narrativa.concentracao,
    narrativa.curtoPrazo,
    narrativa.comportamento
  ]

  return {
    score,
    status,
    executiveSummary,
    narrativa,
    totals: { total, pago, pendente, vencido, taxaPago, taxaVencido, total7Dias },
    priorities: priorities.slice(0, 4),
    insights,
    recomendacoes,
    rankingCentros: rankingCentros.slice(0, 5),
    tendenciaMensal,
    respostas,
    quickQuestions: Object.keys(respostas)
  }
}
