import { useEffect, useMemo, useRef, useState } from 'react'
import { useFuncionariosExamesPeriodicos } from '../hooks/useFuncionariosExamesPeriodicos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionariosDesligamentos } from '../hooks/useFuncionariosDesligamentos'
import { FilterCard, FilterGrid, KpiCard, KpiGrid, PageHeader, PageState } from '../components/shared/PagePatterns.jsx'
import { mensagemSeguraErro } from '../utils/session'
import {
  admissaoFoiAlterada,
  impactoAdmissaoCorresponde,
  mensagemErroAdmissao,
  motivoAdmissaoValido,
  separarAdmissaoDoPayload
} from '../modules/funcionarios/domain/admissaoFuncionarioRules'
import './FuncionariosPage.css'
const FORMULARIO_INICIAL = {
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  cpf: '',
  data_nascimento: '',
  data_admissao: '',
  data_exame_admissional: '',
  status: 'ativo',
  filial_id: '',
  observacoes: ''
}

const STATUS_LABELS = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  desligado: 'Desligado'
}

const MODAL_SECOES_INICIAIS = {
  dados: true,
  vinculo: true,
  datas: true,
  observacoes: false,
  exames: true
}

const LIMITE_FUNCIONARIOS_INICIAL = 8
const FORMULARIO_DESLIGAMENTO_INICIAL = {
  motivo: '',
  dataEfetiva: '',
  observacoes: '',
  motivoCancelamento: ''
}
const FORMULARIO_CORRECAO_INICIAL = {
  tipo: '',
  dataEfetiva: '',
  motivo: '',
  observacoes: '',
  motivoCorrecao: ''
}

const CONECTIVOS_NOME_CARGO = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '')
}

