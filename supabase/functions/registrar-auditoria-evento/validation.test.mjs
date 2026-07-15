import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACAO_CONTA_ATUALIZADA,
  ACAO_CONTA_CRIADA,
  ACAO_PAGAMENTO_PARCIAL_CRIADO,
  acaoEstaAtivada,
  isUuid,
  resolverCorrelationIdConta,
  sanitizarDadosConta,
  sanitizarDadosPorCampos,
  validarEntidadeConta
} from './validation.ts'

const empresaId = '123e4567-e89b-42d3-a456-426614174000'
const contaId = '123e4567-e89b-42d3-a456-426614174001'

test('aceita UUID completo e rejeita formato invalido', () => {
  assert.equal(isUuid(empresaId), true)
  assert.equal(isUuid('123e4567-e89b-42d3-a456426614174000'), false)
  assert.equal(isUuid('nao-e-uuid'), false)
})

test('ativa somente as acoes explicitamente aprovadas', () => {
  assert.equal(acaoEstaAtivada(ACAO_CONTA_CRIADA), true)
  assert.equal(acaoEstaAtivada(ACAO_CONTA_ATUALIZADA), true)
  assert.equal(acaoEstaAtivada(ACAO_PAGAMENTO_PARCIAL_CRIADO), true)
  assert.equal(acaoEstaAtivada('financeiro.conta.baixada'), true)
  assert.equal(acaoEstaAtivada('administracao.usuario.perfil_alterado'), true)
  assert.equal(acaoEstaAtivada('rh.funcionario.atualizado'), true)
  assert.equal(acaoEstaAtivada('folha.item.criado'), true)
  assert.equal(acaoEstaAtivada('administracao.usuario.removido'), false)
  assert.equal(acaoEstaAtivada('sistema.auditoria_erro.tecnico'), false)
})

test('valida conta pertencente a empresa', () => {
  const resultado = validarEntidadeConta({ entidadeTipo: 'df_contas', entidadeId: contaId, empresaId, conta: { id: contaId, empresa_id: empresaId } })
  assert.equal(resultado.ok, true)
})

test('rejeita conta de outra empresa', () => {
  const resultado = validarEntidadeConta({ entidadeTipo: 'df_contas', entidadeId: contaId, empresaId, conta: { id: contaId, empresa_id: '123e4567-e89b-42d3-a456-426614174099' } })
  assert.deepEqual(resultado, { ok: false, code: 'ENTIDADE_NAO_AUTORIZADA', message: 'Entidade nao pertence a empresa.' })
})

test('sanitiza somente campos de conta permitidos', () => {
  const resultado = sanitizarDadosConta({ status: 'pago', valor: 10.129, campos: ['status', 'valor'], filial_alterada: true })
  assert.deepEqual(resultado, { ok: true, data: { status: 'pago', valor: 10.13, campos: ['status', 'valor'], filial_alterada: true } })
})

test('rejeita dados sensiveis e campos arbitrarios', () => {
  assert.equal(sanitizarDadosConta({ cpf_funcionario: '000' }).ok, false)
  assert.equal(sanitizarDadosConta({ descricao: 'conteudo completo' }).ok, false)
  assert.equal(sanitizarDadosConta({ payload: { status: 'pago' } }).ok, false)
})

test('sanitiza dominios adicionais por whitelist sem aceitar dados pessoais', () => {
  const campos = new Set(['perfil', 'quantidade_filiais', 'campos'])
  assert.deepEqual(
    sanitizarDadosPorCampos({ perfil: 'admin', quantidade_filiais: 2 }, campos),
    { ok: true, data: { perfil: 'admin', quantidade_filiais: 2 } }
  )
  assert.equal(sanitizarDadosPorCampos({ email: 'nao-persistir' }, campos).ok, false)
  assert.equal(sanitizarDadosPorCampos({ nome: 'nao-persistir' }, campos).ok, false)
})

test('criacao usa chave fixa e atualizacao exige chave unica', () => {
  assert.deepEqual(resolverCorrelationIdConta(ACAO_CONTA_CRIADA, contaId, 'ignorado'), { ok: true, data: `${ACAO_CONTA_CRIADA}:${contaId}` })
  assert.equal(resolverCorrelationIdConta(ACAO_CONTA_ATUALIZADA, contaId, '').ok, false)
  assert.deepEqual(resolverCorrelationIdConta(ACAO_CONTA_ATUALIZADA, contaId, 'operacao-unica'), { ok: true, data: 'operacao-unica' })
})
