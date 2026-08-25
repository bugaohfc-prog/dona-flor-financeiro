import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const pagina = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')

test('UI exibe seção recolhível com loading, erro e catálogo vazio', () => {
  assert.match(pagina, /Checklist administrativo/)
  assert.match(pagina, /aria-expanded=\{checklistAberto\}/)
  assert.match(pagina, /Carregando checklist administrativo/)
  assert.match(pagina, /Não foi possível carregar o checklist/)
  assert.match(pagina, /Nenhum item de checklist configurado\./)
  assert.match(pagina, /Nenhum item registrado neste desligamento\./)
})

test('UI usa catálogo e três estados sem expor IDs técnicos', () => {
  assert.match(pagina, /catalogoChecklistDisponivel\.map/)
  assert.match(pagina, /CHECKLIST_ESTADO_LABELS/)
  assert.match(pagina, /PENDENTE: 'Pendente'/)
  assert.match(pagina, /CONCLUIDO: 'Concluído'/)
  assert.match(pagina, /NAO_APLICAVEL: 'Não aplicável'/)
  assert.doesNotMatch(pagina, />\{item\.id\}</)
})

test('workflow revertido mantém histórico e bloqueia controles operacionais', () => {
  assert.match(pagina, /Este checklist é somente histórico/)
  assert.match(pagina, /desligamentoChecklistSelecionado\.efeito_revertido/)
  assert.match(pagina, /const somenteHistorico = desligamentoChecklistSelecionado\.efeito_revertido \|\| !podeEditar/)
})
