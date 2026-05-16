function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function percentual(valor) {
  return `${Number(valor || 0).toFixed(1)}%`
}

function intensidade(score) {
  if (score >= 84) return 'saudável'
  if (score >= 68) return 'em atenção'
  return 'crítico'
}

export function gerarNarrativaExecutiva({ total = 0, pago = 0, pendente = 0, vencido = 0, taxaPago = 0, taxaVencido = 0, score = 0, centroCritico = null, total7Dias = 0, tendenciaMensal = [] } = {}) {
  if (!total) {
    return {
      parecer: 'A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.',
      liquidez: 'Sem volume suficiente para medir liquidez operacional.',
      concentracao: 'Sem centro de custo dominante identificado.',
      curtoPrazo: 'Sem pressão de curto prazo detectada no recorte atual.',
      comportamento: 'Histórico insuficiente para leitura comportamental.',
      anomalias: ['Base financeira insuficiente para detectar anomalias.'],
      drivers: ['Ampliar base de contas e centros classificados.']
    }
  }

  const status = intensidade(score)
  const meses = tendenciaMensal || []
  const ultimo = meses[meses.length - 1]
  const anterior = meses[meses.length - 2]
  const variacao = ultimo && anterior && anterior.total ? ((ultimo.total - anterior.total) / anterior.total) * 100 : null

  const parecer = vencido > 0
    ? `O cenário financeiro está ${status}, com ${moeda(vencido)} vencido representando ${percentual(taxaVencido)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`
    : `O cenário financeiro está ${status}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`

  const liquidez = taxaPago < 35
    ? `A liquidez operacional está pressionada: somente ${percentual(taxaPago)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`
    : taxaPago < 70
      ? `A liquidez exige acompanhamento: ${percentual(taxaPago)} do volume foi realizado, mas ainda existe margem relevante em aberto (${moeda(pendente)}).`
      : `A liquidez apresenta leitura positiva, com ${percentual(taxaPago)} já realizado e menor dependência de liquidações futuras.`

  const concentracao = centroCritico
    ? centroCritico.peso >= 60
      ? `Há concentração elevada no centro ${centroCritico.nome}, que representa ${centroCritico.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`
      : `O centro ${centroCritico.nome} lidera o recorte com ${centroCritico.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`
    : 'Não há concentração relevante por centro de custo no recorte atual.'

  const curtoPrazo = total7Dias > 0
    ? `O curto prazo exige reserva de caixa de ${moeda(total7Dias)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`
    : 'Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.'

  const comportamento = variacao === null
    ? 'Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.'
    : variacao > 15
      ? `O volume analisado cresceu ${percentual(variacao)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`
      : variacao < -15
        ? `O volume analisado caiu ${percentual(Math.abs(variacao))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`
        : `O comportamento mensal está relativamente estável, com variação de ${percentual(variacao)} frente ao mês anterior.`

  const anomalias = []
  if (taxaVencido >= 40) anomalias.push(`Vencidos acima de 40% do recorte (${percentual(taxaVencido)}), sinalizando risco operacional elevado.`)
  if (taxaPago < 20) anomalias.push(`Realização abaixo de 20% (${percentual(taxaPago)}), indicando baixa conversão em pagamento/baixa.`)
  if (centroCritico?.peso >= 60) anomalias.push(`Concentração extrema no centro ${centroCritico.nome} (${centroCritico.peso}%).`)
  if (total7Dias > pago && total7Dias > 0) anomalias.push(`Vencimentos de 7 dias (${moeda(total7Dias)}) superam o realizado atual (${moeda(pago)}).`)
  if (!anomalias.length) anomalias.push('Nenhuma anomalia crítica detectada no recorte atual.')

  const drivers = [
    vencido > 0 ? `Reduzir vencidos de ${moeda(vencido)} para aliviar o score.` : 'Preservar cenário sem vencidos críticos.',
    centroCritico ? `Revisar o centro ${centroCritico.nome}, principal driver do recorte.` : 'Classificar centros para melhorar rastreabilidade.',
    total7Dias > 0 ? `Proteger ${moeda(total7Dias)} no caixa semanal.` : 'Usar a folga de curto prazo para planejamento.',
    pendente > 0 ? `Acelerar baixa/renegociação de ${moeda(pendente)} em aberto.` : 'Manter ritmo de realização.'
  ]

  return { parecer, liquidez, concentracao, curtoPrazo, comportamento, anomalias, drivers }
}
