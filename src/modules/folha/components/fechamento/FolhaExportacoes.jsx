import { ExportMenu } from '../../../../components/shared/PagePatterns.jsx'

export default function FolhaExportacoes({
  desabilitado,
  onExportarCompras,
  onExportarContabilidade
}) {
  return (
    <ExportMenu
      disabled={desabilitado}
      options={[
        { id: 'compras', label: 'Controle de Compras — Conferência (.xlsx)', onSelect: onExportarCompras },
        { id: 'contabilidade', label: 'Fechamento de Folha — Contabilidade (.xlsx)', onSelect: onExportarContabilidade }
      ]}
    />
  )
}
