import {
  criarItemCentral,
  diferencaDiasCalendario,
  normalizarDataISO
} from './centralDoDiaRules.js'
import { calcularProximoPeriodico } from '../../../services/funcionariosExamesPeriodicosRules.js'

const STATUS_FOLHA_AGENDA = new Set(['aberta', 'em_conferencia', 'pendente'])

function texto(valor) {
  return String(valor || '').trim()
}

function funcionarioAtivo(funcionario, filialId = '') {
  if (!funcionario || funcionario.arquivado || texto(funcionario.status).toLowerCase() !== 'ativo') return false
  return !filialId || texto(funcionario.filial_id) === texto(filialId)
}

function somarDiasISO(dataISO, quantidade) {
  const data = normalizarDataISO(dataISO)
  if (!data || !Number.isInteger(quantidade)) return null
  const [ano, mes, dia] = data.split('-').map(Number)
  const resultado = new Date(Date.UTC(ano, mes - 1, dia + quantidade))
  return [
    resultado.getUTCFullYear(),
    String(resultado.getUTCMonth() + 1).padStart(2, '0'),
    String(resultado.getUTCDate()).padStart(2, '0')
  ].join('-')
}

function criarOcorrenciaAniversario(dataNascimento, dataBaseISO) {
  const nascimento = normalizarDataISO(dataNascimento)
  const base = normalizarDataISO(dataBaseISO)
  if (!nascimento || !base) return null
  const [, mes, dia] = nascimento.split('-')
  const anoBase = Number(base.slice(0, 4))

  for (const ano of [anoBase, anoBase + 1]) {
    const candidata = normalizarDataISO(`${ano}-${mes}-${dia}`)
    if (candidata && diferencaDiasCalendario(candidata, base) >= 0) return candidata
  }
  return null
}

function descricaoPessoa(rotulo, funcionario) {
  return funcionario?.cargo ? `${rotulo} • ${texto(funcionario.cargo)}` : rotulo
}

