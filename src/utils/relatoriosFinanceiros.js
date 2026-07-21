const STATUS_PAGOS = new Set(['pago', 'paga', 'quitado', 'quitada', 'baixado', 'baixada'])

function valorCentavos(valor) {
  const numero = Number(valor || 0)
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0
}

function deCentavos(valor) {
  return Number((Number(valor || 0) / 100).toFixed(2))
}

export function dataIsoValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || '').slice(0, 10))
}

export function contaRelatorioAtiva(conta, incluirOcultas = false) {
  if (!conta || conta.excluido === true || conta.deletado === true || conta.excluido_em || conta.deleted_at) return false
  return incluirOcultas || conta.oculto !== true
}

export function contaPaga(conta) {
  return STATUS_PAGOS.has(String(conta?.status || '').trim().toLowerCase())
}

function pagamentosAtivos(pagamentos = []) {
  return pagamentos.filter((pagamento) => (
    pagamento && pagamento.arquivado !== true && valorCentavos(pagamento.valor_pago) > 0
  ))
}

export function reconciliarSituacaoConta(conta = {}, pagamentos = []) {
  const parciais = pagamentosAtivos(pagamentos)
  const valorPrevisto = valorCentavos(conta.valor)
  const pagoPorParciais = parciais.reduce((total, pagamento) => total + valorCentavos(pagamento.valor_pago), 0)
  const pagoInformado = valorCentavos(conta.valor_pago)
  const paga = contaPaga(conta)
  const valorPagoInferido = paga && pagoInformado <= 0
  const valorPagoAtual = paga
    ? (valorPagoInferido ? Math.max(valorPrevisto, pagoPorParciais) : pagoInformado)
    : Math.max(pagoPorParciais, pagoInformado)
  const saldoRestante = paga ? 0 : Math.max(valorPrevisto - valorPagoAtual, 0)

  return {
    pagamentosAtivos: parciais,
    valorPrevistoCentavos: valorPrevisto,
    valorPagoAtualCentavos: valorPagoAtual,
    saldoRestanteCentavos: saldoRestante,
    pagoPorParciaisCentavos: pagoPorParciais,
    contaPaga: paga,
    valorPagoInferido,
    origemValorPago: valorPagoInferido
      ? 'valor_previsto_inferido'
      : (pagoInformado > 0 ? 'valor_pago' : 'pagamentos_parciais'),
    diferencaRealizadoPrevistoCentavos: paga ? valorPagoAtual - valorPrevisto : 0,
    inconsistenciaValorPago: paga && pagoInformado > 0 && pagoPorParciais > pagoInformado
  }
}

export function derivarStatusFinanceiroConta(conta = {}, situacao = null, hoje = new Date().toISOString().slice(0, 10)) {
  const reconciliada = situacao || reconciliarSituacaoConta(conta, conta.pagamentos_parciais || [])
  if (reconciliada.contaPaga) return 'paga'
  if (reconciliada.pagoPorParciaisCentavos > 0 && reconciliada.saldoRestanteCentavos === 0) return 'quitada_por_parciais'
  const vencimento = String(conta?.data_vencimento || '')
  if (vencimento && vencimento < hoje) return 'vencida'
  if (reconciliada.pagoPorParciaisCentavos > 0) return 'parcial'
  if (vencimento && vencimento > hoje) return 'futura'
  return 'aberta'
}

export function criarMovimentosPagamentoConta(conta = {}, pagamentos = []) {
  const situacao = reconciliarSituacaoConta(conta, pagamentos)
  const movimentos = situacao.pagamentosAtivos
    .filter((pagamento) => dataIsoValida(pagamento.data_pagamento))
    .map((pagamento) => ({
      id: `parcial:${pagamento.id}`,
      conta_id: conta.id,
      pagamento_id: pagamento.id,
      tipo: 'parcial',
      data: String(pagamento.data_pagamento).slice(0, 10),
      valorCentavos: valorCentavos(pagamento.valor_pago),
      pagamento
    }))

  const dataBaixa = String(conta.data_pagamento || '').slice(0, 10)
  if (situacao.contaPaga && dataIsoValida(dataBaixa)) {
    const residual = Math.max(situacao.valorPagoAtualCentavos - situacao.pagoPorParciaisCentavos, 0)
    if (residual > 0) {
      movimentos.push({
        id: `${situacao.pagamentosAtivos.length ? 'residual' : 'integral'}:${conta.id}`,
        conta_id: conta.id,
        pagamento_id: null,
        tipo: situacao.pagamentosAtivos.length ? 'residual' : 'integral',
        data: dataBaixa,
        valorCentavos: residual,
        valorInferido: situacao.valorPagoInferido,
        origemValor: situacao.origemValorPago,
        pagamento: null
      })
    }
  }

  return movimentos.sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id))
}

