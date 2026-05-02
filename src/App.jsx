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
    buscarContas()
    buscarCentros()
  }, [])

  async function buscarCentros() {
    const { data } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome', { ascending: true })

    setCentros(data || [])
  }

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

  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function estaVencida(data, status) {
    if (!data || status === 'pago') return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)

    return vencimento < hoje
  }

  function abrirNovaConta() {
    setEditandoId(null)
    setDescricao('')
    setValor('')
    setData('')
    setCentroCustoId('')
    setModalAberto(true)
  }

  function abrirEdicao(conta) {
    setEditandoId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setData(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setDescricao('')
    setValor('')
    setData('')
    setCentroCustoId('')
  }

  async function salvarConta() {
    if (!descricao || !valor || !data) {
      alert('Preencha descrição, valor e vencimento')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: Number(valor),
      data_vencimento: data,
      centro_custo_id: centroCustoId || null
    }

    if (editandoId) {
      await supabase
        .from('df_contas')
        .update(payload)
        .eq('id', editandoId)
    } else {
      await supabase
        .from('df_contas')
        .insert([{ ...payload, status: 'pendente' }])
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
    if (!confirm('Deseja excluir?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
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
      <h1 style={styles.titulo}>📊 Contas a Pagar</h1>

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

              <button onClick={() => abrirEdicao(conta)}>
                Editar
              </button>

              <button onClick={() => excluirConta(conta.id)}>
                Excluir
              </button>
            </div>
          </div>
        )
      })}

      <button onClick={abrirNovaConta} style={styles.botaoFlutuante}>
        +
      </button>

      {modalAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitulo}>
              {editandoId ? '✏️ Editar Conta' : '➕ Nova Conta'}
            </h2>

            <input
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))}
              style={styles.inputModal}
            />

            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={styles.inputModal}
            />

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={styles.inputModal}
            />

            <select
              value={centroCustoId}
              onChange={(e) => setCentroCustoId(e.target.value)}
              style={styles.inputModal}
            >
              <option value="">Centro de custo</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nome}
                </option>
              ))}
            </select>

            <button onClick={salvarConta} style={styles.botaoSalvar}>
              {editandoId ? 'Salvar Alteração' : 'Salvar Conta'}
            </button>

            <button onClick={fecharModal} style={styles.botaoCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    padding: 20,
    paddingBottom: 90,
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
  botaoFlutuante: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 62,
    height: 62,
    borderRadius: '50%',
    border: 'none',
    background: '#198754',
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
  },
  modalTitulo: {
    marginTop: 0,
    marginBottom: 16
  },
  inputModal: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 10,
    fontSize: 16,
    boxSizing: 'border-box'
  },
  botaoSalvar: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#198754',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    marginBottom: 10
  },
  botaoCancelar: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#6c757d',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer'
  }
}
