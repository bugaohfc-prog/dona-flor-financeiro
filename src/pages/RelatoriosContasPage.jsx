import { useMemo, useState } from 'react'
import {
  exportarRelatorioContasCsv,
  exportarRelatorioContasExcel,
  imprimirRelatorioContas
} from '../utils/relatoriosContasExport.js'

const TIPOS_CONTAS = [
  { valor: 'vencidas', label: 'Vencidas', descricao: 'Abertas com vencimento passado', status: 'Vencida' },
  { valor: 'a-vencer', label: 'A vencer', descricao: 'Abertas dentro do prazo', status: 'A vencer' },
  { valor: 'pagas', label: 'Pagas', descricao: 'Contas já quitadas', status: 'Paga' }
]

const AGRUPAMENTOS = [
  { valor: 'sem', label: 'Sem agrupamento' },
  { valor: 'status', label: 'Por status' },
  { valor: 'vencimento', label: 'Por vencimento' },
  { valor: 'centro', label: 'Por centro de custo' },
  { valor: 'filial', label: 'Por filial/unidade' }
]

const PERIODOS_CONTAS_A_VENCER = [
  { valor: '15', label: 'Próximos 15 dias', dias: 15 },
  { valor: '30', label: 'Próximos 30 dias', dias: 30 },
  { valor: '60', label: 'Próximos 60 dias', dias: 60 },
  { valor: '90', label: 'Próximos 90 dias', dias: 90 },
  { valor: 'todas-abertas', label: 'Todas em aberto', dias: null }
]

function textoSeguro(valor, fallback = '-') {
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

function normalizarBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function nomeMesAno(valor) {
  if (!valor) return 'Sem vencimento'
  const [ano, mes] = String(valor).slice(0, 7).split('-').map(Number)
  if (!ano || !mes) return 'Sem vencimento'
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })
}

function formatarDataBanco(data) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-')
}

function somarDiasBanco(dias) {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  data.setDate(data.getDate() + Number(dias || 0))
  return formatarDataBanco(data)
}

function obterNomeCentro(conta, centros) {
  return textoSeguro(
    conta?.df_centros_custo?.nome
    || centros.find((centro) => centro.id === conta?.centro_custo_id)?.nome,
    'Sem centro'
  )
}

function obterNomeFilial(conta, filiais) {
  return textoSeguro(
    conta?.df_filiais?.nome
    || filiais.find((filial) => filial.id === conta?.filial_id)?.nome,
    'Sem filial'
  )
}

function contaEstaExcluida(conta) {
  return Boolean(conta?.excluida || conta?.deleted_at || conta?.data_exclusao || conta?.excluido_em)
}

function statusOperacional(conta, estaVencida) {
  if (conta?.status === 'pago') return 'Paga'
  return estaVencida(conta?.data_vencimento, conta?.status) ? 'Vencida' : 'A vencer'
}

function classeStatus(status) {
  if (status === 'Paga') return 'is-paid'
  if (status === 'Vencida') return 'is-overdue'
  return 'is-open'
}

function contextoPorTipos(tiposSelecionados) {
  const selecionados = new Set(tiposSelecionados)
  const temVencidas = selecionados.has('vencidas')
  const temAVencer = selecionados.has('a-vencer')
  const temPagas = selecionados.has('pagas')
  const quantidade = tiposSelecionados.length

  if (quantidade === 0) {
    return {
      titulo: 'Relatório sem tipo selecionado',
      descricao: 'Selecione pelo menos um tipo de conta para gerar o relatório.'
    }
  }

  if (temVencidas && temAVencer && !temPagas) {
    return {
      titulo: 'Relatório em aberto',
      descricao: 'Inclui contas vencidas e a vencer.'
    }
  }

  if (temVencidas && !temAVencer && !temPagas) {
    return {
      titulo: 'Relatório de contas vencidas',
      descricao: 'Inclui apenas contas abertas com vencimento passado.'
    }
  }

  if (!temVencidas && temAVencer && !temPagas) {
    return {
      titulo: 'Relatório de contas a vencer',
      descricao: 'Inclui apenas contas abertas dentro do prazo.'
    }
  }

  if (!temVencidas && !temAVencer && temPagas) {
    return {
      titulo: 'Relatório de contas pagas',
      descricao: 'Inclui apenas contas já quitadas.'
    }
  }

  if (temVencidas && temAVencer && temPagas) {
    return {
      titulo: 'Relatório completo',
      descricao: 'Inclui contas vencidas, a vencer e pagas.'
    }
  }

  const partes = []
  if (temVencidas) partes.push('contas vencidas')
  if (temAVencer) partes.push('contas a vencer')
  if (temPagas) partes.push('contas pagas')

  return {
    titulo: 'Relatório personalizado',
    descricao: `Inclui ${partes.join(' e ')}.`
  }
}

