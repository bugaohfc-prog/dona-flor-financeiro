import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const agenda = fs.readFileSync(new URL('./hooks/useAgendaOperacional.js', import.meta.url), 'utf8')
const agendaView = fs.readFileSync(new URL('./components/agenda/AgendaOperacional.jsx', import.meta.url), 'utf8')
const dashboard = fs.readFileSync(new URL('../../components/dashboard/DashboardHome.jsx', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../../App.jsx', import.meta.url), 'utf8')
const regras = fs.readFileSync(new URL('./domain/centralDoDiaRules.js', import.meta.url), 'utf8')

test('Agenda e Dashboard consomem a mesma fonte canonica de Pessoas', () => {
  assert.match(agenda, /useEventosPessoas/)
  assert.match(dashboard, /useEventosPessoas/)
  assert.doesNotMatch(dashboard, /useResumoGestaoPessoasPainel/)
  assert.doesNotMatch(regras, /alertasPessoas|normalizarAlertasPessoasCentral/)
})

test('pipeline do Dashboard nao reintroduz consultas por funcionario ou ciclo', () => {
  assert.doesNotMatch(dashboard, /listarCiclosFerias|listarPeriodosFerias|Promise\.all\(funcionarios/)
  assert.doesNotMatch(agenda, /listarPeriodosFeriasAgenda|useFuncionarios/)
})

test('Dashboard recebe a capacidade central sem reconstruir perfis locais', () => {
  assert.match(app, /podeAcessarPessoas:\s*podeAcessarGestaoPessoas\(\)/)
  assert.match(dashboard, /podeAcessarPessoas\s*=\s*false/)
  assert.doesNotMatch(dashboard, /\['admin', 'master'\]|perfil\s*===\s*['"]admin/)
})

test('destinos de Pessoas recebem o contexto de navegacao nas duas superficies', () => {
  assert.match(agendaView, /criarDestinoContextualEventoPessoas\(item, 'agenda'\)/)
  assert.match(dashboard, /criarDestinoContextualEventoPessoas\(item, 'dashboard'\)/)
})
