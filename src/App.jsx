import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export default function App() {
  const supabaseStatus = supabase ? 'Supabase configurado' : 'Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel'

  return (
    <main className="page">
      <section className="card">
        <h1>Dona Flor Financeiro</h1>
        <p>Sistema financeiro carregado com sucesso.</p>
        <div className={supabase ? 'status ok' : 'status warn'}>{supabaseStatus}</div>
      </section>
    </main>
  )
}