export function normalizarAniversariosAgenda(funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  return (funcionarios || []).filter((funcionario) => funcionarioAtivo(funcionario, filialId)).map((funcionario) => {
    const dataReferencia = criarOcorrenciaAniversario(funcionario.data_nascimento, dataBaseISO)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (!dataReferencia || dias === null || dias < 0 || dias > 30) return null

    return criarItemCentral({
      id: `pessoas:aniversario:${funcionario.id}`,
      tipo: 'aniversario',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(dias === 0 ? 'Aniversário hoje' : `Aniversário em ${dias} dia(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: 'info',
      status: dias === 0 ? 'vence_hoje' : 'informativo',
      proximaAcao: 'Abrir o acompanhamento de pessoas',
      destino: 'relatorios-pessoas',
      referenciaOrigem: { tipo: 'aniversario_funcionario', id: funcionario.id },
      origemOperacional: 'pessoas'
    })
  }).filter(Boolean)
}

export function normalizarFeriasAgenda(periodos = [], funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  const funcionariosPorId = new Map((funcionarios || []).map((funcionario) => [texto(funcionario?.id), funcionario]))
  return (periodos || []).map((periodo) => {
    const funcionario = funcionariosPorId.get(texto(periodo?.funcionario_id))
    const dataReferencia = normalizarDataISO(periodo?.data_inicio)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (
      !periodo?.id || periodo.arquivado || texto(periodo.status).toLowerCase() !== 'agendada' ||
      !funcionarioAtivo(funcionario, filialId) || !dataReferencia || dias === null || dias < 0 || dias > 30
    ) return null

    return criarItemCentral({
      id: `pessoas:ferias:${periodo.id}`,
      tipo: 'ferias',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(dias === 0 ? 'Férias iniciam hoje' : `Férias iniciam em ${dias} dia(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: dias <= 7 ? 'warning' : 'info',
      status: dias === 0 ? 'vence_hoje' : 'pendente',
      proximaAcao: 'Conferir o período de férias',
      destino: 'ferias',
      referenciaOrigem: { tipo: 'periodo_ferias', id: periodo.id },
      origemOperacional: 'pessoas'
    })
  }).filter(Boolean)
}

export function obterUltimosExamesPorFuncionario(exames = []) {
  return (exames || []).reduce((mapa, exame) => {
    const funcionarioId = texto(exame?.funcionario_id)
    const dataExame = normalizarDataISO(exame?.data_exame)
    if (!funcionarioId || !dataExame || exame.arquivado) return mapa
    const atual = mapa.get(funcionarioId)
    if (!atual || dataExame > atual.data_exame) mapa.set(funcionarioId, { ...exame, data_exame: dataExame })
    return mapa
  }, new Map())
}

export function normalizarExamesAgenda(exames = [], funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  const ultimos = obterUltimosExamesPorFuncionario(exames)
  return (funcionarios || []).filter((funcionario) => funcionarioAtivo(funcionario, filialId)).map((funcionario) => {
    const ultimo = ultimos.get(texto(funcionario.id))
    const dataBaseExame = ultimo?.data_exame || normalizarDataISO(funcionario.data_exame_admissional)
    const dataReferencia = calcularProximoPeriodico(dataBaseExame)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (!dataReferencia || dias === null || dias > 30) return null

    const atrasado = dias < 0
    return criarItemCentral({
      id: `pessoas:exame:${funcionario.id}`,
      tipo: 'exame',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(atrasado ? `Exame periódico atrasado há ${Math.abs(dias)} dia(s)` : dias === 0 ? 'Exame periódico previsto para hoje' : `Exame periódico em ${dias} dia(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: atrasado ? 'critical' : dias <= 7 ? 'warning' : 'info',
      status: atrasado ? 'vencido' : dias === 0 ? 'vence_hoje' : 'pendente',
      inconsistencia: atrasado,
      proximaAcao: 'Abrir o acompanhamento de pessoas',
      destino: 'relatorios-pessoas',
      referenciaOrigem: { tipo: 'exame_periodico_previsto', id: funcionario.id },
      origemOperacional: 'pessoas'
    })
  }).filter(Boolean)
}

export function ultimoDiaCompetencia(competencia) {
  const valor = texto(competencia)
  const correspondencia = /^(\d{4})-(\d{2})$/.exec(valor)
  if (!correspondencia) return null
  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  if (mes < 1 || mes > 12) return null
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}

export function normalizarCompetenciasFolhaAgenda(competencias = [], { dataBaseISO, filialId = '' } = {}) {
  return (competencias || []).map((competencia) => {
    const status = texto(competencia?.status).toLowerCase()
    const dataReferencia = ultimoDiaCompetencia(competencia?.competencia)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (!competencia?.id || competencia.arquivado || !STATUS_FOLHA_AGENDA.has(status) || !dataReferencia || dias === null) return null

    const rotuloStatus = status === 'em_conferencia' ? 'Em conferência' : status === 'pendente' ? 'Pendente' : 'Aberta'
    return criarItemCentral({
      id: `pessoas:folha:${competencia.id}`,
      tipo: 'folha',
      modulo: 'Fechamento de Folha',
      titulo: `Folha ${texto(competencia.competencia)}`,
      descricao: `${rotuloStatus}${filialId ? ' • Escopo da empresa' : ''}`,
      dataReferencia,
      dias,
      severidade: dias < 0 ? 'warning' : 'info',
      status: dias < 0 ? 'vencido' : status,
      inconsistencia: dias < 0,
      proximaAcao: 'Conferir a competência da folha',
      destino: 'fechamento-folha',
      referenciaOrigem: { tipo: 'competencia_folha', id: competencia.id },
      origemOperacional: 'pessoas'
    })
  }).filter(Boolean)
}

export function normalizarPessoasDetalhadasAgenda({
  funcionarios = [],
  ferias = [],
  exames = [],
  competenciasFolha = [],
  dataBaseISO,
  filialId = ''
} = {}) {
  return [
    ...normalizarAniversariosAgenda(funcionarios, { dataBaseISO, filialId }),
    ...normalizarFeriasAgenda(ferias, funcionarios, { dataBaseISO, filialId }),
    ...normalizarExamesAgenda(exames, funcionarios, { dataBaseISO, filialId }),
    ...normalizarCompetenciasFolhaAgenda(competenciasFolha, { dataBaseISO, filialId })
  ]
}

export function calcularFimJanelaAgenda(dataBaseISO) {
  return somarDiasISO(dataBaseISO, 30)
}
