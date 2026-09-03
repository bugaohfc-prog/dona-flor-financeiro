import test from 'node:test'
import assert from 'node:assert/strict'

import {
  alterarAdmissaoFuncionarioControlada,
  atualizarFuncionario,
  criarFuncionario,
  readmitirPessoaControlada,
  retificarTransferenciaFilialControlada,
  transferirFuncionarioFilialControlada
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
  const chamadas = { rpcs: [] }
  const funcionario = {
    id: FUNCIONARIO_ID,
    pessoa_id: '33333333-3333-4333-8333-333333333333',
    nome: 'Fixture 2C1',
    status: 'ativo',
    data_admissao: '2026-08-14',
    ciclo_criado_id: '44444444-4444-4444-8444-444444444444'
  }
  const supabase = {
    async rpc(nome, parametros) {
      chamadas.rpcs.push({ nome, parametros })
      if (erroRpc) return { data: null, error: erroRpc }
      return { data: funcionario, error: null }
    }
  }
  return { supabase, chamadas }
}

test('cadastro cria pessoa e vínculo na RPC transacional com a admissão no mesmo payload', async () => {
  const { supabase, chamadas } = criarSupabaseDeCadastro()
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2C1', status: 'ativo', data_admissao: '2026-08-14' }
  })

  assert.equal(chamadas.rpcs.length, 1)
  assert.equal(chamadas.rpcs[0].nome, 'criar_funcionario_com_pessoa_controlado')
  assert.equal(chamadas.rpcs[0].parametros.p_empresa_id, EMPRESA_ID)
  assert.equal(chamadas.rpcs[0].parametros.p_dados.data_admissao, '2026-08-14')
  assert.equal(resultado.data.pessoa_id, '33333333-3333-4333-8333-333333333333')
  assert.equal(resultado.cicloCriadoId, '44444444-4444-4444-8444-444444444444')
})

test('cadastro sem admissão envia null e continua atômico na mesma RPC', async () => {
  const { supabase, chamadas } = criarSupabaseDeCadastro()
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2C1', status: 'ativo' }
  })

  assert.equal(resultado.error, null)
  assert.equal(chamadas.rpcs.length, 1)
  assert.equal(chamadas.rpcs[0].parametros.p_dados.data_admissao, null)
})

test('falha da RPC não expõe cadastro parcial ao cliente', async () => {
  const erro = new Error('ADMISSAO_29FEV_REQUER_DECISAO')
  const { supabase, chamadas } = criarSupabaseDeCadastro({ erroRpc: erro })
  const resultado = await criarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    dados: { nome: 'Fixture 2C1', status: 'ativo', data_admissao: '2024-02-29' }
  })

  assert.equal(chamadas.rpcs.length, 1)
  assert.equal(resultado.error, erro)
  assert.equal(resultado.data, null)
  assert.equal(Object.hasOwn(resultado, 'parcial'), false)
})

test('edição separa a RPC controlada de pessoa e vínculo', async () => {
  const chamadas = []
  const supabase = {
    async rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return { data: { id: FUNCIONARIO_ID, pessoa_id: '33333333-3333-4333-8333-333333333333' }, error: null }
    }
  }

  await atualizarFuncionario({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    dados: { nome: 'Nome Atualizado', cargo: 'Cargo Atualizado' }
  })

  assert.deepEqual(chamadas, [{
    nome: 'atualizar_funcionario_pessoa_vinculo_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_dados: { nome: 'Nome Atualizado', cargo: 'Cargo Atualizado' },
      p_correlation_id: null
    }
  }])
})

test('readmissão envia uma única operação idempotente para a RPC controlada', async () => {
  const chamadas = []
  const supabase = {
    async rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return { data: { novo_funcionario_id: 'novo-vinculo', ciclo_criado_id: 'novo-ciclo' }, error: null }
    }
  }

  const resultado = await readmitirPessoaControlada({
    supabase,
    empresaId: EMPRESA_ID,
    vinculoAnteriorId: FUNCIONARIO_ID,
    requestKey: 'readmissao-2c4-123456789',
    novaDataAdmissao: '2026-09-01',
    filialId: '33333333-3333-4333-8333-333333333333',
    cargo: 'Atendimento',
    dataExameAdmissional: '2026-08-31',
    correlationId: 'corr-readmissao-2c4'
  })

  assert.deepEqual(chamadas, [{
    nome: 'readmitir_pessoa_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_vinculo_anterior_id: FUNCIONARIO_ID,
      p_request_key: 'readmissao-2c4-123456789',
      p_nova_data_admissao: '2026-09-01',
      p_filial_id: '33333333-3333-4333-8333-333333333333',
      p_cargo: 'Atendimento',
      p_data_exame_admissional: '2026-08-31',
      p_correlation_id: 'corr-readmissao-2c4'
    }
  }])
  assert.equal(resultado.cicloCriadoId, 'novo-ciclo')
})