export function statusRelatorioConta(conta, hoje = new Date().toISOString().slice(0, 10)) {
  return conta?.status_financeiro_relatorio
    || conta?.status_relatorio
    || derivarStatusFinanceiroConta(conta, null, hoje)
}

export function periodoMes(mes) {
  const correspondencia = String(mes || '').match(/^(\d{4})-(\d{2})$/)
  if (!correspondencia) return { dataInicial: '', dataFinal: '' }
  const ano = Number(correspondencia[1])
  const numeroMes = Number(correspondencia[2])
  const fim = new Date(ano, numeroMes, 0)
  return {
    dataInicial: `${ano}-${String(numeroMes).padStart(2, '0')}-01`,
    dataFinal: `${ano}-${String(numeroMes).padStart(2, '0')}-${String(fim.getDate()).padStart(2, '0')}`
  }
}

export function normalizarCriteriosRelatorio(criterios = {}) {
  const base = criterios.base === 'pagamento' ? 'pagamento' : 'vencimento'
  const dataInicial = String(criterios.dataInicial || '').slice(0, 10)
  const dataFinal = String(criterios.dataFinal || '').slice(0, 10)
  if (!dataIsoValida(dataInicial) || !dataIsoValida(dataFinal) || dataInicial > dataFinal) {
    throw new Error('Informe um periodo inicial e final valido para o relatorio.')
  }
  return {
    empresaId: String(criterios.empresaId || ''),
    base,
    dataInicial,
    dataFinal,
    status: String(criterios.status || 'todas'),
    filialId: String(criterios.filialId || ''),
    centroCustoId: String(criterios.centroCustoId || ''),
    origem: String(criterios.origem || 'todas'),
    incluirOcultas: criterios.incluirOcultas === true,
    busca: String(criterios.busca || '').trim(),
    hoje: String(criterios.hoje || new Date().toISOString().slice(0, 10))
  }
}

export function consolidarContasComPagamentos(contas = [], pagamentos = [], criterios = {}) {
  const normalizados = normalizarCriteriosRelatorio(criterios)
  const pagamentosValidos = pagamentosAtivos(pagamentos)
  const pagamentosPorConta = new Map()
  pagamentosValidos.forEach((pagamento) => {
    if (!pagamentosPorConta.has(pagamento.conta_id)) pagamentosPorConta.set(pagamento.conta_id, [])
    pagamentosPorConta.get(pagamento.conta_id).push(pagamento)
  })

  const obrigacoes = contas
    .filter((conta) => contaRelatorioAtiva(conta, normalizados.incluirOcultas))
    .map((conta) => {
      const pagamentosConta = pagamentosPorConta.get(conta.id) || []
      const situacao = reconciliarSituacaoConta(conta, pagamentosConta)
      const statusFinanceiro = derivarStatusFinanceiroConta(conta, situacao, normalizados.hoje)
      const dataPagamentoConta = String(conta.data_pagamento || '').slice(0, 10)

      return {
        ...conta,
        pagamentos_parciais: pagamentosConta,
        valor_previsto_relatorio: deCentavos(situacao.valorPrevistoCentavos),
        valor_pago_atual_relatorio: deCentavos(situacao.valorPagoAtualCentavos),
        valor_pago_periodo_relatorio: 0,
        saldo_restante_relatorio: deCentavos(situacao.saldoRestanteCentavos),
        parcialmente_pago: situacao.valorPagoAtualCentavos > 0 && situacao.saldoRestanteCentavos > 0,
        data_pagamento_nao_informada: situacao.contaPaga && !dataIsoValida(dataPagamentoConta),
        status_financeiro_relatorio: statusFinanceiro,
        status_relatorio: statusFinanceiro,
        rotulo_status_relatorio: statusFinanceiro === 'quitada_por_parciais'
          ? 'Quitada por parciais — baixa pendente'
          : '',
        baixa_pendente_relatorio: statusFinanceiro === 'quitada_por_parciais',
        valor_pago_inferido_relatorio: situacao.valorPagoInferido,
        origem_valor_pago_relatorio: situacao.origemValorPago,
        diferenca_realizado_previsto_relatorio: deCentavos(situacao.diferencaRealizadoPrevistoCentavos),
        inconsistencia_valor_pago_relatorio: situacao.inconsistenciaValorPago,
        valor_relatorio: deCentavos(situacao.valorPrevistoCentavos),
        data_referencia_relatorio: conta.data_vencimento
      }
    })

  if (normalizados.base !== 'pagamento') return obrigacoes

  return obrigacoes.flatMap((obrigacao) => criarMovimentosPagamentoConta(obrigacao, obrigacao.pagamentos_parciais)
    .filter((movimento) => movimento.data >= normalizados.dataInicial && movimento.data <= normalizados.dataFinal)
    .map((movimento) => ({
      ...obrigacao,
      id: `${obrigacao.id}:${movimento.id}`,
      conta_id_relatorio: obrigacao.id,
      movimento_pagamento_relatorio: true,
      tipo_pagamento_relatorio: movimento.tipo,
      pagamento_id_relatorio: movimento.pagamento_id,
      data_movimento_relatorio: movimento.data,
      valor_movimento_relatorio: deCentavos(movimento.valorCentavos),
      valor_movimento_inferido_relatorio: movimento.valorInferido === true,
      origem_valor_movimento_relatorio: movimento.origemValor || 'pagamento_registrado',
      valor_pago_periodo_relatorio: deCentavos(movimento.valorCentavos),
      valor_relatorio: deCentavos(movimento.valorCentavos),
      data_referencia_relatorio: movimento.data
    })))
}

