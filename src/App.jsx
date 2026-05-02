import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
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

  function pegarMes(data) {
    if (!data) return ''
    return String(data).slice(0, 7)
  }

  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')

  const [notas, setNotas] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')

  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    await Promise.all([buscarContas(), buscarNotas(), buscarCentros()])
    setLoading(false)
  }

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

  const contasFiltradas = contas
    .filter((conta) => {
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
      if (filtroStatus === 'pagas') return conta.status === 'pago'
      if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
      return true
    })
    .filter((conta) => !filtroCentro || conta.centro_custo_id === filtroCentro)
    .filter((conta) => !filtroMes || pegarMes(conta.data_vencimento) === filtroMes)
    .filter((conta) => {
      if (dataInicial && conta.data_vencimento < dataInicial) return false
      if (dataFinal && conta.data_vencimento > dataFinal) return false
      return true
    })
    .filter((conta) =>
      String(conta.descricao || '').toLowerCase().includes(busca.toLowerCase())
    )

  const total = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const vencido = contasFiltradas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pendente = total - pago

  const resumoPorCentro = centros
    .map((centro) => {
      const lista = contasFiltradas.filter((conta) => conta.centro_custo_id === centro.id)
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
    .filter((centro) => centro.total > 0 || centro.pago > 0 || centro.pendente > 0 || centro.vencido > 0)

  const notasFiltradas = notas.filter((nota) =>
    `${nota.titulo || ''} ${nota.conteudo || ''}`
      .toLowerCase()
      .includes(buscaNota.toLowerCase())
  )

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

  function fecharConta() {
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

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: dataVencimento,
      centro_custo_id: centroCustoId || null
    }

    let error

    if (editandoContaId) {
      const resposta = await supabase.from('df_contas').update(payload).eq('id', editandoContaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_contas').insert([{ ...payload, status: 'pendente' }])
      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
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

    let error

    if (editandoNotaId) {
      const resposta = await supabase.from('df_notas').update(payload).eq('id', editandoNotaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_notas').insert([payload])
      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharNota()
    buscarNotas()
  }

  async function excluirNota(id) {
    if (!confirm('Excluir nota?')) return
    await supabase.from('df_notas').delete().eq('id', id)
    buscarNotas()
  }

  async function salvarCentro() {
    if (!novoCentro.trim()) {
      alert('Digite o centro de custo')
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
    if (!confirm('Excluir centro?')) return

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

  function exportarCSV() {
    const cabecalho = ['Descricao', 'Valor', 'Vencimento', 'Status', 'Centro']
    const linhas = contasFiltradas.map((conta) => [
      conta.descricao || '',
      Number(conta.valor || 0).toFixed(2).replace('.', ','),
      formatarData(conta.data_vencimento),
      estaVencida(conta.data_vencimento, conta.status) ? 'vencido' : conta.status,
      conta.df_centros_custo?.nome || ''
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-contas.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function imprimirPDF() {
    window.print()
  }

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('todas')
    setFiltroCentro('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
  }

  return (
    <div style={styles.page}>
      <style>
        {`
          .print-header {
            display: none;
          }

          @media print {
            body {
              background: #ffffff !important;
            }

            .no-print {
              display: none !important;
            }

            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 18px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }

            .print-header h1 {
              font-size: 22px;
              margin: 0 0 4px 0;
            }

            .print-header p {
              font-size: 12px;
              margin: 0;
              color: #555;
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd;
            }

            @page {
              size: A4;
              margin: 14mm;
            }
          }
        `}
      </style>

      <div className="print-header">
        <h1>Relatório Financeiro</h1>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

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
            <span>Pendente</span>
            <strong>{formatarValor(pendente)}</strong>
          </div>

          <div style={styles.boxVencido}>
            <span>Vencido</span>
            <strong>{formatarValor(vencido)}</strong>
          </div>
        </div>
      </section>

      <section className="no-print" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div style={styles.filtros}>
          <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
          <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
          <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
          <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
        </div>

        <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
          <option value="">Todos os centros</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>{centro.nome}</option>
          ))}
        </select>

        <input style={styles.input} type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />

        <div style={styles.datas}>
          <input style={styles.input} type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          <input style={styles.input} type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        </div>

        <div style={styles.acoes}>
          <button style={styles.btnCinza} onClick={limparFiltros}>Limpar</button>
          <button style={styles.btnRoxo} onClick={imprimirPDF}>PDF</button>
          <button style={styles.btnVerde} onClick={exportarCSV}>CSV/Editável</button>
        </div>
      </section>

      <section style={styles.bloco}>
        {loading && <p>Carregando...</p>}

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div
              className="print-card"
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
                {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || '-'} • {vencida ? 'VENCIDO' : conta.status}
              </div>

              <div className="no-print" style={styles.acoes}>
                {conta.status !== 'pago' ? (
                  <button style={styles.btnPago} onClick={() => marcarComoPago(conta.id)}>Pago</button>
                ) : (
                  <button style={styles.btnVoltar} onClick={() => voltarParaPendente(conta.id)}>Voltar</button>
                )}

                <button style={styles.btnEditar} onClick={() => abrirEdicaoConta(conta)}>Editar</button>
                <button style={styles.btnExcluir} onClick={() => excluirConta(conta.id)}>Excluir</button>
              </div>
            </div>
          )
        })}
      </section>

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📈 Relatório por Centro</h2>

        {resumoPorCentro.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhum resultado para os filtros selecionados.</p>
        )}

        {resumoPorCentro.map((centro) => (
          <div className="print-card" key={centro.id} style={styles.cardDashboard}>
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

      <section className="no-print" style={styles.bloco}>
        <h2 style={styles.subtitulo}>📝 Bloco de Notas</h2>

        <input style={styles.input} placeholder="Buscar nota..." value={buscaNota} onChange={(e) => setBuscaNota(e.target.value)} />

        {notasFiltradas.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhuma nota encontrada.</p>
        )}

        {notasFiltradas.map((nota) => (
          <div key={nota.id} style={styles.cardNota}>
            <strong>{nota.titulo}</strong>

            {nota.conteudo && <p style={styles.textoNota}>{nota.conteudo}</p>}

            <div style={styles.acoes}>
              <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>Editar</button>
              <button style={styles.btnExcluir} onClick={() => excluirNota(nota.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </section>

      {menuAberto && (
        <div className="no-print" style={styles.menuFab}>
          <button style={styles.menuItem} onClick={abrirNovaConta}>💰 Nova conta</button>
          <button style={styles.menuItem} onClick={abrirNovaNota}>📝 Nova nota</button>
          <button
            style={styles.menuItem}
            onClick={() => {
              setMenuAberto(false)
              setModalCentro(true)
            }}
          >
            🏷 Centro
          </button>
        </div>
      )}

      <button className="no-print" style={styles.fab} onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '×' : '+'}
      </button>

      {modalConta && (
        <div className="no-print" style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

            <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
            <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
            <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

            <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
              <option value="">Centro de custo</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>

            <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharConta}>Cancelar</button>
          </div>
        </div>
      )}

      {modalNota && (
        <div className="no-print" style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>

            <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
            <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />

            <but
