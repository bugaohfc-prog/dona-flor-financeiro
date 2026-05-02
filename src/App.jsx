import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarContas()
  }, [])

  async function buscarContas() {
    const { data, error } = await supabase
      .from('df_contas')
      .select('*')
      .order('data_vencimento', { ascending: true })

    if (error) {
      console.error('Erro ao buscar:', error)
    } else {
      setContas(data || [])
    }

    setLoading(false)
  }

  async function marcarComoPago(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar:', error)
    } else {
      buscarContas()
    }
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Contas a Pagar</h1>

      {loading && <p>Carregando...</p>}

      {!loading && contas.length === 0 && (
        <p>Nenhuma conta encontrada</p>
      )}

      {contas.map((conta) => (
        <div
          key={conta.id}
          style={{
            border: '1px solid #ccc',
            padding: 15,
            marginBottom: 15,
            borderRadius: 10,
            backgroundColor:
              conta.status === 'pago' ? '#d4edda' : '#f8d7da'
          }}
        >
          <p><b>Descrição:</b> {conta.descricao}</p>
          <p><b>Valor:</b> R$ {conta.valor}</p>
          <p><b>Vencimento:</b> {formatarData(conta.data_vencimento)}</p>
          <p><b>Status:</b> {conta.status || 'pendente'}</p>

          {conta.status !== 'pago' && (
            <button
              onClick={() => marcarComoPago(conta.id)}
              style={{
                marginTop: 10,
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#007bff',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Marcar como pago
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
