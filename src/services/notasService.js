import { assertEmpresaId, assertPayloadEmpresaId } from './tenantService'

export async function listarNotas(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return supabase
    .from('df_notas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('excluido', false)
    .order('created_at', { ascending: false })
}

export async function listarNotasLixeira(supabase, empresaId) {
  assertEmpresaId(empresaId)
  return supabase
    .from('df_notas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('excluido', true)
    .order('excluido_em', { ascending: false })
}

export async function criarNota(supabase, payload) {
  assertPayloadEmpresaId(payload)
  return supabase.from('df_notas').insert([payload])
}

export async function atualizarNota(supabase, id, empresaId, payload) {
  assertEmpresaId(empresaId)
  return supabase
    .from('df_notas')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
}

export async function enviarNotaParaLixeira(supabase, id, empresaId) {
  return atualizarNota(supabase, id, empresaId, {
    excluido: true,
    excluido_em: new Date().toISOString()
  })
}

export async function alternarNotaConcluidaService(supabase, nota, empresaId) {
  return atualizarNota(supabase, nota.id, empresaId, { concluida: !nota.concluida })
}

export async function restaurarNotaDaLixeira(supabase, id, empresaId) {
  return atualizarNota(supabase, id, empresaId, {
    excluido: false,
    excluido_em: null
  })
}

export async function excluirNotaPermanentemente(supabase, id, empresaId) {
  assertEmpresaId(empresaId)
  return supabase
    .from('df_notas')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId)
}
