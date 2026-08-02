import { useEffect, useMemo, useRef, useState } from 'react'
import { useFolha } from '../hooks/useFolha'
import { useFuncionarios } from '../hooks/useFuncionarios'
import FolhaExportacoes from '../modules/folha/components/fechamento/FolhaExportacoes'
import {
  ajustarDatasFaltasFolha,
  calcularPremiacaoFolha,
  CATEGORIAS_OPERACIONAIS_FOLHA,
  categoriaFolhaEhHora,
  categoriaFolhaUsaItens,
  dataPertenceCompetenciaFolha,
  formatarMoedaEntradaFolha,
  horasFolhaParaPersistencia,
  horasFolhaParaTexto,
  itensAtivosDoLancamento,
  mascararHorasFolha,
  mensagemDataCompetenciaFolha,
  numeroFolha,
  obterLimitesCompetenciaFolha,
  ordenarItensFolha,
  parseMoedaEntradaFolha,
  planejarInclusaoCompraFolha,
  planejarSincronizacaoFaltasFolha,
  quantidadeFaltasFolha,
  quantidadeHorasFolha,
  resolverValorLancamentoFolha,
  validarDatasFaltasFolha
} from '../modules/folha/utils/fechamento/folhaDomain'
import {
  exportarConsolidadoContabil,
  exportarControleCompras
} from '../modules/folha/utils/fechamento/folhaExport'
import { formatarData, formatarMoeda } from '../modules/folha/utils/fechamento/folhaFormatters'
import {
  CATEGORIAS_CREDITO_FOLHA,
  CATEGORIAS_DESCONTO_FOLHA,
  STATUS_COMPETENCIA_FOLHA
} from '../services/folhaService'
import {
  KpiCard,
  KpiGrid,
  PageHeader,
  PageState,
  SectionCard
} from '../components/shared/PagePatterns.jsx'
import './FechamentoFolhaPage.css'

const LABELS_CATEGORIA = {
  compras_vales: 'Compras internas / vales',
  plano_saude: 'Plano de saúde',
  premiacao: 'Premiação',
  hora_extra_50: 'Hora extra 50%',
  hora_extra_60: 'Hora extra 60%',
  hora_extra_100: 'Hora extra 100%',
  falta_injustificada: 'Faltas',
  observacao_administrativa: 'Observação administrativa',
  outro_credito: 'Outro crédito',
  pensao_alimenticia: 'Pensão alimentícia',
  outro_desconto: 'Outro desconto'
}

const LABELS_STATUS = {
  aberta: 'Aberta',
  em_conferencia: 'Em conferência',
  validada: 'Validada',
  enviada_contabilidade: 'Enviada à contabilidade',
  fechada: 'Fechada',
  arquivada: 'Arquivada'
}

const FORM_LANCAMENTO_INICIAL = Object.freeze({
  categoria: 'compras_vales',
  valor: '',
  descricao: '',
  observacao: '',
  vendas: '',
  percentual: '',
  horas: '',
  dataHora: '',
  quantidadeFaltas: '1',
  datasFaltas: Object.freeze([''])
})

function criarFormLancamento(categoria = 'compras_vales') {
  return { ...FORM_LANCAMENTO_INICIAL, categoria, datasFaltas: [''] }
}

function mascararMoedaFolhaDuranteDigitacao(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '')
  if (!digitos) return ''
  return formatarMoedaEntradaFolha(Number(digitos) / 100)
}

function MoedaInputFolha({ value, onChange, inputRef, ...props }) {
  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(mascararMoedaFolhaDuranteDigitacao(event.target.value))}
      onBlur={(event) => onChange(formatarMoedaEntradaFolha(event.target.value))}
      onFocus={(event) => event.currentTarget.select()}
    />
  )
}

function naturezaCategoria(categoria) {
  if (CATEGORIAS_CREDITO_FOLHA.includes(categoria)) return 'credito'
  if (CATEGORIAS_DESCONTO_FOLHA.includes(categoria)) return 'desconto'
  return 'informativo'
}

function filialDoFuncionario(funcionario) {
  return funcionario?.filial_id || null
}

function nomeFilial(filiaisPorId, filialId) {
  return filiaisPorId.get(filialId)?.nome || 'Sem filial cadastrada'
}

function localizarLancamentoAtivo(lancamentos, funcionarioId, categoria) {
  return lancamentos.find((item) => !item.arquivado && item.funcionario_id === funcionarioId && item.categoria === categoria) || null
}

function resumoFuncionario(lancamentos, itens, funcionarioId) {
  return lancamentos.filter((item) => !item.arquivado && item.funcionario_id === funcionarioId).reduce((resumo, lancamento) => {
    const valor = resolverValorLancamentoFolha(lancamento, itens)
    if (lancamento.natureza === 'credito') resumo.creditos += valor
    if (lancamento.natureza === 'desconto') resumo.descontos += valor
    if (lancamento.categoria === 'compras_vales') resumo.compras += valor
    if (categoriaFolhaEhHora(lancamento.categoria)) resumo.horas += quantidadeHorasFolha(lancamento, itens)
    if (lancamento.categoria === 'falta_injustificada') resumo.faltas += quantidadeFaltasFolha(lancamento, itens)
    resumo.lancamentos += 1
    resumo.conferidos += lancamento.conferido ? 1 : 0
    return resumo
  }, { creditos: 0, descontos: 0, compras: 0, horas: 0, faltas: 0, lancamentos: 0, conferidos: 0 })
}

