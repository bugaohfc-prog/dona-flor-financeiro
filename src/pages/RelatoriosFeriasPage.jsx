import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { supabase } from '../lib/supabase'
import {
  calcularSaldoDiasFerias,
  calcularStatusCicloFerias,
  listarCiclosFerias,
  listarPeriodosFerias
} from '../services/funcionariosFeriasService'
import { mensagemSeguraErro } from '../utils/session'

const STATUS_CICLO_LABELS = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  agendada: 'Agendada',
  concluida: 'Concluída',
  vencida: 'Vencida',
  cancelada: 'Cancelada'
}

const LIMITE_INICIAL_LISTA = 5

function normalizarDataISO(data) {
  const texto = String(data || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return ''
  return texto
}

function criarDataLocal(data) {
  const texto = normalizarDataISO(data)
  if (!texto) return null

  const dataLocal = new Date(`${texto}T00:00:00`)
  if (Number.isNaN(dataLocal.getTime())) return null
  return dataLocal
}

function formatarDataCurta(data) {
  const dataLocal = criarDataLocal(data)
  if (!dataLocal) return 'Não informada'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dataLocal)
}

function formatarDataISO(dataUTC) {
  return [
    dataUTC.getUTCFullYear(),
    String(dataUTC.getUTCMonth() + 1).padStart(2, '0'),
    String(dataUTC.getUTCDate()).padStart(2, '0')
  ].join('-')
}

function somarDiasISO(dataISO, dias) {
  const texto = normalizarDataISO(dataISO)
  if (!texto) return ''

  const [ano, mes, dia] = texto.split('-').map(Number)
  const dataUTC = new Date(Date.UTC(ano, mes - 1, dia))
  dataUTC.setUTCDate(dataUTC.getUTCDate() + dias)
  return formatarDataISO(dataUTC)
}

function obterHojeISO() {
  const hoje = new Date()
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')
}

function formatarStatus(status) {
  return STATUS_CICLO_LABELS[status] || status || 'Não informado'
}

function obterDataOrdenacao(item, campo) {
  return String(item?.[campo] || item?.ciclo?.[campo] || item?.periodo?.[campo] || '')
}

function ordenarPorData(lista, campo, ascendente = true) {
  return [...lista].sort((a, b) => {
    const dataA = obterDataOrdenacao(a, campo)
    const dataB = obterDataOrdenacao(b, campo)
    if (dataA === dataB) return String(a.funcionario?.nome || '').localeCompare(String(b.funcionario?.nome || ''), 'pt-BR')
    return ascendente ? dataA.localeCompare(dataB) : dataB.localeCompare(dataA)
  })
}

function obterStatusVisualPeriodo(periodo) {
  if (!periodo) return 'Não informado'
  if (periodo.status === 'concluida') return 'Concluída'
  if (periodo.status === 'cancelada') return 'Cancelada'

  const retorno = normalizarDataISO(periodo.data_retorno_trabalho)
  if (periodo.status === 'agendada' && retorno && retorno < obterHojeISO()) {
    return 'Concluída (calculado)'
  }

  return 'Agendada'
}

function periodoEstaAgendado(periodo) {
  const retorno = normalizarDataISO(periodo.data_retorno_trabalho)
  return periodo?.status === 'agendada' && retorno && retorno >= obterHojeISO()
}

function periodoEstaConcluidoVisualmente(periodo) {
  const retorno = normalizarDataISO(periodo.data_retorno_trabalho)
  return periodo?.status === 'concluida' || (periodo?.status === 'agendada' && retorno && retorno < obterHojeISO())
}

