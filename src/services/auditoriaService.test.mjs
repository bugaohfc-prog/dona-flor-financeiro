import assert from 'node:assert/strict'
import test from 'node:test'

import {
  registrarEventoAuditoria,
  registrarEventoAuditoriaSeguro
} from './auditoriaService.js'

function criarCliente(resposta) {
  const chamadas = []
  return {
    chamadas,
    cliente: {
      functions: {
        async invoke(nome, opcoes) {
          chamadas.push({ nome, opcoes })
          return resposta
        }
      }
    }
  }
}

test('normaliza e sanitiza o payload antes de invocar a Edge Function', async () => {
  const mock = criarCliente({ data: { ok: true }, error: null })

  const resposta = await registrarEventoAuditoria(mock.cliente, {
    empresa_id: 'empresa-1',
    acao: 'financeiro.conta.criada',
    entidade_tipo: 'df_contas',
    entidade_id: 'conta-1',
    modulo: 'financeiro',
    severidade: 'alta',
    status: 'sucesso',
    correlation_id: 'financeiro.conta.criada:conta-1',
    dados_depois: {
      campos: ['valor', 'vencimento'],
      cpf: 'nao-persistir',
      detalhes: { email: 'nao-persistir', status: 'pendente' }
    },
    metadados: { conta_id: 'conta-1', token: 'nao-persistir' }
  })

  assert.equal(resposta.data.ok, true)
  assert.equal(mock.chamadas.length, 1)
  assert.equal(mock.chamadas[0].nome, 'registrar-auditoria-evento')

  const body = mock.chamadas[0].opcoes.body
  assert.equal(body.modulo, 'financeiro')
  assert.equal(body.severidade, 'critical')
  assert.equal(body.status, 'sucesso')
  assert.equal(body.correlation_id, 'financeiro.conta.criada:conta-1')
  assert.deepEqual(body.dados_depois.campos, ['valor', 'vencimento'])
  assert.equal(body.dados_depois.cpf, undefined)
  assert.equal(body.dados_depois.detalhes.email, undefined)
  assert.equal(body.dados_depois.detalhes.status, 'pendente')
  assert.equal(body.metadados.conta_id, 'conta-1')
  assert.equal(body.metadados.token, undefined)
})

test('rejeita ação fora do contrato de três segmentos sem chamar o Supabase', async () => {
  const mock = criarCliente({ data: { ok: true }, error: null })

  await assert.rejects(
    registrarEventoAuditoria(mock.cliente, {
      empresa_id: 'empresa-1',
      acao: 'financeiro.conta',
      entidade_id: 'conta-1'
    }),
    /Ação de auditoria inválida/
  )
  assert.equal(mock.chamadas.length, 0)
})

test('transforma data.ok false em erro explícito', async () => {
  const mock = criarCliente({ data: { ok: false, code: 'ACAO_NAO_ATIVADA' }, error: null })

  await assert.rejects(
    registrarEventoAuditoria(mock.cliente, {
      empresa_id: 'empresa-1',
      acao: 'financeiro.conta.criada',
      entidade_id: 'conta-1'
    }),
    (error) => error.code === 'ACAO_NAO_ATIVADA'
  )
})

test('preserva código seguro retornado em erro de transporte', async () => {
  const erroTransporte = {
    name: 'FunctionsHttpError',
    context: {
      clone() {
        return { json: async () => ({ code: 'ENTIDADE_FORA_DA_EMPRESA' }) }
      }
    }
  }
  const mock = criarCliente({ data: null, error: erroTransporte })

  await assert.rejects(
    registrarEventoAuditoria(mock.cliente, {
      empresa_id: 'empresa-1',
      acao: 'financeiro.conta.criada',
      entidade_id: 'conta-1'
    }),
    (error) => error.code === 'ENTIDADE_FORA_DA_EMPRESA'
  )
})

test('modo seguro não corrompe a operação principal quando a auditoria falha', async () => {
  const mock = criarCliente({ data: { ok: false, code: 'ACAO_NAO_ATIVADA' }, error: null })
  const warnOriginal = console.warn
  console.warn = () => {}

  try {
    const resposta = await registrarEventoAuditoriaSeguro(mock.cliente, {
      empresa_id: 'empresa-1',
      acao: 'financeiro.conta.criada',
      entidade_id: 'conta-1'
    }, 'teste')

    assert.equal(resposta.data, null)
    assert.equal(resposta.error.code, 'ACAO_NAO_ATIVADA')
  } finally {
    console.warn = warnOriginal
  }
})
