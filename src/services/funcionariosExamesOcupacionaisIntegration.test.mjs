import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const hook = fs.readFileSync('src/hooks/useFuncionariosExamesOcupacionais.js', 'utf8')
const eventosService = fs.readFileSync('src/modules/central-do-dia/services/eventosPessoasService.js', 'utf8')
const regras = fs.readFileSync('src/modules/central-do-dia/domain/centralDoDiaPeopleRules.js', 'utf8')
const readmissaoSql = fs.readFileSync(
  'supabase/migrations/20260823195150_readmitir_pessoa_novo_vinculo_2c4.sql',
  'utf8'
)

test('Funcionários usa leitura canônica e somente RPCs para novas mutações', () => {
  assert.match(page, /useFuncionariosExamesOcupacionais/)
  assert.match(hook, /listarExamesOcupacionaisFuncionario/)
  assert.match(hook, /registrarExameOcupacionalControlado/)
  assert.match(hook, /atualizarExameOcupacionalControlado/)
  assert.match(hook, /arquivarExameOcupacionalControlado/)
  assert.doesNotMatch(page, /useFuncionariosExamesPeriodicos/)
  assert.doesNotMatch(hook, /df_funcionarios_exames_periodicos/)
  assert.doesNotMatch(hook, /\.from\(['"]df_funcionarios_exames_ocupacionais/)
})

test('admissional e readmissão deixam de criar novas escritas no campo legado', () => {
  assert.doesNotMatch(page, /atualizarCampo\(['"]data_exame_admissional/)
  assert.doesNotMatch(page, /dataExameAdmissional:\s*formularioReadmissao/)
  assert.match(page, /dataExameAdmissional:\s*null/)
})

test('Agenda e Dashboard usam lote canônico e não calculam periodicidade anual', () => {
  assert.match(eventosService, /listarExamesOcupacionaisEmpresa/)
  assert.doesNotMatch(eventosService, /funcionariosExamesPeriodicosService/)
  assert.doesNotMatch(regras, /calcularProximoPeriodico/)
  assert.match(regras, /estado !== 'PENDENTE'/)
  assert.match(regras, /tipo !== 'DEMISSIONAL'/)
  assert.match(regras, /exame\?\.data_prevista/)
})

test('UI não expõe origem ou IDs técnicos e mantém legado somente leitura', () => {
  assert.match(page, /Histórico preservado em modo somente leitura/)
  assert.doesNotMatch(page, />\s*Origem\s*</)
  assert.doesNotMatch(page, />\s*ID técnico\s*</)
  assert.match(page, /exame\.origem !== 'LEGADO'/)
})

test('UI registra demissional manual somente no vínculo antigo efetivamente desligado', () => {
  assert.match(page, /Registrar exame demissional/)
  assert.match(page, /podeRegistrarExameDemissional/)
  assert.match(page, /possuiDemissionalPendenteAtivo/)
  assert.match(page, /funcionarioEditando\.id/)
  assert.doesNotMatch(page, /dataExameDemissional|criarExameDemissionalAutomatico/)
  assert.doesNotMatch(readmissaoSql, /df_funcionarios_exames_ocupacionais/)
})
