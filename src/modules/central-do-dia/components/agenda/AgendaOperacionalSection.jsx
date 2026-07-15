import { useEffect, useState } from 'react'
import AgendaOperacionalItem from './AgendaOperacionalItem.jsx'

const LIMITE_INICIAL = 5

export default function AgendaOperacionalSection({ id, titulo, descricao, itens, formatarValor, formatarData, onAbrir }) {
  const [expandida, setExpandida] = useState(false)
  const [recolhida, setRecolhida] = useState(false)

  useEffect(() => {
    setExpandida(false)
    setRecolhida(false)
  }, [itens])

  if (!itens?.length) return null
  const itensVisiveis = expandida ? itens : itens.slice(0, LIMITE_INICIAL)
  const conteudoId = `agenda-operacional-secao-${id}`

  return (
    <section className="agenda-operacional-secao" aria-labelledby={`${conteudoId}-titulo`}>
      <div className="agenda-operacional-secao-cabecalho">
        <div>
          <h2 id={`${conteudoId}-titulo`}>{titulo} <span>{itens.length}</span></h2>
          {descricao && <p>{descricao}</p>}
        </div>
        <button
          type="button"
          className="outline agenda-operacional-recolher"
          aria-expanded={!recolhida}
          aria-controls={conteudoId}
          onClick={() => setRecolhida((valor) => !valor)}
        >
          {recolhida ? 'Expandir' : 'Recolher'}
        </button>
      </div>
      {!recolhida && (
        <div id={conteudoId} className={`agenda-operacional-lista ${id === 'excecoes' ? 'agenda-operacional-lista-larga' : ''}`}>
          {itensVisiveis.map((item) => (
            <AgendaOperacionalItem
              key={item.id}
              item={item}
              formatarValor={formatarValor}
              formatarData={formatarData}
              onAbrir={onAbrir}
            />
          ))}
        </div>
      )}
      {!recolhida && itens.length > LIMITE_INICIAL && (
        <button
          type="button"
          className="outline agenda-operacional-mostrar-mais"
          aria-expanded={expandida}
          aria-controls={conteudoId}
          onClick={() => setExpandida((valor) => !valor)}
        >
          {expandida ? 'Mostrar menos' : `Mostrar mais (${itens.length - LIMITE_INICIAL})`}
        </button>
      )}
    </section>
  )
}
