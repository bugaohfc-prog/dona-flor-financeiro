const DIA_MS = 86400000

const PESO_SEVERIDADE = Object.freeze({
  critical: 3,
  critica: 3,
  alta: 3,
  warning: 2,
  atencao: 2,
  media: 2,
  info: 1,
  baixa: 1
})

const ROTULOS_ACAO_AUDITORIA = Object.freeze({
  'financeiro.conta.criada': 'Conta criada',
  'financeiro.conta.atualizada': 'Conta atualizada',
  'financeiro.pagamento_parcial.criado': 'Pagamento parcial criado'
})

const ROTULOS_MODULO = Object.freeze({
  financeiro: 'Financeiro',
  rh: 'Gestão de Pessoas',
  usuarios: 'Usuários',
  sistema: 'Sistema'
})

const TIPOS_PESSOAS_ACIONAVEIS = new Set(['folha', 'ferias', 'exames'])

function normalizarTexto(valor) {
  return String(valor || '').trim().toLowerCase()
}

export function normalizarDataISO(valor) {
  const texto = String(valor || '').slice(0, 10)
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!correspondencia) return null

  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  const dia = Number(correspondencia[3])
  const data = new Date(Date.UTC(ano, mes - 1, dia))

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) return null

  return texto
}

export function hojeLocalISO(dataBase = new Date()) {
  if (!(dataBase instanceof Date) || Number.isNaN(dataBase.getTime())) return null
  return [
    dataBase.getFullYear(),
    String(dataBase.getMonth() + 1).padStart(2, '0'),
    String(dataBase.getDate()).padStart(2, '0')
  ].join('-')
}

export function diferencaDiasCalendario(dataReferencia, dataBaseISO) {
  const referencia = normalizarDataISO(dataReferencia)
  const base = normalizarDataISO(dataBaseISO)
  if (!referencia || !base) return null

  const [anoReferencia, mesReferencia, diaReferencia] = referencia.split('-').map(Number)
  const [anoBase, mesBase, diaBase] = base.split('-').map(Number)

  return Math.round((
    Date.UTC(anoReferencia, mesReferencia - 1, diaReferencia) -
    Date.UTC(anoBase, mesBase - 1, diaBase)
  ) / DIA_MS)
}

