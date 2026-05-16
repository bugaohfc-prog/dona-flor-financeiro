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

function nomeCentro(conta) {
  return conta?.df_centros_custo?.nome || conta?.centro_custo_nome || conta?.centro || 'Sem centro'
}

function calcularCentroMaisRelevante(contas = []) {
  const mapa = new Map()
  contas.forEach((conta) => {
    const chave = nomeCentro(conta)
    mapa.set(chave, (mapa.get(chave) || 0) + valorConta(conta))
  })

  return Array.from(mapa.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)[0] || null
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
  const centroCritico = calcularCentroMaisRelevante(base)
  const vencemEm7Dias = contasPendentes.filter((conta) => {
    const dias = diasAte(conta.data_vencimento)
    return dias >= 0 && dias <= 7
  })
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
    const total7 = vencemEm7Dias.reduce((acc, conta) => acc + valorConta(conta), 0)
    priorities.push({
      level: 'Alta',
      title: 'Antecipar vencimentos próximos',
      description: `${vencemEm7Dias.length} obrigação(ões) vencem nos próximos 7 dias.`,
      action: 'Priorizar caixa semanal',
      impact: moeda(total7),
      tone: 'warning'
    })
  }

  if (centroCritico && total && centroCritico.total / total >= 0.35) {
    priorities.push({
      level: 'Média',
      title: `Revisar centro ${centroCritico.nome}`,
      description: `Este centro concentra ${Math.round((centroCritico.total / total) * 100)}% do valor analisado.`,
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

  const executiveSummary = total
    ? `O recorte atual soma ${moeda(total)}, com ${moeda(pago)} realizado e ${moeda(pendente)} ainda em aberto. O score financeiro está em ${score}/100 (${status.label.toLowerCase()})${vencido > 0 ? `, com ${moeda(vencido)} vencido exigindo ação imediata.` : ', sem atraso crítico no momento.'}`
    : 'Ainda não há volume financeiro suficiente no recorte atual para uma leitura executiva completa. Cadastre contas ou ajuste os filtros para ampliar a análise.'

  const insights = [
    taxaPago >= 70
      ? 'Boa eficiência de realização no período analisado.'
      : 'A taxa de realização ainda pede acompanhamento próximo.',
    vencido > 0
      ? 'O valor vencido deve ser tratado antes de novas decisões de expansão.'
      : 'Sem vencidos relevantes no recorte atual.',
    centroCritico
      ? `Centro de maior peso: ${centroCritico.nome}.`
      : 'Centros de custo ainda sem concentração relevante.'
  ]

  return {
    score,
    status,
    executiveSummary,
    totals: { total, pago, pendente, vencido, taxaPago, taxaVencido },
    priorities: priorities.slice(0, 4),
    insights,
    quickQuestions: [
      'Qual meu maior risco agora?',
      'Onde estou gastando mais?',
      'Como melhorar meu caixa?',
      'Gerar resumo executivo'
    ]
  }
}
