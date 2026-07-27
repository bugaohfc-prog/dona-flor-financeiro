import { useState } from 'react'
import AgendaOperacionalItem from './AgendaOperacionalItem.jsx'

const LIMITE_INICIAL = 5

export default function AgendaOperacionalDayGroup({
  grupo,
  abertoInicialmente = false,
  formatarValor,
  formatarData,
  obterConta,
  onAbrir,
  onEditar,
  onPagar,
  podeEditarFinanceiro
}) {
  const [aberto, setAberto] = useState(abertoInicialmente)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const conteudoId = `agenda-dia-${String(grupo.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const itensVisiveis = mostrarTodos ? grupo.itens : grupo.itens.slice(0, LIMITE_INICIAL)
  const rotuloData = grupo.data ? formatarData(grupo.data) : 'Sem data definida'

  return (
    <section className={aberto ? 'agenda-operacional-dia aberto' : 'agenda-operacional-dia'}>
      <button
        type="button"
        className="agenda-operacional-dia-toggle"
        aria-expanded={aberto}
        aria-controls={conteudoId}
        onClick={() => setAberto((valor) => !valor)}
      >
        <span className="agenda-operacional-dia-data">{rotuloData}</span>
        <span className="agenda-operacional-dia-resumo">
          {grupo.resumo.quantidade} {grupo.resumo.quantidade === 1 ? 'item' : 'itens'}
          <strong>{formatarValor(grupo.resumo.valor)}</strong>
        </span>
        <span className="agenda-operacional-dia-controle" aria-hidden="true">{aberto ? '\u2212' : '+'}</span>
      </button>

      {aberto && (
        <div id={conteudoId} className="agenda-operacional-lista">
          {itensVisiveis.map((item) => (
            <AgendaOperacionalItem
              key={item.id}
              item={item}
              conta={obterConta(item)}
              formatarValor={formatarValor}
              formatarData={formatarData}
              onAbrir={onAbrir}
              onEditar={onEditar}
              onPagar={onPagar}
              podeEditarFinanceiro={podeEditarFinanceiro}
            />
          ))}
          {grupo.itens.length > LIMITE_INICIAL && (
            <button
              type="button"
              className="outline agenda-operacional-mostrar-mais"
              aria-expanded={mostrarTodos}
              onClick={() => setMostrarTodos((valor) => !valor)}
            >
              {mostrarTodos ? 'Mostrar menos' : `Mostrar mais (${grupo.itens.length - LIMITE_INICIAL})`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
