import { useEffect, useMemo, useState } from 'react'
import { useFolha } from '../hooks/useFolha'
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
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'ferias', label: 'Férias' },
  { id: 'folha', label: 'Folha' }
]

const RESUMO_INICIAL = Object.freeze({
  feriasVencidas: 0,
  feriasAVencer: 0,
  feriasAgendadas: 0,
  examesPrevistos: 0
})

const LABELS_STATUS_COMPETENCIA = {
  aberta: 'Aberta',
  em_conferencia: 'Em conferência',
  validada: 'Validada',
  enviada_contabilidade: 'Enviada à contabilidade',
  fechada: 'Fechada',
  arquivada: 'Arquivada'
}

const LABELS_NATUREZA_FOLHA = {
  credito: 'Crédito',
  desconto: 'Desconto',
  informativo: 'Informativo'
}

const LABELS_CATEGORIA_FOLHA = {
  premiacao: 'Premiação',
  hora_extra_50: 'Hora extra 50%',
  hora_extra_60: 'Hora extra 60%',
  hora_extra_100: 'Hora extra 100%',
  outro_credito: 'Outro crédito',
  compras_vales: 'Compras internas / vales',
  plano_saude: 'Plano de saúde',
  falta_injustificada: 'Falta',
  pensao_alimenticia: 'Pensão alimentícia',
  outro_desconto: 'Outro desconto',
  observacao_administrativa: 'Observação administrativa',
  data_falta: 'Data de falta',
  status_conferencia: 'Status de conferência',
  origem_lancamento: 'Origem do lançamento'
}

const CATEGORIAS_CREDITO_FOLHA = new Set([
  'premiacao',
  'hora_extra_50',
  'hora_extra_60',
  'hora_extra_100',
  'outro_credito'
])

const CATEGORIAS_DESCONTO_FOLHA = new Set([
  'compras_vales',
  'plano_saude',
  'falta_injustificada',
  'pensao_alimenticia',
  'outro_desconto'
])

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

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor || 0))
}

function formatarDataCurta(valor) {
  if (!valor) return 'Sem data'
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(data.getTime())) return 'Sem data'
  return data.toLocaleDateString('pt-BR')
}

function formatarNumeroFolha(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return null
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2
  }).format(numero)
}

function obterNaturezaItemFolha(item, lancamento) {
  if (lancamento?.natureza) return lancamento.natureza
  if (CATEGORIAS_CREDITO_FOLHA.has(item?.categoria)) return 'credito'
  if (CATEGORIAS_DESCONTO_FOLHA.has(item?.categoria)) return 'desconto'
  return 'informativo'
}

function calcularResumoPorColaborador(lancamentos = [], itensLancamentos = [], funcionariosPorId = new Map()) {
  const itensAtivosPorLancamento = (itensLancamentos || []).reduce((mapa, item) => {
    if (!item?.lancamento_id || item.arquivado) return mapa
    mapa.set(item.lancamento_id, (mapa.get(item.lancamento_id) || 0) + 1)
    return mapa
  }, new Map())

  return [...(lancamentos || []).reduce((mapa, lancamento) => {
    if (!lancamento?.funcionario_id || lancamento.arquivado) return mapa

    const funcionario = funcionariosPorId.get(lancamento.funcionario_id)
    const atual = mapa.get(lancamento.funcionario_id) || {
      id: lancamento.funcionario_id,
      nome: funcionario?.nome || 'Colaborador sem nome',
      cargo: funcionario?.cargo || '',
      totalCreditos: 0,
      totalDescontos: 0,
      quantidadeLancamentos: 0,
      quantidadeItens: 0
    }

    const valor = Number(lancamento.valor || 0)
    if (lancamento.natureza === 'credito') atual.totalCreditos += valor
    if (lancamento.natureza === 'desconto') atual.totalDescontos += valor
    atual.quantidadeLancamentos += 1
    atual.quantidadeItens += itensAtivosPorLancamento.get(lancamento.id) || 0

    mapa.set(lancamento.funcionario_id, atual)
    return mapa
  }, new Map()).values()]
    .map((grupo) => ({
      ...grupo,
      saldo: grupo.totalCreditos - grupo.totalDescontos
    }))
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
}

