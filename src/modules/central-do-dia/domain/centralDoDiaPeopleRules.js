import {
  criarItemCentral,
  diferencaDiasCalendario,
  normalizarDataISO
} from './centralDoDiaRules.js'
import {
  derivarStatusPeriodoFerias,
  resumirCicloFerias
} from '../../../services/funcionariosFeriasRules.js'
const STATUS_FOLHA_AGENDA = new Set(['aberta', 'em_conferencia', 'pendente'])

function texto(valor) {
  return String(valor || '').trim()
}

function funcionarioAtivo(funcionario, filialId = '') {
  if (!funcionario || funcionario.arquivado || texto(funcionario.status).toLowerCase() !== 'ativo') return false
  return !filialId || texto(funcionario.filial_id) === texto(filialId)
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

function referenciaPessoa(tipo, id, funcionarioId, extras = {}) {
  return { tipo, id, funcionarioId: funcionarioId || null, ...extras }
}

function dadosPessoa(funcionario) {
  return {
    filialId: texto(funcionario?.filial_id) || null,
    funcionarioId: texto(funcionario?.id) || null
  }
}

function vinculosAtivosUnicosPorPessoa(funcionarios = [], filialId = '') {
  const porPessoa = new Map()
  for (const funcionario of funcionarios || []) {
    if (!funcionarioAtivo(funcionario, filialId)) continue
    const pessoaId = texto(funcionario.pessoa_id) || texto(funcionario.id)
    if (!porPessoa.has(pessoaId)) porPessoa.set(pessoaId, funcionario)
  }
  return [...porPessoa.entries()]
}

export function normalizarAniversariosAgenda(funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  return vinculosAtivosUnicosPorPessoa(funcionarios, filialId).map(([pessoaId, funcionario]) => {
    const dataReferencia = criarOcorrenciaAniversario(funcionario.data_nascimento, dataBaseISO)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (!dataReferencia || dias === null || dias < 0 || dias > 30) return null

    return criarItemCentral({
      id: `pessoas:aniversario:${pessoaId}`,
      tipo: 'aniversario',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(dias === 0 ? 'Aniversário hoje' : `Aniversário em ${dias} dia(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: 'info',
      status: dias === 0 ? 'vence_hoje' : 'informativo',
      proximaAcao: 'Abrir o acompanhamento de pessoas',
      destino: 'funcionarios',
      referenciaOrigem: referenciaPessoa('aniversario_pessoa', pessoaId, funcionario.id, { pessoaId }),
      origemOperacional: 'pessoas',
      ...dadosPessoa(funcionario)
    })
  }).filter(Boolean)
}

export function normalizarExamesAgenda(exames = [], funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  const funcionariosPorId = new Map((funcionarios || []).map((funcionario) => [texto(funcionario?.id), funcionario]))
  return (exames || []).map((exame) => {
    const funcionario = funcionariosPorId.get(texto(exame?.funcionario_id))
    const tipo = texto(exame?.tipo).toUpperCase()
    const estado = texto(exame?.estado).toUpperCase()
    const dataReferencia = normalizarDataISO(exame?.data_prevista)
    const desligado = texto(funcionario?.status).toLowerCase() === 'desligado'

    if (!exame?.id || !funcionario || exame.arquivado || estado !== 'PENDENTE' || !dataReferencia) return null
    if (funcionario.arquivado || (filialId && texto(funcionario.filial_id) !== texto(filialId))) return null
    if (desligado && tipo !== 'DEMISSIONAL') return null
    if (!desligado && !funcionarioAtivo(funcionario, filialId)) return null

    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (!dataReferencia || dias === null || dias > 30) return null

    const atrasado = dias < 0
    const tipoHumano = tipo === 'ADMISSIONAL' ? 'admissional' : tipo === 'DEMISSIONAL' ? 'demissional' : 'periódico'
    return criarItemCentral({
      id: `pessoas:exame:${exame.id}`,
      tipo: 'exame',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(atrasado
        ? `Exame ${tipoHumano} atrasado há ${Math.abs(dias)} dia(s)`
        : dias === 0
          ? `Exame ${tipoHumano} previsto para hoje`
          : `Exame ${tipoHumano} em ${dias} dia(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: atrasado ? 'critical' : dias <= 7 ? 'warning' : 'info',
      status: atrasado ? 'vencido' : dias === 0 ? 'vence_hoje' : 'pendente',
      inconsistencia: atrasado,
      proximaAcao: 'Abrir o acompanhamento de pessoas',
      destino: 'funcionarios',
      referenciaOrigem: referenciaPessoa('exame_ocupacional_pendente', exame.id, funcionario.id, {
        exameId: exame.id,
        exameTipo: tipo
      }),
      origemOperacional: 'pessoas',
      ...dadosPessoa(funcionario)
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
      referenciaOrigem: {
        tipo: 'competencia_folha',
        id: competencia.id,
        competenciaId: competencia.id,
        competencia: competencia.competencia
      },
      origemOperacional: 'pessoas'
    })
  }).filter(Boolean)
}

function periodosAtivosPorCiclo(periodos = []) {
  return (periodos || []).reduce((mapa, periodo) => {
    if (!periodo?.ciclo_ferias_id || periodo.arquivado || texto(periodo.status).toLowerCase() === 'cancelada') return mapa
    const chave = texto(periodo.ciclo_ferias_id)
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave).push(periodo)
    return mapa
  }, new Map())
}

export function normalizarLimitesFeriasAgenda(
  ciclos = [],
  periodos = [],
  funcionarios = [],
  { dataBaseISO, filialId = '' } = {}
) {
  const funcionariosPorId = new Map((funcionarios || []).map((funcionario) => [texto(funcionario?.id), funcionario]))
  const periodosPorCiclo = periodosAtivosPorCiclo(periodos)

  return (ciclos || []).map((ciclo) => {
    const funcionario = funcionariosPorId.get(texto(ciclo?.funcionario_id))
    if (!ciclo?.id || !funcionarioAtivo(funcionario, filialId)) return null

    let resumo
    try {
      resumo = resumirCicloFerias({
        ciclo,
        periodos: periodosPorCiclo.get(texto(ciclo.id)) || [],
        dataReferencia: dataBaseISO
      })
    } catch {
      return null
    }

    const dataReferencia = normalizarDataISO(ciclo.data_limite_gozo)
    const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
    if (
      resumo.saldoAindaNaoGozado <= 0 ||
      ['arquivada', 'cancelada', 'concluida'].includes(resumo.statusOperacional) ||
      !dataReferencia || dias === null || dias > 90
    ) return null

    const vencido = dias < 0
    const hoje = dias === 0
    const urgente = dias <= 30
    const descricaoPrazo = vencido
      ? `Limite de férias vencido há ${Math.abs(dias)} dia(s)`
      : hoje
        ? 'Limite de férias vence hoje'
        : `Limite de férias em ${dias} dia(s)`

    return criarItemCentral({
      id: `pessoas:ferias:limite:${ciclo.id}`,
      tipo: 'ferias_limite',
      modulo: 'Gestão de Pessoas',
      titulo: texto(funcionario.nome) || 'Colaborador',
      descricao: descricaoPessoa(`${descricaoPrazo} • ${resumo.saldoAindaNaoGozado} dia(s) ainda não gozado(s) • ${resumo.saldoLivreParaProgramar} dia(s) livre(s)`, funcionario),
      dataReferencia,
      dias,
      severidade: vencido ? 'critical' : urgente ? 'warning' : 'info',
      status: vencido ? 'vencido' : hoje ? 'vence_hoje' : urgente ? 'pendente' : 'planejamento',
      inconsistencia: vencido,
      proximaAcao: resumo.saldoLivreParaProgramar <= 0
        ? 'Acompanhar as férias já programadas'
        : vencido ? 'Regularizar o saldo de férias' : 'Planejar o saldo de férias',
      destino: 'ferias',
      referenciaOrigem: referenciaPessoa('ciclo_ferias_limite', ciclo.id, funcionario.id, {
        cicloId: ciclo.id
      }),
      origemOperacional: 'pessoas',
      ...dadosPessoa(funcionario)
    })
  }).filter(Boolean)
}

function criarMarcoFerias({ periodo, funcionario, tipo, dataReferencia, dataBaseISO, rotulo, acao }) {
  const data = normalizarDataISO(dataReferencia)
  const dias = diferencaDiasCalendario(data, dataBaseISO)
  if (!data || dias === null || dias < 0 || dias > 90) return null

  return criarItemCentral({
    id: `pessoas:ferias:${tipo}:${periodo.id}`,
    tipo: `ferias_${tipo}`,
    modulo: 'Gestão de Pessoas',
    titulo: texto(funcionario.nome) || 'Colaborador',
    descricao: descricaoPessoa(dias === 0 ? `${rotulo} hoje` : `${rotulo} em ${dias} dia(s)`, funcionario),
    dataReferencia: data,
    dias,
    severidade: dias <= 7 ? 'warning' : 'info',
    status: dias === 0 ? 'vence_hoje' : 'pendente',
    proximaAcao: acao,
    destino: 'ferias',
    referenciaOrigem: referenciaPessoa(`periodo_ferias_${tipo}`, periodo.id, funcionario.id, {
      periodoId: periodo.id,
      cicloId: periodo.ciclo_ferias_id || null
    }),
    origemOperacional: 'pessoas',
    ...dadosPessoa(funcionario)
  })
}

export function normalizarMarcosFeriasAgenda(periodos = [], funcionarios = [], { dataBaseISO, filialId = '' } = {}) {
  const funcionariosPorId = new Map((funcionarios || []).map((funcionario) => [texto(funcionario?.id), funcionario]))

  return (periodos || []).flatMap((periodo) => {
    const funcionario = funcionariosPorId.get(texto(periodo?.funcionario_id))
    const statusOperacional = derivarStatusPeriodoFerias(periodo, dataBaseISO)
    if (!periodo?.id || !funcionarioAtivo(funcionario, filialId) || ['cancelada', 'arquivada', 'gozada'].includes(statusOperacional)) return []

    return [
      criarMarcoFerias({ periodo, funcionario, tipo: 'inicio', dataReferencia: periodo.data_inicio, dataBaseISO, rotulo: 'Férias iniciam', acao: 'Conferir o início das férias' }),
      criarMarcoFerias({ periodo, funcionario, tipo: 'fim', dataReferencia: periodo.data_fim_calculada, dataBaseISO, rotulo: 'Último dia de férias', acao: 'Conferir o encerramento das férias' }),
      criarMarcoFerias({ periodo, funcionario, tipo: 'retorno', dataReferencia: periodo.data_retorno_trabalho, dataBaseISO, rotulo: 'Retorno ao trabalho', acao: 'Acompanhar o retorno ao trabalho' })
    ].filter(Boolean)
  })
}

export function projetarEventosPessoas({
  funcionarios = [],
  ciclosFerias = [],
  periodosFerias = [],
  exames = [],
  competenciasFolha = [],
  dataBaseISO,
  filialId = ''
} = {}) {
  return [
    ...normalizarAniversariosAgenda(funcionarios, { dataBaseISO, filialId }),
    ...normalizarLimitesFeriasAgenda(ciclosFerias, periodosFerias, funcionarios, { dataBaseISO, filialId }),
    ...normalizarMarcosFeriasAgenda(periodosFerias, funcionarios, { dataBaseISO, filialId }),
    ...normalizarExamesAgenda(exames, funcionarios, { dataBaseISO, filialId }),
    ...normalizarCompetenciasFolhaAgenda(competenciasFolha, { dataBaseISO, filialId })
  ]
}

export function criarDestinoContextualEventoPessoas(item, origem = '') {
  if (item?.origemOperacional !== 'pessoas' || !item?.destino) return null
  return {
    tela: item.destino,
    opcoes: {
      origem: texto(origem) || null,
      contexto: {
        ...(item.referenciaOrigem || {}),
        telaRetorno: texto(origem) || null
      }
    }
  }
}
