import { assertEmpresaId, assertPayloadEmpresaId, assertPayloadsEmpresaId } from './tenantService'

export function selecionarPorEmpresa(supabase, tabela, empresaId, colunas = '*') {
  assertEmpresaId(empresaId)
  return supabase
    .from(tabela)
    .select(colunas)
    .eq('empresa_id', empresaId)
}

export function inserirComEmpresa(supabase, tabela, payload, options = {}) {
  assertPayloadEmpresaId(payload)
  let query = supabase.from(tabela).insert([payload])
  if (options.select) query = query.select(options.select === true ? '*' : options.select)
  return query
}

export function inserirLoteComEmpresa(supabase, tabela, payloads, options = {}) {
  assertPayloadsEmpresaId(payloads)
  let query = supabase.from(tabela).insert(payloads)
  if (options.select) query = query.select(options.select === true ? '*' : options.select)
  return query
}

export function atualizarPorEmpresa(supabase, tabela, id, empresaId, payload) {
  assertEmpresaId(empresaId)
  return supabase
    .from(tabela)
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
}

export function excluirPorEmpresa(supabase, tabela, id, empresaId) {
  assertEmpresaId(empresaId)
  return supabase
    .from(tabela)
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)
}

export function ordenar(query, coluna, options) {
  if (!coluna) return query
  return query.order(coluna, options)
}
