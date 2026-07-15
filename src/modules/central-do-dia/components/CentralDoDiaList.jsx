import { CentralDoDiaItem } from './CentralDoDiaItem.jsx'

export function CentralDoDiaList({ itens, formatarValor, onNavigate }) {
  return (
    <div className="central-day-list">
      {itens.map((item) => (
        <CentralDoDiaItem
          key={item.id}
          item={item}
          formatarValor={formatarValor}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}
