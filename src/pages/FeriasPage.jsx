import { useEffect, useMemo, useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionariosFerias } from '../hooks/useFuncionariosFerias'
import { mensagemSeguraErro } from '../utils/session'

const FORMULARIO_CICLO_INICIAL = {
  periodo_aquisitivo_inicio: '',
  periodo_aquisitivo_fim: '',
  data_limite_gozo: '',
  dias_direito: '30',
  status: 'pendente'
}

const FORMULARIO_PERIODO_INICIAL = {
  dataInicio: '',
  quantidadeDias: '',
  status: 'agendada'
}

const STATUS_CICLO_LABELS = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  agendada: 'Agendada',
  concluida: 'Concluída',
  vencida: 'Vencida',
  cancelada: 'Cancelada'
}

const STATUS_PERIODO_LABELS = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
}

function criarFormularioCicloInicial() {
  return { ...FORMULARIO_CICLO_INICIAL }
}

function criarFormularioPeriodoInicial() {
  return { ...FORMULARIO_PERIODO_INICIAL }
}

function criarDataLocal(data) {
  if (!data) return null
  const texto = String(data).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null

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

function normalizarTexto(valor) {
  return String(valor || '').trim()
}

function ordenarFuncionarios(lista = []) {
  return [...lista].sort((a, b) => normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome), 'pt-BR'))
}

function obterPeriodosAtivos(periodos = []) {
  return (periodos || []).filter((periodo) => !periodo.arquivado && periodo.status !== 'cancelada')
}

function formatarStatus(status, labels) {
  return labels[status] || status || 'Não informado'
}

function criarPrevisaoPeriodo({ formularioPeriodo, calcularFimFerias, calcularRetornoTrabalho }) {
  if (!formularioPeriodo.dataInicio || !formularioPeriodo.quantidadeDias) return null

  try {
    return {
      dataFim: calcularFimFerias(formularioPeriodo.dataInicio, Number(formularioPeriodo.quantidadeDias)),
      dataRetorno: calcularRetornoTrabalho(formularioPeriodo.dataInicio, Number(formularioPeriodo.quantidadeDias)),
      erro: null
    }
  } catch (error) {
    return {
      dataFim: null,
      dataRetorno: null,
      erro: mensagemSeguraErro(error, 'Não foi possível calcular as datas.')
    }
  }
}

function calcularNumeroParcelaPrevisto(periodosAtivos = []) {
  const maiorParcela = (periodosAtivos || []).reduce((maior, periodo) => {
    return Math.max(maior, Number(periodo.numero_parcela) || 0)
  }, 0)

  return maiorParcela + 1
}

function EmptyState({ titulo, descricao }) {
  return (
    <div className="ferias-empty-state">
      <strong>{titulo}</strong>
      <p>{descricao}</p>
    </div>
  )
}

