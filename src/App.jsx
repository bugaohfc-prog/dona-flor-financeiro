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
      .select('id, nome')
      .order('nome', { ascending: true })

    setCentros(data || [])
  }

  async function buscarContas() {
    const { data } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(id, nome)')

    setContas(data || [])
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
      .filter((c) => {
        if (!centroFiltro) return true
        return c.centro_custo_id === centroFiltro
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
        <div style={styles.boxTotal}>
          <span>Total</span>
          <strong>{formatarValor(total)}</strong>
        </div>

        <div style={styles.boxPago}>
          <span>Pago</span>
          <strong>{formatarValor(pago)}</strong>
        </div>

        <div style={styles.boxPendente}>
          <span>Pendente</span>
          <strong>{formatarValor(pendente)}</strong>
        </div>

        <div style={styles.boxVencido}>
          <span>Vencido</span>
          <strong>{formatarValor(vencido)}</strong>
        </div>
      </div>

      <input
        placeholder="Buscar conta..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={styles.input}
      />

      <div style={styles.filtros}>
        <button style={filtro === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('todas')}>Todas</button>
        <button style={filtro === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pendentes')}>Pendentes</button>
        <button style={filtro === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pagas')}>Pagas</button>
        <button style={filtro === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('vencidas')}>Vencidas</button>
      </div>

      <select
        value={centroFiltro}
        onChange={(e) => setCentroFiltro(e.target.value)}
        style={styles.selectCentro}
      >
        <option value="">Todos os centros</option>
        {centros.map((centro) => (
          <option key={centro.id} value={centro.id}>
            {centro.nome}
          </option>
        ))}
      </select>

      {contasFiltradas.map((conta) => {
        const vencida = estaVencida(conta.data_vencimento, conta.status)

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
                  : '#f8d7da',
              color: vencida ? '#fff' : '#111'
            }}
          >
            <div style={styles.cardTopo}>
              <h2 style={styles.cardTitulo}>{conta.descricao}</h2>
              <strong style={styles.cardValor}>{formatarValor(conta.valor)}</strong>
            </div>

            <p><b>Vencimento:</b> {formatarData(conta.data_vencimento)}</p>
            <p><b>Centro:</b> {conta.df_centros_custo?.nome || '—'}</p>

            <p>
              <b>Status:</b>{' '}
              {conta.status === 'pago'
                ? 'pago'
                : vencida
                ? 'VENCIDO'
                : 'pendente'}
            </p>

            <div style={styles.acoes}>
              {conta.status !== 'pago' && (
                <button style={styles.btnPago} onClick={() => marcarComoPago(conta.id)}>
                  Marcar como pago
                </button>
              )}

              {conta.status === 'pago' && (
                <button style={styles.btnVoltar} onClick={() => voltarParaPendente(conta.id)}>
                  Voltar para pendente
                </button>
              )}

              <button style={styles.btnEditar} onClick={() => abrirEdicao(conta)}>
                Editar
              </button>

              <button style={styles.btnExcluir} onClick={() => excluirConta(conta.id)}>
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
              type="text"
              placeholder="Valor. Ex: 150,90"
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
    fontFamily: 'Arial, sans-serif',
    background: '#f4f6f8',
    minHeight: '100vh'
  },
  titulo: {
    fontSize: 34,
    marginBottom: 20
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20
  },
  boxTotal: {
    background: '#fff',
    padding: 14,
    borderRadius: 12
  },
  boxPago: {
    background: '#d4edda',
    padding: 14,
    borderRadius: 12
  },
  boxPendente: {
    background: '#fff3cd',
    padding: 14,
    borderRadius: 12
  },
  boxVencido: {
    background: '#f8d7da',
    padding: 14,
    borderRadius: 12
  },
  input: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 15,
    fontSize: 16,
    boxSizing: 'border-box'
  },
  filtros: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12
  },
  filtro: {
    padding: '10px 15px',
    borderRadius: 8,
    border: '1px solid #ccc',
    background: '#fff',
    fontSize: 15
  },
  filtroAtivo: {
    padding: '10px 15px',
    borderRadius: 8,
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    fontSize: 15
  },
  selectCentro: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 15,
    fontSize: 15
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  cardTitulo: {
    margin: 0,
    fontSize: 24
  },
  cardValor: {
    fontSize: 20
  },
  acoes: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 14
  },
  btnPago: {
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14
  },
  btnVoltar: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14
  },
  btnEditar: {
    background: '#ffc107',
    color: '#111',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14
  },
  btnExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14
  },
  botaoFlutuante: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: 'none',
    background: '#198754',
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
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
    padding: 20
  },
  modalTitulo: {
    marginTop: 0
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
    marginBottom: 10
  },
  botaoCancelar: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#6c757d',
    color: '#fff',
    fontSize: 16
  }
      }
