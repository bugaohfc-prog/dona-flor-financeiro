import { useMemo, useState } from 'react'
import ContasContextualGuard from '../components/feedback/ContasContextualGuard.jsx'
import { useRelatorioFinanceiro } from '../hooks/useRelatorioFinanceiro.js'
import { podeExportarRelatorio } from '../utils/relatoriosFinanceiros.js'
import { impostoPertenceAoFiltro, obterSaldoExibidoImposto, obterStatusOperacionalImposto } from '../utils/consumidoresFinanceiros.js'
import { exportCsv } from '../services/export/reportExportService.js'

const FILTROS_IMPOSTOS = [
  ['todos', 'Todos'],
  ['simples', 'Simples Nacional'],
  ['fgts', 'FGTS'],
  ['inss', 'INSS'],
  ['abertos', 'A vencer'],
  ['vencidos', 'Vencidos'],
  ['pagos', 'Pagos']
]

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterCentro(conta, centros) {
  return (centros || []).find((centro) => centro.id === conta?.centro_custo_id) || conta?.df_centros_custo || null
}

function obterFilial(conta, filiais) {
  return (filiais || []).find((filial) => filial.id === conta?.filial_id) || conta?.df_filiais || null
}

function classificarImposto(conta, centros) {
  const tipoFiscal = String(conta?.imposto_tipo || '').trim()
  if (tipoFiscal === 'simples_nacional') {
    return { tipo: 'simples', label: 'Simples Nacional', prioridade: 1, origem: 'informada' }
  }
  if (tipoFiscal === 'fgts') {
    return { tipo: 'fgts', label: 'FGTS', prioridade: 2, origem: 'informada' }
  }
  if (tipoFiscal === 'inss') {
    return { tipo: 'inss', label: 'INSS', prioridade: 3, origem: 'informada' }
  }
  if (tipoFiscal === 'outro') {
    return { tipo: 'outros', label: 'Outro imposto', prioridade: 4, origem: 'informada' }
  }

  const descricaoNormalizada = normalizarTexto(conta?.descricao)
  const centro = obterCentro(conta, centros)
  const centroNormalizado = normalizarTexto(centro?.nome)

  if (descricaoNormalizada.includes('simples')) {
    return { tipo: 'simples', label: 'Simples Nacional', prioridade: 1, origem: 'estimada' }
  }

  if (descricaoNormalizada.includes('fgts')) {
    return { tipo: 'fgts', label: 'FGTS', prioridade: 2, origem: 'estimada' }
  }

  if (descricaoNormalizada.includes('inss')) {
    return { tipo: 'inss', label: 'INSS', prioridade: 3, origem: 'estimada' }
  }

  if (centroNormalizado === 'impostos e taxas') {
    return { tipo: 'outros', label: 'Outros impostos', prioridade: 4, origem: 'estimada' }
  }

  return null
}

function obterDataVencimento(conta) {
  return conta?.data_vencimento || conta?.vencimento || ''
}

function dataEstaVencida(conta) {
  if (String(conta?.status || '').toLowerCase() === 'pago') return false
  const dataVencimento = obterDataVencimento(conta)
  if (!dataVencimento) return false

  const hoje = new Date()
  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const vencimento = new Date(`${dataVencimento}T00:00:00`)
  return vencimento < hojeLocal
}

function obterCompetenciaEstimada(conta) {
  const data = obterDataVencimento(conta)
  if (!data) return 'Sem data'

  const [ano, mes] = String(data).split('-')
  const indiceMes = Number(mes) - 1
  if (!ano || indiceMes < 0 || indiceMes > 11) return 'Sem data'

  return `${MESES[indiceMes]}/${ano}`
}

function obterCompetenciaFiscal(conta) {
  if (conta?.competencia) {
    const [ano, mes] = String(conta.competencia).split('-')
    const indiceMes = Number(mes) - 1
    if (ano && indiceMes >= 0 && indiceMes <= 11) {
      return {
        label: `${MESES[indiceMes]}/${ano}`,
        origem: 'informada'
      }
    }
  }

  return {
    label: obterCompetenciaEstimada(conta),
    origem: 'estimada'
  }
}

