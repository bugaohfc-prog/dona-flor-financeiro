import { useEffect, useState } from 'react'
import { useObrigacoesOperacionais } from '../../hooks/useObrigacoesOperacionais.js'
import './ObrigacoesOperacionaisPanel.css'

const FILTROS = [
  ['acao', 'Precisa de ação'],
  ['espera', 'Aguardando terceiros'],
  ['minhas', 'Minhas'],
  ['sem_responsavel', 'Sem responsável'],
  ['resolvidas', 'Resolvidas']
]

const hojeISO = () => new Date().toISOString().slice(0, 10)

function nomeResponsavel(item) {
  return item.responsavel?.nome || item.responsavel?.email || 'Sem responsável'
}

function rotuloEstado(estado) {
  return {
    ABERTA: 'Aberta',
    AGUARDANDO_TERCEIRO: 'Aguardando terceiro',
    RESOLVIDA: 'Resolvida',
    CANCELADA: 'Cancelada'
  }[estado] || estado
}

export default function ObrigacoesOperacionaisPanel({ empresaId, filtroInicial = 'acao', onAbrirDesligamento }) {
  const [filtro, setFiltro] = useState(filtroInicial)
  const [rascunhos, setRascunhos] = useState({})
  const [historicos, setHistoricos] = useState({})
  const fonte = useObrigacoesOperacionais({ empresaId, filtro })

  useEffect(() => {
    if (FILTROS.some(([id]) => id === filtroInicial)) setFiltro(filtroInicial)
  }, [filtroInicial])

  function atualizarRascunho(id, campo, valor) {
    setRascunhos((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }))
  }

  async function carregarHistorico(id) {
    if (historicos[id]) {
      setHistoricos((atual) => ({ ...atual, [id]: null }))
      return
    }
    try {
      const eventos = await fonte.listarHistorico(id)
      setHistoricos((atual) => ({ ...atual, [id]: eventos }))
    } catch {
      setHistoricos((atual) => ({ ...atual, [id]: [] }))
    }
  }

  return (
    <section className="obrigacoes-operacionais" aria-labelledby="obrigacoes-operacionais-titulo">
      <header className="obrigacoes-operacionais-cabecalho">
        <div>
          <span>Acompanhamento</span>
          <h2 id="obrigacoes-operacionais-titulo">Pendências para acompanhar</h2>
          <p>Veja o que precisa ser feito, quem é o responsável e acompanhe até a resolução.</p>
        </div>
        <button type="button" className="outline" onClick={fonte.carregar} disabled={fonte.carregando}>Atualizar</button>
      </header>

      <nav className="obrigacoes-operacionais-filtros" aria-label="Filtrar obrigações operacionais">
        {FILTROS.map(([id, rotulo]) => (
          <button type="button" key={id} className={filtro === id ? 'ativo' : ''} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
            {rotulo}
          </button>
        ))}
      </nav>

      {fonte.erro && <p className="obrigacoes-operacionais-erro" role="alert">{fonte.erro}</p>}
      {fonte.carregando ? (
        <p className="obrigacoes-operacionais-estado" role="status">Carregando obrigações…</p>
      ) : fonte.filtradas.length === 0 ? (
        <div className="obrigacoes-operacionais-estado" role="status">
          <strong>Tudo certo por aqui.</strong>
          <p>Quando o sistema identificar algo que precisa de acompanhamento, vai aparecer nesta Central.</p>
          <p>Você poderá ver quem é o responsável, o que precisa ser feito e acompanhar até a resolução.</p>
        </div>
      ) : (
        <div className="obrigacoes-operacionais-lista">
          {fonte.filtradas.map((item) => {
            const rascunho = rascunhos[item.id] || {}
            const ativa = ['ABERTA', 'AGUARDANDO_TERCEIRO'].includes(item.estado)
            const salvando = fonte.salvandoId === item.id
            return (
              <article className="obrigacao-operacional-card" key={item.id}>
                <div className="obrigacao-operacional-topo">
                  <span className={`obrigacao-operacional-estado obrigacao-operacional-estado-${item.estado.toLowerCase()}`}>{rotuloEstado(item.estado)}</span>
                  <span>{item.severidade === 'MODERADA' ? 'Moderada' : item.severidade}</span>
                </div>
                <h3>{item.titulo_snapshot}</h3>
                {item.proxima_acao && <p>{item.proxima_acao}</p>}
                <dl>
                  <div><dt>Funcionário</dt><dd>{item.funcionario?.nome || 'Não identificado'}</dd></div>
                  <div><dt>Responsável</dt><dd>{nomeResponsavel(item)}</dd></div>
                  {item.terceiro_aguardado && <div><dt>Aguardando</dt><dd>{item.terceiro_aguardado}</dd></div>}
                  {item.proxima_revisao_em && <div><dt>Revisar em</dt><dd>{item.proxima_revisao_em}</dd></div>}
                  {item.resultado_resolucao && <div><dt>Resultado</dt><dd>{item.resultado_resolucao.replaceAll('_', ' ')}</dd></div>}
                </dl>

                <div className="obrigacao-operacional-acoes-principais">
                  <button type="button" onClick={() => onAbrirDesligamento?.(item)}>Abrir desligamento</button>
                  <button type="button" className="outline" onClick={() => carregarHistorico(item.id)}>Histórico</button>
                </div>

                {ativa && (
                  <details className="obrigacao-operacional-edicao">
                    <summary>Atualizar acompanhamento</summary>
                    <div className="obrigacao-operacional-campos">
                      <label>
                        <span>Responsável</span>
                        <select value={rascunho.responsavelId ?? item.responsavel_usuario_empresa_id ?? ''} onChange={(e) => atualizarRascunho(item.id, 'responsavelId', e.target.value)}>
                          <option value="">Selecione</option>
                          {fonte.usuariosElegiveis.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome || usuario.email}</option>)}
                        </select>
                      </label>
                      <button type="button" disabled={salvando || !rascunho.responsavelId} onClick={() => fonte.reatribuir(item.id, rascunho.responsavelId)}>Salvar responsável</button>

                      <label>
                        <span>Terceiro aguardado</span>
                        <input value={rascunho.terceiro ?? item.terceiro_aguardado ?? ''} onChange={(e) => atualizarRascunho(item.id, 'terceiro', e.target.value)} placeholder="Ex.: Contabilidade" />
                      </label>
                      <label>
                        <span>Próxima revisão</span>
                        <input type="date" min={hojeISO()} value={rascunho.revisao ?? item.proxima_revisao_em ?? ''} onChange={(e) => atualizarRascunho(item.id, 'revisao', e.target.value)} />
                      </label>
                      <button type="button" disabled={salvando} onClick={() => fonte.acompanhar(item.id, { estado: 'AGUARDANDO_TERCEIRO', terceiroAguardado: rascunho.terceiro ?? item.terceiro_aguardado, proximaRevisaoEm: rascunho.revisao ?? item.proxima_revisao_em })}>Aguardar terceiro</button>
                      <button type="button" className="outline" disabled={salvando} onClick={() => fonte.acompanhar(item.id, { estado: 'ABERTA', removerSnooze: true })}>Voltar para aberta</button>

                      <div className="obrigacao-operacional-snooze" aria-label="Adiar obrigação">
                        <button type="button" className="outline" disabled={salvando} onClick={() => fonte.acompanhar(item.id, { estado: item.estado, terceiroAguardado: item.terceiro_aguardado, proximaRevisaoEm: item.proxima_revisao_em, snoozeMinutos: 30 })}>Adiar 30 min</button>
                        <button type="button" className="outline" disabled={salvando} onClick={() => fonte.acompanhar(item.id, { estado: item.estado, terceiroAguardado: item.terceiro_aguardado, proximaRevisaoEm: item.proxima_revisao_em, snoozeMinutos: 60 })}>Adiar 1 h</button>
                        <button type="button" className="outline" disabled={salvando} onClick={() => fonte.acompanhar(item.id, { estado: item.estado, terceiroAguardado: item.terceiro_aguardado, proximaRevisaoEm: item.proxima_revisao_em, removerSnooze: true })}>Remover adiamento</button>
                      </div>

                      <label>
                        <span>Resultado</span>
                        <select value={rascunho.resultado || 'CUMPRIDA'} onChange={(e) => atualizarRascunho(item.id, 'resultado', e.target.value)}>
                          <option value="CUMPRIDA">Cumprida</option>
                          <option value="NAO_APLICAVEL">Não aplicável</option>
                          <option value="DISPENSADA">Dispensada</option>
                        </select>
                      </label>
                      <label>
                        <span>Motivo {['NAO_APLICAVEL', 'DISPENSADA'].includes(rascunho.resultado) ? '(obrigatório)' : '(opcional)'}</span>
                        <textarea value={rascunho.motivo || ''} onChange={(e) => atualizarRascunho(item.id, 'motivo', e.target.value)} rows="2" />
                      </label>
                      <button type="button" disabled={salvando} onClick={() => fonte.resolver(item.id, { resultado: rascunho.resultado || 'CUMPRIDA', motivo: rascunho.motivo })}>Resolver obrigação</button>
                    </div>
                  </details>
                )}

                {historicos[item.id] && (
                  <div className="obrigacao-operacional-historico">
                    <strong>Histórico</strong>
                    {historicos[item.id].length === 0 ? <p>Nenhum evento encontrado.</p> : (
                      <ul>{historicos[item.id].map((evento) => <li key={evento.id}>{evento.acao} · {new Date(evento.criado_em).toLocaleString('pt-BR')}</li>)}</ul>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
