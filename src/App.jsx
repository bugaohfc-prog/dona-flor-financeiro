import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  // NOVA CONTA
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')

  useEffect(() => {
    buscarContas()
  }, [])

  async function buscarContas() {
    const { data, error } = await supabase
      .from('df_contas')
      .select('*')
      .order('data_vencimento', { ascending: true })

    if (error) {
      alert('Erro Supabase: ' + error.message)
    } else {
      setContas(data || [])
    }

    setLoading(false)
  }

  async function adicionarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha todos os campos')
      return
    }

    const { error } = await supabase.from('df_contas').insert([
      {
        descricao,
        valor: Number(valor),
        data_vencimento: dataVencimento,
        status: 'pendente'
      }
    ])

    if (error) {
      alert('Erro ao inserir: ' + error.message)
    } else {
      setDescricao('')
      setValor('')
      setDataVencimento('')
      buscarContas()
    }
  }

  async function marcarComoPago(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (!error) buscarContas()
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function estaVencida(data) {
    if (!data) return false
    const hoje = new Date()
    const venc = new Date(data + 'T00:00:00')
    return venc < hoje
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>📊 Contas a Pagar</h1>

      {/* FORMULÁRIO */}
      <div style={{
        marginBottom: 30,
        padding: 15,
        border: '1px solid #ccc',
        borderRadius: 10
      }}>
        <h2>➕ Nova Conta</h2>

        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{ display: 'block', marginBottom: 10, padding: 8, width: '100%' }}
        />

        <input
          placeholder="Valor"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ display: 'block', marginBottom: 10, padding: 8, width: '100%' }}
        />

        <input
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          style={{ display: 'block', marginBottom: 10, padding: 8 }}
        />

        <button
          onClick={adicionarConta}
          style={{
            padding: '10px 15px',
            backgroundColor: 'green',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Salvar Conta
        </button>
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && contas.length === 0 && (
        <p>Nenhuma conta encontrada</p>
      )}

      {contas.map((conta) => {
        const vencida = estaVencida(conta.data_vencimento)

        return (
          <div
            key={conta.id}
            style={{
              border: '1px solid #ccc',
              padding: 15,
              marginBottom: 15,
              borderRadius: 10,
              backgroundColor:
                conta.status === 'pago'
                  ? '#d4edda'
                  : vencida
                  ? '#ffb3b3'
                  : '#f8d7da'
            }}
          >
            <p><b>Descrição:</b> {conta.descricao}</p>
            <p><b>Valor:</b> R$ {conta.valor}</p>
            <p><b>Vencimento:</b> {formatarData(conta.data_vencimento)}</p>

            <p>
              <b>Status:</b>{' '}
              {conta.status === 'pago'
                ? 'pago'
                : vencida
                ? 'VENCIDO'
                : 'pendente'}
            </p>

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
        )
      })}
    </div>
  )
                  }
