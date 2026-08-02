import assert from 'node:assert/strict'
import test from 'node:test'
import {
  criarDestinoContextualEventoPessoas,
  normalizarAniversariosAgenda,
  normalizarCompetenciasFolhaAgenda,
  normalizarExamesAgenda,
  normalizarLimitesFeriasAgenda,
  normalizarMarcosFeriasAgenda,
  obterUltimosExamesPorFuncionario,
  projetarEventosPessoas
} from './centralDoDiaPeopleRules.js'
import { montarBaseOperacional } from './centralDoDiaRules.js'
import { resumirAgendaOperacional, selecionarAgendaPorOrigem, selecionarResumoDashboard } from './centralDoDiaSelectors.js'

const hoje = '2026-07-15'
const funcionario = {
  id: 'func-1',
  nome: 'Pessoa Teste',
  cargo: 'Atendimento',
  status: 'ativo',
  arquivado: false,
  filial_id: 'filial-1',
  data_nascimento: '1990-07-15',
  data_exame_admissional: '2025-07-20'
}

test('normaliza aniversario de hoje sem expor a data de nascimento', () => {
  const [item] = normalizarAniversariosAgenda([funcionario], { dataBaseISO: hoje })
  assert.equal(item.dias, 0)
  assert.equal(item.dataReferencia, hoje)
  assert.equal(JSON.stringify(item).includes('1990-07-15'), false)
})

test('inclui aniversario futuro em ate trinta dias e exclui o posterior', () => {
  const dentro = { ...funcionario, id: 'dentro', data_nascimento: '1990-08-10' }
  const fora = { ...funcionario, id: 'fora', data_nascimento: '1990-09-01' }
  assert.deepEqual(normalizarAniversariosAgenda([dentro, fora], { dataBaseISO: hoje }).map((item) => item.referenciaOrigem.id), ['dentro'])
})

test('calcula aniversario na virada do ano', () => {
  const virada = { ...funcionario, data_nascimento: '1990-01-05' }
  const [item] = normalizarAniversariosAgenda([virada], { dataBaseISO: '2026-12-20' })
  assert.equal(item.dataReferencia, '2027-01-05')
  assert.equal(item.dias, 16)
})

test('aniversario em 29 de fevereiro aparece no ano bissexto e nao inventa data no ano comum', () => {
  const bissexto = { ...funcionario, data_nascimento: '1992-02-29' }
  const [item] = normalizarAniversariosAgenda([bissexto], { dataBaseISO: '2028-02-01' })
  assert.equal(item.dataReferencia, '2028-02-29')
  assert.deepEqual(normalizarAniversariosAgenda([bissexto], { dataBaseISO: '2027-02-01' }), [])
})

test('exclui funcionario inativo, arquivado ou de outra filial dos aniversarios', () => {
  const inativo = { ...funcionario, id: 'inativo', status: 'desligado' }
  const arquivado = { ...funcionario, id: 'arquivado', arquivado: true }
  assert.deepEqual(normalizarAniversariosAgenda([inativo, arquivado, funcionario], { dataBaseISO: hoje, filialId: 'filial-2' }), [])
  assert.equal(normalizarAniversariosAgenda([funcionario], { dataBaseISO: hoje, filialId: 'filial-1' }).length, 1)
})

test('normaliza ferias agendadas e filtra pela filial do funcionario', () => {
  const periodo = { id: 'ferias-1', funcionario_id: funcionario.id, data_inicio: '2026-07-25', status: 'agendada', arquivado: false }
  assert.equal(normalizarMarcosFeriasAgenda([periodo], [funcionario], { dataBaseISO: hoje, filialId: 'filial-1' }).length, 1)
  assert.equal(normalizarMarcosFeriasAgenda([periodo], [funcionario], { dataBaseISO: hoje, filialId: 'filial-2' }).length, 0)
})

