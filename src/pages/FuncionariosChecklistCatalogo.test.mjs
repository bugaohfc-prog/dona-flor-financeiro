import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const pagina = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const componente = fs.readFileSync('src/components/funcionarios/FuncionariosChecklistCatalogo.jsx', 'utf8')
const hook = fs.readFileSync('src/hooks/useFuncionariosChecklistCatalogo.js', 'utf8')
const app = fs.readFileSync('src/App.jsx', 'utf8')

test('catálogo aparece apenas com autorização administrativa existente', () => {
  assert.match(app, /podeGerenciarCatalogoChecklist=\{podeAdministrarUsuarios\(\)\}/)
  assert.match(pagina, /podeGerenciarCatalogoChecklist = false/)
  assert.match(componente, /if \(!podeGerenciar\) return null/)
})

test('UI cobre loading, erro, vazio, criação, descrição, edição e atividade', () => {
  assert.match(componente, /Itens do checklist de desligamento/)
  assert.match(componente, /Carregando itens configurados/)
  assert.match(hook, /Não foi possível carregar os itens/)
  assert.match(componente, /Nenhum item configurado\./)
  assert.match(componente, /Criar item/)
  assert.match(componente, /Descrição operacional \(opcional\)/)
  assert.match(componente, /descricao_operacional/)
  assert.match(componente, /Salvar alterações/)
  assert.match(componente, /Inativar/)
  assert.match(componente, /Reativar/)
})

test('checklist instanciado exibe a descrição histórica sem substituir o título', () => {
  assert.match(pagina, /item\.titulo_snapshot/)
  assert.match(pagina, /item\.descricao_snapshot/)
  assert.match(pagina, /funcionario-checklist-descricao/)
})

test('UI não exibe código nem IDs técnicos', () => {
  assert.doesNotMatch(componente, />\{item\.codigo\}</)
  assert.doesNotMatch(componente, />\{item\.id\}</)
  assert.match(componente, /Itens históricos não foram alterados/)
})