function valorFinanceiroSeguro(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function contaInativa(conta) {
  return Boolean(
    !conta ||
    normalizarTexto(conta.status) === 'pago' ||
    conta.oculto ||
    conta.arquivado ||
    conta.excluido ||
    conta.deletado
  )
}

function notaInativa(nota) {
  return Boolean(!nota || nota.concluida || nota.arquivada || nota.excluido)
}

function pertenceFilial(item, filialId) {
  if (!filialId) return true
  return String(item?.filial_id || '') === String(filialId)
}

function prioridadePorFaixa(indice) {
  if (indice <= 1) return 'critica'
  if (indice <= 3) return 'alta'
  if (indice <= 5) return 'media'
  return 'baixa'
}

export function calcularIndicePrioridade(item) {
  const status = normalizarTexto(item?.status)
  const severidade = normalizarTexto(item?.severidade)
  const dias = Number.isFinite(item?.dias) ? item.dias : null

  if (status === 'falha' && ['critical', 'critica', 'alta'].includes(severidade)) return 0
  if (status === 'bloqueado') return 1
  if (dias !== null && dias < 0) return 2
  if (dias === 0) return 3
  if (dias !== null && dias > 0 && dias <= 7) return 4
  if (item?.inconsistencia) return 5
  return 6
}

export function compararPrioridade(a, b) {
  const indiceA = calcularIndicePrioridade(a)
  const indiceB = calcularIndicePrioridade(b)
  if (indiceA !== indiceB) return indiceA - indiceB

  const atrasoA = Number.isFinite(a?.dias) && a.dias < 0 ? Math.abs(a.dias) : 0
  const atrasoB = Number.isFinite(b?.dias) && b.dias < 0 ? Math.abs(b.dias) : 0
  if (atrasoA !== atrasoB) return atrasoB - atrasoA

  const severidadeA = PESO_SEVERIDADE[normalizarTexto(a?.severidade)] || 0
  const severidadeB = PESO_SEVERIDADE[normalizarTexto(b?.severidade)] || 0
  if (severidadeA !== severidadeB) return severidadeB - severidadeA

  const valorA = valorFinanceiroSeguro(a?.valor) || 0
  const valorB = valorFinanceiroSeguro(b?.valor) || 0
  if (valorA !== valorB) return valorB - valorA

  const dataA = normalizarDataISO(a?.dataReferencia) || '9999-12-31'
  const dataB = normalizarDataISO(b?.dataReferencia) || '9999-12-31'
  if (dataA !== dataB) return dataA.localeCompare(dataB)

  return String(a?.id || '').localeCompare(String(b?.id || ''))
}

export function criarItemCentral(dados = {}) {
  if (!dados.id || !dados.tipo || !dados.modulo || !dados.titulo) return null

  const itemBase = {
    id: String(dados.id),
    tipo: String(dados.tipo),
    modulo: String(dados.modulo),
    titulo: String(dados.titulo).trim(),
    descricao: String(dados.descricao || '').trim(),
    dataReferencia: normalizarDataISO(dados.dataReferencia),
    dataHora: dados.dataHora ? String(dados.dataHora) : null,
    dias: Number.isFinite(dados.dias) ? dados.dias : null,
    valor: valorFinanceiroSeguro(dados.valor),
    severidade: dados.severidade || 'info',
    status: dados.status || 'informativo',
    inconsistencia: Boolean(dados.inconsistencia),
    proximaAcao: dados.proximaAcao || 'Abrir o módulo de origem',
    destino: dados.destino || null,
    referenciaOrigem: dados.referenciaOrigem || null,
    ator: dados.ator || null
  }

  const indice = calcularIndicePrioridade(itemBase)
  return { ...itemBase, prioridade: prioridadePorFaixa(indice) }
}

export function normalizarContasCentral(contas = [], { dataBaseISO, filialId } = {}) {
  return (contas || [])
    .filter((conta) => !contaInativa(conta) && pertenceFilial(conta, filialId))
    .map((conta) => {
      const dataReferencia = normalizarDataISO(conta.data_vencimento || conta.vencimento)
      const dias = diferencaDiasCalendario(dataReferencia, dataBaseISO)
      if (!dataReferencia || dias === null) return null

      const impostoTipo = normalizarTexto(conta.imposto_tipo)
      const ehImposto = ['simples_nacional', 'inss', 'fgts'].includes(impostoTipo)
      const vencida = dias < 0

      return criarItemCentral({
        id: `conta:${conta.id}`,
        tipo: ehImposto ? 'imposto' : 'conta',
        modulo: ehImposto ? 'Controle de Impostos' : 'Contas',
        titulo: String(conta.descricao || (ehImposto ? 'Imposto sem descrição' : 'Conta sem descrição')).trim(),
        descricao: vencida ? `Vencida há ${Math.abs(dias)} dia(s)` : dias === 0 ? 'Vence hoje' : `Vence em ${dias} dia(s)`,
        dataReferencia,
        dias,
        valor: conta.valor,
        severidade: vencida ? 'critical' : dias <= 7 ? 'warning' : 'info',
        status: vencida ? 'vencido' : dias === 0 ? 'vence_hoje' : 'pendente',
        inconsistencia: vencida,
        proximaAcao: vencida ? 'Revisar ou registrar o pagamento' : 'Conferir o vencimento',
        destino: ehImposto ? 'controle-impostos' : 'contas',
        referenciaOrigem: { tipo: 'conta', id: conta.id }
      })
    })
    .filter(Boolean)
}

export function normalizarNotasCentral(notas = [], { dataBaseISO, filialId } = {}) {
  return (notas || [])
    .filter((nota) => !notaInativa(nota) && pertenceFilial(nota, filialId))
    .map((nota) => {
      const dataReferencia = normalizarDataISO(nota.data_evento)
      const dias = dataReferencia ? diferencaDiasCalendario(dataReferencia, dataBaseISO) : null
      const prioridadeRegistrada = normalizarTexto(nota.prioridade) || 'normal'
      const urgente = ['urgente', 'critico'].includes(prioridadeRegistrada)
      const atrasada = dias !== null && dias < 0

      return criarItemCentral({
        id: `nota:${nota.id}`,
        tipo: 'nota',
        modulo: 'Notas',
        titulo: String(nota.titulo || 'Nota sem título').trim(),
        descricao: atrasada ? `Atrasada há ${Math.abs(dias)} dia(s)` : dias === 0 ? 'Prazo hoje' : urgente ? 'Prioridade registrada como urgente' : dataReferencia ? `Prazo em ${dias} dia(s)` : 'Sem data definida',
        dataReferencia,
        dias,
        severidade: prioridadeRegistrada === 'critico' ? 'critical' : urgente || atrasada ? 'warning' : 'info',
        status: atrasada ? 'vencido' : dias === 0 ? 'vence_hoje' : urgente ? 'urgente' : 'pendente',
        inconsistencia: atrasada || urgente,
        proximaAcao: 'Revisar a nota pendente',
        destino: 'notas',
        referenciaOrigem: { tipo: 'nota', id: nota.id }
      })
    })
    .filter(Boolean)
}

export function normalizarAlertasPessoasCentral(alertas = [], permitido = true) {
  if (!permitido) return []

  return (alertas || [])
    .filter((alerta) => alerta?.id && alerta?.titulo && TIPOS_PESSOAS_ACIONAVEIS.has(alerta.tipo))
    .map((alerta) => criarItemCentral({
      id: `pessoas:${alerta.id}`,
      tipo: alerta.tipo,
      modulo: 'Gestão de Pessoas',
      titulo: alerta.titulo,
      descricao: alerta.descricao,
      severidade: alerta.prioridade === 'alta' ? 'warning' : 'info',
      status: alerta.prioridade === 'alta' ? 'atencao' : 'informativo',
      inconsistencia: alerta.prioridade === 'alta',
      proximaAcao: 'Abrir o acompanhamento de pessoas',
      destino: alerta.rotaDestino || null,
      referenciaOrigem: { tipo: alerta.tipo, id: alerta.id }
    }))
    .filter(Boolean)
}

function atorLegivel(evento) {
  if (evento?.ator_nome) return String(evento.ator_nome).trim()
  if (evento?.user_id) return 'Usuário da empresa'
  return normalizarTexto(evento?.origem) === 'sistema' ? 'Sistema' : 'Não informado'
}

export function normalizarAtividadeCentral(eventos = [], permitido = true) {
  if (!permitido) return []

  return (eventos || []).map((evento) => {
    const acao = String(evento?.acao || '')
    const modulo = normalizarTexto(evento?.modulo)
    const titulo = ROTULOS_ACAO_AUDITORIA[acao] || acao
      .split('.')
      .slice(-2)
      .join(' ')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letra) => letra.toUpperCase()) || 'Evento operacional'

    return criarItemCentral({
      id: `auditoria:${evento.id}`,
      tipo: 'atividade',
      modulo: ROTULOS_MODULO[modulo] || 'Operação',
      titulo,
      descricao: evento.status === 'falha' ? 'A operação registrou uma falha.' : evento.status === 'bloqueado' ? 'A operação foi bloqueada.' : 'Operação registrada no histórico.',
      dataReferencia: evento.criado_em,
      dataHora: evento.criado_em,
      severidade: evento.severidade || 'info',
      status: evento.status || 'sucesso',
      inconsistencia: ['falha', 'bloqueado'].includes(normalizarTexto(evento.status)),
      proximaAcao: 'Consultar o histórico do evento',
      destino: 'auditoria',
      referenciaOrigem: { tipo: 'evento_auditoria', id: evento.id },
      ator: atorLegivel(evento)
    })
  }).filter(Boolean)
}

