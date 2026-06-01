import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  calcularSaldoDiasFerias,
  listarCiclosFerias,
  listarPeriodosFerias
} from '../services/funcionariosFeriasService'
import { calcularProximoPeriodico } from '../services/funcionariosExamesPeriodicosService'
import { mensagemSeguraErro } from '../utils/session'

const RESUMO_VAZIO = Object.freeze({
  funcionariosAtivos: 0,
  feriasProximas: 0,
  feriasVencidas: 0,
  examesVencidos: 0,
  examesAVencer: 0,
  folhaEmAberto: null,
  aniversariosSemana: 0
})

const STATUS_FOLHA_EM_ABERTO = new Set(['aberta', 'em_conferencia'])

const SELECT_FUNCIONARIOS_PAINEL = 'id, status, arquivado, data_nascimento, data_exame_admissional'
const SELECT_FOLHA_PAINEL = 'competencia, status, arquivado'
const SELECT_EXAMES_PERIODICOS_PAINEL = 'funcionario_id, data_exame, arquivado'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function hojeISO() {
  const hoje = new Date()
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')
}

function somarDiasISO(dataISO, dias) {
  if (!dataISO) return null
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return null

  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + dias)

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-')
}

function estaArquivado(item) {
  return Boolean(item?.arquivado)
}

function funcionarioAtivo(funcionario) {
  return !estaArquivado(funcionario) && funcionario?.status === 'ativo'
}

function calcularDistanciaAniversario(dataNascimento, dataBase = new Date()) {
  const texto = String(dataNascimento || '').slice(0, 10)
  const partes = texto.split('-').map(Number)
  if (partes.length !== 3 || !partes[1] || !partes[2]) return null

  const anoBase = dataBase.getFullYear()
  const aniversario = new Date(anoBase, partes[1] - 1, partes[2])
  const inicioHoje = new Date(anoBase, dataBase.getMonth(), dataBase.getDate())

  if (aniversario < inicioHoje) {
    aniversario.setFullYear(anoBase + 1)
  }

  return Math.floor((aniversario.getTime() - inicioHoje.getTime()) / 86400000)
}

function contarAniversariosSemana(funcionarios = []) {
  const base = new Date()

  return funcionarios.filter((funcionario) => {
    const distancia = calcularDistanciaAniversario(funcionario?.data_nascimento, base)
    return distancia !== null && distancia >= 0 && distancia <= 7
  }).length
}

function obterUltimoExamePeriodicoAtivo(exames = []) {
  return [...exames]
    .filter((exame) => exame?.data_exame && !estaArquivado(exame))
    .sort((a, b) => String(b.data_exame || '').localeCompare(String(a.data_exame || '')))[0] || null
}

function agruparExamesPorFuncionario(exames = []) {
  return (exames || []).reduce((grupos, exame) => {
    const funcionarioId = normalizarId(exame?.funcionario_id)
    if (!funcionarioId) return grupos

    if (!grupos[funcionarioId]) grupos[funcionarioId] = []
    grupos[funcionarioId].push(exame)

    return grupos
  }, {})
}

function periodoConsomeSaldo(periodo) {
  return periodo && !estaArquivado(periodo) && periodo.status !== 'cancelada'
}

function periodoAgendadoProximo(periodo, hoje, limiteProximo) {
  const dataInicio = String(periodo?.data_inicio || '').slice(0, 10)
  const status = String(periodo?.status || '').trim().toLowerCase()

  return Boolean(
    periodo &&
    !estaArquivado(periodo) &&
    status === 'agendada' &&
    dataInicio &&
    dataInicio >= hoje &&
    limiteProximo &&
    dataInicio <= limiteProximo
  )
}

function criarAlerta({ id, tipo, titulo, descricao, prioridade, rotaDestino }) {
  return { id, tipo, titulo, descricao, prioridade, rotaDestino }
}

