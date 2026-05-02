import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {

  // =========================
  // 🔹 BLOCO 1 — CONTAS
  // =========================
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  // =========================
  // 🔹 BLOCO 2 — NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [modalNota, setModalNota] = useState(false)

  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')
  const [buscaNota, setBuscaNota] = useState('')

  // =========================
  // 🔹 BLOCO 4 — CENTROS
  // =========================
  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // 🔹 BLOCO 5 — MENU
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    await Promise.all([
      buscarContas(),
      buscarNotas(),
      buscarCentros()
    ])
    setLoading(false)
  }

  // =========================
  // 🔧 UTIL
  // =========================
  function formatarValor(v) {
    return Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(d) {
    if (!d) return '-'
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    return new Date(data) < new Date()
  }

  function converterValor(v) {
    return Number(String(v).replace(',', '.'))
  }

  // =========================
  // 💰 CONTAS
  // =========================
  async function buscarContas() {
    const { data } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
    setContas(data || [])
  }

  function abrirConta(conta = null) {
    if (conta) {
      setEditandoId(conta.id)
      setDescricao(conta.descricao)
      setValor(conta.valor)
      setData(conta.data_vencimento)
      setCentroCustoId(conta.centro_custo_id)
    } else {
      setEditandoId(null)
      setDescricao('')
      setValor('')
      setData('')
      setCentroCustoId('')
    }
    setModalConta(true)
    setMenuAberto(false)
  }

  async function salvarConta() {
    const payload = {
      descricao,
      valor: converterValor(valor),
      data_vencimento: data,
      centro_custo_id: centroCustoId || null
    }

    if (editandoId) {
      await supabase.from('df_contas').update(payload).eq('id', editandoId)
    } else {
      await supabase.from('df_contas').insert([{ ...payload, status: 'pendente' }])
    }

    setModalConta(false)
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
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  // =========================
  // 📝 NOTAS
  // =========================
  async function buscarNotas() {
    const { data } = await supabase
      .from('df_notas')
      .select('*')
      .order('created_at', { ascending: false })

    setNotas(data || [])
  }

  async function salvarNota() {
    await supabase.from('df_notas').insert([
      { titulo: tituloNota, conteudo: conteudoNota }
    ])

    setTituloNota('')
    setConteudoNota('')
    setModalNota(false)
    buscarNotas()
  }

  async function excluirNota(id) {
    await supabase.from('df_notas').delete().eq('id', id)
    buscarNotas()
  }

  const notasFiltradas = notas.filter(n =>
    `${n.titulo} ${n.conteudo}`.toLowerCase().includes(buscaNota.toLowerCase())
  )

  // =========================
  // 🏷 CENTROS
  // =========================
  async function buscarCentros() {
    const { data } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    setCentros(data || [])
  }

  async function salvarCentro() {
    await supabase.from('df_centros_custo').insert([{ nome: novoCentro }])
    setNovoCentro('')
    buscarCentros()
  }

  async function excluirCentro(id) {
    await supabase.from('df_centros_custo').delete().eq('id', id)
    buscarCentros()
  }

  // =========================
  // 📊 BLOCO 3 — DASHBOARD
  // =========================
  const resumoPorCentro = centros.map(c => {
    const lista = contas.filter(x => x.centro_custo_id === c.id)

    const total = lista.reduce((a, b) => a + Number(b.valor || 0), 0)
    const pago = lista.filter(x => x.status === 'pago').reduce((a, b) => a + Number(b.valor || 0), 0)
    const vencido = lista.filter(x => estaVencida(x.data_vencimento, x.status)).reduce((a, b) => a + Number(b.valor || 0), 0)

    return {
      nome: c.nome,
      total,
      pago,
      pendente: total - pago,
      vencido
    }
  })

  // =========================
  // 🎯 FILTRO CONTAS
  // =========================
  const contasFiltradas = contas
    .filter(c => !centroFiltro || c.centro_custo_id === centroFiltro)
    .filter(c => {
      if (filtro === 'pendentes') return c.status !== 'pago'
      if (filtro === 'pagas') return c.status === 'pago'
      if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
      return true
    })
    .filter(c => c.descricao?.toLowerCase().includes(busca.toLowerCase()))

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div style={{ padding: 20, paddingBottom: 120 }}>

      {/* DASHBOARD */}
      <h2>📊 Dashboard por Centro</h2>
      {resumoPorCentro.map((c, i) => (
        <div key={i} style={{ background: '#eee', padding: 8, marginBottom: 5 }}>
          <b>{c.nome}</b> — {formatarValor(c.total)}
        </div>
      ))}

      {/* CONTAS */}
      <h1>💰 Contas</h1>

      <input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />

      <select onChange={e => setCentroFiltro(e.target.value)}>
        <option value="">Todos centros</option>
        {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>

      {contasFiltradas.map(c => {
        const vencida = estaVencida(c.data_vencimento, c.status)

        return (
          <div key={c.id} style={{
            background: c.status === 'pago' ? '#d4edda' : vencida ? '#ffb3b3' : '#fff3cd',
            padding: 10,
            marginTop: 6
          }}>
            <b>{c.descricao}</b> — {formatarValor(c.valor)}
            <br />
            {formatarData(c.data_vencimento)} • {c.df_centros_custo?.nome}

            <br />
            <button onClick={() => marcarComoPago(c.id)}>Pago</button>
            <button onClick={() => voltarParaPendente(c.id)}>Voltar</button>
            <button onClick={() => abrirConta(c)}>Editar</button>
            <button onClick={() => excluirConta(c.id)}>Excluir</button>
          </div>
        )
      })}

      {/* NOTAS */}
      <h2>📝 Notas</h2>

      <input placeholder="Buscar nota..." value={buscaNota} onChange={e => setBuscaNota(e.target.value)} />

      {notasFiltradas.map(n => (
        <div key={n.id} style={{ background: '#eef', padding: 8, marginTop: 5 }}>
          <b>{n.titulo}</b>
          <p>{n.conteudo}</p>
          <button onClick={() => excluirNota(n.id)}>Excluir</button>
        </div>
      ))}

      {/* MENU */}
      <button onClick={() => setMenuAberto(!menuAberto)} style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60
      }}>
        +
      </button>

      {menuAberto && (
        <div style={{ position: 'fixed', bottom: 90, right: 20 }}>
          <button onClick={() => abrirConta()}>Nova Conta</button>
          <button onClick={() => setModalNota(true)}>Nova Nota</button>
          <button onClick={() => setModalCentro(true)}>Centro</button>
        </div>
      )}

      {/* MODAL CONTA */}
      {modalConta && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008' }}>
          <div style={{ background: '#fff', padding: 20 }}>
            <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
            <input type="date" value={data} onChange={e => setData(e.target.value)} />

            <select onChange={e => setCentroCustoId(e.target.value)}>
              <option value="">Centro</option>
              {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <button onClick={salvarConta}>Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL NOTA */}
      {modalNota && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008' }}>
          <div style={{ background: '#fff', padding: 20 }}>
            <input placeholder="Título" value={tituloNota} onChange={e => setTituloNota(e.target.value)} />
            <textarea placeholder="Conteúdo" value={conteudoNota} onChange={e => setConteudoNota(e.target.value)} />
            <button onClick={salvarNota}>Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL CENTRO */}
      {modalCentro && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008' }}>
          <div style={{ background: '#fff', padding: 20 }}>
            <input placeholder="Centro" value={novoCentro} onChange={e => setNovoCentro(e.target.value)} />
            <button onClick={salvarCentro}>Salvar</button>

            {centros.map(c => (
              <div key={c.id}>
                {c.nome}
                <button onClick={() => excluirCentro(c.id)}>Excluir</button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
      }
