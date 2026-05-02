import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  // =========================
  // BLOCO 1 - CONTAS A PAGAR
  // =========================
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const [editandoContaId, setEditandoContaId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 2 - NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')
  const [buscaNota, setBuscaNota] = useState('')

  useEffect(() => {
    buscarCentros()
    buscarContas()
    buscarNotas()
  }, [])

  // =========================
  // FUNÇÕES GERAIS
  // =========================
  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
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

  // =========================
  // BLOCO 1 - FUNÇÕES CONTAS
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

  function abrirNovaConta() {
    setMenuAberto(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setData('')
    setCentroCustoId('')
    setModalConta(true)
  }

  function abrirEdicaoConta(conta) {
    setEditandoContaId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setData(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalConta(true)
  }

  function fecharModalConta() {
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

    if (editandoContaId) {
      const resposta = await supabase
        .from('df_contas')
        .update(payload)
        .eq('id', editandoContaId)

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

    fecharModalConta()
    buscarContas()
  }

  async function marcarComoPago(id) {
    await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    buscarContas()
  }

  async function voltarParaPendente(id) {
    await supabase
      .from('df_contas')
      .update({ status: 'pendente' })
      .eq('id', id)

    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Excluir conta?')) return

    await supabase
      .from('df_contas')
      .delete()
      .eq('id', id)

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
    if (!confirm('Excluir centro de custo?')) return

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

  const contasFiltradas = contas
    .filter((conta) => {
      if (filtro === 'pendentes') return conta.status !== 'pago'
      if (filtro === 'pagas') return conta.status === 'pago'
      if (filtro === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
      return true
    })
    .filter((conta) => {
      if (!centroFiltro) return true
      return conta.centro_custo_id === centroFiltro
    })
    .filter((conta) =>
      String(conta.descricao || '').toLowerCase().includes(busca.toLowerCase())
    )

  const total = contas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pago = contas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pendente = total - pago

  const vencido = contas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  // =========================
  // BLOCO 2 - FUNÇÕES NOTAS
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

  function abrirNovaNota() {
    setMenuAberto(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setModalNota(true)
  }

  function abrirEdicaoNota(nota) {
    setEditandoNotaId(nota.id)
    setTituloNota(nota.titulo || '')
    setConteudoNota(nota.conteudo || '')
    setModalNota(true)
  }

  function fecharModalNota() {
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

    let error

    if (editandoNotaId) {
      const resposta = await supabase
        .from('df_notas')
        .update(payload)
        .eq('id', editandoNotaId)

      error = resposta.error
    } else {
      const resposta = await supabase
        .from('df_notas')
        .insert([payload])

      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharModalNota()
    buscarNotas()
  }

  async function excluirNota(id) {
    if (!confirm('Excluir nota?')) return

    await supabase
      .from('df_notas')
      .delete()
      .eq('id', id)

    buscarNotas()
  }

  const notasFiltradas = notas.filter((nota) =>
    `${nota.titulo || ''} ${nota.conteudo || ''}`
      .toLowerCase()
      .includes(buscaNota.toLowerCase())
  )

  return (
    <div style={styles.page}>
      {/* ========================= */}
      {/* BLOCO 1 - CONTAS A PAGAR */}
      {/* ========================= */}
      <section>
        <h1 style={styles.titulo}>📊 Contas a Pagar</h1>

        <div style={styles.resumo}>
          <div style={styles.box}>Total<br /><b>{formatarValor(total)}</b></div>
          <div style={styles.boxPago}>Pago<br /><b>{formatarValor(pago)}</b></div>
          <div style={styles.boxPend}>Pend<br /><b>{formatarValor(pendente)}</b></div>
          <div style={styles.boxVen}>Venc<br /><b>{formatarValor(vencido)}</b></div>
        </div>

        <input
          placeholder="Buscar conta..."
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
            {centros.map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.nome}
              </option>
            ))}
          </select>

          <button style={styles.btnConfig} onClick={() => setModalConfig(true)}>
            ⚙️ Centros
          </button>
        </div>

        {loading && <p>Carregando...</p>}

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div
              key={conta.id}
              style={{
                ...styles.card,
                background: conta.status === 'pago'
                  ? '#d4edda'
                  : vencida
                    ? '#ffb3b3'
                    : '#fff3cd'
              }}
            >
              <div style={styles.topo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.small}>
                {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || '-'}
              </div>

              <div style={styles.acoes}>
                {conta.status !== 'pago' ? (
                  <button style={styles.btnAzul} onClick={() => marcarComoPago(conta.id)}>
                    Pago
                  </button>
                ) : (
                  <button style={styles.btnRoxo} onClick={() => voltarParaPendente(conta.id)}>
                    Voltar
                  </button>
                )}

                <button style={styles.btnAmarelo} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button style={styles.btnVermelho} onClick={() => excluirConta(conta.id)}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {/* ========================= */}
      {/* BLOCO 2 - NOTAS */}
      {/* ========================= */}
      <section style={styles.blocoNotas}>
        <h2 style={styles.subtitulo}>📝 Bloco de Notas</h2>

        <input
          placeholder="Buscar nota..."
          value={buscaNota}
          onChange={(e) => setBuscaNota(e.target.value)}
          style={styles.input}
        />

        {notasFiltradas.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhuma nota encontrada.</p>
        )}

        {notasFiltradas.map((nota) => (
          <div key={nota.id} style={styles.cardNota}>
            <div style={styles.topo}>
              <strong>{nota.titulo}</strong>
            </div>

            {nota.conteudo && (
              <div style={styles.conteudoNota}>
                {nota.conteudo}
              </div>
            )}

            <div style={styles.acoes}>
              <button style={styles.btnAmarelo} onClick={() => abrirEdicaoNota(nota)}>
                Editar
              </button>

              <button style={styles.btnVermelho} onClick={() => excluirNota(nota.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ========================= */}
      {/* MENU FLUTUANTE GLOBAL */}
      {/* ========================= */}
      {menuAberto && (
        <div style={styles.menuFab}>
          <button style={styles.menuItem} onClick={abrirNovaConta}>
            💰 Nova conta
          </button>

          <button style={styles.menuItem} onClick={abrirNovaNota}>
            📝 Nova nota
          </button>

          <button style={styles.menuItem} onClick={() => {
            setMenuAberto(false)
            setModalConfig(true)
          }}>
            🏷️ Novo centro
          </button>
        </div>
      )}

      <button style={styles.fab} onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '×' : '+'}
      </button>

      {/* ========================= */}
      {/* MODAL - CONTA */}
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
              placeholder="Valor. Ex: 150,90"
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
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nome}
                </option>
              ))}
            </select>

            <button style={styles.btnSalvar} onClick={salvarConta}>
              Salvar
            </button>

            <button style={styles.btnCancelar} onClick={fecharModalConta}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* MODAL - NOTA */}
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
              placeholder="Conteúdo da nota..."
              value={conteudoNota}
              onChange={(e) => setConteudoNota(e.target.value)}
            />

            <button style={styles.btnSalvar} onClick={salvarNota}>
              Salvar
            </button>

            <button style={styles.btnCancelar} onClick={fecharModalNota}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* MODAL - CONFIGURAÇÕES */}
      {/* ========================= */}
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
              {centros.map((centro) => (
                <div key={centro.id} style={styles.itemCentro}>
                  <span>{centro.nome}</span>

                  <button style={styles.btnMiniExcluir} onClick={() => excluirCentro(centro.id)}>
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

  subtitulo: {
    fontSize: 21,
    marginTop: 28,
    marginBottom: 10
  },

  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 10
  },

  box: {
    padding: 8,
    background: '#eee',
    borderRadius: 10,
    fontSize: 13
  },

  boxPago: {
    padding: 8,
    background: '#c3e6cb',
    borderRadius: 10,
    fontSize: 13
  },

  boxPend: {
    padding: 8,
    background: '#ffeeba',
    borderRadius: 10,
    fontSize: 13
  },

  boxVen: {
    padding: 8,
    background: '#f5c6cb',
    borderRadius: 10,
    fontSize: 13
  },

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

  cardNota: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    background: '#eef2ff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
  },

  blocoNotas: {
    marginTop: 24
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 15
  },

  small: {
    fontSize: 12,
    opacity: 0.7,
    mar
