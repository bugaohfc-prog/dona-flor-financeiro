import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  // =========================
  // BLOCO 1 — CONTAS A PAGAR / STATES
  // =========================
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [centroFiltro, setCentroFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  // =========================
  // BLOCO 2 — BLOCO DE NOTAS / STATES
  // =========================
  const [notas, setNotas] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)

  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')

  // =========================
  // BLOCO 4 — CENTROS DE CUSTO / STATES
  // =========================
  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 5 — MENU FLUTUANTE / STATE
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    await Promise.all([
      buscarContas(),
      buscarCentros(),
      buscarNotas()
    ])
    setLoading(false)
  }

  // =========================
  // BLOCO 0 — UTILITÁRIOS
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
  // BLOCO 1 — CONTAS A PAGAR / FUNÇÕES
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

  function abrirNovaConta() {
    setMenuAberto(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setModalConta(true)
  }

  function abrirEdicaoConta(conta) {
    setEditandoContaId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setDataVencimento(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalConta(true)
  }

  function fecharModalConta() {
    setModalConta(false)
    setEditandoContaId(null)
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

    const valorConvertido = converterValor(valor)

    if (isNaN(valorConvertido)) {
      alert('Digite um valor válido')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: valorConvertido,
      data_vencimento: dataVencimento,
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
    const { error } = await supabase
      .from('df_contas')
      .update({ status: 'pago' })
      .eq('id', id)

    if (error) {
      alert(error.message)
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
      alert(error.message)
      return
    }

    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Excluir conta?')) return

    const { error } = await supabase
      .from('df_contas')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

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
  // BLOCO 2 — BLOCO DE NOTAS / FUNÇÕES
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

    const { error } = await supabase
      .from('df_notas')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
  }

  const notasFiltradas = notas.filter((nota) =>
    `${nota.titulo || ''} ${nota.conteudo || ''}`
      .toLowerCase()
      .includes(buscaNota.toLowerCase())
  )

  // =========================
  // BLOCO 3 — DASHBOARD / CÁLCULOS
  // =========================
  const resumoPorCentro = centros.map((centro) => {
    const lista = contas.filter((conta) => conta.centro_custo_id === centro.id)

    const totalCentro = lista.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

    const pagoCentro = lista
      .filter((conta) => conta.status === 'pago')
      .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

    const vencidoCentro = lista
      .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
      .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

    return {
      id: centro.id,
      nome: centro.nome,
      total: totalCentro,
      pago: pagoCentro,
      pendente: totalCentro - pagoCentro,
      vencido: vencidoCentro
    }
  })

  // =========================
  // BLOCO 4 — CENTROS DE CUSTO / FUNÇÕES
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

  return (
    <div style={styles.page}>
      {/* ========================= */}
      {/* BLOCO 1 — CONTAS A PAGAR */}
      {/* ========================= */}
      <section>
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
            <span>Pend</span>
            <strong>{formatarValor(pendente)}</strong>
          </div>

          <div style={styles.boxVencido}>
            <span>Venc</span>
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

          <button style={styles.btnConfig} onClick={() => setModalCentro(true)}>
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
                ...styles.cardConta,
                background:
                  conta.status === 'pago'
                    ? '#d4edda'
                    : vencida
                      ? '#ffb3b3'
                      : '#fff3cd'
              }}
            >
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.cardInfo}>
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
      {/* BLOCO 3 — DASHBOARD */}
      {/* ========================= */}
      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📊 Dashboard por Centro</h2>

        {resumoPorCentro.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhum centro cadastrado.</p>
        )}

        {resumoPorCentro.map((centro) => (
          <div key={centro.id} style={styles.cardDashboard}>
            <strong>{centro.nome}</strong>

            <div style={styles.dashboardGrid}>
              <span>Total: {formatarValor(centro.total)}</span>
              <span>Pago: {formatarValor(centro.pago)}</span>
              <span>Pend: {formatarValor(centro.pendente)}</span>
              <span>Venc: {formatarValor(centro.vencido)}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ========================= */}
      {/* BLOCO 2 — BLOCO DE NOTAS */}
      {/* ========================= */}
      <section style={styles.bloco}>
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
            <strong>{nota.titulo}</strong>

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
      {/* BLOCO 5 — MENU FLUTUANTE */}
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
            setModalCentro(true)
          }}>
            🏷️ Novo centro
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
              placeholder="Valor. Ex: 150,90"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />

            <input
              style={styles.inputModal}
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
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
      {/* BLOCO 6 — MODAL CENTROS */}
      {/* ========================= */}
      {modalCentro && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>⚙️ Centros de Custo</h3>

            <input
              style={styles.inputModal}
              placeholder="Ex: Loja Catanduva"
              value={novoCentro}
              on