function descricaoLancamento(lancamento, itens) {
  if (lancamento.categoria === 'compras_vales') return `${itensAtivosDoLancamento(itens, lancamento.id).length || (numeroFolha(lancamento.valor) > 0 ? 1 : 0)} compra(s)`
  if (categoriaFolhaEhHora(lancamento.categoria)) return horasFolhaParaTexto(quantidadeHorasFolha(lancamento, itens))
  if (lancamento.categoria === 'falta_injustificada') return `${quantidadeFaltasFolha(lancamento, itens)} falta(s)`
  return lancamento.descricao || lancamento.observacao_administrativa || 'Sem observação'
}

export default function FechamentoFolhaPage({
  empresaId,
  empresaNome,
  podeEditar = true,
  voltarPainel,
  filiais = []
}) {
  const [competenciaSelecionadaId, setCompetenciaSelecionadaId] = useState('')
  const [novaCompetencia, setNovaCompetencia] = useState('')
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState('')
  const [form, setForm] = useState(() => criarFormLancamento())
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [itemEditandoId, setItemEditandoId] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erroLocal, setErroLocal] = useState('')
  const [salvandoCompraRapida, setSalvandoCompraRapida] = useState(false)
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false)
  const compraInputRef = useRef(null)
  const horaDataInputRef = useRef(null)
  const faltaDataInputRef = useRef(null)

  const {
    competencias,
    lancamentos,
    itensLancamentos,
    loadingCompetencias,
    loadingLancamentos,
    loadingItensLancamentos,
    competenciaLancamentosCarregadaId,
    salvando,
    erro,
    criarCompetencia,
    arquivarCompetencia,
    reativarCompetencia,
    carregarCompetencias,
    carregarLancamentos,
    criarLancamento,
    atualizarLancamento,
    arquivarLancamento,
    reativarLancamento,
    criarItemLancamento,
    atualizarItemLancamento,
    arquivarItemLancamento,
    reativarItemLancamento,
    limparErro
  } = useFolha({
    empresaId,
    competenciaId: competenciaSelecionadaId,
    incluirArquivadas: mostrarArquivados,
    incluirArquivados: mostrarArquivados,
    autoCarregarCompetencias: Boolean(empresaId),
    autoCarregarLancamentos: Boolean(empresaId && competenciaSelecionadaId)
  })

  const { funcionarios, loading: loadingFuncionarios, erro: erroFuncionarios } = useFuncionarios({
    empresaId,
    incluirArquivados: false,
    autoCarregar: Boolean(empresaId)
  })

  const funcionariosAtivos = useMemo(() => [...(funcionarios || [])]
    .filter((item) => !item.arquivado)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')), [funcionarios])
  const funcionariosPorId = useMemo(() => new Map((funcionarios || []).map((item) => [item.id, item])), [funcionarios])
  const filiaisPorId = useMemo(() => new Map((filiais || []).map((item) => [item.id, item])), [filiais])
  const competenciaSelecionada = competencias.find((item) => item.id === competenciaSelecionadaId) || null
  const limitesCompetencia = obterLimitesCompetenciaFolha(competenciaSelecionada?.competencia)
  const funcionarioSelecionado = funcionariosPorId.get(funcionarioSelecionadoId) || null
  const lancamentosFuncionario = lancamentos.filter((item) => item.funcionario_id === funcionarioSelecionadoId)
  const resumoAtual = useMemo(
    () => resumoFuncionario(lancamentos, itensLancamentos, funcionarioSelecionadoId),
    [funcionarioSelecionadoId, itensLancamentos, lancamentos]
  )
  const premiacaoCalculada = calcularPremiacaoFolha(form.vendas, form.percentual)
  const mensagemErro = erroLocal || erro || erroFuncionarios
  const dadosCompletos = Boolean(
    empresaId
    && competenciaSelecionada
    && competenciaLancamentosCarregadaId === competenciaSelecionadaId
    && !loadingCompetencias
    && !loadingLancamentos
    && !loadingItensLancamentos
    && !mensagemErro
  )
  const parametrosExportacao = { empresaId, empresaNome, competencia: competenciaSelecionada?.competencia, competenciaId: competenciaSelecionadaId, lancamentos, itensLancamentos, funcionarios, filiais }

  function montarFormularioCategoria(categoria, funcionarioId = funcionarioSelecionadoId, adicionar = false) {
    const formulario = criarFormLancamento(categoria)
    if (categoria !== 'falta_injustificada') return formulario
    const lancamento = localizarLancamentoAtivo(lancamentos, funcionarioId, categoria)
    const datasAtivas = lancamento
      ? itensAtivosDoLancamento(itensLancamentos, lancamento.id).map((item) => item.data_referencia || '')
      : []
    if (adicionar || datasAtivas.length === 0) datasAtivas.push('')
    return {
      ...formulario,
      quantidadeFaltas: String(datasAtivas.length),
      datasFaltas: datasAtivas
    }
  }

  useEffect(() => {
    setFuncionarioSelecionadoId('')
    setForm(criarFormLancamento())
    setItemEditandoId('')
    setMensagem('')
    setErroLocal('')
  }, [competenciaSelecionadaId, empresaId])

  function limparFeedback() {
    setMensagem('')
    setErroLocal('')
    limparErro()
  }

  function selecionarFuncionario(id) {
    limparFeedback()
    setFuncionarioSelecionadoId(id)
    setForm(criarFormLancamento())
    setItemEditandoId('')
  }

  async function tentarNovamente() {
    limparFeedback()
    await carregarCompetencias({ empresaId })
    if (competenciaSelecionadaId) await carregarLancamentos({ empresaId, competenciaId: competenciaSelecionadaId })
  }

  async function salvarCompetencia(event) {
    event.preventDefault()
    limparFeedback()
    const resposta = await criarCompetencia({ competencia: novaCompetencia, status: 'aberta' })
    if (resposta.error) return setErroLocal(resposta.error.message)
    setNovaCompetencia('')
    setCompetenciaSelecionadaId(resposta.data.id)
    setMensagem('Competência criada com sucesso.')
  }

  async function obterOuCriarLancamento(categoria, dadosAdicionais = {}) {
    const existente = localizarLancamentoAtivo(lancamentos, funcionarioSelecionadoId, categoria)
    if (existente) return { data: existente, error: null }
    return criarLancamento({
      competencia_id: competenciaSelecionadaId,
      funcionario_id: funcionarioSelecionadoId,
      filial_id: filialDoFuncionario(funcionarioSelecionado),
      natureza: naturezaCategoria(categoria),
      categoria,
      valor: categoria === 'observacao_administrativa' ? null : 0,
      quantidade: categoriaFolhaEhHora(categoria) || categoria === 'falta_injustificada' ? 0 : null,
      ...dadosAdicionais
    })
  }

  async function salvarCompraRapida(event) {
    event.preventDefault()
    if (salvandoCompraRapida) return
    limparFeedback()
    const valor = parseMoedaEntradaFolha(form.valor)
    if (!funcionarioSelecionadoId) return setErroLocal('Selecione uma colaboradora.')
    if (valor <= 0) return setErroLocal('Informe um valor de compra maior que zero.')

    setSalvandoCompraRapida(true)
    try {
      const paiResposta = await obterOuCriarLancamento('compras_vales')
      if (paiResposta.error) return setErroLocal(paiResposta.error.message)
      const pai = paiResposta.data

      if (itemEditandoId) {
        const item = itensLancamentos.find((registro) => registro.id === itemEditandoId)
        const resposta = await atualizarItemLancamento(item, { descricao: form.descricao || null, valor })
        if (resposta.error) return setErroLocal(resposta.error.message)
      } else {
        const criacoes = planejarInclusaoCompraFolha({ lancamento: pai, itens: itensLancamentos, novaCompra: { valor, descricao: form.descricao } })
        for (const compra of criacoes) {
          const resposta = await criarItemLancamento(pai, compra)
          if (resposta.error) return setErroLocal(resposta.error.message)
        }
      }

      setItemEditandoId('')
      setForm((atual) => ({ ...atual, valor: '', descricao: '' }))
      setMensagem('Compra salva e total atualizado.')
      window.setTimeout(() => compraInputRef.current?.focus(), 0)
    } finally {
      setSalvandoCompraRapida(false)
    }
  }

  function alterarQuantidadeFaltas(valor) {
    const quantidade = Math.max(1, Math.min(31, Number.parseInt(valor || '1', 10) || 1))
    if (quantidade < form.datasFaltas.length && form.datasFaltas.slice(quantidade).some(Boolean)) {
      const confirmou = window.confirm('Reduzir a quantidade removerá as últimas datas ainda não salvas. Deseja continuar?')
      if (!confirmou) return
    }
    setForm((atual) => ({
      ...atual,
      quantidadeFaltas: String(quantidade),
      datasFaltas: ajustarDatasFaltasFolha(atual.datasFaltas, quantidade)
    }))
  }

  function alterarHoras(event) {
    const apagando = event.nativeEvent?.inputType?.startsWith('delete')
    setForm((atual) => ({ ...atual, horas: mascararHorasFolha(event.target.value, { apagando }) }))
  }

  async function salvarCategoria(event) {
    event.preventDefault()
    limparFeedback()
    const categoria = form.categoria
    if (!funcionarioSelecionadoId) return setErroLocal('Selecione uma colaboradora.')

    if (categoria === 'compras_vales') return salvarCompraRapida(event)

    if (categoriaFolhaEhHora(categoria)) {
      const quantidade = horasFolhaParaPersistencia(form.horas)
      if (quantidade === null || quantidade <= 0) return setErroLocal('Informe as horas no formato HH:MM.')
      if (!dataPertenceCompetenciaFolha(form.dataHora, competenciaSelecionada?.competencia)) {
        return setErroLocal(mensagemDataCompetenciaFolha(competenciaSelecionada?.competencia))
      }
      setSalvandoOcorrencia(true)
      const paiResposta = await obterOuCriarLancamento(categoria)
      if (paiResposta.error) {
        setSalvandoOcorrencia(false)
        return setErroLocal(paiResposta.error.message)
      }
      const percentual = Number(categoria.split('_').at(-1))
      const item = itensLancamentos.find((registro) => registro.id === itemEditandoId)
      const resposta = item
        ? await atualizarItemLancamento(item, { data_referencia: form.dataHora, quantidade, percentual, valor: 0, descricao: form.descricao || null })
        : await criarItemLancamento(paiResposta.data, { data_referencia: form.dataHora, quantidade, percentual, valor: 0, descricao: form.descricao || null })
      setSalvandoOcorrencia(false)
      if (resposta.error) return setErroLocal(resposta.error.message)
      setItemEditandoId('')
      setForm((atual) => ({ ...criarFormLancamento(atual.categoria), dataHora: '', horas: '' }))
      setMensagem('Hora extra salva e total atualizado.')
      window.setTimeout(() => horaDataInputRef.current?.focus(), 0)
      return
    } else if (categoria === 'falta_injustificada') {
      const item = itensLancamentos.find((registro) => registro.id === itemEditandoId)
      const quantidadeSolicitada = item ? 1 : Number.parseInt(form.quantidadeFaltas, 10)
      const datas = form.datasFaltas.slice(0, quantidadeSolicitada)
      if (!Number.isInteger(quantidadeSolicitada) || quantidadeSolicitada < 1 || datas.length !== quantidadeSolicitada) {
        return setErroLocal('A quantidade de faltas deve corresponder à quantidade de datas.')
      }
      const lancamentoExistente = localizarLancamentoAtivo(lancamentos, funcionarioSelecionadoId, categoria)
      const itensPersistidos = itensAtivosDoLancamento(itensLancamentos, lancamentoExistente?.id)
      const datasPersistidas = itensPersistidos.filter((registro) => registro.id !== itemEditandoId).map((registro) => registro.data_referencia).filter(Boolean)
      const validacao = validarDatasFaltasFolha(item ? [...datasPersistidas, ...datas] : datas, competenciaSelecionada?.competencia)
      if (!validacao.valido) return setErroLocal(validacao.mensagem)

      setSalvandoOcorrencia(true)
      const paiResposta = await obterOuCriarLancamento(categoria, { data_referencia: datas[0] })
      if (paiResposta.error) {
        setSalvandoOcorrencia(false)
        return setErroLocal(paiResposta.error.message)
      }
      let datasFinais = datas
      if (item) {
        const resposta = await atualizarItemLancamento(item, { data_referencia: datas[0], quantidade: 1, valor: 0, descricao: form.descricao || null })
        setSalvandoOcorrencia(false)
        if (resposta.error) return setErroLocal(resposta.error.message)
        datasFinais = itensPersistidos.map((registro) => registro.id === item.id ? datas[0] : registro.data_referencia)
      } else {
        const plano = planejarSincronizacaoFaltasFolha(itensPersistidos, datas)
        for (let indice = 0; indice < plano.criar.length; indice += 1) {
          const resposta = await criarItemLancamento(paiResposta.data, { data_referencia: plano.criar[indice], quantidade: 1, valor: 0, descricao: form.descricao || null })
          if (resposta.error) {
            setSalvandoOcorrencia(false)
            return setErroLocal(resposta.error.message)
          }
        }
        for (const registro of plano.arquivar) {
          const resposta = await arquivarItemLancamento(registro)
          if (resposta.error) {
            setSalvandoOcorrencia(false)
            return setErroLocal(resposta.error.message)
          }
        }
        setSalvandoOcorrencia(false)
      }
      setItemEditandoId('')
      setForm((atual) => ({ ...criarFormLancamento(atual.categoria), quantidadeFaltas: String(datasFinais.length), datasFaltas: datasFinais }))
      setMensagem(`${datas.length} falta(s) salva(s) e total atualizado.`)
      window.setTimeout(() => faltaDataInputRef.current?.focus(), 0)
      return
    } else {
      let valor = parseMoedaEntradaFolha(form.valor)
      let quantidade = null
      let percentual = null
      if (categoria === 'premiacao') {
        const percentualPremiacao = Number(String(form.percentual).replace(',', '.'))
        if (parseMoedaEntradaFolha(form.vendas) <= 0 || !Number.isFinite(percentualPremiacao) || percentualPremiacao <= 0) return setErroLocal('Informe vendas e percentual da premiação.')
        valor = premiacaoCalculada
        quantidade = parseMoedaEntradaFolha(form.vendas)
        percentual = percentualPremiacao
      } else if (naturezaCategoria(categoria) !== 'informativo' && valor <= 0) {
        return setErroLocal('Informe um valor maior que zero.')
      }

      const existente = localizarLancamentoAtivo(lancamentos, funcionarioSelecionadoId, categoria)
      const dados = {
        natureza: naturezaCategoria(categoria),
        categoria,
        descricao: form.descricao || null,
        observacao_administrativa: form.observacao || null,
        valor: naturezaCategoria(categoria) === 'informativo' ? null : valor,
        quantidade,
        percentual
      }
      const resposta = existente
        ? await atualizarLancamento(existente.id, dados)
        : await criarLancamento({ ...dados, competencia_id: competenciaSelecionadaId, funcionario_id: funcionarioSelecionadoId, filial_id: filialDoFuncionario(funcionarioSelecionado) })
      if (resposta.error) return setErroLocal(resposta.error.message)
    }

    setItemEditandoId('')
    setForm((atual) => criarFormLancamento(atual.categoria))
    setMensagem('Lançamento salvo com sucesso.')
  }

  function editarCompra(item) {
    setItemEditandoId(item.id)
    setForm((atual) => ({ ...atual, categoria: 'compras_vales', valor: formatarMoedaEntradaFolha(item.valor), descricao: item.descricao || '' }))
    window.setTimeout(() => compraInputRef.current?.focus(), 0)
  }

  function editarCompraDaColaboradora(funcionarioId, item) {
    selecionarFuncionario(funcionarioId)
    editarCompra(item)
  }

  function editarItemDetalhado(lancamento, item) {
    selecionarFuncionario(lancamento.funcionario_id)
    setItemEditandoId(item.id)
    setForm({
      ...criarFormLancamento(lancamento.categoria),
      categoria: lancamento.categoria,
      descricao: item.descricao || '',
      horas: categoriaFolhaEhHora(lancamento.categoria) ? horasFolhaParaTexto(item.quantidade) : '',
      dataHora: categoriaFolhaEhHora(lancamento.categoria) ? item.data_referencia || '' : '',
      quantidadeFaltas: '1',
      datasFaltas: lancamento.categoria === 'falta_injustificada' ? [item.data_referencia || ''] : ['']
    })
    document.getElementById('folha-lancamento-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function alternarItem(item) {
    limparFeedback()
    const resposta = item.arquivado ? await reativarItemLancamento(item) : await arquivarItemLancamento(item)
    if (resposta.error) return setErroLocal(resposta.error.message)
    setMensagem(item.arquivado ? 'Item reativado.' : 'Item arquivado.')
  }

  async function alternarLancamento(lancamento) {
    limparFeedback()
    const resposta = lancamento.arquivado ? await reativarLancamento(lancamento.id) : await arquivarLancamento(lancamento.id)
    if (resposta.error) return setErroLocal(resposta.error.message)
    setMensagem(lancamento.arquivado ? 'Lançamento reativado.' : 'Lançamento arquivado.')
  }

  async function alternarConferencia(lancamento) {
    limparFeedback()
    const conferido = !lancamento.conferido
    const resposta = await atualizarLancamento(lancamento.id, { conferido, conferido_em: conferido ? new Date().toISOString() : null })
    if (resposta.error) return setErroLocal(resposta.error.message)
    setMensagem(conferido ? 'Lançamento conferido.' : 'Lançamento reaberto para conferência.')
  }

  function carregarLancamentoNoFormulario(lancamento) {
    setForm({
      ...criarFormLancamento(lancamento.categoria),
      categoria: lancamento.categoria,
      valor: lancamento.valor == null ? '' : formatarMoedaEntradaFolha(lancamento.valor),
      descricao: lancamento.descricao || '',
      observacao: lancamento.observacao_administrativa || '',
      vendas: lancamento.categoria === 'premiacao' && lancamento.quantidade != null ? formatarMoedaEntradaFolha(lancamento.quantidade) : '',
      percentual: lancamento.categoria === 'premiacao' ? lancamento.percentual ?? '' : '',
      horas: categoriaFolhaEhHora(lancamento.categoria) ? horasFolhaParaTexto(lancamento.quantidade) : '',
      dataHora: categoriaFolhaEhHora(lancamento.categoria) ? lancamento.data_referencia || '' : '',
      datasFaltas: lancamento.categoria === 'falta_injustificada' ? [lancamento.data_referencia || ''] : ['']
    })
    document.getElementById('folha-lancamento-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function prepararNovoItem(lancamento) {
    selecionarFuncionario(lancamento.funcionario_id)
    setForm(montarFormularioCategoria(lancamento.categoria, lancamento.funcionario_id, true))
    document.getElementById('folha-lancamento-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function editarLancamentoPai(lancamento) {
    selecionarFuncionario(lancamento.funcionario_id)
    carregarLancamentoNoFormulario(lancamento)
  }

  const comprasAtuais = lancamentosFuncionario
    .filter((item) => item.categoria === 'compras_vales' && !item.arquivado)
    .flatMap((lancamento) => {
      const itens = ordenarItensFolha(itensLancamentos.filter((item) => item.lancamento_id === lancamento.id && (mostrarArquivados || !item.arquivado)))
      if (itens.length > 0) return itens
      return numeroFolha(lancamento.valor) > 0 ? [{ id: `legado-${lancamento.id}`, lancamento_id: lancamento.id, valor: lancamento.valor, descricao: lancamento.descricao || 'Compra 1', legado: true }] : []
    })
  const lancamentoCategoriaAtual = localizarLancamentoAtivo(lancamentos, funcionarioSelecionadoId, form.categoria)
  const ocorrenciasAtuais = lancamentoCategoriaAtual
    ? ordenarItensFolha(itensLancamentos.filter((item) => item.lancamento_id === lancamentoCategoriaAtual.id && (mostrarArquivados || !item.arquivado)))
    : []

  return (
    <div className="folha-page">
      <PageHeader
        kicker="Gestão de Pessoas"
        title="Fechamento de Folha"
        description="Lançamento mensal de compras, descontos, premiações, horas e faltas para conferência e contabilidade."
        meta={empresaNome ? `Empresa: ${empresaNome}` : undefined}
        actions={voltarPainel ? <button type="button" className="folha-btn folha-btn-secondary" onClick={voltarPainel}>Voltar ao Painel</button> : null}
      />

      {mensagemErro ? <PageState type="error" title="Não foi possível concluir a operação" description={String(mensagemErro)} actionLabel="Tentar novamente" onAction={tentarNovamente} /> : null}
      {mensagem ? <div className="folha-feedback" role="status">{mensagem}</div> : null}

      <SectionCard title="Competência" description="Selecione o mês de trabalho ou crie uma nova competência.">
        <div className="folha-competencia-layout">
          <label className="folha-field">
            <span>Competência ativa</span>
            <select value={competenciaSelecionadaId} onChange={(event) => setCompetenciaSelecionadaId(event.target.value)} disabled={!empresaId || loadingCompetencias}>
              <option value="">Selecione</option>
              {competencias.map((competencia) => <option key={competencia.id} value={competencia.id}>{competencia.competencia} · {LABELS_STATUS[competencia.status] || competencia.status}{competencia.arquivado ? ' · arquivada' : ''}</option>)}
            </select>
          </label>
          <form className="folha-inline-form" onSubmit={salvarCompetencia}>
            <label className="folha-field"><span>Nova competência</span><input type="month" value={novaCompetencia} onChange={(event) => setNovaCompetencia(event.target.value)} required disabled={!podeEditar || salvando} /></label>
            <button type="submit" className="folha-btn folha-btn-primary" disabled={!podeEditar || salvando || !novaCompetencia}>{salvando ? 'Salvando…' : 'Criar'}</button>
          </form>
          <label className="folha-check"><input type="checkbox" checked={mostrarArquivados} onChange={(event) => setMostrarArquivados(event.target.checked)} /><span>Mostrar arquivados</span></label>
        </div>
        {loadingCompetencias ? <PageState type="loading" title="Carregando competências…" /> : null}
        {competenciaSelecionada ? (
          <div className="folha-competencia-ativa">
            <strong>{competenciaSelecionada.competencia}</strong>
            <span>{LABELS_STATUS[competenciaSelecionada.status] || competenciaSelecionada.status}</span>
            {podeEditar ? <button type="button" className="folha-btn folha-btn-quiet" onClick={() => competenciaSelecionada.arquivado ? reativarCompetencia(competenciaSelecionada.id) : arquivarCompetencia(competenciaSelecionada.id)} disabled={salvando}>{competenciaSelecionada.arquivado ? 'Reativar' : 'Arquivar'}</button> : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Colaboradora e categoria" description="A filial acompanha o cadastro da colaboradora; a troca limpa o formulário anterior.">
        {!competenciaSelecionada ? <PageState title="Selecione uma competência" description="Os lançamentos só ficam disponíveis dentro de uma competência." /> : loadingFuncionarios ? <PageState type="loading" title="Carregando colaboradoras…" /> : funcionariosAtivos.length === 0 ? <PageState title="Nenhuma colaboradora ativa" description="Cadastre ou reative uma colaboradora para lançar a folha." /> : (
          <div className="folha-context-grid">
            <label className="folha-field"><span>Colaboradora</span><select value={funcionarioSelecionadoId} onChange={(event) => selecionarFuncionario(event.target.value)}><option value="">Selecione</option>{funcionariosAtivos.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome}</option>)}</select></label>
            <div className="folha-colaborador-meta"><span>Filial</span><strong>{funcionarioSelecionado ? nomeFilial(filiaisPorId, funcionarioSelecionado.filial_id) : 'Selecione uma colaboradora'}</strong></div>
            <label className="folha-field"><span>Categoria</span><select value={form.categoria} onChange={(event) => { setForm(montarFormularioCategoria(event.target.value)); setItemEditandoId('') }} disabled={!funcionarioSelecionado}>{CATEGORIAS_OPERACIONAIS_FOLHA.map((categoria) => <option key={categoria} value={categoria}>{LABELS_CATEGORIA[categoria]}</option>)}</select></label>
          </div>
        )}
      </SectionCard>

      {funcionarioSelecionado && competenciaSelecionada ? (
        <>
          <SectionCard id="folha-lancamento-form" title="Lançamento" description={LABELS_CATEGORIA[form.categoria] || form.categoria}>
            <form className="folha-lancamento-form" onSubmit={salvarCategoria}>
              {form.categoria === 'compras_vales' ? (
                <div className="folha-compra-rapida">
                  <label className="folha-field"><span>Valor da compra</span><MoedaInputFolha inputRef={compraInputRef} value={form.valor} onChange={(valor) => setForm((atual) => ({ ...atual, valor }))} placeholder="R$ 0,00" disabled={!podeEditar || salvando} required /></label>
                  <label className="folha-field folha-compra-descricao"><span>Descrição curta (opcional)</span><input value={form.descricao} onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))} disabled={!podeEditar || salvando} /></label>
                  <button type="submit" className="folha-btn folha-btn-add" aria-label={itemEditandoId ? 'Salvar compra editada' : 'Adicionar compra'} disabled={!podeEditar || salvando || salvandoCompraRapida}>{salvando || salvandoCompraRapida ? '…' : itemEditandoId ? 'Salvar' : '+'}</button>
                  {itemEditandoId ? <button type="button" className="folha-btn folha-btn-secondary" onClick={() => { setItemEditandoId(''); setForm((atual) => ({ ...atual, valor: '', descricao: '' })) }}>Cancelar</button> : null}
                </div>
              ) : (
                <div className="folha-category-fields">
                   {form.categoria === 'premiacao' ? <><label className="folha-field"><span>Vendas da colaboradora</span><MoedaInputFolha value={form.vendas} onChange={(vendas) => setForm((atual) => ({ ...atual, vendas }))} placeholder="R$ 0,00" disabled={!podeEditar || salvando} required /></label><label className="folha-field"><span>Percentual da premiação</span><input type="text" inputMode="decimal" value={form.percentual} onChange={(event) => setForm((atual) => ({ ...atual, percentual: event.target.value.replace(/[^\d,.-]/g, '') }))} placeholder="0,00" disabled={!podeEditar || salvando} required /></label><label className="folha-field"><span>Premiação calculada</span><input value={formatarMoeda(premiacaoCalculada)} readOnly disabled /></label></> : null}
                   {categoriaFolhaEhHora(form.categoria) ? <div className="folha-ocorrencia-grid"><label className="folha-field"><span>Data</span><input ref={horaDataInputRef} type="date" min={limitesCompetencia?.primeiroDia} max={limitesCompetencia?.ultimoDia} value={form.dataHora} onChange={(event) => setForm((atual) => ({ ...atual, dataHora: event.target.value }))} disabled={!podeEditar || salvando || salvandoOcorrencia} required /></label><label className="folha-field"><span>Horas (HH:MM)</span><input inputMode="numeric" value={form.horas} onChange={alterarHoras} placeholder="00:00" disabled={!podeEditar || salvando || salvandoOcorrencia} required /></label></div> : null}
                   {form.categoria === 'falta_injustificada' ? <div className="folha-faltas-fields"><label className="folha-field"><span>Quantidade de faltas</span><input type="number" inputMode="numeric" min="1" max="31" value={form.quantidadeFaltas} onChange={(event) => alterarQuantidadeFaltas(event.target.value)} disabled={!podeEditar || salvando || salvandoOcorrencia || Boolean(itemEditandoId)} required /><small>Ao reduzir, são preservadas as primeiras datas na ordem em que foram lançadas.</small></label><div className="folha-faltas-datas">{form.datasFaltas.map((data, indice) => <label className="folha-field" key={`falta-${indice}`}><span>Data da falta {indice + 1}</span><input ref={indice === 0 ? faltaDataInputRef : null} type="date" min={limitesCompetencia?.primeiroDia} max={limitesCompetencia?.ultimoDia} value={data} onChange={(event) => setForm((atual) => ({ ...atual, datasFaltas: atual.datasFaltas.map((item, posicao) => posicao === indice ? event.target.value : item) }))} disabled={!podeEditar || salvando || salvandoOcorrencia} required /></label>)}</div></div> : null}
                   {!categoriaFolhaUsaItens(form.categoria) && form.categoria !== 'premiacao' && naturezaCategoria(form.categoria) !== 'informativo' ? <label className="folha-field"><span>Valor</span><MoedaInputFolha value={form.valor} onChange={(valor) => setForm((atual) => ({ ...atual, valor }))} placeholder="R$ 0,00" disabled={!podeEditar || salvando} required /></label> : null}
                   {['outro_credito', 'outro_desconto'].includes(form.categoria) ? <label className="folha-field"><span>Descrição</span><input value={form.descricao} onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))} disabled={!podeEditar || salvando} required /></label> : null}
                   {naturezaCategoria(form.categoria) === 'informativo' || form.categoria === 'plano_saude' || form.categoria === 'premiacao' ? <label className="folha-field folha-field-wide"><span>Observação (opcional)</span><input value={form.observacao} onChange={(event) => setForm((atual) => ({ ...atual, observacao: event.target.value }))} placeholder="Sem dados sensíveis" disabled={!podeEditar || salvando} /></label> : null}
                   <button type="submit" className={categoriaFolhaUsaItens(form.categoria) ? 'folha-btn folha-btn-add' : 'folha-btn folha-btn-primary'} aria-label={itemEditandoId ? 'Salvar ocorrência editada' : 'Adicionar ocorrência'} disabled={!podeEditar || salvando || salvandoOcorrencia}>{salvando || salvandoOcorrencia ? '…' : categoriaFolhaUsaItens(form.categoria) ? (itemEditandoId ? 'Salvar' : '+') : 'Salvar lançamento'}</button>
                </div>
              )}
            </form>

            {form.categoria === 'compras_vales' ? (
              <div className="folha-compras-lista">
                <div className="folha-list-heading"><strong>Compras salvas</strong><span>Total ativo: {formatarMoeda(resumoAtual.compras)}</span></div>
                {comprasAtuais.length === 0 ? <PageState title="Nenhuma compra salva" description="Digite o valor e pressione Enter ou use + para começar." /> : comprasAtuais.map((item, indice) => (
                  <article className={`folha-compra-item ${item.arquivado ? 'is-archived' : ''}`} key={item.id}>
                    <span>Compra {indice + 1}{item.descricao ? ` · ${item.descricao}` : ''}</span><strong>{formatarMoeda(item.valor)}</strong>
                    {!item.legado ? <div className="folha-row-actions"><button type="button" className="folha-btn folha-btn-quiet" onClick={() => editarCompra(item)} disabled={!podeEditar || salvando || item.arquivado}>Editar</button><button type="button" className="folha-btn folha-btn-danger" onClick={() => alternarItem(item)} disabled={!podeEditar || salvando}>{item.arquivado ? 'Reativar' : 'Arquivar'}</button></div> : <small>Valor legado; será preservado ao adicionar a próxima compra.</small>}
                  </article>
                ))}
              </div>
            ) : null}
            {categoriaFolhaEhHora(form.categoria) || form.categoria === 'falta_injustificada' ? (
              <div className="folha-ocorrencias-lista">
                <div className="folha-list-heading">
                  <strong>{categoriaFolhaEhHora(form.categoria) ? 'Horas salvas' : 'Faltas salvas'}</strong>
                  <span>{categoriaFolhaEhHora(form.categoria) ? `Total: ${horasFolhaParaTexto(quantidadeHorasFolha(lancamentoCategoriaAtual, itensLancamentos))}` : `Total: ${quantidadeFaltasFolha(lancamentoCategoriaAtual, itensLancamentos)}`}</span>
                </div>
                {ocorrenciasAtuais.length === 0 ? <PageState title="Nenhuma ocorrência salva" description="Preencha os campos e use + para começar." /> : ocorrenciasAtuais.map((item) => (
                  <article className={`folha-ocorrencia-item ${item.arquivado ? 'is-archived' : ''}`} key={item.id}>
                    <span>{formatarData(item.data_referencia)}{categoriaFolhaEhHora(form.categoria) ? ` · ${horasFolhaParaTexto(item.quantidade)}` : ''}</span>
                    <div className="folha-row-actions"><button type="button" className="folha-btn folha-btn-quiet" onClick={() => editarItemDetalhado(lancamentoCategoriaAtual, item)} disabled={!podeEditar || salvando || item.arquivado}>Editar</button><button type="button" className="folha-btn folha-btn-danger" onClick={() => alternarItem(item)} disabled={!podeEditar || salvando}>{item.arquivado ? 'Reativar' : 'Arquivar'}</button></div>
                  </article>
                ))}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Resumo da colaboradora" description={`${funcionarioSelecionado.nome} · ${nomeFilial(filiaisPorId, funcionarioSelecionado.filial_id)}`}>
            <KpiGrid className="folha-kpis"><KpiCard label="Créditos" value={formatarMoeda(resumoAtual.creditos)} /><KpiCard label="Descontos" value={formatarMoeda(resumoAtual.descontos)} /><KpiCard label="Compras" value={formatarMoeda(resumoAtual.compras)} /><KpiCard label="Horas extras" value={horasFolhaParaTexto(resumoAtual.horas)} /><KpiCard label="Faltas" value={resumoAtual.faltas} /><KpiCard label="Conferidos" value={`${resumoAtual.conferidos}/${resumoAtual.lancamentos}`} /></KpiGrid>
          </SectionCard>
        </>
      ) : null}

      <SectionCard
        title="Conferência e exportação"
        description="O mesmo conjunto ativo alimenta os totais da tela e os dois arquivos Excel."
        actions={<FolhaExportacoes desabilitado={!dadosCompletos || salvando || salvandoCompraRapida || salvandoOcorrencia || lancamentos.length === 0} onExportarCompras={() => exportarControleCompras(parametrosExportacao)} onExportarContabilidade={() => exportarConsolidadoContabil(parametrosExportacao)} />}
      >
        {!competenciaSelecionada ? <PageState title="Sem competência selecionada" /> : loadingLancamentos || loadingItensLancamentos ? <PageState type="loading" title="Carregando lançamentos…" /> : lancamentos.length === 0 ? <PageState title="Nenhum lançamento nesta competência" description="Selecione uma colaboradora e registre a primeira categoria." /> : (
          <div className="folha-colaboradores-lista">
            {funcionariosAtivos.map((funcionario) => {
              const registros = lancamentos.filter((item) => item.funcionario_id === funcionario.id && (mostrarArquivados || !item.arquivado))
              if (!registros.length) return null
              return (
                <article className="folha-colaborador-card" key={funcionario.id}>
                  <header><div><strong>{funcionario.nome}</strong><span>{nomeFilial(filiaisPorId, funcionario.filial_id)}</span></div><button type="button" className="folha-btn folha-btn-secondary" onClick={() => selecionarFuncionario(funcionario.id)}>Lançar / editar</button></header>
                  <div className="folha-lancamentos-lista">
                    {registros.map((lancamento) => {
                      const detalhes = ordenarItensFolha(itensLancamentos.filter((item) => item.lancamento_id === lancamento.id && (mostrarArquivados || !item.arquivado)))
                      return (
                        <div className={`folha-lancamento-row ${lancamento.arquivado ? 'is-archived' : ''}`} key={lancamento.id}>
                          <div><strong>{LABELS_CATEGORIA[lancamento.categoria] || lancamento.categoria}</strong><span>{descricaoLancamento(lancamento, itensLancamentos)}</span></div>
                          <strong className="folha-lancamento-valor">{['falta_injustificada', 'hora_extra_50', 'hora_extra_60', 'hora_extra_100', 'observacao_administrativa'].includes(lancamento.categoria) ? 'Descritivo' : formatarMoeda(resolverValorLancamentoFolha(lancamento, itensLancamentos))}</strong>
                          <div className="folha-row-actions"><button type="button" className="folha-btn folha-btn-quiet" onClick={() => alternarConferencia(lancamento)} disabled={!podeEditar || salvando || lancamento.arquivado}>{lancamento.conferido ? 'Reabrir' : 'Conferir'}</button><button type="button" className="folha-btn folha-btn-quiet" onClick={() => categoriaFolhaUsaItens(lancamento.categoria) ? prepararNovoItem(lancamento) : editarLancamentoPai(lancamento)} disabled={lancamento.arquivado}>{categoriaFolhaUsaItens(lancamento.categoria) ? 'Adicionar' : 'Editar'}</button><button type="button" className="folha-btn folha-btn-danger" onClick={() => alternarLancamento(lancamento)} disabled={!podeEditar || salvando}>{lancamento.arquivado ? 'Reativar' : 'Arquivar'}</button></div>
                          {detalhes.length > 0 ? (
                            <div className="folha-detalhes-lista">
                              {detalhes.map((item, indice) => (
                                <div className={`folha-detalhe-row ${item.arquivado ? 'is-archived' : ''}`} key={item.id}>
                                  <span>{lancamento.categoria === 'compras_vales' ? `Compra ${indice + 1}: ${formatarMoeda(item.valor)}` : categoriaFolhaEhHora(lancamento.categoria) ? `${formatarData(item.data_referencia)} · ${horasFolhaParaTexto(item.quantidade)}` : lancamento.categoria === 'falta_injustificada' ? formatarData(item.data_referencia) : item.descricao || 'Item'}</span>
                                   <div className="folha-row-actions"><button type="button" className="folha-btn folha-btn-quiet" onClick={() => lancamento.categoria === 'compras_vales' ? editarCompraDaColaboradora(funcionario.id, item) : editarItemDetalhado(lancamento, item)} disabled={!podeEditar || salvando || item.arquivado || lancamento.arquivado}>Editar</button><button type="button" className="folha-btn folha-btn-danger" onClick={() => alternarItem(item)} disabled={!podeEditar || salvando || lancamento.arquivado}>{item.arquivado ? 'Reativar' : 'Arquivar'}</button></div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
