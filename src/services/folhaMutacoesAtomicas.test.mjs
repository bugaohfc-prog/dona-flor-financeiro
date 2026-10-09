import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  arquivarCompetenciaFolha,
  arquivarItemLancamentoFolha,
  arquivarLancamentoFolha,
  atualizarCompetenciaFolha,
  atualizarItemLancamentoFolha,
  atualizarLancamentoFolha,
  criarCompetenciaFolha,
  criarItemLancamentoFolha,
  criarLancamentoFolha,
  reativarCompetenciaFolha,
  reativarItemLancamentoFolha,
  reativarLancamentoFolha
} from './folhaService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const COMPETENCIA_ID = '22222222-2222-4222-8222-222222222222'
const FUNCIONARIO_ID = '33333333-3333-4333-8333-333333333333'
const FILIAL_ID = '44444444-4444-4444-8444-444444444444'
const LANCAMENTO_ID = '55555555-5555-4555-8555-555555555555'
const ITEM_ID = '66666666-6666-4666-8666-666666666666'
const CORRELATION_ID = '77777777-7777-4777-8777-777777777777'

function criarSupabase() {
  const chamadas = []
  return {
    chamadas,
    supabase: {
      async rpc(nome, parametros) {
        chamadas.push({ nome, parametros })
        return { data: { id: parametros.p_entidade_id || COMPETENCIA_ID }, error: null }
      }
    }
  }
}

const CAMPOS_DERIVADOS_PROIBIDOS_NA_CRIACAO = [
  'empresa_id',
  'conferido',
  'conferido_em',
  'arquivado',
  'arquivado_em',
  'created_at',
  'updated_at'
]

const cenarios = [
  ['criar competência', criarCompetenciaFolha, 'df_mutar_competencia_folha_controlado', 'criar', {
    empresaId: EMPRESA_ID, dados: { competencia: '2026-09' }
  }, { competencia: '2026-09', status: 'aberta' }],
  ['atualizar competência', atualizarCompetenciaFolha, 'df_mutar_competencia_folha_controlado', 'atualizar', {
    empresaId: EMPRESA_ID, id: COMPETENCIA_ID, dados: { status: 'em_conferencia' }
  }, { status: 'em_conferencia' }],
  ['arquivar competência', arquivarCompetenciaFolha, 'df_mutar_competencia_folha_controlado', 'arquivar', {
    empresaId: EMPRESA_ID, id: COMPETENCIA_ID
  }, {}],
  ['reativar competência', reativarCompetenciaFolha, 'df_mutar_competencia_folha_controlado', 'reativar', {
    empresaId: EMPRESA_ID, id: COMPETENCIA_ID
  }, {}],
  ['criar lançamento', criarLancamentoFolha, 'df_mutar_lancamento_folha_controlado', 'criar', {
    empresaId: EMPRESA_ID,
    dados: {
      competencia_id: COMPETENCIA_ID,
      funcionario_id: FUNCIONARIO_ID,
      filial_id: FILIAL_ID,
      natureza: 'desconto',
      categoria: 'outro_desconto',
      descricao: 'Poupança',
      valor: 10
    }
  }, {
    competencia_id: COMPETENCIA_ID,
    funcionario_id: FUNCIONARIO_ID,
    filial_id: FILIAL_ID,
    natureza: 'desconto',
    categoria: 'outro_desconto',
    descricao: 'Poupança',
    data_referencia: null,
    quantidade: null,
    percentual: null,
    valor: 10,
    observacao_administrativa: null,
    origem_lancamento: null,
    origem_id: null
  }],
  ['atualizar lançamento', atualizarLancamentoFolha, 'df_mutar_lancamento_folha_controlado', 'atualizar', {
    empresaId: EMPRESA_ID,
    id: LANCAMENTO_ID,
    dados: { natureza: 'desconto', categoria: 'outro_desconto', descricao: 'Poupança', valor: 20 }
  }, { natureza: 'desconto', categoria: 'outro_desconto', descricao: 'Poupança', valor: 20 }],
  ['arquivar lançamento', arquivarLancamentoFolha, 'df_mutar_lancamento_folha_controlado', 'arquivar', {
    empresaId: EMPRESA_ID, id: LANCAMENTO_ID
  }, {}],
  ['reativar lançamento', reativarLancamentoFolha, 'df_mutar_lancamento_folha_controlado', 'reativar', {
    empresaId: EMPRESA_ID, id: LANCAMENTO_ID
  }, {}],
  ['criar item', criarItemLancamentoFolha, 'df_mutar_item_folha_controlado', 'criar', {
    empresaId: EMPRESA_ID,
    dados: {
      competencia_id: COMPETENCIA_ID,
      lancamento_id: LANCAMENTO_ID,
      funcionario_id: FUNCIONARIO_ID,
      filial_id: FILIAL_ID,
      categoria: 'compras_vales',
      descricao: 'Compra',
      valor: 10
    }
  }, {
    categoria: 'compras_vales',
    descricao: 'Compra',
    data_referencia: null,
    quantidade: null,
    percentual: null,
    valor_base: null,
    valor: 10,
    observacao_administrativa: null,
    origem_item: null,
    competencia_id: COMPETENCIA_ID,
    lancamento_id: LANCAMENTO_ID,
    funcionario_id: FUNCIONARIO_ID,
    filial_id: FILIAL_ID
  }],
  ['atualizar item', atualizarItemLancamentoFolha, 'df_mutar_item_folha_controlado', 'atualizar', {
    empresaId: EMPRESA_ID,
    id: ITEM_ID,
    dados: { categoria: 'compras_vales', descricao: 'Compra', valor: 20 }
  }, {
    categoria: 'compras_vales',
    descricao: 'Compra',
    data_referencia: null,
    quantidade: null,
    percentual: null,
    valor_base: null,
    valor: 20,
    observacao_administrativa: null,
    origem_item: null
  }],
  ['arquivar item', arquivarItemLancamentoFolha, 'df_mutar_item_folha_controlado', 'arquivar', {
    empresaId: EMPRESA_ID, id: ITEM_ID
  }, {}],
  ['reativar item', reativarItemLancamentoFolha, 'df_mutar_item_folha_controlado', 'reativar', {
    empresaId: EMPRESA_ID, id: ITEM_ID
  }, {}]
]

