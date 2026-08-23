import assert from 'node:assert/strict'
import test from 'node:test'

import {
  arquivarExameOcupacionalControlado,
  atualizarExameOcupacionalControlado,
  listarExamesOcupacionaisEmpresa,
  registrarExameOcupacionalControlado
} from './funcionariosExamesOcupacionaisService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const FUNCIONARIO_ID = '22222222-2222-4222-8222-222222222222'
const EXAME_ID = '33333333-3333-4333-8333-333333333333'

test('leitura canônica consulta a empresa uma vez e filtra arquivados', async () => {
  const chamadas = []
  const query = {
    select(campos) { chamadas.push(['select', campos]); return this },
    eq(campo, valor) { chamadas.push(['eq', campo, valor]); return this },
    order(campo, opcoes) { chamadas.push(['order', campo, opcoes]); return this }
  }
  const supabase = {
    from(tabela) { chamadas.push(['from', tabela]); return query }
  }

  await listarExamesOcupacionaisEmpresa({ supabase, empresaId: EMPRESA_ID })

  assert.equal(chamadas.filter(([tipo]) => tipo === 'from').length, 1)
  assert.deepEqual(chamadas[0], ['from', 'df_funcionarios_exames_ocupacionais'])
  assert.ok(chamadas.some((chamada) => chamada[0] === 'eq' && chamada[1] === 'empresa_id' && chamada[2] === EMPRESA_ID))
  assert.ok(chamadas.some((chamada) => chamada[0] === 'eq' && chamada[1] === 'arquivado' && chamada[2] === false))
})

test('registro normaliza contrato e usa somente a RPC controlada', async () => {
  const chamadas = []
  const supabase = {
    rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return Promise.resolve({ data: { id: EXAME_ID }, error: null })
    }
  }

  await registrarExameOcupacionalControlado({
    supabase,
    empresaId: EMPRESA_ID,
    funcionarioId: FUNCIONARIO_ID,
    tipo: 'periodico',
    estado: 'realizado',
    dataRealizada: '2026-08-23',
    correlationId: 'corr-exame'
  })

  assert.deepEqual(chamadas, [{
    nome: 'registrar_exame_ocupacional_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_funcionario_id: FUNCIONARIO_ID,
      p_tipo: 'PERIODICO',
      p_estado: 'REALIZADO',
      p_data_prevista: null,
      p_data_realizada: '2026-08-23',
      p_correlation_id: 'corr-exame'
    }
  }])
})

test('service rejeita estados incoerentes antes de consultar o banco', async () => {
  let consultou = false
  const supabase = { rpc() { consultou = true } }

  await assert.rejects(
    registrarExameOcupacionalControlado({
      supabase,
      empresaId: EMPRESA_ID,
      funcionarioId: FUNCIONARIO_ID,
      tipo: 'DEMISSIONAL',
      estado: 'PENDENTE'
    }),
    /data prevista/
  )
  assert.equal(consultou, false)
})

test('atualização e arquivamento preservam autoridade RPC', async () => {
  const chamadas = []
  const supabase = {
    rpc(nome, parametros) {
      chamadas.push({ nome, parametros })
      return Promise.resolve({ data: {}, error: null })
    }
  }

  await atualizarExameOcupacionalControlado({
    supabase,
    empresaId: EMPRESA_ID,
    exameId: EXAME_ID,
    tipo: 'ADMISSIONAL',
    estado: 'REALIZADO',
    dataRealizada: '2026-08-20'
  })
  await arquivarExameOcupacionalControlado({
    supabase,
    empresaId: EMPRESA_ID,
    exameId: EXAME_ID
  })

  assert.deepEqual(chamadas.map(({ nome }) => nome), [
    'atualizar_exame_ocupacional_controlado',
    'arquivar_exame_ocupacional_controlado'
  ])
})