export function agruparProximosVencimentos(itens = []) {
  const grupos = [
    { id: 'hoje', titulo: 'Hoje', inicio: 0, fim: 0, itens: [] },
    { id: 'sete_dias', titulo: 'Próximos 7 dias', inicio: 1, fim: 7, itens: [] },
    { id: 'quinze_dias', titulo: 'De 8 a 15 dias', inicio: 8, fim: 15, itens: [] },
    { id: 'trinta_dias', titulo: 'De 16 a 30 dias', inicio: 16, fim: 30, itens: [] }
  ]

  itens.forEach((item) => {
    if (!Number.isFinite(item?.dias) || item.dias < 0 || item.dias > 30) return
    const grupo = grupos.find((candidato) => item.dias >= candidato.inicio && item.dias <= candidato.fim)
    if (grupo) grupo.itens.push(item)
  })

  return grupos.map((grupo) => ({
    ...grupo,
    itens: [...grupo.itens].sort(compararPrioridade).slice(0, 4)
  }))
}

export function resolverEstadoBloco({ empresaId, permitido = true, carregando = false, erro = null, itens = [] } = {}) {
  if (!empresaId) return 'empresa_ausente'
  if (!permitido) return 'sem_permissao'
  if (carregando) return 'carregando'
  if (erro) return 'erro'
  return itens.length ? 'preenchido' : 'vazio'
}

