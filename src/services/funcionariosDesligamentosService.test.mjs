import test from 'node:test'
import assert from 'node:assert/strict'

import {
  abrirDesligamentoFuncionario,
  atualizarDesligamentoFuncionario,
  cancelarDesligamentoFuncionario,
  concluirDesligamentoFuncionario
} from './funcionariosDesligamentosService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const FUNCIONARIO_ID = '22222222-2222-4222-8222-222222222222'
const WORKFLOW_ID = '33333333-3333-4333-8333-333333333333'

function criarSupabase() {
  const chamadas = []
  return {
    chamadas,
    supabase: {
      rpc(nome, parametros) {
        chamadas.push({ nome, parametros })
        return Promise.resolve({ data: { id: WORKFLOW_ID }, error: null })
      }
    }
  }
}

test('abertura usa exclusivamente a RPC controlada', async () => {
  const { supabase, chamadas } = criarSupabase()
  await abrirDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    dados: { motivo: 'Encerramento solicitado', dataEfetiva: '2026-08-31', observacoes: 'Acompanhar processo' }
  })

  assert.deepEqual(chamadas, [{
    nome: 'abrir_desligamento_funcionario_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_motivo: 'Encerramento solicitado',
      p_data_efetiva: '2026-08-31',
      p_observacoes: 'Acompanhar processo',
      p_correlation_id: null
    }
  }])
})

test('edição e cancelamento usam RPCs distintas sem update direto', async () => {
  const { supabase, chamadas } = criarSupabase()
  await atualizarDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    desligamentoId: WORKFLOW_ID,
    dados: { motivo: 'Motivo revisado', dataEfetiva: '2026-09-01' }
  })
  await cancelarDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    desligamentoId: WORKFLOW_ID,
    motivoCancelamento: 'Processo aberto por engano'
  })

  assert.equal(chamadas[0].nome, 'atualizar_desligamento_funcionario_controlado')
  assert.equal(chamadas[1].nome, 'cancelar_desligamento_funcionario_controlado')
  assert.equal(chamadas[1].parametros.p_motivo_cancelamento, 'Processo aberto por engano')
})

test('campos obrigatórios falham antes de consultar o banco', async () => {
  const { supabase, chamadas } = criarSupabase()
  assert.throws(() => abrirDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    dados: { motivo: '', dataEfetiva: '' }
  }), /motivo/i)
  assert.equal(chamadas.length, 0)
})

test('conclusão usa exclusivamente a RPC transacional 2B', async () => {
  const { supabase, chamadas } = criarSupabase()
  await concluirDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    desligamentoId: WORKFLOW_ID
  })

  assert.deepEqual(chamadas, [{
    nome: 'concluir_desligamento_funcionario_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_desligamento_id: WORKFLOW_ID,
      p_correlation_id: null
    }
  }])
})