function montarItensAnaliticosFolha({
  itensLancamentos = [],
  lancamentos = [],
  funcionariosPorId = new Map(),
  competencia = ''
}) {
  const lancamentosPorId = new Map((lancamentos || []).map((lancamento) => [lancamento.id, lancamento]))

  return (itensLancamentos || [])
    .filter((item) => item && !item.arquivado)
    .map((item) => {
      const lancamento = lancamentosPorId.get(item.lancamento_id) || {}
      const funcionarioId = item.funcionario_id || lancamento.funcionario_id
      const funcionario = funcionariosPorId.get(funcionarioId) || {}
      const categoria = item.categoria || lancamento.categoria
      const natureza = obterNaturezaItemFolha(item, lancamento)

      return {
        id: item.id,
        funcionarioId,
        categoriaChave: categoria || '',
        naturezaChave: natureza || '',
        colaborador: funcionario.nome || 'Colaborador não identificado',
        cargo: funcionario.cargo || '',
        competencia: competencia || 'Competência selecionada',
        categoria: LABELS_CATEGORIA_FOLHA[categoria] || categoria || 'Item detalhado',
        natureza: LABELS_NATUREZA_FOLHA[natureza] || natureza || 'Informativo',
        data: item.data_referencia,
        quantidade: formatarNumeroFolha(item.quantidade),
        percentual: formatarNumeroFolha(item.percentual),
        valor: Number(item.valor || 0),
        descricao: item.descricao || ''
      }
    })
    .sort((a, b) => {
      const nome = String(a.colaborador || '').localeCompare(String(b.colaborador || ''), 'pt-BR')
      if (nome !== 0) return nome
      return String(a.data || '').localeCompare(String(b.data || ''))
    })
}

