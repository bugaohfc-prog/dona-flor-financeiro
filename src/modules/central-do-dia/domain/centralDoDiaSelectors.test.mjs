import assert from 'node:assert/strict'
import test from 'node:test'
import { agruparProximosVencimentos, criarItemCentral, deduplicarItensOperacionais, montarBaseOperacional } from './centralDoDiaRules.js'
import { deveCarregarAtividadeCentral, montarCentralDoDia, selecionarAgendaOperacional, selecionarCentralLegada, selecionarResumoDashboard } from './centralDoDiaSelectors.js'

const hoje = '2026-07-14'

function item({ id, dias = null, inconsistencia = false, origem = 'financeiro', tipoOrigem = 'conta' }) {
  return criarItemCentral({
    id,
    tipo: origem === 'pessoas' ? 'ferias' : 'conta',
    modulo: origem === 'pessoas' ? 'Gestao de Pessoas' : 'Contas',
    titulo: id,
    dias,
    status: dias !== null && dias < 0 ? 'vencido' : 'pendente',
    severidade: dias !== null && dias < 0 ? 'critical' : 'info',
    inconsistencia,
    origemOperacional: origem,
    destino: origem === 'pessoas' ? 'ferias' : 'contas',
    referenciaOrigem: { tipo: tipoOrigem, id }
  })
}

test('agrupamento compartilhado nao limita itens por faixa', () => {
  const grupos = agruparProximosVencimentos(Array.from({ length: 7 }, (_, indice) => ({ id: `item-${indice}`, dias: 3 })))
  assert.equal(grupos.find((grupo) => grupo.id === 'sete_dias').itens.length, 7)
})

test('modelo-base nao limita itens operacionais', () => {
  const base = montarBaseOperacional({
    dataBaseISO: hoje,
    contas: Array.from({ length: 8 }, (_, indice) => ({ id: `conta-${indice}`, descricao: `Conta ${indice}`, status: 'pendente', data_vencimento: hoje }))
  })
  assert.equal(base.itensOperacionais.length, 8)
})

test('deduplica por referencia oficial e escolhe maior prioridade', () => {
  const referenciaOrigem = { tipo: 'conta', id: 'origem-1' }
  const baixa = criarItemCentral({ id: 'baixa', tipo: 'conta', modulo: 'Contas', titulo: 'Baixa', dias: 8, referenciaOrigem })
  const alta = criarItemCentral({ id: 'alta', tipo: 'imposto', modulo: 'Impostos', titulo: 'Alta', dias: -2, destino: 'controle-impostos', referenciaOrigem })
  const resultado = deduplicarItensOperacionais([baixa, alta])
  assert.equal(resultado.length, 1)
  assert.equal(resultado[0].id, 'alta')
  assert.equal(resultado[0].destino, 'controle-impostos')
  assert.deepEqual(resultado[0].referenciaOrigem, referenciaOrigem)
})

test('deduplicacao usa id como fallback com desempate estavel', () => {
  const primeiro = criarItemCentral({ id: 'mesmo-id', tipo: 'conta', modulo: 'Contas', titulo: 'Primeiro', dias: 2 })
  const segundo = criarItemCentral({ id: 'mesmo-id', tipo: 'conta', modulo: 'Contas', titulo: 'Segundo', dias: 2 })
  const resultado = deduplicarItensOperacionais([primeiro, segundo])
  assert.equal(resultado.length, 1)
  assert.equal(resultado[0].titulo, 'Primeiro')
})

test('eventos diferentes do mesmo colaborador nao sao duplicados', () => {
  const ferias = item({ id: 'ferias-1', origem: 'pessoas', tipoOrigem: 'ferias', dias: 5 })
  const exame = item({ id: 'exame-1', origem: 'pessoas', tipoOrigem: 'exame', dias: 5 })
  assert.equal(deduplicarItensOperacionais([ferias, exame]).length, 2)
})