function resumoSelecaoTipos(tiposSelecionados) {
  const selecionados = new Set(tiposSelecionados)
  const temVencidas = selecionados.has('vencidas')
  const temAVencer = selecionados.has('a-vencer')
  const temPagas = selecionados.has('pagas')

  if (!tiposSelecionados.length) return 'Selecione o tipo de contas'
  if (temVencidas && temAVencer && !temPagas) return 'Em aberto: Vencidas + A vencer'
  if (temVencidas && !temAVencer && !temPagas) return 'Vencidas'
  if (!temVencidas && temAVencer && !temPagas) return 'A vencer'
  if (!temVencidas && !temAVencer && temPagas) return 'Pagas'
  if (temVencidas && temAVencer && temPagas) return 'Completo: Vencidas + A vencer + Pagas'

  const partes = []
  if (temVencidas) partes.push('Vencidas')
  if (temAVencer) partes.push('A vencer')
  if (temPagas) partes.push('Pagas')
  return `Personalizado: ${partes.join(' + ')}`
}

function resumoSelecaoCentros(centrosSelecionados) {
  if (!centrosSelecionados.length) return 'Todos os centros de custo'
  if (centrosSelecionados.length === 1) return '1 centro selecionado'
  return `${centrosSelecionados.length} centros selecionados`
}

function BlocoRelatorioContas({ titulo, descricao, aberto, onToggle, children }) {
  return (
    <section className="relatorios-contas-card">
      <header className="relatorios-contas-section-header">
        <div>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {typeof onToggle === 'function' && (
          <button type="button" className="relatorios-contas-toggle" onClick={onToggle} aria-expanded={aberto}>
            {aberto ? '−' : '+'}
          </button>
        )}
      </header>
      {aberto !== false && children}
    </section>
  )
}

