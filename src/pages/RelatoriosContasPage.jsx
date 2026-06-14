import { useMemo, useState } from 'react'
import {
  exportarRelatorioContasCsv,
  exportarRelatorioContasExcel,
  imprimirRelatorioContas
} from '../utils/relatoriosContasExport.js'

const TIPOS_RELATORIO = [
  { valor: 'em-aberto', label: 'Em aberto', descricao: 'Vencidas e a vencer' },
  { valor: 'vencidas', label: 'Vencidas', descricao: 'Abertas com vencimento passado' },
  { valor: 'a-vencer', label: 'A vencer', descricao: 'Abertas dentro do prazo' },
  { valor: 'pagas', label: 'Pagas', descricao: 'Contas já quitadas' },
  { valor: 'todas', label: 'Todas', descricao: 'Todos os status' }
]

const AGRUPAMENTOS = [
  { valor: 'sem', label: 'Sem agrupamento' },
  { valor: 'status', label: 'Por status' },
  { valor: 'vencimento', label: 'Por vencimento' },
  { valor: 'centro', label: 'Por centro de custo' },
  { valor: 'filial', label: 'Por filial/unidade' }
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
  const [tipoRelatorio, setTipoRelatorio] = useState('em-aberto')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [busca, setBusca] = useState('')
  const [agrupamento, setAgrupamento] = useState('status')
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)
  const [previaAberta, setPreviaAberta] = useState(true)

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
        if (tipoRelatorio === 'em-aberto') return linha.conta.status !== 'pago'
        if (tipoRelatorio === 'vencidas') return linha.conta.status !== 'pago' && linha.statusOperacional === 'Vencida'
        if (tipoRelatorio === 'a-vencer') return linha.conta.status !== 'pago' && linha.statusOperacional === 'A vencer'
        if (tipoRelatorio === 'pagas') return linha.conta.status === 'pago'
        return true
      })
      .filter((linha) => !filtroFilial || linha.conta.filial_id === filtroFilial)
      .filter((linha) => !filtroCentro || linha.conta.centro_custo_id === filtroCentro)
      .filter((linha) => !dataInicial || !linha.vencimento || linha.vencimento >= dataInicial)
      .filter((linha) => !dataFinal || !linha.vencimento || linha.vencimento <= dataFinal)
      .filter((linha) => !termo || linha.busca.includes(termo))
      .sort((a, b) => String(a.vencimento || '9999-12-31').localeCompare(String(b.vencimento || '9999-12-31')))
  }, [agrupamento, busca, contasNormalizadas, dataFinal, dataInicial, filtroCentro, filtroFilial, tipoRelatorio])

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

  const tipoSelecionado = TIPOS_RELATORIO.find((tipo) => tipo.valor === tipoRelatorio)
  const filialSelecionada = filiais.find((filial) => filial.id === filtroFilial)
  const centroSelecionado = centros.find((centro) => centro.id === filtroCentro)
  const periodoTexto = dataInicial || dataFinal
    ? `${dataInicial || 'início'} até ${dataFinal || 'hoje'}`
    : 'Sem período'

  const contextoExportacao = {
    tipoRelatorio: tipoSelecionado?.label || 'Relatório',
    filialNome: filialSelecionada?.nome || 'Todas',
    centroNome: centroSelecionado?.nome || 'Todos',
    periodo: periodoTexto
  }

  function garantirPermissaoExportacao() {
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

  function imprimir() {
    if (!garantirPermissaoExportacao()) return
    const abriu = imprimirRelatorioContas({
      linhas: contasFiltradas,
      grupos,
      contexto: contextoExportacao,
      resumo
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
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={imprimir} disabled={!contasFiltradas.length}>
            Imprimir / PDF
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-secondary" onClick={exportarCsv} disabled={!contasFiltradas.length}>
            Exportar CSV
          </button>
          <button type="button" className="relatorios-contas-btn relatorios-contas-btn-primary" onClick={exportarExcel} disabled={!contasFiltradas.length}>
            Exportar Excel
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
        <div className="relatorios-contas-type-grid">
          {TIPOS_RELATORIO.map((tipo) => (
            <button
              key={tipo.valor}
              type="button"
              className={`relatorios-contas-type ${tipoRelatorio === tipo.valor ? 'is-active' : ''}`}
              onClick={() => setTipoRelatorio(tipo.valor)}
            >
              <strong>{tipo.label}</strong>
              <span>{tipo.descricao}</span>
            </button>
          ))}
        </div>

        <div className="relatorios-contas-filters">
          <label>
            <span>Filial/Unidade</span>
            <select value={filtroFilial} onChange={(event) => setFiltroFilial(event.target.value)}>
              <option value="">Todas</option>
              {filiais.map((filial) => (
                <option key={filial.id} value={filial.id}>{filial.nome}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Centro de custo</span>
            <select value={filtroCentro} onChange={(event) => setFiltroCentro(event.target.value)}>
              <option value="">Todos</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>
          </label>

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
          <small>{tipoSelecionado?.label || 'Relatório'}</small>
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