function montarAlertas(resumo) {
  const alertas = []

  if (resumo.folhaEmAberto) {
    alertas.push(criarAlerta({
      id: 'folha-em-aberto',
      tipo: 'folha',
      titulo: 'Folha em aberto',
      descricao: `Competência ${resumo.folhaEmAberto.competencia} com status ${resumo.folhaEmAberto.status}.`,
      prioridade: resumo.folhaEmAberto.status === 'aberta' ? 'alta' : 'media',
      rotaDestino: 'fechamento-folha'
    }))
  }

  if (resumo.feriasVencidas > 0) {
    alertas.push(criarAlerta({
      id: 'ferias-vencidas',
      tipo: 'ferias',
      titulo: 'Férias vencidas',
      descricao: `${resumo.feriasVencidas} ${resumo.feriasVencidas === 1 ? 'ciclo' : 'ciclos'} com limite de gozo ultrapassado.`,
      prioridade: 'alta',
      rotaDestino: 'relatorios-ferias'
    }))
  }

  if (resumo.examesVencidos > 0) {
    alertas.push(criarAlerta({
      id: 'exames-vencidos',
      tipo: 'exames',
      titulo: 'Exames vencidos',
      descricao: `${resumo.examesVencidos} ${resumo.examesVencidos === 1 ? 'periódico vencido' : 'periódicos vencidos'}.`,
      prioridade: 'alta',
      rotaDestino: 'relatorios-pessoas'
    }))
  }

  if (resumo.feriasProximas > 0) {
    alertas.push(criarAlerta({
      id: 'ferias-proximas',
      tipo: 'ferias',
      titulo: 'Férias próximas',
      descricao: `${resumo.feriasProximas} ${resumo.feriasProximas === 1 ? 'período agendado' : 'períodos agendados'} nos próximos 30 dias.`,
      prioridade: 'media',
      rotaDestino: 'ferias'
    }))
  }

  if (resumo.examesAVencer > 0) {
    alertas.push(criarAlerta({
      id: 'exames-a-vencer',
      tipo: 'exames',
      titulo: 'Exames a vencer',
      descricao: `${resumo.examesAVencer} ${resumo.examesAVencer === 1 ? 'periódico' : 'periódicos'} nos próximos 30 dias.`,
      prioridade: 'media',
      rotaDestino: 'relatorios-pessoas'
    }))
  }

  if (resumo.aniversariosSemana > 0) {
    alertas.push(criarAlerta({
      id: 'aniversarios-semana',
      tipo: 'aniversarios',
      titulo: 'Aniversários da semana',
      descricao: `${resumo.aniversariosSemana} ${resumo.aniversariosSemana === 1 ? 'aniversário' : 'aniversários'} nos próximos 7 dias.`,
      prioridade: 'baixa',
      rotaDestino: 'relatorios-pessoas'
    }))
  }

  if (resumo.funcionariosAtivos > 0) {
    alertas.push(criarAlerta({
      id: 'funcionarios-ativos',
      tipo: 'funcionarios',
      titulo: 'Funcionários ativos',
      descricao: `${resumo.funcionariosAtivos} ${resumo.funcionariosAtivos === 1 ? 'colaborador ativo' : 'colaboradores ativos'}.`,
      prioridade: 'baixa',
      rotaDestino: 'funcionarios'
    }))
  }

  return alertas.slice(0, 5)
}

async function carregarResumoFerias({ supabase, empresaId, funcionariosAtivos }) {
  const hoje = hojeISO()
  const limiteProximo = somarDiasISO(hoje, 30)
  let feriasProximas = 0
  let feriasVencidas = 0

  await Promise.all(funcionariosAtivos.map(async (funcionario) => {
    const { data: ciclos, error: erroCiclos } = await listarCiclosFerias({
      supabase,
      empresaId,
      funcionarioId: funcionario.id,
      incluirArquivados: false
    })

    if (erroCiclos) throw erroCiclos

    await Promise.all((ciclos || []).map(async (ciclo) => {
      const { data: periodos, error: erroPeriodos } = await listarPeriodosFerias({
        supabase,
        empresaId,
        cicloId: ciclo.id,
        funcionarioId: funcionario.id,
        incluirArquivados: false
      })

      if (erroPeriodos) throw erroPeriodos

      const periodosAtivos = (periodos || []).filter(periodoConsomeSaldo)
      feriasProximas += periodosAtivos.filter((periodo) => (
        periodoAgendadoProximo(periodo, hoje, limiteProximo)
      )).length

      const saldo = calcularSaldoDiasFerias({
        diasDireito: ciclo.dias_direito || 30,
        periodosAtivos
      })

      if (saldo <= 0 || !ciclo.data_limite_gozo) return

      if (ciclo.data_limite_gozo < hoje) {
        feriasVencidas += 1
      }
    }))
  }))

  return { feriasProximas, feriasVencidas }
}

