import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    buscarContas()
    buscarCentros()
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

    setContas(data || [])
    setLoading(false)
  }

  function limparFormulario() {
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setEditandoId(null)
  }

  function abrirNovaConta() {
    limparFormulario()
    setModalAberto(true)
  }

  function abrirEdicao(conta) {
    setEditandoId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(String(conta.valor || ''))
    setDataVencimento(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalAberto(true)
  }

  function fecharModal() {
    limparFormulario()
    setModalAberto(false)
  }

  async function salvarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha todos os campos')
      return
    }

    const payload = {
      descricao,
      valor: Number(valor),
      data_vencimento: dataVencimento,
      centro_custo_id: centroCustoId || null
    }

    if (editandoId) {
      await supabase.from('df_contas').update(payload).eq('id', editandoId)
    } else {
      await supabase.from('df_contas').insert([
        { ...payload, status: 'pendente' }
      ])
    }

    fecharModal()
    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Excluir conta?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  async function togglePago(conta) {
    await supabase
      .from('df_contas')
      .update({
        status: conta.status === 'pago' ? 'pendente' : 'pago'
      })
      .eq('id', conta.id)

    buscarContas()
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    const hoje = new Date()
    const venc = new Date(data + 'T00:00:00')
    return venc < hoje
  }

  function filtrar() {
    return contas
      .filter((c) => {
        if (filtro === 'pendentes') return c.status !== 'pago'
        if (filtro === 'pagas') return c.status === 'pago'
        if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
        return true
      })
      .filter((c) =>
        (c.descricao || '').toLowerCase().includes(busca.toLowerCase())
      )
      .sort((a, b) => {
        const aV = estaVencida(a.data_vencimento, a.status)
        const bV = estaVencida(b.data_vencimento, b.status)

        if (aV && !bV) return -1
        if (!aV && bV) return 1
        if (a.status !== 'pago' && b.status === 'pago') return -1
        if (a.status === 'pago' && b.status !== 'pago') return 1

        return new Date(a.data_vencimento) - new Date(b.data_vencimento)
      })
  }

  function resumo() {
    let total = 0, pago = 0, vencido = 0

    contas.forEach((c) => {
      const v = Number(c.valor || 0)
      total += v

      if (c.status === 'pago') pago += v
      else if (estaVencida(c.data_vencimento, c.status)) vencido += v
    })

    return {
      total,
      pago,
      pendente: total - pago,
      vencido
    }
  }

  const lista = filtrar()
  const r = resumo()

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1>Contas a Pagar</h1>

      {/* RESUMO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card label="Total" valor={r.total} />
        <Card label="Pago" valor={r.pago} cor="#d4edda" />
        <Card label="Pendente" valor={r.pendente} cor="#fff3cd" />
        <Card label="Vencido" valor={r.vencido} cor="#f8d7da" />
      </div>

      {/* BUSCA */}
      <input
        placeholder="Buscar..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', padding: 10, marginTop: 15 }}
      />

      {/* FILTROS */}
      <div style={{ marginTop: 10 }}>
        {['todas', 'pendentes', 'pagas', 'vencidas'].map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{ marginRight: 6 }}>
            {f}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {lista.map((c) => {
        const vencida = estaVencida(c.data_vencimento, c.status)

        return (
          <div key={c.id} style={{
            padding: 12,
            marginTop: 10,
            border: '1px solid #ccc',
            background:
              c.status === 'pago'
                ? '#d4edda'
                : vencida
                ? '#f8d7da'
                : '#fff3cd'
          }}>
            <b>{c.descricao}</b>
            <p>R$ {Number(c.valor).toFixed(2)}</p>
            <p>{c.data_vencimento}</p>
            <p>{c.df_centros_custo?.nome || '-'}</p>

            <button onClick={() => togglePago(c)}>Pago</button>
            <button onClick={() => abrirEdicao(c)}>Editar</button>
            <button onClick={() => excluirConta(c.id)}>Excluir</button>
          </div>
        )
      })}

      {/* BOTÃO + */}
      <button onClick={abrirNovaConta} style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        fontSize: 30
      }}>
        +
      </button>

      {/* MODAL */}
      {modalAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ background: '#fff', padding: 20, width: '90%', maxWidth: 400 }}>
            <h2>{editandoId ? 'Editar' : 'Nova'} Conta</h2>

            <input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            <input type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

            <select value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
              <option value="">Centro de custo</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <button onClick={salvarConta}>Salvar</button>
            <button onClick={fecharModal}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ label, valor, cor }) {
  return (
    <div style={{
      background: cor || '#fff',
      padding: 10,
      borderRadius: 10,
      border: '1px solid #ddd'
    }}>
      <small>{label}</small>
      <strong>R$ {valor.toFixed(2)}</strong>
    </div>
  )
}
