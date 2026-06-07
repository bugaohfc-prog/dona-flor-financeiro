import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { supabase } from '../lib/supabase'
import {
  calcularProximoPeriodico,
  listarExamesPeriodicos
} from '../services/funcionariosExamesPeriodicosService'
import {
  calcularSaldoDiasFerias,
  calcularStatusCicloFerias,
  listarCiclosFerias,
  listarPeriodosFerias
} from '../services/funcionariosFeriasService'
import { mensagemSeguraErro } from '../utils/session'
import RelatoriosPessoasPage from './RelatoriosPessoasPage'
import RelatoriosFeriasPage from './RelatoriosFeriasPage'

const ABAS = [
  { id: 'visao-geral', label: 'Visao geral' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'ferias', label: 'Ferias' }
]

const RESUMO_INICIAL = Object.freeze({
  feriasVencidas: 0,
  feriasAVencer: 0,
  feriasAgendadas: 0,
  examesPrevistos: 0
})

function hojeISO() {
  const hoje = new Date()
  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0')
  ].join('-')
}

function somarDiasISO(dataISO, dias) {
  if (!dataISO) return ''
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return ''

  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + dias)

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-')
}

function obterUltimoExamePeriodicoAtivo(exames = []) {
  return [...exames]
    .filter((exame) => exame?.data_exame && !exame.arquivado)
    .sort((a, b) => String(b.data_exame || '').localeCompare(String(a.data_exame || '')))[0] || null
}

function funcionarioAtivo(funcionario) {
  return !funcionario?.arquivado && funcionario?.status === 'ativo'
}

function calcularResumoFuncionarios(funcionarios = []) {
  const lista = Array.isArray(funcionarios) ? funcionarios : []
  const naoArquivados = lista.filter((funcionario) => !funcionario.arquivado)

  return {
    ativos: naoArquivados.filter((funcionario) => funcionario.status === 'ativo').length,
    afastados: naoArquivados.filter((funcionario) => funcionario.status === 'afastado').length,
    desligados: naoArquivados.filter((funcionario) => funcionario.status === 'desligado').length,
    arquivados: lista.filter((funcionario) => funcionario.arquivado).length,
    ativosLista: naoArquivados.filter(funcionarioAtivo)
  }
}

