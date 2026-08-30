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
  assert.match(pagina, /catalogoChecklistSelecionado\?\.descricao_operacional/)
  assert.match(pagina, /catalogoChecklistSelecionado\.descricao_operacional/)
  assert.match(pagina, /CHECKLIST_ESTADO_LABELS/)
  assert.match(pagina, /PENDENTE: 'Pendente'/)
  assert.match(pagina, /CONCLUIDO: 'Concluído'/)
  assert.match(pagina, /NAO_APLICAVEL: 'Não aplicável'/)
  assert.doesNotMatch(pagina, />\{item\.id\}</)
})

test('UI preserva snapshots e detalhes administrativos no uso real', () => {
  assert.match(pagina, /item\.titulo_snapshot/)
  assert.match(pagina, /item\.descricao_snapshot/)
  assert.match(pagina, /Data prevista \(opcional\)/)
  assert.match(pagina, /Observação administrativa/)
  assert.match(pagina, /salvarDetalhesItemChecklist/)
  assert.match(pagina, /mudarEstadoItemChecklist/)
})

test('workflow revertido mantém histórico e bloqueia controles operacionais', () => {
  assert.match(pagina, /Este checklist é somente histórico/)
  assert.match(pagina, /desligamentoChecklistSelecionado\.efeito_revertido/)
  assert.match(pagina, /const somenteHistorico = historicoDesligamentoSomenteLeitura \|\| desligamentoChecklistSelecionado\.efeito_revertido \|\| !podeEditar/)
})

test('vínculo arquivado com desligamento oferece histórico sem reativação', () => {
  assert.match(pagina, /funcionario\.arquivado && historicoFuncionario\.length > 0/)
  assert.match(pagina, /funcionario\.arquivado \|\| funcionario\.status === 'desligado'/)
  assert.match(pagina, /Vínculo arquivado — histórico somente leitura/)
  assert.match(pagina, /sem reativar ou alterar este vínculo/)
})

test('vínculo arquivado sem desligamento não oferece ação inválida', () => {
  assert.match(pagina, /\(funcionario\.arquivado \|\| funcionario\.status === 'desligado'\) && historico\.length === 0/)
})

test('modo arquivado bloqueia todas as ações mutáveis do desligamento e checklist', () => {
  assert.match(pagina, /const historicoDesligamentoSomenteLeitura = Boolean\(funcionarioDesligamento\?\.arquivado\)/)
  assert.match(pagina, /!historicoDesligamentoSomenteLeitura && desligamentoAbertoSelecionado/)
  assert.match(pagina, /!historicoDesligamentoSomenteLeitura && desligamentoConcluidoEfetivoSelecionado/)
  assert.match(pagina, /!historicoDesligamentoSomenteLeitura && !desligamentoChecklistSelecionado\.efeito_revertido/)
  assert.match(pagina, /const somenteHistorico = historicoDesligamentoSomenteLeitura \|\| desligamentoChecklistSelecionado\.efeito_revertido \|\| !podeEditar/)
  assert.match(pagina, /historicoDesligamentoSomenteLeitura \|\| salvandoDesligamento/)
  assert.match(pagina, /historicoDesligamentoSomenteLeitura \|\| salvandoChecklist/)
})
