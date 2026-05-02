import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  const [novoCentro, setNovoCentro] = useState('')

  useEffect(() => {
    buscarCentros()
    buscarContas()
  }, [])

  async function buscarCentros() {
    const { data, error } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    if (error) {
      alert(error.message)
      return
    }

    setCentros(data || [])
  }

  async function buscarContas() {
    setLoading(true)

    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

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

  function converterValor(valorDigitado) {
    return Number(String(valorDigitado).replace(',', '.'))
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
    setDescricao(c.descricao || '')
    setValor(c.valor || '')
    setData(c.data_vencimento || '')
    setCentroCustoId(c.centro_custo_id || '')
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

    const valorConvertido = converterValor(valor)

    if (isNaN(valorConvertido)) {
      alert('Digite um valor válido')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: valorConvertido,
      data_vencimento: data,
      centro_custo_id: centroCustoId || null
    }

    let error

    if (editandoId) {
      const resposta = await supabase
        .from('df_contas')
        .update(payload)
        .eq('id', editandoId)

      error = resposta.error
    } else {
      const resposta = await supabase
        .from('df_contas')
        .insert([{ ...payload, status: 'pendente' }])

      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharModal()
    buscarContas()
  }

  async function salvarCentro() {
    if (!novoCentro.trim()) {
      alert('Digite o nome do centro de custo')
      return
    }

    const { error } = await supabase
      .from('df_centros_custo')
      .insert([{ nome: primeiraLetraMaiuscula(novoCentro.trim()) }])

    if (error) {
      alert(error.message)
      return
    }

    setNovoCentro('')
    buscarCentros()
  }

  async function excluirCentro(id) {
    if (!confirm('Deseja excluir este centro de custo?')) return

    const { error } = await supabase
      .from('df_centros_custo')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Não foi possível excluir. Verifique se existem contas usando este centro.')
      return
    }

    buscarCentros()
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

  const contasFiltradas = contas
    .filter(c => {
      if (filtro === 'pendentes') return c.status !== 'pago'
      if (filtro === 'pagas') return c.status === 'pago'
      if (filtro === 'vencidas') return estaVencida(c.data_vencimento, c.status)
      return true
    })
    .filter(c => {
      if (!centroFiltro) return true
      return c.centro_custo_id === centroFiltro
    })
    .filter(c =>
      c.descricao?.toLowerCase().includes(busca.toLowerCase())
    )

  const total = contas.reduce((a, c) => a + Number(c.valor || 0), 0)
  const pago = contas.filter(c => c.status === 'pago').reduce((a, c) => a + Number(c.valor || 0), 0)
  const pendente = total - pago
  const vencido = contas.filter(c => estaVencida(c.data_vencimento, c.status))
    .reduce((a, c) => a + Number(c.valor || 0), 0)

  return (
    <div style={styles.page}>
      <h1 style={styles.titulo}>📊 Contas a Pagar</h1>

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
        <button style={filtro === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('todas')}>todas</button>
        <button style={filtro === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pendentes')}>pendentes</button>
        <button style={filtro === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pagas')}>pagas</button>
        <button style={filtro === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('vencidas')}>vencidas</button>
      </div>

      <div style={styles.linhaFiltroCentro}>
        <select
          value={centroFiltro}
          onChange={(e) => setCentroFiltro(e.target.value)}
          style={styles.selectCentro}
        >
          <option value="">Todos os centros</option>
          {centros.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <button style={styles.btnConfig} onClick={() => setModalConfig(true)}>
          ⚙️ Centros
        </button>
      </div>

      {loading && <p>Carregando...</p>}

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

            <div style={styles.small}>
              {formatarData(c.data_vencimento)} • {c.df_centros_custo?.nome || '-'}
            </div>

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
            <h3>{editandoId ? 'Editar Conta' : 'Nova Conta'}</h3>

            <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={e => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
            <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={e => setValor(e.target.value)} />
            <input style={styles.inputModal} type="date" value={data} onChange={e => setData(e.target.value)} />

            <select style={styles.inputModal} value={centroCustoId} onChange={e => setCentroCustoId(e.target.value)}>
              <option value="">Centro de custo</option>
              {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharModal}>Cancelar</button>
          </div>
        </div>
      )}

      {modalConfig && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>⚙️ Centros de Custo</h3>

            <input
              style={styles.inputModal}
              placeholder="Ex: Loja Catanduva"
              value={novoCentro}
              onChange={(e) => setNovoCentro(primeiraLetraMaiuscula(e.target.value))}
            />

            <button style={styles.btnSalvar} onClick={salvarCentro}>
              Cadastrar centro
            </button>

            <div style={styles.listaCentros}>
              {centros.map(c => (
                <div key={c.id} style={styles.itemCentro}>
                  <span>{c.nome}</span>
                  <button style={styles.btnMiniExcluir} onClick={() => excluirCentro(c.id)}>
                    excluir
                  </button>
                </div>
              ))}
            </div>

            <button style={styles.btnCancelar} onClick={() => setModalConfig(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    padding: 16,
    maxWidth: 700,
    margin: 'auto',
    fontFamily: 'Arial',
    paddingBottom: 90
  },

  titulo: {
    fontSize: 26,
    marginBottom: 10
  },

  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 10
  },

  box: { padding: 8, background: '#eee', borderRadius: 10, fontSize: 13 },
  boxPago: { padding: 8, background: '#c3e6cb', borderRadius: 10, fontSize: 13 },
  boxPend: { padding: 8, background: '#ffeeba', borderRadius: 10, fontSize: 13 },
  boxVen: { padding: 8, background: '#f5c6cb', borderRadius: 10, fontSize: 13 },

  input: {
    width: '100%',
    padding: 8,
    marginBottom: 8,
    boxSizing: 'border-box'
  },

  filtros: {
    display: 'flex',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap'
  },

  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '6px 10px',
    borderRadius: 6
  },

  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 6
  },

  linhaFiltroCentro: {
    display: 'flex',
    gap: 6,
    marginBottom: 10
  },

  selectCentro: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: '1px solid #ccc'
  },

  btnConfig: {
    background: '#212529',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 10px'
  },

  card: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 15
  },

  small: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2
  },

  acoes: {
    marginTop: 6,
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap'
  },

  btnAzul: { background: '#0d6efd', color: '#fff', border: 'none', padding: '5px 8px', fontSize: 12, borderRadius: 6 },
  btnRoxo: { background: '#6f42c1', color: '#fff', border: 'none', padding: '5px 8px', fontSize: 12, borderRadius: 6 },
  btnAmarelo: { background: '#ffc107', border: 'none', padding: '5px 8px', fontSize: 12, borderRadius: 6 },
  btnVermelho: { background: '#dc3545', color: '#fff', border: 'none', padding: '5px 8px', fontSize: 12, borderRadius: 6 },

  fab: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#198754',
    color: '#fff',
    fontSize: 28,
    border: 'none',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999
  },

  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    maxWidth: 340
  },

  inputModal: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    boxSizing: 'border-box',
    borderRadius: 8,
    border: '1px solid #ccc'
  },

  btnSalvar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#198754',
    color: '#fff',
    marginBottom: 8
  },

  btnCancelar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#6c757d',
    color: '#fff'
  },

  listaCentros: {
    marginTop: 10,
    marginBottom: 10,
    maxHeight: 220,
    overflowY: 'auto'
  },

  itemCentro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f1f1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13
  },

  btnMiniExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 7px',
    fontSize: 11
  }
                              }