test('Agenda coloca cada item em uma unica secao principal', () => {
  const itensOperacionais = [
    item({ id: 'atrasado', dias: -1 }), item({ id: 'hoje', dias: 0 }), item({ id: 'sete', dias: 7 }),
    item({ id: 'quinze', dias: 15 }), item({ id: 'trinta', dias: 30 }),
    item({ id: 'excecao', inconsistencia: true }), item({ id: 'sem-data' })
  ]
  const agenda = selecionarAgendaOperacional({ itensOperacionais })
  const ids = Object.values(agenda.secoes).flat().map((registro) => registro.id)
  assert.deepEqual(agenda.secoes.atrasados.map((registro) => registro.id), ['atrasado'])
  assert.deepEqual(agenda.secoes.hoje.map((registro) => registro.id), ['hoje'])
  assert.deepEqual(agenda.secoes.proximosSeteDias.map((registro) => registro.id), ['sete'])
  assert.deepEqual(agenda.secoes.proximosQuinzeDias.map((registro) => registro.id), ['quinze'])
  assert.deepEqual(agenda.secoes.proximosTrintaDias.map((registro) => registro.id), ['trinta'])
  assert.deepEqual(agenda.secoes.excecoes.map((registro) => registro.id), ['excecao'])
  assert.deepEqual(agenda.secoes.semDataAcionaveis.map((registro) => registro.id), ['sem-data'])
  assert.equal(new Set(ids).size, itensOperacionais.length)
})

test('Agenda nao confunde item datado fora de 30 dias com item sem data', () => {
  const futuro = item({ id: 'futuro', dias: 31 })
  const base = { itensOperacionais: [futuro] }
  const agenda = selecionarAgendaOperacional(base)
  assert.equal(base.itensOperacionais[0], futuro)
  assert.equal(agenda.secoes.semDataAcionaveis.length, 0)
  assert.equal(agenda.totalItens, 0)
})

test('Agenda nao promove informacao sem destino para semDataAcionaveis', () => {
  const informativo = criarItemCentral({ id: 'info', tipo: 'aviso', modulo: 'Pessoas', titulo: 'Informacao' })
  const agenda = selecionarAgendaOperacional({ itensOperacionais: [informativo] })
  assert.equal(agenda.secoes.semDataAcionaveis.length, 0)
  assert.equal(agenda.totalItens, 0)
})

test('Atencao primeiro e derivada sem alterar totais', () => {
  const hojeItem = item({ id: 'hoje', dias: 0 })
  const atrasado = item({ id: 'atrasado', dias: -2 })
  const agenda = selecionarAgendaOperacional({ itensOperacionais: [hojeItem, atrasado] })
  assert.deepEqual(agenda.atencaoPrimeiro.map((registro) => registro.id), ['atrasado', 'hoje'])
  assert.equal(agenda.atencaoPrimeiro[0], agenda.secoes.atrasados[0])
  assert.equal(agenda.atencaoPrimeiro[1], agenda.secoes.hoje[0])
  assert.equal(agenda.totalItens, 2)
})

test('Dashboard limita prioridades e conta Pessoas como recorte', () => {
  const resumo = selecionarResumoDashboard({ itensOperacionais: [
    item({ id: 'pessoa', dias: -1, origem: 'pessoas', tipoOrigem: 'ferias' }), item({ id: 'hoje', dias: 0 }),
    item({ id: 'sete', dias: 7 }), item({ id: 'excecao', inconsistencia: true })
  ] })
  assert.deepEqual(resumo.contadores, { vencidos: 1, hoje: 1, proximosSeteDias: 1, excecoes: 1, pessoas: 1 })
  assert.equal(resumo.prioridades.length, 3)
  assert.equal(resumo.possuiDados, true)
})

test('atividade fica fora da Agenda e do Dashboard futuro', () => {
  const base = { itensOperacionais: [], atividadeRecente: [item({ id: 'evento', dias: -1, origem: 'auditoria', tipoOrigem: 'evento_auditoria' })] }
  assert.equal(selecionarAgendaOperacional(base).totalItens, 0)
  assert.equal(selecionarResumoDashboard(base).possuiDados, false)
})

test('modo compacto nunca solicita atividade de Auditoria', () => {
  assert.equal(deveCarregarAtividadeCentral({ empresaId: 'empresa', podeAcessarAuditoria: true, modoCompacto: true }), false)
  assert.equal(deveCarregarAtividadeCentral({ empresaId: 'empresa', podeAcessarAuditoria: true, modoCompacto: false }), true)
  assert.equal(deveCarregarAtividadeCentral({ empresaId: '', podeAcessarAuditoria: true, modoCompacto: false }), false)
})

test('Dashboard mantem ordem deterministica e limita tres prioridades', () => {
  const resumo = selecionarResumoDashboard({ itensOperacionais: [
    item({ id: 'hoje-b', dias: 0 }), item({ id: 'vencido-menor', dias: -2 }),
    item({ id: 'hoje-a', dias: 0 }), item({ id: 'vencido-maior', dias: -8 })
  ] })
  assert.deepEqual(resumo.prioridades.map((registro) => registro.id), ['vencido-maior', 'vencido-menor', 'hoje-a'])
})

