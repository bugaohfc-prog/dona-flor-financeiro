export default function FolhaExportacoes({
  styles,
  desabilitado,
  onExportarCompras,
  onExportarContabilidade
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <button
        type="button"
        style={styles.btnCinza}
        disabled={desabilitado}
        onClick={onExportarCompras}
      >
        Exportar compras
      </button>
      <button
        type="button"
        style={styles.btnPrimario}
        disabled={desabilitado}
        onClick={onExportarContabilidade}
      >
        Exportar contabilidade
      </button>
    </div>
  )
}