function normalizarCapitalizacao(valor) {
  return String(valor || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((palavra, indice) => {
      const palavraNormalizada = palavra.toLocaleLowerCase('pt-BR')
      if (indice > 0 && CONECTIVOS_NOME_CARGO.has(palavraNormalizada)) return palavraNormalizada
      return palavraNormalizada.charAt(0).toLocaleUpperCase('pt-BR') + palavraNormalizada.slice(1)
    })
    .join(' ')
}

function normalizarTextoBusca(valor) {
  return String(valor || '').trim().toLowerCase()
}

function formatarDataCurta(data) {
  if (!data) return 'Não informada'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${String(data).slice(0, 10)}T00:00:00`))
  } catch {
    return 'Não informada'
  }
}

function obterIniciais(nome) {
  const partes = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (partes.length === 0) return 'F'

  return partes.map((parte) => parte.charAt(0).toLocaleUpperCase('pt-BR')).join('')
}

function fazAniversarioNoMes(data, dataReferencia = new Date()) {
  if (!data) return false

  const partes = String(data).slice(0, 10).split('-')
  if (partes.length < 2) return false

  const mes = Number(partes[1])
  return mes === dataReferencia.getMonth() + 1
}

function montarFormulario(funcionario) {
  if (!funcionario) return FORMULARIO_INICIAL

  return {
    nome: funcionario.nome || '',
    cargo: funcionario.cargo || '',
    telefone: funcionario.telefone || '',
    email: funcionario.email || '',
    cpf: funcionario.cpf || '',
    data_nascimento: funcionario.data_nascimento || '',
    data_admissao: funcionario.data_admissao || '',
    data_exame_admissional: funcionario.data_exame_admissional || '',
    status: funcionario.status || 'ativo',
    filial_id: funcionario.filial_id || '',
    observacoes: funcionario.observacoes || ''
  }
}

function montarPayloadFormulario(formulario) {
  return {
    nome: normalizarCapitalizacao(formulario.nome),
    cargo: normalizarCapitalizacao(formulario.cargo),
    telefone: formulario.telefone,
    email: formulario.email,
    cpf: apenasDigitos(formulario.cpf),
    data_nascimento: formulario.data_nascimento,
    data_admissao: formulario.data_admissao,
    data_exame_admissional: formulario.data_exame_admissional,
    status: formulario.status,
    filial_id: formulario.filial_id,
    observacoes: formulario.observacoes
  }
}

export default function FuncionariosPage({
  empresaId,
  empresaNome,
  filiais = [],
  mostrarAviso,
  podeEditar = false,
  contextoNavegacao = null,
  voltarPainel
}) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [funcionarioEditando, setFuncionarioEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [mostrarExamesArquivados, setMostrarExamesArquivados] = useState(false)
  const [dataExamePeriodico, setDataExamePeriodico] = useState('')
  const [exameEditandoId, setExameEditandoId] = useState('')
  const [dataExameEditando, setDataExameEditando] = useState('')
  const [mostrarTodosFuncionarios, setMostrarTodosFuncionarios] = useState(false)
  const [modalSecoesAbertas, setModalSecoesAbertas] = useState(MODAL_SECOES_INICIAIS)
  const [impactoAdmissao, setImpactoAdmissao] = useState(null)
  const [motivoAdmissao, setMotivoAdmissao] = useState('')
  const [modalDesligamentoAberto, setModalDesligamentoAberto] = useState(false)
  const [funcionarioDesligamento, setFuncionarioDesligamento] = useState(null)
  const [formularioDesligamento, setFormularioDesligamento] = useState(FORMULARIO_DESLIGAMENTO_INICIAL)
  const [confirmacaoConclusaoAberta, setConfirmacaoConclusaoAberta] = useState(false)
  const [formularioCorrecao, setFormularioCorrecao] = useState(FORMULARIO_CORRECAO_INICIAL)
  const contextoAplicadoRef = useRef('')

  const {
    funcionarios,
    loading,
    salvando,
    erro,
    criarFuncionario,
    atualizarFuncionario,
    alterarAdmissaoFuncionario,
    arquivarFuncionario,
    reativarFuncionario,
    obterFuncionarioPorId,
    carregarFuncionarios,
    limparErro
  } = useFuncionarios({
    empresaId,
    incluirArquivados
  })

  const {
    desligamentos,
    correcoes,
    loading: loadingDesligamentos,
    salvando: salvandoDesligamento,
    erro: erroDesligamentos,
    carregar: carregarDesligamentos,
    abrir: abrirDesligamento,
    atualizar: atualizarDesligamento,
    cancelar: cancelarDesligamento,
    concluir: concluirDesligamento,
    retificar: retificarDesligamento,
    reverterPorErro: reverterDesligamentoPorErro
  } = useFuncionariosDesligamentos({ empresaId })

  const {
    exames,
    loading: loadingExames,
    salvando: salvandoExames,
    erro: erroExames,
    criarExamePeriodico,
    atualizarExamePeriodico,
    arquivarExamePeriodico,
    reativarExamePeriodico,
    carregarExamesPeriodicos,
    calcularProximoPeriodico,
    limparErro: limparErroExames
  } = useFuncionariosExamesPeriodicos({
    empresaId,
    funcionarioId: funcionarioEditando?.id,
    incluirArquivados: mostrarExamesArquivados,
    autoCarregar: modalAberto && Boolean(funcionarioEditando?.id)
  })

  const filiaisPorId = useMemo(() => {
    return Object.fromEntries((filiais || []).map((filial) => [filial.id, filial.nome || 'Filial']))
  }, [filiais])

  const desligamentosPorFuncionario = useMemo(() => {
    const mapa = new Map()
    for (const desligamento of desligamentos || []) {
      const lista = mapa.get(desligamento.funcionario_id) || []
      lista.push(desligamento)
      mapa.set(desligamento.funcionario_id, lista)
    }
    return mapa
  }, [desligamentos])

  const historicoDesligamentoSelecionado = funcionarioDesligamento?.id
    ? desligamentosPorFuncionario.get(funcionarioDesligamento.id) || []
    : []
  const desligamentoAbertoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'ABERTO') || null
  const desligamentoConcluidoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'CONCLUIDO') || null
  const desligamentoConcluidoEfetivoSelecionado = historicoDesligamentoSelecionado.find((item) => item.estado === 'CONCLUIDO' && !item.efeito_revertido) || null
  const correcoesPorDesligamento = useMemo(() => {
    const mapa = new Map()
    for (const correcao of correcoes || []) {
      const lista = mapa.get(correcao.desligamento_id) || []
      lista.push(correcao)
      mapa.set(correcao.desligamento_id, lista)
    }
    return mapa
  }, [correcoes])

  const funcionariosFiltrados = useMemo(() => {
    const termo = normalizarTextoBusca(busca)

    return (funcionarios || []).filter((funcionario) => {
      if (statusFiltro !== 'todos' && funcionario.status !== statusFiltro) return false

      if (!termo) return true

      const camposBusca = [
        funcionario.nome,
        funcionario.cargo,
        filiaisPorId[funcionario.filial_id]
      ].map(normalizarTextoBusca)

      return camposBusca.some((campo) => campo.includes(termo))
    })
  }, [busca, filiaisPorId, funcionarios, statusFiltro])

  const funcionariosRenderizados = useMemo(() => {
    if (mostrarTodosFuncionarios) return funcionariosFiltrados
    return funcionariosFiltrados.slice(0, LIMITE_FUNCIONARIOS_INICIAL)
  }, [funcionariosFiltrados, mostrarTodosFuncionarios])

  const resumoEquipe = useMemo(() => {
    const lista = funcionarios || []
    const ativos = lista.filter((funcionario) => !funcionario.arquivado && (funcionario.status || 'ativo') === 'ativo')
    const afastados = lista.filter((funcionario) => !funcionario.arquivado && funcionario.status === 'afastado')
    const inativos = lista.filter((funcionario) => funcionario.arquivado || funcionario.status === 'desligado')
    const aniversariantes = lista.filter((funcionario) => !funcionario.arquivado && fazAniversarioNoMes(funcionario.data_nascimento))

    return {
      ativos: ativos.length,
      afastados: afastados.length,
      inativos: inativos.length,
      aniversariantes: aniversariantes.length
    }
  }, [funcionarios])

  const examesAtivos = useMemo(() => {
    return (exames || [])
      .filter((exame) => !exame.arquivado)
      .sort((a, b) => String(b.data_exame || '').localeCompare(String(a.data_exame || '')))
  }, [exames])

  const dataBaseProximoPeriodico = examesAtivos[0]?.data_exame || formulario.data_exame_admissional
  const proximoPeriodicoPrevisto = dataBaseProximoPeriodico
    ? calcularProximoPeriodico(dataBaseProximoPeriodico)
    : null
  const origemProximoPeriodico = examesAtivos[0]?.data_exame
    ? 'último exame periódico registrado'
    : formulario.data_exame_admissional
      ? 'exame admissional'
      : ''

  useEffect(() => {
    contextoAplicadoRef.current = ''
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    limparErro?.()
    limparErroExames?.()
  }, [empresaId])

  function atualizarCampo(campo, valor) {
    if (campo === 'data_admissao') {
      setImpactoAdmissao(null)
      setMotivoAdmissao('')
    }
    setFormulario((atual) => ({
      ...atual,
      [campo]: campo === 'cpf' ? apenasDigitos(valor).slice(0, 11) : valor
    }))
  }

  function normalizarCampoCapitalizado(campo) {
    if (!['nome', 'cargo'].includes(campo)) return
    setFormulario((atual) => ({
      ...atual,
      [campo]: normalizarCapitalizacao(atual[campo])
    }))
  }

  function abrirNovoFuncionario() {
    if (!empresaId || !podeEditar) return
    limparErro?.()
    limparErroExames?.()
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    setModalSecoesAbertas(MODAL_SECOES_INICIAIS)
    setModalAberto(true)
  }

  async function abrirEdicaoFuncionario(funcionario) {
    if (!funcionario?.id || !podeEditar) return
    limparErro?.()
    limparErroExames?.()

    const resposta = await obterFuncionarioPorId(funcionario.id)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível carregar os dados completos do funcionário.'), 'erro')
      return
    }

    const funcionarioDetalhado = resposta?.data || funcionario
    setFuncionarioEditando(funcionarioDetalhado)
    setFormulario(montarFormulario(funcionarioDetalhado))
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    setModalSecoesAbertas(MODAL_SECOES_INICIAIS)
    setModalAberto(true)
  }

  useEffect(() => {
    const funcionarioId = String(contextoNavegacao?.funcionarioId || contextoNavegacao?.id || '')
    if (!funcionarioId || contextoAplicadoRef.current === funcionarioId || loading || !podeEditar) return
    const funcionario = (funcionarios || []).find((item) => String(item?.id || '') === funcionarioId)
    if (!funcionario) return
    contextoAplicadoRef.current = funcionarioId
    abrirEdicaoFuncionario(funcionario)
  }, [contextoNavegacao, funcionarios, loading, podeEditar])

  function fecharFormulario() {
    setModalAberto(false)
    setFuncionarioEditando(null)
    setFormulario(FORMULARIO_INICIAL)
    setImpactoAdmissao(null)
    setMotivoAdmissao('')
    setMostrarExamesArquivados(false)
    limparFormularioExamePeriodico()
    limparErroExames?.()
  }

  function alternarSecaoModal(secao) {
    setModalSecoesAbertas((atual) => ({
      ...atual,
      [secao]: !atual[secao]
    }))
  }

  function limparFormularioExamePeriodico() {
    setDataExamePeriodico('')
    setExameEditandoId('')
    setDataExameEditando('')
  }

  async function salvarFormulario(event) {
    event.preventDefault()
    if (!empresaId || !podeEditar || salvando) return

    if (!String(formulario.nome || '').trim()) {
      setModalSecoesAbertas((atual) => ({ ...atual, dados: true }))
      mostrarAviso?.('Informe o nome completo do funcionário.', 'erro')
      return
    }

    const payload = montarPayloadFormulario(formulario)
    let resposta

    if (!funcionarioEditando?.id) {
      resposta = await criarFuncionario(payload)
    } else {
      const alterouAdmissao = admissaoFoiAlterada(funcionarioEditando, payload.data_admissao)
      const { dataAdmissao, demaisCampos } = separarAdmissaoDoPayload(payload)

      if (alterouAdmissao && funcionarioEditando.status !== payload.status) {
        setModalSecoesAbertas((atual) => ({ ...atual, vinculo: true, datas: true }))
        mostrarAviso?.('Salve primeiro a alteração de status e depois altere a data de admissão.', 'erro')
        return
      }

      if (alterouAdmissao && !impactoAdmissaoCorresponde(impactoAdmissao, dataAdmissao)) {
        const preflight = await alterarAdmissaoFuncionario(funcionarioEditando.id, {
          novaDataAdmissao: dataAdmissao,
          somentePreflight: true
        })

        if (preflight?.error) {
          const fallback = mensagemSeguraErro(preflight.error, 'Não foi possível validar a alteração da admissão.')
          mostrarAviso?.(mensagemErroAdmissao(preflight.error, fallback), 'erro')
          return
        }

        setImpactoAdmissao(preflight?.data || null)
        setModalSecoesAbertas((atual) => ({ ...atual, datas: true }))
        mostrarAviso?.('Revise o impacto da admissão e salve novamente para confirmar.', 'info')
        return
      }

      if (alterouAdmissao && impactoAdmissao?.motivo_obrigatorio && !motivoAdmissaoValido(motivoAdmissao)) {
        mostrarAviso?.('Informe um motivo com pelo menos 5 caracteres para preservar os ciclos existentes.', 'erro')
        return
      }

      let resultadoAdmissao = null
      if (alterouAdmissao) {
        resposta = await alterarAdmissaoFuncionario(funcionarioEditando.id, {
          novaDataAdmissao: dataAdmissao,
          confirmarCiclosPreservados: Boolean(impactoAdmissao?.requer_confirmacao),
          motivo: motivoAdmissao
        })

        if (resposta?.error) {
          const fallback = mensagemSeguraErro(resposta.error, 'Não foi possível alterar a data de admissão.')
          mostrarAviso?.(mensagemErroAdmissao(resposta.error, fallback), 'erro')
          return
        }
        resultadoAdmissao = resposta?.data || null
        if (resultadoAdmissao?.requer_confirmacao && !resultadoAdmissao?.aplicado) {
          setImpactoAdmissao(resultadoAdmissao)
          mostrarAviso?.('Os ciclos foram alterados desde a validação. Revise o impacto e confirme novamente.', 'info')
          return
        }
      }

      resposta = await atualizarFuncionario(funcionarioEditando.id, demaisCampos)
      if (!resposta?.error && resultadoAdmissao?.ciclo_criado_id) {
        resposta.cicloCriadoId = resultadoAdmissao.ciclo_criado_id
      }
    }

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o funcionário.'), 'erro')
      return
    }

    mostrarAviso?.(
      resposta?.cicloCriadoId
        ? 'Funcionário atualizado e primeiro ciclo de férias criado.'
        : funcionarioEditando?.id ? 'Funcionário atualizado.' : 'Funcionário cadastrado.',
      'sucesso'
    )
    fecharFormulario()
  }

  async function alternarArquivamento(funcionario) {
    if (!funcionario?.id || !empresaId || !podeEditar || salvando) return

    const nomeFuncionario = funcionario.nome || 'este funcionário'
    const mensagemConfirmacao = funcionario.arquivado
      ? `Reativar o cadastro de ${nomeFuncionario}? Ele voltará para a lista principal.`
      : `Arquivar o cadastro de ${nomeFuncionario}? Ele sairá da lista principal, mas poderá ser reativado em "Mostrar arquivados".`

    if (!window.confirm(mensagemConfirmacao)) return

    const resposta = funcionario.arquivado
      ? await reativarFuncionario(funcionario.id)
      : await arquivarFuncionario(funcionario.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o cadastro.'), 'erro')
      return
    }

    mostrarAviso?.(
      funcionario.arquivado
        ? 'Cadastro reativado e disponível na lista principal.'
        : 'Cadastro arquivado. Ative "Mostrar arquivados" para localizar e reativar.',
      'sucesso'
    )
  }

  function abrirModalDesligamento(funcionario) {
    const historico = desligamentosPorFuncionario.get(funcionario?.id) || []
    if (!funcionario?.id || funcionario.arquivado || !podeEditar) return
    if (funcionario.status === 'desligado' && historico.length === 0) return
    const aberto = historico.find((item) => item.estado === 'ABERTO')
    setFuncionarioDesligamento(funcionario)
    setFormularioDesligamento(aberto ? {
      motivo: aberto.motivo || '',
      dataEfetiva: aberto.data_efetiva || '',
      observacoes: aberto.observacoes || '',
      motivoCancelamento: ''
    } : FORMULARIO_DESLIGAMENTO_INICIAL)
    setModalDesligamentoAberto(true)
  }

  function fecharModalDesligamento() {
    if (salvandoDesligamento) return
    setConfirmacaoConclusaoAberta(false)
    setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)
    setModalDesligamentoAberto(false)
    setFuncionarioDesligamento(null)
    setFormularioDesligamento(FORMULARIO_DESLIGAMENTO_INICIAL)
  }

  function atualizarCampoDesligamento(campo, valor) {
    setFormularioDesligamento((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvarWorkflowDesligamento(event) {
    event.preventDefault()
    if (!funcionarioDesligamento?.id || salvandoDesligamento) return
    const dados = {
      motivo: formularioDesligamento.motivo,
      dataEfetiva: formularioDesligamento.dataEfetiva,
      observacoes: formularioDesligamento.observacoes
    }
    const resposta = desligamentoAbertoSelecionado
      ? await atualizarDesligamento(desligamentoAbertoSelecionado.id, dados)
      : await abrirDesligamento(funcionarioDesligamento.id, dados)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o processo de desligamento.'), 'erro')
      return
    }
    mostrarAviso?.(
      desligamentoAbertoSelecionado ? 'Processo de desligamento atualizado.' : 'Processo de desligamento iniciado sem alterar o status da colaboradora.',
      'sucesso'
    )
  }

  async function cancelarWorkflowDesligamento() {
    if (!desligamentoAbertoSelecionado?.id || salvandoDesligamento) return
    if (String(formularioDesligamento.motivoCancelamento || '').trim().length < 3) {
      mostrarAviso?.('Informe o motivo do cancelamento.', 'erro')
      return
    }
    const resposta = await cancelarDesligamento(
      desligamentoAbertoSelecionado.id,
      formularioDesligamento.motivoCancelamento
    )
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível cancelar o processo.'), 'erro')
      return
    }
    setFormularioDesligamento(FORMULARIO_DESLIGAMENTO_INICIAL)
    mostrarAviso?.('Processo cancelado. O status funcional permaneceu inalterado.', 'sucesso')
  }

  async function concluirWorkflowDesligamento() {
    if (!desligamentoAbertoSelecionado?.id || salvandoDesligamento) return
    const resposta = await concluirDesligamento(desligamentoAbertoSelecionado.id)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível concluir o desligamento.'), 'erro')
      return
    }
    await carregarFuncionarios()
    setFuncionarioDesligamento((atual) => atual ? { ...atual, status: 'desligado', arquivado: false } : atual)
    setConfirmacaoConclusaoAberta(false)
    mostrarAviso?.('Desligamento concluído. O cadastro permanece disponível e não foi arquivado.', 'sucesso')
  }

  function abrirRetificacao() {
    if (!desligamentoConcluidoEfetivoSelecionado) return
    setFormularioCorrecao({
      tipo: 'RETIFICACAO',
      dataEfetiva: desligamentoConcluidoEfetivoSelecionado.data_efetiva_efetiva || desligamentoConcluidoEfetivoSelecionado.data_efetiva || '',
      motivo: desligamentoConcluidoEfetivoSelecionado.motivo_efetivo || desligamentoConcluidoEfetivoSelecionado.motivo || '',
      observacoes: desligamentoConcluidoEfetivoSelecionado.observacoes_efetivas || '',
      motivoCorrecao: ''
    })
  }

  function abrirReversaoPorErro() {
    if (!desligamentoConcluidoEfetivoSelecionado) return
    setFormularioCorrecao({ ...FORMULARIO_CORRECAO_INICIAL, tipo: 'REVERSAO_ERRO' })
  }

  async function salvarCorrecaoDesligamento(event) {
    event.preventDefault()
    if (!desligamentoConcluidoEfetivoSelecionado?.id || salvandoDesligamento) return
    const resposta = formularioCorrecao.tipo === 'RETIFICACAO'
      ? await retificarDesligamento(desligamentoConcluidoEfetivoSelecionado.id, formularioCorrecao)
      : await reverterDesligamentoPorErro(desligamentoConcluidoEfetivoSelecionado.id, formularioCorrecao.motivoCorrecao)
    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível registrar a correção.'), 'erro')
      return
    }
    if (formularioCorrecao.tipo === 'REVERSAO_ERRO') {
      await carregarFuncionarios()
      setFuncionarioDesligamento((atual) => atual ? { ...atual, status: resposta.data?.status_funcional || 'ativo' } : atual)
      mostrarAviso?.('Conclusão revertida por erro. O workflow original foi preservado.', 'sucesso')
    } else {
      mostrarAviso?.('Retificação registrada sem reativar o vínculo.', 'sucesso')
    }
    setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)
  }

  async function adicionarExamePeriodico() {
    if (!empresaId || !funcionarioEditando?.id || !podeEditar || salvandoExames) return

    if (!dataExamePeriodico) {
      mostrarAviso?.('Informe a data do exame periódico.', 'erro')
      return
    }

    const resposta = await criarExamePeriodico(dataExamePeriodico, {
      funcionarioId: funcionarioEditando.id
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o exame periódico.'), 'erro')
      return
    }

    setDataExamePeriodico('')
    mostrarAviso?.('Exame periódico registrado.', 'sucesso')
  }

  function iniciarEdicaoExame(exame) {
    if (!exame?.id || !podeEditar) return
    limparErroExames?.()
    setExameEditandoId(exame.id)
    setDataExameEditando(exame.data_exame || '')
  }

  function cancelarEdicaoExame() {
    setExameEditandoId('')
    setDataExameEditando('')
  }

  async function salvarEdicaoExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames) return

    if (!dataExameEditando) {
      mostrarAviso?.('Informe a data do exame periódico.', 'erro')
      return
    }

    const resposta = await atualizarExamePeriodico(exame.id, dataExameEditando)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o exame periódico.'), 'erro')
      return
    }

    cancelarEdicaoExame()
    mostrarAviso?.('Exame periódico atualizado.', 'sucesso')
  }

  async function alternarArquivamentoExame(exame) {
    if (!exame?.id || !empresaId || !podeEditar || salvandoExames) return

    const resposta = exame.arquivado
      ? await reativarExamePeriodico(exame.id)
      : await arquivarExamePeriodico(exame.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o exame periódico.'), 'erro')
      return
    }

    if (exameEditandoId === exame.id) cancelarEdicaoExame()
    mostrarAviso?.(exame.arquivado ? 'Exame periódico reativado.' : 'Exame periódico arquivado.', 'sucesso')
  }

  return (
    <div className="funcionarios-page">
      <PageHeader
        kicker="Gestão de Pessoas"
        title="Funcionários"
        description="Cadastro operacional da equipe, vínculos e exames periódicos."
        meta={<>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></>}
        className="funcionarios-page-hero"
        actionsClassName="funcionarios-hero-actions"
        actions={<>
          <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={voltarPainel}>← Painel</button>
          {podeEditar && (
            <button className="funcionarios-btn funcionarios-btn-primary" type="button" disabled={!empresaId} onClick={abrirNovoFuncionario}>
              Novo funcionário
            </button>
          )}
        </>}
      />

      <section className="funcionarios-panel">
        <FilterCard className="funcionarios-filters" description="Busque a equipe sem expor CPF, documentos, salário ou dados clínicos.">
        <FilterGrid className="funcionarios-control-card">
          <label className="funcionarios-field funcionarios-field-search">
            <span>Busca</span>
            <input
              className="funcionarios-input"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value)
                setMostrarTodosFuncionarios(false)
              }}
              placeholder="Buscar por nome, cargo ou filial"
              disabled={!empresaId}
            />
          </label>
          <label className="funcionarios-field">
            <span>Status</span>
            <select
              className="funcionarios-input"
              value={statusFiltro}
              onChange={(event) => {
                setStatusFiltro(event.target.value)
                setMostrarTodosFuncionarios(false)
              }}
              disabled={!empresaId}
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="afastado">Afastados</option>
              <option value="desligado">Desligados</option>
            </select>
          </label>
          <label className={`funcionarios-switch ${incluirArquivados ? 'ativo' : ''}`}>
            <input
              type="checkbox"
              checked={incluirArquivados}
              onChange={(event) => {
                setIncluirArquivados(event.target.checked)
                setMostrarTodosFuncionarios(false)
              }}
              disabled={!empresaId}
            />
            <span className="funcionarios-switch-indicator" aria-hidden="true" />
            <span>Mostrar arquivados</span>
          </label>
        </FilterGrid>
        </FilterCard>

        <KpiGrid className="funcionarios-summary" aria-label="Resumo da equipe">
          <KpiCard label="Equipe ativa" value={resumoEquipe.ativos} tone="success" />
          <KpiCard label="Afastados" value={resumoEquipe.afastados} tone="warning" />
          <KpiCard label="Aniversariantes" value={resumoEquipe.aniversariantes} />
          <KpiCard label="Inativos" value={resumoEquipe.inativos} />
        </KpiGrid>

        {!empresaId ? (
          <PageState title="Empresa ativa necessária" description="Selecione uma empresa para carregar os funcionários." />
        ) : loading ? (
          <PageState type="loading" title="Carregando funcionários…" description="Consultando a equipe da empresa ativa." />
        ) : erro ? (
          <PageState type="error" title="Não foi possível carregar" description={erro} actionLabel="Tentar novamente" onAction={() => carregarFuncionarios()} />
        ) : funcionariosFiltrados.length === 0 ? (
          <PageState title="Nenhum funcionário encontrado" description={podeEditar ? 'Cadastre o primeiro colaborador desta empresa.' : 'Não há colaboradores disponíveis para esta empresa.'} />
        ) : (
          <>
          <div className="funcionarios-results-strip">
            <span>{funcionariosFiltrados.length} colaborador(es) no recorte atual</span>
            {!mostrarTodosFuncionarios && funcionariosFiltrados.length > LIMITE_FUNCIONARIOS_INICIAL && (
              <small>Exibindo {LIMITE_FUNCIONARIOS_INICIAL} inicialmente para facilitar a leitura no mobile.</small>
            )}
          </div>

          <div className="funcionarios-list">
            {funcionariosRenderizados.map((funcionario) => {
              const status = funcionario.arquivado ? 'arquivado' : (funcionario.status || 'ativo')
              const filialNome = filiaisPorId[funcionario.filial_id] || 'Sem filial'

              return (
                <article key={funcionario.id} className={`funcionario-card funcionario-card-${status} ${funcionario.arquivado ? 'arquivado' : ''}`}>
                  <div className="funcionario-main">
                    <span className="funcionario-avatar" aria-hidden="true">{obterIniciais(funcionario.nome)}</span>
                    <div>
                      <h3>{funcionario.nome || 'Funcionário sem nome'}</h3>
                      <small>{funcionario.cargo || 'Cargo não informado'}</small>
                    </div>
                  </div>

                  <div className="funcionario-meta">
                    <span className={`funcionario-status ${status}`}>{funcionario.arquivado ? 'Arquivado' : STATUS_LABELS[status] || status}</span>
                    <small>Filial: {filialNome}</small>
                    <small>Admissão: {formatarDataCurta(funcionario.data_admissao)}</small>
                    {funcionario.telefone && <small>Telefone: {funcionario.telefone}</small>}
                    {funcionario.email && <small>E-mail: {funcionario.email}</small>}
                  </div>

                  <div className="funcionario-actions">
                    {podeEditar && (
                      <>
                        <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvando} onClick={() => abrirEdicaoFuncionario(funcionario)}>
                          Editar
                        </button>
                        {!funcionario.arquivado && (funcionario.status !== 'desligado' || (desligamentosPorFuncionario.get(funcionario.id) || []).length > 0) && (
                          <button
                            className="funcionarios-btn funcionarios-btn-secondary"
                            type="button"
                            disabled={salvando || loadingDesligamentos}
                            onClick={() => abrirModalDesligamento(funcionario)}
                          >
                            {funcionario.status === 'desligado'
                              ? 'Ver histórico'
                              : (desligamentosPorFuncionario.get(funcionario.id) || []).some((item) => item.estado === 'ABERTO')
                              ? 'Ver desligamento'
                              : 'Iniciar desligamento'}
                          </button>
                        )}
                        <button
                          className={`funcionarios-btn ${funcionario.arquivado ? 'funcionarios-btn-primary' : 'funcionarios-btn-danger'}`}
                          type="button"
                          disabled={salvando}
                          onClick={() => alternarArquivamento(funcionario)}
                        >
                          {funcionario.arquivado ? 'Reativar cadastro' : 'Arquivar cadastro'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
          {funcionariosFiltrados.length > LIMITE_FUNCIONARIOS_INICIAL && (
            <button
              className="funcionarios-inline-action"
              type="button"
              onClick={() => setMostrarTodosFuncionarios((atual) => !atual)}
            >
              {mostrarTodosFuncionarios ? 'Recolher lista' : `Ver todos os ${funcionariosFiltrados.length} colaboradores`}
            </button>
          )}
          </>
        )}
      </section>

      {modalDesligamentoAberto && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharModalDesligamento}>
          <form className="funcionario-modal funcionario-desligamento-modal" role="dialog" aria-modal="true" aria-labelledby="desligamento-modal-title" onSubmit={salvarWorkflowDesligamento} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Desligamento 2B</span>
                <h2 id="desligamento-modal-title">Processo de desligamento</h2>
                <p>{funcionarioDesligamento.nome || 'Colaboradora selecionada'}</p>
              </div>
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharModalDesligamento} disabled={salvandoDesligamento}>Fechar</button>
            </div>

            <div className={`funcionario-desligamento-alerta ${desligamentoConcluidoSelecionado ? 'is-concluido' : ''}`} role="status">
              {desligamentoConcluidoEfetivoSelecionado ? (
                <>
                  <strong>Desligamento concluído — status funcional desligado.</strong>
                  <span>O cadastro não foi arquivado. Férias, Folha, Exames e o histórico permanecem preservados.</span>
                </>
              ) : desligamentoConcluidoSelecionado?.efeito_revertido ? (
                <>
                  <strong>Conclusão revertida por erro — evento original preservado.</strong>
                  <span>Esta reversão não representa readmissão. Um desligamento futuro deve usar um novo processo.</span>
                </>
              ) : desligamentoAbertoSelecionado ? (
                <>
                  <strong>Processo em andamento — colaborador ainda não foi desligado.</strong>
                  <span>Somente a conclusão confirmada altera o status funcional. Editar ou cancelar preserva os dados.</span>
                </>
              ) : (
                <>
                  <strong>Nenhum processo aberto.</strong>
                  <span>Iniciar o processo não altera status, arquivamento, Férias, Folha ou Exames.</span>
                </>
              )}
            </div>

            {erroDesligamentos && (
              <div className="funcionario-exames-empty">
                <strong>Não foi possível carregar o histórico.</strong>
                <p>{erroDesligamentos}</p>
                <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={carregarDesligamentos}>Tentar novamente</button>
              </div>
            )}

            {funcionarioDesligamento.status !== 'desligado' && !desligamentoConcluidoEfetivoSelecionado && <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span>
                  <strong>{desligamentoAbertoSelecionado ? 'Editar processo aberto' : 'Iniciar processo'}</strong>
                  <small>O último dia é pretendido e não conclui o desligamento.</small>
                </span>
                <b>{desligamentoAbertoSelecionado ? 'AB' : '+'}</b>
              </div>
              <div className="funcionario-form-grid">
                <label className="span-2">
                  Motivo
                  <textarea className="funcionarios-input" value={formularioDesligamento.motivo} onChange={(event) => atualizarCampoDesligamento('motivo', event.target.value)} required />
                </label>
                <label>
                  Último dia pretendido
                  <input className="funcionarios-input" type="date" value={formularioDesligamento.dataEfetiva} onChange={(event) => atualizarCampoDesligamento('dataEfetiva', event.target.value)} required />
                </label>
                <label>
                  Estado
                  <input className="funcionarios-input" value={desligamentoAbertoSelecionado?.estado || 'NOVO'} disabled />
                </label>
                <label className="span-2">
                  Observações
                  <textarea className="funcionarios-input" value={formularioDesligamento.observacoes} onChange={(event) => atualizarCampoDesligamento('observacoes', event.target.value)} />
                </label>
              </div>
            </section>}

            {desligamentoAbertoSelecionado && (
              <section className="funcionario-modal-section funcionario-desligamento-conclusao">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Concluir desligamento</strong><small>Altera o status funcional para desligado sem arquivar o cadastro.</small></span>
                  <b>✓</b>
                </div>
                <div className="funcionario-form-grid">
                  <p className="funcionarios-note span-2">Use a confirmação final para revisar colaborador, data efetiva e motivo antes de concluir.</p>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={() => setConfirmacaoConclusaoAberta(true)}>Concluir desligamento</button>
                </div>
              </section>
            )}

            {desligamentoConcluidoEfetivoSelecionado && (
              <section className="funcionario-modal-section funcionario-desligamento-correcao">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Correção administrativa</strong><small>O evento CONCLUIDO original nunca é sobrescrito.</small></span>
                  <b>!</b>
                </div>
                <div className="funcionario-correcao-actions">
                  <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={abrirRetificacao}>Retificar</button>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento || !desligamentoConcluidoEfetivoSelecionado.status_anterior} onClick={abrirReversaoPorErro}>Reverter conclusão por erro</button>
                  {!desligamentoConcluidoEfetivoSelecionado.status_anterior && <small>A reversão está bloqueada porque o estado funcional anterior não pôde ser comprovado.</small>}
                </div>
              </section>
            )}

            {desligamentoAbertoSelecionado && (
              <section className="funcionario-modal-section">
                <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                  <span><strong>Cancelar processo</strong><small>O cancelamento fica no histórico e não altera o status funcional.</small></span>
                  <b>×</b>
                </div>
                <div className="funcionario-form-grid">
                  <label className="span-2">
                    Motivo do cancelamento
                    <textarea className="funcionarios-input" value={formularioDesligamento.motivoCancelamento} onChange={(event) => atualizarCampoDesligamento('motivoCancelamento', event.target.value)} />
                  </label>
                  <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={cancelarWorkflowDesligamento}>Cancelar processo</button>
                </div>
              </section>
            )}

            <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span><strong>Histórico</strong><small>Processos abertos, cancelados e concluídos desta colaboradora.</small></span>
                <b>{historicoDesligamentoSelecionado.length}</b>
              </div>
              <div className="funcionario-desligamento-historico">
                {loadingDesligamentos ? (
                  <p className="funcionarios-note">Carregando histórico...</p>
                ) : historicoDesligamentoSelecionado.length === 0 ? (
                  <div className="funcionario-exames-empty">Nenhum processo anterior.</div>
                ) : historicoDesligamentoSelecionado.map((item) => (
                  <article key={item.id} className="funcionario-desligamento-item">
                    <div><strong>{item.estado}</strong><small>Aberto em {formatarDataCurta(item.aberto_em)}</small></div>
                    <span>Último dia pretendido: {formatarDataCurta(item.data_efetiva)}</span>
                    <span>Motivo: {item.motivo}</span>
                    {item.estado === 'CANCELADO' && <span>Cancelamento: {item.motivo_cancelamento}</span>}
                    {item.estado === 'CONCLUIDO' && <span>Concluído em: {formatarDataCurta(item.concluido_em)}</span>}
                    {item.estado === 'CONCLUIDO' && <span>Estado efetivo: {item.efeito_revertido ? `revertido para ${STATUS_LABELS[item.status_funcional_efetivo] || item.status_funcional_efetivo}` : `desligado em ${formatarDataCurta(item.data_efetiva_efetiva)}`}</span>}
                    {(correcoesPorDesligamento.get(item.id) || []).map((correcao) => (
                      <div key={correcao.id} className="funcionario-desligamento-correcao-item">
                        <strong>{correcao.tipo === 'RETIFICACAO' ? 'Retificação' : 'Reversão por erro'}</strong>
                        <small>{formatarDataCurta(correcao.criado_em)}</small>
                        <span>{correcao.motivo_correcao}</span>
                        {correcao.tipo === 'RETIFICACAO' && <span>Data efetiva: {formatarDataCurta(correcao.data_efetiva_antes)} → {formatarDataCurta(correcao.data_efetiva_depois)}</span>}
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>

            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharModalDesligamento} disabled={salvandoDesligamento}>Fechar</button>
              {funcionarioDesligamento.status !== 'desligado' && !desligamentoConcluidoEfetivoSelecionado && (
                <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={salvandoDesligamento || !formularioDesligamento.motivo || !formularioDesligamento.dataEfetiva}>
                  {salvandoDesligamento ? 'Salvando...' : desligamentoAbertoSelecionado ? 'Salvar processo' : 'Iniciar processo'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {confirmacaoConclusaoAberta && desligamentoAbertoSelecionado && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop funcionario-confirmacao-backdrop" role="presentation" onClick={() => !salvandoDesligamento && setConfirmacaoConclusaoAberta(false)}>
          <div className="funcionario-modal funcionario-confirmacao-modal" role="alertdialog" aria-modal="true" aria-labelledby="conclusao-desligamento-title" onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Confirmação obrigatória</span>
                <h2 id="conclusao-desligamento-title">Concluir desligamento</h2>
              </div>
            </div>
            <dl className="funcionario-confirmacao-resumo">
              <div><dt>Colaborador</dt><dd>{funcionarioDesligamento.nome || 'Não informado'}</dd></div>
              <div><dt>Data efetiva</dt><dd>{formatarDataCurta(desligamentoAbertoSelecionado.data_efetiva)}</dd></div>
              <div><dt>Motivo</dt><dd>{desligamentoAbertoSelecionado.motivo}</dd></div>
            </dl>
            <div className="funcionario-desligamento-alerta" role="note">
              <strong>O status funcional passará para desligado.</strong>
              <span>O cadastro NÃO será arquivado. Histórico de Férias, Folha e Exames será preservado.</span>
            </div>
            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={() => setConfirmacaoConclusaoAberta(false)}>Voltar</button>
              <button className="funcionarios-btn funcionarios-btn-danger" type="button" disabled={salvandoDesligamento} onClick={concluirWorkflowDesligamento}>{salvandoDesligamento ? 'Concluindo...' : 'Confirmar conclusão'}</button>
            </div>
          </div>
        </div>
      )}

      {formularioCorrecao.tipo && desligamentoConcluidoEfetivoSelecionado && funcionarioDesligamento && (
        <div className="funcionario-modal-backdrop funcionario-confirmacao-backdrop" role="presentation" onClick={() => !salvandoDesligamento && setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)}>
          <form className="funcionario-modal funcionario-confirmacao-modal" role="dialog" aria-modal="true" aria-labelledby="correcao-desligamento-title" onSubmit={salvarCorrecaoDesligamento} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">Correção append-only</span>
                <h2 id="correcao-desligamento-title">{formularioCorrecao.tipo === 'RETIFICACAO' ? 'Retificar desligamento' : 'Reverter conclusão por erro'}</h2>
                <p>{funcionarioDesligamento.nome || 'Colaboradora selecionada'}</p>
              </div>
            </div>
            {formularioCorrecao.tipo === 'RETIFICACAO' ? (
              <div className="funcionario-form-grid funcionario-correcao-form">
                <label>Data efetiva<input className="funcionarios-input" type="date" value={formularioCorrecao.dataEfetiva} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, dataEfetiva: event.target.value }))} required /></label>
                <label className="span-2">Motivo do desligamento<textarea className="funcionarios-input" value={formularioCorrecao.motivo} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivo: event.target.value }))} required /></label>
                <label className="span-2">Observações<textarea className="funcionarios-input" value={formularioCorrecao.observacoes} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, observacoes: event.target.value }))} /></label>
                <label className="span-2">Motivo da correção<textarea className="funcionarios-input" value={formularioCorrecao.motivoCorrecao} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivoCorrecao: event.target.value }))} required /></label>
              </div>
            ) : (
              <>
                <div className="funcionario-desligamento-alerta" role="note">
                  <strong>Esta ação informa que o desligamento foi concluído por engano.</strong>
                  <span>Ela restaura o estado anterior comprovado ({STATUS_LABELS[desligamentoConcluidoEfetivoSelecionado.status_anterior] || desligamentoConcluidoEfetivoSelecionado.status_anterior}) e não representa readmissão.</span>
                </div>
                <div className="funcionario-form-grid funcionario-correcao-form">
                  <label className="span-2">Motivo obrigatório da reversão<textarea className="funcionarios-input" value={formularioCorrecao.motivoCorrecao} onChange={(event) => setFormularioCorrecao((atual) => ({ ...atual, motivoCorrecao: event.target.value }))} required /></label>
                </div>
              </>
            )}
            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoDesligamento} onClick={() => setFormularioCorrecao(FORMULARIO_CORRECAO_INICIAL)}>Voltar</button>
              <button className={`funcionarios-btn ${formularioCorrecao.tipo === 'REVERSAO_ERRO' ? 'funcionarios-btn-danger' : 'funcionarios-btn-primary'}`} type="submit" disabled={salvandoDesligamento || formularioCorrecao.motivoCorrecao.trim().length < 3}>{salvandoDesligamento ? 'Registrando...' : formularioCorrecao.tipo === 'RETIFICACAO' ? 'Registrar retificação' : 'Confirmar reversão por erro'}</button>
            </div>
          </form>
        </div>
      )}

      {modalAberto && (
        <div className="funcionario-modal-backdrop" role="presentation" onClick={fecharFormulario}>
          <form className="funcionario-modal" role="dialog" aria-modal="true" aria-labelledby="funcionario-modal-title" onSubmit={salvarFormulario} onClick={(event) => event.stopPropagation()}>
            <div className="funcionario-modal-header">
              <div>
                <span className="funcionarios-kicker">{funcionarioEditando ? 'Editar cadastro' : 'Novo cadastro'}</span>
                <h2 id="funcionario-modal-title">{funcionarioEditando ? 'Editar funcionário' : 'Novo funcionário'}</h2>
                <p>Preencha somente dados operacionais necessários para organizar a equipe.</p>
              </div>
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharFormulario}>Fechar</button>
            </div>

            <section className="funcionario-modal-section">
              <div className="funcionario-modal-section-toggle funcionario-modal-section-static">
                <span>
                  <strong>Dados básicos</strong>
                  <small>Identificação e contatos operacionais obrigatórios</small>
                </span>
                <b>Obrigatório</b>
              </div>
              <div className="funcionario-form-grid">
                <label>
                  Nome completo
                  <input
                    className="funcionarios-input"
                    value={formulario.nome}
                    onChange={(event) => atualizarCampo('nome', event.target.value)}
                    onBlur={() => normalizarCampoCapitalizado('nome')}
                    placeholder="Ex.: Maria Souza"
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Cargo ou função
                  <input
                    className="funcionarios-input"
                    value={formulario.cargo}
                    onChange={(event) => atualizarCampo('cargo', event.target.value)}
                    onBlur={() => normalizarCampoCapitalizado('cargo')}
                    placeholder="Ex.: Atendente"
                  />
                </label>
                <label>
                  Telefone
                  <input
                    className="funcionarios-input"
                    value={formulario.telefone}
                    onChange={(event) => atualizarCampo('telefone', event.target.value)}
                    inputMode="tel"
                    placeholder="Contato operacional"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    className="funcionarios-input"
                    value={formulario.email}
                    onChange={(event) => atualizarCampo('email', event.target.value)}
                    type="email"
                    placeholder="email@empresa.com"
                  />
                </label>
                <label>
                  CPF (opcional)
                  <input
                    className="funcionarios-input"
                    value={formulario.cpf}
                    onChange={(event) => atualizarCampo('cpf', event.target.value)}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="Somente números"
                  />
                  <small className="funcionarios-help">Não aparece na listagem de funcionários.</small>
                </label>
              </div>
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('vinculo')}>
                <span>
                  <strong>Vínculo e empresa</strong>
                  <small>Status operacional e filial</small>
                </span>
                <b>{modalSecoesAbertas.vinculo ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.vinculo && (
                <div className="funcionario-form-grid">
                  <label>
                    Status operacional
                    <select
                      className="funcionarios-input"
                      value={formulario.status}
                      onChange={(event) => atualizarCampo('status', event.target.value)}
                      disabled={funcionarioEditando?.status === 'desligado'}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="afastado">Afastado</option>
                      {funcionarioEditando?.status === 'desligado' && (
                        <option value="desligado">Desligado (legado)</option>
                      )}
                    </select>
                    {funcionarioEditando?.status === 'desligado' && <small className="funcionarios-help">Readmissão ou correção posterior exige fluxo específico e não faz parte deste lote.</small>}
                  </label>
                  <label>
                    Filial
                    <select
                      className="funcionarios-input"
                      value={formulario.filial_id}
                      onChange={(event) => atualizarCampo('filial_id', event.target.value)}
                    >
                      <option value="">Sem filial</option>
                      {(filiais || []).map((filial) => (
                        <option key={filial.id} value={filial.id}>{filial.nome || 'Filial'}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('datas')}>
                <span>
                  <strong>Datas</strong>
                  <small>Aniversário, admissão e exame admissional</small>
                </span>
                <b>{modalSecoesAbertas.datas ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.datas && (
                <div className="funcionario-form-grid">
                  <label>
                    Data de nascimento
                    <input
                      className="funcionarios-input"
                      value={formulario.data_nascimento}
                      onChange={(event) => atualizarCampo('data_nascimento', event.target.value)}
                      type="date"
                    />
                    <small className="funcionarios-help">Usada apenas para contagem de aniversariantes.</small>
                  </label>
                  <label>
                    Data de admissão
                    <input
                      className="funcionarios-input"
                      value={formulario.data_admissao}
                      onChange={(event) => atualizarCampo('data_admissao', event.target.value)}
                      type="date"
                    />
                  </label>
                  {funcionarioEditando?.id && admissaoFoiAlterada(funcionarioEditando, formulario.data_admissao) && (
                    <div className="funcionarios-admissao-impacto span-2" role="status">
                      {!impactoAdmissao && (
                        <p>A alteração será validada pelo servidor antes de salvar.</p>
                      )}
                      {impactoAdmissao?.criara_primeiro_ciclo && (
                        <p>Este funcionário ainda não possui ciclos. O primeiro período aquisitivo será criado automaticamente.</p>
                      )}
                      {impactoAdmissao?.ciclos_preservados && (
                        <>
                          <p>
                            {impactoAdmissao.ciclos_existentes} ciclo(s) existente(s) serão preservados sem mudança de datas, saldos ou limites.
                          </p>
                          <label>
                            Motivo da alteração
                            <textarea
                              className="funcionarios-input"
                              value={motivoAdmissao}
                              onChange={(event) => setMotivoAdmissao(event.target.value)}
                              placeholder="Explique por que a data de admissão precisa ser alterada."
                              required
                            />
                          </label>
                        </>
                      )}
                    </div>
                  )}
                  <label>
                    Data do exame admissional
                    <input
                      className="funcionarios-input"
                      value={formulario.data_exame_admissional}
                      onChange={(event) => atualizarCampo('data_exame_admissional', event.target.value)}
                      type="date"
                    />
                    <small className="funcionarios-help">Controle de periodicidade; salve somente a data, sem laudos ou resultados.</small>
                  </label>
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('observacoes')}>
                <span>
                  <strong>Observações administrativas</strong>
                  <small>Uso interno sem dados clínicos</small>
                </span>
                <b>{modalSecoesAbertas.observacoes ? '−' : '+'}</b>
              </button>
              {modalSecoesAbertas.observacoes && (
                <div className="funcionario-form-grid">
                  <label className="span-2">
                    Observações
                    <textarea
                      className="funcionarios-input"
                      value={formulario.observacoes}
                      onChange={(event) => atualizarCampo('observacoes', event.target.value)}
                      placeholder="Ex.: informação administrativa interna. Não inserir dados médicos ou documentos."
                    />
                    <small className="funcionarios-help">
                      Use apenas observações administrativas. Não registre laudos, diagnósticos,
                      resultados de exames, documentos ou informações clínicas.
                    </small>
                  </label>
                </div>
              )}
            </section>

            <section className="funcionario-modal-section">
              <button className="funcionario-modal-section-toggle" type="button" onClick={() => alternarSecaoModal('exames')}>
                <span>
                  <strong>Exames periódicos</strong>
                  <small>Controle visual de datas, sem laudos ou resultados</small>
                </span>
                <b>{modalSecoesAbertas.exames ? '−' : '+'}</b>
              </button>

              {modalSecoesAbertas.exames && (
                <div className="funcionario-exames-section">
                  <div className="funcionario-exames-header">
                    <p>Registre somente as datas dos exames periódicos realizados. Não registre laudos, resultados, documentos ou informações clínicas.</p>
                    {funcionarioEditando?.id && (
                      <label className={`funcionarios-switch ${mostrarExamesArquivados ? 'ativo' : ''}`}>
                        <input
                          type="checkbox"
                          checked={mostrarExamesArquivados}
                          onChange={(event) => {
                            setMostrarExamesArquivados(event.target.checked)
                            cancelarEdicaoExame()
                          }}
                          disabled={loadingExames || salvandoExames}
                        />
                        <span className="funcionarios-switch-indicator" aria-hidden="true" />
                        <span>Mostrar arquivados</span>
                      </label>
                    )}
                  </div>

                  {!funcionarioEditando?.id ? (
                    <div className="funcionario-exames-empty">
                      Salve o funcionário antes de registrar exames periódicos.
                    </div>
                  ) : (
                    <>
                  <div className="funcionario-exames-add">
                    <label>
                      Data do exame periódico
                      <input
                        className="funcionarios-input"
                        value={dataExamePeriodico}
                        onChange={(event) => setDataExamePeriodico(event.target.value)}
                        type="date"
                        disabled={salvandoExames}
                      />
                    </label>
                    <button
                      className="funcionarios-btn funcionarios-btn-primary"
                      type="button"
                      disabled={salvandoExames || !dataExamePeriodico}
                      onClick={adicionarExamePeriodico}
                    >
                      Adicionar exame
                    </button>
                  </div>

                  <div className="funcionario-exames-empty">
                    <strong>Próximo periódico previsto: {proximoPeriodicoPrevisto ? formatarDataCurta(proximoPeriodicoPrevisto) : 'Não informado'}</strong>
                    <br />
                    <span>
                      {origemProximoPeriodico
                        ? `Cálculo visual baseado no ${origemProximoPeriodico}. Este valor não é salvo no banco.`
                        : 'Informe o exame admissional ou registre um periódico para calcular a previsão.'}
                    </span>
                  </div>

                  {loadingExames ? (
                    <p className="funcionarios-note">Carregando exames periódicos...</p>
                  ) : erroExames ? (
                    <div className="funcionario-exames-empty">
                      <strong>Não foi possível carregar os exames.</strong>
                      <p>{erroExames}</p>
                      <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={() => carregarExamesPeriodicos()}>
                        Tentar novamente
                      </button>
                    </div>
                  ) : exames.length === 0 ? (
                    <div className="funcionario-exames-empty">
                      Nenhum exame periódico registrado para este funcionário.
                    </div>
                  ) : (
                    <div className="funcionario-exames-list">
                      {exames.map((exame) => (
                        <article key={exame.id} className="funcionario-exame-row">
                          <div className="funcionario-exame-main">
                            {exameEditandoId === exame.id ? (
                              <div className="funcionario-exame-edit">
                                <input
                                  className="funcionarios-input"
                                  value={dataExameEditando}
                                  onChange={(event) => setDataExameEditando(event.target.value)}
                                  type="date"
                                  disabled={salvandoExames}
                                />
                                <button
                                  className="funcionarios-btn funcionarios-btn-primary"
                                  type="button"
                                  disabled={salvandoExames || !dataExameEditando}
                                  onClick={() => salvarEdicaoExame(exame)}
                                >
                                  Salvar
                                </button>
                                <button className="funcionarios-btn funcionarios-btn-secondary" type="button" disabled={salvandoExames} onClick={cancelarEdicaoExame}>
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <strong>{formatarDataCurta(exame.data_exame)}</strong>
                                <small>Data do exame periódico realizado.</small>
                              </>
                            )}
                            <span className={`funcionario-exame-status ${exame.arquivado ? 'arquivado' : ''}`}>
                              {exame.arquivado ? 'Arquivado' : 'Ativo'}
                            </span>
                          </div>
                          <div className="funcionario-exame-actions">
                            {exameEditandoId !== exame.id && (
                              <button
                                className="funcionarios-btn funcionarios-btn-secondary"
                                type="button"
                                disabled={salvandoExames || exame.arquivado}
                                onClick={() => iniciarEdicaoExame(exame)}
                              >
                                Editar
                              </button>
                            )}
                            <button
                              className={`funcionarios-btn ${exame.arquivado ? 'funcionarios-btn-primary' : 'funcionarios-btn-danger'}`}
                              type="button"
                              disabled={salvandoExames}
                              onClick={() => alternarArquivamentoExame(exame)}
                            >
                              {exame.arquivado ? 'Reativar' : 'Arquivar'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
            </section>

            <div className="funcionario-modal-actions">
              <button className="funcionarios-btn funcionarios-btn-secondary" type="button" onClick={fecharFormulario} disabled={salvando}>Cancelar</button>
              <button className="funcionarios-btn funcionarios-btn-primary" type="submit" disabled={salvando || !empresaId || !podeEditar}>
                {salvando ? 'Salvando...' : 'Salvar funcionário'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
