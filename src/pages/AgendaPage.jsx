function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function CardAgenda({
  styles,
  titulo,
  total,
  lista,
  cor,
  formatarValor,
  formatarData,
  diferencaDias,
  navegarPara,
  podeEditarFinanceiro
}) {
  return (
    <section style={styles.cardAgenda}>
      <div style={styles.cardTopo}>
        <strong>{titulo}</strong>
        <span>{formatarValor(total)}</span>
      </div>

      {lista.length === 0 && (
        <EmptyState icon="✅" title="Agenda limpa" description="Não há contas neste grupo de vencimento no momento." />
      )}

      {lista.map((conta) => {
        const dias = diferencaDias(conta.data_vencimento)

        return (
          <div key={conta.id} style={{ ...styles.itemAgenda, borderLeft: `5px solid ${cor}` }}>
            <div>
              <strong>{conta.descricao}</strong>
              <div style={styles.cardInfo}>
                {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}
              </div>

              <small style={dias < 0 ? styles.textoVencidoAgenda : styles.textoAgenda}>
                {dias < 0
                  ? `Vencida há ${Math.abs(dias)} dia(s)`
                  : dias === 0
                    ? 'Vence hoje'
                    : `Vence em ${dias} dia(s)`}
              </small>
            </div>

            <div style={styles.agendaDireita}>
              <strong>{formatarValor(conta.valor)}</strong>

              {podeEditarFinanceiro && (
                <button style={styles.btnPago} onClick={() => navegarPara('contas')}>
                  Ver em Contas
                </button>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function AgendaPage({
  styles,
  contas = [],
  formatarValor,
  formatarData,
  dataLocal,
  diferencaDias,
  mesmoMesAtual,
  navegarPara,
  podeEditarFinanceiro = true
}) {
  const contasAgenda = [...contas]
    .filter((conta) => conta.status !== 'pago')
    .sort((a, b) => dataLocal(a.data_vencimento) - dataLocal(b.data_vencimento))

  const contasVencidas = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) < 0)
  const contasHoje = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) === 0)
  const contasSemana = contasAgenda.filter((conta) => {
    const dias = diferencaDias(conta.data_vencimento)
    return dias > 0 && dias <= 7
  })
  const contasMes = contasAgenda.filter((conta) => {
    const dias = diferencaDias(conta.data_vencimento)
    return dias > 7 && mesmoMesAtual(conta.data_vencimento)
  })

  const totalVencidasAgenda = contasVencidas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalHojeAgenda = contasHoje.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalSemanaAgenda = contasSemana.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
  const totalMesAgenda = contasMes.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  return (
    <>
      <h1 style={styles.titulo}>📅 Agenda Financeira</h1>

      <button className="btn-back-page" style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section className="agenda-summary-grid" style={styles.resumo}>
        <div style={styles.boxVencido}>
          <span>Vencidas</span>
          <strong>{formatarValor(totalVencidasAgenda)}</strong>
        </div>

        <div style={styles.boxPendente}>
          <span>Hoje</span>
          <strong>{formatarValor(totalHojeAgenda)}</strong>
        </div>

        <div style={styles.boxTotal}>
          <span>7 dias</span>
          <strong>{formatarValor(totalSemanaAgenda)}</strong>
        </div>

        <div style={styles.boxPago}>
          <span>Mês</span>
          <strong>{formatarValor(totalMesAgenda)}</strong>
        </div>
      </section>

      <div className="agenda-page-grid">
        <CardAgenda
          styles={styles}
          titulo="🚨 Vencidas"
          total={totalVencidasAgenda}
          lista={contasVencidas}
          cor="#dc3545"
          formatarValor={formatarValor}
          formatarData={formatarData}
          diferencaDias={diferencaDias}
          navegarPara={navegarPara}
          podeEditarFinanceiro={podeEditarFinanceiro}
        />
        <CardAgenda
          styles={styles}
          titulo="📌 Vencem hoje"
          total={totalHojeAgenda}
          lista={contasHoje}
          cor="#ffc107"
          formatarValor={formatarValor}
          formatarData={formatarData}
          diferencaDias={diferencaDias}
          navegarPara={navegarPara}
          podeEditarFinanceiro={podeEditarFinanceiro}
        />
        <CardAgenda
          styles={styles}
          titulo="🗓️ Próximos 7 dias"
          total={totalSemanaAgenda}
          lista={contasSemana}
          cor="#0d6efd"
          formatarValor={formatarValor}
          formatarData={formatarData}
          diferencaDias={diferencaDias}
          navegarPara={navegarPara}
          podeEditarFinanceiro={podeEditarFinanceiro}
        />
        <CardAgenda
          styles={styles}
          titulo="📆 Restante do mês"
          total={totalMesAgenda}
          lista={contasMes}
          cor="#14b8a6"
          formatarValor={formatarValor}
          formatarData={formatarData}
          diferencaDias={diferencaDias}
          navegarPara={navegarPara}
          podeEditarFinanceiro={podeEditarFinanceiro}
        />
      </div>
    </>
  )
}
