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
      .select('*, df_centros_custo(nome)')

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

  async function voltarParaPendente(id) {
    await supabase.from('df_contas').update({ status: 'pendente' }).eq('id', id)
    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  function iniciarEdicao(conta) {
    setEditandoId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setData(conta.data_vencimento || '')
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

  function ordenarContas(lista) {
    return [...lista].sort((a, b) => {
      const aVencida = estaVencida(a.data_vencimento, a.status)
      const bVencida = estaVencida(b.data_vencimento, b.status)

      if (aVencida && !bVencida) return -1
      if (!aVencida && bVencida) return 1

      if (a.status !== 'pago' && b.status === 'pago') return -1
      if (a.status === 'pago' && b.status !== 'pago') return 1

      return new Date(a.data_vencimento || '9999-12-31') - new Date(b.data_vencimento || '9999-12-31')
    })
  }

  const contasFiltradas = ordenarContas(
    contas
      .filter((c) => {
        if (filtro === 'pendentes') return c.status !== 'pago'
        if (filtro === 'pagas') return c.status === 'pago'
        if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
        return true
      })
      .filter((c) =>
        String(c.descricao || '').toLowerCase().includes(busca.toLowerCase())
      )
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
      <h1 style={styles.titulo}>Contas a Pagar</h1>

      <div style={styles.resumo}>
        <div style={styles.box}>Total<br /><b>{formatarValor(total)}</b></div>
        <div style={styles.boxPago}>Pago<br /><b>{formatarValor(pago)}</b></div>
        <div style={styles.boxPendente}>Pendente<br /><b>{formatarValor(pendente)}</b></div>
        <div style={styles.boxVencido}>Vencido<br /><b>{formatarValor(vencido)}</b></div>
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

      {loading && <p>Carregando...</p>}

      {contasFiltradas.map((conta) => {
        const vencida = estaVencida(conta.data_vencimento, conta.status)

        if (editandoId === conta.id) {
          return (
            <div key={conta.id} style={styles.linhaEdicao}>
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                style={styles.inputEdicao}
              />

              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                style={styles.inputEdicao}
              />

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={styles.inputEdicao}
              />

              <div style={styles.acoes}>
                <button onClick={salvarEdicao}>Salvar</button>
                <button onClick={cancelarEdicao}>Cancelar</button>
              </div>
            </div>
          )
        }

        return (
          <div
            key={conta.id}
            style={{
              ...styles.linhaConta,
              background:
                conta.status === 'pago'
                  ? '#d4edda'
                  : vencida
                  ? '#ffb3b3'
                  : '#f8d7da'
            }}
          >
            <div style={styles.infoPrincipal}>
              <strong>{conta.descricao}</strong>
              <span>{formatarValor(conta.valor)}</span>
            </div>

            <div style={styles.infoSecundaria}>
              <span>Venc.: {formatarData(conta.data_vencimento)}</span>
              <span>Centro: {conta.df_centros_custo?.nome || '—'}</span>
              <span>Status: {vencida ? 'vencido' : conta.status}</span>
            </div>

            <div style={styles.acoes}>
              {conta.status !== 'pago' && (
                <button onClick={() => marcarComoPago(conta.id)}>
                  Pago
                </button>
              )}

              {conta.status === 'pago' && (
                <button onClick={() => voltarParaPendente(conta.id)}>
                  Voltar
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
  page: {
    padding: 20,
    maxWidth: 900,
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  titulo: {
    marginBottom: 16
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16
  },
  box: {
    background: '#eee',
    padding: 8,
    borderRadius: 8,
    fontSize: 14
  },
  boxPago: {
    background: '#c3e6cb',
    padding: 8,
    borderRadius: 8,
    fontSize: 14
  },
  boxPendente: {
    background: '#ffeeba',
    padding: 8,
    borderRadius: 8,
    fontSize: 14
  },
  boxVencido: {
    background: '#f5c6cb',
    padding: 8,
    borderRadius: 8,
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    boxSizing: 'border-box'
  },
  filtros: {
    display: 'flex',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap'
  },
  linhaConta: {
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  infoPrincipal: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 17,
    marginBottom: 6
  },
  infoSecundaria: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    fontSize: 13,
    marginBottom: 8
  },
  acoes: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap'
  },
  linhaEdicao: {
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    background: '#fff'
  },
  inputEdicao: {
    width: '100%',
    padding: 8,
    marginBottom: 6,
    boxSizing: 'border-box'
  }
    }