export default function RelatoriosGestaoPessoasPage({
  styles,
  empresaId,
  empresaNome,
  voltarPainel
}) {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral')
  const [competenciaFolhaId, setCompetenciaFolhaId] = useState('')
  const [filtroFolhaColaborador, setFiltroFolhaColaborador] = useState('')
  const [filtroFolhaCategoria, setFiltroFolhaCategoria] = useState('')
  const [filtroFolhaNatureza, setFiltroFolhaNatureza] = useState('')
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
    autoCarregar: abaAtiva === 'visao-geral' || abaAtiva === 'folha'
  })

  const resumoFuncionarios = useMemo(() => calcularResumoFuncionarios(funcionarios), [funcionarios])
  const funcionariosPorId = useMemo(() => {
    return new Map((funcionarios || []).map((funcionario) => [funcionario.id, funcionario]))
  }, [funcionarios])

  const {
    competencias,
    lancamentos,
    itensLancamentos,
    loading: loadingFolha,
    erro: erroFolha,
    resumo: resumoFolha
  } = useFolha({
    empresaId,
    competenciaId: competenciaFolhaId,
    incluirArquivadas: false,
    incluirArquivados: false,
    autoCarregarCompetencias: abaAtiva === 'folha',
    autoCarregarLancamentos: abaAtiva === 'folha' && Boolean(competenciaFolhaId)
  })

  const competenciaFolhaSelecionada = useMemo(() => {
    return competencias.find((competencia) => competencia.id === competenciaFolhaId) || null
  }, [competenciaFolhaId, competencias])

  const gruposFolha = useMemo(() => {
    return calcularResumoPorColaborador(lancamentos, itensLancamentos, funcionariosPorId)
  }, [funcionariosPorId, itensLancamentos, lancamentos])

  const itensAnaliticosFolha = useMemo(() => {
    return montarItensAnaliticosFolha({
      itensLancamentos,
      lancamentos,
      funcionariosPorId,
      competencia: competenciaFolhaSelecionada?.competencia
    })
  }, [competenciaFolhaSelecionada?.competencia, funcionariosPorId, itensLancamentos, lancamentos])

  const opcoesFiltroFolha = useMemo(() => {
    const colaboradores = new Map()
    const categorias = new Map()
    const naturezas = new Map()

    itensAnaliticosFolha.forEach((item) => {
      if (item.funcionarioId) colaboradores.set(item.funcionarioId, item.colaborador)
      if (item.categoriaChave) categorias.set(item.categoriaChave, item.categoria)
      if (item.naturezaChave) naturezas.set(item.naturezaChave, item.natureza)
    })

    const ordenar = ([, a], [, b]) => String(a || '').localeCompare(String(b || ''), 'pt-BR')

    return {
      colaboradores: [...colaboradores.entries()].sort(ordenar),
      categorias: [...categorias.entries()].sort(ordenar),
      naturezas: [...naturezas.entries()].sort(ordenar)
    }
  }, [itensAnaliticosFolha])

  const itensAnaliticosFolhaFiltrados = useMemo(() => {
    return itensAnaliticosFolha.filter((item) => {
      const colaboradorOk = !filtroFolhaColaborador || item.funcionarioId === filtroFolhaColaborador
      const categoriaOk = !filtroFolhaCategoria || item.categoriaChave === filtroFolhaCategoria
      const naturezaOk = !filtroFolhaNatureza || item.naturezaChave === filtroFolhaNatureza
      return colaboradorOk && categoriaOk && naturezaOk
    })
  }, [filtroFolhaCategoria, filtroFolhaColaborador, filtroFolhaNatureza, itensAnaliticosFolha])

  useEffect(() => {
    if (abaAtiva !== 'folha') return
    if (competenciaFolhaId && competencias.some((competencia) => competencia.id === competenciaFolhaId)) return
    setCompetenciaFolhaId(competencias[0]?.id || '')
  }, [abaAtiva, competenciaFolhaId, competencias])

  useEffect(() => {
    setFiltroFolhaColaborador('')
    setFiltroFolhaCategoria('')
    setFiltroFolhaNatureza('')
  }, [competenciaFolhaId])

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
          setErroResumo(mensagemSeguraErro(error, 'Não foi possível carregar a visão geral.'))
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
            <strong>Empresa ativa necessária</strong>
            <p>Selecione uma empresa para carregar os relatórios de Gestão de Pessoas.</p>
          </div>
        </section>
      )
    }

    if (loading || loadingResumo) {
      return (
        <section style={styles.cardConfiguracao}>
          <p style={styles.textoNota}>Carregando visão geral de Gestão de Pessoas...</p>
        </section>
      )
    }

    if (erro || erroResumo) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Não foi possível carregar</strong>
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
        <section className="people-report-overview-grid" aria-label="Visão geral de pessoas">
          <IndicadorCard label="Colaboradores ativos" valor={resumoFuncionarios.ativos} detalhe="Não arquivados" />
          <IndicadorCard label="Afastados" valor={resumoFuncionarios.afastados} detalhe="Status cadastral" />
          <IndicadorCard label="Desligados" valor={resumoFuncionarios.desligados} detalhe="Não arquivados" />
          <IndicadorCard label="Arquivados" valor={resumoFuncionarios.arquivados} detalhe="Arquivamento lógico" />
          <IndicadorCard label="Períodos vencidos" valor={resumoOperacional.feriasVencidas} detalhe="Aquisitivos com saldo" />
          <IndicadorCard label="Férias a vencer" valor={resumoOperacional.feriasAVencer} detalhe="Próximos 30 dias" />
          <IndicadorCard label="Gozos agendados" valor={resumoOperacional.feriasAgendadas} detalhe="Com data real lançada" />
          <IndicadorCard label="Exames previstos" valor={resumoOperacional.examesPrevistos} detalhe="Próximos 30 dias" />
        </section>

        <section className="people-report-overview-note">
          <strong>Consulta visual interna.</strong>
          <p>
            Esta visão não exibe CPF, telefone, e-mail, salário, documentos, laudos, anexos,
            CID, diagnósticos, resultados de exame ou dados médicos. Relatórios de férias
            diferenciam período aquisitivo e gozo lançado com data real.
          </p>
        </section>
      </>
    )
  }

  function renderFolha() {
    if (!empresaId) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Empresa ativa necessária</strong>
            <p>Selecione uma empresa para carregar o relatório sintético de folha.</p>
          </div>
        </section>
      )
    }

    if (loadingFolha && competencias.length === 0) {
      return (
        <section style={styles.cardConfiguracao}>
          <p style={styles.textoNota}>Carregando competências de folha...</p>
        </section>
      )
    }

    if (erroFolha) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">!</div>
            <strong>Não foi possível carregar a folha</strong>
            <p>{erroFolha}</p>
          </div>
        </section>
      )
    }

    if (competencias.length === 0) {
      return (
        <section style={styles.cardConfiguracao}>
          <div className="empty-state-card">
            <div className="empty-state-icon">F</div>
            <strong>Nenhuma competência de folha cadastrada ainda</strong>
            <p>
              A base de folha está vazia. Crie manualmente uma competência em Fechamento de Folha
              quando a empresa for processar a folha; este relatório não cria competência ou lançamento.
            </p>
          </div>
        </section>
      )
    }

    return (
      <div className="people-report-payroll">
        <section className="people-report-payroll-filter" aria-label="Filtro de competencia da folha">
          <label>
            <span>Competência</span>
            <select value={competenciaFolhaId} onChange={(event) => setCompetenciaFolhaId(event.target.value)}>
              {competencias.map((competencia) => (
                <option key={competencia.id} value={competencia.id}>
                  {competencia.competencia} - {LABELS_STATUS_COMPETENCIA[competencia.status] || competencia.status}
                </option>
              ))}
            </select>
          </label>
          {competenciaFolhaSelecionada && (
            <p>
              Competência <strong>{competenciaFolhaSelecionada.competencia}</strong> em status{' '}
              <strong>{LABELS_STATUS_COMPETENCIA[competenciaFolhaSelecionada.status] || competenciaFolhaSelecionada.status}</strong>.
            </p>
          )}
        </section>

        {loadingFolha && competenciaFolhaId ? (
          <section style={styles.cardConfiguracao}>
            <p style={styles.textoNota}>Carregando lançamentos da competência...</p>
          </section>
        ) : (
          <>
            <section className="people-report-overview-grid" aria-label="Resumo sintético da folha">
              <IndicadorCard label="Créditos" valor={formatarMoeda(resumoFolha.totalCreditos)} detalhe="Lançamentos ativos" />
              <IndicadorCard label="Descontos" valor={formatarMoeda(resumoFolha.totalDescontos)} detalhe="Lançamentos ativos" />
              <IndicadorCard label="Saldo" valor={formatarMoeda(resumoFolha.saldoInformativo)} detalhe="Crédito menos desconto" />
              <IndicadorCard label="Lançamentos" valor={resumoFolha.quantidadeLancamentos} detalhe="Registros ativos" />
              <IndicadorCard label="Itens detalhados" valor={itensLancamentos.length} detalhe="Itens ativos vinculados" />
              <IndicadorCard label="Colaboradores" valor={gruposFolha.length} detalhe="Com lançamentos na competência" />
            </section>

            <section className="people-report-payroll-section">
              <div className="people-report-payroll-section-header">
                <div>
                  <h2>Resumo por colaborador</h2>
                  <p>Visão gerencial consolidada. Itens arquivados não entram na contagem.</p>
                </div>
              </div>

              {gruposFolha.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-state-icon">F</div>
                  <strong>Nenhum lançamento ativo nesta competência</strong>
                  <p>Lançamentos de folha são manuais. Este relatório apenas apresenta o que já foi cadastrado.</p>
                </div>
              ) : (
                <div className="people-report-payroll-list">
                  {gruposFolha.map((grupo) => (
                    <article key={grupo.id} className="people-report-payroll-row">
                      <div>
                        <h3>{grupo.nome}</h3>
                        <small>{grupo.cargo || 'Cargo não informado'}</small>
                      </div>
                      <div className="people-report-payroll-row-meta">
                        <strong>{formatarMoeda(grupo.saldo)}</strong>
                        <small>Créditos: {formatarMoeda(grupo.totalCreditos)} | Descontos: {formatarMoeda(grupo.totalDescontos)}</small>
                        <small>{grupo.quantidadeLancamentos} lançamento(s) | {grupo.quantidadeItens} item(ns) detalhado(s)</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="people-report-payroll-section">
              <div className="people-report-payroll-section-header">
                <div>
                  <h2>Visão analítica de itens</h2>
                  <p>Itens detalhados ativos da competência selecionada. Itens arquivados não aparecem neste relatório.</p>
                </div>
              </div>

              {itensAnaliticosFolha.length > 0 && (
                <div className="people-report-payroll-filter-grid" aria-label="Filtros da visão analítica de folha">
                  <label>
                    <span>Colaborador</span>
                    <select value={filtroFolhaColaborador} onChange={(event) => setFiltroFolhaColaborador(event.target.value)}>
                      <option value="">Todos os colaboradores</option>
                      {opcoesFiltroFolha.colaboradores.map(([id, nome]) => (
                        <option key={id} value={id}>{nome}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Categoria</span>
                    <select value={filtroFolhaCategoria} onChange={(event) => setFiltroFolhaCategoria(event.target.value)}>
                      <option value="">Todas as categorias</option>
                      {opcoesFiltroFolha.categorias.map(([id, nome]) => (
                        <option key={id} value={id}>{nome}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Natureza</span>
                    <select value={filtroFolhaNatureza} onChange={(event) => setFiltroFolhaNatureza(event.target.value)}>
                      <option value="">Todas</option>
                      {opcoesFiltroFolha.naturezas.map(([id, nome]) => (
                        <option key={id} value={id}>{nome}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {itensAnaliticosFolha.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-state-icon">I</div>
                  <strong>Sem itens detalhados ativos</strong>
                  <p>Não há itens ativos vinculados aos lançamentos desta competência.</p>
                </div>
              ) : itensAnaliticosFolhaFiltrados.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-state-icon">I</div>
                  <strong>Nenhum item encontrado</strong>
                  <p>Nenhum item encontrado para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="people-report-payroll-item-list">
                  {itensAnaliticosFolhaFiltrados.map((item) => (
                    <article key={item.id} className="people-report-payroll-item-card">
                      <div className="people-report-payroll-item-heading">
                        <div>
                          <h3>{item.colaborador}</h3>
                          <small>{item.cargo || 'Cargo não informado'} | {item.competencia}</small>
                        </div>
                        <strong>{formatarMoeda(item.valor)}</strong>
                      </div>

                      <div className="people-report-payroll-item-tags">
                        <span>{item.categoria}</span>
                        <span>{item.natureza}</span>
                        <span>{formatarDataCurta(item.data)}</span>
                      </div>

                      <div className="people-report-payroll-item-meta">
                        {item.quantidade && <small>Quantidade: {item.quantidade}</small>}
                        {item.percentual && <small>Percentual: {item.percentual}%</small>}
                      </div>

                      {item.descricao && (
                        <p>{item.descricao}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="people-report-overview-note">
              <strong>Relatório gerencial de apoio.</strong>
              <p>
                Esta aba não substitui a contabilidade, não calcula encargos trabalhistas e não exibe CPF,
                telefone, e-mail, documentos, laudos, CID, diagnósticos, resultados de exame ou dados médicos.
              </p>
            </section>
          </>
        )}
      </div>
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
          grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
          gap: 10px;
        }
        .people-report-overview-card {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 8px;
          padding: 10px 12px;
          display: grid;
          gap: 4px;
          min-height: 86px;
          align-content: center;
        }
        .people-report-overview-card span,
        .people-report-overview-card small {
          color: #64748b;
        }
        .people-report-overview-card span {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.2;
        }
        .people-report-overview-card small {
          font-size: 12px;
          line-height: 1.25;
        }
        .people-report-overview-card strong {
          color: #0f172a;
          font-size: 22px;
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
        .people-report-payroll {
          display: grid;
          gap: 14px;
        }
        .people-report-payroll-filter {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 8px;
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .people-report-payroll-filter label {
          display: grid;
          gap: 6px;
          color: #475569;
          font-weight: 700;
        }
        .people-report-payroll-filter select {
          min-height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 10px;
          color: #0f172a;
          background: #ffffff;
        }
        .people-report-payroll-filter p {
          margin: 0;
          color: #64748b;
        }
        .people-report-payroll-section {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 8px;
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .people-report-payroll-section-header h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
        }
        .people-report-payroll-section-header p {
          margin: 4px 0 0;
          color: #64748b;
        }
        .people-report-payroll-list {
          display: grid;
          gap: 10px;
        }
        .people-report-payroll-row {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, auto);
          gap: 12px;
          align-items: center;
        }
        .people-report-payroll-row h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
        }
        .people-report-payroll-row small {
          color: #64748b;
        }
        .people-report-payroll-row-meta {
          display: grid;
          gap: 4px;
          text-align: right;
        }
        .people-report-payroll-row-meta strong {
          color: #0f172a;
        }
        .people-report-payroll-filter-grid {
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .people-report-payroll-filter-grid label {
          display: grid;
          gap: 6px;
          min-width: 0;
          color: #475569;
          font-weight: 700;
        }
        .people-report-payroll-filter-grid select {
          min-height: 40px;
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 10px;
          color: #0f172a;
          background: #ffffff;
        }
        .people-report-payroll-item-list {
          display: grid;
          gap: 10px;
        }
        .people-report-payroll-item-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          display: grid;
          gap: 10px;
          min-width: 0;
        }
        .people-report-payroll-item-card h3,
        .people-report-payroll-item-card p {
          margin: 0;
        }
        .people-report-payroll-item-card h3 {
          color: #0f172a;
          font-size: 16px;
        }
        .people-report-payroll-item-card small,
        .people-report-payroll-item-card p {
          color: #64748b;
        }
        .people-report-payroll-item-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
        }
        .people-report-payroll-item-heading strong {
          color: #0f172a;
          white-space: nowrap;
        }
        .people-report-payroll-item-tags,
        .people-report-payroll-item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .people-report-payroll-item-tags span {
          border: 1px solid #dbe4ef;
          background: #f8fafc;
          color: #334155;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .people-report-tabs { display: grid; grid-template-columns: 1fr; }
          .people-report-tab { width: 100%; text-align: left; }
          .people-report-payroll-filter-grid { grid-template-columns: 1fr; }
          .people-report-payroll-row { grid-template-columns: 1fr; }
          .people-report-payroll-row-meta { text-align: left; }
          .people-report-payroll-item-heading { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="master-page-hero">
        <div>
          <span className="master-kicker">Gestão de Pessoas</span>
          <h1 style={styles.titulo}>Relatórios de Gestão de Pessoas</h1>
          <p style={styles.textoNota}>Visão central para colaboradores, exames, períodos aquisitivos de férias e folha.</p>
          <small style={styles.textoAjuda}>Empresa ativa: <strong>{empresaNome || 'Empresa não identificada'}</strong></small>
        </div>
        <button style={styles.btnCinza} type="button" onClick={voltarPainel}>Voltar ao Painel</button>
      </div>

      <nav className="people-report-tabs" aria-label="Abas de relatórios de Gestão de Pessoas">
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
      {abaAtiva === 'folha' && renderFolha()}
    </div>
  )
}
