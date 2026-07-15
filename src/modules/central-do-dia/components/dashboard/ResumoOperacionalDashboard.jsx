import { ResumoOperacionalItem } from './ResumoOperacionalItem.jsx'
import './ResumoOperacionalDashboard.css'

const CONTADORES = Object.freeze([
  ['vencidos', 'Vencidos'],
  ['hoje', 'Hoje'],
  ['proximosSeteDias', '7 dias'],
  ['excecoes', 'Exceções'],
  ['pessoas', 'Pessoas']
])

export function ResumoOperacionalDashboard({
  empresaId,
  carregando,
  erroParcial,
  formatarValor,
  dados,
  onAtualizar,
  onAbrirAgenda,
  onAbrirOrigem
}) {
  const resumo = dados?.resumoDashboard || { contadores: {}, prioridades: [], possuiDados: false }
  const prioridades = resumo.prioridades || []

  return (
    <section className="resumo-operacional-dashboard" aria-labelledby="resumo-operacional-dashboard-titulo">
      <header className="resumo-operacional-dashboard-cabecalho">
        <div>
          <span className="resumo-operacional-dashboard-kicker">Prioridades da operação</span>
          <h2 id="resumo-operacional-dashboard-titulo">Resumo operacional</h2>
          <p>Uma visão rápida do que merece atenção.</p>
        </div>
        <div className="resumo-operacional-dashboard-acoes">
          <button type="button" className="dashboard-home-action dashboard-home-action-secondary" onClick={onAtualizar} disabled={!empresaId || dados?.atualizando}>
            {dados?.atualizando ? 'Atualizando…' : 'Atualizar contas e notas'}
          </button>
          <button type="button" className="dashboard-home-action dashboard-home-action-primary" onClick={onAbrirAgenda}>
            Abrir Agenda
          </button>
        </div>
      </header>

      {!empresaId && <p className="resumo-operacional-dashboard-estado" role="status">Selecione uma empresa para visualizar o resumo.</p>}
      {empresaId && carregando && <p className="resumo-operacional-dashboard-estado" role="status">Carregando resumo operacional…</p>}
      {empresaId && !carregando && erroParcial && (
        <p className="resumo-operacional-dashboard-alerta" role="alert">Parte das informações está indisponível. Os demais dados continuam visíveis.</p>
      )}

      {empresaId && !carregando && (
        <>
          <div className="resumo-operacional-dashboard-contadores" aria-label="Contadores operacionais">
            {CONTADORES.map(([chave, rotulo]) => (
              <div className="resumo-operacional-dashboard-contador" key={chave}>
                <span>{rotulo}</span>
                <strong>{Number(resumo.contadores?.[chave]) || 0}</strong>
              </div>
            ))}
          </div>

          <div className="resumo-operacional-dashboard-atencao">
            <div className="resumo-operacional-dashboard-subtitulo">
              <h3>Atenção primeiro</h3>
              <span>Até três prioridades</span>
            </div>
            {prioridades.length ? (
              <div className="resumo-operacional-dashboard-lista">
                {prioridades.map((item) => (
                  <ResumoOperacionalItem key={item.id} item={item} formatarValor={formatarValor} onAbrirOrigem={onAbrirOrigem} />
                ))}
              </div>
            ) : (
              <p className="resumo-operacional-dashboard-vazio">
                {resumo.possuiDados ? 'Nenhuma prioridade imediata.' : 'Nenhuma pendência operacional identificada.'}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
