import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')

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
    const { data } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')

    setContas(data || [])
  }

  function formatarValor(v) {
    return Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    return new Date(data) < new Date()
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
    setCentroCustoId(c.centro_custo_id || '')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
  }

  async function salvarConta() {
    const payload = {
      descricao,
      valor: Number(String(valor).replace(',', '.')),
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

  async function marcarPago(id) {
    await supabase.from('df_contas').update({ status: 'pago' }).eq('id', id)
    buscarContas()
  }

  async function voltar(id) {
    await supabase.from('df_contas').update({ status: 'pendente' }).eq('id', id)
    buscarContas()
  }

  async function excluir(id) {
    if (!confirm('Excluir?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  const lista = contas
    .filter(c => {
      if (filtro === 'pendentes') return c.status !== 'pago'
      if (filtro === 'pagas') return c.status === 'pago'
      if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
      return true
    })
    .filter(c => {
      if (!centroFiltro) return true
      return c.centro_custo_id === Number(centroFiltro)
    })
    .filter(c =>
      c.descricao.toLowerCase().includes(busca.toLowerCase())
    )

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Contas a Pagar</h1>

      <input
        placeholder="Buscar..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        {['todas', 'pendentes', 'pagas', 'vencidas'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              marginRight: 5,
              background: filtro === f ? '#0d6efd' : '#eee',
              color: filtro === f ? '#fff' : '#000'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <select
          value={centroFiltro}
          onChange={(e) => setCentroFiltro(e.target.value)}
        >
          <option value="">Todos centros</option>
          {centros.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {lista.map(c => {
        const vencida = estaVencida(c.data_vencimento, c.status)

        return (
          <div
            key={c.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              background:
                c.status === 'pago'
                  ? '#d4edda'
                  : vencida
                  ? '#ffb3b3'
                  : '#fff3cd'
            }}
          >
            <strong>{c.descricao}</strong> - {formatarValor(c.valor)}

            <div>
              {c.df_centros_custo?.nome || '-'}
            </div>

            <div style={{ marginTop: 6 }}>
              {c.status !== 'pago' && (
                <button style={{ background: '#0d6efd', color: '#fff' }} onClick={() => marcarPago(c.id)}>Pago</button>
              )}

              {c.status === 'pago' && (
                <button style={{ background: '#6f42c1', color: '#fff' }} onClick={() => voltar(c.id)}>Voltar</button>
              )}

              <button style={{ background: '#ffc107' }} onClick={() => abrirEdicao(c)}>Editar</button>
              <button style={{ background: '#dc3545', color: '#fff' }} onClick={() => excluir(c.id)}>Excluir</button>
            </div>
          </div>
        )
      })}

      <button
        onClick={abrirNovaConta}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: '#198754',
          color: '#fff',
          fontSize: 30
        }}
      >
        +
      </button>

      {modalAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
            <h2>{editandoId ? 'Editar' : 'Nova Conta'}</h2>

            <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
            <input type="date" value={data} onChange={e => setData(e.target.value)} />

            <select value={centroCustoId} onChange={e => setCentroCustoId(e.target.value)}>
              <option value="">Centro</option>
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