test('exclui ferias arquivadas, canceladas e fora da janela', () => {
  const base = { funcionario_id: funcionario.id, data_inicio: '2026-07-25' }
  const periodos = [
    { ...base, id: 'arquivada', status: 'agendada', arquivado: true },
    { ...base, id: 'cancelada', status: 'cancelada', arquivado: false },
    { ...base, id: 'fora', status: 'agendada', arquivado: false, data_inicio: '2026-10-20' }
  ]
  assert.deepEqual(normalizarMarcosFeriasAgenda(periodos, [funcionario], { dataBaseISO: hoje }), [])
})

test('seleciona o ultimo exame por funcionario em lote', () => {
  const mapa = obterUltimosExamesPorFuncionario([
    { id: 'antigo', funcionario_id: funcionario.id, data_exame: '2024-07-10', arquivado: false },
    { id: 'novo', funcionario_id: funcionario.id, data_exame: '2025-07-10', arquivado: false },
    { id: 'arquivado', funcionario_id: funcionario.id, data_exame: '2026-07-10', arquivado: true }
  ])
  assert.equal(mapa.get(funcionario.id).id, 'novo')
})

test('normaliza exame atrasado e exame futuro em ate trinta dias', () => {
  const atrasado = { ...funcionario, id: 'atrasado', data_exame_admissional: '2025-07-01' }
  const futuro = { ...funcionario, id: 'futuro', data_exame_admissional: '2025-08-01' }
  const itens = normalizarExamesAgenda([], [atrasado, futuro], { dataBaseISO: hoje })
  assert.deepEqual(itens.map((item) => item.referenciaOrigem.id), ['atrasado', 'futuro'])
  assert.equal(itens[0].inconsistencia, true)
  assert.equal(itens[1].dias, 17)
})

test('exclui exame fora de trinta dias, sem base oficial e de outra filial', () => {
  const distante = { ...funcionario, id: 'distante', data_exame_admissional: '2025-10-01' }
  const semBase = { ...funcionario, id: 'sem-base', data_exame_admissional: null }
  assert.deepEqual(normalizarExamesAgenda([], [distante, semBase], { dataBaseISO: hoje }), [])
  assert.deepEqual(normalizarExamesAgenda([], [funcionario], { dataBaseISO: hoje, filialId: 'filial-2' }), [])
})

test('item de exame nao contem resultado, laudo, diagnostico ou CID', () => {
  const [item] = normalizarExamesAgenda([
    { funcionario_id: funcionario.id, data_exame: '2025-07-10', resultado: 'restrito', cid: 'restrito', laudo: 'restrito' }
  ], [funcionario], { dataBaseISO: hoje })
  for (const proibido of ['resultado', 'laudo', 'diagnostico', 'cid']) {
    assert.equal(Object.prototype.hasOwnProperty.call(item, proibido), false)
  }
})

test('mantem competencias abertas, em conferencia e pendentes', () => {
  const competencias = ['aberta', 'em_conferencia', 'pendente'].map((status, indice) => ({
    id: `folha-${indice}`, competencia: '2026-07', status, arquivado: false
  }))
  assert.equal(normalizarCompetenciasFolhaAgenda(competencias, { dataBaseISO: hoje }).length, 3)
})

test('exclui competencia fechada e arquivada', () => {
  const competencias = [
    { id: 'fechada', competencia: '2026-07', status: 'fechada', arquivado: false },
    { id: 'arquivada', competencia: '2026-07', status: 'aberta', arquivado: true }
  ]
  assert.deepEqual(normalizarCompetenciasFolhaAgenda(competencias, { dataBaseISO: hoje }), [])
})

test('preserva competencia de escopo da empresa quando ha filial selecionada', () => {
  const [item] = normalizarCompetenciasFolhaAgenda([
    { id: 'folha', competencia: '2026-07', status: 'aberta', arquivado: false }
  ], { dataBaseISO: hoje, filialId: 'filial-1' })
  assert.match(item.descricao, /Escopo da empresa/)
})

