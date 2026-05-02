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
      .order('nome', { ascending: true })

    setCentros(data || [])
  }

  async function buscarContas() {
    setLoading(true)

    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')

    if (error) {
      alert('Erro ao buscar contas: ' + error.message)
    } else {
      setContas(data || [])
    }

    setLoading(false)
  }

  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function abrirNovaConta() {
    limparFormulario()
    setModalAberto(true)
  }

  function abrirEdicao(conta) {
    setEditandoId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setDataVencimento(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalAberto(true)
  }

  function fecharModal() {
    limparFormulario()
    setModalAberto(false)
  }

  function limparFormulario() {
    setEditandoId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
  }

  async function salvarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha descrição, valor e vencimento')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: Number(valor),
      data_vencimento: dataVencimento,
      centro_custo_id: centroCustoId || null
    }

    if (editandoId) {
      const { error } = await supabase
        .from('df_contas')
        .update(payload)
        .eq('id', editandoId)

      if (error) {
        alert('Erro ao editar conta: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase.from('df_contas').insert([
        {
          ...payload,
          status: 'pendente'
        }
      ])

      if (error) {
        alert('Erro ao salvar conta: ' + error.message)
        return
      }
    }

    fecharModal()
    buscarContas()
  }

  async function marcarComoPago(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) {
      alert('Erro ao marcar como pago: ' + error.message)
      return
    }

    buscarContas()
  }

  async function voltarParaPendente(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({ status: 'pendente' })
      .eq('id', id)

    if (error) {
      alert('Erro ao voltar para pendente: ' + error.message)
      return
    }

    buscarContas()
  }

  async function excluirConta(id) {
    const confirmar = confirm('Deseja excluir esta conta?')
    if (!confirmar) return

    const { error } = await supabase
      .from('df_contas')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir conta: ' + error.message)
      return
    }

    buscarContas()
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '—'
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
      .filter((conta) => {
        if (filtro === 'pendentes') return conta.status !== 'pago'
        if (filtro === 'pagas') return conta.status === 'pago'
        if (filtro === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
        return true
      })
      .filter((conta) =>
        String(conta.descricao || '').toLowerCase().includes(busca.toLowerCase())
      )
  )

  const total = contas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPago = contas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPendente = total - totalPago

  const totalVencido = contas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>📊 Contas a Pagar</h1>

        <div style={styles.resumoGrid}>
          <div style={styles.resumoCard}>
            <span style={styles.resumoLabel}>Total</span>
            <strong>{formatarValor(total)}</strong>
          </div>

          <div style={styles.resumoCardPago}>
            <span style={styles.resumoLabel}>Pago</span>
            <strong>{formatarValor(totalPago)}</strong>
          </div>

          <div style={styles.resumoCardPendente}>
            <span style={styles.resumoLabel}>Pendente</span>
            <strong>{formatarValor(totalPendente)}</strong>
          </div>

          <div style={styles.resumoCardVencido}>
            <span style={styles.resumoLabel}>Vencido</span>
            <strong>{formatarValor(totalVencido)}</strong>
          </div>
        </div>

        <input
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={styles.inputBusca}
        />

        <div style={styles.filtros}>
          <button style={filtro === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('todas')}>Todas</button>
          <button style={filtro === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pendentes')}>Pendentes</button>
          <button style={filtro === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('pagas')}>Pagas</button>
          <button style={filtro === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltro('vencidas')}>Vencidas</button>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && contasFiltradas.length === 0 && (
          <p style={styles.vazio}>Nenhuma conta encontrada.</p>
        )}

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div
              key={conta.id}
              style={{
                ...styles.cardConta,
                backgroundColor:
                  conta.status === 'pago'
                    ? '#d4edda'
                    : vencida
                    ? '#ff4d4d'
                    : '#f8d7da',
                color: vencida ? '#fff' : '#111'
              }}
            >
              <div style={styles.cardTopo}>
                <h3 style={styles.cardTitulo}>{conta.descricao}</h3>
                <span style={styles.valor}>{formatarValor(conta.valor)}</span>
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
                  <button onClick={() => marcarComoPago(conta.id)} style={styles.botaoPago}>
                    Marcar como pago
                  </button>
                )}

                {conta.status === 'pago' && (
                  <button onClick={() => voltarParaPendente(conta.id)} style={styles.botaoPendente}>
                    Voltar para pendente
                  </button>
                )}

                <button onClick={() => abrirEdicao(conta)} style={styles.botaoEditar}>
                  Editar
                </button>

                <button onClick={() => excluirConta(conta.id)} style={styles.botaoExcluir}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={abrirNovaConta} style={styles.botaoFlutuante}>
        +
      </button>

      {modalAberto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.subTitle}>
              {editandoId ? '✏️ Editar Conta' : '➕ Nova Conta'}
            </h2>

            <input
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))}
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={styles.input}
            />

            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              style={styles.input}
            />

            <select
              value={centroCustoId}
              onChange={(e) => setCentroCustoId(e.target.value)}
              style={styles.input}
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
    minHeight: '100vh',
    background: '#f4f6f8',
    padding: 16,
    paddingBottom: 90
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    fontSize: 34,
    marginBottom: 20
  },
  subTitle: {
    marginTop: 0,
    marginBottom: 16
  },
  resumoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20
  },
  resumoCard: {
    background: '#fff',
    padding: 14,
    borderRadius: 12,
    border: '1px solid #ddd'
  },
  resumoCardPago: {
    background: '#d4edda',
    padding: 14,
    borderRadius: 12,
    border: '1px solid #b8dfc2'
  },
  resumoCardPendente: {
    background: '#fff3cd',
    padding: 14,
    borderRadius: 12,
    border: '1px solid #ffe08a'
  },
  resumoCardVencido: {
    background: '#f8d7da',
    padding: 14,
    borderRadius: 12,
    border: '1px solid #f1b0b7'
  },
  resumoLabel: {
    display: 'block',
    fontSize: 13,
    marginBottom: 6,
    color: '#555'
  },
  inputBusca: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 15,
    fontSize: 16,
    boxSizing: 'border-box'
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  filtro: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #bbb',
    background: '#fff',
    cursor: 'pointer'
  },
  filtroAtivo: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #007bff',
    background: '#007bff',
    color: '#fff',
    cursor: 'pointer'
  },
  vazio: {
    background: '#fff',
    padding: 16,
    borderRadius: 12,
    border: '1px solid #ddd'
  },
  cardConta: {
    border: '1px solid #ccc',
    padding: 16,
    marginBottom: 15,
    borderRadius: 14
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  cardTitulo: {
    margin: 0,
    fontSize: 22
  },
  valor: {
    fontWeight: 'bold',
    fontSize: 18
  },
  acoes: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 12
  },
  botaoPago: {
    padding: '9px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#007bff',
    color: '#fff',
    cursor: 'pointer'
  },
  botaoPendente: {
    padding: '9px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#6f42c1',
    color: '#fff',
    cursor: 'pointer'
  },
  botaoEditar: {
    padding: '9px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#ffc107',
    color: '#111',
    cursor: 'pointer'
  },
  botaoExcluir: {
    padding: '9px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#dc3545',
    color: '#fff',
    cursor: 'pointer'
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
  input: {
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
