import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  useEffect(() => {
    buscarCentros()
    buscarContas()
  }, [])

  async function buscarCentros() {
    const { data } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    setCentros(data || [])
  }

  async function buscarContas() {
    setLoading(true)

    const { data } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

    setContas(data || [])
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

  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const venc = new Date(data + 'T00:00:00')
    return venc < hoje
  }

  function abrirNovaConta() {
    setEditandoId(null)
    setDescricao('')
    setValor('')
    setData('')
    setCentroCustoId('')
    setModalAberto(true)
  }

  function abrirEdicao(c) {
    setEditandoId(c.id)
    setDescricao(c.descricao)
    setValor(c.valor)
    setData(c.data_vencimento)
    setCentroCustoId(c.centro_custo_id)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
  }

  async function salvarConta() {
    const payload = {
      descricao: primeiraLetraMaiuscula(descricao),
      valor: Number(valor),
      data_vencimento: data,
      centro_custo_id: centroCustoId || null
    }

    if (editandoId) {
      await supabase.from('df_contas').update(payload).eq('id', editandoId)
    } else {
      await supabase.from('df_contas').insert([{ ...payload, status: 'pendente' }])
    }

    fecharModal()
    buscarContas()
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
    if (!confirm('Excluir?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  const contasFiltradas = contas.filter(c => {
    if (filtro === 'pendentes') return c.status !== 'pago'
    if (filtro === 'pagas') return c.status === 'pago'
    if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
    return true
  }).filter(c =>
    c.descricao?.toLowerCase().includes(busca.toLowerCase())
  )

  const total = contas.reduce((a, c) => a + Number(c.valor || 0), 0)
  const pago = contas.filter(c => c.status === 'pago').reduce((a, c) => a + Number(c.valor || 0), 0)
  const pendente = total - pago
  const vencido = contas.filter(c => estaVencida(c.data_vencimento, c.status))
    .reduce((a, c) => a + Number(c.valor || 0), 0)

  return (
    <div style={styles.page}>
      <h1>📊 Contas a Pagar</h1>

      <div style={styles.resumo}>
        <div style={styles.box}>Total<br /><b>{formatarValor(total)}</b></div>
        <div style={styles.boxPago}>Pago<br /><b>{formatarValor(pago)}</b></div>
        <div style={styles.boxPend}>Pend<br /><b>{formatarValor(pendente)}</b></div>
        <div style={styles.boxVen}>Venc<br /><b>{formatarValor(vencido)}</b></div>
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

      {contasFiltradas.map(c => {
        const vencida = estaVencida(c.data_vencimento, c.status)

        return (
          <div key={c.id} style={{
            ...styles.card,
            background: c.status === 'pago'
              ? '#d4edda'
              : vencida ? '#ffb3b3' : '#fff3cd'
          }}>
            <div style={styles.topo}>
              <strong>{c.descricao}</strong>
              <span>{formatarValor(c.valor)}</span>
            </div>

            <small>
              {formatarData(c.data_vencimento)} • {c.df_centros_custo?.nome || '-'}
            </small>

            <div style={styles.acoes}>
              {c.status !== 'pago'
                ? <button style={styles.btnAzul} onClick={() => marcarComoPago(c.id)}>Pago</button>
                : <button style={styles.btnRoxo} onClick={() => voltarParaPendente(c.id)}>Voltar</button>
              }

              <button style={styles.btnAmarelo} onClick={() => abrirEdicao(c)}>Editar</button>
              <button style={styles.btnVermelho} onClick={() => excluirConta(c.id)}>Excluir</button>
            </div>
          </div>
        )
      })}

      <button style={styles.fab} onClick={abrirNovaConta}>+</button>

      {modalAberto && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoId ? 'Editar' : 'Nova Conta'}</h3>

            <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
            <input type="date" value={data} onChange={e => setData(e.target.value)} />

            <select value={centroCustoId} onChange={e => setCentroCustoId(e.target.value)}>
              <option value="">Centro</option>
              {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <button onClick={salvarConta}>Salvar</button>
            <button onClick={fecharModal}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 16, maxWidth: 700, margin: 'auto' },

  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 10
  },

  box: { padding: 8, background: '#eee', borderRadius: 8, fontSize: 13 },
  boxPago: { padding: 8, background: '#c3e6cb', borderRadius: 8, fontSize: 13 },
  boxPend: { padding: 8, background: '#ffeeba', borderRadius: 8, fontSize: 13 },
  boxVen: { padding: 8, background: '#f5c6cb', borderRadius: 8, fontSize: 13 },

  input: { width: '100%', padding: 8, marginBottom: 8 },

  filtros: { display: 'flex', gap: 6, marginBottom: 10 },

  card: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  acoes: {
    marginTop: 8,
    display: 'flex',
    gap: 6
  },

  btnAzul: { background: '#0d6efd', color: '#fff', border: 'none', padding: 6 },
  btnRoxo: { background: '#6f42c1', color: '#fff', border: 'none', padding: 6 },
  btnAmarelo: { background: '#ffc107', border: 'none', padding: 6 },
  btnVermelho: { background: '#dc3545', color: '#fff', border: 'none', padding: 6 },

  fab: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: '#198754',
    color: '#fff',
    fontSize: 30
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modal: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300
  }
}
