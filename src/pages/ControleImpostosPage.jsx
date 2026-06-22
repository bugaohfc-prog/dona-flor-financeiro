import { useMemo, useState } from 'react'

const FILTROS_IMPOSTOS = [
  ['todos', 'Todos'],
  ['simples', 'Simples Nacional'],
  ['fgts', 'FGTS'],
  ['inss', 'INSS'],
  ['abertos', 'Em aberto'],
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

function obterStatusOperacional(conta) {
  if (String(conta?.status || '').toLowerCase() === 'pago') return 'pago'
  if (dataEstaVencida(conta)) return 'vencido'
  return 'aberto'
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
  contas = [],
  centros = [],
  filiais = [],
  formatarValor,
  formatarData,
  navegarPara
}) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const impostosEncontrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return (contas || [])
      .filter((conta) => conta && conta.excluido !== true)
      .map((conta) => {
        const classificacao = classificarImposto(conta, centros)
        if (!classificacao) return null

        const centro = obterCentro(conta, centros)
        const filial = obterFilial(conta, filiais)
        const statusOperacional = obterStatusOperacional(conta)
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
      .filter((conta) => {
        if (filtro === 'simples' && conta.impostoTipo !== 'simples') return false
        if (filtro === 'fgts' && conta.impostoTipo !== 'fgts') return false
        if (filtro === 'inss' && conta.impostoTipo !== 'inss') return false
        if (filtro === 'abertos' && conta.statusOperacional !== 'aberto') return false
        if (filtro === 'vencidos' && conta.statusOperacional !== 'vencido') return false
        if (filtro === 'pagos' && conta.statusOperacional !== 'pago') return false
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
  }, [busca, centros, contas, filiais, filtro])

  const resumo = useMemo(() => {
    const lista = impostosEncontrados
    const abertos = lista.filter((conta) => conta.statusOperacional === 'aberto')
    const vencidos = lista.filter((conta) => conta.statusOperacional === 'vencido')
    const pagos = lista.filter((conta) => conta.statusOperacional === 'pago')
    const proximos = lista
      .filter((conta) => conta.statusOperacional !== 'pago' && obterDataVencimento(conta))
      .sort(ordenarImpostos)

    return {
      total: lista.length,
      abertos: abertos.length,
      vencidos: vencidos.length,
      pagos: pagos.length,
      proximo: proximos[0] || null
    }
  }, [impostosEncontrados])

  return (
    <main className="accounts-page tax-control-page">
      <div className="page-title-actions accounts-page-header tax-control-header">
        <div className="accounts-page-header-copy">
          <span>Financeiro</span>
          <h1>Controle de impostos</h1>
          <p>Acompanhe Simples Nacional, FGTS e INSS por vencimento e status.</p>
        </div>
        <div className="page-actions-row">
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
          <span><b>Em aberto</b>{resumo.abertos}</span>
          <span className={resumo.vencidos ? 'has-warning' : ''}><b>Vencidos</b>{resumo.vencidos}</span>
          <span><b>Pagos</b>{resumo.pagos}</span>
          <span className="has-info">
            <b>Próximo vencimento</b>
            {resumo.proximo ? formatarData(obterDataVencimento(resumo.proximo)) : '-'}
          </span>
        </div>

        <div className="accounts-recurring-controls tax-control-controls">
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
                    <h2>{conta.descricao || 'Conta sem descrição'}</h2>
                  </div>
                  <strong>{formatarValor(Number(conta.valor || 0))}</strong>
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
                    {conta.statusOperacional === 'pago' ? 'Pago' : conta.statusOperacional === 'vencido' ? 'Vencido' : 'Em aberto'}
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
      </section>
    </main>
  )
}
