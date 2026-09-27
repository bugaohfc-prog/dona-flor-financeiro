import test from 'node:test'
import assert from 'node:assert/strict'

import {
  alterarAtividadeContaPagamentoDesligamento,
  abrirDesligamentoFuncionario,
  atualizarDesligamentoFuncionario,
  cancelarDesligamentoFuncionario,
  concluirDesligamentoFuncionario,
  criarContaPagamentoDesligamento,
  retificarDesligamentoConcluido,
  reverterDesligamentoConcluidoPorErro,
  vincularContaPagamentoDesligamento
} from './funcionariosDesligamentosService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const FUNCIONARIO_ID = '22222222-2222-4222-8222-222222222222'
const WORKFLOW_ID = '33333333-3333-4333-8333-333333333333'
const CONTA_ID = '44444444-4444-4444-8444-444444444444'

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
    dados: { motivo: 'Encerramento solicitado', dataEfetiva: '2026-08-31', dataAcerto: '2026-09-05', observacoes: 'Acompanhar processo' }
  })

  assert.deepEqual(chamadas, [{
    nome: 'abrir_desligamento_funcionario_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_motivo: 'Encerramento solicitado',
      p_data_efetiva: '2026-08-31',
      p_data_acerto: '2026-09-05',
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
    dados: { motivo: 'Motivo revisado', dataEfetiva: '2026-09-01', dataAcerto: '2026-09-06' }
  })
  await cancelarDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    desligamentoId: WORKFLOW_ID,
    motivoCancelamento: 'Processo aberto por engano'
  })

  assert.equal(chamadas[0].nome, 'atualizar_desligamento_funcionario_controlado')
  assert.equal(chamadas[0].parametros.p_data_acerto, '2026-09-06')
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
  assert.throws(() => abrirDesligamentoFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    dados: { motivo: 'Motivo válido', dataEfetiva: '2026-08-31', dataAcerto: '' }
  }), /data prevista do acerto/i)
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

test('retificação envia estado efetivo completo para a RPC append-only', async () => {
  const { supabase, chamadas } = criarSupabase()
  await retificarDesligamentoConcluido({
    supabase, empresaId: EMPRESA_ID, desligamentoId: WORKFLOW_ID,
    dados: { dataEfetiva: '2026-09-02', dataAcerto: '2026-09-08', motivo: 'Motivo corrigido', observacoes: 'Nota corrigida', motivoCorrecao: 'Erro administrativo' }
  })
  assert.deepEqual(chamadas[0], {
    nome: 'retificar_desligamento_concluido_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID, p_desligamento_id: WORKFLOW_ID,
      p_data_efetiva: '2026-09-02', p_data_acerto: '2026-09-08', p_motivo: 'Motivo corrigido',
      p_observacoes: 'Nota corrigida', p_motivo_correcao: 'Erro administrativo',
      p_correlation_id: null
    }
  })
})

test('reversão por erro usa autoridade distinta e exige justificativa', async () => {
  const { supabase, chamadas } = criarSupabase()
  await reverterDesligamentoConcluidoPorErro({
    supabase, empresaId: EMPRESA_ID, desligamentoId: WORKFLOW_ID,
    motivoReversao: 'Conclusão realizada por engano'
  })
  assert.equal(chamadas[0].nome, 'reverter_desligamento_concluido_por_erro_controlado')
  assert.equal(chamadas[0].parametros.p_motivo_reversao, 'Conclusão realizada por engano')
  assert.throws(() => reverterDesligamentoConcluidoPorErro({
    supabase, empresaId: EMPRESA_ID, desligamentoId: WORKFLOW_ID, motivoReversao: ''
  }), /motivo/i)
})

test('conta do acerto usa somente RPCs controladas para criar, arquivar e vincular', async () => {
  const { supabase, chamadas } = criarSupabase()
  await criarContaPagamentoDesligamento({ supabase, empresaId: EMPRESA_ID, nome: 'Conta operacional' })
  await vincularContaPagamentoDesligamento({
    supabase, empresaId: EMPRESA_ID, desligamentoId: WORKFLOW_ID, contaPagamentoId: CONTA_ID
  })
  await alterarAtividadeContaPagamentoDesligamento({
    supabase, empresaId: EMPRESA_ID, contaPagamentoId: CONTA_ID, ativo: false
  })

  assert.deepEqual(chamadas.map((item) => item.nome), [
    'criar_conta_pagamento_desligamento_controlado',
    'vincular_conta_pagamento_desligamento_controlado',
    'alterar_atividade_conta_pagamento_desligamento_controlado'
  ])
  assert.equal(chamadas[1].parametros.p_desligamento_id, WORKFLOW_ID)
  assert.equal(chamadas[1].parametros.p_conta_pagamento_id, CONTA_ID)
  assert.equal(chamadas[2].parametros.p_ativo, false)
})

test('vínculo aceita estado vazio explícito sem usar nome da conta', async () => {
  const { supabase, chamadas } = criarSupabase()
  await vincularContaPagamentoDesligamento({
    supabase, empresaId: EMPRESA_ID, desligamentoId: WORKFLOW_ID, contaPagamentoId: null
  })
  assert.equal(chamadas[0].parametros.p_conta_pagamento_id, null)
  assert.equal('p_nome' in chamadas[0].parametros, false)
})
