import { useEffect, useMemo, useRef, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionariosFerias } from '../hooks/useFuncionariosFerias'
import { PageHeader, PageState } from '../components/shared/PagePatterns.jsx'
import { mensagemSeguraErro } from '../utils/session'
import {
  derivarStatusPeriodoFerias,
  resumirCicloFerias,
  rotularStatusCicloFerias,
  rotularStatusPeriodoFerias
} from '../services/funcionariosFeriasRules.js'
import './FeriasPage.css'

const FORMULARIO_PERIODO_INICIAL = {
  dataInicio: '',
  quantidadeDias: ''
}

const FORMULARIO_EDICAO_CICLO_INICIAL = {
  dias_direito: '30',
  motivo: '',
  confirmado: false
}

const LIMITE_FUNCIONARIOS_SELECTOR = 8
const LIMITE_CICLOS_INICIAL = 6

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

function normalizarBusca(valor) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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

function calcularDataAtencaoLimite(dataLimiteGozo) {
  return somarDiasISO(dataLimiteGozo, -30)
}

function obterDestaqueVisualCiclo(ciclo, statusOperacional) {
  if (!ciclo || ciclo.arquivado) return { classe: '', rotulo: '' }
  if (['concluida', 'cancelada', 'arquivada'].includes(statusOperacional)) return { classe: '', rotulo: '' }

  const hoje = obterHojeISO()
  const limite = normalizarDataISO(ciclo.data_limite_gozo)
  const atencao = calcularDataAtencaoLimite(limite)

  if (limite && limite < hoje) return { classe: 'is-overdue', rotulo: 'Limite vencido' }
  if (atencao && atencao <= hoje) return { classe: 'is-due-soon', rotulo: 'Atencao' }
  return { classe: 'is-on-track', rotulo: 'No prazo' }
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

function EmptyState({ titulo, descricao, type = 'empty' }) {
  return <PageState type={type} title={titulo} description={descricao} className="ferias-empty-state" />
}

function SectionHeader({ titulo, descricao, resumo, aberto, onToggle, acao }) {
  return (
    <div className="ferias-section-header">
      <div className="ferias-section-title">
        <strong>{titulo}</strong>
        {descricao && <small>{descricao}</small>}
        {!aberto && resumo && <em>{resumo}</em>}
      </div>
      <div className="ferias-section-actions">
        {acao}
        <button className="ferias-section-toggle" type="button" onClick={onToggle} aria-expanded={aberto} aria-label={aberto ? `Recolher ${titulo}` : `Expandir ${titulo}`}>
          {aberto ? '−' : '+'}
        </button>
      </div>
    </div>
  )
}

function montarFormularioEdicaoPeriodo(periodo) {
  return {
    dataInicio: periodo?.data_inicio || '',
    quantidadeDias: String(periodo?.quantidade_dias || '')
  }
}

function obterStatusVisualPeriodo(periodo) {
  return rotularStatusPeriodoFerias(derivarStatusPeriodoFerias(periodo))
}

function periodoConsomeSaldo(periodo) {
  return periodo && !periodo.arquivado && periodo.status !== 'cancelada'
}

export default function FeriasPage({
  empresaId,
  empresaNome,
  mostrarAviso,
  podeEditar = false,
  contextoNavegacao = null,
  voltarPainel
}) {
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState('')
  const [cicloSelecionadoId, setCicloSelecionadoId] = useState('')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [formularioPeriodo, setFormularioPeriodo] = useState(criarFormularioPeriodoInicial)
  const [editandoCiclo, setEditandoCiclo] = useState(false)
  const [formularioEdicaoCiclo, setFormularioEdicaoCiclo] = useState(criarFormularioEdicaoCicloInicial)
  const [periodoEditandoId, setPeriodoEditandoId] = useState('')
  const [formularioEdicaoPeriodo, setFormularioEdicaoPeriodo] = useState(criarFormularioPeriodoInicial)
  const [buscaFuncionario, setBuscaFuncionario] = useState('')
  const [mostrarTodosFuncionarios, setMostrarTodosFuncionarios] = useState(false)
  const [mostrarTodosCiclos, setMostrarTodosCiclos] = useState(false)
  const [secoesAbertas, setSecoesAbertas] = useState({
    funcionario: true,
    criarCiclo: false,
    ciclos: true,
    resumoCiclo: true,
    novaParcela: false,
    parcelas: true
  })
  const contextoAplicadoRef = useRef('')

  const {
    funcionarios,
    loading: loadingFuncionarios,
    erro: erroFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: false
  })

  const funcionariosOrdenados = useMemo(() => ordenarFuncionarios(funcionarios), [funcionarios])
  const funcionariosFiltradosSelector = useMemo(() => {
    const termo = normalizarBusca(buscaFuncionario)
    if (!termo) return funcionariosOrdenados

    return funcionariosOrdenados.filter((funcionario) => {
      const alvo = normalizarBusca([
        funcionario.nome,
        funcionario.cargo,
        funcionario.status
      ].filter(Boolean).join(' '))

      return alvo.includes(termo)
    })
  }, [buscaFuncionario, funcionariosOrdenados])

  const funcionariosSelectorVisiveis = useMemo(() => {
    if (mostrarTodosFuncionarios) return funcionariosFiltradosSelector
    return funcionariosFiltradosSelector.slice(0, LIMITE_FUNCIONARIOS_SELECTOR)
  }, [funcionariosFiltradosSelector, mostrarTodosFuncionarios])

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
    cancelarPeriodoFerias,
    arquivarPeriodoFerias,
    reativarPeriodoFerias,
    calcularFimFerias,
    calcularRetornoTrabalho,
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
  const ciclosRenderizados = useMemo(() => {
    if (mostrarTodosCiclos) return ciclosVisiveis
    return ciclosVisiveis.slice(0, LIMITE_CICLOS_INICIAL)
  }, [ciclosVisiveis, mostrarTodosCiclos])
  const ciclosOcultos = Math.max(ciclosVisiveis.length - ciclosRenderizados.length, 0)

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

  const resumoCicloSelecionado = useMemo(() => {
    if (!cicloSelecionado) return null
    try {
      return resumirCicloFerias({ ciclo: cicloSelecionado, periodos })
    } catch {
      return null
    }
  }, [cicloSelecionado, periodos])

  const saldoSelecionado = resumoCicloSelecionado?.saldoLivreParaProgramar ?? null
  const statusCalculadoSelecionado = resumoCicloSelecionado?.statusOperacional || ''
  const numeroParcelaPrevisto = resumoCicloSelecionado?.proximaParcela ?? null
  const limiteParcelasAtingido = numeroParcelaPrevisto === null
  const semSaldoDisponivel = saldoSelecionado !== null && saldoSelecionado <= 0
  const diasLancados = resumoCicloSelecionado
    ? resumoCicloSelecionado.diasDireito - resumoCicloSelecionado.saldoLivreParaProgramar
    : 0
  const quantidadePeriodo = Number(formularioPeriodo.quantidadeDias || 0)
  const quantidadeMaiorQueSaldo = Boolean(quantidadePeriodo && saldoSelecionado !== null && quantidadePeriodo > saldoSelecionado)
  const proximaParcelaTexto = semSaldoDisponivel
    ? 'Periodo concluido'
    : limiteParcelasAtingido
      ? 'Limite atingido'
      : numeroParcelaPrevisto
  const dataAtencaoCicloSelecionado = calcularDataAtencaoLimite(cicloSelecionado?.data_limite_gozo)
  const resumoFuncionario = funcionarioSelecionado
    ? `${funcionarioSelecionado.nome || 'Colaborador selecionado'}${funcionarioSelecionado.cargo ? ` - ${funcionarioSelecionado.cargo}` : ''}`
    : 'Nenhum colaborador selecionado'
  const resumoPeriodoSelecionado = cicloSelecionado
    ? `${formatarDataCurta(cicloSelecionado.periodo_aquisitivo_inicio)} a ${formatarDataCurta(cicloSelecionado.periodo_aquisitivo_fim)}`
    : 'Nenhum periodo selecionado'
  const novaParcelaBloqueada = semSaldoDisponivel || limiteParcelasAtingido
  const textoBotaoNovaParcela = semSaldoDisponivel
    ? 'Sem saldo disponivel'
    : limiteParcelasAtingido
      ? 'Limite de gozos atingido'
      : salvando
        ? 'Salvando...'
        : 'Adicionar gozo'

  const previsaoPeriodo = useMemo(() => criarPrevisaoPeriodo({
    formularioPeriodo,
    calcularFimFerias,
    calcularRetornoTrabalho
  }), [calcularFimFerias, calcularRetornoTrabalho, formularioPeriodo])

  useEffect(() => {
    contextoAplicadoRef.current = ''
    setFuncionarioSelecionadoId('')
    setCicloSelecionadoId('')
    setIncluirArquivados(false)
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
    const funcionarioId = String(contextoNavegacao?.funcionarioId || '')
    if (!funcionarioId || contextoAplicadoRef.current === funcionarioId || loadingFuncionarios) return
    if (!funcionariosOrdenados.some((item) => String(item?.id || '') === funcionarioId)) return
    contextoAplicadoRef.current = funcionarioId
    setFuncionarioSelecionadoId(funcionarioId)
    setBuscaFuncionario('')
    setMostrarTodosFuncionarios(true)
  }, [contextoNavegacao, funcionariosOrdenados, loadingFuncionarios])

  useEffect(() => {
    const cicloId = String(contextoNavegacao?.cicloId || '')
    if (cicloId && ciclosVisiveis.some((ciclo) => String(ciclo?.id || '') === cicloId)) {
      setCicloSelecionadoId(cicloId)
    }
  }, [ciclosVisiveis, contextoNavegacao])

  useEffect(() => {
    const periodoId = String(contextoNavegacao?.periodoId || '')
    if (!periodoId || loadingPeriodos || !periodosVisiveis.some((periodo) => String(periodo?.id || '') === periodoId)) return
    setSecoesAbertas((atual) => ({ ...atual, parcelas: true }))
    globalThis.document?.getElementById(`ferias-periodo-${periodoId}`)?.scrollIntoView?.({ block: 'center' })
  }, [contextoNavegacao, loadingPeriodos, periodosVisiveis])

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
    setBuscaFuncionario('')
    setMostrarTodosFuncionarios(false)
    setMostrarTodosCiclos(false)
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
      motivo: '',
      confirmado: false
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
      dias_direito: 30
    }, {
      funcionarioId: funcionarioSelecionadoId
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o ciclo de férias.'), 'erro')
      return
    }

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
      quantidadeDias: Number(formularioPeriodo.quantidadeDias)
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

    if (!formularioEdicaoCiclo.confirmado || String(formularioEdicaoCiclo.motivo || '').trim().length < 5) {
      mostrarAviso?.('Confirme o ajuste e informe um motivo administrativo.', 'erro')
      return
    }

    const resposta = await atualizarCicloFerias(cicloSelecionado.id, {
      dias_direito: diasDireito,
      motivo: formularioEdicaoCiclo.motivo
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

    if (quantidadeDias > saldoDisponivelParaEdicao) {
      mostrarAviso?.('A quantidade de dias informada é maior que o saldo disponível para esta edição.', 'erro')
      return
    }

    const resposta = await atualizarPeriodoFerias(periodo.id, {
      dataInicio: formularioEdicaoPeriodo.dataInicio,
      quantidadeDias
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

  async function cancelarPeriodo(periodo) {
    if (!periodo?.id || !empresaId || !podeEditar || salvando || periodo.arquivado || periodo.status === 'cancelada') return
    const resposta = await cancelarPeriodoFerias(periodo.id)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível cancelar o período de férias.'), 'erro')
      return
    }
    if (periodoEditandoId === periodo.id) cancelarEdicaoPeriodo()
    mostrarAviso?.('Período cancelado e saldo liberado.', 'sucesso')
  }

  return (
    <div className="ferias-page">
      <PageHeader
        kicker="Gestão de Pessoas"
        title="Férias"
        description="Consulte períodos aquisitivos, limites de gozo e saldo por colaborador."
        meta={<>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></>}
        className="ferias-page-hero"
        actions={<button className="ferias-btn ferias-btn-secondary" type="button" onClick={voltarPainel}>Voltar ao painel</button>}
      />

      {!empresaId ? (
        <section className="ferias-card">
          <EmptyState
            titulo="Empresa ativa necessaria"
            descricao="Selecione uma empresa para carregar colaboradores e ferias."
          />
        </section>
      ) : (
        <div className="ferias-page-grid">
          <section className="ferias-card is-compact">
            <SectionHeader
              titulo="1. Escolha o colaborador"
              descricao="A consulta comeca pela selecao de um colaborador."
              resumo={resumoFuncionario}
              aberto={secoesAbertas.funcionario}
              onToggle={() => alternarSecao('funcionario')}
            />

            {secoesAbertas.funcionario && (
              <>
                <p className="ferias-note">CPF e observacoes sensiveis nao aparecem nesta tela.</p>

                {loadingFuncionarios ? (
                  <PageState type="loading" title="Carregando colaboradores…" description="Consultando a equipe da empresa ativa." />
                ) : erroFuncionarios ? (
                  <EmptyState type="error" titulo="Nao foi possivel carregar" descricao={erroFuncionarios} />
                ) : (
                  <>
                    <div className="ferias-employee-picker">
                      <label className="ferias-employee-search">
                        Buscar colaborador
                        <input
                          className="ferias-input"
                          type="search"
                          value={buscaFuncionario}
                          onChange={(event) => {
                            setBuscaFuncionario(event.target.value)
                            setMostrarTodosFuncionarios(false)
                          }}
                          placeholder="Digite nome, cargo ou status"
                        />
                      </label>

                      <div className="ferias-employee-list" role="listbox" aria-label="Selecionar colaborador">
                        {funcionariosSelectorVisiveis.map((funcionario) => {
                          const selecionado = funcionario.id === funcionarioSelecionadoId

                          return (
                            <button
                              key={funcionario.id}
                              className={`ferias-employee-option ${selecionado ? 'selected' : ''}`}
                              type="button"
                              onClick={() => selecionarFuncionario(funcionario.id)}
                              aria-pressed={selecionado}
                            >
                              <span>
                                <strong>{funcionario.nome || 'Colaborador sem nome'}</strong>
                                <small>
                                  {funcionario.cargo || 'Cargo nao informado'} - {formatarStatus(funcionario.status, { ativo: 'Ativo', afastado: 'Afastado', desligado: 'Desligado' })}
                                </small>
                              </span>
                              <em>{formatarDataCurta(funcionario.data_admissao)}</em>
                            </button>
                          )
                        })}
                      </div>

                      {funcionariosFiltradosSelector.length > LIMITE_FUNCIONARIOS_SELECTOR && (
                        <button
                          className="ferias-inline-action"
                          type="button"
                          onClick={() => setMostrarTodosFuncionarios((atual) => !atual)}
                        >
                          {mostrarTodosFuncionarios ? 'Recolher lista' : `Ver mais ${funcionariosFiltradosSelector.length - LIMITE_FUNCIONARIOS_SELECTOR} colaborador(es)`}
                        </button>
                      )}

                      {funcionariosFiltradosSelector.length === 0 && (
                        <div className="ferias-empty-state">
                          <strong>Nenhum colaborador encontrado.</strong>
                          Ajuste a busca para localizar outro cadastro ativo.
                        </div>
                      )}
                    </div>

                    {funcionariosOrdenados.length === 0 && (
                      <EmptyState
                        titulo="Nenhum colaborador ativo"
                        descricao="Cadastre um colaborador antes de registrar periodos aquisitivos."
                      />
                    )}
                  </>
                )}

                {funcionarioSelecionado && (
                  <div className="ferias-preview">
                    <strong>{funcionarioSelecionado.nome || 'Colaborador selecionado'}</strong>
                    <br />
                    <span>{funcionarioSelecionado.cargo || 'Cargo nao informado'}</span>
                    <br />
                    <span>Admissao: {formatarDataCurta(funcionarioSelecionado.data_admissao)}</span>
                  </div>
                )}

                <div className="ferias-warning">
                  Esta tela prioriza a consulta dos periodos aquisitivos importados. Periodos de gozo so devem ser lancados quando houver data real de inicio/fim.
                  Nenhuma data deve ser estimada a partir do limite de gozo.
                </div>
              </>
            )}
          </section>

          <div className="ferias-main-column">
          <section className="ferias-card">
            <SectionHeader
              titulo="Adicionar periodo aquisitivo"
              descricao="Acao administrativa secundaria para cadastrar um periodo que ainda nao existe."
              resumo={sugestaoCiclo.erro || sugestaoCiclo.origem || 'Aguardando colaborador'}
              aberto={secoesAbertas.criarCiclo}
              onToggle={() => alternarSecao('criarCiclo')}
            />

            {!funcionarioSelecionadoId ? (
              <EmptyState
                titulo="Selecione um colaborador"
                descricao="Os periodos aquisitivos aparecem depois da selecao do colaborador."
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
                          <span>Inicio calculado</span>
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
                          <span>Atencao em</span>
                          <strong>{formatarDataCurta(calcularDataAtencaoLimite(sugestaoCiclo.ciclo?.data_limite_gozo))}</strong>
                        </div>
                      </div>

                      <div className="ferias-preview">
                        <strong>Periodo aquisitivo sugerido automaticamente.</strong>
                        <br />
                        <span>{sugestaoCiclo.origem}</span>
                        <br />
                        <span>A data limite de gozo e calculada pelo sistema e nao fica editavel no fluxo normal.</span>
                        <br />
                        <span>Atencao em e um prazo operacional interno calculado 30 dias antes do limite de gozo.</span>
                      </div>

                      {cicloDuplicadoSugerido && (
                        <div className="ferias-warning">
                          Ja existe um periodo aquisitivo com as mesmas datas para este colaborador.
                        </div>
                      )}
                    </>
                  )}

                  <div className="ferias-preview">
                    O ciclo será criado com 30 dias de direito. A situação é calculada pelas datas e pelos gozos registrados.
                  </div>
                  <div className="ferias-form-actions">
                    <button
                      className="ferias-btn ferias-btn-primary"
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
                      {salvando ? 'Salvando...' : 'Adicionar periodo'}
                    </button>
                  </div>
                </form>
                )}

                <SectionHeader
                  titulo="Periodos aquisitivos"
                  descricao="Consulta dos periodos ja cadastrados para o colaborador selecionado."
                  resumo={`${ciclosVisiveis.length} periodo(s) visivel(is)`}
                  aberto={secoesAbertas.ciclos}
                  onToggle={() => alternarSecao('ciclos')}
                  acao={(
                    <label className="ferias-switch">
                      <input
                        type="checkbox"
                        checked={incluirArquivados}
                        onChange={(event) => {
                          setIncluirArquivados(event.target.checked)
                          setMostrarTodosCiclos(false)
                        }}
                        disabled={!funcionarioSelecionadoId || loading}
                      />
                      <span className="ferias-switch-indicator" aria-hidden="true" />
                      <span>Mostrar arquivados</span>
                    </label>
                  )}
                />

                {secoesAbertas.ciclos && (
                  <>
                {loadingCiclos ? (
                  <PageState type="loading" title="Carregando períodos…" description="Consultando os períodos aquisitivos do colaborador." />
                ) : erro ? (
                  <EmptyState type="error" titulo="Nao foi possivel carregar ferias" descricao={erro} />
                ) : ciclosVisiveis.length === 0 ? (
                  <EmptyState
                    titulo={ciclos.length > 0 ? 'Nenhum periodo visivel' : 'Nenhum periodo aquisitivo cadastrado'}
                    descricao={ciclos.length > 0 ? 'Ative Mostrar arquivados para ver periodos arquivados.' : 'Use Adicionar periodo aquisitivo apenas se este colaborador ainda nao tiver periodo cadastrado.'}
                  />
                ) : (
                  <>
                  <div className="ferias-cycle-results">
                    <span>{ciclosRenderizados.length} de {ciclosVisiveis.length} periodo(s) exibido(s)</span>
                    {ciclosOcultos > 0 && <strong>{ciclosOcultos} periodo(s) recolhido(s)</strong>}
                  </div>
                  <div className="ferias-cycle-list">
                    {ciclosRenderizados.map((ciclo) => {
                      const selecionado = ciclo.id === cicloSelecionadoId
                      const resumoCiclo = resumirCicloFerias({ ciclo, periodos: ciclo.periodos || [] })
                      const status = rotularStatusCicloFerias(resumoCiclo.statusOperacional)
                      const destaque = obterDestaqueVisualCiclo(ciclo, resumoCiclo.statusOperacional)

                      return (
                        <article
                          key={ciclo.id}
                          className={`ferias-cycle-card ${selecionado ? 'selected' : ''} ${ciclo.arquivado ? 'archived' : ''} ${destaque.classe}`}
                        >
                          <div className="ferias-cycle-main">
                            <div className="ferias-cycle-title-row">
                              <strong>{formatarDataCurta(ciclo.periodo_aquisitivo_inicio)} a {formatarDataCurta(ciclo.periodo_aquisitivo_fim)}</strong>
                              <span className={`ferias-status ${ciclo.arquivado ? 'archived' : ''}`}>{status}</span>
                            </div>
                            <div className="ferias-cycle-metrics">
                              <span><small>Limite de gozo</small><strong>{formatarDataCurta(ciclo.data_limite_gozo)}</strong></span>
                              <span><small>Atencao em</small><strong>{formatarDataCurta(calcularDataAtencaoLimite(ciclo.data_limite_gozo))}</strong></span>
                              <span><small>Dias</small><strong>{ciclo.dias_direito || 30}</strong></span>
                            </div>
                            {destaque.rotulo && <em className={`ferias-cycle-alert ${destaque.classe}`}>{destaque.rotulo}</em>}
                          </div>
                          <div className="ferias-actions">
                            {selecionado ? (
                              <span className="ferias-selected-pill">Selecionado</span>
                            ) : (
                              <button
                                className="ferias-btn ferias-btn-secondary"
                                type="button"
                                disabled={loading || salvando}
                                onClick={() => setCicloSelecionadoId(ciclo.id)}
                              >
                                Selecionar
                              </button>
                            )}
                            {podeEditar && (
                              <button
                                className={`ferias-btn ${ciclo.arquivado ? 'ferias-btn-primary' : 'ferias-btn-danger'}`}
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
                  {ciclosVisiveis.length > LIMITE_CICLOS_INICIAL && (
                    <button
                      className="ferias-inline-action ferias-cycle-more"
                      type="button"
                      onClick={() => setMostrarTodosCiclos((atual) => !atual)}
                    >
                      {mostrarTodosCiclos ? 'Recolher periodos' : `Ver todos os ${ciclosVisiveis.length} periodos`}
                    </button>
                  )}
                  </>
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
            titulo="Resumo do periodo aquisitivo"
            descricao="Datas, saldo e situacao calculada do periodo."
            resumo={resumoPeriodoSelecionado}
            aberto={secoesAbertas.resumoCiclo}
            onToggle={() => alternarSecao('resumoCiclo')}
            acao={podeEditar && !editandoCiclo ? (
              <button
                className="ferias-btn ferias-btn-secondary"
                type="button"
                disabled={salvando || cicloSelecionado.arquivado}
                onClick={iniciarEdicaoCiclo}
              >
                Ajustar dias de direito
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
              <span>Atencao em</span>
              <strong>{formatarDataCurta(dataAtencaoCicloSelecionado)}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Dias de direito</span>
              <strong>{cicloSelecionado.dias_direito || 30}</strong>
            </div>
            <div className="ferias-summary-box"><span>Dias programados</span><strong>{resumoCicloSelecionado?.diasProgramados ?? 'N/I'}</strong></div>
            <div className="ferias-summary-box"><span>Dias em gozo</span><strong>{resumoCicloSelecionado?.diasEmGozo ?? 'N/I'}</strong></div>
            <div className="ferias-summary-box"><span>Dias gozados</span><strong>{resumoCicloSelecionado?.diasGozados ?? 'N/I'}</strong></div>
            <div className="ferias-summary-box"><span>Saldo livre para programar</span><strong>{saldoSelecionado ?? 'N/I'}</strong></div>
            <div className="ferias-summary-box"><span>Saldo ainda não gozado</span><strong>{resumoCicloSelecionado?.saldoAindaNaoGozado ?? 'N/I'}</strong></div>
            <div className="ferias-summary-box"><span>Situação</span><strong>{rotularStatusCicloFerias(statusCalculadoSelecionado)}</strong></div>
            <div className="ferias-summary-box"><span>Quantidade de parcelas</span><strong>{resumoCicloSelecionado?.quantidadeParcelas ?? 0}</strong></div>
            <div className="ferias-summary-box">
              <span>Próxima parcela</span>
              <strong>{typeof numeroParcelaPrevisto === 'number' ? `${numeroParcelaPrevisto}ª` : proximaParcelaTexto}</strong>
            </div>
          </div>

          <div className="ferias-preview">
            Atencao em e um prazo operacional interno calculado 30 dias antes do limite de gozo.
            Ela nao substitui o limite de gozo e nao gera automacao.
          </div>

          {editandoCiclo && (
            <form onSubmit={salvarEdicaoCiclo}>
              <div className="ferias-form-grid">
                <label>
                  Dias de direito
                  <input
                    className="ferias-input"
                    type="number"
                    min="1"
                    max="30"
                    value={formularioEdicaoCiclo.dias_direito}
                    onChange={(event) => atualizarFormularioEdicaoCiclo('dias_direito', event.target.value)}
                    required
                  />
                </label>
                <label className="span-2">
                  Motivo administrativo
                  <input
                    className="ferias-input"
                    value={formularioEdicaoCiclo.motivo}
                    onChange={(event) => atualizarFormularioEdicaoCiclo('motivo', event.target.value)}
                    required
                  />
                </label>
                <label className="ferias-switch span-2">
                  <input
                    type="checkbox"
                    checked={formularioEdicaoCiclo.confirmado}
                    onChange={(event) => atualizarFormularioEdicaoCiclo('confirmado', event.target.checked)}
                  />
                  <span className="ferias-switch-indicator" aria-hidden="true" />
                  <span>Confirmo o ajuste dos dias de direito</span>
                </label>
              </div>

              {Number(formularioEdicaoCiclo.dias_direito || 0) < diasLancados && (
                <div className="ferias-warning">
                  Dias de direito nao pode ser menor que os dias ja lancados neste periodo.
                </div>
              )}

              <div className="ferias-form-actions">
                <button
                  className="ferias-btn ferias-btn-primary"
                  type="submit"
                  disabled={
                    salvando ||
                    Number(formularioEdicaoCiclo.dias_direito || 0) < diasLancados ||
                    !formularioEdicaoCiclo.confirmado ||
                    String(formularioEdicaoCiclo.motivo || '').trim().length < 5
                  }
                >
                  {salvando ? 'Salvando...' : 'Salvar periodo'}
                </button>
                <button
                  className="ferias-btn ferias-btn-secondary"
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
            Esta tela nao estima ferias gozadas. Periodo de gozo so deve ser lancado quando houver data real de inicio/fim e quantidade de dias.
            Saldos parciais informados na base original nao viram periodo lancado sem essas datas.
          </div>
            </>
          )}

          <SectionHeader
            titulo="Lancar periodo de gozo"
            descricao="Use apenas quando houver data real de inicio do gozo."
            resumo={novaParcelaBloqueada ? proximaParcelaTexto : 'Pronto para lancamento com data real'}
            aberto={secoesAbertas.novaParcela}
            onToggle={() => alternarSecao('novaParcela')}
          />

          {secoesAbertas.novaParcela && (
            <>
          {novaParcelaBloqueada ? (
            <div className="ferias-warning">
              {semSaldoDisponivel
                ? 'O saldo calculado deste periodo esta zerado. Nao ha dias disponiveis para novo gozo.'
                : 'O limite planejado de 3 periodos de gozo ativos foi atingido para este periodo aquisitivo.'}
            </div>
          ) : (
          <form onSubmit={salvarPeriodo}>
            <div className="ferias-form-grid">
              <label>
                Data de inicio
                <input
                  className="ferias-input"
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
                  className="ferias-input"
                  type="number"
                  min="1"
                  max={saldoSelecionado ?? 30}
                  value={formularioPeriodo.quantidadeDias}
                  onChange={(event) => atualizarFormularioPeriodo('quantidadeDias', event.target.value)}
                  disabled={novaParcelaBloqueada}
                  required
                />
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
                    <span>Parcela prevista: {numeroParcelaPrevisto}ª · saldo livre após o lançamento: {Math.max((saldoSelecionado ?? 0) - quantidadePeriodo, 0)} dia(s).</span>
                    <br />
                    <span>O servidor recalcula datas, parcela, saldo e conflitos antes de confirmar.</span>
                  </>
                )}
              </div>
            )}

            {limiteParcelasAtingido && (
              <div className="ferias-warning">
                O limite planejado de 3 periodos de gozo ativos foi atingido para este periodo aquisitivo.
              </div>
            )}

            {semSaldoDisponivel && (
              <div className="ferias-warning">
                O saldo calculado deste periodo esta zerado. Nao ha dias disponiveis para novo gozo.
              </div>
            )}

            {quantidadeMaiorQueSaldo && (
              <div className="ferias-warning">
                A quantidade de dias informada e maior que o saldo disponivel do periodo aquisitivo.
              </div>
            )}

            <div className="ferias-form-actions">
              <button
                className="ferias-btn ferias-btn-primary"
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
            titulo="Periodos de gozo lancados"
            descricao="Somente gozos com data real de inicio aparecem aqui."
            resumo={`${periodosVisiveis.length} lancamento(s) visivel(is)`}
            aberto={secoesAbertas.parcelas}
            onToggle={() => alternarSecao('parcelas')}
          />

          {secoesAbertas.parcelas && (
          loadingPeriodos ? (
            <PageState type="loading" title="Carregando períodos de gozo…" description="Consultando os lançamentos do período selecionado." />
          ) : periodosVisiveis.length === 0 ? (
            <EmptyState
              titulo={periodos.length > 0 ? 'Nenhum gozo visivel' : 'Nenhum periodo de gozo lancado'}
              descricao={periodos.length > 0 ? 'Ative Mostrar arquivados para ver gozos arquivados.' : 'Nenhum periodo de gozo lancado com data real.'}
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
                  quantidadeEdicao > saldoDisponivelEdicao

                return (
                  <article id={`ferias-periodo-${periodo.id}`} key={periodo.id} className={`ferias-period-card ${periodo.arquivado ? 'archived' : ''}`}>
                    <div className="ferias-period-main">
                      {!editandoPeriodo ? (
                        <>
                          <strong>Gozo {periodo.numero_parcela || '-'} - {formatarDataCurta(periodo.data_inicio)}</strong>
                          <small>{periodo.quantidade_dias} dia(s) - fim {formatarDataCurta(periodo.data_fim_calculada)} - retorno {formatarDataCurta(periodo.data_retorno_trabalho)}</small>
                          <span className={`ferias-status ${periodo.arquivado ? 'archived' : ''}`}>
                            {obterStatusVisualPeriodo(periodo)}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>Editar gozo {periodo.numero_parcela || '-'}</strong>
                          <div className="ferias-form-grid">
                            <label>
                              Data de início
                              <input
                                className="ferias-input"
                                type="date"
                                value={formularioEdicaoPeriodo.dataInicio}
                                onChange={(event) => atualizarFormularioEdicaoPeriodo('dataInicio', event.target.value)}
                                required
                              />
                            </label>
                            <label>
                              Quantidade de dias
                              <input
                                className="ferias-input"
                                type="number"
                                min="1"
                                max={saldoDisponivelEdicao || 1}
                                value={formularioEdicaoPeriodo.quantidadeDias}
                                onChange={(event) => atualizarFormularioEdicaoPeriodo('quantidadeDias', event.target.value)}
                                required
                              />
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
                              A quantidade de dias informada e maior que o saldo disponivel considerando este gozo.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="ferias-actions">
                      {podeEditar && !editandoPeriodo && (
                        <button
                          className="ferias-btn ferias-btn-secondary"
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
                            className="ferias-btn ferias-btn-primary"
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
                            className="ferias-btn ferias-btn-secondary"
                            type="button"
                            disabled={salvando}
                            onClick={cancelarEdicaoPeriodo}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {podeEditar && !editandoPeriodo && (
                        <>
                          {!periodo.arquivado && periodo.status !== 'cancelada' && (
                            <button className="ferias-btn ferias-btn-danger" type="button" disabled={salvando} onClick={() => cancelarPeriodo(periodo)}>
                              Cancelar gozo
                            </button>
                          )}
                          <button
                            className={`ferias-btn ${periodo.arquivado ? 'ferias-btn-primary' : 'ferias-btn-danger'}`}
                            type="button"
                            disabled={salvando}
                            onClick={() => alternarArquivamentoPeriodo(periodo)}
                          >
                            {periodo.arquivado ? 'Reativar' : 'Arquivar'}
                          </button>
                        </>
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
