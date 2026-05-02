import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  // =========================
  // BLOCO 1 — CONTAS
  // =========================
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  // =========================
  // BLOCO 2 — NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')

  // =========================
  // BLOCO 4 — CENTROS
  // =========================
  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 5 — MENU
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    buscarContas()
    buscarNotas()
    buscarCentros()
  }

  // =========================
  // BLOCO 0 — UTIL
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

  function converterValor(v) {
    return Number(String(v).replace(',', '.'))
  }

  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function estaVencida(d, status) {
    if (!d || status === 'pago') return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const vencimento = new Date(d + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)

    return vencimento < hoje
  }

  // =========================
  // BLOCO 1 — FUNÇÕES CONTAS
  // =========================
  async function buscarContas() {
    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

    if (error) {
      alert(error.message)
      return
    }

    setContas(data || [])
  }

  function abrirConta(conta = null) {
    if (conta) {
      setEditandoContaId(conta.id)
      setDescricao(conta.descricao || '')
      setValor(conta.valor || '')
      setData(conta.data_vencimento || '')
      setCentroCustoId(conta.centro_custo_id || '')
    } else {
      setEditandoContaId(null)
      setDescricao('')
      setValor('')
      setData('')
      setCentroCustoId('')
    }

    setModalConta(true)
    setMenuAberto(false)
  }

  function fecharConta() {
    setModalConta(false)
    setEditandoContaId(null)
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
      valor: converterValor(valor),
      data_vencimento: data,
      centro_custo_id: centroCustoId || null
    }

    if (editandoContaId) {
      await supabase.from('df_contas').update(payload).eq('id', editandoContaId)
    } else {
      await supabase.from('df_contas').insert([{ ...payload, status: 'pendente' }])
    }

    fecharConta()
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
    if (!confirm('Excluir conta?')) return
    await supabase.from('df_contas').delete().eq('id', id)
    buscarContas()
  }

  const contasFiltradas = contas.filter((c) =>
    String(c.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  // =========================
  // BLOCO 2 — FUNÇÕES NOTAS
  // =========================
  async function buscarNotas() {
    const { data, error } = await supabase
      .from('df_notas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setNotas(data || [])
  }

  function abrirNota(nota = null) {
    if (nota) {
      setEditandoNotaId(nota.id)
      setTituloNota(nota.titulo || '')
      setConteudoNota(nota.conteudo || '')
    } else {
      setEditandoNotaId(null)
      setTituloNota('')
      setConteudoNota('')
    }

    setModalNota(true)
    setMenuAberto(false)
  }

  function fecharNota() {
    setModalNota(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
  }

  async function salvarNota() {
    if (!tituloNota.trim()) {
      alert('Digite o título da nota')
      return
    }

    const payload = {
      titulo: primeiraLetraMaiuscula(tituloNota.trim()),
      conteudo: conteudoNota.trim()
    }

    if (editandoNotaId) {
      await supabase.from('df_notas').update(payload).eq('id', editandoNotaId)
    } else {
      await supabase.from('df_notas').insert([payload])
    }

    fecharNota()
    buscarNotas()
  }

  async function excluirNota(id) {
    if (!confirm('Excluir nota?')) return
    await supabase.from('df_notas').delete().eq('id', id)
    buscarNotas()
  }

  // =========================
  // BLOCO 4 — FUNÇÕES CENTROS
  // =========================
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

  async function salvarCentro() {
    if (!novoCentro.trim()) {
      alert('Digite o centro de custo')
      return
    }

    await supabase
      .from('df_centros_custo')
      .insert([{ nome: primeiraLetraMaiuscula(novoCentro.trim()) }])

    setNovoCentro('')
    buscarCentros()
  }

  async function excluirCentro(id) {
    if (!confirm('Excluir centro?')) return
    await supabase.from('df_centros_custo').delete().eq('id', id)
    buscarCentros()
  }

  return (
    <div style={styles.page}>
      {/* ========================= */}
      {/* BLOCO 1 — CONTAS */}
      {/* ========================= */}
      <section>
        <h1 style={styles.titulo}>📊 Contas</h1>

        <input
          style={styles.input}
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {contasFiltradas.map((c) => {
          const vencida = estaVencida(c.data_vencimento, c.status)

          return (
            <div
              key={c.id}
              style={{
                ...styles.cardConta,
                background:
                  c.status === 'pago'
                    ? '#d4edda'
                    : vencida
                      ? '#ffb3b3'
                      : '#fff3cd'
              }}
            >
              <div style={styles.cardTopo}>
                <strong>{c.descricao}</strong>
                <span>{formatarValor(c.valor)}</span>
              </div>

              <div style={styles.cardInfo}>
                {formatarData(c.data_vencimento)} • {c.df_centros_custo?.nome || '-'}
              </div>

              <div style={styles.acoes}>
                {c.status !== 'pago' ? (
                  <button style={styles.btnPago} onClick={() => marcarComoPago(c.id)}>
                    Pago
                  </button>
                ) : (
                  <button style={styles.btnVoltar} onClick={() => voltarParaPendente(c.id)}>
                    Voltar
                  </button>
                )}

                <button style={styles.btnEditar} onClick={() => abrirConta(c)}>
                  Editar
                </button>

                <button style={styles.btnExcluir} onClick={() => excluirConta(c.id)}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {/* ========================= */}
      {/* BLOCO 2 — NOTAS */}
      {/* ========================= */}
      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📝 Notas</h2>

        {notas.map((n) => (
          <div key={n.id} style={styles.cardNota}>
            <strong>{n.titulo}</strong>

            {n.conteudo && <p style={styles.textoNota}>{n.conteudo}</p>}

            <div style={styles.acoes}>
              <button style={styles.btnEditar} onClick={() => abrirNota(n)}>
                Editar
              </button>

              <button style={styles.btnExcluir} onClick={() => excluirNota(n.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ========================= */}
      {/* BLOCO 5 — MENU FLUTUANTE */}
      {/* ========================= */}
      {menuAberto && (
        <div style={styles.menuFab}>
          <button style={styles.menuItem} onClick={() => abrirConta()}>
            💰 Conta
          </button>

          <button style={styles.menuItem} onClick={() => abrirNota()}>
            📝 Nota
          </button>

          <button style={styles.menuItem} onClick={() => setModalCentro(true)}>
            🏷 Centro
          </button>
        </div>
      )}

      <button style={styles.fab} onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '×' : '+'}
      </button>

      {/* ========================= */}
      {/* BLOCO 6 — MODAL CONTA */}
      {/* ========================= */}
      {modalConta && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

            <input
              style={styles.inputModal}
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))}
            />

            <input
              style={styles.inputModal}
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />

            <input
              style={styles.inputModal}
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <select
              style={styles.inputModal}
              value={centroCustoId}
              onChange={(e) => setCentroCustoId(e.target.value)}
            >
              <option value="">Centro de custo</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <button style={styles.btnSalvar} onClick={salvarConta}>
              Salvar
            </button>

            <button style={styles.btnCancelar} onClick={fecharConta}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* BLOCO 6 — MODAL NOTA */}
      {/* ========================= */}
      {modalNota && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>

            <input
              style={styles.inputModal}
              placeholder="Título"
              value={tituloNota}
              onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))}
            />

            <textarea
              style={styles.textareaModal}
              placeholder="Conteúdo..."
              value={conteudoNota}
              onChange={(e) => setConteudoNota(e.target.value)}
            />

            <button style={styles.btnSalvar} onClick={salvarNota}>
              Salvar
            </button>

            <button style={styles.btnCancelar} onClick={fecharNota}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* BLOCO 6 — MODAL CENTRO */}
      {/* ========================= */}
      {modalCentro && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Centros de Custo</h3>

            <input
              style={styles.inputModal}
              placeholder="Novo centro"
              value={novoCentro}
              onChange={(e) => setNovoCentro(primeiraLetraMaiuscula(e.target.value))}
            />

            <button style={styles.btnSalvar} onClick={salvarCentro}>
              Salvar Centro
            </button>

            {centros.map((c) => (
              <div key={c.id} style={styles.itemCentro}>
                <span>{c.nome}</span>
                <button style={styles.btnMiniExcluir} onClick={() => excluirCentro(c.id)}>
                  excluir
                </button>
              </div>
            ))}

            <button style={styles.btnCancelar} onClick={() => setModalCentro(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =========================
// BLOCO 7 — STYLES
// =========================
const styles = {
  page: {
    padding: 16,
    maxWidth: 700,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: 100
  },

  titulo: {
    fontSize: 30,
    marginBottom: 12
  },

  subtitulo: {
    fontSize: 24,
    marginBottom: 12
  },

  bloco: {
    marginTop: 28
  },

  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 10,
    boxSizing: 'border-box'
  },

  cardConta: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },

  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 18,
    marginBottom: 4
  },

  cardInfo: {
    fontSize: 13,
    opacity: 0.75
  },

  acoes: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 10
  },

  btnPago: {
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12
  },

  btnVoltar: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12
  },

  btnEditar: {
    background: '#ffc107',
    color: '#111',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12
  },

  btnExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12
  },

  cardNota: {
    background: '#eef2ff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },

  textoNota: {
    fontSize: 14,
    marginTop: 8,
    whiteSpace: 'pre-wrap'
  },

  fab: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: '#198754',
    color: '#fff',
    border: 'none',
    fontSize: 30,
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
    zIndex: 20
  },

  menuFab: {
    position: 'fixed',
    right: 20,
    bottom: 86,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 19
  },

  menuItem: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'left'
  },

  overlay: {
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
    background: '#fff',
    padding: 18,
    borderRadius: 14,
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 8px 28px rgba(0,0,0,0.25)'
  },

  inputModal: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },

  textareaModal: {
    width: '100%',
    minHeight: 110,
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontFamily: 'Arial'
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