export default function RelatoriosContasPage({
  contas = [],
  centros = [],
  filiais = [],
  estaVencida,
  formatarValor,
  formatarData,
  navegarPara,
  podeExportarDados = true,
  mostrarAviso
}) {
  const [tiposSelecionados, setTiposSelecionados] = useState(['vencidas', 'a-vencer'])
  const [filtroFilial, setFiltroFilial] = useState('')
  const [centrosSelecionados, setCentrosSelecionados] = useState([])
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [periodoContasAVencer, setPeriodoContasAVencer] = useState('15')
  const [busca, setBusca] = useState('')
  const [agrupamento, setAgrupamento] = useState('status')
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [previaAberta, setPreviaAberta] = useState(true)
  const [tipoDropdownAberto, setTipoDropdownAberto] = useState(false)
  const [centroDropdownAberto, setCentroDropdownAberto] = useState(false)
  const contextoTipos = useMemo(() => contextoPorTipos(tiposSelecionados), [tiposSelecionados])
  const resumoTiposSelecionados = useMemo(() => resumoSelecaoTipos(tiposSelecionados), [tiposSelecionados])
  const possuiTipoSelecionado = tiposSelecionados.length > 0
  const possuiContasAVencerSelecionadas = tiposSelecionados.includes('a-vencer')
  const periodoContasAVencerSelecionado = useMemo(
    () => PERIODOS_CONTAS_A_VENCER.find((periodo) => periodo.valor === periodoContasAVencer) || PERIODOS_CONTAS_A_VENCER[0],
    [periodoContasAVencer]
  )
  const hojeBanco = useMemo(() => formatarDataBanco(new Date()), [])
  const limiteContasAVencer = useMemo(
    () => periodoContasAVencerSelecionado.dias ? somarDiasBanco(periodoContasAVencerSelecionado.dias) : '',
    [periodoContasAVencerSelecionado]
  )

  function alternarTipoConta(tipo) {
    setTiposSelecionados((atuais) => (
      atuais.includes(tipo)
        ? atuais.filter((item) => item !== tipo)
        : [...atuais, tipo]
    ))
  }

  function alternarCentroCusto(centroId) {
    setCentrosSelecionados((atuais) => (
      atuais.includes(centroId)
        ? atuais.filter((item) => item !== centroId)
        : [...atuais, centroId]
    ))
  }

  function selecionarTodosCentros() {
    setCentrosSelecionados(centros.map((centro) => centro.id).filter(Boolean))
  }

  const vencida = typeof estaVencida === 'function'
    ? estaVencida
    : ((data, status) => {
      if (!data || status === 'pago') return false
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const vencimento = new Date(`${data}T00:00:00`)
      return vencimento < hoje
    })

  const contasNormalizadas = useMemo(() => (contas || [])
    .filter((conta) => !contaEstaExcluida(conta))
    .map((conta) => {
      const centroNome = obterNomeCentro(conta, centros)
      const filialNome = obterNomeFilial(conta, filiais)
      const status = statusOperacional(conta, vencida)
      const valorNumerico = Number(conta?.valor || 0)

      return {
        conta,
        descricao: textoSeguro(conta?.descricao, 'Conta sem descrição'),
        valor: valorNumerico,
        valorFormatado: formatarValor ? formatarValor(valorNumerico) : valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        vencimento: conta?.data_vencimento || '',
        vencimentoFormatado: conta?.data_vencimento && formatarData ? formatarData(conta.data_vencimento) : textoSeguro(conta?.data_vencimento, '-'),
        statusOperacional: status,
        centroNome,
        filialNome,
        observacao: textoSeguro(conta?.observacao, ''),
        busca: normalizarBusca([
          conta?.descricao,
          conta?.observacao,
          conta?.categoria,
          centroNome,
          filialNome,
          status,
          conta?.data_vencimento
        ].filter(Boolean).join(' '))
      }
    }), [centros, contas, filiais, formatarData, formatarValor, vencida])

  const contasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca)

    return contasNormalizadas
      .filter((linha) => {
        if (!possuiTipoSelecionado) return false
        if (periodoContasAVencer === 'todas-abertas' && possuiContasAVencerSelecionadas) {
          return linha.statusOperacional === 'Vencida' || linha.statusOperacional === 'A vencer'
        }
        if (linha.statusOperacional === 'Vencida') return tiposSelecionados.includes('vencidas')
        if (linha.statusOperacional === 'A vencer') return tiposSelecionados.includes('a-vencer')
        if (linha.statusOperacional === 'Paga') return tiposSelecionados.includes('pagas')
        return false
      })
      .filter((linha) => {
        if (!possuiContasAVencerSelecionadas) return true
        if (periodoContasAVencer === 'todas-abertas') return true
        if (linha.statusOperacional !== 'A vencer') return true
        if (!linha.vencimento) return false
        return linha.vencimento >= hojeBanco && linha.vencimento <= limiteContasAVencer
      })
      .filter((linha) => !filtroFilial || linha.conta.filial_id === filtroFilial)
      .filter((linha) => !centrosSelecionados.length || centrosSelecionados.includes(linha.conta.centro_custo_id || ''))
      .filter((linha) => !dataInicial || !linha.vencimento || linha.vencimento >= dataInicial)
      .filter((linha) => !dataFinal || !linha.vencimento || linha.vencimento <= dataFinal)
      .filter((linha) => !termo || linha.busca.includes(termo))
      .sort((a, b) => String(a.vencimento || '9999-12-31').localeCompare(String(b.vencimento || '9999-12-31')))
  }, [busca, centrosSelecionados, contasNormalizadas, dataFinal, dataInicial, filtroFilial, hojeBanco, limiteContasAVencer, periodoContasAVencer, possuiContasAVencerSelecionadas, possuiTipoSelecionado, tiposSelecionados])

  const resumo = useMemo(() => {
    const totalContas = contasFiltradas.length
    const valorTotal = contasFiltradas.reduce((acc, linha) => acc + linha.valor, 0)
    const vencidas = contasFiltradas.filter((linha) => linha.statusOperacional === 'Vencida')
    const aVencer = contasFiltradas.filter((linha) => linha.statusOperacional === 'A vencer')
    const pagas = contasFiltradas.filter((linha) => linha.statusOperacional === 'Paga')
    const valorVencido = vencidas.reduce((acc, linha) => acc + linha.valor, 0)
    const valorAVencer = aVencer.reduce((acc, linha) => acc + linha.valor, 0)
    const valorPago = pagas.reduce((acc, linha) => acc + linha.valor, 0)

    return {
      totalContas,
      valorTotal,
      valorTotalFormatado: formatarValor ? formatarValor(valorTotal) : valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      quantidadeVencidas: vencidas.length,
      quantidadeAVencer: aVencer.length,
      quantidadePagas: pagas.length,
      valorVencidoFormatado: formatarValor ? formatarValor(valorVencido) : valorVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valorAVencerFormatado: formatarValor ? formatarValor(valorAVencer) : valorAVencer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valorPagoFormatado: formatarValor ? formatarValor(valorPago) : valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  }, [contasFiltradas, formatarValor])

  const grupos = useMemo(() => {
    const mapa = new Map()

    contasFiltradas.forEach((linha) => {
      let chave = 'Relatório'
      if (agrupamento === 'status') chave = linha.statusOperacional
      if (agrupamento === 'vencimento') chave = nomeMesAno(linha.vencimento)
      if (agrupamento === 'centro') chave = linha.centroNome
      if (agrupamento === 'filial') chave = linha.filialNome

      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(linha)
    })

    return Array.from(mapa.entries()).map(([titulo, linhas]) => ({ titulo, linhas }))
  }, [agrupamento, contasFiltradas])

  const filialSelecionada = filiais.find((filial) => filial.id === filtroFilial)
  const centrosSelecionadosNomes = centros
    .filter((centro) => centrosSelecionados.includes(centro.id))
    .map((centro) => centro.nome)
  const centroNomeExportacao = centrosSelecionadosNomes.length
    ? centrosSelecionadosNomes.join(', ')
    : 'Todos'
  const periodoOperacionalTexto = possuiContasAVencerSelecionadas
    ? periodoContasAVencerSelecionado.label
    : 'Sem período'
  const periodoTexto = dataInicial || dataFinal
    ? `${periodoOperacionalTexto}; datas manuais: ${dataInicial || 'início'} até ${dataFinal || 'hoje'}`
    : periodoOperacionalTexto

  const contextoExportacao = {
    tipoRelatorio: contextoTipos.titulo,
    filialNome: filialSelecionada?.nome || 'Todas',
    centroNome: centroNomeExportacao,
    periodo: periodoTexto
  }

  function garantirPermissaoExportacao() {
    if (!possuiTipoSelecionado) {
      mostrarAviso?.('Selecione pelo menos um tipo de conta para exportar.', 'erro')
      return false
    }
    if (podeExportarDados) return true
    mostrarAviso?.('Seu perfil atual não permite exportar relatórios.', 'erro')
    return false
  }

  function exportarCsv() {
    if (!garantirPermissaoExportacao()) return
    exportarRelatorioContasCsv(contasFiltradas, contextoExportacao)
  }

  function exportarExcel() {
    if (!garantirPermissaoExportacao()) return
    exportarRelatorioContasExcel(contasFiltradas, contextoExportacao)
  }

  function imprimir(modo = 'compacto') {
    if (!garantirPermissaoExportacao()) return
    const abriu = imprimirRelatorioContas({
      linhas: contasFiltradas,
      grupos,
      contexto: contextoExportacao,
      resumo,
      modo
    })
    if (!abriu) mostrarAviso?.('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.', 'erro')
  }

  return (
    <main className="relatorios-contas-page">
      <header className="relatorios-contas-hero">
        <div className="relatorios-contas-hero-copy">
          <span>Financeiro</span>
          <h1>Relatórios de Contas</h1>
          <p>Monte relatórios para imprimir ou exportar contas por filial, status, centro de custo e período.</p>
        </div>
        <div className="relatorios-contas-hero-actions">
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={() => navegarPara?.('contas')}>
            ← Voltar
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-primary" onClick={() => navegarPara?.('fluxo-caixa')}>
            Fluxo de Caixa
          </button>
        </div>
      </header>

      <div className="relatorios-contas-flow">
        <span className="is-active">1. Filtros</span>
        <span className={contasFiltradas.length ? 'is-active' : ''}>2. Resumo</span>
        <span className={contasFiltradas.length ? 'is-active' : ''}>3. Prévia</span>
        <span className={contasFiltradas.length ? 'is-active' : ''}>4. Exportação</span>
      </div>

      <BlocoRelatorioContas
        titulo="Filtros do relatório"
        descricao="Defina o contexto sem depender da aba ativa da tela Contas."
        aberto={filtrosAbertos}
        onToggle={() => setFiltrosAbertos((valor) => !valor)}
      >
        <div className="relatorios-contas-filters">
          <fieldset className="relatorios-contas-kind-field">
            <legend>Tipo de contas</legend>
            <div className="relatorios-contas-kind-select">
              <button
                type="button"
                className={`relatorios-contas-kind-trigger ${tipoDropdownAberto ? 'is-open' : ''}`}
                aria-expanded={tipoDropdownAberto}
                aria-haspopup="true"
                onClick={() => setTipoDropdownAberto((aberto) => !aberto)}
              >
                <span>{resumoTiposSelecionados}</span>
                <strong aria-hidden="true">{tipoDropdownAberto ? '▲' : '▼'}</strong>
              </button>

              {tipoDropdownAberto && (
                <div className="relatorios-contas-kind-dropdown" role="group" aria-label="Selecionar tipos de contas">
                  {TIPOS_CONTAS.map((tipo) => {
                    const selecionado = tiposSelecionados.includes(tipo.valor)
                    return (
                      <label key={tipo.valor} className="relatorios-contas-kind-option">
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => alternarTipoConta(tipo.valor)}
                        />
                        <span>
                          <strong>{tipo.label}</strong>
                          <small>{tipo.descricao}</small>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            <p>{contextoTipos.titulo}. {contextoTipos.descricao}</p>
            {!possuiTipoSelecionado && (
              <div className="relatorios-contas-kind-warning">
                Selecione pelo menos um tipo de conta para gerar o relatório.
              </div>
            )}
          </fieldset>

          {possuiContasAVencerSelecionadas && (
            <label>
              <span>Período do relatório</span>
              <select value={periodoContasAVencer} onChange={(event) => setPeriodoContasAVencer(event.target.value)}>
                {PERIODOS_CONTAS_A_VENCER.map((periodo) => (
                  <option key={periodo.valor} value={periodo.valor}>{periodo.label}</option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span>Filial/Unidade</span>
            <select value={filtroFilial} onChange={(event) => setFiltroFilial(event.target.value)}>
              <option value="">Todas</option>
              {filiais.map((filial) => (
                <option key={filial.id} value={filial.id}>{filial.nome}</option>
              ))}
            </select>
          </label>

          <fieldset className="relatorios-contas-kind-field">
            <legend>Centro de custo</legend>
            <div className="relatorios-contas-kind-select">
              <button
                type="button"
                className={`relatorios-contas-kind-trigger ${centroDropdownAberto ? 'is-open' : ''}`}
                aria-expanded={centroDropdownAberto}
                aria-haspopup="true"
                onClick={() => setCentroDropdownAberto((aberto) => !aberto)}
              >
                <span>{resumoSelecaoCentros(centrosSelecionados)}</span>
                <strong aria-hidden="true">{centroDropdownAberto ? '▲' : '▼'}</strong>
              </button>

              {centroDropdownAberto && (
                <div className="relatorios-contas-kind-dropdown" role="group" aria-label="Selecionar centros de custo">
                  <div className="relatorios-contas-kind-actions">
                    <button type="button" onClick={selecionarTodosCentros}>Selecionar todos</button>
                    <button type="button" onClick={() => setCentrosSelecionados([])}>Limpar seleção</button>
                  </div>

                  {centros.map((centro) => {
                    const selecionado = centrosSelecionados.includes(centro.id)
                    return (
                      <label key={centro.id} className="relatorios-contas-kind-option">
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => alternarCentroCusto(centro.id)}
                        />
                        <span>
                          <strong>{centro.nome}</strong>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            <p>{centrosSelecionados.length ? centrosSelecionadosNomes.join(', ') : 'Todos os centros de custo'}</p>
          </fieldset>

          <label>
            <span>Data inicial</span>
            <input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} />
          </label>

          <label>
            <span>Data final</span>
            <input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} />
          </label>

          <label className="relatorios-contas-filter-wide">
            <span>Busca</span>
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Descrição, observação, centro, filial ou status"
            />
          </label>

          <label>
            <span>Agrupamento</span>
            <select value={agrupamento} onChange={(event) => setAgrupamento(event.target.value)}>
              {AGRUPAMENTOS.map((item) => (
                <option key={item.valor} value={item.valor}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
      </BlocoRelatorioContas>

      <section className="relatorios-contas-summary" aria-label="Resumo do relatório">
        <article>
          <span>Total de contas</span>
          <strong>{resumo.totalContas}</strong>
          <small>{contextoTipos.titulo}</small>
        </article>
        <article>
          <span>Valor total</span>
          <strong>{resumo.valorTotalFormatado}</strong>
          <small>{contextoExportacao.filialNome}</small>
        </article>
        <article className="is-overdue">
          <span>Vencidas</span>
          <strong>{resumo.valorVencidoFormatado}</strong>
          <small>{resumo.quantidadeVencidas} conta(s)</small>
        </article>
        <article className="is-open">
          <span>A vencer</span>
          <strong>{resumo.valorAVencerFormatado}</strong>
          <small>{resumo.quantidadeAVencer} conta(s)</small>
        </article>
        <article className="is-paid">
          <span>Pagas</span>
          <strong>{resumo.valorPagoFormatado}</strong>
          <small>{resumo.quantidadePagas} conta(s)</small>
        </article>
      </section>

      <section className="relatorios-contas-card relatorios-contas-export-card">
        <div>
          <h2>Exportação</h2>
          <p>{possuiTipoSelecionado ? 'Exporte exatamente a lista filtrada deste relatório.' : 'Selecione pelo menos um tipo de conta para liberar a exportação.'}</p>
        </div>
        <div className="relatorios-contas-export-actions">
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={() => imprimir('compacto')} disabled={!possuiTipoSelecionado || !contasFiltradas.length}>
            PDF compacto
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={() => imprimir('gerencial')} disabled={!possuiTipoSelecionado || !contasFiltradas.length}>
            PDF gerencial
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={exportarCsv} disabled={!possuiTipoSelecionado || !contasFiltradas.length}>
            Exportar CSV
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-primary" onClick={exportarExcel} disabled={!possuiTipoSelecionado || !contasFiltradas.length}>
            Exportar Excel
          </button>
        </div>
      </section>

      <BlocoRelatorioContas
        titulo="Prévia do relatório"
        descricao={`${contasFiltradas.length} conta(s) encontradas. A exportação usa exatamente esta lista filtrada.`}
        aberto={previaAberta}
        onToggle={() => setPreviaAberta((valor) => !valor)}
      >
        {contasFiltradas.length ? (
          <>
            <div className="relatorios-contas-preview-meta">
              <span>Tipo: <strong>{contextoExportacao.tipoRelatorio}</strong></span>
              <span>Filial: <strong>{contextoExportacao.filialNome}</strong></span>
              <span>Centro: <strong>{contextoExportacao.centroNome}</strong></span>
              <span>Período: <strong>{contextoExportacao.periodo}</strong></span>
            </div>

            <div className="relatorios-contas-groups">
              {grupos.map((grupo) => (
                <section key={grupo.titulo} className="relatorios-contas-group">
                  <header>
                    <h3>{grupo.titulo}</h3>
                    <span>{grupo.linhas.length} conta(s)</span>
                  </header>

                  <div className="relatorios-contas-table" role="table" aria-label={`Contas do grupo ${grupo.titulo}`}>
                    <div className="relatorios-contas-table-head" role="row">
                      <span>Descrição</span>
                      <span>Valor</span>
                      <span>Vencimento</span>
                      <span>Status</span>
                      <span>Centro</span>
                      <span>Filial</span>
                    </div>
                    {grupo.linhas.map((linha) => (
                      <article key={linha.conta.id || `${linha.descricao}-${linha.vencimento}`} className="relatorios-contas-row" role="row">
                        <div>
                          <strong>{linha.descricao}</strong>
                          {linha.observacao && <small>{linha.observacao}</small>}
                        </div>
                        <span>{linha.valorFormatado}</span>
                        <span>{linha.vencimentoFormatado}</span>
                        <span className={`relatorios-contas-status ${classeStatus(linha.statusOperacional)}`}>{linha.statusOperacional}</span>
                        <span>{linha.centroNome}</span>
                        <span>{linha.filialNome}</span>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="relatorios-contas-empty">
            <strong>Nenhuma conta encontrada</strong>
            <p>Ajuste tipo, filial, centro, período ou busca para montar o relatório.</p>
          </div>
        )}
      </BlocoRelatorioContas>
    </main>
  )
}