function ResumoCard({ label, valor, detalhe }) {
  return (
    <article className="ferias-report-card">
      <span>{label}</span>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}

function SecaoRelatorio({
  titulo,
  descricao,
  vazio,
  total = 0,
  aberta = true,
  expandida = false,
  visivel = true,
  onAlternarAberta,
  onAlternarExpandida,
  children
}) {
  if (!visivel) return null

  return (
    <section className="ferias-report-section">
      <div className="ferias-report-section-header">
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>
        <button className="ferias-report-toggle" type="button" onClick={onAlternarAberta}>
          {aberta ? 'Recolher' : 'Abrir'}
        </button>
      </div>
      {aberta && (
        <>
          {children || (
            <div className="ferias-report-empty">
              <strong>Sem dados para exibir</strong>
              <p>{vazio}</p>
            </div>
          )}
          {total > LIMITE_INICIAL_LISTA && (
            <button className="ferias-report-more" type="button" onClick={onAlternarExpandida}>
              {expandida ? 'Ver menos' : `Ver mais (${total - LIMITE_INICIAL_LISTA})`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

function LinhaCiclo({ item, tipo }) {
  return (
    <article className={`ferias-report-row ${tipo === 'alerta' ? 'is-alert' : ''}`}>
      <div>
        <h3>{item.funcionario.nome || 'Colaborador sem nome'}</h3>
        <small>{item.funcionario.cargo || 'Cargo não informado'}</small>
      </div>
      <div className="ferias-report-row-meta">
        <strong>{formatarDataCurta(item.ciclo.data_limite_gozo)}</strong>
        <small>Período: {formatarDataCurta(item.ciclo.periodo_aquisitivo_inicio)} a {formatarDataCurta(item.ciclo.periodo_aquisitivo_fim)}</small>
        <small>Saldo: {item.saldo} dia(s) • {formatarStatus(item.statusCalculado)}</small>
        {tipo === 'alerta' && <small>Atenção a partir de: {formatarDataCurta(item.dataAtencao)}</small>}
      </div>
    </article>
  )
}

function LinhaPeriodo({ item }) {
  return (
    <article className="ferias-report-row">
      <div>
        <h3>{item.funcionario.nome || 'Colaborador sem nome'}</h3>
        <small>{item.funcionario.cargo || 'Cargo não informado'}</small>
      </div>
      <div className="ferias-report-row-meta">
        <strong>{obterStatusVisualPeriodo(item.periodo)}</strong>
        <small>Início: {formatarDataCurta(item.periodo.data_inicio)} • Fim: {formatarDataCurta(item.periodo.data_fim_calculada)}</small>
        <small>Retorno: {formatarDataCurta(item.periodo.data_retorno_trabalho)} • {item.periodo.quantidade_dias} dia(s)</small>
      </div>
    </article>
  )
}

export default function RelatoriosFeriasPage({
  styles,
  empresaId,
  empresaNome,
  voltarPainel
}) {
  const [dadosFerias, setDadosFerias] = useState([])
  const [loadingFerias, setLoadingFerias] = useState(false)
  const [erroFerias, setErroFerias] = useState(null)
  const [filtroSecao, setFiltroSecao] = useState('todos')
  const [secoesAbertas, setSecoesAbertas] = useState({
    vencidas: true,
    aVencer: true,
    agendadas: true,
    concluidas: true,
    saldos: true
  })
  const [listasExpandidas, setListasExpandidas] = useState({})

  const {
    funcionarios,
    loading,
    erro,
    carregarFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: false
  })

  const funcionariosAtivos = useMemo(() => {
    return (Array.isArray(funcionarios) ? funcionarios : []).filter((funcionario) => !funcionario.arquivado)
  }, [funcionarios])

  useEffect(() => {
    let cancelado = false

    setDadosFerias([])
    setErroFerias(null)

    if (!empresaId || loading || funcionariosAtivos.length === 0) {
      setLoadingFerias(false)
      return () => {
        cancelado = true
      }
    }

    async function carregarFerias() {
      setLoadingFerias(true)

      try {
        const resultadosFuncionarios = await Promise.all(
          funcionariosAtivos
            .filter((funcionario) => funcionario?.id)
            .map(async (funcionario) => {
              const { data: ciclos, error: erroCiclos } = await listarCiclosFerias({
                supabase,
                empresaId,
                funcionarioId: funcionario.id,
                incluirArquivados: false
              })

              if (erroCiclos) throw erroCiclos

              const ciclosComPeriodos = await Promise.all(
                (ciclos || []).map(async (ciclo) => {
                  const { data: periodos, error: erroPeriodos } = await listarPeriodosFerias({
                    supabase,
                    empresaId,
                    cicloId: ciclo.id,
                    funcionarioId: funcionario.id,
                    incluirArquivados: false
                  })

                  if (erroPeriodos) throw erroPeriodos
                  return { ciclo, periodos: periodos || [] }
                })
              )

              return { funcionario, ciclos: ciclosComPeriodos }
            })
        )

        if (!cancelado) setDadosFerias(resultadosFuncionarios)
      } catch (error) {
        if (!cancelado) {
          setDadosFerias([])
          setErroFerias(mensagemSeguraErro(error, 'Não foi possível carregar os relatórios de férias.'))
        }
      } finally {
        if (!cancelado) setLoadingFerias(false)
      }
    }

    carregarFerias()

    return () => {
      cancelado = true
    }
  }, [empresaId, funcionariosAtivos, loading])

  const relatorio = useMemo(() => {
    const hoje = obterHojeISO()
    const ciclos = []
    const periodos = []

    dadosFerias.forEach(({ funcionario, ciclos: ciclosFuncionario }) => {
      ;(ciclosFuncionario || []).forEach(({ ciclo, periodos: periodosCiclo }) => {
        const periodosAtivos = (periodosCiclo || []).filter((periodo) => !periodo.arquivado && periodo.status !== 'cancelada')
        const saldo = calcularSaldoDiasFerias({
          diasDireito: ciclo.dias_direito || 30,
          periodosAtivos
        })
        const statusCalculado = calcularStatusCicloFerias({
          diasDireito: ciclo.dias_direito || 30,
          periodosAtivos,
          dataLimiteGozo: ciclo.data_limite_gozo
        })
        const diasLancados = periodosAtivos.reduce((total, periodo) => total + Number(periodo.quantidade_dias || 0), 0)
        const dataAtencao = somarDiasISO(ciclo.data_limite_gozo, -30)

        ciclos.push({
          funcionario,
          ciclo,
          periodosAtivos,
          saldo,
          statusCalculado,
          diasLancados,
          dataAtencao,
          emAlerta: Boolean(dataAtencao && dataAtencao <= hoje && ciclo.data_limite_gozo >= hoje)
        })

        periodosAtivos.forEach((periodo) => {
          periodos.push({ funcionario, ciclo, periodo })
        })
      })
    })

    const ciclosComSaldo = ciclos.filter((item) => item.saldo > 0)
    const vencidas = ordenarPorData(
      ciclosComSaldo.filter((item) => item.ciclo.data_limite_gozo && item.ciclo.data_limite_gozo < hoje),
      'data_limite_gozo'
    )
    const aVencer = ordenarPorData(
      ciclosComSaldo.filter((item) => item.ciclo.data_limite_gozo && item.ciclo.data_limite_gozo >= hoje),
      'data_limite_gozo'
    )
    const agendadas = ordenarPorData(
      periodos.filter((item) => periodoEstaAgendado(item.periodo)),
      'data_inicio'
    )
    const concluidas = ordenarPorData(
      periodos.filter((item) => periodoEstaConcluidoVisualmente(item.periodo)),
      'data_retorno_trabalho',
      false
    )
    const saldos = ordenarPorData(ciclos, 'data_limite_gozo')
    const funcionariosComSaldo = new Set(ciclosComSaldo.map((item) => item.funcionario.id)).size

    return {
      resumo: {
        ciclosAtivos: ciclos.length,
        vencidas: vencidas.length,
        aVencer: aVencer.length,
        agendadas: agendadas.length,
        concluidas: concluidas.length,
        funcionariosComSaldo
      },
      vencidas,
      aVencer,
      agendadas,
      concluidas,
      saldos
    }
  }, [dadosFerias])

  function alternarSecao(chave) {
    setSecoesAbertas((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  function alternarLista(chave) {
    setListasExpandidas((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  function listaVisivel(chave, lista) {
    return listasExpandidas[chave] ? lista : lista.slice(0, LIMITE_INICIAL_LISTA)
  }

  function deveMostrarSecao(chave) {
    return filtroSecao === 'todos' || filtroSecao === chave
  }

  return (
    <div className="ferias-report-page">
      <style>{`
        .ferias-report-page { display: grid; gap: 18px; }
        .ferias-report-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .ferias-report-card {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 18px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          display: grid;
          gap: 6px;
        }
        .ferias-report-card span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .ferias-report-card strong { color: #0f172a; font-size: 28px; line-height: 1; }
        .ferias-report-card small { color: #64748b; line-height: 1.35; }
        .ferias-report-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .ferias-report-section {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 20px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          min-width: 0;
        }
        .ferias-report-section-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .ferias-report-section h2 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 17px;
        }
        .ferias-report-section p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }
        .ferias-report-filters {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 18px;
          background: #ffffff;
          padding: 12px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: end;
        }
        .ferias-report-filter {
          display: grid;
          gap: 6px;
          min-width: 210px;
        }
        .ferias-report-filter span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .ferias-report-filter select {
          border: 1px solid rgba(15, 23, 42, .14);
          border-radius: 12px;
          min-height: 40px;
          padding: 8px 10px;
          color: #0f172a;
          background: #ffffff;
        }
        .ferias-report-toggle,
        .ferias-report-more {
          border: 1px solid rgba(15, 23, 42, .12);
          border-radius: 12px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 800;
          min-height: 34px;
          padding: 8px 11px;
          cursor: pointer;
        }
        .ferias-report-more {
          margin-top: 10px;
          width: 100%;
          background: #f8fafc;
        }
        .ferias-report-list { display: grid; gap: 10px; }
        .ferias-report-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, auto);
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .06);
          border-radius: 14px;
          background: #f8fafc;
          padding: 12px;
        }
        .ferias-report-row.is-alert {
          border-color: rgba(245, 158, 11, .36);
          background: #fffbeb;
        }
        .ferias-report-row h3 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 14px;
        }
        .ferias-report-row small,
        .ferias-report-row-meta small {
          color: #64748b;
          line-height: 1.35;
        }
        .ferias-report-row-meta {
          display: grid;
          gap: 4px;
          justify-items: end;
          text-align: right;
        }
        .ferias-report-row-meta strong {
          color: #0f766e;
          font-size: 13px;
        }
        .ferias-report-empty {
          border: 1px dashed rgba(15, 23, 42, .16);
          border-radius: 14px;
          background: #f8fafc;
          padding: 14px;
          color: #64748b;
        }
        .ferias-report-empty strong {
          display: block;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ferias-report-note {
          border: 1px solid rgba(13, 148, 136, .18);
          border-radius: 16px;
          background: #f0fdfa;
          color: #115e59;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.45;
        }
        @media (max-width: 980px) {
          .ferias-report-grid,
          .ferias-report-columns,
          .ferias-report-row {
            grid-template-columns: 1fr;
          }
          .ferias-report-row-meta {
            justify-items: start;
            text-align: left;
          }
          .ferias-report-section-header {
            align-items: stretch;
          }
          .ferias-report-toggle {
            width: 100%;
          }
          .ferias-report-filters {
            display: grid;
          }
          .ferias-report-filter {
            min-width: 0;
          }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Relatórios de Férias</h1>
          <p style={styles.textoNota}>Visão interna de vencimentos, saldos e períodos por empresa ativa, sem exportação de dados.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Painel</button>
      </div>

      {!empresaId ? (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Empresa ativa necessária</strong>
            <p>Selecione uma empresa para carregar os relatórios de férias.</p>
          </div>
        </section>
      ) : loading || loadingFerias ? (
        <section style={styles.cardConfiguracao}>
          <p style={styles.textoNota}>Carregando relatórios de férias...</p>
        </section>
      ) : erro || erroFerias ? (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Não foi possível carregar</strong>
            <p>{erro || erroFerias}</p>
            <button style={styles.btnCinza} type="button" onClick={() => carregarFuncionarios()}>
              Tentar novamente
            </button>
          </div>
        </section>
      ) : funcionariosAtivos.length === 0 ? (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">🌴</div>
            <strong>Nenhum funcionário ativo</strong>
            <p>Cadastre funcionários antes de consultar relatórios internos de férias.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="ferias-report-grid" aria-label="Resumo de férias">
            <ResumoCard label="Ciclos ativos" valor={relatorio.resumo.ciclosAtivos} detalhe="Ciclos não arquivados" />
            <ResumoCard label="Férias vencidas" valor={relatorio.resumo.vencidas} detalhe="Com saldo e limite ultrapassado" />
            <ResumoCard label="Férias a vencer" valor={relatorio.resumo.aVencer} detalhe="Com saldo e limite futuro" />
            <ResumoCard label="Férias agendadas" valor={relatorio.resumo.agendadas} detalhe="Períodos ativos em aberto" />
            <ResumoCard label="Férias concluídas" valor={relatorio.resumo.concluidas} detalhe="Inclui conclusão calculada" />
            <ResumoCard label="Com saldo" valor={relatorio.resumo.funcionariosComSaldo} detalhe="Colaboradores com saldo pendente" />
          </section>

          <section className="ferias-report-filters" aria-label="Filtros locais dos relatorios de ferias">
            <label className="ferias-report-filter">
              <span>Secao</span>
              <select value={filtroSecao} onChange={(event) => setFiltroSecao(event.target.value)}>
                <option value="todos">Todas as secoes</option>
                <option value="vencidas">Ferias vencidas</option>
                <option value="aVencer">Ferias a vencer</option>
                <option value="agendadas">Ferias agendadas</option>
                <option value="concluidas">Ferias concluidas</option>
                <option value="saldos">Saldos por colaborador</option>
              </select>
            </label>
          </section>

          <div className="ferias-report-columns">
            <SecaoRelatorio
              titulo="Férias vencidas"
              descricao="Ciclos com saldo restante e limite de gozo anterior à data atual."
              vazio="Nenhuma férias vencida encontrada."
              total={relatorio.vencidas.length}
              aberta={secoesAbertas.vencidas}
              expandida={Boolean(listasExpandidas.vencidas)}
              visivel={deveMostrarSecao('vencidas')}
              onAlternarAberta={() => alternarSecao('vencidas')}
              onAlternarExpandida={() => alternarLista('vencidas')}
            >
              {relatorio.vencidas.length > 0 && (
                <div className="ferias-report-list">
                  {listaVisivel('vencidas', relatorio.vencidas).map((item) => (
                    <LinhaCiclo key={item.ciclo.id} item={item} />
                  ))}
                </div>
              )}
            </SecaoRelatorio>

            <SecaoRelatorio
              titulo="Férias a vencer"
              descricao="Ciclos com saldo restante e limite de gozo futuro. Itens em atenção destacam o prazo interno de 30 dias."
              vazio="Nenhuma férias a vencer encontrada."
              total={relatorio.aVencer.length}
              aberta={secoesAbertas.aVencer}
              expandida={Boolean(listasExpandidas.aVencer)}
              visivel={deveMostrarSecao('aVencer')}
              onAlternarAberta={() => alternarSecao('aVencer')}
              onAlternarExpandida={() => alternarLista('aVencer')}
            >
              {relatorio.aVencer.length > 0 && (
                <div className="ferias-report-list">
                  {listaVisivel('aVencer', relatorio.aVencer).map((item) => (
                    <LinhaCiclo key={item.ciclo.id} item={item} tipo={item.emAlerta ? 'alerta' : ''} />
                  ))}
                </div>
              )}
            </SecaoRelatorio>
          </div>

          <div className="ferias-report-columns">
            <SecaoRelatorio
              titulo="Férias agendadas"
              descricao="Períodos ativos com status agendada e retorno ao trabalho ainda não ultrapassado."
              vazio="Nenhuma férias agendada encontrada."
              total={relatorio.agendadas.length}
              aberta={secoesAbertas.agendadas}
              expandida={Boolean(listasExpandidas.agendadas)}
              visivel={deveMostrarSecao('agendadas')}
              onAlternarAberta={() => alternarSecao('agendadas')}
              onAlternarExpandida={() => alternarLista('agendadas')}
            >
              {relatorio.agendadas.length > 0 && (
                <div className="ferias-report-list">
                  {listaVisivel('agendadas', relatorio.agendadas).map((item) => (
                    <LinhaPeriodo key={item.periodo.id} item={item} />
                  ))}
                </div>
              )}
            </SecaoRelatorio>

            <SecaoRelatorio
              titulo="Férias concluídas"
              descricao="Períodos concluídos ou agendados com retorno já ultrapassado, sem atualização automática no banco."
              vazio="Nenhuma férias concluída encontrada."
              total={relatorio.concluidas.length}
              aberta={secoesAbertas.concluidas}
              expandida={Boolean(listasExpandidas.concluidas)}
              visivel={deveMostrarSecao('concluidas')}
              onAlternarAberta={() => alternarSecao('concluidas')}
              onAlternarExpandida={() => alternarLista('concluidas')}
            >
              {relatorio.concluidas.length > 0 && (
                <div className="ferias-report-list">
                  {listaVisivel('concluidas', relatorio.concluidas).map((item) => (
                    <LinhaPeriodo key={item.periodo.id} item={item} />
                  ))}
                </div>
              )}
            </SecaoRelatorio>
          </div>

          <SecaoRelatorio
            titulo="Saldos por colaborador"
            descricao="Ciclos ativos com dias de direito, dias lançados, saldo restante e status calculado."
            vazio="Nenhum ciclo ativo encontrado para exibir saldo."
            total={relatorio.saldos.length}
            aberta={secoesAbertas.saldos}
            expandida={Boolean(listasExpandidas.saldos)}
            visivel={deveMostrarSecao('saldos')}
            onAlternarAberta={() => alternarSecao('saldos')}
            onAlternarExpandida={() => alternarLista('saldos')}
          >
            {relatorio.saldos.length > 0 && (
              <div className="ferias-report-list">
                {listaVisivel('saldos', relatorio.saldos).map((item) => (
                  <article key={item.ciclo.id} className="ferias-report-row">
                    <div>
                      <h3>{item.funcionario.nome || 'Colaborador sem nome'}</h3>
                      <small>{item.funcionario.cargo || 'Cargo não informado'}</small>
                    </div>
                    <div className="ferias-report-row-meta">
                      <strong>{item.saldo} dia(s) de saldo</strong>
                      <small>Direito: {item.ciclo.dias_direito || 30} • Lançados: {item.diasLancados}</small>
                      <small>{formatarDataCurta(item.ciclo.periodo_aquisitivo_inicio)} a {formatarDataCurta(item.ciclo.periodo_aquisitivo_fim)} • {formatarStatus(item.statusCalculado)}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SecaoRelatorio>

          <div className="ferias-report-note">
            Relatórios internos somente para consulta visual. Não há PDF, Excel, CSV, impressão, anexos, documentos,
            valores financeiros, conta a pagar, integração financeira, observações sensíveis ou atualização automática de status.
          </div>
        </>
      )}
    </div>
  )
}
