import { useRef, useState } from 'react'
import {
  atualizarConta,
  atualizarRecorrencia,
  atualizarStatusConta,
  baixarContaComoPaga,
  buscarRecorrenciaPorId,
  corrigirPagamentoConta,
  criarConta,
  criarContasEmLote,
  estornarBaixaConta,
  listarRecorrencias,
  consolidarPagamentosParciaisPorConta,
  criarRecorrencia,
  buscarRecorrenciaSemelhante,
  cancelarGrupoParcelamento as cancelarGrupoParcelamentoService,
  desativarRecorrencia,
  enviarContaParaLixeira,
  listarContasAtivas,
  listarContasDoMesParaRecorrencia,
  listarPagamentosParciaisPorContas,
  registrarAuditoriaPagamentoParcialCriado,
  registrarAuditoriaEventoFinanceiro,
  registrarPagamentoParcial as registrarPagamentoParcialService,
  estornarPagamentoParcial as estornarPagamentoParcialService,
  baixarContaQuitadaPorParciais as baixarContaQuitadaPorParciaisService,
  listarParcelasParcelamento,
  listarRecorrenciasAtivas,
  listarRecorrenciasPorDia,
  ocultarConta as ocultarContaService,
  reativarRecorrencia,
  reexibirConta as reexibirContaService,
  validarCentroCustoDaEmpresa,
  validarFilialDaEmpresa,
  vincularRecorrenciaNaConta
} from '../services/contasService'
import {
  criarCorrelationIdAtualizacaoConta,
  registrarAuditoriaAtualizacaoConta
} from '../services/auditoriaContaAtualizacaoService'
import { deveGerarRecorrenciaNoMes, montarDataRecorrente } from '../utils/recorrencia'
import { mensagemSeguraErro } from '../utils/session'

const CENTRO_CUSTO_INVALIDO_MENSAGEM = 'Centro de custo indisponível. Atualize a página ou selecione outro centro de custo.'

function normalizarTextoRecorrencia(valor) {
  return String(valor || '').trim().toLowerCase()
}

function normalizarValorRecorrencia(valor) {
  return Number(valor || 0).toFixed(2)
}

function arredondarCentavos(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100)
}

function valorCentavosParaDecimal(centavos) {
  return Math.round(Number(centavos || 0)) / 100
}

function gerarUuidLocal() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caractere) => {
    const aleatorio = Math.random() * 16 | 0
    const valor = caractere === 'x' ? aleatorio : (aleatorio & 0x3 | 0x8)
    return valor.toString(16)
  })
}

function somarMesesDataBanco(dataBanco, mesesAdicionar) {
  const partes = String(dataBanco || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!partes) return ''

  const ano = Number(partes[1])
  const mesIndice = Number(partes[2]) - 1
  const diaOriginal = Number(partes[3])
  const primeiroDiaMesAlvo = new Date(ano, mesIndice + Number(mesesAdicionar || 0), 1)
  const anoAlvo = primeiroDiaMesAlvo.getFullYear()
  const mesAlvo = primeiroDiaMesAlvo.getMonth()
  const ultimoDiaMesAlvo = new Date(anoAlvo, mesAlvo + 1, 0).getDate()
  const dia = Math.min(diaOriginal, ultimoDiaMesAlvo)
  const data = new Date(anoAlvo, mesAlvo, dia)
  const mesFormatado = String(data.getMonth() + 1).padStart(2, '0')
  const diaFormatado = String(data.getDate()).padStart(2, '0')

  return `${data.getFullYear()}-${mesFormatado}-${diaFormatado}`
}

function montarParcelasConta({ payloadBase, valorTotal, parcelasTotal, primeiroVencimento }) {
  const quantidade = Number(parcelasTotal)
  const totalCentavos = arredondarCentavos(valorTotal)
  const valorBaseCentavos = Math.floor(totalCentavos / quantidade)
  const sobraCentavos = totalCentavos - (valorBaseCentavos * quantidade)
  const grupoParcelamentoId = gerarUuidLocal()

  return Array.from({ length: quantidade }, (_, indice) => {
    const numeroParcela = indice + 1
    const centavosParcela = indice === quantidade - 1
      ? valorBaseCentavos + sobraCentavos
      : valorBaseCentavos
    const vencimentoParcela = somarMesesDataBanco(primeiroVencimento, indice)

    return {
      ...payloadBase,
      valor: valorCentavosParaDecimal(centavosParcela),
      data_vencimento: vencimentoParcela,
      vencimento: vencimentoParcela,
      status: 'pendente',
      excluido: false,
      grupo_parcelamento_id: grupoParcelamentoId,
      parcela_numero: numeroParcela,
      parcelas_total: quantidade,
      valor_total_parcelamento: valorCentavosParaDecimal(totalCentavos)
    }
  })
}

function recorrenciaTemContaGerada(contasReferencia, recorrencia, dataGerada) {
  return (contasReferencia || []).some((conta) => {
    if (conta.data_vencimento !== dataGerada) return false
    if (recorrencia.id && conta.recorrencia_id === recorrencia.id) return true
    if (recorrencia.id) return false

    return (
      normalizarTextoRecorrencia(conta.descricao) === normalizarTextoRecorrencia(recorrencia.descricao) &&
      normalizarValorRecorrencia(conta.valor) === normalizarValorRecorrencia(recorrencia.valor) &&
      String(conta.centro_custo_id || '') === String(recorrencia.centro_custo_id || '') &&
      String(conta.filial_id || '') === String(recorrencia.filial_id || '')
    )
  })
}

