import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionariosFerias } from '../hooks/useFuncionariosFerias'
import { mensagemSeguraErro } from '../utils/session'

const FORMULARIO_CICLO_INICIAL = {
  dias_direito: '30',
  status: 'pendente'
}

const FORMULARIO_PERIODO_INICIAL = {
  dataInicio: '',
  quantidadeDias: '',
  status: 'agendada'
}

const FORMULARIO_EDICAO_CICLO_INICIAL = {
  dias_direito: '30',
  status: 'pendente'
}

const STATUS_CICLO_LABELS = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  agendada: 'Agendada',
  concluida: 'Concluída',
  vencida: 'Vencida',
  cancelada: 'Cancelada'
}

const STATUS_PERIODO_LABELS = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

function criarFormularioCicloInicial() {
  return { ...FORMULARIO_CICLO_INICIAL }
}

function criarFormularioPeriodoInicial() {
  return { ...FORMULARIO_PERIODO_INICIAL }
}

function criarFormularioEdicaoCicloInicial() {
  return { ...FORMULARIO_EDICAO_CICLO_INICIAL }
}

function criarDataLocal(data) {
  if (!data) return null
  const texto = String(data).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null

  const dataLocal = new Date(`${texto}T00:00:00`)
  if (Number.isNaN(dataLocal.getTime())) return null
  return dataLocal
}

function formatarDataCurta(data) {
  const dataLocal = criarDataLocal(data)
  if (!dataLocal) return 'Não informada'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dataLocal)
}

function formatarDataISO(dataUTC) {
  return [
    dataUTC.getUTCFullYear(),
    String(dataUTC.getUTCMonth() + 1).padStart(2, '0'),
    String(dataUTC.getUTCDate()).padStart(2, '0')
  ].join('-')
}

function normalizarDataISO(data) {
  const texto = String(data || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return ''

  const [ano, mes, dia] = texto.split('-').map(Number)
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia))

  if (
    Number.isNaN(dataUTC.getTime()) ||
    dataUTC.getUTCFullYear() !== ano ||
    dataUTC.getUTCMonth() !== mes - 1 ||
    dataUTC.getUTCDate() !== dia
  ) {
    return ''
  }

  return texto
}

function somarDiasISO(dataISO, dias) {
  const texto = normalizarDataISO(dataISO)
  if (!texto) return ''

  const [ano, mes, dia] = texto.split('-').map(Number)
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia))
  dataUTC.setUTCDate(dataUTC.getUTCDate() + dias)
  return formatarDataISO(dataUTC)
}

function somarAnosISO(dataISO, anos) {
  const texto = normalizarDataISO(dataISO)
  if (!texto) return ''

  const [ano, mes, dia] = texto.split('-').map(Number)
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia))
  dataUTC.setUTCFullYear(dataUTC.getUTCFullYear() + anos)
  return formatarDataISO(dataUTC)
}

function obterHojeISO() {
  const hoje = new Date()
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')
}

function normalizarTexto(valor) {
  return String(valor || '').trim()
}