export default function FeriasPage({
  styles,
  empresaId,
  empresaNome,
  mostrarAviso,
  podeEditar = false,
  voltarPainel
}) {
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState('')
  const [cicloSelecionadoId, setCicloSelecionadoId] = useState('')
  const [incluirArquivados, setIncluirArquivados] = useState(false)
  const [formularioCiclo, setFormularioCiclo] = useState(criarFormularioCicloInicial)
  const [formularioPeriodo, setFormularioPeriodo] = useState(criarFormularioPeriodoInicial)

  const {
    funcionarios,
    loading: loadingFuncionarios,
    erro: erroFuncionarios
  } = useFuncionarios({
    empresaId,
    incluirArquivados: false
  })

  const funcionariosOrdenados = useMemo(() => ordenarFuncionarios(funcionarios), [funcionarios])
  const funcionarioSelecionado = useMemo(() => {
    return funcionariosOrdenados.find((funcionario) => funcionario.id === funcionarioSelecionadoId) || null
  }, [funcionarioSelecionadoId, funcionariosOrdenados])

  const {
    ciclos,
    periodos,
    loading,
    loadingCiclos,
    loadingPeriodos,
    salvando,
    erro,
    criarCicloFerias,
    arquivarCicloFerias,
    reativarCicloFerias,
    criarPeriodoFerias,
    arquivarPeriodoFerias,
    reativarPeriodoFerias,
    calcularFimFerias,
    calcularRetornoTrabalho,
    calcularSaldoDiasFerias,
    calcularStatusCicloFerias,
    limparErro
  } = useFuncionariosFerias({
    empresaId,
    funcionarioId: funcionarioSelecionadoId,
    cicloId: cicloSelecionadoId,
    incluirArquivados,
    autoCarregarCiclos: Boolean(funcionarioSelecionadoId),
    autoCarregarPeriodos: Boolean(cicloSelecionadoId)
  })

  const cicloSelecionado = useMemo(() => {
    return (ciclos || []).find((ciclo) => ciclo.id === cicloSelecionadoId) || null
  }, [cicloSelecionadoId, ciclos])

  const periodosAtivos = useMemo(() => obterPeriodosAtivos(periodos), [periodos])

  const saldoSelecionado = useMemo(() => {
    if (!cicloSelecionado) return null

    try {
      return calcularSaldoDiasFerias({
        diasDireito: cicloSelecionado.dias_direito || 30,
        periodosAtivos
      })
    } catch {
      return null
    }
  }, [calcularSaldoDiasFerias, cicloSelecionado, periodosAtivos])

  const statusCalculadoSelecionado = useMemo(() => {
    if (!cicloSelecionado) return ''

    try {
      return calcularStatusCicloFerias({
        diasDireito: cicloSelecionado.dias_direito || 30,
        periodosAtivos,
        dataLimiteGozo: cicloSelecionado.data_limite_gozo
      })
    } catch {
      return ''
    }
  }, [calcularStatusCicloFerias, cicloSelecionado, periodosAtivos])

  const numeroParcelaPrevisto = useMemo(() => calcularNumeroParcelaPrevisto(periodosAtivos), [periodosAtivos])
  const limiteParcelasAtingido = numeroParcelaPrevisto > 3
  const semSaldoDisponivel = saldoSelecionado !== null && saldoSelecionado <= 0

  const previsaoPeriodo = useMemo(() => criarPrevisaoPeriodo({
    formularioPeriodo,
    calcularFimFerias,
    calcularRetornoTrabalho
  }), [calcularFimFerias, calcularRetornoTrabalho, formularioPeriodo])

  useEffect(() => {
    setFuncionarioSelecionadoId('')
    setCicloSelecionadoId('')
    setIncluirArquivados(false)
    setFormularioCiclo(criarFormularioCicloInicial())
    setFormularioPeriodo(criarFormularioPeriodoInicial())
    limparErro?.()
  }, [empresaId])

  useEffect(() => {
    if (!funcionarioSelecionadoId) {
      setCicloSelecionadoId('')
      return
    }

    if (cicloSelecionadoId && ciclos.some((ciclo) => ciclo.id === cicloSelecionadoId)) return
    setCicloSelecionadoId(ciclos[0]?.id || '')
  }, [cicloSelecionadoId, ciclos, funcionarioSelecionadoId])

  useEffect(() => {
    setFormularioPeriodo(criarFormularioPeriodoInicial())
  }, [cicloSelecionadoId])

  function atualizarFormularioCiclo(campo, valor) {
    setFormularioCiclo((atual) => ({
      ...atual,
      [campo]: valor
    }))
  }

  function atualizarFormularioPeriodo(campo, valor) {
    setFormularioPeriodo((atual) => ({
      ...atual,
      [campo]: campo === 'quantidadeDias' ? String(valor).replace(/\D/g, '') : valor
    }))
  }

  function selecionarFuncionario(valor) {
    setFuncionarioSelecionadoId(valor)
    setCicloSelecionadoId('')
    setFormularioPeriodo(criarFormularioPeriodoInicial())
    limparErro?.()
  }

  async function salvarCiclo(event) {
    event.preventDefault()
    if (!empresaId || !funcionarioSelecionadoId || !podeEditar || salvando) return

    const resposta = await criarCicloFerias(formularioCiclo, {
      funcionarioId: funcionarioSelecionadoId
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o ciclo de férias.'), 'erro')
      return
    }

    setFormularioCiclo(criarFormularioCicloInicial())
    if (resposta?.data?.id) setCicloSelecionadoId(resposta.data.id)
    mostrarAviso?.('Ciclo de férias criado.', 'sucesso')
  }

  async function salvarPeriodo(event) {
    event.preventDefault()
    if (!empresaId || !funcionarioSelecionadoId || !cicloSelecionadoId || !podeEditar || salvando) return

    if (!formularioPeriodo.dataInicio || !formularioPeriodo.quantidadeDias) {
      mostrarAviso?.('Informe a data de início e a quantidade de dias.', 'erro')
      return
    }

    if (limiteParcelasAtingido) {
      mostrarAviso?.('O limite planejado de 3 parcelas para este ciclo foi atingido.', 'erro')
      return
    }

    const resposta = await criarPeriodoFerias({
      cicloId: cicloSelecionadoId,
      funcionarioId: funcionarioSelecionadoId,
      dataInicio: formularioPeriodo.dataInicio,
      quantidadeDias: Number(formularioPeriodo.quantidadeDias),
      status: formularioPeriodo.status
    })

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível criar o período de férias.'), 'erro')
      return
    }

    setFormularioPeriodo(criarFormularioPeriodoInicial())
    mostrarAviso?.('Período de férias registrado.', 'sucesso')
  }

  async function alternarArquivamentoCiclo(ciclo) {
    if (!ciclo?.id || !empresaId || !podeEditar || salvando) return

    const resposta = ciclo.arquivado
      ? await reativarCicloFerias(ciclo.id)
      : await arquivarCicloFerias(ciclo.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o ciclo de férias.'), 'erro')
      return
    }

    mostrarAviso?.(ciclo.arquivado ? 'Ciclo reativado.' : 'Ciclo arquivado.', 'sucesso')
  }

  async function alternarArquivamentoPeriodo(periodo) {
    if (!periodo?.id || !empresaId || !podeEditar || salvando) return

    const resposta = periodo.arquivado
      ? await reativarPeriodoFerias(periodo.id)
      : await arquivarPeriodoFerias(periodo.id)

    if (resposta?.error) {
      mostrarAviso?.(mensagemSeguraErro(resposta.error, 'Não foi possível atualizar o período de férias.'), 'erro')
      return
    }

    mostrarAviso?.(periodo.arquivado ? 'Período reativado.' : 'Período arquivado.', 'sucesso')
  }

  return (
    <div className="ferias-page">
      <style>{`
        .ferias-page { display: grid; gap: 18px; }
        .ferias-page-grid {
          display: grid;
          grid-template-columns: minmax(260px, .86fr) minmax(0, 1.3fr);
          gap: 16px;
          align-items: start;
        }
        .ferias-card {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 20px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          min-width: 0;
        }
        .ferias-card h2,
        .ferias-card h3 {
          margin: 0 0 6px;
          color: #0f172a;
        }
        .ferias-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }
        .ferias-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .ferias-form-grid label,
        .ferias-form-row label {
          display: grid;
          gap: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 900;
        }
        .ferias-form-grid .span-2 { grid-column: 1 / -1; }
        .ferias-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .ferias-form-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
          margin-top: 14px;
        }
        .ferias-cycle-list,
        .ferias-period-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }
        .ferias-cycle-card,
        .ferias-period-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 16px;
          background: #f8fafc;
          padding: 12px;
        }
        .ferias-cycle-card.selected {
          border-color: rgba(13, 148, 136, .44);
          background: #f0fdfa;
        }
        .ferias-cycle-card.archived,
        .ferias-period-card.archived {
          opacity: .78;
          background: #f1f5f9;
        }
        .ferias-cycle-main,
        .ferias-period-main {
          display: grid;
          gap: 5px;
          min-width: 0;
        }
        .ferias-cycle-main strong,
        .ferias-period-main strong {
          color: #0f172a;
          font-size: 14px;
        }
        .ferias-cycle-main small,
        .ferias-period-main small {
          color: #64748b;
          line-height: 1.35;
        }
        .ferias-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ferias-actions button,
        .ferias-form-actions button {
          min-height: 34px !important;
          padding: 8px 11px !important;
          margin: 0 !important;
        }
        .ferias-status {
          width: fit-content;
          border-radius: 999px;
          padding: 4px 8px;
          background: #ecfdf5;
          color: #0f766e;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .ferias-status.archived {
          background: #fee2e2;
          color: #b91c1c;
        }
        .ferias-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .ferias-summary-box {
          border: 1px solid rgba(15, 23, 42, .08);
          border-radius: 15px;
          background: #f8fafc;
          padding: 12px;
          display: grid;
          gap: 4px;
        }
        .ferias-summary-box span {
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .ferias-summary-box strong {
          color: #0f172a;
          font-size: 18px;
        }
        .ferias-empty-state {
          border: 1px dashed rgba(15, 23, 42, .16);
          border-radius: 16px;
          background: #f8fafc;
          padding: 14px;
          color: #64748b;
          margin-top: 12px;
        }
        .ferias-empty-state strong {
          display: block;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ferias-switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }
        .ferias-preview {
          border: 1px solid rgba(13, 148, 136, .18);
          border-radius: 16px;
          background: #f0fdfa;
          color: #115e59;
          padding: 12px;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 12px;
        }
        .ferias-warning {
          border: 1px solid rgba(245, 158, 11, .26);
          border-radius: 16px;
          background: #fffbeb;
          color: #92400e;
          padding: 12px;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 12px;
        }
        @media (max-width: 980px) {
          .ferias-page-grid,
          .ferias-form-grid,
          .ferias-summary-grid,
          .ferias-cycle-card,
          .ferias-period-card {
            grid-template-columns: 1fr;
          }
          .ferias-actions,
          .ferias-form-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Férias</h1>
          <p style={styles.textoNota}>Controle inicial de ciclos e parcelas por colaborador, usando sempre a empresa ativa.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>Voltar ao painel</button>
      </div>

      {!empresaId ? (
        <section style={styles.cardConfiguracao}>
          <EmptyState
            titulo="Empresa ativa necessaria"
            descricao="Selecione uma empresa para carregar funcionários e férias."
          />
        </section>
      ) : (
        <div className="ferias-page-grid">
          <section className="ferias-card">
            <h2>Funcionário</h2>
            <p>Selecione um colaborador da empresa ativa. CPF e observações não aparecem nesta tela.</p>

            {loadingFuncionarios ? (
              <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando funcionários...</p>
            ) : erroFuncionarios ? (
              <EmptyState titulo="Não foi possível carregar" descricao={erroFuncionarios} />
            ) : (
              <>
                <div className="ferias-form-row">
                  <label>
                    Colaborador
                    <select
                      style={styles.input}
                      value={funcionarioSelecionadoId}
                      onChange={(event) => selecionarFuncionario(event.target.value)}
                    >
                      <option value="">Selecione um funcionário</option>
                      {funcionariosOrdenados.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome || 'Funcionário sem nome'}{funcionario.cargo ? ` - ${funcionario.cargo}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {funcionariosOrdenados.length === 0 && (
                  <EmptyState
                    titulo="Nenhum funcionário ativo"
                    descricao="Cadastre um funcionário antes de registrar ciclos de férias."
                  />
                )}
              </>
            )}

            {funcionarioSelecionado && (
              <div className="ferias-preview">
                <strong>{funcionarioSelecionado.nome || 'Funcionário selecionado'}</strong>
                <br />
                <span>{funcionarioSelecionado.cargo || 'Cargo não informado'}</span>
                <br />
                <span>Admissão: {formatarDataCurta(funcionarioSelecionado.data_admissao)}</span>
              </div>
            )}

            <div className="ferias-warning">
              Esta tela registra apenas dados trabalhistas estruturados de férias. Não há documentos, anexos,
              exportação ou integração financeira neste ciclo.
            </div>
          </section>

          <section className="ferias-card">
            <div className="master-list-header">
              <div>
                <h2>Ciclos de férias</h2>
                <p>Histórico de períodos aquisitivos do funcionário selecionado.</p>
              </div>
              <label className="ferias-switch">
                <input
                  type="checkbox"
                  checked={incluirArquivados}
                  onChange={(event) => setIncluirArquivados(event.target.checked)}
                  disabled={!funcionarioSelecionadoId || loading}
                />
                Mostrar arquivados
              </label>
            </div>

            {!funcionarioSelecionadoId ? (
              <EmptyState
                titulo="Selecione um funcionário"
                descricao="Os ciclos de férias aparecem depois da seleção do colaborador."
              />
            ) : (
              <>
                <form onSubmit={salvarCiclo}>
                  <div className="ferias-form-grid">
                    <label>
                      Período aquisitivo início
                      <input
                        style={styles.input}
                        type="date"
                        value={formularioCiclo.periodo_aquisitivo_inicio}
                        onChange={(event) => atualizarFormularioCiclo('periodo_aquisitivo_inicio', event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Período aquisitivo fim
                      <input
                        style={styles.input}
                        type="date"
                        value={formularioCiclo.periodo_aquisitivo_fim}
                        onChange={(event) => atualizarFormularioCiclo('periodo_aquisitivo_fim', event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Data limite de gozo
                      <input
                        style={styles.input}
                        type="date"
                        value={formularioCiclo.data_limite_gozo}
                        onChange={(event) => atualizarFormularioCiclo('data_limite_gozo', event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Dias de direito
                      <input
                        style={styles.input}
                        type="number"
                        min="1"
                        max="30"
                        value={formularioCiclo.dias_direito}
                        onChange={(event) => atualizarFormularioCiclo('dias_direito', event.target.value)}
                        required
                      />
                    </label>
                    <label className="span-2">
                      Status inicial
                      <select
                        style={styles.input}
                        value={formularioCiclo.status}
                        onChange={(event) => atualizarFormularioCiclo('status', event.target.value)}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="agendada">Agendada</option>
                        <option value="parcial">Parcial</option>
                        <option value="concluida">Concluída</option>
                        <option value="vencida">Vencida</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </label>
                  </div>
                  <div className="ferias-form-actions">
                    <button
                      style={styles.btnSalvar}
                      type="submit"
                      disabled={!podeEditar || salvando || !funcionarioSelecionadoId}
                    >
                      {salvando ? 'Salvando...' : 'Criar ciclo'}
                    </button>
                  </div>
                </form>

                {loadingCiclos ? (
                  <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando ciclos...</p>
                ) : erro ? (
                  <EmptyState titulo="Não foi possível carregar férias" descricao={erro} />
                ) : ciclos.length === 0 ? (
                  <EmptyState
                    titulo="Nenhum ciclo cadastrado"
                    descricao="Crie o primeiro ciclo de férias para este funcionário."
                  />
                ) : (
                  <div className="ferias-cycle-list">
                    {ciclos.map((ciclo) => {
                      const selecionado = ciclo.id === cicloSelecionadoId
                      const status = ciclo.arquivado ? 'Arquivado' : formatarStatus(ciclo.status, STATUS_CICLO_LABELS)

                      return (
                        <article
                          key={ciclo.id}
                          className={`ferias-cycle-card ${selecionado ? 'selected' : ''} ${ciclo.arquivado ? 'archived' : ''}`}
                        >
                          <div className="ferias-cycle-main">
                            <strong>{formatarDataCurta(ciclo.periodo_aquisitivo_inicio)} a {formatarDataCurta(ciclo.periodo_aquisitivo_fim)}</strong>
                            <small>Limite de gozo: {formatarDataCurta(ciclo.data_limite_gozo)}</small>
                            <small>Dias de direito: {ciclo.dias_direito || 30}</small>
                            <span className={`ferias-status ${ciclo.arquivado ? 'archived' : ''}`}>{status}</span>
                          </div>
                          <div className="ferias-actions">
                            <button
                              style={selecionado ? styles.btnSalvar : styles.btnCinza}
                              type="button"
                              disabled={loading || salvando}
                              onClick={() => setCicloSelecionadoId(ciclo.id)}
                            >
                              {selecionado ? 'Selecionado' : 'Selecionar'}
                            </button>
                            {podeEditar && (
                              <button
                                style={ciclo.arquivado ? styles.btnSalvar : styles.btnCinza}
                                type="button"
                                disabled={salvando}
                                onClick={() => alternarArquivamentoCiclo(ciclo)}
                              >
                                {ciclo.arquivado ? 'Reativar' : 'Arquivar'}
                              </button>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {empresaId && funcionarioSelecionadoId && cicloSelecionado && (
        <section className="ferias-card">
          <div className="master-list-header">
            <div>
              <h2>Parcelas do ciclo selecionado</h2>
              <p>Informe apenas data de início e quantidade de dias. O sistema calcula fim e retorno.</p>
            </div>
          </div>

          <div className="ferias-summary-grid">
            <div className="ferias-summary-box">
              <span>Saldo calculado</span>
              <strong>{saldoSelecionado ?? 'N/I'} dia(s)</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Status calculado</span>
              <strong>{formatarStatus(statusCalculadoSelecionado, STATUS_CICLO_LABELS)}</strong>
            </div>
            <div className="ferias-summary-box">
              <span>Proxima parcela</span>
              <strong>{limiteParcelasAtingido ? 'Limite' : numeroParcelaPrevisto}</strong>
            </div>
          </div>

          <div className="ferias-warning">
            Não existe seleção manual de férias integral ou parcelada. A situação e o saldo são calculados pela soma
            das parcelas ativas deste ciclo.
          </div>

          <form onSubmit={salvarPeriodo}>
            <div className="ferias-form-grid">
              <label>
                Data de início
                <input
                  style={styles.input}
                  type="date"
                  value={formularioPeriodo.dataInicio}
                  onChange={(event) => atualizarFormularioPeriodo('dataInicio', event.target.value)}
                  required
                />
              </label>
              <label>
                Quantidade de dias
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max={saldoSelecionado ?? 30}
                  value={formularioPeriodo.quantidadeDias}
                  onChange={(event) => atualizarFormularioPeriodo('quantidadeDias', event.target.value)}
                  required
                />
              </label>
              <label className="span-2">
                Status
                <select
                  style={styles.input}
                  value={formularioPeriodo.status}
                  onChange={(event) => atualizarFormularioPeriodo('status', event.target.value)}
                >
                  <option value="agendada">Agendada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
            </div>

            {previsaoPeriodo && (
              <div className={previsaoPeriodo.erro ? 'ferias-warning' : 'ferias-preview'}>
                {previsaoPeriodo.erro ? (
                  <strong>{previsaoPeriodo.erro}</strong>
                ) : (
                  <>
                    <strong>Fim calculado: {formatarDataCurta(previsaoPeriodo.dataFim)}</strong>
                    <br />
                    <span>Retorno ao trabalho: {formatarDataCurta(previsaoPeriodo.dataRetorno)}</span>
                    <br />
                    <span>Essas datas serão enviadas junto com a parcela, sem campo manual de fim ou retorno.</span>
                  </>
                )}
              </div>
            )}

            {limiteParcelasAtingido && (
              <div className="ferias-warning">
                O limite planejado de 3 parcelas ativas foi atingido para este ciclo.
              </div>
            )}

            {semSaldoDisponivel && (
              <div className="ferias-warning">
                O saldo calculado deste ciclo está zerado. Não há dias disponíveis para nova parcela.
              </div>
            )}

            <div className="ferias-form-actions">
              <button
                style={styles.btnSalvar}
                type="submit"
                disabled={
                  !podeEditar ||
                  salvando ||
                  limiteParcelasAtingido ||
                  semSaldoDisponivel ||
                  Boolean(previsaoPeriodo?.erro) ||
                  !formularioPeriodo.dataInicio ||
                  !formularioPeriodo.quantidadeDias
                }
              >
                {salvando ? 'Salvando...' : 'Adicionar parcela'}
              </button>
            </div>
          </form>

          {loadingPeriodos ? (
            <p style={{ ...styles.textoNota, marginTop: 12 }}>Carregando parcelas...</p>
          ) : periodos.length === 0 ? (
            <EmptyState
              titulo="Nenhuma parcela cadastrada"
              descricao="Adicione a primeira parcela de férias deste ciclo."
            />
          ) : (
            <div className="ferias-period-list">
              {periodos.map((periodo) => (
                <article key={periodo.id} className={`ferias-period-card ${periodo.arquivado ? 'archived' : ''}`}>
                  <div className="ferias-period-main">
                    <strong>Parcela {periodo.numero_parcela || '-'} - {formatarDataCurta(periodo.data_inicio)}</strong>
                    <small>{periodo.quantidade_dias} dia(s) - fim {formatarDataCurta(periodo.data_fim_calculada)} - retorno {formatarDataCurta(periodo.data_retorno_trabalho)}</small>
                    <span className={`ferias-status ${periodo.arquivado ? 'archived' : ''}`}>
                      {periodo.arquivado ? 'Arquivada' : formatarStatus(periodo.status, STATUS_PERIODO_LABELS)}
                    </span>
                  </div>
                  <div className="ferias-actions">
                    {podeEditar && (
                      <button
                        style={periodo.arquivado ? styles.btnSalvar : styles.btnCinza}
                        type="button"
                        disabled={salvando}
                        onClick={() => alternarArquivamentoPeriodo(periodo)}
                      >
                        {periodo.arquivado ? 'Reativar' : 'Arquivar'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
