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

    if (error) {
      console.error('Erro ao buscar:', error)
    } else {
      setContas(data)
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

  return (
    <div style={{ padding: 20 }}>
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
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            backgroundColor:
              conta.status === 'pago' ? '#d4edda' : '#f8d7da'
          }}
        >
          <p><b>Descrição:</b> {conta.descricao}</p>
          <p><b>Valor:</b> R$ {conta.valor}</p>
          <p><b>Vencimento:</b> {conta.data_vencimento}</p>
          <p><b>Status:</b> {conta.status}</p>

          {conta.status !== 'pago' && (
            <button onClick={() => marcarComoPago(conta.id)}>
              Marcar como pago
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
