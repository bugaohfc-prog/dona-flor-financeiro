const DIA_MS = 24 * 60 * 60 * 1000
export const AGRUPAMENTOS_ANALISE = Object.freeze([['status', 'Por status'], ['vencimento', 'Por vencimento'], ['centro', 'Por centro de custo'], ['filial', 'Por filial/unidade'], ['sem', 'Sem agrupamento']])
export function dataLocalISO(data = new Date()) { return [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-') }
export function periodoMesAtual(data = new Date()) { return { dataInicial: dataLocalISO(new Date(data.getFullYear(), data.getMonth(), 1)), dataFinal: dataLocalISO(new Date(data.getFullYear(), data.getMonth() + 1, 0)) } }
function dataBancoParaUtc(valor) { const [ano, mes, dia] = String(valor || '').slice(0, 10).split('-').map(Number); return Date.UTC(ano, (mes || 1) - 1, dia || 1) }
export function calcularPeriodoAnterior({ dataInicial, dataFinal }) { const inicio = dataBancoParaUtc(dataInicial); const fim = dataBancoParaUtc(dataFinal); const duracao = Math.max(1, Math.round((fim - inicio) / DIA_MS) + 1); const formatar = (data) => [data.getUTCFullYear(), String(data.getUTCMonth() + 1).padStart(2, '0'), String(data.getUTCDate()).padStart(2, '0')].join('-'); return { dataInicial: formatar(new Date(inicio - duracao * DIA_MS)), dataFinal: formatar(new Date(inicio - DIA_MS)) } }
const emCentavos = (valor) => Math.round(Number(valor || 0) * 100)
const deCentavos = (valor) => Number((valor / 100).toFixed(2))
const nomeCentro = (conta, centros = []) => conta?.df_centros_custo?.nome || centros.find((item) => item.id === conta?.centro_custo_id)?.nome || 'Sem centro'
const nomeFilial = (conta, filiais = []) => conta?.df_filiais?.nome || filiais.find((item) => item.id === conta?.filial_id)?.nome || 'Sem filial'
const statusNormalizado = (conta) => String(conta?.status_financeiro_relatorio || conta?.status_relatorio || '')
export function rotuloStatusGerencial(conta) { const status = statusNormalizado(conta); if (conta?.parcialmente_pago === true) return status === 'vencida' ? 'Vencida · parcialmente paga' : 'Em aberto · parcialmente paga'; return ({ paga: 'Paga', quitada_por_parciais: 'Quitada por parciais — baixa pendente', parcial: 'Em aberto · parcialmente paga', vencida: 'Vencida', futura: 'A vencer', aberta: 'Em aberto' })[status] || 'Em aberto' }
function rotuloGrupoStatus(conta) { const status = statusNormalizado(conta); if (status === 'vencida') return 'Vencidas'; if (['paga', 'quitada_por_parciais'].includes(status)) return 'Pagas'; if (status === 'futura') return 'A vencer'; return 'Em aberto' }
function correspondeStatus(conta, status) { const atual = statusNormalizado(conta); if (!status || status === 'todas') return true; if (status === 'pagas') return ['paga', 'quitada_por_parciais'].includes(atual); if (status === 'vencidas') return atual === 'vencida'; if (status === 'abertas') return ['aberta', 'futura', 'parcial'].includes(atual); if (status === 'parciais') return atual === 'parcial'; return true }
export function filtrarRegistrosAnalise(registros = [], filtros = {}, centros = [], filiais = []) { const busca = String(filtros.busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); const selecionados = new Set(filtros.centrosSelecionados || []); return registros.filter((conta) => { if (!correspondeStatus(conta, filtros.status)) return false; if (selecionados.size && !selecionados.has(conta.centro_custo_id || '')) return false; if (filtros.origem === 'manual' && conta.recorrencia_id) return false; if (filtros.origem === 'recorrente' && !conta.recorrencia_id) return false; if (!busca) return true; return [conta.descricao, conta.observacao, nomeCentro(conta, centros), nomeFilial(conta, filiais), conta.data_vencimento, conta.data_pagamento].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(busca) }) }
export function calcularIndicadoresAnalise(registros = [], _hoje = dataLocalISO(), { base = 'vencimento' } = {}) { const obrigacoes = new Map(); let pagoPeriodo = 0; registros.forEach((conta) => { const chave = conta.conta_id_relatorio || conta.id; pagoPeriodo += emCentavos(conta.valor_pago_periodo_relatorio); if (!obrigacoes.has(chave)) obrigacoes.set(chave, conta) }); const centavos = Array.from(obrigacoes.values()).reduce((resumo, conta) => { resumo.previsto += emCentavos(conta.valor_previsto_relatorio); resumo.pago += emCentavos(conta.valor_pago_atual_relatorio); resumo.saldo += emCentavos(conta.saldo_restante_relatorio); resumo.encargos += emCentavos(conta.juros_multa); resumo.descontos += emCentavos(conta.desconto); if (statusNormalizado(conta) === 'vencida') resumo.vencido += emCentavos(conta.saldo_restante_relatorio); if (conta.data_pagamento_nao_informada) resumo.semDataPagamento += 1; return resumo }, { previsto: 0, pago: 0, saldo: 0, vencido: 0, encargos: 0, descontos: 0, semDataPagamento: 0 }); const previsto = deCentavos(centavos.previsto); const pago = deCentavos(base === 'pagamento' ? pagoPeriodo : centavos.pago); return { previsto, pago, saldo: deCentavos(centavos.saldo), vencido: deCentavos(centavos.vencido), encargos: deCentavos(centavos.encargos), descontos: deCentavos(centavos.descontos), quantidade: registros.length, taxaPagamento: previsto > 0 ? Number(((pago / previsto) * 100).toFixed(1)) : 0, semDataPagamento: centavos.semDataPagamento } }
export function calcularComparacaoPeriodo(atual, anterior) { const base = Number(anterior?.previsto || 0); const diferenca = Number((Number(atual?.previsto || 0) - base).toFixed(2)); return { diferenca, percentual: base ? Number(((diferenca / base) * 100).toFixed(1)) : null, direcao: diferenca > 0 ? 'alta' : diferenca < 0 ? 'queda' : 'estavel' } }
export function calcularProjecoesAnalise(registros = [], { dataInicial, dataFinal, metaMensal = 0 } = {}) { const dias = Math.max(1, Math.round((dataBancoParaUtc(dataFinal) - dataBancoParaUtc(dataInicial)) / DIA_MS) + 1); const saldo = registros.reduce((soma, conta) => soma + emCentavos(conta.saldo_restante_relatorio), 0); const media = saldo / dias; const risco = registros.filter((conta) => statusNormalizado(conta) === 'vencida').reduce((soma, conta) => soma + emCentavos(conta.saldo_restante_relatorio), 0); const projetar = (horizonte) => deCentavos(Math.round(media * horizonte)); const previsao30 = projetar(30); return { previsao30, previsao60: projetar(60), previsao90: projetar(90), riscoProjetado: saldo ? Number(((risco / saldo) * 100).toFixed(1)) : 0, tendencia: 'Simulação linear baseada no saldo em aberto do recorte; não representa previsão de caixa nem DRE.', relacaoMeta: Number(metaMensal) > 0 ? Number(((previsao30 / Number(metaMensal)) * 100).toFixed(1)) : null } }
export function identificarExcecoesAnalise(registros = []) { const valores = registros.map((conta) => Number(conta.valor_previsto_relatorio || 0)).filter((valor) => valor > 0); const media = valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0; const saldoTotal = registros.reduce((soma, conta) => soma + emCentavos(conta.saldo_restante_relatorio), 0); const saldosPorCentro = new Map(); registros.forEach((conta) => { const chave = conta.centro_custo_id || ''; saldosPorCentro.set(chave, (saldosPorCentro.get(chave) || 0) + emCentavos(conta.saldo_restante_relatorio)) }); const concentracoesExcessivas = Array.from(saldosPorCentro, ([centroCustoId, saldo]) => ({ centroCustoId, saldo: deCentavos(saldo), percentual: saldoTotal ? Number(((saldo / saldoTotal) * 100).toFixed(1)) : 0 })).filter((item) => item.percentual >= 40 && item.saldo > 0); return { vencidas: registros.filter((conta) => statusNormalizado(conta) === 'vencida'), proximas: registros.filter((conta) => { if (['paga', 'quitada_por_parciais'].includes(statusNormalizado(conta))) return false; const dias = Math.round((dataBancoParaUtc(conta.data_vencimento) - dataBancoParaUtc(dataLocalISO())) / DIA_MS); return dias >= 0 && dias <= 7 }), anormais: media ? registros.filter((conta) => Number(conta.valor_previsto_relatorio || 0) >= media * 2.5) : [], semCentro: registros.filter((conta) => !conta.centro_custo_id), concentracoesExcessivas, pagamentosSemData: registros.filter((conta) => conta.valor_pago_inferido_relatorio || conta.data_pagamento_nao_informada) } }
function nomeMesAno(valor) { if (!valor) return 'Sem data'; const [ano, mes] = String(valor).slice(0, 7).split('-').map(Number); return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }
export function agruparRegistrosAnalise(registros, agrupamento, centros = [], filiais = []) { const mapa = new Map(); registros.forEach((conta) => { const chave = agrupamento === 'status' ? rotuloGrupoStatus(conta) : agrupamento === 'vencimento' ? nomeMesAno(conta.data_referencia_relatorio || conta.data_vencimento) : agrupamento === 'centro' ? nomeCentro(conta, centros) : agrupamento === 'filial' ? nomeFilial(conta, filiais) : 'Detalhamento'; if (!mapa.has(chave)) mapa.set(chave, []); mapa.get(chave).push(conta) }); return Array.from(mapa, ([titulo, contas]) => ({ titulo, contas })) }

export function montarLinhasAnaliseFinanceira(registros = [], { base = 'vencimento', centros = [], filiais = [], formatarValor = (valor) => String(Number(valor || 0)), formatarData = (valor) => String(valor || '-') } = {}) {
  return registros.map((conta) => {
    const valorPrevisto = Number(conta.valor_previsto_relatorio || 0)
    const valorPagoAtual = Number(conta.valor_pago_atual_relatorio || 0)
    const saldoRestante = Math.max(0, Number(conta.saldo_restante_relatorio || 0))
    const valorMovimentoPeriodo = Number(conta.valor_pago_periodo_relatorio || 0)
    const valorPago = base === 'pagamento' ? valorMovimentoPeriodo : valorPagoAtual
    const dataReferencia = conta.data_referencia_relatorio || conta.data_vencimento || ''
    return {
      conta,
      descricao: conta.descricao || 'Conta sem descrição',
      valorPrevisto,
      valorPago,
      valorPagoAtual,
      saldoRestante,
      valorMovimentoPeriodo,
      valorPrevistoFormatado: formatarValor(valorPrevisto),
      valorPagoFormatado: formatarValor(valorPago),
      valorPagoAtualFormatado: formatarValor(valorPagoAtual),
      saldoRestanteFormatado: formatarValor(saldoRestante),
      valorMovimentoPeriodoFormatado: formatarValor(valorMovimentoPeriodo),
      dataReferencia,
      dataReferenciaFormatada: formatarData(dataReferencia),
      vencimentoFormatado: formatarData(conta.data_vencimento),
      statusGerencial: rotuloStatusGerencial(conta),
      tipoPagamento: conta.tipo_pagamento_relatorio || '',
      centroNome: nomeCentro(conta, centros),
      filialNome: nomeFilial(conta, filiais),
      observacao: conta.observacao || '',
    }
  })
}