test('descarta datas invalidas com seguranca', () => {
  const funcionarioInvalido = { ...funcionario, data_nascimento: '2026-02-30', data_exame_admissional: 'invalida' }
  assert.deepEqual(normalizarAniversariosAgenda([funcionarioInvalido], { dataBaseISO: hoje }), [])
  assert.deepEqual(normalizarExamesAgenda([], [funcionarioInvalido], { dataBaseISO: hoje }), [])
  assert.deepEqual(normalizarCompetenciasFolhaAgenda([{ id: 'x', competencia: '2026-13', status: 'aberta' }], { dataBaseISO: hoje }), [])
})

test('itens detalhados passam pela deduplicacao oficial', () => {
  const itens = projetarEventosPessoas({ funcionarios: [funcionario], dataBaseISO: hoje })
  const duplicado = { ...itens[0], id: 'duplicado' }
  const base = montarBaseOperacional({ itensPessoasDetalhados: [...itens, duplicado], podeAcessarPessoas: true, dataBaseISO: hoje })
  assert.equal(base.itensOperacionais.length, 2)
  assert.equal(base.itensOperacionais.filter((item) => item.tipo === 'aniversario').length, 1)
})

test('itens detalhados nao entram sem permissao de Pessoas', () => {
  const itens = projetarEventosPessoas({ funcionarios: [funcionario], dataBaseISO: hoje })
  assert.equal(montarBaseOperacional({ itensPessoasDetalhados: itens, podeAcessarPessoas: false }).itensOperacionais.length, 0)
})

test('filtra agenda por origem e recalcula contadores sem duplicar itens', () => {
  const pessoas = projetarEventosPessoas({ funcionarios: [funcionario], dataBaseISO: hoje })
  const base = montarBaseOperacional({
    contas: [{ id: 'conta', descricao: 'Conta', status: 'pendente', data_vencimento: hoje }],
    itensPessoasDetalhados: pessoas,
    podeAcessarPessoas: true,
    dataBaseISO: hoje
  })
  const agendaPessoas = selecionarAgendaPorOrigem(base, 'pessoas')
  const resumo = resumirAgendaOperacional(agendaPessoas)
  assert.equal(agendaPessoas.totalItens, pessoas.length)
  assert.equal(resumo.contadores.hoje, 1)
  assert.equal(resumo.atencaoPrimeiro.length, Math.min(3, pessoas.length))
})

test('filtro Financeiro nao inclui Impostos estruturados', () => {
  const base = montarBaseOperacional({
    dataBaseISO: hoje,
    contas: [
      { id: 'financeira', descricao: 'Conta comum', status: 'pendente', data_vencimento: hoje },
      { id: 'imposto', descricao: 'FGTS', status: 'pendente', data_vencimento: hoje, imposto_tipo: 'fgts' }
    ]
  })
  assert.deepEqual(selecionarAgendaPorOrigem(base, 'financeiro').secoes.hoje.map((item) => item.id), ['conta:financeira'])
  assert.deepEqual(selecionarAgendaPorOrigem(base, 'impostos').secoes.hoje.map((item) => item.id), ['conta:imposto'])
})

test('atencao primeiro limita a apresentacao a tres referencias das secoes', () => {
  const contas = Array.from({ length: 5 }, (_, indice) => ({
    id: `conta-${indice}`,
    descricao: `Conta ${indice}`,
    status: 'pendente',
    data_vencimento: hoje
  }))
  const agenda = selecionarAgendaPorOrigem(montarBaseOperacional({ contas, dataBaseISO: hoje }), 'todos')
  const resumo = resumirAgendaOperacional(agenda)
  assert.equal(resumo.atencaoPrimeiro.length, 3)
  assert.equal(resumo.atencaoPrimeiro[0], agenda.secoes.hoje[0])
  assert.equal(resumo.totalItens, 5)
})

test('atividade de Auditoria permanece ausente da agenda operacional', () => {
  const base = montarBaseOperacional({
    atividade: [{ id: 'evento', acao: 'financeiro.conta.criada' }],
    podeAcessarAuditoria: true,
    dataBaseISO: hoje
  })
  assert.equal(base.atividadeRecente.length, 1)
  assert.equal(selecionarAgendaPorOrigem(base, 'todos').totalItens, 0)
})