for (const [nome, executar, rpc, operacao, parametros, dadosEsperados] of cenarios) {
  test(`${nome} respeita integralmente o contrato da RPC transacional`, async () => {
    const { supabase, chamadas } = criarSupabase()
    await executar({ supabase, ...parametros, correlationId: CORRELATION_ID })
    assert.equal(chamadas.length, 1)
    assert.equal(chamadas[0].nome, rpc)
    assert.equal(chamadas[0].parametros.p_operacao, operacao)
    assert.equal(chamadas[0].parametros.p_empresa_id, EMPRESA_ID)
    assert.equal(chamadas[0].parametros.p_correlation_id, CORRELATION_ID)
    assert.equal(chamadas[0].parametros.p_entidade_id, operacao === 'criar' ? null : parametros.id)
    assert.deepEqual(chamadas[0].parametros.p_dados, dadosEsperados)

    if (operacao === 'criar') {
      for (const campo of CAMPOS_DERIVADOS_PROIBIDOS_NA_CRIACAO) {
        assert.equal(Object.hasOwn(chamadas[0].parametros.p_dados, campo), false)
      }
    }
  })
}

test('hooks da Folha não executam auditoria posterior separada', () => {
  const fonte = fs.readFileSync('src/hooks/useFolha.js', 'utf8')
  assert.doesNotMatch(fonte, /registrarEventoAuditoriaSeguro|auditarResultadoFolha/)
})

test('hooks de Funcionários não executam auditoria posterior ao arquivamento', () => {
  const fonte = fs.readFileSync('src/hooks/useFuncionarios.js', 'utf8')
  assert.doesNotMatch(fonte, /registrarEventoAuditoriaSeguro|auditarArquivamentoFuncionario/)
})

test('migration restringe escrita direta e protege as RPCs', () => {
  const migration = fs.readFileSync(
    'supabase/migrations/20260929003247_tornar_auditoria_folha_funcionarios_atomica.sql',
    'utf8'
  )
  for (const tabela of ['df_folha_competencias', 'df_folha_lancamentos', 'df_folha_lancamento_itens']) {
    assert.match(migration, new RegExp(`revoke insert, update on table public\\.${tabela} from authenticated`, 'i'))
  }
  for (const rpc of [
    'df_mutar_competencia_folha_controlado',
    'df_mutar_lancamento_folha_controlado',
    'df_mutar_item_folha_controlado'
  ]) {
    assert.match(migration, new RegExp(`create or replace function public\\.${rpc}`, 'i'))
  }
  assert.match(migration, /security definer\s+set search_path = ''/i)
  assert.match(migration, /pg_advisory_xact_lock/i)
  assert.match(migration, /df_registrar_auditoria_mutacao_interno/i)
})

test('migration corretiva usa o módulo canônico aceito pela auditoria', () => {
  const migration = fs.readFileSync(
    'supabase/migrations/20260929003635_corrigir_modulo_auditoria_mutacoes_folha.sql',
    'utf8'
  )
  assert.match(migration, /case\s+when p_modulo = 'folha' then 'rh'/i)
})