function ordenarFuncionarios(lista = []) {
  return [...lista].sort((a, b) => normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR'))
}

function obterPeriodosAtivos(periodos = []) {
  return (periodos || []).filter((periodo) => !periodo.arquivado && periodo.status !== 'cancelada')
}

function formatarStatus(status, labels) {
  return labels[status] || status || 'Não informado'
}

function criarPrevisaoPeriodo({ formularioPeriodo, calcularFimFerias, calcularRetornoTrabalho }) {
  if (!formularioPeriodo.dataInicio || !formularioPeriodo.quantidadeDias) return null

  try {
    return {
      dataFim: calcularFimFerias(formularioPeriodo.dataInicio, Number(formularioPeriodo.quantidadeDias)),
      dataRetorno: calcularRetornoTrabalho(formularioPeriodo.dataInicio, Number(formularioPeriodo.quantidadeDias)),
      erro: null
    }
  } catch (error) {
    return {
      dataFim: null,
      dataRetorno: null,
      erro: mensagemSeguraErro(error, 'Não foi possível calcular as datas.')
    }
  }
}

function calcularNumeroParcelaPrevisto(periodosAtivos = []) {
  const maiorParcela = (periodosAtivos || []).reduce((maior, periodo) => {
    return Math.max(maior, Number(periodo.numero_parcela) || 0)
  }, 0)

  return maiorParcela + 1
}

function calcularDataAtencaoLimite(dataLimiteGozo) {
  return somarDiasISO(dataLimiteGozo, -30)
}

function obterCicloMaisRecente(ciclos = []) {
  return [...(ciclos || [])]
    .filter((ciclo) => normalizarDataISO(ciclo.periodo_aquisitivo_fim))
    .sort((a, b) => String(b.periodo_aquisitivo_fim || '').localeCompare(String(a.periodo_aquisitivo_fim || '')))[0] || null
}

function calcularCicloPorInicio(dataInicio) {
  const inicio = normalizarDataISO(dataInicio)
  if (!inicio) return null

  const fim = somarDiasISO(somarAnosISO(inicio, 1), -1)
  const limite = somarAnosISO(fim, 1)

  if (!fim || !limite) return null

  return {
    periodo_aquisitivo_inicio: inicio,
    periodo_aquisitivo_fim: fim,
    data_limite_gozo: limite
  }
}

function sugerirProximoCicloFerias(funcionario, ciclos = []) {
  const admissao = normalizarDataISO(funcionario?.data_admissao)

  if (!funcionario?.id) {
    return {
      ciclo: null,
      origem: '',
      erro: 'Selecione um funcionário para sugerir o ciclo de férias.'
    }
  }

  if (!admissao) {
    return {
      ciclo: null,
      origem: '',
      erro: 'Informe a data de admissão do funcionário para sugerir o ciclo de férias.'
    }
  }

  const cicloMaisRecente = obterCicloMaisRecente(ciclos)
  const inicio = cicloMaisRecente?.periodo_aquisitivo_fim
    ? somarDiasISO(cicloMaisRecente.periodo_aquisitivo_fim, 1)
    : admissao
  const ciclo = calcularCicloPorInicio(inicio)

  return {
    ciclo,
    origem: cicloMaisRecente
      ? `Sugestão baseada no ciclo mais recente, encerrado em ${formatarDataCurta(cicloMaisRecente.periodo_aquisitivo_fim)}.`
      : 'Sugestão baseada na data de admissão do funcionário.',
    erro: ciclo ? '' : 'Não foi possível calcular o próximo ciclo de férias.'
  }
}

function EmptyState({ titulo, descricao }) {
  return (
    <div className="ferias-empty-state">
      <strong>{titulo}</strong>
      <p>{descricao}</p>
    </div>
  )
}

function SectionHeader({ titulo, descricao, resumo, aberto, onToggle, acao }) {
  return (
    <div className="ferias-section-header">
      <button className="ferias-section-toggle" type="button" onClick={onToggle} aria-expanded={aberto}>
        <span aria-hidden="true">{aberto ? '−' : '+'}</span>
        <span>
          <strong>{titulo}</strong>
          {descricao && <small>{descricao}</small>}
          {!aberto && resumo && <em>{resumo}</em>}
        </span>
      </button>
      {acao}
    </div>
  )
}

function montarFormularioEdicaoPeriodo(periodo) {
  return {
    dataInicio: periodo?.data_inicio || '',
    quantidadeDias: String(periodo?.quantidade_dias || ''),
    status: periodo?.status || 'agendada'
  }
}

function obterStatusVisualPeriodo(periodo) {
  if (!periodo) return 'Não informado'
  if (periodo.arquivado) return 'Arquivada'
  if (periodo.status === 'concluida') return 'Concluída'
  if (periodo.status === 'cancelada') return 'Cancelada'

  const retorno = normalizarDataISO(periodo.data_retorno_trabalho)
  if (periodo.status === 'agendada' && retorno && retorno < obterHojeISO()) {
    return 'Concluída (calculado)'
  }

  return formatarStatus(periodo.status, STATUS_PERIODO_LABELS)
}

function periodoConsomeSaldo(periodo) {
  return periodo && !periodo.arquivado && periodo.status !== 'cancelada'
}

export default function FeriasPage({
  styles,
  empresaId,
  empresaNome,
  mostrarAviso,
  podeEditar = false,
  voltarPainel
}) {
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState('')
  const [cicloSelecionadoId, setCicloSelecionadoId] = useState('')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [formularioCiclo, setFormularioCiclo] = useState(criarFormularioCicloInicial)
  const [formularioPeriodo, setFormularioPeriodo] = useState(criarFormularioPeriodoInicial)
  const [editandoCiclo, setEditandoCiclo] = useState(false)
  const [formularioEdicaoCiclo, setFormularioEdicaoCiclo] = useState(criarFormularioEdicaoCicloInicial)
  const [periodoEditandoId, setPeriodoEditandoId] = useState('')
  const [formularioEdicaoPeriodo, setFormularioEdicaoPeriodo] = useState(criarFormularioPeriodoInicial)
  const [secoesAbertas, setSecoesAbertas] = useState({
    funcionario: true,
    criarCiclo: false,
    ciclos: true,
    resumoCiclo: true,
    novaParcela: false,
    parcelas: true
  })

  const {
    funcionarios,
    loading: loadingFuncionarios,
    erro: erroFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: false
  })

  const funcionariosOrdenados = useMemo(() => ordenarFuncionarios(funcionarios), [funcionarios])
  const funcionarioSelecionado = useMemo(() => {
    return funcionariosOrdenados.find((funcionario) => funcionario.id === funcionarioSelecionadoId) || null
  }, [funcionarioSelecionadoId, funcionariosOrdenados])

  const {
    ciclos,
    periodos,
    loading,
    loadingCiclos,
    loadingPeriodos,
    salvando,
    erro,
    criarCicloFerias,
    atualizarCicloFerias,
    arquivarCicloFerias,
    reativarCicloFerias,
    criarPeriodoFerias,
    atualizarPeriodoFerias,
    arquivarPeriodoFerias,
    reativarPeriodoFerias,
    calcularFimFerias,
    calcularRetornoTrabalho,
    calcularSaldoDiasFerias,
    calcularStatusCicloFerias,
    limparErro
  } = useFuncionariosFerias({
    empresaId,
    funcionarioId: funcionarioSelecionadoId,
    cicloId: cicloSelecionadoId,
    incluirArquivados: true,
    autoCarregarCiclos: Boolean(funcionarioSelecionadoId),
    autoCarregarPeriodos: Boolean(cicloSelecionadoId)
  })

  const ciclosVisiveis = useMemo(() => {
    return incluirArquivados ? ciclos : (ciclos || []).filter((ciclo) => !ciclo.arquivado)
  }, [ciclos, incluirArquivados])

  const periodosVisiveis = useMemo(() => {
    return incluirArquivados ? periodos : (periodos || []).filter((periodo) => !periodo.arquivado)
  }, [incluirArquivados, periodos])

  const cicloSelecionado = useMemo(() => {
    return (ciclos || []).find((ciclo) => ciclo.id === cicloSelecionadoId) || null
  }, [cicloSelecionadoId, ciclos])

  const periodosAtivos = useMemo(() => obterPeriodosAtivos(periodos), [periodos])

  const sugestaoCiclo = useMemo(() => {
    return sugerirProximoCicloFerias(funcionarioSelecionado, ciclos)
  }, [ciclos, funcionarioSelecionado])

  const cicloDuplicadoSugerido = useMemo(() => {
    const cicloSugerido = sugestaoCiclo.ciclo
    if (!cicloSugerido) return false

    return (ciclos || []).some((ciclo) => (
      ciclo.periodo_aquisitivo_inicio === cicloSugerido.periodo_aquisitivo_inicio &&
      ciclo.periodo_aquisitivo_fim === cicloSugerido.periodo_aquisitivo_fim
    ))
  }, [ciclos, sugestaoCiclo.ciclo])

  const saldoSelecionado = useMemo(() => {
    if (!cicloSelecionado) return null

    try {
      return calcularSaldoDiasFerias({
        diasDireito: cicloSelecionado.dias_direito || 30,
        periodosAtivos
      })
    } catch {
      return null
    }
  }, [calcularSaldoDiasFerias, cicloSelecionado, periodosAtivos])

  const statusCalculadoSelecionado = useMemo(() => {
    if (!cicloSelecionado) return ''

    try {
      return calcularStatusCicloFerias({
        diasDireito: cicloSelecionado.dias_direito || 30,
        periodosAtivos,
        dataLimiteGozo: cicloSelecionado.data_limite_gozo
      })
    } catch {
      return ''
    }
  }, [calcularStatusCicloFerias, cicloSelecionado, periodosAtivos])

  const numeroParcelaPrevisto = useMemo(() => calcularNumeroParcelaPrevisto(periodosAtivos), [periodosAtivos])
  const limiteParcelasAtingido = numeroParcelaPrevisto > 3
  const semSaldoDisponivel = saldoSelecionado !== null && saldoSelecionado <= 0
  const diasLancados = useMemo(() => {
    return periodosAtivos.reduce((total, periodo) => total + Number(periodo.quantidade_dias || 0), 0)
  }, [periodosAtivos])
  const quantidadePeriodo = Number(formularioPeriodo.quantidadeDias || 0)
  const quantidadeMaiorQueSaldo = Boolean(quantidadePeriodo && saldoSelecionado !== null && quantidadePeriodo > saldoSelecionado)
  const saldoAposLancamento = quantidadePeriodo && saldoSelecionado !== null
    ? Math.max(saldoSelecionado - quantidadePeriodo, 0)
    : saldoSelecionado
  const proximaParcelaTexto = semSaldoDisponivel
    ? 'Ciclo concluído'
    : limiteParcelasAtingido
      ? 'Limite atingido'
      : numeroParcelaPrevisto
  const dataAtencaoCicloSelecionado = calcularDataAtencaoLimite(cicloSelecionado?.data_limite_gozo)
  const resumoFuncionario = funcionarioSelecionado
    ? `${funcionarioSelecionado.nome || 'Funcionário selecionado'}${funcionarioSelecionado.cargo ? ` · ${funcionarioSelecionado.cargo}` : ''}`
    : 'Nenhum funcionário selecionado'
  const resumoCicloSelecionado = cicloSelecionado
    ? `${formatarDataCurta(cicloSelecionado.periodo_aquisitivo_inicio)} a ${formatarDataCurta(cicloSelecionado.periodo_aquisitivo_fim)}`
    : 'Nenhum ciclo selecionado'
  const novaParcelaBloqueada = semSaldoDisponivel || limiteParcelasAtingido
  const textoBotaoNovaParcela = semSaldoDisponivel
    ? 'Sem saldo disponível'
    : limiteParcelasAtingido
      ? 'Limite de parcelas atingido'
      : salvando
        ? 'Salvando...'
        : 'Adicionar parcela'

  const previsaoPeriodo = useMemo(() => criarPrevisaoPeriodo({
    formularioPeriodo,
    calcularFimFerias,
    calcularRetornoTrabalho
  }), [calcularFimFerias, calcularRetornoTrabalho, formularioPeriodo])

  useEffect(() => {
    setFuncionarioSelecionadoId('')
    setCicloSelecionadoId('')
    setIncluirArquivados(false)
    setFormularioCiclo(criarFormularioCicloInicial())
    setFormularioPeriodo(criarFormularioPeriodoInicial())
    setEditandoCiclo(false)
    setFormularioEdicaoCiclo(criarFormularioEdicaoCicloInicial())
    setPeriodoEditandoId('')
    setFormularioEdicaoPeriodo(criarFormularioPeriodoInicial())
    setSecoesAbertas({
      funcionario: true,
      criarCiclo: false,
      ciclos: true,
      resumoCiclo: true,
      novaParcela: false,
      parcelas: true
    })
    limparErro?.()
  }, [empresaId])

  useEffect(() => {
    if (!funcionarioSelecionadoId) {
      setCicloSelecionadoId('')
      return
    }

    if (cicloSelecionadoId && ciclosVisiveis.some((ciclo) => ciclo.id === cicloSelecionadoId)) return
    setCicloSelecionadoId(ciclosVisiveis[0]?.id || '')
  }, [cicloSelecionadoId, ciclosVisiveis, funcionarioSelecionadoId])

  useEffect(() => {
    setFormularioPeriodo(criarFormularioPeriodoInicial())
    setEditandoCiclo(false)
    setFormularioEdicaoCiclo(criarFormularioEdicaoCicloInicial())
    setPeriodoEditandoId('')
    setFormularioEdicaoPeriodo(criarFormularioPeriodoInicial())
  }, [cicloSelecionadoId])

  useEffect(() => {
    setSecoesAbertas((atual) => ({
      ...atual,
      criarCiclo: Boolean(funcionarioSelecionadoId) && ciclosVisiveis.length === 0,
      novaParcela: Boolean(cicloSelecionadoId) && !novaParcelaBloqueada
    }))
  }, [cicloSelecionadoId, ciclosVisiveis.length, funcionarioSelecionadoId, novaParcelaBloqueada])

  function alternarSecao(secao) {
    setSecoesAbertas((atual) => ({
      ...atual,
      [secao]: !atual[secao]
    }))
  }

  function atualizarFormularioCiclo(campo, valor) {
    setFormularioCiclo((atual) => ({
      ...atual,
      [campo]: valor
    }))
  }

  function atualizarFormularioPeriodo(campo, valor) {
    setFormularioPeriodo((atual) => ({
      ...atual,
      [campo]: campo === 'quantidadeDias' ? String(valor).replace(/\D/g, '') : valor
    }))
  }

  function atualizarFormularioEdicaoCiclo(campo, valor) {
    setFormularioEdicaoCiclo((atual) => ({
      ...atual,
      [campo]: campo === 'dias_direito' ? String(valor).replace(/\D/g, '') : valor
    }))
  }

  function atualizarFormularioEdicaoPeriodo(campo, valor) {
    setFormularioEdicaoPeriodo((atual) => ({
      ...atual,
      [campo]: campo === 'quantidadeDias' ? String(valor).replace(/\D/g, '') : valor
    }))
  }

  function selecionarFuncionario(valor) {
    setFuncionarioSelecionadoId(valor)
    setCicloSelecionadoId('')
    setFormularioPeriodo(criarFormularioPeriodoInicial())
    setEditandoCiclo(false)
    setPeriodoEditandoId('')
    setFormularioEdicaoPeriodo(criarFormularioPeriodoInicial())
    setSecoesAbertas((atual) => ({
      ...atual,
      funcionario: true,
      criarCiclo: false,
      ciclos: true,
      resumoCiclo: true,
      novaParcela: false,
      parcelas: true
    }))
    limparErro?.()
  }

  function iniciarEdicaoCiclo() {
    if (!cicloSelecionado || !podeEditar) return
    setEditandoCiclo(true)
    setFormularioEdicaoCiclo({
      dias_direito: String(cicloSelecionado.dias_direito || 30),
      status: cicloSelecionado.status || 'pendente'
    })
  }

  function cancelarEdicaoCiclo() {
    setEditandoCiclo(false)
    setFormularioEdicaoCiclo(criarFormularioEdicaoCicloInicial())
  }

  function iniciarEdicaoPeriodo(periodo) {
    if (!periodo?.id || !podeEditar || periodo.arquivado) return
    setPeriodoEditandoId(periodo.id)
    setFormularioEdicaoPeriodo(montarFormularioEdicaoPeriodo(periodo))
  }

  function cancelarEdicaoPeriodo() {
    setPeriodoEditandoId('')
    setFormularioEdicaoPeriodo(criarFormularioPeriodoInicial())
  }

  async function salvarCiclo(event) {
    event.preventDefault()
    if (!empresaId || !funcionarioSelecionadoId || !podeEditar || salvando) return

    if (loadingCiclos) {
      mostrarAviso?.('Aguarde o carregamento do histórico de ciclos antes de criar um novo ciclo.', 'erro')
      return
    }

    if (sugestaoCiclo.erro || !sugestaoCiclo.ciclo) {
      mostrarAviso?.(sugestaoCiclo.erro || 'Não foi possível sugerir o ciclo de férias.', 'erro')
      return
    }

    if (cicloDuplicadoSugerido) {
      mostrarAviso?.('Já existe um ciclo com o mesmo período aquisitivo para este funcionário.', 'erro')
      return
    }

    const resposta = await criarCicloFerias({
      ...sugestaoCiclo.ciclo,
      dias_direito: formularioCiclo.dias_direito,
      status: formularioCiclo.status
    }, {
      funcionarioId: funcionarioSelecionadoId
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o ciclo de férias.'), 'erro')
      return
    }

    setFormularioCiclo((atual) => ({
      ...criarFormularioCicloInicial(),
      dias_direito: atual.dias_direito || '30'
    }))
    if (resposta?.data?.id) setCicloSelecionadoId(resposta.data.id)
    mostrarAviso?.('Ciclo de férias criado.', 'sucesso')
  }

  async function salvarPeriodo(event) {
    event.preventDefault()
    if (!empresaId || !funcionarioSelecionadoId || !cicloSelecionadoId || !podeEditar || salvando) return

    if (!formularioPeriodo.dataInicio || !formularioPeriodo.quantidadeDias) {
      mostrarAviso?.('Informe a data de início e a quantidade de dias.', 'erro')
      return
    }

    if (limiteParcelasAtingido) {
      mostrarAviso?.('O limite planejado de 3 parcelas para este ciclo foi atingido.', 'erro')
      return
    }

    if (quantidadeMaiorQueSaldo) {
      mostrarAviso?.('A quantidade de dias informada é maior que o saldo disponível do ciclo.', 'erro')
      return
    }

    const resposta = await criarPeriodoFerias({
      cicloId: cicloSelecionadoId,
      funcionarioId: funcionarioSelecionadoId,
      dataInicio: formularioPeriodo.dataInicio,
      quantidadeDias: Number(formularioPeriodo.quantidadeDias),
      status: formularioPeriodo.status
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o período de férias.'), 'erro')
      return
    }

    setFormularioPeriodo(criarFormularioPeriodoInicial())
    mostrarAviso?.('Período de férias registrado.', 'sucesso')
  }

  async function salvarEdicaoCiclo(event) {
    event.preventDefault()
    if (!empresaId || !funcionarioSelecionadoId || !cicloSelecionado?.id || !podeEditar || salvando) return

    const diasDireito = Number(formularioEdicaoCiclo.dias_direito || 0)

    if (!Number.isInteger(diasDireito) || diasDireito <= 0) {
      mostrarAviso?.('Dias de direito deve ser maior que zero.', 'erro')
      return
    }

    if (diasDireito < diasLancados) {
      mostrarAviso?.('Dias de direito não pode ser menor que os dias já lançados no ciclo.', 'erro')
      return
    }

    const resposta = await atualizarCicloFerias(cicloSelecionado.id, {
      dias_direito: diasDireito,
      status: formularioEdicaoCiclo.status
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o ciclo de férias.'), 'erro')
      return
    }

    cancelarEdicaoCiclo()
    mostrarAviso?.('Ciclo de férias atualizado.', 'sucesso')
  }

  async function salvarEdicaoPeriodo(periodo) {
    if (!periodo?.id || !empresaId || !funcionarioSelecionadoId || !cicloSelecionadoId || !podeEditar || salvando) return

    const quantidadeDias = Number(formularioEdicaoPeriodo.quantidadeDias || 0)

    if (!formularioEdicaoPeriodo.dataInicio || !Number.isInteger(quantidadeDias) || quantidadeDias <= 0) {
      mostrarAviso?.('Informe a data de início e uma quantidade de dias positiva.', 'erro')
      return
    }

    const diasAtuais = periodoConsomeSaldo(periodo) ? Number(periodo.quantidade_dias || 0) : 0
    const saldoDisponivelParaEdicao = (saldoSelecionado ?? 0) + diasAtuais

    if (formularioEdicaoPeriodo.status !== 'cancelada' && quantidadeDias > saldoDisponivelParaEdicao) {
      mostrarAviso?.('A quantidade de dias informada é maior que o saldo disponível para esta edição.', 'erro')
      return
    }

    const resposta = await atualizarPeriodoFerias(periodo.id, {
      dataInicio: formularioEdicaoPeriodo.dataInicio,
      quantidadeDias,
      status: formularioEdicaoPeriodo.status
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o período de férias.'), 'erro')
      return
    }

    cancelarEdicaoPeriodo()
    mostrarAviso?.('Período de férias atualizado.', 'sucesso')
  }

  async function alternarArquivamentoCiclo(ciclo) {
    if (!ciclo?.id || !empresaId || !podeEditar || salvando) return

    const resposta = ciclo.arquivado
      ? await reativarCicloFerias(ciclo.id)
      : await arquivarCicloFerias(ciclo.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o ciclo de férias.'), 'erro')
      return
    }

    if (cicloSelecionado?.id === ciclo.id) cancelarEdicaoCiclo()
    mostrarAviso?.(ciclo.arquivado ? 'Ciclo reativado.' : 'Ciclo arquivado.', 'sucesso')
  }

  async function alternarArquivamentoPeriodo(periodo) {
    if (!periodo?.id || !empresaId || !podeEditar || salvando) return

    const resposta = periodo.arquivado
      ? await reativarPeriodoFerias(periodo.id)
      : await arquivarPeriodoFerias(periodo.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o período de férias.'), 'erro')
      return
    }

    if (periodoEditandoId === periodo.id) cancelarEdicaoPeriodo()
    mostrarAviso?.(periodo.arquivado ? 'Período reativado.' : 'Período arquivado.', 'sucesso')
  }

  return (
    <div className="ferias-page">
      <style>{`
        .ferias-page { display: grid; gap: 18px; }
        .ferias-page-grid {
          display: grid;
          grid-template-columns: minmax(220px, .68fr) minmax(0, 1.55fr);
          gap: 16px;
          align-items: start;
        }
        .ferias-main-column {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .ferias-card {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 16px;
          background: #ffffff;
          padding: 14px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          min-width: 0;
        }
        .ferias-card.is-compact {
          padding: 12px;
        }
        .ferias-card h2,
        .ferias-card h3 {
          margin: 0 0 6px;
          color: #0f172a;
        }
        .ferias-section-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .ferias-section-toggle {
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          display: inline-flex;
          align-items: flex-start;
          gap: 10px;
          color: #0f172a;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }
        .ferias-section-toggle > span:first-child {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #f1f5f9;
          color: #0f766e;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
          flex: 0 0 auto;
        }
        .ferias-section-toggle strong {
          display: block;
          color: #0f172a;
          font-size: 16px;
          line-height: 1.2;
        }
        .ferias-section-toggle small,
        .ferias-section-toggle em {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          line-height: 1.35;
          margin-top: 3px;
        }
        .ferias-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }
        .ferias-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .ferias-form-grid label,
        .ferias-form-row label {
          display: grid;
          gap: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 900;
        }
        .ferias-form-grid .span-2 { grid-column: 1 / -1; }
        .ferias-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .ferias-form-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
          margin-top: 14px;
        }
        .ferias-cycle-list,
        .ferias-period-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }
        .ferias-cycle-card,
        .ferias-period-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 16px;
          background: #f8fafc;
          padding: 12px;
        }
        .ferias-cycle-card.selected {
          border-color: rgba(13, 148, 136, .44);
          background: #f0fdfa;
        }
        .ferias-cycle-card.archived,
        .ferias-period-card.archived {
          opacity: .78;
          background: #f1f5f9;
        }
        .ferias-cycle-main,
        .ferias-period-main {
          display: grid;
          gap: 5px;
          min-width: 0;
        }
        .ferias-cycle-main strong,
        .ferias-period-main strong {
          color: #0f172a;
          font-size: 14px;
        }
        .ferias-cycle-main small,
        .ferias-period-main small {
          color: #64748b;
          line-height: 1.35;
        }
        .ferias-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ferias-selected-pill {
          width: fit-content;
          border-radius: 999px;
          padding: 6px 9px;
          background: #ccfbf1;
          color: #115e59;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .ferias-actions button,
        .ferias-form-actions button {
          min-height: 34px !important;
          padding: 8px 11px !important;
          margin: 0 !important;
        }
        .ferias-status {
          width: fit-content;
          border-radius: 999px;
          padding: 4px 8px;
          background: #ecfdf5;
          color: #0f766e;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .ferias-status.archived {
          background: #fee2e2;
          color: #b91c1c;
        }
        .ferias-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .ferias-summary-box {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 15px;
          background: #f8fafc;
          padding: 12px;
          display: grid;
          gap: 4px;
        }
        .ferias-summary-box span {
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .ferias-summary-box strong {
          color: #0f172a;
          font-size: 18px;
        }
        .ferias-empty-state {
          border: 1px dashed rgba(15, 23, 42, .16);
          border-radius: 16px;
          background: #f8fafc;
          padding: 14px;
          color: #64748b;
          margin-top: 12px;
        }
        .ferias-empty-state strong {
          display: block;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ferias-switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }
        .ferias-preview {
          border: 1px solid rgba(13, 148, 136, .18);
          border-radius: 16px;
          background: #f0fdfa;
          color: #115e59;
          padding: 12px;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 12px;
        }
        .ferias-warning {
          border: 1px solid rgba(245, 158, 11, .26);
          border-radius: 16px;
          background: #fffbeb;
          color: #92400e;
          padding: 12px;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 12px;
        }
        .ferias-calculated-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .ferias-calculated-field {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 15px;
          background: #f8fafc;
          padding: 12px;
          display: grid;
          gap: 4px;
        }
        .ferias-calculated-field span {
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .ferias-calculated-field strong {
          color: #0f172a;
          font-size: 15px;
        }
        @media (max-width: 980px) {
          .ferias-page-grid,
          .ferias-main-column,
          .ferias-form-grid,
          .ferias-summary-grid,
          .ferias-calculated-grid,
          .ferias-cycle-card,
          .ferias-period-card {
            grid-template-columns: 1fr;
          }
          .ferias-actions,
          .ferias-form-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Férias</h1>
          <p style={styles.textoNota}>Controle inicial de ciclos e parcelas por colaborador, usando sempre a empresa ativa.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>Voltar ao painel</button>
      </div>

      {!empresaId ? (
        <section style={styles.cardConfiguracao}>
          <EmptyState
            titulo="Empresa ativa necessaria"
            descricao="Selecione uma empresa para carregar funcionários e férias."
          />
        </section>
      ) : (
        <div className="ferias-page-grid">
          <section className="ferias-card is-compact">
            <SectionHeader
              titulo="Funcionário"
              descricao="Colaborador da empresa ativa."
              resumo={resumoFuncionario}
              aberto={secoesAbertas.funcionario}
              onToggle={() => alternarSecao('funcionario')}
            />

            {secoesAbertas.funcionario && (
              <>
                <p style={{ marginTop: 10 }}>CPF e observações não aparecem nesta tela.</p>

                {loadingFuncionarios ? (
                  <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando funcionários...</p>
                ) : erroFuncionarios ? (
                  <EmptyState titulo="Não foi possível carregar" descricao={erroFuncionarios} />
                ) : (
                  <>
                    <div className="ferias-form-row">
                      <label>
                        Colaborador
                        <select
                          style={styles.input}
                          value={funcionarioSelecionadoId}
                          onChange={(event) => selecionarFuncionario(event.target.value)}
                        >
                          <option value="">Selecione um funcionário</option>
                          {funcionariosOrdenados.map((funcionario) => (
                            <option key={funcionario.id} value={funcionario.id}>
                              {funcionario.nome || 'Funcionário sem nome'}{funcionario.cargo ? ` - ${funcionario.cargo}` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {funcionariosOrdenados.length === 0 && (
                      <EmptyState
                        titulo="Nenhum funcionário ativo"
                        descricao="Cadastre um funcionário antes de registrar ciclos de férias."
                      />
                    )}
                  </>
                )}

                {funcionarioSelecionado && (
                  <div className="ferias-preview">
                    <strong>{funcionarioSelecionado.nome || 'Funcionário selecionado'}</strong>
                    <br />
                    <span>{funcionarioSelecionado.cargo || 'Cargo não informado'}</span>
                    <br />
                    <span>Admissão: {formatarDataCurta(funcionarioSelecionado.data_admissao)}</span>
                  </div>
                )}

                <div className="ferias-warning">
                  Esta tela registra apenas dados trabalhistas estruturados de férias. Não há documentos, anexos,
                  exportação ou integração financeira neste ciclo.
                </div>
              </>
            )}
          </section>

          <div className="ferias-main-column">
          <section className="ferias-card">
            <SectionHeader
              titulo="Criar novo ciclo"
              descricao="O sistema sugere o período aquisitivo e o limite de gozo."
              resumo={sugestaoCiclo.erro || sugestaoCiclo.origem || 'Aguardando funcionário'}
              aberto={secoesAbertas.criarCiclo}
              onToggle={() => alternarSecao('criarCiclo')}
            />

            {!funcionarioSelecionadoId ? (
              <EmptyState
                titulo="Selecione um funcionário"
                descricao="Os ciclos de férias aparecem depois da seleção do colaborador."
              />
            ) : (
              <>
                {secoesAbertas.criarCiclo && (
                <form onSubmit={salvarCiclo}>
                  {sugestaoCiclo.erro ? (
                    <div className="ferias-warning">
                      {sugestaoCiclo.erro}
                    </div>
                  ) : (
                    <>
                      <div className="ferias-calculated-grid">
                        <div className="ferias-calculated-field">
                          <span>Início calculado</span>
                          <strong>{formatarDataCurta(sugestaoCiclo.ciclo?.periodo_aquisitivo_inicio)}</strong>
                        </div>
                        <div className="ferias-calculated-field">
                          <span>Fim calculado</span>
                          <strong>{formatarDataCurta(sugestaoCiclo.ciclo?.periodo_aquisitivo_fim)}</strong>
                        </div>
                        <div className="ferias-calculated-field">
                          <span>Limite de gozo</span>
                          <strong>{formatarDataCurta(sugestaoCiclo.ciclo?.data_limite_gozo)}</strong>
                        </div>
                        <div className="ferias-calculated-field">
                          <span>Atenção a partir de</span>
                          <strong>{formatarDataCurta(calcularDataAtencaoLimite(sugestaoCiclo.ciclo?.data_limite_gozo))}</strong>
                        </div>
                      </div>

                      <div className="ferias-preview">
                        <strong>Ciclo sugerido automaticamente.</strong>
                        <br />
                        <span>{sugestaoCiclo.origem}</span>
                        <br />
                        <span>A data limite de gozo é calculada pelo sistema e não fica editável no fluxo normal.</span>
                        <br />
                        <span>A data de atenção é um prazo operacional interno calculado 30 dias antes do limite de gozo.</span>
                      </div>

                      {cicloDuplicadoSugerido && (
                        <div className="ferias-warning">
                          Já existe um ciclo com o mesmo período aquisitivo para este funcionário.
                        </div>
                      )}
                    </>
                  )}

                  <div className="ferias-form-grid">
                    <label>
                      Dias de direito
                      <input
                        style={styles.input}
                        type="number"
                        min="1"
                        max="30"
                        value={formularioCiclo.dias_direito}
                        onChange={(event) => atualizarFormularioCiclo('dias_direito', event.target.value)}
                        required
                      />
                    </label>
                    <label className="span-2">
                      Status inicial
                      <select
                        style={styles.input}
                        value={formularioCiclo.status}
                        onChange={(event) => atualizarFormularioCiclo('status', event.target.value)}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="agendada">Agendada</option>
                        <option value="parcial">Parcial</option>
                        <option value="concluida">Concluída</option>
                        <option value="vencida">Vencida</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </label>
                  </div>
                  <div className="ferias-form-actions">
                    <button
                      style={styles.btnSalvar}
                      type="submit"
                      disabled={
                        !podeEditar ||
                        salvando ||
                        loadingCiclos ||
                        !funcionarioSelecionadoId ||
                        Boolean(sugestaoCiclo.erro) ||
                        !sugestaoCiclo.ciclo ||
                        cicloDuplicadoSugerido
                      }
                    >
                      {salvando ? 'Salvando...' : 'Criar ciclo'}
                    </button>
                  </div>
                </form>
                )}

                <SectionHeader
                  titulo="Ciclos de férias"
                  descricao="Histórico de períodos aquisitivos do funcionário selecionado."
                  resumo={`${ciclosVisiveis.length} ciclo(s) visível(is)`}
                  aberto={secoesAbertas.ciclos}
                  onToggle={() => alternarSecao('ciclos')}
                  acao={(
                    <label className="ferias-switch">
                      <input
                        type="checkbox"
                        checked={incluirArquivados}
                        onChange={(event) => setIncluirArquivados(event.target.checked)}
                        disabled={!funcionarioSelecionadoId || loading}
                      />
                      Mostrar arquivados
                    </label>
                  )}
                />

                {secoesAbertas.ciclos && (
                  <>
                {loadingCiclos ? (
                  <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando ciclos...</p>
                ) : erro ? (
                  <EmptyState titulo="Não foi possível carregar férias" descricao={erro} />
                ) : ciclosVisiveis.length === 0 ? (
                  <EmptyState
                    titulo={ciclos.length > 0 ? 'Nenhum ciclo visível' : 'Nenhum ciclo cadastrado'}
                    descricao={ciclos.length > 0 ? 'Ative Mostrar arquivados para ver ciclos arquivados.' : 'Crie o primeiro ciclo de férias para este funcionário.'}
                  />
                ) : (
                  <div className="ferias-cycle-list">
                    {ciclosVisiveis.map((ciclo) => {
                      const selecionado = ciclo.id === cicloSelecionadoId
                      const status = ciclo.arquivado ? 'Arquivado' : formatarStatus(ciclo.status, STATUS_CICLO_LABELS)

                      return (
                        <article
                          key={ciclo.id}
                          className={`ferias-cycle-card ${selecionado ? 'selected' : ''} ${ciclo.arquivado ? 'archived' : ''}`}
                        >
                          <div className="ferias-cycle-main">
                            <strong>{formatarDataCurta(ciclo.periodo_aquisitivo_inicio)} a {formatarDataCurta(ciclo.periodo_aquisitivo_fim)}</strong>
                            <small>Limite de gozo: {formatarDataCurta(ciclo.data_limite_gozo)}</small>
                            <small>Atenção a partir de: {formatarDataCurta(calcularDataAtencaoLimite(ciclo.data_limite_gozo))}</small>
                            <small>Dias de direito: {ciclo.dias_direito || 30}</small>
                            <span className={`ferias-status ${ciclo.arquivado ? 'archived' : ''}`}>{status}</span>
                          </div>
                          <div className="ferias-actions">
                            {selecionado ? (
                              <span className="ferias-selected-pill">Selecionado</span>
                            ) : (
                              <button
                                style={styles.btnCinza}
                                type="button"
                                disabled={loading || salvando}
                                onClick={() => setCicloSelecionadoId(ciclo.id)}
                              >
                                Selecionar
                              </button>
                            )}
                            {podeEditar && (
                              <button
                                style={ciclo.arquivado ? styles.btnSalvar : styles.btnCinza}
                                type="button"
                                disabled={salvando}
                                onClick={() => alternarArquivamentoCiclo(ciclo)}
                              >
                                {ciclo.arquivado ? 'Reativar' : 'Arquivar'}
                              </button>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </section>
          </div>
        </div>
      )}

      {empresaId && funcionarioSelecionadoId && cicloSelecionado && (
        <section className="ferias-card">
          <SectionHeader
            titulo="Resumo do ciclo selecionado"
            descricao="Datas, saldo e situação calculada do ciclo."
            resumo={resumoCicloSelecionado}
            aberto={secoesAbertas.resumoCiclo}
            onToggle={() => alternarSecao('resumoCiclo')}
            acao={podeEditar && !editandoCiclo ? (
              <button
                style={styles.btnCinza}
                type="button"
                disabled={salvando || cicloSelecionado.arquivado}
                onClick={iniciarEdicaoCiclo}
              >
                Editar ciclo
              </button>
            ) : null}
          />

          {secoesAbertas.resumoCiclo && (
            <>
          <div className="ferias-summary-grid">
            <div className="ferias-summary-box">
              <span>Limite de gozo</span>
              <strong>{formatarDataCurta(cicloSelecionado.data_limite_gozo)}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Atenção a partir de</span>
              <strong>{formatarDataCurta(dataAtencaoCicloSelecionado)}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Dias de direito</span>
              <strong>{cicloSelecionado.dias_direito || 30}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Dias já lançados</span>
              <strong>{diasLancados}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Saldo restante</span>
              <strong>{saldoSelecionado ?? 'N/I'}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Saldo após lançamento</span>
              <strong>{quantidadePeriodo ? saldoAposLancamento : 'N/I'}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Status calculado</span>
              <strong>{formatarStatus(statusCalculadoSelecionado, STATUS_CICLO_LABELS)}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Próxima ação</span>
              <strong>{proximaParcelaTexto}</strong>
            </div>
          </div>

          <div className="ferias-preview">
            A data de atenção é um prazo operacional interno calculado 30 dias antes do limite de gozo.
            Ela não substitui o limite de gozo e não gera automação.
          </div>

          {editandoCiclo && (
            <form onSubmit={salvarEdicaoCiclo}>
              <div className="ferias-form-grid">
                <label>
                  Dias de direito
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    max="30"
                    value={formularioEdicaoCiclo.dias_direito}
                    onChange={(event) => atualizarFormularioEdicaoCiclo('dias_direito', event.target.value)}
                    required
                  />
                </label>
                <label className="span-2">
                  Status
                  <select
                    style={styles.input}
                    value={formularioEdicaoCiclo.status}
                    onChange={(event) => atualizarFormularioEdicaoCiclo('status', event.target.value)}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="agendada">Agendada</option>
                    <option value="parcial">Parcial</option>
                    <option value="concluida">Concluída</option>
                    <option value="vencida">Vencida</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </label>
              </div>

              {Number(formularioEdicaoCiclo.dias_direito || 0) < diasLancados && (
                <div className="ferias-warning">
                  Dias de direito não pode ser menor que os dias já lançados neste ciclo.
                </div>
              )}

              <div className="ferias-form-actions">
                <button
                  style={styles.btnSalvar}
                  type="submit"
                  disabled={salvando || Number(formularioEdicaoCiclo.dias_direito || 0) < diasLancados}
                >
                  {salvando ? 'Salvando...' : 'Salvar ciclo'}
                </button>
                <button
                  style={styles.btnCinza}
                  type="button"
                  disabled={salvando}
                  onClick={cancelarEdicaoCiclo}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="ferias-warning">
            Não existe seleção manual de férias integral ou parcelada. A situação e o saldo são calculados pela soma
            das parcelas ativas deste ciclo.
          </div>
            </>
          )}

          <SectionHeader
            titulo="Nova parcela"
            descricao="Informe início e quantidade de dias; fim e retorno são calculados."
            resumo={novaParcelaBloqueada ? proximaParcelaTexto : 'Pronta para lançamento'}
            aberto={secoesAbertas.novaParcela}
            onToggle={() => alternarSecao('novaParcela')}
          />

          {secoesAbertas.novaParcela && (
            <>
          {novaParcelaBloqueada ? (
            <div className="ferias-warning">
              {semSaldoDisponivel
                ? 'O saldo calculado deste ciclo está zerado. Não há dias disponíveis para nova parcela.'
                : 'O limite planejado de 3 parcelas ativas foi atingido para este ciclo.'}
            </div>
          ) : (
          <form onSubmit={salvarPeriodo}>
            <div className="ferias-form-grid">
              <label>
                Data de início
                <input
                  style={styles.input}
                  type="date"
                  value={formularioPeriodo.dataInicio}
                  onChange={(event) => atualizarFormularioPeriodo('dataInicio', event.target.value)}
                  disabled={novaParcelaBloqueada}
                  required
                />
              </label>
              <label>
                Quantidade de dias
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max={saldoSelecionado ?? 30}
                  value={formularioPeriodo.quantidadeDias}
                  onChange={(event) => atualizarFormularioPeriodo('quantidadeDias', event.target.value)}
                  disabled={novaParcelaBloqueada}
                  required
                />
              </label>
              <label className="span-2">
                Status
                <select
                  style={styles.input}
                  value={formularioPeriodo.status}
                  onChange={(event) => atualizarFormularioPeriodo('status', event.target.value)}
                  disabled={novaParcelaBloqueada}
                >
                  <option value="agendada">Agendada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
            </div>

            {previsaoPeriodo && (
              <div className={previsaoPeriodo.erro ? 'ferias-warning' : 'ferias-preview'}>
                {previsaoPeriodo.erro ? (
                  <strong>{previsaoPeriodo.erro}</strong>
                ) : (
                  <>
                    <strong>Fim calculado: {formatarDataCurta(previsaoPeriodo.dataFim)}</strong>
                    <br />
                    <span>Retorno ao trabalho: {formatarDataCurta(previsaoPeriodo.dataRetorno)}</span>
                    <br />
                    <span>Essas datas serão enviadas junto com a parcela, sem campo manual de fim ou retorno.</span>
                  </>
                )}
              </div>
            )}

            {limiteParcelasAtingido && (
              <div className="ferias-warning">
                O limite planejado de 3 parcelas ativas foi atingido para este ciclo.
              </div>
            )}

            {semSaldoDisponivel && (
              <div className="ferias-warning">
                O saldo calculado deste ciclo está zerado. Não há dias disponíveis para nova parcela.
              </div>
            )}

            {quantidadeMaiorQueSaldo && (
              <div className="ferias-warning">
                A quantidade de dias informada é maior que o saldo disponível do ciclo.
              </div>
            )}

            <div className="ferias-form-actions">
              <button
                style={styles.btnSalvar}
                type="submit"
                disabled={
                  !podeEditar ||
                  salvando ||
                  novaParcelaBloqueada ||
                  quantidadeMaiorQueSaldo ||
                  Boolean(previsaoPeriodo?.erro) ||
                  !formularioPeriodo.dataInicio ||
                  !formularioPeriodo.quantidadeDias
                }
              >
                {textoBotaoNovaParcela}
              </button>
            </div>
          </form>
          )}
            </>
          )}

          <SectionHeader
            titulo="Parcelas do ciclo selecionado"
            descricao="Histórico de parcelas lançadas para o ciclo."
            resumo={`${periodosVisiveis.length} parcela(s) visível(is)`}
            aberto={secoesAbertas.parcelas}
            onToggle={() => alternarSecao('parcelas')}
          />

          {secoesAbertas.parcelas && (
          loadingPeriodos ? (
            <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando parcelas...</p>
          ) : periodosVisiveis.length === 0 ? (
            <EmptyState
              titulo={periodos.length > 0 ? 'Nenhuma parcela visível' : 'Nenhuma parcela cadastrada'}
              descricao={periodos.length > 0 ? 'Ative Mostrar arquivados para ver parcelas arquivadas.' : 'Adicione a primeira parcela de férias deste ciclo.'}
            />
          ) : (
            <div className="ferias-period-list">
              {periodosVisiveis.map((periodo) => {
                const editandoPeriodo = periodoEditandoId === periodo.id
                const previsaoEdicao = editandoPeriodo
                  ? criarPrevisaoPeriodo({
                    formularioPeriodo: formularioEdicaoPeriodo,
                    calcularFimFerias,
                    calcularRetornoTrabalho
                  })
                  : null
                const diasAtuais = periodoConsomeSaldo(periodo) ? Number(periodo.quantidade_dias || 0) : 0
                const saldoDisponivelEdicao = (saldoSelecionado ?? 0) + diasAtuais
                const quantidadeEdicao = Number(formularioEdicaoPeriodo.quantidadeDias || 0)
                const edicaoMaiorQueSaldo =
                  editandoPeriodo &&
                  formularioEdicaoPeriodo.status !== 'cancelada' &&
                  quantidadeEdicao > saldoDisponivelEdicao

                return (
                  <article key={periodo.id} className={`ferias-period-card ${periodo.arquivado ? 'archived' : ''}`}>
                    <div className="ferias-period-main">
                      {!editandoPeriodo ? (
                        <>
                          <strong>Parcela {periodo.numero_parcela || '-'} - {formatarDataCurta(periodo.data_inicio)}</strong>
                          <small>{periodo.quantidade_dias} dia(s) - fim {formatarDataCurta(periodo.data_fim_calculada)} - retorno {formatarDataCurta(periodo.data_retorno_trabalho)}</small>
                          <span className={`ferias-status ${periodo.arquivado ? 'archived' : ''}`}>
                            {obterStatusVisualPeriodo(periodo)}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>Editar parcela {periodo.numero_parcela || '-'}</strong>
                          <div className="ferias-form-grid">
                            <label>
                              Data de início
                              <input
                                style={styles.input}
                                type="date"
                                value={formularioEdicaoPeriodo.dataInicio}
                                onChange={(event) => atualizarFormularioEdicaoPeriodo('dataInicio', event.target.value)}
                                required
                              />
                            </label>
                            <label>
                              Quantidade de dias
                              <input
                                style={styles.input}
                                type="number"
                                min="1"
                                max={saldoDisponivelEdicao || 1}
                                value={formularioEdicaoPeriodo.quantidadeDias}
                                onChange={(event) => atualizarFormularioEdicaoPeriodo('quantidadeDias', event.target.value)}
                                required
                              />
                            </label>
                            <label className="span-2">
                              Status
                              <select
                                style={styles.input}
                                value={formularioEdicaoPeriodo.status}
                                onChange={(event) => atualizarFormularioEdicaoPeriodo('status', event.target.value)}
                              >
                                <option value="agendada">Agendada</option>
                                <option value="concluida">Concluída</option>
                                <option value="cancelada">Cancelada</option>
                              </select>
                            </label>
                          </div>

                          {previsaoEdicao && (
                            <div className={previsaoEdicao.erro ? 'ferias-warning' : 'ferias-preview'}>
                              {previsaoEdicao.erro ? (
                                <strong>{previsaoEdicao.erro}</strong>
                              ) : (
                                <>
                                  <strong>Fim recalculado: {formatarDataCurta(previsaoEdicao.dataFim)}</strong>
                                  <br />
                                  <span>Retorno ao trabalho: {formatarDataCurta(previsaoEdicao.dataRetorno)}</span>
                                </>
                              )}
                            </div>
                          )}

                          {edicaoMaiorQueSaldo && (
                            <div className="ferias-warning">
                              A quantidade de dias informada é maior que o saldo disponível considerando esta parcela.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="ferias-actions">
                      {podeEditar && !editandoPeriodo && (
                        <button
                          style={styles.btnCinza}
                          type="button"
                          disabled={salvando || periodo.arquivado}
                          onClick={() => iniciarEdicaoPeriodo(periodo)}
                        >
                          Editar
                        </button>
                      )}
                      {podeEditar && editandoPeriodo && (
                        <>
                          <button
                            style={styles.btnSalvar}
                            type="button"
                            disabled={
                              salvando ||
                              edicaoMaiorQueSaldo ||
                              Boolean(previsaoEdicao?.erro) ||
                              !formularioEdicaoPeriodo.dataInicio ||
                              !formularioEdicaoPeriodo.quantidadeDias
                            }
                            onClick={() => salvarEdicaoPeriodo(periodo)}
                          >
                            {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            style={styles.btnCinza}
                            type="button"
                            disabled={salvando}
                            onClick={cancelarEdicaoPeriodo}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {podeEditar && !editandoPeriodo && (
                        <button
                          style={periodo.arquivado ? styles.btnSalvar : styles.btnCinza}
                          type="button"
                          disabled={salvando}
                          onClick={() => alternarArquivamentoPeriodo(periodo)}
                        >
                          {periodo.arquivado ? 'Reativar' : 'Arquivar'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
