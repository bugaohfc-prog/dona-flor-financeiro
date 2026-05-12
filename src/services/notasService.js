import {
  atualizarPorEmpresa,
  excluirPorEmpresa,
  inserirComEmpresa,
  selecionarPorEmpresa
} from './supabaseQueryService'

export async function listarNotas(supabase, empresaId) {
  return selecionarPorEmpresa(supabase, 'df_notas', empresaId)
    .eq('excluido', false)
    .order('created_at', { ascending: false })
}

export async function listarNotasLixeira(supabase, empresaId) {
  return selecionarPorEmpresa(supabase, 'df_notas', empresaId)
    .eq('excluido', true)
    .order('excluido_em', { ascending: false })
}

export async function criarNota(supabase, payload) {
  return inserirComEmpresa(supabase, 'df_notas', payload)
}

export async function atualizarNota(supabase, id, empresaId, payload) {
  return atualizarPorEmpresa(supabase, 'df_notas', id, empresaId, payload)
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
  return excluirPorEmpresa(supabase, 'df_notas', id, empresaId)
}
