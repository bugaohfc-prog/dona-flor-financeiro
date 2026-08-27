import { selecionarPorEmpresa } from './supabaseQueryService.js'
import { assertEmpresaId } from './tenantService.js'

const TABELA_CATALOGO = 'df_funcionarios_desligamentos_checklist_catalogo'
const TABELA_ITENS = 'df_funcionarios_desligamentos_checklist'
const ESTADOS = new Set(['PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL'])

export const CHECKLIST_CATALOGO_SELECT = [
  'id', 'empresa_id', 'codigo', 'titulo', 'descricao_operacional', 'ativo', 'criado_em', 'atualizado_em'
].join(', ')

export const CHECKLIST_ITEM_SELECT = [
  'id', 'empresa_id', 'desligamento_id', 'funcionario_id', 'catalogo_item_id',
  'item_codigo', 'titulo_snapshot', 'descricao_snapshot', 'estado', 'data_prevista', 'concluido_em',
  'concluido_por', 'observacao_administrativa', 'correlation_id', 'criado_em', 'atualizado_em'
].join(', ')

function texto(valor) {
  return String(valor || '').trim()
}

function idObrigatorio(valor, mensagem) {
  const id = texto(valor)
  if (!id) throw new Error(mensagem)
  return id
}

function dataOpcional(valor) {
  return texto(valor).slice(0, 10) || null
}

function observacaoOpcional(valor) {
  const observacao = texto(valor).replace(/\s+/g, ' ') || null
  if (observacao && observacao.length > 500) {
    throw new Error('A observação administrativa deve ter no máximo 500 caracteres.')
  }
  return observacao
}

function tituloCatalogoObrigatorio(valor) {
  const titulo = texto(valor).replace(/\s+/g, ' ')
  if (titulo.length < 3 || titulo.length > 160) {
    throw new Error('O título deve ter entre 3 e 160 caracteres.')
  }
  return titulo
}

function descricaoOperacionalOpcional(valor) {
  const descricao = texto(valor) || null
  if (descricao && descricao.length > 500) {
    throw new Error('A descrição operacional deve ter no máximo 500 caracteres.')
  }
  return descricao
}

export function listarCatalogoChecklistDesligamento({ supabase, empresaId, somenteAtivos = true }) {
  const empresa = assertEmpresaId(texto(empresaId))
  let query = selecionarPorEmpresa(supabase, TABELA_CATALOGO, empresa, CHECKLIST_CATALOGO_SELECT)
    .order('titulo', { ascending: true })
  if (somenteAtivos) query = query.eq('ativo', true)
  return query
}

export function criarItemCatalogoChecklistDesligamento({ supabase, empresaId, titulo, descricaoOperacional = null, correlationId = null }) {
  const empresa = assertEmpresaId(texto(empresaId))
  return supabase.rpc('criar_item_catalogo_checklist_desligamento_controlado', {
    p_empresa_id: empresa,
    p_titulo: tituloCatalogoObrigatorio(titulo),
    p_descricao_operacional: descricaoOperacionalOpcional(descricaoOperacional),
    p_correlation_id: texto(correlationId) || null
  })
}

export function editarItemCatalogoChecklistDesligamento({ supabase, empresaId, catalogoItemId, titulo, descricaoOperacional = null, correlationId = null }) {
  const empresa = assertEmpresaId(texto(empresaId))
  return supabase.rpc('editar_titulo_item_catalogo_checklist_desligamento_controlado', {
    p_empresa_id: empresa,
    p_catalogo_item_id: idObrigatorio(catalogoItemId, 'Item do catálogo não identificado.'),
    p_titulo: tituloCatalogoObrigatorio(titulo),
    p_descricao_operacional: descricaoOperacionalOpcional(descricaoOperacional),
    p_correlation_id: texto(correlationId) || null
  })
}

export function alterarAtividadeItemCatalogoChecklistDesligamento({ supabase, empresaId, catalogoItemId, ativo, correlationId = null }) {
  const empresa = assertEmpresaId(texto(empresaId))
  if (typeof ativo !== 'boolean') throw new Error('Estado do item do catálogo inválido.')
  // PostgreSQL limita identificadores a 63 bytes e materializa esta RPC com o nome truncado abaixo.
  return supabase.rpc('alterar_atividade_item_catalogo_checklist_desligamento_controla', {
    p_empresa_id: empresa,
    p_catalogo_item_id: idObrigatorio(catalogoItemId, 'Item do catálogo não identificado.'),
    p_ativo: ativo,
    p_correlation_id: texto(correlationId) || null
  })
}

export function listarItensChecklistDesligamento({ supabase, empresaId, desligamentoId }) {
  const empresa = assertEmpresaId(texto(empresaId))
  return selecionarPorEmpresa(supabase, TABELA_ITENS, empresa, CHECKLIST_ITEM_SELECT)
    .eq('desligamento_id', idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'))
    .order('criado_em', { ascending: true })
}

export function criarItemChecklistDesligamento({ supabase, empresaId, desligamentoId, dados = {} }) {
  const empresa = assertEmpresaId(texto(empresaId))
  return supabase.rpc('criar_item_checklist_desligamento_controlado', {
    p_empresa_id: empresa,
    p_desligamento_id: idObrigatorio(desligamentoId, 'Processo de desligamento não identificado.'),
    p_catalogo_item_id: idObrigatorio(dados.catalogoItemId, 'Selecione um item do catálogo.'),
    p_data_prevista: dataOpcional(dados.dataPrevista),
    p_observacao_administrativa: observacaoOpcional(dados.observacaoAdministrativa),
    p_correlation_id: texto(dados.correlationId) || null
  })
}

export function atualizarItemChecklistDesligamento({ supabase, empresaId, itemId, dados = {} }) {
  const empresa = assertEmpresaId(texto(empresaId))
  return supabase.rpc('atualizar_item_checklist_desligamento_controlado', {
    p_empresa_id: empresa,
    p_item_id: idObrigatorio(itemId, 'Item de checklist não identificado.'),
    p_data_prevista: dataOpcional(dados.dataPrevista),
    p_observacao_administrativa: observacaoOpcional(dados.observacaoAdministrativa),
    p_correlation_id: texto(dados.correlationId) || null
  })
}

export function alterarEstadoItemChecklistDesligamento({ supabase, empresaId, itemId, estado, correlationId = null }) {
  const empresa = assertEmpresaId(texto(empresaId))
  const estadoNormalizado = texto(estado).toUpperCase()
  if (!ESTADOS.has(estadoNormalizado)) throw new Error('Estado do checklist inválido.')
  return supabase.rpc('alterar_estado_item_checklist_desligamento_controlado', {
    p_empresa_id: empresa,
    p_item_id: idObrigatorio(itemId, 'Item de checklist não identificado.'),
    p_estado: estadoNormalizado,
    p_correlation_id: texto(correlationId) || null
  })
}
