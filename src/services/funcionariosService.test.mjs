import test from 'node:test'
import assert from 'node:assert/strict'

import {
  alterarAdmissaoFuncionarioControlada,
  atualizarFuncionario
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
