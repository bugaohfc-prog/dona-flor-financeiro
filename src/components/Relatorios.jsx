import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Relatorios() {
  const [contas, setContas] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {
    setLoading(true)

    const { data: contasData } = await supabase
      .from('df_contas')
      .select('*')

    const { data: centrosData } = await supabase
      .from('df_centros_custo')
      .select('*')

    setContas(contasData || [])
    setCentros(centrosData || [])
    setLoading(false)
  }

  // =========================
  // 🔥 AGRUPAR POR CENTRO
  // =========================
  const resumo = centros.map((centro) => {
    const contasCentro = contas.filter(
      (c) => c.centro_custo_id === centro.id
    )

    const total = contasCentro.reduce((acc, c) => acc + Number(c.valor || 0), 0)

    return {
      nome: centro.nome,
      total
    }
  })

  const totalGeral = resumo.reduce((acc, c) => acc + c.total, 0)

  // ordenar ranking
  const ranking = resumo
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div style={styles.container}>
      <h1>📊 Relatórios</h1>

      {/* =========================
          🧾 RESUMO GERAL
      ========================== */}
      <div style={styles.cardResumo}>
        <strong>Total Geral</strong>
        <span>{formatarValor(totalGeral)}</span>
      </div>

      {/* =========================
          🏆 RANKING POR CENTRO
      ========================== */}
      <h2 style={styles.titulo}>🏆 Ranking por Centro</h2>

      {ranking.map((item, index) => {
        const percentual = totalGeral
          ? ((item.total / totalGeral) * 100).toFixed(1)
          : 0

        return (
          <div key={index} style={styles.cardCentro}>
            <div>
              <strong>{item.nome}</strong>
              <div style={styles.sub}>
                {percentual}% do total
              </div>
            </div>

            <strong>{formatarValor(item.total)}</strong>
          </div>
        )
      })}

      {ranking.length === 0 && <p>Nenhum dado ainda.</p>}
    </div>
  )
}

const styles = {
  container: {
    padding: 20
  },

  titulo: {
    marginTop: 20,
    marginBottom: 10
  },

  cardResumo: {
    background: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 16
  },

  cardCentro: {
    background: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  },

  sub: {
    fontSize: 12,
    color: '#666'
  }
}
