import assert from 'node:assert/strict'
import test from 'node:test'

import {
  alterarAtividadeItemCatalogoChecklistDesligamento,
  alterarEstadoItemChecklistDesligamento,
  atualizarItemChecklistDesligamento,
  criarItemCatalogoChecklistDesligamento,
  criarItemChecklistDesligamento,
  editarItemCatalogoChecklistDesligamento,
  listarCatalogoChecklistDesligamento,
  listarItensChecklistDesligamento
} from './funcionariosChecklistDesligamentoService.js'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'
const DESLIGAMENTO_ID = '22222222-2222-4222-8222-222222222222'
const CATALOGO_ID = '33333333-3333-4333-8333-333333333333'
const ITEM_ID = '44444444-4444-4444-8444-444444444444'

function criarSupabase() {
  const chamadas = []
  const query = {
    select(campos) { chamadas.push({ tipo: 'select', campos }); return this },
    eq(campo, valor) { chamadas.push({ tipo: 'eq', campo, valor }); return this },
    order(campo, opcoes) { chamadas.push({ tipo: 'order', campo, opcoes }); return this }
  }
  return {
    chamadas,
    supabase: {
      from(tabela) { chamadas.push({ tipo: 'from', tabela }); return query },
      rpc(nome, parametros) {
        chamadas.push({ tipo: 'rpc', nome, parametros })
        return Promise.resolve({ data: { id: ITEM_ID }, error: null })
      }
    }
  }
}

test('catálogo e itens usam leitura tenant-local sem mutação direta', () => {
  const { supabase, chamadas } = criarSupabase()
  listarCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID })
  listarItensChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, desligamentoId: DESLIGAMENTO_ID })

  assert.deepEqual(chamadas.filter((item) => item.tipo === 'from').map((item) => item.tabela), [
    'df_funcionarios_desligamentos_checklist_catalogo',
    'df_funcionarios_desligamentos_checklist'
  ])
  assert.ok(chamadas.some((item) => item.tipo === 'eq' && item.campo === 'empresa_id' && item.valor === EMPRESA_ID))
  assert.ok(chamadas.some((item) => item.tipo === 'eq' && item.campo === 'ativo' && item.valor === true))
  assert.ok(chamadas.some((item) => item.tipo === 'eq' && item.campo === 'desligamento_id' && item.valor === DESLIGAMENTO_ID))
})

test('criação usa catálogo e RPC controlada', async () => {
  const { supabase, chamadas } = criarSupabase()
  await criarItemChecklistDesligamento({
    supabase,
    empresaId: EMPRESA_ID,
    desligamentoId: DESLIGAMENTO_ID,
    dados: {
      catalogoItemId: CATALOGO_ID,
      dataPrevista: '2026-09-10T12:00:00Z',
      observacaoAdministrativa: '  Conferir   internamente  '
    }
  })

  assert.deepEqual(chamadas.find((item) => item.tipo === 'rpc'), {
    tipo: 'rpc',
    nome: 'criar_item_checklist_desligamento_controlado',
    parametros: {
      p_empresa_id: EMPRESA_ID,
      p_desligamento_id: DESLIGAMENTO_ID,
      p_catalogo_item_id: CATALOGO_ID,
      p_data_prevista: '2026-09-10',
      p_observacao_administrativa: 'Conferir internamente',
      p_correlation_id: null
    }
  })
})

test('detalhes e estado usam autoridades distintas', async () => {
  const { supabase, chamadas } = criarSupabase()
  await atualizarItemChecklistDesligamento({
    supabase, empresaId: EMPRESA_ID, itemId: ITEM_ID,
    dados: { dataPrevista: '', observacaoAdministrativa: 'Sem data definida' }
  })
  await alterarEstadoItemChecklistDesligamento({
    supabase, empresaId: EMPRESA_ID, itemId: ITEM_ID, estado: 'concluido'
  })

  const rpcs = chamadas.filter((item) => item.tipo === 'rpc')
  assert.equal(rpcs[0].nome, 'atualizar_item_checklist_desligamento_controlado')
  assert.equal(rpcs[0].parametros.p_data_prevista, null)
  assert.equal(rpcs[1].nome, 'alterar_estado_item_checklist_desligamento_controlado')
  assert.equal(rpcs[1].parametros.p_estado, 'CONCLUIDO')
})

test('validação local bloqueia estado inválido e observação longa', () => {
  const { supabase, chamadas } = criarSupabase()
  assert.throws(() => alterarEstadoItemChecklistDesligamento({
    supabase, empresaId: EMPRESA_ID, itemId: ITEM_ID, estado: 'CANCELADO'
  }), /inválido/i)
  assert.throws(() => atualizarItemChecklistDesligamento({
    supabase, empresaId: EMPRESA_ID, itemId: ITEM_ID,
    dados: { observacaoAdministrativa: 'x'.repeat(501) }
  }), /500 caracteres/i)
  assert.equal(chamadas.length, 0)
})

test('gestão do catálogo usa somente RPCs administrativas controladas', async () => {
  const { supabase, chamadas } = criarSupabase()
  await criarItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, titulo: '  Conferência   interna  ', descricaoOperacional: '  Conferir antes do envio.  ' })
  await editarItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, catalogoItemId: CATALOGO_ID, titulo: 'Conferência final', descricaoOperacional: '' })
  await alterarAtividadeItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, catalogoItemId: CATALOGO_ID, ativo: false })

  assert.deepEqual(chamadas.filter((item) => item.tipo === 'rpc').map((item) => item.nome), [
    'criar_item_catalogo_checklist_desligamento_controlado',
    'editar_titulo_item_catalogo_checklist_desligamento_controlado',
    'alterar_atividade_item_catalogo_checklist_desligamento_controla'
  ])
  assert.equal(chamadas[0].parametros.p_titulo, 'Conferência interna')
  assert.equal(chamadas[0].parametros.p_descricao_operacional, 'Conferir antes do envio.')
  assert.equal(chamadas[1].parametros.p_descricao_operacional, null)
  assert.equal(chamadas[2].parametros.p_ativo, false)
  assert.equal(chamadas.some((item) => ['insert', 'update', 'delete'].includes(item.tipo)), false)
})

test('gestão do catálogo valida título e atividade antes da rede', () => {
  const { supabase, chamadas } = criarSupabase()
  assert.throws(() => criarItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, titulo: 'x' }), /3 e 160/)
  assert.throws(() => criarItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, titulo: 'Item válido', descricaoOperacional: 'x'.repeat(501) }), /500 caracteres/)
  assert.throws(() => alterarAtividadeItemCatalogoChecklistDesligamento({ supabase, empresaId: EMPRESA_ID, catalogoItemId: CATALOGO_ID, ativo: 'false' }), /inválido/i)
  assert.equal(chamadas.length, 0)
})
