import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')

  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    buscarContas()
  }, [])

  async function buscarContas() {
    const { data, error } = await supabase
      .from('df_contas')
      .select('*')
      .order('data_vencimento', { ascending: true })

    if (!error) setContas(data || [])
    setLoading(false)
  }

  async function adicionarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha tudo')
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

    if (!error) {
      setDescricao('')
      setValor('')
      setDataVencimento('')
      buscarContas()
    }
  }

  async function marcarComoPago(id) {
    await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    buscarContas()
  }

  async function excluirConta(id) {
    const confirmar = confirm('Deseja excluir essa conta?')
    if (!confirmar) return

    await supabase
      .from('df_contas')
      .delete()
      .eq('id', id)

    buscarContas()
  }

  function formatarData(data) {
    if (!data) return '—'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function estaVencida(data) {
    if (!data) return false
    return new Date(data + 'T00:00:00') < new Date()
  }

  const contasFiltradas = contas.filter((c) => {
    if (filtro === 'pendente') return c.status !== 'pago'
    if (filtro === 'pago') return c.status === 'pago'
    return true
  })

  const total = contas.reduce((acc, c) => acc + Number(c.valor || 0), 0)
  const pago = contas
    .filter(c => c.status === 'pago')
    .reduce((acc, c) => acc + Number(c.valor || 0), 0)

  const pendente = total - pago

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>📊 Contas a Pagar</h1>

      <div style={{ marginBottom: 20 }}>
        <p><b>Total:</b> R$ {total}</p>
        <p><b>Pago:</b> R$ {pago}</p>
        <p><b>Pendente:</b> R$ {pendente}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFiltro('todas')}>Todas</button>
        <button onClick={() => setFiltro('pendente')}>Pendentes</button>
        <button onClick={() => setFiltro('pago')}>Pagas</button>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>➕ Nova Conta</h2>

        <input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <input type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

        <button onClick={adicionarConta}>Salvar Conta</button>
      </div>

      {loading && <p>Carregando...</p>}

      {contasFiltradas.map((conta) => {
        const vencida = estaVencida(conta.data_vencimento)

        return (
          <div key={conta.id} style={{
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
          }}>
            <p><b>Descrição:</b> {conta.descricao}</p>
            <p><b>Valor:</b> R$ {conta.valor}</p>
            <p><b>Vencimento:</b> {formatarData(conta.data_vencimento)}</p>

            <p>
              <b>Status:</b> {conta.status === 'pago'
                ? 'pago'
                : vencida
                ? 'VENCIDO'
                : 'pendente'}
            </p>

            {conta.status !== 'pago' && (
              <button onClick={() => marcarComoPago(conta.id)}>
                Marcar como pago
              </button>
            )}

            <button
              onClick={() => excluirConta(conta.id)}
              style={{ marginLeft: 10, color: 'red' }}
            >
              Excluir
            </button>
          </div>
        )
      })}
    </div>
  )
}