async function carregarResumoExames({ supabase, empresaId, funcionariosAtivos }) {
  const hoje = hojeISO()
  const limiteProximo = somarDiasISO(hoje, 30)
  let examesVencidos = 0
  let examesAVencer = 0

  const { data, error } = await supabase
    .from('df_funcionarios_exames_periodicos')
    .select(SELECT_EXAMES_PERIODICOS_PAINEL)
    .eq('empresa_id', empresaId)
    .eq('arquivado', false)

  if (error) throw error

  const examesPorFuncionario = agruparExamesPorFuncionario(data || [])

  funcionariosAtivos.forEach((funcionario) => {
    const examesFuncionario = examesPorFuncionario[funcionario.id] || []
    const ultimoPeriodico = obterUltimoExamePeriodicoAtivo(examesFuncionario)
    const dataBase = ultimoPeriodico?.data_exame || funcionario.data_exame_admissional
    const proximoPeriodico = dataBase ? calcularProximoPeriodico(dataBase) : null

    if (!proximoPeriodico) return

    if (proximoPeriodico < hoje) {
      examesVencidos += 1
    } else if (limiteProximo && proximoPeriodico <= limiteProximo) {
      examesAVencer += 1
    }
  })

  return { examesVencidos, examesAVencer }
}

async function carregarFolhaEmAberto({ supabase, empresaId }) {
  const { data, error } = await supabase
    .from('df_folha_competencias')
    .select(SELECT_FOLHA_PAINEL)
    .eq('empresa_id', empresaId)
    .eq('arquivado', false)
    .order('competencia', { ascending: false })
    .order('criado_em', { ascending: false })

  if (error) throw error

  const competencia = (data || []).find((item) => STATUS_FOLHA_EM_ABERTO.has(item?.status))
  if (!competencia) return null

  return {
    competencia: competencia.competencia,
    status: competencia.status,
    rotaDestino: 'fechamento-folha'
  }
}

export function useResumoGestaoPessoasPainel({
  empresaId,
  perfilUsuario,
  podeAcessarGestaoPessoas
} = {}) {
  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [resumo, setResumo] = useState(RESUMO_VAZIO)
  const [alertas, setAlertas] = useState([])
  const cargaAtualRef = useRef(0)

  const podeVisualizar = Boolean(empresaAtual && podeAcessarGestaoPessoas)

  useEffect(() => {
    cargaAtualRef.current += 1
    const cargaId = cargaAtualRef.current

    setErro(null)
    setResumo(RESUMO_VAZIO)
    setAlertas([])

    if (!empresaAtual || !podeAcessarGestaoPessoas) {
      setLoading(false)
      return
    }

    let cancelado = false

    async function carregarResumo() {
      setLoading(true)

      try {
        const { data: funcionarios, error: erroFuncionarios } = await supabasePadrao
          .from('df_funcionarios')
          .select(SELECT_FUNCIONARIOS_PAINEL)
          .eq('empresa_id', empresaAtual)
          .eq('arquivado', false)

        if (erroFuncionarios) throw erroFuncionarios

        const ativos = (funcionarios || []).filter(funcionarioAtivo)
        const [resumoFerias, resumoExames, folhaEmAberto] = await Promise.all([
          carregarResumoFerias({
            supabase: supabasePadrao,
            empresaId: empresaAtual,
            funcionariosAtivos: ativos
          }),
          carregarResumoExames({
            supabase: supabasePadrao,
            empresaId: empresaAtual,
            funcionariosAtivos: ativos
          }),
          carregarFolhaEmAberto({
            supabase: supabasePadrao,
            empresaId: empresaAtual
          })
        ])

        if (cancelado || cargaAtualRef.current !== cargaId) return

        const proximoResumo = {
          funcionariosAtivos: ativos.length,
          feriasProximas: resumoFerias.feriasProximas,
          feriasVencidas: resumoFerias.feriasVencidas,
          examesVencidos: resumoExames.examesVencidos,
          examesAVencer: resumoExames.examesAVencer,
          folhaEmAberto,
          aniversariosSemana: contarAniversariosSemana(ativos)
        }

        setResumo(proximoResumo)
        setAlertas(montarAlertas(proximoResumo))
      } catch (error) {
        if (cancelado || cargaAtualRef.current !== cargaId) return

        setErro(mensagemSeguraErro(error, 'Não foi possível carregar o resumo de Gestão de Pessoas.'))
        setResumo(RESUMO_VAZIO)
        setAlertas([])
      } finally {
        if (!cancelado && cargaAtualRef.current === cargaId) {
          setLoading(false)
        }
      }
    }

    carregarResumo()

    return () => {
      cancelado = true
    }
  }, [empresaAtual, perfilUsuario, podeAcessarGestaoPessoas])

  return {
    loading,
    erro,
    podeVisualizar,
    resumo,
    alertas
  }
}

export default useResumoGestaoPessoasPainel