test('ciclo vencido gera uma unica acao com saldo pendente e contexto estavel', () => {
  const ciclo = {
    id: 'ciclo-vencido', funcionario_id: funcionario.id, data_limite_gozo: '2026-07-10',
    dias_direito: 30, status: 'parcial', arquivado: false
  }
  const periodos = [{
    id: 'gozo-1', ciclo_ferias_id: ciclo.id, funcionario_id: funcionario.id,
    quantidade_dias: 10, status: 'concluida', arquivado: false
  }]
  const [evento] = normalizarLimitesFeriasAgenda([ciclo], periodos, [funcionario], { dataBaseISO: hoje })

  assert.equal(evento.id, 'pessoas:ferias:limite:ciclo-vencido')
  assert.equal(evento.status, 'vencido')
  assert.equal(evento.severidade, 'critical')
  assert.match(evento.descricao, /20 dia\(s\) pendente\(s\)/)
  assert.deepEqual(evento.referenciaOrigem, {
    tipo: 'ciclo_ferias_limite', id: ciclo.id, funcionarioId: funcionario.id, cicloId: ciclo.id
  })
})

test('limite de ferias distingue urgencia em trinta dias e planejamento em noventa', () => {
  const ciclos = [
    { id: 'urgente', funcionario_id: funcionario.id, data_limite_gozo: '2026-08-10', dias_direito: 30, status: 'pendente' },
    { id: 'planejamento', funcionario_id: funcionario.id, data_limite_gozo: '2026-09-10', dias_direito: 30, status: 'pendente' },
    { id: 'fora', funcionario_id: funcionario.id, data_limite_gozo: '2026-11-01', dias_direito: 30, status: 'pendente' }
  ]
  const eventos = normalizarLimitesFeriasAgenda(ciclos, [], [funcionario], { dataBaseISO: hoje })
  assert.deepEqual(eventos.map((item) => [item.referenciaOrigem.id, item.status]), [
    ['urgente', 'pendente'],
    ['planejamento', 'planejamento']
  ])
})

test('saldo zerado e ciclo arquivado ou concluido nao geram pendencia', () => {
  const ciclos = [
    { id: 'zerado', funcionario_id: funcionario.id, data_limite_gozo: '2026-07-10', dias_direito: 10, status: 'parcial' },
    { id: 'arquivado', funcionario_id: funcionario.id, data_limite_gozo: '2026-07-10', dias_direito: 30, status: 'pendente', arquivado: true },
    { id: 'concluido', funcionario_id: funcionario.id, data_limite_gozo: '2026-07-10', dias_direito: 30, status: 'concluida' }
  ]
  const periodos = [{ id: 'gozo', ciclo_ferias_id: 'zerado', quantidade_dias: 10, status: 'concluida' }]
  assert.deepEqual(normalizarLimitesFeriasAgenda(ciclos, periodos, [funcionario], { dataBaseISO: hoje }), [])
})

test('projeta inicio, ultimo dia e retorno com o mesmo periodo e referencias distintas', () => {
  const periodo = {
    id: 'periodo-1', ciclo_ferias_id: 'ciclo-1', funcionario_id: funcionario.id,
    data_inicio: '2026-07-20', data_fim_calculada: '2026-07-24',
    data_retorno_trabalho: '2026-07-25', status: 'agendada', arquivado: false
  }
  const eventos = normalizarMarcosFeriasAgenda([periodo], [funcionario], { dataBaseISO: hoje })
  assert.deepEqual(eventos.map((item) => item.tipo), ['ferias_inicio', 'ferias_fim', 'ferias_retorno'])
  assert.equal(new Set(eventos.map((item) => `${item.referenciaOrigem.tipo}:${item.referenciaOrigem.id}`)).size, 3)
  assert.ok(eventos.every((item) => item.referenciaOrigem.periodoId === periodo.id))
})

