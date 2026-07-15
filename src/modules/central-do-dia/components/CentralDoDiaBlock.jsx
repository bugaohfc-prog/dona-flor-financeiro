export function CentralDoDiaBlock({
  titulo,
  descricao,
  quantidade,
  estado,
  mensagemVazia,
  mensagemErro,
  children
}) {
  return (
    <article className="central-day-block">
      <header className="central-day-block-header">
        <div>
          <h3>{titulo}</h3>
          <p>{descricao}</p>
        </div>
        {Number.isFinite(quantidade) && <span className="central-day-count">{quantidade}</span>}
      </header>

      {estado === 'carregando' && <div className="central-day-state" role="status">Carregando informações…</div>}
      {estado === 'empresa_ausente' && <div className="central-day-state" role="status">Selecione uma empresa para consultar este bloco.</div>}
      {estado === 'sem_permissao' && <div className="central-day-state">Conteúdo indisponível para este perfil.</div>}
      {estado === 'erro' && <div className="central-day-state central-day-state-error" role="alert">{mensagemErro}</div>}
      {estado === 'vazio' && <div className="central-day-state">{mensagemVazia}</div>}
      {estado === 'preenchido' && children}
    </article>
  )
}
