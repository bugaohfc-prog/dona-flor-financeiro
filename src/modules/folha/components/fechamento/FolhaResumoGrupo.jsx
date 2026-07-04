export default function FolhaResumoGrupo({
  resumo,
  estilos,
  formatarMoeda
}) {
  return (
    <div className="folha-grupo-resumo" style={estilos.grupoResumoGrid}>
      <div style={estilos.grupoResumoItem}>
        <span style={estilos.grupoResumoLabel}>Créditos</span>
        <strong style={estilos.grupoResumoValor}>{formatarMoeda(resumo.totalCreditos)}</strong>
      </div>
      <div style={estilos.grupoResumoItem}>
        <span style={estilos.grupoResumoLabel}>Descontos</span>
        <strong style={estilos.grupoResumoValor}>{formatarMoeda(resumo.totalDescontos)}</strong>
      </div>
      <div style={estilos.grupoResumoItem}>
        <span style={estilos.grupoResumoLabel}>Saldo</span>
        <strong style={estilos.grupoResumoValor}>{formatarMoeda(resumo.saldoInformativo)}</strong>
      </div>
      <div style={estilos.grupoResumoItem}>
        <span style={estilos.grupoResumoLabel}>Lançamentos</span>
        <strong style={estilos.grupoResumoValor}>{resumo.quantidadeLancamentos}</strong>
      </div>
    </div>
  )
}