test('periodo cancelado, arquivado ou concluido nao gera marco operacional', () => {
  const base = {
    ciclo_ferias_id: 'ciclo', funcionario_id: funcionario.id,
    data_inicio: '2026-07-20', data_fim_calculada: '2026-07-24', data_retorno_trabalho: '2026-07-25'
  }
  const periodos = [
    { ...base, id: 'cancelado', status: 'cancelada' },
    { ...base, id: 'arquivado', status: 'agendada', arquivado: true },
    { ...base, id: 'concluido', status: 'concluida' }
  ]
  assert.deepEqual(normalizarMarcosFeriasAgenda(periodos, [funcionario], { dataBaseISO: hoje }), [])
})

test('projecao canonica alimenta Agenda e Dashboard com o mesmo objeto de evento', () => {
  const eventos = projetarEventosPessoas({ funcionarios: [funcionario], dataBaseISO: hoje })
  const base = montarBaseOperacional({ itensPessoasDetalhados: eventos, podeAcessarPessoas: true, dataBaseISO: hoje })
  const agenda = selecionarAgendaPorOrigem(base, 'pessoas')
  const dashboard = selecionarResumoDashboard(base)
  const aniversarioAgenda = agenda.secoes.hoje.find((item) => item.tipo === 'aniversario')
  const aniversarioDashboard = dashboard.prioridades.find((item) => item.tipo === 'aniversario')

  assert.equal(aniversarioAgenda, aniversarioDashboard)
  assert.equal(aniversarioAgenda.destino, 'funcionarios')
  assert.equal(aniversarioAgenda.referenciaOrigem.funcionarioId, funcionario.id)
})

test('projecao aplica filial sem alterar eventos empresariais da Folha', () => {
  const outro = { ...funcionario, id: 'func-2', filial_id: 'filial-2' }
  const eventos = projetarEventosPessoas({
    funcionarios: [funcionario, outro],
    competenciasFolha: [{ id: 'folha', competencia: '2026-07', status: 'aberta' }],
    dataBaseISO: hoje,
    filialId: 'filial-1'
  })
  assert.ok(eventos.some((item) => item.referenciaOrigem.funcionarioId === funcionario.id))
  assert.equal(eventos.some((item) => item.referenciaOrigem.funcionarioId === outro.id), false)
  assert.ok(eventos.some((item) => item.referenciaOrigem.competenciaId === 'folha'))
})

test('ultimo exame ativo define previsao e preserva contexto do exame e funcionario', () => {
  const exames = [
    { id: 'ativo', funcionario_id: funcionario.id, data_exame: '2025-07-10', arquivado: false },
    { id: 'arquivado', funcionario_id: funcionario.id, data_exame: '2026-07-10', arquivado: true }
  ]
  const [evento] = normalizarExamesAgenda(exames, [funcionario], { dataBaseISO: hoje })
  assert.equal(evento.dataReferencia, '2026-07-10')
  assert.equal(evento.referenciaOrigem.exameId, 'ativo')
  assert.equal(evento.referenciaOrigem.funcionarioId, funcionario.id)
})

test('navegacao contextual preserva funcionario, ciclo, periodo e origem', () => {
  const evento = projetarEventosPessoas({
    funcionarios: [funcionario],
    periodosFerias: [{
      id: 'periodo', ciclo_ferias_id: 'ciclo', funcionario_id: funcionario.id,
      data_inicio: '2026-07-20', data_fim_calculada: '2026-07-24',
      data_retorno_trabalho: '2026-07-25', status: 'agendada'
    }],
    dataBaseISO: hoje
  }).find((item) => item.tipo === 'ferias_inicio')
  const destino = criarDestinoContextualEventoPessoas(evento, 'agenda')

  assert.equal(destino.tela, 'ferias')
  assert.deepEqual(destino.opcoes.contexto, {
    tipo: 'periodo_ferias_inicio', id: 'periodo', funcionarioId: funcionario.id,
    periodoId: 'periodo', cicloId: 'ciclo', telaRetorno: 'agenda'
  })
})
