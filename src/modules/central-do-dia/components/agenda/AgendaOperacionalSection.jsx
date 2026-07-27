import { useMemo } from 'react'
import { agruparItensAgendaPorDia, resumirSecaoAgenda } from '../../domain/centralDoDiaSelectors.js'
import AgendaOperacionalDayGroup from './AgendaOperacionalDayGroup.jsx'

export default function AgendaOperacionalSection({
  id,
  titulo,
  descricao,
  itens,
  abrirPrimeiroDia = false,
  formatarValor,
  formatarData,
  obterConta,
  onAbrir,
  onEditar,
  onPagar,
  podeEditarFinanceiro
}) {
  const grupos = useMemo(() => agruparItensAgendaPorDia(itens), [itens])
  const resumo = useMemo(() => resumirSecaoAgenda(itens), [itens])

  if (!itens?.length) return null

  return (
    <section className={`agenda-operacional-secao agenda-operacional-secao-${id}`} aria-labelledby={`agenda-secao-${id}-titulo`}>
      <div className="agenda-operacional-secao-cabecalho">
        <div>
          <h2 id={`agenda-secao-${id}-titulo`}>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        <div className="agenda-operacional-secao-indicadores" aria-label={`Resumo de ${titulo}`}>
          <span>{resumo.quantidade} {resumo.quantidade === 1 ? 'item' : 'itens'}</span>
          <strong>{formatarValor(resumo.valor)}</strong>
        </div>
      </div>
      <div className="agenda-operacional-dias">
        {grupos.map((grupo, indice) => (
          <AgendaOperacionalDayGroup
            key={grupo.id}
            grupo={grupo}
            abertoInicialmente={abrirPrimeiroDia && indice === 0}
            formatarValor={formatarValor}
            formatarData={formatarData}
            obterConta={obterConta}
            onAbrir={onAbrir}
            onEditar={onEditar}
            onPagar={onPagar}
            podeEditarFinanceiro={podeEditarFinanceiro}
          />
        ))}
      </div>
    </section>
  )
}
