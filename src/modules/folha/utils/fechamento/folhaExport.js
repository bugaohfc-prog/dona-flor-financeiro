import { createXlsxBlob, downloadBlob, exportCsv } from '../../../../services/export/reportExportService'

function numero(valor) {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

function horasParaTexto(valor) {
  const totalMinutos = Math.round(numero(valor) * 60)
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

function nomeFuncionario(funcionariosPorId, id) {
  return funcionariosPorId.get(id)?.nome || 'Funcionário não identificado'
}

function nomeFilial(filiaisPorId, funcionario) {
  return filiaisPorId.get(funcionario?.filial_id)?.nome || ''
}

function nomeCategoria(categoria) {
  return {
    compras_vales: 'Compras',
    plano_saude: 'Plano de saúde',
    premiacao: 'Premiação',
    hora_extra_50: 'Hora extra 50%',
    hora_extra_60: 'Hora extra 60%',
    hora_extra_100: 'Hora extra 100%',
    falta_injustificada: 'Falta'
  }[categoria] || categoria || 'Outro'
}

function linhasLancamentos({ lancamentos = [], itensLancamentos = [], funcionarios = [], filiais = [] }) {
  const funcionariosPorId = new Map(funcionarios.map((item) => [item.id, item]))
  const filiaisPorId = new Map(filiais.map((item) => [item.id, item]))
  const itens = itensLancamentos.filter((item) => !item?.arquivado)
  const linhas = []

  for (const lancamento of lancamentos.filter((item) => !item?.arquivado)) {
    const funcionario = funcionariosPorId.get(lancamento.funcionario_id)
    const base = {
      funcionario: nomeFuncionario(funcionariosPorId, lancamento.funcionario_id),
      filial: nomeFilial(filiaisPorId, funcionario),
      categoria: nomeCategoria(lancamento.categoria),
      data: lancamento.data_referencia || '',
      valor: numero(lancamento.valor),
      quantidade: numero(lancamento.quantidade),
      observacao: lancamento.observacao_administrativa || lancamento.descricao || ''
    }
    const detalhados = itens.filter((item) => item.lancamento_id === lancamento.id)
    if (detalhados.length) {
      for (const item of detalhados) {
        linhas.push({
          ...base,
          categoria: nomeCategoria(item.categoria || lancamento.categoria),
          data: item.data_referencia || base.data,
          valor: numero(item.valor) || base.valor,
          quantidade: numero(item.quantidade),
          observacao: item.observacao_administrativa || item.descricao || base.observacao
        })
      }
    } else {
      linhas.push(base)
    }
  }
  return linhas
}

export function exportarControleCompras(params) {
  const linhas = linhasLancamentos(params).filter((linha) => linha.categoria === 'Compras')
  const headers = ['Empresa', 'Filial', 'Funcionário', 'Compras', 'Data', 'Observações']
  const rows = linhas.map((linha) => [params.empresaNome || '', linha.filial, linha.funcionario, linha.valor, linha.data, linha.observacao])
  exportCsv({ filename: `controle-compras-${params.competencia || 'folha'}.csv`, headers, rows })
}

export function exportarConsolidadoContabil(params) {
  const linhas = linhasLancamentos(params)
  const porFuncionario = new Map()
  for (const linha of linhas) {
    const chave = `${linha.filial}::${linha.funcionario}`
    if (!porFuncionario.has(chave)) {
      porFuncionario.set(chave, { filial: linha.filial, funcionario: linha.funcionario, compras: 0, plano: 0, premiacao: 0, he50: 0, he60: 0, he100: 0, faltas: 0, datasFaltas: [], observacoes: [] })
    }
    const resumo = porFuncionario.get(chave)
    if (linha.categoria === 'Compras') resumo.compras += linha.valor
    else if (linha.categoria === 'Plano de saúde') resumo.plano += linha.valor
    else if (linha.categoria === 'Premiação') resumo.premiacao += linha.valor
    else if (linha.categoria === 'Hora extra 50%') resumo.he50 += linha.quantidade
    else if (linha.categoria === 'Hora extra 60%') resumo.he60 += linha.quantidade
    else if (linha.categoria === 'Hora extra 100%') resumo.he100 += linha.quantidade
    else if (linha.categoria === 'Falta') {
      resumo.faltas += linha.quantidade || 1
      if (linha.data) resumo.datasFaltas.push(linha.data)
    }
    if (linha.observacao) resumo.observacoes.push(linha.observacao)
  }
  const headers = ['Empresa', 'Filial', 'Funcionário', 'Compras', 'Plano de saúde', 'Premiação', 'HE 50%', 'HE 60%', 'HE 100%', 'Faltas', 'Datas das faltas', 'Observações']
  const rows = Array.from(porFuncionario.values()).map((item) => [params.empresaNome || '', item.filial, item.funcionario, item.compras, item.plano, item.premiacao, horasParaTexto(item.he50), horasParaTexto(item.he60), horasParaTexto(item.he100), item.faltas, item.datasFaltas.join(', '), item.observacoes.join(' | ')])
  const nome = `fechamento-contabil-${params.competencia || 'folha'}`
  downloadBlob(`${nome}.xlsx`, createXlsxBlob([{ name: 'Consolidado', rows: [headers, ...rows] }]))
  exportCsv({ filename: `${nome}.csv`, headers, rows })
}
