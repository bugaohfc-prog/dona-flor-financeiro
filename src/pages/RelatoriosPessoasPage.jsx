import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { supabase } from '../lib/supabase'
import {
  calcularProximoPeriodico,
  listarExamesPeriodicos
} from '../services/funcionariosExamesPeriodicosService'
import { mensagemSeguraErro } from '../utils/session'

const STATUS_LABELS = {
  ativo: 'Ativos',
  afastado: 'Afastados',
  desligado: 'Desligados',
  arquivado: 'Arquivados'
}

const LIMITE_INICIAL_LISTA = 5

function criarDataLocal(data) {
  if (!data) return null
  if (data instanceof Date) return Number.isNaN(data.getTime()) ? null : data

  const texto = String(data).slice(0, 10)
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

function formatarDiaMes(data) {
  const dataLocal = criarDataLocal(data)
  if (!dataLocal) return 'Não informado'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(dataLocal)
}

function normalizarTexto(valor) {
  return String(valor || '').trim()
}

function ordenarPorData(lista, campo, apenasDiaMes = false) {
  return [...lista].sort((a, b) => {
    const dataA = criarDataLocal(a[campo])
    const dataB = criarDataLocal(b[campo])
    if (!dataA && !dataB) return normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR')
    if (!dataA) return 1
    if (!dataB) return -1

    if (apenasDiaMes) {
      const mesA = dataA.getMonth()
      const mesB = dataB.getMonth()
      if (mesA !== mesB) return mesA - mesB
      if (dataA.getDate() !== dataB.getDate()) return dataA.getDate() - dataB.getDate()
    }

    return dataA.getTime() - dataB.getTime()
  })
}

function estaNoMesAtual(data, compararAno = false) {
  const dataLocal = criarDataLocal(data)
  if (!dataLocal) return false

  const hoje = new Date()
  const mesmoMes = dataLocal.getMonth() === hoje.getMonth()
  if (!compararAno) return mesmoMes
  return mesmoMes && dataLocal.getFullYear() === hoje.getFullYear()
}

function obterUltimoExamePeriodicoAtivo(exames = []) {
  return [...exames]
    .filter((exame) => exame?.data_exame && !exame.arquivado)
    .sort((a, b) => String(b.data_exame || '').localeCompare(String(a.data_exame || '')))[0] || null
}

function montarPrevisaoPeriodico(funcionario, examesPeriodicos = []) {
  const ultimoPeriodico = obterUltimoExamePeriodicoAtivo(examesPeriodicos)
  const dataBase = ultimoPeriodico?.data_exame || funcionario.data_exame_admissional
  const origem = ultimoPeriodico?.data_exame
    ? 'periodico'
    : funcionario.data_exame_admissional
      ? 'admissional'
      : null

  return {
    dataBase,
    origem,
    ultimoPeriodico,
    proximoPeriodico: dataBase ? calcularProximoPeriodico(dataBase) : null
  }
}

function ordenarPrevisoesPeriodicas(lista) {
  return [...lista].sort((a, b) => {
    const dataA = criarDataLocal(a.previsao.proximoPeriodico)
    const dataB = criarDataLocal(b.previsao.proximoPeriodico)
    if (!dataA && !dataB) {
      return normalizarTexto(a.funcionario.nome).localeCompare(normalizarTexto(b.funcionario.nome), 'pt-BR')
    }
    if (!dataA) return 1
    if (!dataB) return -1
    return dataA.getTime() - dataB.getTime()
  })
}

function PessoaResumoCard({ label, valor, detalhe }) {
  return (
    <article className="pessoas-report-card">
      <span>{label}</span>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}

function PessoaListaSecao({
  titulo,
  descricao,
  vazio,
  total = 0,
  aberta = true,
  expandida = false,
  onAlternarAberta,
  onAlternarExpandida,
  children
}) {
  return (
    <section className="pessoas-report-section">
      <div className="pessoas-report-section-header">
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>
        <button className="pessoas-report-toggle" type="button" onClick={onAlternarAberta}>
          {aberta ? 'Recolher' : 'Abrir'}
        </button>
      </div>
      {aberta && (
        <>
          {children || (
            <div className="pessoas-report-empty">
              <strong>Sem dados para exibir</strong>
              <p>{vazio}</p>
            </div>
          )}
          {total > LIMITE_INICIAL_LISTA && (
            <button className="pessoas-report-more" type="button" onClick={onAlternarExpandida}>
              {expandida ? 'Ver menos' : `Ver mais (${total - LIMITE_INICIAL_LISTA})`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

function PessoaLinha({ nome, cargo, detalhe, complemento }) {
  return (
    <article className="pessoas-report-row">
      <div>
        <h3>{nome || 'Colaborador sem nome'}</h3>
        <small>{cargo || 'Cargo não informado'}</small>
      </div>
      <div className="pessoas-report-row-meta">
        <strong>{detalhe}</strong>
        {complemento && <small>{complemento}</small>}
      </div>
    </article>
  )
}

export default function RelatoriosPessoasPage({
  styles,
  empresaId,
  empresaNome,
  voltarPainel
}) {
  const [examesPorFuncionario, setExamesPorFuncionario] = useState({})
  const [loadingExamesPeriodicos, setLoadingExamesPeriodicos] = useState(false)
  const [erroExamesPeriodicos, setErroExamesPeriodicos] = useState(null)
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [secoesAbertas, setSecoesAbertas] = useState({
    aniversariantes: true,
    admissoes: true,
    exames: true
  })
  const [listasExpandidas, setListasExpandidas] = useState({})

  const {
    funcionarios,
    loading,
    erro,
    carregarFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: true
  })

  const funcionariosNaoArquivados = useMemo(() => {
    return (Array.isArray(funcionarios) ? funcionarios : []).filter((funcionario) => !funcionario.arquivado)
  }, [funcionarios])

  useEffect(() => {
    let cancelado = false

    setExamesPorFuncionario({})
    setErroExamesPeriodicos(null)

    if (!empresaId || loading || funcionariosNaoArquivados.length === 0) {
      setLoadingExamesPeriodicos(false)
      return () => {
        cancelado = true
      }
    }

    async function carregarExamesPeriodicosAtivos() {
      setLoadingExamesPeriodicos(true)

      try {
        const resultados = await Promise.all(
          funcionariosNaoArquivados
            .filter((funcionario) => funcionario?.id)
            .map(async (funcionario) => {
              const { data, error } = await listarExamesPeriodicos({
                supabase,
                empresaId,
                funcionarioId: funcionario.id,
                incluirArquivados: false
              })

              if (error) throw error
              return [funcionario.id, data || []]
            })
        )

        if (!cancelado) {
          setExamesPorFuncionario(Object.fromEntries(resultados))
        }
      } catch (error) {
        if (!cancelado) {
          setExamesPorFuncionario({})
          setErroExamesPeriodicos(mensagemSeguraErro(error, 'Não foi possível carregar os exames periódicos.'))
        }
      } finally {
        if (!cancelado) {
          setLoadingExamesPeriodicos(false)
        }
      }
    }

    carregarExamesPeriodicosAtivos()

    return () => {
      cancelado = true
    }
  }, [empresaId, funcionariosNaoArquivados, loading])

  const dadosRelatorio = useMemo(() => {
    const lista = Array.isArray(funcionarios) ? funcionarios : []
    const naoArquivados = funcionariosNaoArquivados
    const funcionariosFiltrados = statusFiltro === 'todos'
      ? naoArquivados
      : naoArquivados.filter((funcionario) => (funcionario.status || 'ativo') === statusFiltro)

    const resumo = {
      ativo: naoArquivados.filter((funcionario) => funcionario.status === 'ativo').length,
      afastado: naoArquivados.filter((funcionario) => funcionario.status === 'afastado').length,
      desligado: naoArquivados.filter((funcionario) => funcionario.status === 'desligado').length,
      arquivado: lista.filter((funcionario) => funcionario.arquivado).length
    }

    const aniversariantes = ordenarPorData(
      funcionariosFiltrados.filter((funcionario) => estaNoMesAtual(funcionario.data_nascimento)),
      'data_nascimento',
      true
    )

    const admissoes = ordenarPorData(
      funcionariosFiltrados.filter((funcionario) => estaNoMesAtual(funcionario.data_admissao, true)),
      'data_admissao'
    )

    const exames = ordenarPrevisoesPeriodicas(
      funcionariosFiltrados
        .map((funcionario) => ({
          funcionario,
          previsao: montarPrevisaoPeriodico(funcionario, examesPorFuncionario[funcionario.id] || [])
        }))
        .filter((item) => Boolean(item.previsao.dataBase))
    )

    return {
      resumo,
      aniversariantes,
      admissoes,
      exames
    }
  }, [examesPorFuncionario, funcionarios, funcionariosNaoArquivados, statusFiltro])

  function alternarSecao(chave) {
    setSecoesAbertas((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  function alternarLista(chave) {
    setListasExpandidas((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  function listaVisivel(chave, lista) {
    return listasExpandidas[chave] ? lista : lista.slice(0, LIMITE_INICIAL_LISTA)
  }

  return (
    <div className="pessoas-report-page">
      <style>{`
        .pessoas-report-page { display: grid; gap: 18px; }
        .pessoas-report-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .pessoas-report-card {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 18px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          display: grid;
          gap: 6px;
        }
        .pessoas-report-card span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .pessoas-report-card strong { color: #0f172a; font-size: 28px; line-height: 1; }
        .pessoas-report-card small { color: #64748b; line-height: 1.35; }
        .pessoas-report-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .pessoas-report-section {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 20px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          min-width: 0;
        }
        .pessoas-report-section-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .pessoas-report-section h2 {
          margin: 0 0 5px;
          color: #0f172a;
          font-size: 17px;
        }
        .pessoas-report-section p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }
        .pessoas-report-filters {
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
        .pessoas-report-filter {
          display: grid;
          gap: 6px;
          min-width: 180px;
        }
        .pessoas-report-filter span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .pessoas-report-filter select {
          border: 1px solid rgba(15, 23, 42, .14);
          border-radius: 12px;
          min-height: 40px;
          padding: 8px 10px;
          color: #0f172a;
          background: #ffffff;
        }
        .pessoas-report-toggle,
        .pessoas-report-more {
          border: 1px solid rgba(15, 23, 42, .12);
          border-radius: 12px;
          background: #ffffff;
          color: #0f172a;
          font-weight: 800;
          min-height: 34px;
          padding: 8px 11px;
          cursor: pointer;
        }
        .pessoas-report-more {
          margin-top: 10px;
          width: 100%;
          background: #f8fafc;
        }
        .pessoas-report-list { display: grid; gap: 10px; }
        .pessoas-report-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .06);
          border-radius: 14px;
          background: #f8fafc;
          padding: 12px;
        }
        .pessoas-report-row h3 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 14px;
        }
        .pessoas-report-row small,
        .pessoas-report-row-meta small {
          color: #64748b;
          line-height: 1.35;
        }
        .pessoas-report-row-meta {
          display: grid;
          gap: 4px;
          justify-items: end;
          text-align: right;
          min-width: 132px;
        }
        .pessoas-report-row-meta strong {
          color: #0f766e;
          font-size: 13px;
        }
        .pessoas-report-empty {
          border: 1px dashed rgba(15, 23, 42, .16);
          border-radius: 14px;
          background: #f8fafc;
          padding: 14px;
          color: #64748b;
        }
        .pessoas-report-empty strong {
          display: block;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .pessoas-report-note {
          border: 1px solid rgba(13, 148, 136, .18);
          border-radius: 16px;
          background: #f0fdfa;
          color: #115e59;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.45;
        }
        @media (max-width: 980px) {
          .pessoas-report-grid,
          .pessoas-report-columns {
            grid-template-columns: 1fr;
          }
          .pessoas-report-row {
            grid-template-columns: 1fr;
          }
          .pessoas-report-row-meta {
            justify-items: start;
            text-align: left;
          }
          .pessoas-report-section-header {
            align-items: stretch;
          }
          .pessoas-report-toggle {
            width: 100%;
          }
          .pessoas-report-filters {
            display: grid;
          }
          .pessoas-report-filter {
            min-width: 0;
          }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Relatórios de Pessoas</h1>
          <p style={styles.textoNota}>Indicadores internos simples por empresa ativa, sem exportação de dados.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>← Painel</button>
      </div>

      {!empresaId ? (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Empresa ativa necessária</strong>
            <p>Selecione uma empresa para carregar os relatórios de pessoas.</p>
          </div>
        </section>
      ) : loading ? (
        <section style={styles.cardConfiguracao}>
          <p style={styles.textoNota}>Carregando relatórios de pessoas...</p>
        </section>
      ) : erro ? (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Não foi possível carregar</strong>
            <p>{erro}</p>
            <button style={styles.btnCinza} type="button" onClick={() => carregarFuncionarios()}>
              Tentar novamente
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="pessoas-report-grid" aria-label="Resumo de funcionários">
            <PessoaResumoCard label={STATUS_LABELS.ativo} valor={dadosRelatorio.resumo.ativo} detalhe="Não arquivados" />
            <PessoaResumoCard label={STATUS_LABELS.afastado} valor={dadosRelatorio.resumo.afastado} detalhe="Não arquivados" />
            <PessoaResumoCard label={STATUS_LABELS.desligado} valor={dadosRelatorio.resumo.desligado} detalhe="Não arquivados" />
            <PessoaResumoCard label={STATUS_LABELS.arquivado} valor={dadosRelatorio.resumo.arquivado} detalhe="Arquivamento lógico" />
          </section>

          <section className="pessoas-report-filters" aria-label="Filtros locais dos relatorios de pessoas">
            <label className="pessoas-report-filter">
              <span>Status</span>
              <select value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}>
                <option value="todos">Todos nao arquivados</option>
                <option value="ativo">Ativos</option>
                <option value="afastado">Afastados</option>
                <option value="desligado">Desligados</option>
              </select>
            </label>
          </section>

          <div className="pessoas-report-columns">
            <PessoaListaSecao
              titulo="Aniversariantes do mês"
              descricao="Usa somente nome, cargo e dia/mês de nascimento."
              vazio="Nenhum aniversariante encontrado neste mês."
              total={dadosRelatorio.aniversariantes.length}
              aberta={secoesAbertas.aniversariantes}
              expandida={Boolean(listasExpandidas.aniversariantes)}
              onAlternarAberta={() => alternarSecao('aniversariantes')}
              onAlternarExpandida={() => alternarLista('aniversariantes')}
            >
              {dadosRelatorio.aniversariantes.length > 0 && (
                <div className="pessoas-report-list">
                  {listaVisivel('aniversariantes', dadosRelatorio.aniversariantes).map((funcionario) => (
                    <PessoaLinha
                      key={funcionario.id}
                      nome={funcionario.nome}
                      cargo={funcionario.cargo}
                      detalhe={formatarDiaMes(funcionario.data_nascimento)}
                    />
                  ))}
                </div>
              )}
            </PessoaListaSecao>

            <PessoaListaSecao
              titulo="Admissões do mês"
              descricao="Considera admissões do mês e ano atuais."
              vazio="Nenhuma admissão registrada para este mês."
              total={dadosRelatorio.admissoes.length}
              aberta={secoesAbertas.admissoes}
              expandida={Boolean(listasExpandidas.admissoes)}
              onAlternarAberta={() => alternarSecao('admissoes')}
              onAlternarExpandida={() => alternarLista('admissoes')}
            >
              {dadosRelatorio.admissoes.length > 0 && (
                <div className="pessoas-report-list">
                  {listaVisivel('admissoes', dadosRelatorio.admissoes).map((funcionario) => (
                    <PessoaLinha
                      key={funcionario.id}
                      nome={funcionario.nome}
                      cargo={funcionario.cargo}
                      detalhe={formatarDataCurta(funcionario.data_admissao)}
                    />
                  ))}
                </div>
              )}
            </PessoaListaSecao>
          </div>

          <PessoaListaSecao
            titulo="Exames ocupacionais cadastrados"
            descricao="Usa o último periódico ativo quando existir; senão usa o exame admissional."
            vazio="Nenhum exame admissional ou periódico ativo encontrado para colaboradores ativos nesta empresa."
            total={dadosRelatorio.exames.length}
            aberta={secoesAbertas.exames}
            expandida={Boolean(listasExpandidas.exames)}
            onAlternarAberta={() => alternarSecao('exames')}
            onAlternarExpandida={() => alternarLista('exames')}
          >
            {loadingExamesPeriodicos ? (
              <div className="pessoas-report-empty">
                <strong>Carregando exames periódicos</strong>
                <p>As previsões serão calculadas depois da consulta dos periódicos ativos.</p>
              </div>
            ) : erroExamesPeriodicos ? (
              <div className="pessoas-report-empty">
                <strong>Não foi possível carregar os exames periódicos</strong>
                <p>{erroExamesPeriodicos}</p>
              </div>
            ) : dadosRelatorio.exames.length > 0 && (
              <div className="pessoas-report-list">
                {listaVisivel('exames', dadosRelatorio.exames).map(({ funcionario, previsao }) => {
                  const baseTexto = previsao.origem === 'periodico'
                    ? `Último periódico: ${formatarDataCurta(previsao.ultimoPeriodico?.data_exame)}`
                    : `Exame admissional: ${formatarDataCurta(funcionario.data_exame_admissional)}`
                  const origemTexto = previsao.origem === 'periodico' ? 'Base: periódico' : 'Base: admissional'

                  return (
                    <PessoaLinha
                      key={funcionario.id}
                      nome={funcionario.nome}
                      cargo={funcionario.cargo}
                      detalhe={`Próximo periódico previsto: ${formatarDataCurta(previsao.proximoPeriodico)}`}
                      complemento={`${baseTexto} • ${origemTexto}`}
                    />
                  )
                })}
              </div>
            )}
          </PessoaListaSecao>

          <div className="pessoas-report-note">
            Relatórios internos somente para consulta visual. Não há PDF, Excel, CSV, impressão, anexos, laudos,
            resultados de exames, observações clínicas ou envio automático nesta tela.
          </div>
        </>
      )}
    </div>
  )
}