export function useContas() {
  const [contas, setContas] = useState([])
  const [contasLixeira, setContasLixeira] = useState([])
  const [seriesRecorrentes, setSeriesRecorrentes] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvandoConta, setSalvandoConta] = useState(false)
  const salvandoContaRef = useRef(false)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')
  const [filialId, setFilialId] = useState('')
  const [observacaoConta, setObservacaoConta] = useState('')
  const [impostoTipoConta, setImpostoTipoConta] = useState('')
  const [competenciaConta, setCompetenciaConta] = useState('')
  const [contaWhatsapp, setContaWhatsapp] = useState(false)
  const [contaEmail, setContaEmail] = useState(false)
  const [contaPush, setContaPush] = useState(false)
  const [contaDiasAviso, setContaDiasAviso] = useState('1')
  const [contaRecorrente, setContaRecorrente] = useState(false)
  const [contaParcelada, setContaParcelada] = useState(false)
  const [parcelamentoTotal, setParcelamentoTotal] = useState('')
  const [parcelamentoQuantidade, setParcelamentoQuantidade] = useState('2')
  const [parcelamentoPrimeiroVencimento, setParcelamentoPrimeiroVencimento] = useState('')
  const [tipoRecorrencia, setTipoRecorrencia] = useState('mensal')
  const [diaVencimentoRecorrencia, setDiaVencimentoRecorrencia] = useState('')
  const [valorVariavelRecorrencia, setValorVariavelRecorrencia] = useState(false)
  const [recorrenciaContaId, setRecorrenciaContaId] = useState(null)
  const [escopoEdicaoRecorrencia, setEscopoEdicaoRecorrencia] = useState('conta')
  const [recorrenciaEdicaoCarregada, setRecorrenciaEdicaoCarregada] = useState(false)
  const [parcelamentoGrupoConta, setParcelamentoGrupoConta] = useState(null)
  const [parcelamentoGrupoParcelas, setParcelamentoGrupoParcelas] = useState([])
  const [carregandoParcelamentoGrupo, setCarregandoParcelamentoGrupo] = useState(false)
  const [erroParcelamentoGrupo, setErroParcelamentoGrupo] = useState('')
  const contaEdicaoSnapshotRef = useRef(null)
  const recorrenciaEdicaoSnapshotRef = useRef(null)

  function resetarFormularioConta() {
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setFilialId('')
    setObservacaoConta('')
    setImpostoTipoConta('')
    setCompetenciaConta('')
    setContaWhatsapp(false)
    setContaEmail(false)
    setContaPush(false)
    setContaDiasAviso('1')
    setContaRecorrente(false)
    setContaParcelada(false)
    setParcelamentoTotal('')
    setParcelamentoQuantidade('2')
    setParcelamentoPrimeiroVencimento('')
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia('')
    setValorVariavelRecorrencia(false)
    setRecorrenciaContaId(null)
    setEscopoEdicaoRecorrencia('conta')
    setRecorrenciaEdicaoCarregada(false)
    setParcelamentoGrupoConta(null)
    setParcelamentoGrupoParcelas([])
    setCarregandoParcelamentoGrupo(false)
    setErroParcelamentoGrupo('')
    contaEdicaoSnapshotRef.current = null
    recorrenciaEdicaoSnapshotRef.current = null
  }

  function aplicarContaNoFormulario(conta, diasAvisoPadrao) {
    const dataConta = conta?.data_vencimento || ''
    const diaPadrao = dataConta ? String(Number(String(dataConta).slice(8, 10))) : ''

    setDescricao(conta?.descricao || '')
    setValor(conta?.valor || '')
    setDataVencimento(dataConta)
    setCentroCustoId(conta?.centro_custo_id || '')
    setFilialId(conta?.filial_id || '')
    setObservacaoConta(conta?.observacao || '')
    setImpostoTipoConta(conta?.imposto_tipo || '')
    setCompetenciaConta(conta?.competencia ? String(conta.competencia).slice(0, 7) : '')
    setContaWhatsapp(conta?.enviar_whatsapp ?? false)
    setContaEmail(conta?.enviar_email ?? false)
    setContaPush(conta?.enviar_push ?? false)
    setContaDiasAviso(String(conta?.dias_aviso ?? diasAvisoPadrao ?? 1))
    setContaRecorrente(Boolean(conta?.recorrencia_id))
    setContaParcelada(false)
    setParcelamentoTotal('')
    setParcelamentoQuantidade('2')
    setParcelamentoPrimeiroVencimento('')
    setRecorrenciaContaId(conta?.recorrencia_id || null)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia(diaPadrao)
    setValorVariavelRecorrencia(false)
  }

  function aplicarRecorrenciaNoFormulario(recorrencia, fallbackDia = '') {
    if (!recorrencia) return

    setDescricao(recorrencia.descricao || '')
    setValor(recorrencia.valor || '')
    setDataVencimento(recorrencia.data_inicio || '')
    setCentroCustoId(recorrencia.centro_custo_id || '')
    setFilialId(recorrencia.filial_id || '')
    setContaRecorrente(true)
    setRecorrenciaContaId(recorrencia.id || null)
    setTipoRecorrencia(recorrencia.frequencia || recorrencia.tipo_recorrencia || 'mensal')
    setDiaVencimentoRecorrencia(String(recorrencia.dia_vencimento || fallbackDia || ''))
    setValorVariavelRecorrencia(recorrencia.valor_variavel === true)
  }

  function sincronizarDadosRecorrencia(recorrencia, fallbackDia = '') {
    if (!recorrencia) return

    setContaRecorrente(true)
    setRecorrenciaContaId(recorrencia.id)
    setTipoRecorrencia(recorrencia.frequencia || recorrencia.tipo_recorrencia || 'mensal')
    setDiaVencimentoRecorrencia(String(recorrencia.dia_vencimento || fallbackDia || ''))
    setValorVariavelRecorrencia(recorrencia.valor_variavel === true)
    setRecorrenciaEdicaoCarregada(true)
  }

  function alterarEscopoEdicaoRecorrencia(escopo) {
    const novoEscopo = escopo === 'serie' ? 'serie' : 'conta'
    setEscopoEdicaoRecorrencia(novoEscopo)

    if (novoEscopo === 'serie') {
      aplicarRecorrenciaNoFormulario(recorrenciaEdicaoSnapshotRef.current)
      return
    }

    aplicarContaNoFormulario(contaEdicaoSnapshotRef.current, contaEdicaoSnapshotRef.current?.dias_aviso)
    sincronizarDadosRecorrencia(recorrenciaEdicaoSnapshotRef.current)
  }


  async function resolverCentroCustoSeguro(supabase, empresaId, centroCustoId, opcoes = {}) {
    if (!centroCustoId) return null

    const centroValidado = await validarCentroCustoDaEmpresa(supabase, centroCustoId, empresaId)
    if (!centroValidado && opcoes.bloquearInvalido) {
      throw new Error(CENTRO_CUSTO_INVALIDO_MENSAGEM)
    }

    return centroValidado
  }

  async function resolverFilialSegura(supabase, empresaId, filialId) {
    if (!filialId) return null
    return validarFilialDaEmpresa(supabase, filialId, empresaId)
  }

  async function garantirContasRecorrentesDoMes({
    supabase,
    empresaAtual,
    contasAtuais,
    configWhatsapp,
    configEmail,
    configPush,
    diasAlertaContas,
    diasAvisoPadrao
  }) {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth() + 1

    const { data: recorrentes, error } = await listarRecorrenciasAtivas(supabase, empresaAtual)

    if (error) {
      console.warn('Não foi possível carregar contas recorrentes:', error.message)
      return contasAtuais
    }

    const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fimMes = `${ano}-${String(mes).padStart(2, '0')}-${String(new Date(ano, mes, 0).getDate()).padStart(2, '0')}`
    const { data: contasDoMes, error: erroContasDoMes } = await listarContasDoMesParaRecorrencia(supabase, empresaAtual, inicioMes, fimMes)

    if (erroContasDoMes) {
      console.warn('Não foi possível validar contas recorrentes existentes:', erroContasDoMes.message)
    }

    const contasReferencia = Array.isArray(contasDoMes) ? contasDoMes : contasAtuais
    const novasContas = []

    for (const recorrencia of (recorrentes || [])) {
      if (!deveGerarRecorrenciaNoMes(recorrencia, ano, mes)) continue

      const dataGerada = montarDataRecorrente(ano, mes, recorrencia.dia_vencimento)

      const jaExiste = recorrenciaTemContaGerada(contasReferencia, recorrencia, dataGerada)

      if (jaExiste) continue

      const centroCustoSeguro = await resolverCentroCustoSeguro(supabase, empresaAtual, recorrencia.centro_custo_id)
      const filialSegura = await resolverFilialSegura(supabase, empresaAtual, recorrencia.filial_id)

      novasContas.push({
        empresa_id: empresaAtual,
        descricao: recorrencia.descricao,
        valor: Number(recorrencia.valor || 0),
        data_vencimento: dataGerada,
        vencimento: dataGerada,
        centro_custo_id: centroCustoSeguro,
        filial_id: filialSegura,
        observacao: recorrencia.observacao || null,
        recorrencia_id: recorrencia.id,
        status: 'pendente',
        excluido: false,
        enviar_whatsapp: configWhatsapp,
        enviar_email: configEmail,
        enviar_push: configPush,
        dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1)
      })
    }

    if (novasContas.length === 0) return contasAtuais

    const { data: contasCriadas, error: erroInsert } = await criarContasEmLote(supabase, novasContas)

    if (erroInsert) {
      console.warn('Não foi possível gerar contas recorrentes:', erroInsert.message)
      return contasAtuais
    }

    return [...contasAtuais, ...(contasCriadas || [])].sort((a, b) =>
      String(a.data_vencimento || '').localeCompare(String(b.data_vencimento || ''))
    )
  }

  async function enriquecerContasComPagamentosParciais(supabase, empresaId, contasReferencia) {
    const contasBase = Array.isArray(contasReferencia) ? contasReferencia : []
    if (!contasBase.length) return contasBase

    const contaIds = contasBase.map((conta) => conta.id).filter(Boolean)
    if (!contaIds.length) return contasBase

    const { data: pagamentosParciais, error } = await listarPagamentosParciaisPorContas(supabase, empresaId, contaIds)

    if (error) {
      console.warn('Não foi possível carregar pagamentos parciais das contas:', error.message)
      return contasBase
    }

    const consolidacaoPorConta = consolidarPagamentosParciaisPorConta(contasBase, pagamentosParciais || [])

    return contasBase.map((conta) => {
      const consolidacao = consolidacaoPorConta.get(conta.id)
      if (!consolidacao) return conta

      return {
        ...conta,
        pagamentosParciaisTotal: consolidacao.totalPagoParcial,
        saldoPendenteParcial: consolidacao.saldoPendente,
        quantidadePagamentosParciais: consolidacao.quantidadePagamentos,
        ultimoPagamentoParcialEm: consolidacao.ultimoPagamentoEm,
        statusOperacionalDerivado: consolidacao.statusOperacionalDerivado
      }
    })
  }

  async function buscarContas(contexto) {
    const {
      supabase,
      empresaAtual,
      avisarErro,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao,
      silencioso = false,
      permitirGerarRecorrencias = false
    } = contexto

    if (!empresaAtual) return

    try {
      const [{ data, error }, respostaRecorrencias] = await Promise.all([
        listarContasAtivas(supabase, empresaAtual),
        listarRecorrencias(supabase, empresaAtual)
      ])

      if (error) {
        avisarErro(error)
        return
      }

      if (respostaRecorrencias.error) {
        console.warn('Não foi possível carregar séries recorrentes:', respostaRecorrencias.error.message)
        setSeriesRecorrentes([])
      } else {
        setSeriesRecorrentes(respostaRecorrencias.data || [])
      }

      const contasAtuais = data || []

      if (!permitirGerarRecorrencias) {
        const contasEnriquecidas = await enriquecerContasComPagamentosParciais(supabase, empresaAtual, contasAtuais)
        setContas(contasEnriquecidas)
        return
      }

      const contasComRecorrencias = await garantirContasRecorrentesDoMes({
        supabase,
        empresaAtual,
        contasAtuais,
        configWhatsapp,
        configEmail,
        configPush,
        diasAlertaContas,
        diasAvisoPadrao
      })
      const contasEnriquecidas = await enriquecerContasComPagamentosParciais(supabase, empresaAtual, contasComRecorrencias)
      setContas(contasEnriquecidas)
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  function abrirNovaConta(contexto) {
    const { setMenuAberto, setMenuNavegacaoAberto, configWhatsapp, configEmail, configPush, diasAvisoPadrao } = contexto
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    resetarFormularioConta()
    setContaWhatsapp(configWhatsapp)
    setContaEmail(configEmail)
    setContaPush(configPush)
    setContaDiasAviso(String(diasAvisoPadrao || 1))
    setModalConta(true)
  }


  async function localizarRecorrenciaDaConta({ supabase, empresaId, conta, dataBanco, descricaoConta }) {
    if (!supabase || !empresaId || !conta) return null

    if (conta.recorrencia_id) {
      const { data, error } = await buscarRecorrenciaPorId(supabase, conta.recorrencia_id, empresaId)

      if (!error && data) return data
    }

    const diaReferencia = Number(String(dataBanco || conta.data_vencimento || '').slice(8, 10))
    if (!diaReferencia) return null

    const { data, error } = await listarRecorrenciasPorDia(supabase, empresaId, diaReferencia)

    if (error || !Array.isArray(data)) return null

    const descricaoNormalizada = String(descricaoConta || conta.descricao || '').trim().toLowerCase()
    const valorConta = Number(conta.valor || 0)

    return data.find((recorrencia) => {
      const mesmaDescricao = String(recorrencia.descricao || '').trim().toLowerCase() === descricaoNormalizada
      const mesmoValor = Number(recorrencia.valor || 0) === valorConta
      return mesmaDescricao && mesmoValor
    }) || null
  }

  async function abrirEdicaoConta(contexto) {
    const { conta, supabase, empresaId, diasAvisoPadrao, formatarDataParaBanco } = contexto
    const dataBanco = formatarDataParaBanco(conta.data_vencimento || '')
    const diaPadrao = dataBanco ? String(Number(String(dataBanco).slice(8, 10))) : ''
    const grupoParcelamentoId = conta?.grupo_parcelamento_id || null

    setEditandoContaId(conta.id)
    contaEdicaoSnapshotRef.current = { ...conta }
    recorrenciaEdicaoSnapshotRef.current = null
    setEscopoEdicaoRecorrencia('conta')
    setRecorrenciaEdicaoCarregada(false)
    setParcelamentoGrupoConta(grupoParcelamentoId ? { ...conta } : null)
    setParcelamentoGrupoParcelas(grupoParcelamentoId ? [conta] : [])
    setCarregandoParcelamentoGrupo(Boolean(grupoParcelamentoId))
    setErroParcelamentoGrupo('')
    aplicarContaNoFormulario(conta, diasAvisoPadrao)
    setModalConta(true)

    if (grupoParcelamentoId) {
      const { data, error } = await listarParcelasParcelamento(supabase, empresaId, grupoParcelamentoId)

      if (error) {
        console.warn('Falha ao carregar parcelas do grupo:', error)
        setErroParcelamentoGrupo('Nao foi possivel carregar todas as parcelas deste grupo.')
      } else {
        const parcelas = Array.isArray(data) ? data : []
        const idsParcelas = parcelas.map((parcela) => parcela.id).filter(Boolean)
        const { data: pagamentos, error: erroPagamentos } = await listarPagamentosParciaisPorContas(supabase, empresaId, idsParcelas)

        if (erroPagamentos) {
          console.warn('Falha ao carregar pagamentos parciais do grupo:', erroPagamentos)
          setErroParcelamentoGrupo('Nao foi possivel validar pagamentos parciais deste grupo.')
        } else {
          const consolidacoes = consolidarPagamentosParciaisPorConta(parcelas, pagamentos || [])
          setParcelamentoGrupoParcelas(parcelas.map((parcela) => {
            const consolidacao = consolidacoes.get(parcela.id)
            return {
              ...parcela,
              pagamentosParciaisTotal: consolidacao?.totalPagoParcial || 0,
              saldoPendenteParcial: consolidacao?.saldoPendente || Number(parcela.valor || 0),
              quantidadePagamentosParciais: consolidacao?.quantidadePagamentos || 0,
              ultimoPagamentoParcialEm: consolidacao?.ultimoPagamentoEm || null,
              statusOperacionalDerivado: consolidacao?.statusOperacionalDerivado || null
            }
          }))
        }
      }

      setCarregandoParcelamentoGrupo(false)
    }

    const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
      supabase,
      empresaId,
      conta,
      dataBanco,
      descricaoConta: conta.descricao
    })

    if (recorrenciaEncontrada) {
      recorrenciaEdicaoSnapshotRef.current = recorrenciaEncontrada
      sincronizarDadosRecorrencia(recorrenciaEncontrada, diaPadrao)
    }
  }

  function fecharConta() {
    setModalConta(false)
    resetarFormularioConta()
  }

  async function salvarConta(contexto) {
    if (salvandoContaRef.current) return false

    const correlationIdAtualizacao = editandoContaId
      ? criarCorrelationIdAtualizacaoConta(editandoContaId, gerarUuidLocal())
      : null

    salvandoContaRef.current = true
    setSalvandoConta(true)

    try {
      return await salvarContaInterno(contexto, correlationIdAtualizacao)
    } finally {
      salvandoContaRef.current = false
      setSalvandoConta(false)
    }
  }

  async function salvarContaInterno(contexto, correlationIdAtualizacao) {
    const {
      supabase,
      empresaId,
      mostrarAviso,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao,
      primeiraLetraMaiuscula,
      converterValor,
      formatarDataParaBanco,
      erroEhSessaoExpirada,
      limparEstadoAutenticacao,
      setUsuarioLogado,
      buscarContas,
      fecharConta
    } = contexto

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    if (!descricao || (!contaParcelada && (!valor || !dataVencimento))) {
      mostrarAviso('Preencha descrição, valor e vencimento.', 'erro')
      return
    }

    let centroCustoSeguro = null

    try {
      centroCustoSeguro = await resolverCentroCustoSeguro(supabase, empresaId, centroCustoId, { bloquearInvalido: true })
    } catch (error) {
      mostrarAviso(error?.message || CENTRO_CUSTO_INVALIDO_MENSAGEM, 'erro')
      return
    }

    const filialSegura = await resolverFilialSegura(supabase, empresaId, filialId)
    const dataBanco = formatarDataParaBanco(dataVencimento)
    const diaRecorrencia = contaRecorrente ? Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10)) : null
    const tipoFiscal = impostoTipoConta || null
    const competenciaFiscal = tipoFiscal && competenciaConta ? `${competenciaConta}-01` : null
    const contaVinculadaRecorrencia = Boolean(editandoContaId && recorrenciaContaId)
    const editandoSerieRecorrente = contaVinculadaRecorrencia && escopoEdicaoRecorrencia === 'serie'
    const criandoParcelamento = !editandoContaId && contaParcelada === true

    if (contaRecorrente && (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31)) {
      mostrarAviso('Informe um dia válido para a recorrência.', 'erro')
      return
    }

    if (criandoParcelamento && contaRecorrente) {
      mostrarAviso('Parcelamento e recorrencia nao podem ser usados no mesmo cadastro.', 'erro')
      return
    }

    const valorTotalParcelamento = criandoParcelamento ? converterValor(parcelamentoTotal || valor) : null
    const quantidadeParcelas = criandoParcelamento ? Number(parcelamentoQuantidade) : null
    const primeiroVencimentoParcelamento = criandoParcelamento
      ? formatarDataParaBanco(parcelamentoPrimeiroVencimento || dataVencimento)
      : null

    if (criandoParcelamento) {
      const dataPrimeiroVencimento = new Date(`${primeiroVencimentoParcelamento}T00:00:00`)

      if (!valorTotalParcelamento || valorTotalParcelamento <= 0) {
        mostrarAviso('Informe um valor total valido para o parcelamento.', 'erro')
        return
      }

      if (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas <= 1) {
        mostrarAviso('Informe um numero de parcelas maior que 1.', 'erro')
        return
      }

      if (!primeiroVencimentoParcelamento || Number.isNaN(dataPrimeiroVencimento.getTime())) {
        mostrarAviso('Informe o primeiro vencimento do parcelamento.', 'erro')
        return
      }
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: dataBanco,
      vencimento: dataBanco,
      centro_custo_id: centroCustoSeguro,
      filial_id: filialSegura,
      observacao: observacaoConta.trim() || null,
      imposto_tipo: tipoFiscal,
      competencia: competenciaFiscal,
      enviar_whatsapp: contaWhatsapp,
      enviar_email: contaEmail,
      enviar_push: contaPush,
      dias_aviso: Number(contaDiasAviso || diasAlertaContas || diasAvisoPadrao || 1),
      empresa_id: empresaId
    }

    let contaCriadaParaAuditoria = null

    const payloadRecorrencia = contaRecorrente ? {
      empresa_id: empresaId,
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      centro_custo_id: centroCustoSeguro,
      filial_id: filialSegura,
      tipo_recorrencia: tipoRecorrencia || 'mensal',
      dia_vencimento: diaRecorrencia,
      data_inicio: dataBanco,
      valor_variavel: valorVariavelRecorrencia === true
    } : null

    let error

    if (editandoContaId) {
      if (editandoSerieRecorrente) {
        if (!recorrenciaContaId || !payloadRecorrencia) {
          mostrarAviso('Nao foi possivel localizar a serie recorrente desta conta.', 'erro')
          return
        }

        const { error: erroRecorrencia } = await atualizarRecorrencia(supabase, recorrenciaContaId, empresaId, payloadRecorrencia)

        if (erroRecorrencia) {
          console.warn('Falha ao atualizar recorrencia da conta:', erroRecorrencia)
          mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'Nao foi possivel atualizar a serie recorrente.'), 'erro')
          return
        }

        fecharConta()
        await buscarContas()
        mostrarAviso('Serie recorrente atualizada com sucesso.', 'sucesso')
        return
      }

      const payloadConta = { ...payload }

      if (contaVinculadaRecorrencia) {
        payloadConta.recorrencia_id = recorrenciaContaId
      } else if (contaRecorrente && recorrenciaContaId) {
        payloadConta.recorrencia_id = recorrenciaContaId
      } else if (!contaRecorrente && recorrenciaContaId) {
        payloadConta.recorrencia_id = null
      }

      const resposta = await atualizarConta(supabase, editandoContaId, empresaId, payloadConta)
      error = resposta.error

      if (!error) {
        if (!contaVinculadaRecorrencia && contaRecorrente) {
          if (recorrenciaContaId) {
            const { error: erroRecorrencia } = await atualizarRecorrencia(supabase, recorrenciaContaId, empresaId, payloadRecorrencia)

            if (erroRecorrencia) {
              console.warn('Falha ao atualizar recorrencia da conta:', erroRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi atualizada, mas a recorrencia nao foi salva.'), 'erro')
              return
            }
          } else {
            const { data: recorrenciaSemelhante, error: erroRecorrenciaSemelhante } = await buscarRecorrenciaSemelhante(supabase, payloadRecorrencia)

            if (erroRecorrenciaSemelhante) {
              console.warn('Falha ao verificar recorrencia semelhante:', erroRecorrenciaSemelhante)
            }

            const payloadNovaRecorrencia = { ...payloadRecorrencia, ativo: true }
            const { data: dataRecorrencia, error: erroRecorrencia } = recorrenciaSemelhante?.id
              ? { data: recorrenciaSemelhante, error: null }
              : await criarRecorrencia(supabase, payloadNovaRecorrencia)

            if (erroRecorrencia) {
              console.warn('Falha ao criar recorrencia da conta atualizada:', erroRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi atualizada, mas a recorrencia nao foi salva.'), 'erro')
              return
            }

            const recorrenciaCriada = Array.isArray(dataRecorrencia) ? dataRecorrencia[0] : dataRecorrencia
            let recorrenciaIdCriada = recorrenciaCriada?.id

            if (recorrenciaSemelhante?.id) {
              const { error: erroValorVariavel } = await atualizarRecorrencia(
                supabase,
                recorrenciaSemelhante.id,
                empresaId,
                { valor_variavel: valorVariavelRecorrencia === true }
              )

              if (erroValorVariavel) {
                mostrarAviso(mensagemSeguraErro(erroValorVariavel, 'A conta foi atualizada, mas o tipo de valor da recorrencia nao foi salvo.'), 'erro')
                return
              }
            }

            if (!recorrenciaIdCriada) {
              const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
                supabase,
                empresaId,
                conta: {
                  id: editandoContaId,
                  descricao: primeiraLetraMaiuscula(descricao.trim()),
                  valor: converterValor(valor),
                  data_vencimento: dataBanco
                },
                dataBanco,
                descricaoConta: primeiraLetraMaiuscula(descricao.trim())
              })
              recorrenciaIdCriada = recorrenciaEncontrada?.id
            }

            if (!recorrenciaIdCriada) {
              mostrarAviso('A recorrencia foi criada, mas o sistema nao conseguiu localizar o vinculo.', 'erro')
              return
            }

            const { error: erroVinculoRecorrencia } = await vincularRecorrenciaNaConta(supabase, editandoContaId, empresaId, recorrenciaIdCriada)

            if (erroVinculoRecorrencia) {
              console.warn('Falha ao vincular recorrencia criada:', erroVinculoRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroVinculoRecorrencia, 'A recorrencia foi criada, mas nao foi vinculada a conta.'), 'erro')
              return
            }

            setRecorrenciaContaId(recorrenciaIdCriada)
            setContas((listaAtual) => listaAtual.map((conta) =>
              conta.id === editandoContaId ? { ...conta, recorrencia_id: recorrenciaIdCriada } : conta
            ))
          }
        } else if (!contaVinculadaRecorrencia && recorrenciaContaId) {
          const { error: erroDesativarRecorrencia } = await desativarRecorrencia(supabase, recorrenciaContaId, empresaId)

          if (erroDesativarRecorrencia) {
            console.warn('Falha ao desativar recorrencia da conta:', erroDesativarRecorrencia)
            mostrarAviso(mensagemSeguraErro(erroDesativarRecorrencia, 'A conta foi atualizada, mas a recorrencia nao foi desativada.'), 'erro')
            return
          }
        }
      }
    } else {
      if (criandoParcelamento) {
        const parcelas = montarParcelasConta({
          payloadBase: payload,
          valorTotal: valorTotalParcelamento,
          parcelasTotal: quantidadeParcelas,
          primeiroVencimento: primeiroVencimentoParcelamento
        })
        const { error: erroParcelamento } = await criarContasEmLote(supabase, parcelas)

        if (erroParcelamento) {
          console.warn('Falha ao criar parcelamento:', erroParcelamento)
          mostrarAviso(mensagemSeguraErro(erroParcelamento, 'Nao foi possivel criar o parcelamento.'), 'erro')
          return
        }

        fecharConta()
        await buscarContas()
        mostrarAviso(`Parcelamento criado com ${quantidadeParcelas} parcelas.`, 'sucesso')
        return
      }

      const resposta = await criarConta(supabase, { ...payload, status: 'pendente', excluido: false })
      error = resposta.error
      contaCriadaParaAuditoria = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data

      if (!error && contaRecorrente) {
        const { data: recorrenciaSemelhante, error: erroRecorrenciaSemelhante } = await buscarRecorrenciaSemelhante(supabase, payloadRecorrencia)

        if (erroRecorrenciaSemelhante) {
          console.warn('Falha ao verificar recorrência semelhante:', erroRecorrenciaSemelhante)
        }

        const payloadNovaRecorrencia = { ...payloadRecorrencia, ativo: true }
        const { data: dataRecorrencia, error: erroRecorrencia } = recorrenciaSemelhante?.id
          ? { data: recorrenciaSemelhante, error: null }
          : await criarRecorrencia(supabase, payloadNovaRecorrencia)

        if (erroRecorrencia) {
          console.warn('Falha ao criar recorrência da nova conta:', erroRecorrencia)
          mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi criada, mas a recorrência não foi salva.'), 'erro')
          return
        } else {
          const recorrenciaCriada = Array.isArray(dataRecorrencia) ? dataRecorrencia[0] : dataRecorrencia
          const contaCriada = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data
          let recorrenciaIdCriada = recorrenciaCriada?.id

          if (recorrenciaSemelhante?.id) {
            const { error: erroValorVariavel } = await atualizarRecorrencia(
              supabase,
              recorrenciaSemelhante.id,
              empresaId,
              { valor_variavel: valorVariavelRecorrencia === true }
            )

            if (erroValorVariavel) {
              mostrarAviso(mensagemSeguraErro(erroValorVariavel, 'A conta foi criada, mas o tipo de valor da recorrência não foi salvo.'), 'erro')
              return
            }
          }

          if (!recorrenciaIdCriada && contaCriada?.id) {
            const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
              supabase,
              empresaId,
              conta: contaCriada,
              dataBanco,
              descricaoConta: primeiraLetraMaiuscula(descricao.trim())
            })
            recorrenciaIdCriada = recorrenciaEncontrada?.id
          }

          if (!recorrenciaIdCriada) {
            mostrarAviso('A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.', 'erro')
            return
          }

          if (!contaCriada?.id) {
            mostrarAviso('A conta foi criada, mas o sistema não conseguiu localizar o vínculo da recorrência.', 'erro')
            return
          }

          const { error: erroVinculoRecorrencia } = await vincularRecorrenciaNaConta(supabase, contaCriada.id, empresaId, recorrenciaIdCriada)

          if (erroVinculoRecorrencia) {
            console.warn('Falha ao vincular recorrência da nova conta:', erroVinculoRecorrencia)
            mostrarAviso(mensagemSeguraErro(erroVinculoRecorrencia, 'A recorrência foi criada, mas não foi vinculada à conta.'), 'erro')
            return
          }
        }
      }
    }

    if (error) {
      if (erroEhSessaoExpirada(error)) {
        await supabase.auth.signOut()
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
      } else {
        console.warn('Falha ao salvar conta:', error)
        mostrarAviso(mensagemSeguraErro(error), 'erro')
      }
      return
    }

    fecharConta()
    if (contaCriadaParaAuditoria?.id) {
      registrarAuditoriaEventoFinanceiro(supabase, {
        empresa_id: empresaId,
        acao: 'financeiro.conta.criada',
        entidade_tipo: 'df_contas',
        entidade_id: contaCriadaParaAuditoria.id,
        modulo: 'financeiro',
        origem: 'app',
        severidade: 'media',
        status: 'sucesso',
        dados_antes: null,
        dados_depois: { campos: ['descricao', 'valor', 'vencimento', 'centro_custo', 'filial', 'imposto_tipo'] },
        metadados: { conta_id: contaCriadaParaAuditoria.id }
      }).catch((auditoriaError) => console.warn('Falha ao registrar auditoria da criação da conta.', { message: auditoriaError?.message }))
    }
    if (editandoContaId) {
      await registrarAuditoriaAtualizacaoConta({
        supabase,
        empresaId,
        contaId: editandoContaId,
        correlationId: correlationIdAtualizacao
      })
    }
    await buscarContas()
    mostrarAviso(editandoContaId ? 'Conta atualizada com sucesso.' : 'Conta criada com sucesso.', 'sucesso')
  }

  async function marcarComoPago(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso, pagamento } = contexto
    const resposta = pagamento
      ? await baixarContaComoPaga(supabase, id, empresaId, pagamento)
      : await atualizarStatusConta(supabase, id, empresaId, 'pago')
    const { error } = resposta

    if (error) {
      console.warn('Falha ao marcar conta como paga:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível marcar a conta como paga.'), 'erro')
      return false
    }

    await buscarContas()
    mostrarAviso?.('Conta marcada como paga.', 'sucesso')
    return true
  }

  async function corrigirPagamento(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso, pagamento } = contexto
    const { error } = await corrigirPagamentoConta(supabase, id, empresaId, pagamento)

    if (error) {
      console.warn('Falha ao corrigir pagamento da conta:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível corrigir o pagamento da conta.'), 'erro')
      return false
    }

    await buscarContas()
    mostrarAviso?.('Pagamento corrigido com sucesso.', 'sucesso')
    return true
  }

  async function registrarPagamentoParcial(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso, pagamento } = contexto
    const { auditoria, error } = await registrarPagamentoParcialService(supabase, id, empresaId, pagamento)

    if (error) {
      console.warn('Falha ao registrar pagamento parcial:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível registrar o pagamento parcial.'), 'erro')
      return false
    }

    if (auditoria) {
      registrarAuditoriaPagamentoParcialCriado(supabase, auditoria).then(({ error: auditoriaError }) => {
        if (auditoriaError) {
          console.warn('Falha ao registrar auditoria do pagamento parcial.', {
            message: auditoriaError?.message,
            code: auditoriaError?.code,
            status: auditoriaError?.status
          })
        }
      }).catch((auditoriaError) => {
        console.warn('Falha inesperada ao registrar auditoria do pagamento parcial.', {
          message: auditoriaError?.message
        })
      })
    }

    await buscarContas()
    mostrarAviso?.('Pagamento parcial registrado com sucesso.', 'sucesso')
    return true
  }

  async function listarPagamentosParciaisConta(contexto) {
    const { supabase, id, empresaId, mostrarAviso } = contexto
    const { data, error } = await listarPagamentosParciaisPorContas(supabase, empresaId, [id])

    if (error) {
      console.warn('Falha ao listar pagamentos parciais:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível carregar os pagamentos parciais.'), 'erro')
      return []
    }

    return data || []
  }

  async function estornarPagamentoParcial(contexto) {
    const { supabase, pagamentoId, contaId, empresaId, buscarContas, mostrarAviso } = contexto
    const { data, error } = await estornarPagamentoParcialService(
      supabase,
      pagamentoId,
      contaId,
      empresaId
    )

    if (error || !data?.id) {
      console.warn('Falha ao estornar pagamento parcial:', error)
      mostrarAviso?.(
        mensagemSeguraErro(error, 'Não foi possível estornar o pagamento parcial. Verifique sua permissão e tente novamente.'),
        'erro'
      )
      return false
    }

    registrarAuditoriaEventoFinanceiro(supabase, {
      empresa_id: empresaId,
      acao: 'financeiro.pagamento_parcial.estornado',
      entidade_tipo: 'df_contas_pagamentos',
      entidade_id: pagamentoId,
      modulo: 'financeiro',
      origem: 'app',
      severidade: 'alta',
      status: 'sucesso',
      dados_antes: { arquivado: false, conta_id: contaId },
      dados_depois: { arquivado: true, conta_id: contaId },
      metadados: { conta_id: contaId }
    }).catch((auditoriaError) => console.warn('Falha ao registrar auditoria do estorno parcial.', { message: auditoriaError?.message }))

    await buscarContas()
    mostrarAviso?.('Pagamento parcial estornado com sucesso.', 'sucesso')
    return true
  }

  async function baixarContaQuitadaPorParciais(contexto) {
    const { supabase, contaId, empresaId, buscarContas, mostrarAviso } = contexto
    const { data, error } = await baixarContaQuitadaPorParciaisService(supabase, contaId, empresaId)

    if (error || !data?.id) {
      console.warn('Falha ao baixar conta quitada por pagamentos parciais:', error)
      mostrarAviso?.(
        mensagemSeguraErro(error, 'Não foi possível baixar a conta após os pagamentos parciais.'),
        'erro'
      )
      return false
    }

    registrarAuditoriaEventoFinanceiro(supabase, {
      empresa_id: empresaId,
      acao: 'financeiro.conta.baixada',
      entidade_tipo: 'df_contas',
      entidade_id: contaId,
      modulo: 'financeiro',
      origem: 'app',
      severidade: 'alta',
      status: 'sucesso',
      dados_antes: { status: 'pendente', origem: 'pagamentos_parciais' },
      dados_depois: { status: 'pago', origem: 'pagamentos_parciais' },
      metadados: { conta_id: contaId }
    }).catch((auditoriaError) => console.warn('Falha ao registrar auditoria da baixa por parciais.', { message: auditoriaError?.message }))

    await buscarContas()
    mostrarAviso?.('Conta baixada após a quitação pelos pagamentos parciais.', 'sucesso')
    return true
  }

  async function voltarParaPendente(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso } = contexto
    const { error } = await estornarBaixaConta(supabase, id, empresaId)

    if (error) {
      console.warn('Falha ao estornar baixa da conta:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível estornar a baixa da conta.'), 'erro')
      return
    }

    registrarAuditoriaEventoFinanceiro(supabase, {
      empresa_id: empresaId,
      acao: 'financeiro.conta.baixa_estornada',
      entidade_tipo: 'df_contas',
      entidade_id: id,
      modulo: 'financeiro',
      origem: 'app',
      severidade: 'alta',
      status: 'sucesso',
      dados_antes: { status: 'pago' },
      dados_depois: { status: 'pendente' },
      metadados: { conta_id: id }
    }).catch((auditoriaError) => console.warn('Falha ao registrar auditoria da reabertura da conta.', { message: auditoriaError?.message }))

    await buscarContas()
    mostrarAviso?.('Baixa estornada. A conta voltou para aberta.', 'sucesso')
  }

  async function excluirConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, buscarLixeira, mostrarAviso } = contexto
    const { error } = await enviarContaParaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await Promise.all([buscarContas(), buscarLixeira()])
    mostrarAviso?.('Conta enviada para a lixeira.', 'sucesso')
  }

  async function ocultarConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await ocultarContaService(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarContas()
    mostrarAviso?.('Conta oculta da visão principal.', 'sucesso')
  }

  async function reexibirConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await reexibirContaService(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarContas()
    mostrarAviso?.('Conta reexibida na visão principal.', 'sucesso')
  }

  async function cancelarGrupoParcelamento(contexto) {
    const { supabase, empresaId, grupoParcelamentoId, buscarContas, mostrarAviso, fecharConta } = contexto
    const { data, error } = await cancelarGrupoParcelamentoService(supabase, empresaId, grupoParcelamentoId)

    if (error) {
      console.warn('Falha ao cancelar parcelamento:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Nao foi possivel cancelar o parcelamento.'), 'erro')
      return false
    }

    await buscarContas()
    fecharConta?.()
    mostrarAviso?.('Parcelamento cancelado. As parcelas foram ocultadas.', 'sucesso')
    return Array.isArray(data) && data.length > 0
  }

  async function desativarSerieRecorrente(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await desativarRecorrencia(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return false
    }

    await buscarContas()
    mostrarAviso?.('Série recorrente desativada.', 'sucesso')
    return true
  }

  async function reativarSerieRecorrente(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await reativarRecorrencia(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return false
    }

    await buscarContas()
    mostrarAviso?.('Série recorrente reativada.', 'sucesso')
    return true
  }

  return {
    contas,
    setContas,
    contasLixeira,
    setContasLixeira,
    seriesRecorrentes,
    setSeriesRecorrentes,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroCentro,
    setFiltroCentro,
    filtroFilial,
    setFiltroFilial,
    filtroMes,
    setFiltroMes,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    loading,
    setLoading,
    salvandoConta,
    modalConta,
    setModalConta,
    editandoContaId,
    setEditandoContaId,
    descricao,
    setDescricao,
    valor,
    setValor,
    dataVencimento,
    setDataVencimento,
    centroCustoId,
    setCentroCustoId,
    filialId,
    setFilialId,
    observacaoConta,
    setObservacaoConta,
    impostoTipoConta,
    setImpostoTipoConta,
    competenciaConta,
    setCompetenciaConta,
    contaWhatsapp,
    setContaWhatsapp,
    contaEmail,
    setContaEmail,
    contaPush,
    setContaPush,
    contaDiasAviso,
    setContaDiasAviso,
    contaRecorrente,
    setContaRecorrente,
    contaParcelada,
    setContaParcelada,
    parcelamentoTotal,
    setParcelamentoTotal,
    parcelamentoQuantidade,
    setParcelamentoQuantidade,
    parcelamentoPrimeiroVencimento,
    setParcelamentoPrimeiroVencimento,
    tipoRecorrencia,
    setTipoRecorrencia,
    diaVencimentoRecorrencia,
    setDiaVencimentoRecorrencia,
    valorVariavelRecorrencia,
    setValorVariavelRecorrencia,
    recorrenciaContaId,
    setRecorrenciaContaId,
    escopoEdicaoRecorrencia,
    recorrenciaEdicaoCarregada,
    parcelamentoGrupoConta,
    parcelamentoGrupoParcelas,
    carregandoParcelamentoGrupo,
    erroParcelamentoGrupo,
    alterarEscopoEdicaoRecorrencia,
    buscarContas,
    abrirNovaConta,
    abrirEdicaoConta,
    fecharConta,
    salvarConta,
    marcarComoPago,
    corrigirPagamento,
    registrarPagamentoParcial,
    listarPagamentosParciaisConta,
    estornarPagamentoParcial,
    baixarContaQuitadaPorParciais,
    voltarParaPendente,
    excluirConta,
    ocultarConta,
    reexibirConta,
    cancelarGrupoParcelamento,
    desativarSerieRecorrente,
    reativarSerieRecorrente
  }
}
