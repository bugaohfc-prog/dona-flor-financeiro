import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)

  const [editandoId, setEditandoId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')

  useEffect(() => {
    buscarContas()
  }, [])

  async function buscarContas() {
    setLoading(true)

    const { data, error } = await supabase
      .from('df_contas')
      .select('*')

    if (error) {
      alert(error.message)
    } else {
      setContas(data || [])
    }

    setLoading(false)
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)

    return vencimento < hoje
  }

  async function marcarComoPago(id) {
    await supabase.from('df_contas').update({ status: 'pago' }).eq('id', id)
    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  function iniciarEdicao(conta) {
    setEditandoId(conta.id)
    setDescricao(conta.descricao)
    setValor(conta.valor)
    setData(conta.data_vencimento)
  }

  async function salvarEdicao() {
    await supabase
      .from('df_contas')
      .update({
        descricao,
        valor: Number(valor),
        data_vencimento: data
      })
      .eq('id', editandoId)

    cancelarEdicao()
    buscarContas()
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setDescricao('')
    setValor('')
    setData('')
  }

  const contasFiltradas = contas
    .filter((c) => {
      if (filtro === 'pendentes') return c.status !== 'pago'
      if (filtro === 'pagas') return c.status === 'pago'
      if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
      return true
    })
    .filter((c) =>
      String(c.descricao || '').toLowerCase().includes(busca.toLowerCase())
    )

  const total = contas.reduce((a, c) => a + Number(c.valor || 0), 0)

  const pago = contas
    .filter((c) => c.status === 'pago')
    .reduce((a, c) => a + Number(c.valor || 0), 0)

  const pendente = total - pago

  const vencido = contas
    .filter((c) => estaVencida(c.data_vencimento, c.status))
    .reduce((a, c) => a + Number(c.valor || 0), 0)

  return (
    <div style={styles.page}>
      <h1>Contas a Pagar</h1>

      <div style={styles.resumo}>
        <div style={styles.box}>Total {formatarValor(total)}</div>
        <div style={styles.boxPago}>Pago {formatarValor(pago)}</div>
        <div style={styles.boxPendente}>Pendente {formatarValor(pendente)}</div>
        <div style={styles.boxVencido}>Vencido {formatarValor(vencido)}</div>
      </div>

      <input
        placeholder="Buscar..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={styles.input}
      />

      <div style={styles.filtros}>
        <button onClick={() => setFiltro('todas')}>todas</button>
        <button onClick={() => setFiltro('pendentes')}>pendentes</button>
        <button onClick={() => setFiltro('pagas')}>pagas</button>
        <button onClick={() => setFiltro('vencidas')}>vencidas</button>
      </div>

      {contasFiltradas.map((conta) => {
        const vencida = estaVencida(conta.data_vencimento, conta.status)

        if (editandoId === conta.id) {
          return (
            <div key={conta.id} style={styles.card}>
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              <input value={valor} onChange={(e) => setValor(e.target.value)} />
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

              <button onClick={salvarEdicao}>Salvar</button>
              <button onClick={cancelarEdicao}>Cancelar</button>
            </div>
          )
        }

        return (
          <div
            key={conta.id}
            style={{
              ...styles.card,
              background:
                conta.status === 'pago'
                  ? '#d4edda'
                  : vencida
                  ? '#ff4d4d'
                  : '#f8d7da'
            }}
          >
            <h3>{conta.descricao}</h3>
            <p>{formatarValor(conta.valor)}</p>
            <p>{formatarData(conta.data_vencimento)}</p>

            <div>
              {conta.status !== 'pago' && (
                <button onClick={() => marcarComoPago(conta.id)}>
                  Pago
                </button>
              )}

              <button onClick={() => iniciarEdicao(conta)}>
                Editar
              </button>

              <button onClick={() => excluirConta(conta.id)}>
                Excluir
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  page: { padding: 20 },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20
  },
  box: { background: '#eee', padding: 10, borderRadius: 8 },
  boxPago: { background: '#c3e6cb', padding: 10, borderRadius: 8 },
  boxPendente: { background: '#ffeeba', padding: 10, borderRadius: 8 },
  boxVencido: { background: '#f5c6cb', padding: 10, borderRadius: 8 },
  input: { width: '100%', padding: 10, marginBottom: 10 },
  filtros: { display: 'flex', gap: 10, marginBottom: 20 },
  card: { padding: 15, marginBottom: 10, borderRadius: 10 }
}
