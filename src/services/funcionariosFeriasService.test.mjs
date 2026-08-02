import assert from 'node:assert/strict'
import test from 'node:test'
import {
  arquivarPeriodoFerias,
  atualizarPeriodoFerias,
  cancelarPeriodoFerias,
  criarPeriodoFerias,
  reativarPeriodoFerias
} from './funcionariosFeriasService.js'

function criarSupabaseRpc() {
  const chamadas = []
  return {
    chamadas,
    async rpc(nome, argumentos) {
      chamadas.push({ nome, argumentos })
      return { data: { periodo: { id: 'periodo' }, resumo: { saldoLivreParaProgramar: 20 } }, error: null }
    }
  }
}

test('criacao envia somente ciclo, inicio e quantidade para a RPC autoritativa', async () => {
  const supabase = criarSupabaseRpc()
  const resposta = await criarPeriodoFerias({
    supabase,
    empresaId: 'empresa',
    cicloId: 'ciclo',
    funcionarioId: 'nao-deve-ser-enviado',
    dataInicio: '2026-08-01',
    quantidadeDias: 10,
    numeroParcela: 3,
    status: 'concluida'
  })
  assert.deepEqual(supabase.chamadas, [{
    nome: 'criar_periodo_ferias_controlado',
    argumentos: {
      p_empresa_id: 'empresa',
      p_ciclo_id: 'ciclo',
      p_data_inicio: '2026-08-01',
      p_quantidade_dias: 10
    }
  }])
  assert.equal(resposta.data.id, 'periodo')
  assert.equal(resposta.data.resumo_ferias.saldoLivreParaProgramar, 20)
})

test('edicao nao envia parcela, status, funcionario, fim ou retorno', async () => {
  const supabase = criarSupabaseRpc()
  await atualizarPeriodoFerias({
    supabase,
    empresaId: 'empresa',
    periodoId: 'periodo',
    dados: {
      dataInicio: '2026-08-02',
      quantidadeDias: 9,
      status: 'cancelada',
      numeroParcela: 2,
      funcionarioId: 'outro',
      dataFimCalculada: '2099-01-01'
    }
  })
  assert.deepEqual(supabase.chamadas[0].argumentos, {
    p_empresa_id: 'empresa',
    p_periodo_id: 'periodo',
    p_data_inicio: '2026-08-02',
    p_quantidade_dias: 9
  })
})

test('cancelar, arquivar e reativar usam somente a RPC de estado controlado', async () => {
  const supabase = criarSupabaseRpc()
  await cancelarPeriodoFerias({ supabase, empresaId: 'empresa', periodoId: 'periodo' })
  await arquivarPeriodoFerias({ supabase, empresaId: 'empresa', periodoId: 'periodo' })
  await reativarPeriodoFerias({ supabase, empresaId: 'empresa', periodoId: 'periodo' })
  assert.deepEqual(supabase.chamadas.map(({ nome, argumentos }) => [nome, argumentos.p_acao]), [
    ['alterar_estado_periodo_ferias_controlado', 'cancelar'],
    ['alterar_estado_periodo_ferias_controlado', 'arquivar'],
    ['alterar_estado_periodo_ferias_controlado', 'reativar']
  ])
})
