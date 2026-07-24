import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseConfigError() {
  if (hasSupabaseConfig()) return ''
  return 'Configuração do sistema incompleta. Chame o suporte para liberar o acesso.'
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export default supabase