function ordenarImpostos(a, b) {
  const dataA = obterDataVencimento(a)
  const dataB = obterDataVencimento(b)
  if (dataA !== dataB) return String(dataA || '').localeCompare(String(dataB || ''))
  return String(a.descricao || '').localeCompare(String(b.descricao || ''))
}

function mapearPossiveisDuplicidadesVisuais(lista) {
  const grupos = new Map()

  lista.forEach((conta) => {
    const chave = [
      conta.filial_id || conta.filialNome,
      conta.impostoTipo,
      conta.competenciaFiscal,
      obterDataVencimento(conta) || 'sem-vencimento'
    ].join('|')

    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave).push(conta)
  })

  const idsDuplicados = new Set()

  grupos.forEach((contasGrupo) => {
    if (contasGrupo.length < 2) return

    contasGrupo.forEach((conta, indice) => {
      const valor = Number(conta.valor || 0)
      const temValorProximo = contasGrupo.some((comparada, indiceComparado) => {
        if (indice === indiceComparado) return false
        return Math.abs(valor - Number(comparada.valor || 0)) <= 1
      })

      if (temValorProximo) idsDuplicados.add(conta.id)
    })
  })

  return idsDuplicados
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state-card tax-control-empty">
      <div className="empty-state-icon">TX</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export default function ControleImpostosPage({
  empresaId,
  centros = [],
  filiais = [],
  formatarValor,
  formatarData,
  navegarPara
}) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const agora = new Date()
  const [dataInicial, setDataInicial] = useState(`${agora.getFullYear()}-01-01`)
  const [dataFinal, setDataFinal] = useState(`${agora.getFullYear()}-12-31`)
  const [campoPeriodo, setCampoPeriodo] = useState('data_vencimento')
  const [filialId, setFilialId] = useState('')
  const [incluirOcultas, setIncluirOcultas] = useState(false)
  const criterios = useMemo(() => ({
    base: 'vencimento', dataInicial, dataFinal, campoPeriodo, status: 'todas', filialId,
    centroCustoId: '', origem: 'todas', incluirOcultas, busca: ''
  }), [campoPeriodo, dataFinal, dataInicial, filialId, incluirOcultas])
  const fonteFinanceira = useRelatorioFinanceiro({ empresaId, criterios })
  const contas = fonteFinanceira.registros
  const exportacaoDisponivel = podeExportarRelatorio(fonteFinanceira)

  const impostosBase = useMemo(() => {
    return (contas || [])
      .filter((conta) => conta && conta.excluido !== true)
      .map((conta) => {
        const classificacao = classificarImposto(conta, centros)
        if (!classificacao) return null

        const centro = obterCentro(conta, centros)
        const filial = obterFilial(conta, filiais)
        const statusOperacional = obterStatusOperacionalImposto(conta)
        const competenciaFiscal = obterCompetenciaFiscal(conta)

        return {
          ...conta,
          impostoTipo: classificacao.tipo,
          impostoLabel: classificacao.label,
          impostoPrioridade: classificacao.prioridade,
          impostoOrigem: classificacao.origem,
          centroNome: centro?.nome || 'Sem centro',
          filialNome: filial?.nome || 'Sem filial',
          statusOperacional,
          competenciaFiscal: competenciaFiscal.label,
          competenciaOrigem: competenciaFiscal.origem
        }
      })
      .filter(Boolean)
  }, [centros, contas, filiais])

  const impostosEncontrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    const filtrados = impostosBase
      .filter((conta) => {
        if (filtro === 'simples' && conta.impostoTipo !== 'simples') return false
        if (filtro === 'fgts' && conta.impostoTipo !== 'fgts') return false
        if (filtro === 'inss' && conta.impostoTipo !== 'inss') return false
        if (!impostoPertenceAoFiltro(conta, filtro)) return false
        if (!termo) return true

        return [
          conta.impostoLabel,
          conta.descricao,
          conta.centroNome,
          conta.filialNome,
          conta.competenciaFiscal
        ].some((valor) => normalizarTexto(valor).includes(termo))
      })
      .sort((a, b) => {
        if (a.impostoPrioridade !== b.impostoPrioridade) return a.impostoPrioridade - b.impostoPrioridade
        return ordenarImpostos(a, b)
      })

    const idsDuplicados = mapearPossiveisDuplicidadesVisuais(filtrados)

    return filtrados.map((conta) => ({
      ...conta,
      possivelDuplicidadeVisual: idsDuplicados.has(conta.id)
    }))
  }, [busca, filtro, impostosBase])

  const resumo = useMemo(() => {
    const lista = impostosEncontrados
    const aVencer = lista.filter((conta) => ['aberto', 'parcial'].includes(conta.statusOperacional))
    const vencidos = lista.filter((conta) => conta.statusOperacional === 'vencido')
    const pagos = lista.filter((conta) => conta.statusOperacional === 'pago')
    const proximos = aVencer
      .filter((conta) => obterDataVencimento(conta))
      .sort(ordenarImpostos)
    const vencidosOrdenados = vencidos
      .filter((conta) => obterDataVencimento(conta))
      .sort(ordenarImpostos)
    const cardVencimento = proximos[0]
      ? { label: 'Próximo vencimento', conta: proximos[0], vazio: 'Nenhum' }
      : vencidosOrdenados[0]
        ? { label: 'Vencido mais antigo', conta: vencidosOrdenados[0], vazio: 'Nenhum' }
        : { label: 'Próximo vencimento', conta: null, vazio: 'Nenhum' }

    return {
      total: lista.length,
      aVencer: aVencer.length,
      vencidos: vencidos.length,
      pagos: pagos.length,
      cardVencimento
    }
  }, [impostosEncontrados])

  function exportarImpostos() {
    if (!exportacaoDisponivel) return
    exportCsv({
      filename: `controle-impostos-${dataInicial}-${dataFinal}.csv`,
      headers: ['Imposto', 'Descrição', 'Competência', 'Vencimento', 'Previsto', 'Pago', 'Saldo', 'Status', 'Filial', 'Centro'],
      rows: impostosEncontrados.map((conta) => [
        conta.impostoLabel, conta.descricao, conta.competenciaFiscal, obterDataVencimento(conta),
        conta.valor_previsto_relatorio, conta.valor_pago_atual_relatorio, conta.saldo_restante_relatorio,
        conta.status_relatorio, conta.filialNome, conta.centroNome
      ])
    })
  }

  return (
    <main className="accounts-page tax-control-page">
      <div className="page-title-actions accounts-page-header tax-control-header">
        <div className="accounts-page-header-copy">
          <span>Financeiro</span>
          <h1>Controle de impostos</h1>
          <p>Acompanhe Simples Nacional, FGTS e INSS por vencimento e status.</p>
        </div>
        <div className="page-actions-row">
          <button type="button" onClick={exportarImpostos} disabled={!exportacaoDisponivel}>Exportar CSV</button>
          <button type="button" onClick={() => navegarPara?.('contas')}>
            Ver contas
          </button>
        </div>
      </div>

      <section className="content-block accounts-recurring-section tax-control-section">
        <div className="accounts-recurring-guidance tax-control-guidance" role="note">
          <span>Visão somente leitura baseada nas contas existentes.</span>
          <span>Contas classificadas usam competência informada; contas antigas continuam com competência estimada pelo vencimento.</span>
          <span>Nenhuma conta é criada, baixada ou reclassificada por esta tela.</span>
        </div>

        <div className="accounts-recurring-summary tax-control-summary">
          <span><b>Total encontrado</b>{resumo.total}</span>
          <span><b>A vencer</b>{resumo.aVencer}</span>
          <span className={resumo.vencidos ? 'has-warning' : ''}><b>Vencidos</b>{resumo.vencidos}</span>
          <span><b>Pagos</b>{resumo.pagos}</span>
          <span className="has-info">
            <b>{resumo.cardVencimento.label}</b>
            {resumo.cardVencimento.conta ? formatarData(obterDataVencimento(resumo.cardVencimento.conta)) : resumo.cardVencimento.vazio}
          </span>
        </div>

        <div className="accounts-recurring-controls tax-control-controls">
          <select value={campoPeriodo} onChange={(event) => setCampoPeriodo(event.target.value)} aria-label="Base do período dos impostos">
            <option value="data_vencimento">Vencimento</option>
            <option value="competencia">Competência</option>
          </select>
          <input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} aria-label="Data inicial dos impostos" />
          <input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} aria-label="Data final dos impostos" />
          <select value={filialId} onChange={(event) => setFilialId(event.target.value)} aria-label="Filial dos impostos">
            <option value="">Todas as filiais</option>
            {(filiais || []).map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
          </select>
          <label><input type="checkbox" checked={incluirOcultas} onChange={(event) => setIncluirOcultas(event.target.checked)} /> Incluir ocultas</label>
          <div className="accounts-status-tabs accounts-recurring-tabs tax-control-tabs" role="tablist" aria-label="Filtro de impostos">
            {FILTROS_IMPOSTOS.map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={filtro === valor}
                className={`accounts-status-tab ${filtro === valor ? 'is-active' : ''}`}
                onClick={() => setFiltro(valor)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="accounts-recurring-search tax-control-search"
            type="search"
            placeholder="Buscar por imposto, descrição, filial, centro ou competência"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>

        <ContasContextualGuard carregando={fonteFinanceira.carregando} carregada={fonteFinanceira.carregado} erro={fonteFinanceira.erro} onRetry={fonteFinanceira.consultar}>
        {impostosEncontrados.length === 0 ? (
          <EmptyState
            title="Nenhum imposto encontrado"
            description="Ajuste os filtros ou confira se Simples Nacional, FGTS e INSS já existem como contas."
          />
        ) : (
          <div className="tax-control-list">
            {impostosEncontrados.map((conta) => (
              <article className={`tax-control-card is-${conta.statusOperacional}`} key={conta.id}>
                <div className="tax-control-card-main">
                  <div>
                    <span className="tax-control-type">{conta.impostoLabel}</span>
                    {conta.possivelDuplicidadeVisual && (
                      <span className="tax-control-review-badge">Revisar possível duplicidade</span>
                    )}
                    <h2>{conta.descricao || 'Conta sem descrição'}</h2>
                  </div>
                  <strong>{formatarValor(obterSaldoExibidoImposto(conta))}</strong>
                </div>

                <div className="tax-control-meta">
                  <span>Vencimento: {obterDataVencimento(conta) ? formatarData(obterDataVencimento(conta)) : '-'}</span>
                  <span>
                    {conta.competenciaOrigem === 'informada' ? 'Competência informada' : 'Competência estimada'}: {conta.competenciaFiscal}
                  </span>
                  {conta.impostoOrigem === 'informada' && <span>Classificação informada</span>}
                  <span>Filial: {conta.filialNome}</span>
                  <span>Centro: {conta.centroNome}</span>
                  <span className={`tax-control-status is-${conta.statusOperacional}`}>
                    {conta.statusOperacional === 'pago'
                      ? (conta.status_relatorio === 'quitada_por_parciais' ? 'Quitada por parciais — baixa pendente' : 'Pago')
                      : conta.statusOperacional === 'vencido'
                        ? (conta.parcialmente_pago ? 'Vencido — parcialmente pago' : 'Vencido')
                        : conta.statusOperacional === 'parcial' ? 'Parcialmente pago' : 'A vencer'}
                  </span>
                </div>

                <div className="tax-control-actions">
                  <button type="button" onClick={() => navegarPara?.('contas')}>
                    Ver conta original
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        </ContasContextualGuard>
        {!exportacaoDisponivel && <small>Exportação disponível somente após a consulta completa do período.</small>}
      </section>
    </main>
  )
}