function IndicadorCard({ label, valor, detalhe }) {
  return (
    <article className="people-report-overview-card">
      <span>{label}</span>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}

export default function RelatoriosGestaoPessoasPage({
  styles,
  empresaId,
  empresaNome,
  voltarPainel
}) {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral')
  const [resumoOperacional, setResumoOperacional] = useState(RESUMO_INICIAL)
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [erroResumo, setErroResumo] = useState(null)

  const {
    funcionarios,
    loading,
    erro,
    carregarFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: true,
    autoCarregar: abaAtiva === 'visao-geral'
  })

  const resumoFuncionarios = useMemo(() => calcularResumoFuncionarios(funcionarios), [funcionarios])

  useEffect(() => {
    let cancelado = false
    const funcionariosAtivos = resumoFuncionarios.ativosLista

    setResumoOperacional(RESUMO_INICIAL)
    setErroResumo(null)

    if (abaAtiva !== 'visao-geral' || !empresaId || loading || funcionariosAtivos.length === 0) {
      setLoadingResumo(false)
      return () => {
        cancelado = true
      }
    }

    async function carregarResumoOperacional() {
      setLoadingResumo(true)

      try {
        const hoje = hojeISO()
        const limite30Dias = somarDiasISO(hoje, 30)
        let feriasVencidas = 0
        let feriasAVencer = 0
        let feriasAgendadas = 0
        let examesPrevistos = 0

        await Promise.all(funcionariosAtivos.map(async (funcionario) => {
          const { data: ciclos, error: erroCiclos } = await listarCiclosFerias({
            supabase,
            empresaId,
            funcionarioId: funcionario.id,
            incluirArquivados: false
          })

          if (erroCiclos) throw erroCiclos

          await Promise.all((ciclos || []).map(async (ciclo) => {
            const { data: periodos, error: erroPeriodos } = await listarPeriodosFerias({
              supabase,
              empresaId,
              cicloId: ciclo.id,
              funcionarioId: funcionario.id,
              incluirArquivados: false
            })

            if (erroPeriodos) throw erroPeriodos

            const periodosAtivos = (periodos || []).filter((periodo) => !periodo.arquivado && periodo.status !== 'cancelada')
            const saldo = calcularSaldoDiasFerias({
              diasDireito: ciclo.dias_direito || 30,
              periodosAtivos
            })
            const statusCalculado = calcularStatusCicloFerias({
              diasDireito: ciclo.dias_direito || 30,
              periodosAtivos,
              dataLimiteGozo: ciclo.data_limite_gozo
            })

            if (saldo > 0 && ciclo.data_limite_gozo && ciclo.data_limite_gozo < hoje) {
              feriasVencidas += 1
            } else if (saldo > 0 && ciclo.data_limite_gozo && ciclo.data_limite_gozo <= limite30Dias) {
              feriasAVencer += 1
            }

            feriasAgendadas += periodosAtivos.filter((periodo) => periodo.status === 'agendada').length
            if (statusCalculado === 'agendada' && saldo > 0) feriasAVencer += 0
          }))

          const { data: exames, error: erroExames } = await listarExamesPeriodicos({
            supabase,
            empresaId,
            funcionarioId: funcionario.id,
            incluirArquivados: false
          })

          if (erroExames) throw erroExames

          const ultimoPeriodico = obterUltimoExamePeriodicoAtivo(exames || [])
          const dataBase = ultimoPeriodico?.data_exame || funcionario.data_exame_admissional
          const proximoPeriodico = dataBase ? calcularProximoPeriodico(dataBase) : null
          if (proximoPeriodico && proximoPeriodico <= limite30Dias) examesPrevistos += 1
        }))

        if (!cancelado) {
          setResumoOperacional({
            feriasVencidas,
            feriasAVencer,
            feriasAgendadas,
            examesPrevistos
          })
        }
      } catch (error) {
        if (!cancelado) {
          setResumoOperacional(RESUMO_INICIAL)
          setErroResumo(mensagemSeguraErro(error, 'Nao foi possivel carregar a visao geral.'))
        }
      } finally {
        if (!cancelado) setLoadingResumo(false)
      }
    }

    carregarResumoOperacional()

    return () => {
      cancelado = true
    }
  }, [abaAtiva, empresaId, loading, resumoFuncionarios.ativosLista])

  function renderVisaoGeral() {
    if (!empresaId) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Empresa ativa necessaria</strong>
            <p>Selecione uma empresa para carregar os relatorios de Gestao de Pessoas.</p>
          </div>
        </section>
      )
    }

    if (loading || loadingResumo) {
      return (
        <section style={styles.cardConfiguracao}>
          <p style={styles.textoNota}>Carregando visao geral de Gestao de Pessoas...</p>
        </section>
      )
    }

    if (erro || erroResumo) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Nao foi possivel carregar</strong>
            <p>{erro || erroResumo}</p>
            <button style={styles.btnCinza} type="button" onClick={() => carregarFuncionarios()}>
              Tentar novamente
            </button>
          </div>
        </section>
      )
    }

    return (
      <>
        <section className="people-report-overview-grid" aria-label="Visao geral de pessoas">
          <IndicadorCard label="Colaboradores ativos" valor={resumoFuncionarios.ativos} detalhe="Nao arquivados" />
          <IndicadorCard label="Afastados" valor={resumoFuncionarios.afastados} detalhe="Status cadastral" />
          <IndicadorCard label="Desligados" valor={resumoFuncionarios.desligados} detalhe="Nao arquivados" />
          <IndicadorCard label="Arquivados" valor={resumoFuncionarios.arquivados} detalhe="Arquivamento logico" />
          <IndicadorCard label="Ferias vencidas" valor={resumoOperacional.feriasVencidas} detalhe="Ciclos com saldo vencido" />
          <IndicadorCard label="Ferias a vencer" valor={resumoOperacional.feriasAVencer} detalhe="Proximos 30 dias" />
          <IndicadorCard label="Ferias agendadas" valor={resumoOperacional.feriasAgendadas} detalhe="Periodos ativos" />
          <IndicadorCard label="Exames previstos" valor={resumoOperacional.examesPrevistos} detalhe="Proximos 30 dias" />
        </section>

        <section className="people-report-overview-note">
          <strong>Consulta visual interna.</strong>
          <p>
            Esta visao nao exibe CPF, telefone, e-mail, salario, documentos, laudos, anexos,
            CID, diagnosticos, resultados de exame ou dados medicos.
          </p>
        </section>
      </>
    )
  }

  return (
    <div className="people-report-center-page">
      <style>{`
        .people-report-center-page { display: grid; gap: 18px; }
        .people-report-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 4px;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          border-radius: 8px;
        }
        .people-report-tab {
          border: 1px solid transparent;
          background: transparent;
          color: #475569;
          border-radius: 7px;
          padding: 9px 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .people-report-tab.ativo {
          background: #ffffff;
          border-color: #d7dde7;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }
        .people-report-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .people-report-overview-card {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 8px;
          padding: 14px;
          display: grid;
          gap: 6px;
          min-height: 112px;
        }
        .people-report-overview-card span,
        .people-report-overview-card small {
          color: #64748b;
        }
        .people-report-overview-card strong {
          color: #0f172a;
          font-size: 24px;
          line-height: 1;
        }
        .people-report-overview-note {
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #1e3a8a;
          border-radius: 8px;
          padding: 14px;
          display: grid;
          gap: 6px;
        }
        .people-report-overview-note p { margin: 0; }
        @media (max-width: 900px) {
          .people-report-overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .people-report-tabs { display: grid; grid-template-columns: 1fr; }
          .people-report-tab { width: 100%; text-align: left; }
          .people-report-overview-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestao de Pessoas</span>
          <h1 style={styles.titulo}>Relatorios de Gestao de Pessoas</h1>
          <p style={styles.textoNota}>Visao central para indicadores internos de pessoas, ferias e exames.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa nao identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>Voltar ao Painel</button>
      </div>

      <nav className="people-report-tabs" aria-label="Abas de relatorios de Gestao de Pessoas">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            className={`people-report-tab ${abaAtiva === aba.id ? 'ativo' : ''}`}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {abaAtiva === 'visao-geral' && renderVisaoGeral()}
      {abaAtiva === 'pessoas' && (
        <RelatoriosPessoasPage
          styles={styles}
          empresaId={empresaId}
          empresaNome={empresaNome}
          voltarPainel={voltarPainel}
          modoIntegrado
        />
      )}
      {abaAtiva === 'ferias' && (
        <RelatoriosFeriasPage
          styles={styles}
          empresaId={empresaId}
          empresaNome={empresaNome}
          voltarPainel={voltarPainel}
          modoIntegrado
        />
      )}
    </div>
  )
}
