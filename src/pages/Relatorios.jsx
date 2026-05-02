import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

export default function Relatorios({ voltar }) {
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
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

  // =========================
  // BLOCO 1 — STATES
  // =========================
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroMes, setFiltroMes] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')

  useEffect(() => {
    buscarDados()
  }, [])

  // =========================
  // BLOCO 2 — BUSCAS
  // =========================
  async function buscarDados() {
    setLoading(true)

    const { data: contasData, error: contasError } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .order('data_vencimento')

    const { data: centrosData, error: centrosError } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    if (contasError) {
      alert(contasError.message)
    }

    if (centrosError) {
      alert(centrosError.message)
    }

    setContas(contasData || [])
    setCentros(centrosData || [])
    setLoading(false)
  }

  // =========================
  // BLOCO 3 — FILTROS
  // =========================
  const contasFiltradas = useMemo(() => {
    return contas
      .filter((conta) => {
        if (filtroStatus === 'pendentes') return conta.status !== 'pago'
        if (filtroStatus === 'pagas') return conta.status === 'pago'
        if (filtroStatus === 'vencidas') return estaVencida(conta.data_vencimento, conta.status)
        return true
      })
      .filter((conta) => {
        if (!filtroMes) return true
        return pegarMes(conta.data_vencimento) === filtroMes
      })
      .filter((conta) => {
        if (!filtroCentro) return true
        return conta.centro_custo_id === filtroCentro
      })
  }, [contas, filtroMes, filtroStatus, filtroCentro])

  // =========================
  // BLOCO 4 — CÁLCULOS
  // =========================
  const totalGeral = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalVencido = contasFiltradas
    .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const totalPendente = totalGeral - totalPago

  const ranking = centros
    .map((centro) => {
      const lista = contasFiltradas.filter((conta) => conta.centro_custo_id === centro.id)

      const total = lista.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      const pago = lista
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      const vencido = lista
        .filter((conta) => estaVencida(conta.data_vencimento, conta.status))
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      return {
        id: centro.id,
        nome: centro.nome,
        total,
        pago,
        pendente: total - pago,
        vencido,
        percentual: totalGeral ? (total / totalGeral) * 100 : 0
      }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  const maiorValor = ranking[0]?.total || 0

  // =========================
  // BLOCO 5 — EXPORTAÇÃO
  // =========================
  function imprimirPDF() {
    window.print()
  }

  function exportarCSV() {
    const cabecalho = ['Centro', 'Total', 'Pago', 'Pendente', 'Vencido', 'Percentual']
    const linhas = ranking.map((item) => [
      item.nome,
      Number(item.total || 0).toFixed(2).replace('.', ','),
      Number(item.pago || 0).toFixed(2).replace('.', ','),
      Number(item.pendente || 0).toFixed(2).replace('.', ','),
      Number(item.vencido || 0).toFixed(2).replace('.', ','),
      `${item.percentual.toFixed(1)}%`
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-centros.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function limparFiltros() {
    setFiltroMes('')
    setFiltroStatus('todas')
    setFiltroCentro('')
  }

  // =========================
  // BLOCO 6 — UI
  // =========================
  return (
    <div className="relatorios-page" style={styles.page}>
      <style>
        {`
          .relatorio-print-header,
          .relatorio-print-footer {
            display: none;
          }

          @media print {
            body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            .relatorios-page {
              background: #fff !important;
              padding: 0 !important;
            }

            .relatorio-print-header {
              display: block !important;
              text-align: center;
              border-bottom: 1px solid #ddd;
              margin-bottom: 16px;
              padding-bottom: 8px;
            }

            .relatorio-print-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 6px;
              background: #fff;
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd;
            }

            @page {
              size: A4;
              margin: 12mm 12mm 18mm 12mm;
            }
          }
        `}
      </style>

      <div className="relatorio-print-header">
        <h1>Relatório por Centro de Custo</h1>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="relatorio-print-footer">
        Relatório gerado pelo Sistema Dona Flor Financeiro
      </div>

      <div className="no-print" style={styles.topo}>
        <button style={styles.btnVoltar} onClick={voltar}>
          ← Voltar
        </button>

        <button style={styles.btnPDF} onClick={imprimirPDF}>
          PDF
        </button>

        <button style={styles.btnCSV} onClick={exportarCSV}>
          CSV
        </button>
      </div>

      <h1 style={styles.titulo}>📊 Relatórios</h1>

      <section style={styles.resumo}>
        <div style={styles.boxTotal}>
          <span>Total</span>
          <strong>{formatarValor(totalGeral)}</strong>
        </div>

        <div style={styles.boxPago}>
          <span>Pago</span>
          <strong>{formatarValor(totalPago)}</strong>
        </div>

        <div style={styles.boxPendente}>
          <span>Pendente</span>
          <strong>{formatarValor(totalPendente)}</strong>
        </div>

        <div style={styles.boxVencido}>
          <span>Vencido</span>
          <strong>{formatarValor(totalVencido)}</strong>
        </div>
      </section>

      <section className="no-print" style={styles.filtrosBox}>
        <select style={styles.input} value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
          <option value="">Todos os centros</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />

        <div style={styles.filtros}>
          <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
          <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
          <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
          <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
        </div>

        <button style={styles.btnLimpar} onClick={limparFiltros}>
          Limpar filtros
        </button>
      </section>

      <section style={styles.infoFiltro}>
        <strong>Resultado</strong>
        <span>{ranking.length} centro(s) • {contasFiltradas.length} conta(s)</span>
        <small>
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {filtroStatus} •
          Mês: {filtroMes || 'Todos'}
        </small>
      </section>

      {loading && <p>Carregando...</p>}

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>🏆 Ranking por Centro</h2>

        {ranking.length === 0 && (
          <p style={styles.vazio}>Nenhum dado encontrado para os filtros selecionados.</p>
        )}

        {ranking.map((item, index) => {
          const largura = maiorValor ? `${Math.max((item.total / maiorValor) * 100, 4)}%` : '0%'

          return (
            <div className="print-card" key={item.id} style={styles.cardRanking}>
              <div style={styles.rankingTopo}>
                <div>
                  <strong>{index + 1}. {item.nome}</strong>
                  <div style={styles.textoSecundario}>
                    {item.percentual.toFixed(1)}% do total
                  </div>
                </div>

                <strong>{formatarValor(item.total)}</strong>
              </div>

              <div style={styles.barraFundo}>
                <div style={{ ...styles.barraValor, width: largura }} />
              </div>

              <div style={styles.gridValores}>
                <span>Pago: {formatarValor(item.pago)}</span>
                <span>Pend: {formatarValor(item.pendente)}</span>
                <span>Venc: {formatarValor(item.vencido)}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section style={styles.bloco}>
        <h2 style={styles.subtitulo}>📄 Contas do relatório</h2>

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida(conta.data_vencimento, conta.status)

          return (
            <div className="print-card" key={conta.id} style={styles.cardConta}>
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.textoSecundario}>
                {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || '-'} • {vencida ? 'VENCIDO' : conta.status}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

// =========================
// BLOCO 7 — STYLES
// =========================
const styles = {
  page: {
    padding: 16,
    maxWidth: 760,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: 80
  },

  topo: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap'
  },

  titulo: {
    fontSize: 28,
    marginBottom: 12
  },

  subtitulo: {
    fontSize: 22,
    marginBottom: 12
  },

  bloco: {
    marginTop: 24
  },

  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 12
  },

  boxTotal: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  boxPago: {
    background: '#d4edda',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  boxPendente: {
    background: '#fff3cd',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  boxVencido: {
    background: '#f8d7da',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },

  filtrosBox: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 8,
    boxSizing: 'border-box'
  },

  filtros: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8
  },

  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },

  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },

  infoFiltro: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    fontSize: 14
  },

  cardRanking: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },

  rankingTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },

  barraFundo: {
    height: 10,
    background: '#e9ecef',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 8
  },

  barraValor: {
    height: '100%',
    background: '#198754',
    borderRadius: 99
  },

  gridValores: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    fontSize: 12,
    color: '#444'
  },

  cardConta: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },

  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4
  },

  textoSecundario: {
    fontSize: 12,
    color: '#666'
  },

  vazio: {
    opacity: 0.7,
    fontSize: 14
  },

  btnVoltar: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnPDF: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnCSV: {
    background: '#198754',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  },

  btnLimpar: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8
  }
}
