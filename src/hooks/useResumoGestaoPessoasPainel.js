import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import { calcularSaldoDiasFerias } from '../services/funcionariosFeriasService'
import { mensagemSeguraErro } from '../utils/session'

const RESUMO_VAZIO = Object.freeze({
  funcionariosAtivos: 0,
  feriasProximas: 0,
  feriasVencidas: 0,
  folhaEmAberto: null,
  aniversariosSemana: 0
})

const STATUS_FOLHA_EM_ABERTO = new Set(['aberta', 'em_conferencia'])

const SELECT_FUNCIONARIOS_PAINEL = 'id, status, arquivado, data_nascimento'
const SELECT_CICLOS_FERIAS_PAINEL = 'id, funcionario_id, data_limite_gozo, dias_direito, arquivado'
const SELECT_PERIODOS_FERIAS_PAINEL = 'ciclo_ferias_id, quantidade_dias, status, arquivado'
const SELECT_FOLHA_PAINEL = 'competencia, status, arquivado'

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

function periodoConsomeSaldo(periodo) {
  return periodo && !estaArquivado(periodo) && periodo.status !== 'cancelada'
}

function criarAlerta({ id, tipo, titulo, descricao, prioridade, rotaDestino }) {
  return { id, tipo, titulo, descricao, prioridade, rotaDestino }
}

function montarAlertas(resumo) {
  const alertas = []

  if (resumo.feriasVencidas > 0) {
    alertas.push(criarAlerta({
      id: 'ferias-vencidas',
      tipo: 'ferias',
      titulo: 'Ferias vencidas',
      descricao: `${resumo.feriasVencidas} ciclo(s) com limite de gozo ultrapassado.`,
      prioridade: 'alta',
      rotaDestino: 'relatorios-ferias'
    }))
  }

  if (resumo.folhaEmAberto) {
    alertas.push(criarAlerta({
      id: 'folha-em-aberto',
      tipo: 'folha',
      titulo: 'Folha em aberto',
      descricao: `Competencia ${resumo.folhaEmAberto.competencia} com status ${resumo.folhaEmAberto.status}.`,
      prioridade: resumo.folhaEmAberto.status === 'aberta' ? 'alta' : 'media',
      rotaDestino: 'fechamento-folha'
    }))
  }

  if (resumo.feriasProximas > 0) {
    alertas.push(criarAlerta({
      id: 'ferias-proximas',
      tipo: 'ferias',
      titulo: 'Ferias proximas',
      descricao: `${resumo.feriasProximas} ciclo(s) com limite de gozo nos proximos 30 dias.`,
      prioridade: 'media',
      rotaDestino: 'relatorios-ferias'
    }))
  }

  if (resumo.aniversariosSemana > 0) {
    alertas.push(criarAlerta({
      id: 'aniversarios-semana',
      tipo: 'aniversarios',
      titulo: 'Aniversarios da semana',
      descricao: `${resumo.aniversariosSemana} aniversario(s) nos proximos 7 dias.`,
      prioridade: 'baixa',
      rotaDestino: 'relatorios-pessoas'
    }))
  }

  if (resumo.funcionariosAtivos > 0) {
    alertas.push(criarAlerta({
      id: 'funcionarios-ativos',
      tipo: 'funcionarios',
      titulo: 'Funcionarios ativos',
      descricao: `${resumo.funcionariosAtivos} colaborador(es) ativos.`,
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
    const { data: ciclos, error: erroCiclos } = await supabase
      .from('df_funcionarios_ferias_ciclos')
      .select(SELECT_CICLOS_FERIAS_PAINEL)
      .eq('empresa_id', empresaId)
      .eq('funcionario_id', funcionario.id)
      .eq('arquivado', false)

    if (erroCiclos) throw erroCiclos

    await Promise.all((ciclos || []).map(async (ciclo) => {
      const { data: periodos, error: erroPeriodos } = await supabase
        .from('df_funcionarios_ferias_periodos')
        .select(SELECT_PERIODOS_FERIAS_PAINEL)
        .eq('empresa_id', empresaId)
        .eq('funcionario_id', funcionario.id)
        .eq('ciclo_ferias_id', ciclo.id)
        .eq('arquivado', false)

      if (erroPeriodos) throw erroPeriodos

      const periodosAtivos = (periodos || []).filter(periodoConsomeSaldo)
      const saldo = calcularSaldoDiasFerias({
        diasDireito: ciclo.dias_direito || 30,
        periodosAtivos
      })

      if (saldo <= 0 || !ciclo.data_limite_gozo) return

      if (ciclo.data_limite_gozo < hoje) {
        feriasVencidas += 1
      } else if (limiteProximo && ciclo.data_limite_gozo <= limiteProximo) {
        feriasProximas += 1
      }
    }))
  }))

  return { feriasProximas, feriasVencidas }
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
        const [resumoFerias, folhaEmAberto] = await Promise.all([
          carregarResumoFerias({
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
          folhaEmAberto,
          aniversariosSemana: contarAniversariosSemana(ativos)
        }

        setResumo(proximoResumo)
        setAlertas(montarAlertas(proximoResumo))
      } catch (error) {
        if (cancelado || cargaAtualRef.current !== cargaId) return

        setErro(mensagemSeguraErro(error, 'Nao foi possivel carregar o resumo de Gestao de Pessoas.'))
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
