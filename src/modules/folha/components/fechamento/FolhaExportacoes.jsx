import { ExportMenu } from '../../../../components/shared/PagePatterns.jsx'

export default function FolhaExportacoes({
  styles,
  desabilitado,
  onExportarCompras,
  onExportarContabilidade
}) {
  return (
    <ExportMenu
      disabled={desabilitado}
      options={[
        { id: 'compras', label: 'Controle de compras', onSelect: onExportarCompras },
        { id: 'contabilidade', label: 'Consolidado contábil', onSelect: onExportarContabilidade },
      ]}
    />
  )
}