export function filtrarDatasetRelatorio(contas = [], criterios = {}) {
  const normalizados = normalizarCriteriosRelatorio(criterios)
  const busca = normalizados.busca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return contas.filter((conta) => {
    const status = conta.status_relatorio || statusRelatorioConta(conta, normalizados.hoje)
    if (normalizados.empresaId && String(conta.empresa_id || '') !== normalizados.empresaId) return false
    if (normalizados.status !== 'todas') {
      const statusAceitos = {
        abertas: ['aberta', 'vencida', 'futura', 'parcial'],
        pagas: ['paga', 'quitada_por_parciais'],
        quitadas: ['paga', 'quitada_por_parciais'],
        vencidas: ['vencida'],
        futuras: ['futura'],
        parciais: ['parcial']
      }[normalizados.status] || [normalizados.status.replace(/s$/, '')]
      if (!statusAceitos.includes(status)) return false
    }
    if (normalizados.filialId && conta.filial_id !== normalizados.filialId) return false
    if (normalizados.centroCustoId && conta.centro_custo_id !== normalizados.centroCustoId) return false
    if (normalizados.origem === 'manual' && conta.recorrencia_id) return false
    if (normalizados.origem === 'recorrente' && !conta.recorrencia_id) return false
    if (!busca) return true
    const texto = [conta.descricao, conta.observacao, conta.df_filiais?.nome, conta.df_centros_custo?.nome]
      .filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return texto.includes(busca)
  })
}

export function calcularResumoRelatorioFinanceiro(contas = [], hoje = new Date().toISOString().slice(0, 10)) {
  const obrigacoesContadas = new Set()
  const centavos = contas.reduce((resumo, conta) => {
    const chaveObrigacao = conta.conta_id_relatorio || conta.id
    const previsto = valorCentavos(conta.valor_previsto_relatorio ?? conta.valor)
    const pago = valorCentavos(conta.valor_pago_atual_relatorio)
    const pagoPeriodo = valorCentavos(conta.valor_pago_periodo_relatorio)
    const saldo = valorCentavos(conta.saldo_restante_relatorio)
    resumo.pagoPeriodo += pagoPeriodo
    if (!obrigacoesContadas.has(chaveObrigacao)) {
      obrigacoesContadas.add(chaveObrigacao)
      resumo.previsto += previsto
      resumo.pago += pago
      resumo.saldo += saldo
      if (conta.parcialmente_pago) resumo.parcial += pago
      const status = conta.status_relatorio || statusRelatorioConta(conta, hoje)
      resumo.quantidades[status] = (resumo.quantidades[status] || 0) + 1
      if (status === 'vencida') resumo.vencido += saldo
      if (conta.data_pagamento_nao_informada) resumo.semDataPagamento += 1
    }
    return resumo
  }, { previsto: 0, pago: 0, pagoPeriodo: 0, parcial: 0, saldo: 0, vencido: 0, semDataPagamento: 0, quantidades: {} })

  return {
    totalRegistros: contas.length,
    totalPrevisto: deCentavos(centavos.previsto),
    totalPago: deCentavos(centavos.pago),
    totalPagoPeriodo: deCentavos(centavos.pagoPeriodo),
    totalParcialmentePago: deCentavos(centavos.parcial),
    saldoEmAberto: deCentavos(centavos.saldo),
    totalVencido: deCentavos(centavos.vencido),
    semDataPagamento: centavos.semDataPagamento,
    quantidades: centavos.quantidades
  }
}

export function podeExportarRelatorio({ carregando = false, erro = null, carregado = false, registros = [] } = {}) {
  return !carregando && !erro && carregado && registros.length > 0
}

export function criarControleConsultaRelatorio() {
  let versao = 0
  return {
    iniciar() {
      versao += 1
      return versao
    },
    invalidar() {
      versao += 1
    },
    estaAtual(token) {
      return token === versao
    }
  }
}
