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

export function statusRelatorioConta(conta, hoje = new Date().toISOString().slice(0, 10)) {
  if (contaPaga(conta)) return 'paga'
  const vencimento = String(conta?.data_vencimento || '')
  if (vencimento && vencimento < hoje) return 'vencida'
  if (vencimento && vencimento > hoje) return 'futura'
  return 'aberta'
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
  const pagamentosAtivos = pagamentos.filter((pagamento) => pagamento && pagamento.arquivado !== true && valorCentavos(pagamento.valor_pago) > 0)
  const pagamentosPorConta = new Map()
  pagamentosAtivos.forEach((pagamento) => {
    if (!pagamentosPorConta.has(pagamento.conta_id)) pagamentosPorConta.set(pagamento.conta_id, [])
    pagamentosPorConta.get(pagamento.conta_id).push(pagamento)
  })

  return contas
    .filter((conta) => contaRelatorioAtiva(conta, normalizados.incluirOcultas))
    .map((conta) => {
      const pagamentosConta = pagamentosPorConta.get(conta.id) || []
      const pagamentosPeriodo = pagamentosConta.filter((pagamento) => {
        const data = String(pagamento.data_pagamento || '').slice(0, 10)
        return dataIsoValida(data) && data >= normalizados.dataInicial && data <= normalizados.dataFinal
      })
      const pagoPorParciais = pagamentosConta.reduce((total, pagamento) => total + valorCentavos(pagamento.valor_pago), 0)
      const pagoConta = valorCentavos(conta.valor_pago)
      const valorPrevisto = valorCentavos(conta.valor)
      const valorPagoAtual = pagoPorParciais > 0
        ? pagoPorParciais
        : (contaPaga(conta) ? Math.max(pagoConta, valorPrevisto) : pagoConta)
      const valorPagoPeriodoParciais = pagamentosPeriodo.reduce((total, pagamento) => total + valorCentavos(pagamento.valor_pago), 0)
      const dataPagamentoConta = String(conta.data_pagamento || '').slice(0, 10)
      const pagamentoIntegralNoPeriodo = pagamentosConta.length === 0 && contaPaga(conta) && dataIsoValida(dataPagamentoConta)
        && dataPagamentoConta >= normalizados.dataInicial && dataPagamentoConta <= normalizados.dataFinal
      const valorPagoPeriodo = valorPagoPeriodoParciais > 0
        ? valorPagoPeriodoParciais
        : (pagamentoIntegralNoPeriodo ? Math.max(pagoConta, valorPrevisto) : 0)
      const saldo = Math.max(valorPrevisto - valorPagoAtual, 0)

      return {
        ...conta,
        pagamentos_parciais: pagamentosConta,
        pagamentos_no_periodo: pagamentosPeriodo,
        valor_previsto_relatorio: deCentavos(valorPrevisto),
        valor_pago_atual_relatorio: deCentavos(valorPagoAtual),
        valor_pago_periodo_relatorio: deCentavos(valorPagoPeriodo),
        saldo_restante_relatorio: deCentavos(saldo),
        parcialmente_pago: valorPagoAtual > 0 && saldo > 0,
        data_pagamento_nao_informada: contaPaga(conta) && !dataIsoValida(dataPagamentoConta) && pagamentosConta.length === 0,
        status_relatorio: statusRelatorioConta(conta, normalizados.hoje),
        valor_relatorio: normalizados.base === 'pagamento' ? deCentavos(valorPagoPeriodo) : deCentavos(valorPrevisto),
        data_referencia_relatorio: normalizados.base === 'pagamento'
          ? (pagamentosPeriodo[0]?.data_pagamento || (pagamentoIntegralNoPeriodo ? dataPagamentoConta : ''))
          : conta.data_vencimento
      }
    })
    .filter((conta) => normalizados.base !== 'pagamento' || valorCentavos(conta.valor_pago_periodo_relatorio) > 0)
}

export function filtrarDatasetRelatorio(contas = [], criterios = {}) {
  const normalizados = normalizarCriteriosRelatorio(criterios)
  const busca = normalizados.busca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return contas.filter((conta) => {
    const status = conta.status_relatorio || statusRelatorioConta(conta, normalizados.hoje)
    if (normalizados.status !== 'todas') {
    if (normalizados.empresaId && String(conta.empresa_id || '') !== normalizados.empresaId) return false
      if (normalizados.status === 'abertas' && !['aberta', 'vencida', 'futura'].includes(status)) return false
      if (normalizados.status !== 'abertas' && status !== normalizados.status.replace(/s$/, '')) return false
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
  const centavos = contas.reduce((resumo, conta) => {
    const previsto = valorCentavos(conta.valor_previsto_relatorio ?? conta.valor)
    const pago = valorCentavos(conta.valor_pago_atual_relatorio)
    const pagoPeriodo = valorCentavos(conta.valor_pago_periodo_relatorio)
    const saldo = valorCentavos(conta.saldo_restante_relatorio)
    resumo.previsto += previsto
    resumo.pago += pago
    resumo.pagoPeriodo += pagoPeriodo
    resumo.saldo += saldo
    if (conta.parcialmente_pago) resumo.parcial += pago
    const status = conta.status_relatorio || statusRelatorioConta(conta, hoje)
    resumo.quantidades[status] = (resumo.quantidades[status] || 0) + 1
    if (status === 'vencida') resumo.vencido += saldo
    if (conta.data_pagamento_nao_informada) resumo.semDataPagamento += 1
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