export function montarCentralDoDia({
  contas = [],
  notas = [],
  alertasPessoas = [],
  atividade = [],
  dataBaseISO = hojeLocalISO(),
  filialId = '',
  podeAcessarPessoas = false,
  podeAcessarAuditoria = false
} = {}) {
  const contasNormalizadas = normalizarContasCentral(contas, { dataBaseISO, filialId })
  const notasNormalizadas = normalizarNotasCentral(notas, { dataBaseISO, filialId })
  const pessoasNormalizadas = normalizarAlertasPessoasCentral(alertasPessoas, podeAcessarPessoas)
  const atividadeNormalizada = normalizarAtividadeCentral(atividade, podeAcessarAuditoria)

  const acoesImediatas = [
    ...contasNormalizadas.filter((item) => item.dias !== null && item.dias <= 0),
    ...notasNormalizadas.filter((item) => item.inconsistencia || item.dias === 0),
    ...pessoasNormalizadas,
    ...atividadeNormalizada.filter((item) => item.inconsistencia)
  ].sort(compararPrioridade).slice(0, 6)

  const proximosVencimentos = agruparProximosVencimentos([
    ...contasNormalizadas,
    ...notasNormalizadas.filter((item) => item.dataReferencia)
  ])

  const excecoes = [
    ...contasNormalizadas.filter((item) => item.status === 'vencido'),
    ...notasNormalizadas.filter((item) => item.inconsistencia),
    ...pessoasNormalizadas.filter((item) => item.inconsistencia),
    ...atividadeNormalizada.filter((item) => item.inconsistencia)
  ].sort(compararPrioridade).slice(0, 6)

  const atividadeRecente = [...atividadeNormalizada]
    .sort((a, b) => String(b.dataHora || '').localeCompare(String(a.dataHora || '')) || String(a.id).localeCompare(String(b.id)))
    .slice(0, 6)

  return {
    acoesImediatas,
    proximosVencimentos,
    excecoes,
    atividadeRecente,
    totalProximos: proximosVencimentos.reduce((total, grupo) => total + grupo.itens.length, 0)
  }
}