test('Dashboard preserva item prioritario sem destino para apresentar acao desabilitada', () => {
  const semDestino = criarItemCentral({
    id: 'sem-destino', tipo: 'aviso', modulo: 'Pessoas', titulo: 'Conferir alerta',
    dias: -1, origemOperacional: 'pessoas', referenciaOrigem: { tipo: 'alerta', id: 'sem-destino' }
  })
  const resumo = selecionarResumoDashboard({ itensOperacionais: [semDestino] })
  assert.equal(resumo.prioridades[0], semDestino)
  assert.equal(resumo.prioridades[0].destino, null)
})

test('Dashboard trata itens somente apos trinta dias como dados sem prioridade imediata', () => {
  const futuro = item({ id: 'futuro', dias: 31 })
  const resumo = selecionarResumoDashboard({ itensOperacionais: [futuro] })
  assert.deepEqual(resumo.contadores, { vencidos: 0, hoje: 0, proximosSeteDias: 0, excecoes: 0, pessoas: 0 })
  assert.equal(resumo.prioridades.length, 0)
  assert.equal(resumo.possuiDados, true)
})

test('legado preserva seis acoes e seis excecoes', () => {
  const central = selecionarCentralLegada({ itensOperacionais: Array.from({ length: 8 }, (_, indice) => item({ id: `vencido-${indice}`, dias: -indice - 1 })), atividadeRecente: [] })
  assert.equal(central.acoesImediatas.length, 6)
  assert.equal(central.excecoes.length, 6)
})

test('legado preserva quatro itens por faixa e total visivel', () => {
  const central = selecionarCentralLegada({ itensOperacionais: Array.from({ length: 7 }, (_, indice) => item({ id: `proximo-${indice}`, dias: 3 })), atividadeRecente: [] })
  assert.equal(central.proximosVencimentos.find((grupo) => grupo.id === 'sete_dias').itens.length, 4)
  assert.equal(central.totalProximos, 4)
})

test('legado preserva seis atividades recentes', () => {
  const atividadeRecente = Array.from({ length: 8 }, (_, indice) => ({ ...item({ id: `evento-${indice}`, origem: 'auditoria', tipoOrigem: 'evento_auditoria' }), dataHora: `2026-07-14T${String(indice).padStart(2, '0')}:00:00Z` }))
  const central = selecionarCentralLegada({ itensOperacionais: [], atividadeRecente })
  assert.equal(central.atividadeRecente.length, 6)
  assert.equal(central.atividadeRecente[0].id, 'evento-7')
})

test('modelo-base respeita permissao de Pessoas e separa atividade', () => {
  const fontes = { dataBaseISO: hoje, alertasPessoas: [{ id: 'ferias', tipo: 'ferias', titulo: 'Ferias', prioridade: 'alta' }], atividade: [{ id: 'evento', acao: 'financeiro.conta.criada', criado_em: hoje }], podeAcessarAuditoria: true }
  assert.equal(montarBaseOperacional({ ...fontes, podeAcessarPessoas: false }).itensOperacionais.length, 0)
  const base = montarBaseOperacional({ ...fontes, podeAcessarPessoas: true })
  assert.equal(base.itensOperacionais.length, 1)
  assert.equal(base.atividadeRecente.length, 1)
})

test('modelo-base aplica filial e exclui registros inativos', () => {
  const base = montarBaseOperacional({ dataBaseISO: hoje, filialId: 'filial-a', contas: [
    { id: 'a', filial_id: 'filial-a', descricao: 'A', status: 'pendente', data_vencimento: hoje },
    { id: 'b', filial_id: 'filial-b', descricao: 'B', status: 'pendente', data_vencimento: hoje },
    { id: 'paga', filial_id: 'filial-a', descricao: 'Paga', status: 'pago', data_vencimento: hoje },
    { id: 'arquivada', filial_id: 'filial-a', descricao: 'Arquivada', status: 'pendente', arquivado: true, data_vencimento: hoje }
  ], notas: [{ id: 'concluida', filial_id: 'filial-a', titulo: 'Concluida', concluida: true, data_evento: hoje }] })
  assert.deepEqual(base.itensOperacionais.map((registro) => registro.id), ['conta:a'])
})

test('wrapper legado mantem contrato e trata arrays vazios', () => {
  const central = montarCentralDoDia()
  assert.deepEqual(Object.keys(central), ['acoesImediatas', 'proximosVencimentos', 'excecoes', 'atividadeRecente', 'totalProximos'])
  assert.equal(central.acoesImediatas.length, 0)
  assert.equal(central.totalProximos, 0)
})
