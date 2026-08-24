import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mensagemErroExameDemissional,
  podeRegistrarExameDemissional,
  possuiDemissionalPendenteAtivo
} from './exameDemissionalRules.js'

const funcionario = { id: 'vinculo-antigo', status: 'desligado', arquivado: false }
const desligamento = { estado: 'CONCLUIDO', efeito_revertido: false }

test('ação demissional exige vínculo efetivamente desligado', () => {
  assert.equal(podeRegistrarExameDemissional(funcionario, desligamento), true)
  assert.equal(podeRegistrarExameDemissional({ ...funcionario, status: 'ativo' }, desligamento), false)
  assert.equal(podeRegistrarExameDemissional({ ...funcionario, status: 'afastado' }, desligamento), false)
  assert.equal(podeRegistrarExameDemissional(funcionario, { ...desligamento, efeito_revertido: true }), false)
  assert.equal(podeRegistrarExameDemissional({ ...funcionario, arquivado: true }, desligamento), false)
})

test('duplicidade considera somente demissional pendente não arquivado do mesmo vínculo carregado', () => {
  assert.equal(possuiDemissionalPendenteAtivo([
    { id: '1', tipo: 'DEMISSIONAL', estado: 'PENDENTE', arquivado: false }
  ]), true)
  assert.equal(possuiDemissionalPendenteAtivo([
    { id: '1', tipo: 'DEMISSIONAL', estado: 'REALIZADO', arquivado: false },
    { id: '2', tipo: 'DEMISSIONAL', estado: 'CANCELADO', arquivado: false },
    { id: '3', tipo: 'DEMISSIONAL', estado: 'PENDENTE', arquivado: true },
    { id: '4', tipo: 'PERIODICO', estado: 'PENDENTE', arquivado: false }
  ]), false)
  assert.equal(possuiDemissionalPendenteAtivo([
    { id: '1', tipo: 'DEMISSIONAL', estado: 'PENDENTE', arquivado: false }
  ], '1'), false)
})

test('conflitos do backend recebem mensagem operacional sem detalhe técnico', () => {
  assert.match(mensagemErroExameDemissional({
    code: '23505',
    message: 'duplicate key',
    constraint: 'uq_df_funcionarios_exames_demissional_pendente_ativo'
  }, 'fallback'), /já existe/i)
  assert.match(mensagemErroExameDemissional({
    message: 'EXAME_DEMISSIONAL_EXIGE_VINCULO_DESLIGADO'
  }, 'fallback'), /efetivamente desligado/i)
  assert.equal(mensagemErroExameDemissional(new Error('outro'), 'fallback'), 'fallback')
})
