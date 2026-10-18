import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const agenda = readFileSync(new URL('./AgendaOperacional.jsx', import.meta.url), 'utf8')
const obrigacoes = readFileSync(new URL('./ObrigacoesOperacionaisPanel.jsx', import.meta.url), 'utf8')

test('explica o proposito da Central em linguagem operacional', () => {
  assert.match(agenda, /title="Central Operacional"/)
  assert.match(agenda, /Veja o que precisa de atenção e acompanhe cada pendência até a resolução\./)
  assert.doesNotMatch(agenda, /obrigações persistidas|compromissos calculados/)
})

test('ensina a funcao da Central quando nao ha pendencias', () => {
  assert.match(obrigacoes, /Tudo certo por aqui\./)
  assert.match(obrigacoes, /Quando o sistema identificar algo que precisa de acompanhamento, vai aparecer nesta Central\./)
  assert.match(obrigacoes, /Você poderá ver quem é o responsável, o que precisa ser feito e acompanhar até a resolução\./)
})

test('preserva filtros, contexto dos cards e acesso direto a resolucao', () => {
  for (const rotulo of ['Precisa de ação', 'Aguardando terceiros', 'Minhas', 'Sem responsável', 'Resolvidas']) {
    assert.match(obrigacoes, new RegExp(rotulo))
  }
  assert.match(obrigacoes, /<dt>Funcionário<\/dt>/)
  assert.match(obrigacoes, /<dt>Responsável<\/dt>/)
  assert.match(obrigacoes, /<dt>Aguardando<\/dt>/)
  assert.match(obrigacoes, /<dt>Revisar em<\/dt>/)
  assert.match(obrigacoes, /Abrir desligamento/)
  assert.doesNotMatch(obrigacoes, /Trabalho persistido|sobreviver ao reload/)
})