test('readmissão rejeita chave curta e admissão ausente antes de consultar o banco', async () => {
  let consultouBanco = false
  const supabase = { rpc() { consultouBanco = true } }

  await assert.rejects(readmitirPessoaControlada({
    supabase,
    empresaId: EMPRESA_ID,
    vinculoAnteriorId: FUNCIONARIO_ID,
    requestKey: 'curta',
    novaDataAdmissao: '2026-09-01'
  }), /Chave de seguranca/)
  await assert.rejects(readmitirPessoaControlada({
    supabase,
    empresaId: EMPRESA_ID,
    vinculoAnteriorId: FUNCIONARIO_ID,
    requestKey: 'readmissao-2c4-123456789',
    novaDataAdmissao: ''
  }), /nova data de admissao/)
  assert.equal(consultouBanco, false)
})

test('transferência envia somente os dados controlados para a RPC transacional', async () => {
  const chamadas = []
  const supabase = {
    async rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return { data: { funcionario_id: FUNCIONARIO_ID, filial_atual_id: '44444444-4444-4444-8444-444444444444' }, error: null }
    }
  }

  await transferirFuncionarioFilialControlada({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    filialDestinoId: '44444444-4444-4444-8444-444444444444',
    dataTransferencia: '2026-09-01',
    motivo: '  Reorganização operacional  ',
    observacoes: '  Mudança aprovada  ',
    correlationId: 'corr-transferencia-1'
  })

  assert.deepEqual(chamadas, [{
    nome: 'transferir_funcionario_filial_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_filial_destino_id: '44444444-4444-4444-8444-444444444444',
      p_data_transferencia: '2026-09-01',
      p_motivo: 'Reorganização operacional',
      p_observacoes: 'Mudança aprovada',
      p_correlation_id: 'corr-transferencia-1'
    }
  }])
})

test('transferência rejeita destino, data ou motivo ausente antes do banco', async () => {
  let consultouBanco = false
  const supabase = { rpc() { consultouBanco = true } }
  const base = { supabase, empresaId: EMPRESA_ID, funcionarioId: FUNCIONARIO_ID, filialDestinoId: 'filial', dataTransferencia: '2026-09-01', motivo: 'Motivo' }

  await assert.rejects(transferirFuncionarioFilialControlada({ ...base, filialDestinoId: '' }), /filial de destino/)
  await assert.rejects(transferirFuncionarioFilialControlada({ ...base, dataTransferencia: '' }), /data efetiva/)
  await assert.rejects(transferirFuncionarioFilialControlada({ ...base, motivo: '' }), /motivo/)
  assert.equal(consultouBanco, false)
})

test('retificação de transferência envia data e motivo somente para a RPC controlada', async () => {
  const chamadas = []
  const supabase = {
    async rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return { data: { data_transferencia_efetiva: '2026-08-01' }, error: null }
    }
  }

  await retificarTransferenciaFilialControlada({
    supabase,
    empresaId: EMPRESA_ID,
    transferenciaId: '55555555-5555-4555-8555-555555555555',
    novaDataTransferencia: '2026-08-01',
    motivo: '  Correção da data informada  ',
    correlationId: 'corr-retificacao-transferencia-1'
  })

  assert.deepEqual(chamadas, [{
    nome: 'retificar_transferencia_filial_controlada',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_transferencia_id: '55555555-5555-4555-8555-555555555555',
      p_nova_data_transferencia: '2026-08-01',
      p_motivo: 'Correção da data informada',
      p_correlation_id: 'corr-retificacao-transferencia-1'
    }
  }])
})

test('retificação rejeita transferência, data ou motivo ausente antes do banco', async () => {
  let consultouBanco = false
  const supabase = { rpc() { consultouBanco = true } }
  const base = {
    supabase,
    empresaId: EMPRESA_ID,
    transferenciaId: '55555555-5555-4555-8555-555555555555',
    novaDataTransferencia: '2026-08-01',
    motivo: 'Correção'
  }

  await assert.rejects(retificarTransferenciaFilialControlada({ ...base, transferenciaId: '' }), /nao identificada/)
  await assert.rejects(retificarTransferenciaFilialControlada({ ...base, novaDataTransferencia: '' }), /data efetiva corrigida/)
  await assert.rejects(retificarTransferenciaFilialControlada({ ...base, motivo: '' }), /motivo da retificacao/)
  assert.equal(consultouBanco, false)
})
