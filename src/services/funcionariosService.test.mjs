import test from 'node:test'
import assert from 'node:assert/strict'

import {
  alterarAdmissaoFuncionarioControlada,
  atualizarFuncionario,
  criarFuncionario
} from './funcionariosService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const FUNCIONARIO_ID = '22222222-2222-4222-8222-222222222222'

test('update genérico rejeita data_admissao antes de consultar o banco', async () => {
  let consultouBanco = false
  const supabase = {
    from() {
      consultouBanco = true
      throw new Error('não deveria consultar')
    }
  }

  await assert.rejects(
    atualizarFuncionario({
      supabase,
      empresaId: EMPRESA_ID,
      funcionarioId: FUNCIONARIO_ID,
      dados: { data_admissao: '2026-08-14' }
    }),
    /operacao controlada/
  )
  assert.equal(consultouBanco, false)
})

test('service envia preflight e confirmação somente à RPC controlada', async () => {
  const chamadas = []
  const supabase = {
    rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return Promise.resolve({ data: { somente_preflight: true }, error: null })
    }
  }

  await alterarAdmissaoFuncionarioControlada({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    novaDataAdmissao: '2026-08-14',
    somentePreflight: true,
    confirmarCiclosPreservados: true,
    motivo: 'Correção cadastral',
    correlationId: 'corr-2b1'
  })

  assert.deepEqual(chamadas, [{
    nome: 'alterar_admissao_funcionario_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_nova_data_admissao: '2026-08-14',
      p_somente_preflight: true,
      p_confirmar_ciclos_preservados: true,
      p_motivo: 'Correção cadastral',
      p_correlation_id: 'corr-2b1'
    }
  }])
})

function criarSupabaseDeCadastro({ erroRpc = null } = {}) {
  const chamadas = { inserts: [], rpcs: [] }
  const funcionario = { id: FUNCIONARIO_ID, nome: 'Fixture 2B1', status: 'ativo', data_admissao: null }
  const supabase = {
    from(tabela) {
      assert.equal(tabela, 'df_funcionarios')
      return {
        insert(payloads) {
          chamadas.inserts.push(payloads)
          return {
            select() {
              return {
                single: async () => ({ data: funcionario, error: null })
              }
            }
          }
        }
      }
    },
    async rpc(nome, parametros) {
      chamadas.rpcs.push({ nome, parametros })
      if (erroRpc) return { data: null, error: erroRpc }
      return { data: { ciclo_criado_id: '33333333-3333-4333-8333-333333333333' }, error: null }
    }
  }
  return { supabase, chamadas }
}

test('cadastro inicial retira admissão do INSERT e usa a mesma RPC para criar um ciclo', async () => {
  const { supabase, chamadas } = criarSupabaseDeCadastro()
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2B1', status: 'ativo', data_admissao: '2026-08-14' }
  })

  assert.equal(Object.hasOwn(chamadas.inserts[0][0], 'data_admissao'), false)
  assert.equal(chamadas.rpcs.length, 1)
  assert.equal(chamadas.rpcs[0].nome, 'alterar_admissao_funcionario_controlado')
  assert.equal(chamadas.rpcs[0].parametros.p_funcionario_id, FUNCIONARIO_ID)
  assert.equal(resultado.cicloCriadoId, '33333333-3333-4333-8333-333333333333')
})

test('cadastro sem admissão não chama RPC nem cria caminho direto de data', async () => {
  const { supabase, chamadas } = criarSupabaseDeCadastro()
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2B1', status: 'ativo' }
  })

  assert.equal(resultado.error, null)
  assert.equal(chamadas.rpcs.length, 0)
  assert.equal(Object.hasOwn(chamadas.inserts[0][0], 'data_admissao'), false)
})

test('falha controlada como 29/02 preserva e informa explicitamente o cadastro parcial', async () => {
  const erro = new Error('ADMISSAO_29FEV_REQUER_DECISAO')
  const { supabase, chamadas } = criarSupabaseDeCadastro({ erroRpc: erro })
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2B1', status: 'ativo', data_admissao: '2024-02-29' }
  })

  assert.equal(chamadas.rpcs.length, 1)
  assert.equal(resultado.error, erro)
  assert.equal(resultado.parcial, true)
  assert.equal(resultado.admissaoPendente, true)
  assert.equal(resultado.data.id, FUNCIONARIO_ID)
})
