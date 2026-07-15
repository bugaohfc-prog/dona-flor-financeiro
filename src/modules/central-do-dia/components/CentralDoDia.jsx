import { resolverEstadoBloco } from '../domain/centralDoDiaRules.js'
import { CentralDoDiaBlock } from './CentralDoDiaBlock.jsx'
import { CentralDoDiaList } from './CentralDoDiaList.jsx'

export function CentralDoDia({
  empresaId,
  carregandoBase,
  formatarValor,
  navegarPara,
  dados,
  podeAcessarAuditoria
}) {
  const proximosItens = dados.proximosVencimentos.flatMap((grupo) => grupo.itens)
  const erroParcial = dados.erroPessoas || dados.erroAtividade

  function abrirOrigem(item) {
    if (item.destino) navegarPara(item.destino)
  }

  const estadoAcoes = resolverEstadoBloco({ empresaId, carregando: carregandoBase, itens: dados.acoesImediatas })
  const estadoProximos = resolverEstadoBloco({ empresaId, carregando: carregandoBase, itens: proximosItens })
  const estadoExcecoes = resolverEstadoBloco({ empresaId, carregando: carregandoBase, itens: dados.excecoes })
  const estadoAtividade = resolverEstadoBloco({
    empresaId,
    permitido: podeAcessarAuditoria,
    carregando: dados.carregandoAtividade,
    erro: dados.erroAtividade,
    itens: dados.atividadeRecente
  })

  return (
    <section className="central-day" aria-labelledby="central-day-title">
      <header className="central-day-header">
        <div>
          <span className="central-day-kicker">Prioridades operacionais</span>
          <h2 id="central-day-title">Central do dia</h2>
          <p>Ações, prazos e exceções reunidos a partir dos módulos da empresa.</p>
        </div>
        <button type="button" className="dashboard-home-action dashboard-home-action-secondary central-day-refresh" onClick={dados.atualizar} disabled={dados.atualizando || !empresaId}>
          {dados.atualizando ? 'Atualizando…' : 'Atualizar central'}
        </button>
      </header>

      {erroParcial && (
        <div className="central-day-partial-error" role="status">
          Parte das informações está temporariamente indisponível. Os demais blocos continuam atualizados.
        </div>
      )}

      <div className="central-day-grid">
        <CentralDoDiaBlock
          titulo="Ações imediatas"
          descricao="O que precisa de atenção primeiro."
          quantidade={dados.acoesImediatas.length}
          estado={estadoAcoes}
          mensagemVazia="Nenhuma ação imediata identificada."
          mensagemErro="Não foi possível carregar as ações imediatas."
        >
          <CentralDoDiaList itens={dados.acoesImediatas} formatarValor={formatarValor} onNavigate={abrirOrigem} />
        </CentralDoDiaBlock>

        <CentralDoDiaBlock
          titulo="Próximos vencimentos"
          descricao="Compromissos de hoje até os próximos 30 dias."
          quantidade={dados.totalProximos}
          estado={estadoProximos}
          mensagemVazia="Nenhum vencimento pendente nos próximos 30 dias."
          mensagemErro="Não foi possível carregar os próximos vencimentos."
        >
          <div className="central-day-groups">
            {dados.proximosVencimentos.filter((grupo) => grupo.itens.length).map((grupo) => (
              <section key={grupo.id} className="central-day-group" aria-labelledby={`central-day-${grupo.id}`}>
                <h4 id={`central-day-${grupo.id}`}>{grupo.titulo}</h4>
                <CentralDoDiaList itens={grupo.itens} formatarValor={formatarValor} onNavigate={abrirOrigem} />
              </section>
            ))}
          </div>
        </CentralDoDiaBlock>

        <CentralDoDiaBlock
          titulo="Exceções e inconsistências"
          descricao="Situações objetivas que exigem conferência."
          quantidade={dados.excecoes.length}
          estado={estadoExcecoes}
          mensagemVazia="Nenhuma inconsistência objetiva identificada."
          mensagemErro="Não foi possível carregar as exceções."
        >
          <CentralDoDiaList itens={dados.excecoes} formatarValor={formatarValor} onNavigate={abrirOrigem} />
        </CentralDoDiaBlock>

        <CentralDoDiaBlock
          titulo="Atividade recente"
          descricao="Últimos eventos disponíveis na auditoria da empresa."
          quantidade={dados.atividadeRecente.length}
          estado={estadoAtividade}
          mensagemVazia="Nenhum evento recente disponível."
          mensagemErro="A atividade recente está temporariamente indisponível."
        >
          <CentralDoDiaList itens={dados.atividadeRecente} formatarValor={formatarValor} onNavigate={abrirOrigem} />
        </CentralDoDiaBlock>
      </div>
    </section>
  )
}
