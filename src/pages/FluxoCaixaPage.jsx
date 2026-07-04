import { useMemo } from 'react'
import { createXlsxBlob, downloadBlob, exportCsv } from '../services/export/reportExportService'
import { useFluxoCaixaV1 } from '../modules/contas/hooks/fluxo-caixa/useFluxoCaixaV1'
import {
  agregarMovimentosPorFilial,
  formatarDataFluxo,
  formatarMoedaFluxo,
  MESES_FLUXO_CAIXA,
  montarAbaModeloFluxoCaixa,
  prepararLinhasCsvFluxoCaixa
} from '../modules/contas/utils/fluxo-caixa/fluxoCaixaUtils'

const OBSERVACAO_ENTRADAS = 'FATURAMENTO BRUTO usa receitas ativas em df_receitas por data_receita. Saídas usam pagamentos realizados por data_pagamento.'

function slug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function anosDisponiveis() {
  const atual = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, index) => atual - index)
}

function FluxoResumoCard({ titulo, valor, detalhe, destaque }) {
  return (
    <article className={`fluxo-caixa-card ${destaque ? 'is-highlight' : ''}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </article>
  )
}

export default function FluxoCaixaPage({
  empresaId,
  empresaNome,
  voltar,
  mostrarAviso,
  podeExportarDados = true
}) {
  const {
    ano,
    setAno,
    filialId,
    setFilialId,
    filiais,
    loading,
    erro,
    recarregar,
    movimentos,
    resultado,
    rubricas,
    diagnosticoRubricas
  } = useFluxoCaixaV1({ empresaId })

  const filialSelecionada = filiais.find((filial) => filial.id === filialId)
  const filialNome = filialSelecionada?.nome || 'Todas as filiais'
  const gruposFiliais = useMemo(() => agregarMovimentosPorFilial(movimentos, filiais), [filiais, movimentos])
  const possuiMovimentos = movimentos.length > 0

  function nomeArquivo(extensao) {
    const empresa = slug(empresaNome) || 'dona-flor'
    const filial = slug(filialNome) || 'todas-filiais'
    return `fluxo-caixa-${empresa}-${filial}-${ano}.${extensao}`
  }

  function exportarCsvFluxo() {
    if (!podeExportarDados) {
      mostrarAviso?.('Seu perfil atual não permite exportar relatórios.', 'erro')
      return
    }

    const headers = ['Rubrica', ...MESES_FLUXO_CAIXA.map((mes) => mes.nome), 'Total anual']
    const rows = [
      ['Fluxo de Caixa', empresaNome || 'Empresa ativa', filialNome, `Ano ${ano}`, new Date().toLocaleString('pt-BR')],
      ['Observação', OBSERVACAO_ENTRADAS],
      [],
      headers,
      ...prepararLinhasCsvFluxoCaixa(resultado, rubricas),
      [],
      ['Movimentos considerados', resultado.totais.movimentos],
      ['Movimentos em rubricas', diagnosticoRubricas.totalMovimentosRubricas],
      ['Sem centro de custo', diagnosticoRubricas.movimentosSemCentroCusto],
      ['Sem rubrica', diagnosticoRubricas.movimentosSemRubrica],
      ['Fallback operacional', diagnosticoRubricas.classificadosFallback],
      ['Movimentos perdidos', diagnosticoRubricas.movimentosPerdidos]
    ]

    exportCsv({ filename: nomeArquivo('csv'), headers: ['Fluxo de Caixa realizado'], rows })
    mostrarAviso?.('CSV do Fluxo de Caixa gerado.', 'sucesso')
  }

  function exportarExcelFluxo() {
    if (!podeExportarDados) {
      mostrarAviso?.('Seu perfil atual não permite exportar relatórios.', 'erro')
      return
    }

    const sheets = [
      {
        name: 'Consolidado Geral',
        rows: montarAbaModeloFluxoCaixa({
          titulo: 'Fluxo de Caixa - Consolidado Geral',
          filialNome,
          ano,
          resultado,
          rubricas,
          observacao: OBSERVACAO_ENTRADAS
        })
      },
      ...gruposFiliais.map((grupo) => ({
        name: grupo.filialNome,
        rows: montarAbaModeloFluxoCaixa({
          titulo: `Fluxo de Caixa - ${grupo.filialNome}`,
          filialNome: grupo.filialNome,
          ano,
          resultado: grupo.resultado,
          rubricas: grupo.rubricas,
          observacao: OBSERVACAO_ENTRADAS
        })
      }))
    ]

    downloadBlob(nomeArquivo('xlsx'), createXlsxBlob(sheets))
    mostrarAviso?.('Excel do Fluxo de Caixa gerado.', 'sucesso')
  }

  return (
    <main className="fluxo-caixa-page">
      <style>{cssFluxoCaixa}</style>

      <header className="fluxo-caixa-hero">
        <div>
          <span>Contas / Relatórios</span>
          <h1>Fluxo de Caixa</h1>
          <p>Realizado por data de pagamento. Usa pagamentos e baixas reais já registrados no sistema.</p>
        </div>
        <div className="fluxo-caixa-actions">
          <button type="button" className="fluxo-btn secondary" onClick={voltar}>Voltar</button>
          <button type="button" className="fluxo-btn secondary" onClick={exportarCsvFluxo} disabled={!possuiMovimentos}>
            Exportar CSV
          </button>
          <button type="button" className="fluxo-btn primary" onClick={exportarExcelFluxo} disabled={!possuiMovimentos}>
            Exportar Excel
          </button>
        </div>
      </header>

      <section className="fluxo-caixa-panel">
        <div className="fluxo-caixa-filtros">
          <label>
            <span>Ano</span>
            <select value={ano} onChange={(event) => setAno(event.target.value)}>
              {anosDisponiveis().map((anoOpcao) => (
                <option key={anoOpcao} value={anoOpcao}>{anoOpcao}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Filial</span>
            <select value={filialId} onChange={(event) => setFilialId(event.target.value)}>
              <option value="">Todas as filiais</option>
              {filiais.map((filial) => (
                <option key={filial.id} value={filial.id}>{filial.nome}</option>
              ))}
            </select>
          </label>
          <button type="button" className="fluxo-btn secondary" onClick={recarregar} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </section>

      <section className="fluxo-caixa-alert">
        <strong>Leitura operacional</strong>
        <p>{OBSERVACAO_ENTRADAS}</p>
        <p>Pagamentos parciais ativos entram por `df_contas_pagamentos`. Quando uma conta tem parcial ativo, a conta-pai não é somada integralmente junto.</p>
        <p>Saídas são classificadas em tempo de relatório, sem alterar dados antigos no banco.</p>
      </section>

      {erro && (
        <section className="fluxo-caixa-error">
          <strong>Não foi possível carregar o Fluxo de Caixa.</strong>
          <p>{erro}</p>
          <button type="button" className="fluxo-btn secondary" onClick={recarregar}>Tentar novamente</button>
        </section>
      )}

      <section className="fluxo-caixa-summary">
        <FluxoResumoCard titulo="Entradas" valor={formatarMoedaFluxo(resultado.totais.entradas)} detalhe="Receitas ativas" />
        <FluxoResumoCard titulo="Saídas" valor={formatarMoedaFluxo(resultado.totais.saidas)} detalhe="Pagamentos realizados" />
        <FluxoResumoCard titulo="Saldo" valor={formatarMoedaFluxo(resultado.totais.saldo)} detalhe="Entradas - saídas" destaque />
        <FluxoResumoCard titulo="Movimentos" valor={resultado.totais.movimentos} detalhe="Pagamentos considerados" />
      </section>

      <section className="fluxo-caixa-panel">
        <div className="fluxo-caixa-section-title">
          <div>
            <h2>Resumo mensal {ano}</h2>
            <p>{filialNome}. Janeiro a dezembro, meses sem movimento zerados.</p>
          </div>
          {loading && <span className="fluxo-status">Carregando dados reais...</span>}
        </div>

        {!loading && !erro && !possuiMovimentos && (
          <div className="fluxo-empty">
            <strong>Nenhum pagamento realizado encontrado para este filtro.</strong>
            <p>Revise ano, filial e baixas registradas com data de pagamento.</p>
          </div>
        )}

        <div className="fluxo-table-wrap">
          <table className="fluxo-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Saldo</th>
                <th>Movimentos</th>
              </tr>
            </thead>
            <tbody>
              {resultado.linhas.map((linha) => (
                <tr key={linha.chave}>
                  <td>{linha.nome}</td>
                  <td>{formatarMoedaFluxo(linha.entradas)}</td>
                  <td>{formatarMoedaFluxo(linha.saidas)}</td>
                  <td className={linha.saldo < 0 ? 'is-negative' : ''}>{formatarMoedaFluxo(linha.saldo)}</td>
                  <td>{linha.movimentos}</td>
                </tr>
              ))}
              <tr className="fluxo-total-row">
                <td>Total anual</td>
                <td>{formatarMoedaFluxo(resultado.totais.entradas)}</td>
                <td>{formatarMoedaFluxo(resultado.totais.saidas)}</td>
                <td className={resultado.totais.saldo < 0 ? 'is-negative' : ''}>{formatarMoedaFluxo(resultado.totais.saldo)}</td>
                <td>{resultado.totais.movimentos}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="fluxo-mobile-list">
          {resultado.linhas.map((linha) => (
            <article key={`card-${linha.chave}`} className="fluxo-month-card">
              <header>
                <strong>{linha.nome}</strong>
                <span>{linha.movimentos} movimento(s)</span>
              </header>
              <div><span>Entradas</span><strong>{formatarMoedaFluxo(linha.entradas)}</strong></div>
              <div><span>Saídas</span><strong>{formatarMoedaFluxo(linha.saidas)}</strong></div>
              <div><span>Saldo</span><strong className={linha.saldo < 0 ? 'is-negative' : ''}>{formatarMoedaFluxo(linha.saldo)}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="fluxo-caixa-panel">
        <div className="fluxo-caixa-section-title">
          <div>
            <h2>Saídas por rubrica</h2>
            <p>Rubricas fixas do modelo do cliente. A soma das rubricas deve bater com o total de saídas.</p>
          </div>
        </div>

        <div className="fluxo-rubrica-diagnostics">
          <span><b>Por centro</b>{diagnosticoRubricas.classificadosCentroCusto}</span>
          <span><b>Por descrição/juros</b>{diagnosticoRubricas.classificadosDescricao}</span>
          <span><b>Fallback</b>{diagnosticoRubricas.classificadosFallback}</span>
          <span><b>Sem centro</b>{diagnosticoRubricas.movimentosSemCentroCusto}</span>
          <span><b>Sem rubrica</b>{diagnosticoRubricas.movimentosSemRubrica}</span>
          <span><b>Outras operacionais</b>{diagnosticoRubricas.movimentosOperacionais}</span>
          <span><b>Não operacionais</b>{diagnosticoRubricas.movimentosNaoOperacionais}</span>
          <span><b>Perdidos</b>{diagnosticoRubricas.movimentosPerdidos}</span>
        </div>

        <div className="fluxo-table-wrap fluxo-rubricas-wrap">
          <table className="fluxo-table fluxo-rubricas-table">
            <thead>
              <tr>
                <th>Rubrica</th>
                {MESES_FLUXO_CAIXA.map((mes) => <th key={mes.chave}>{mes.nome}</th>)}
                <th>Total anual</th>
              </tr>
            </thead>
            <tbody>
              {rubricas.map((rubrica) => (
                <tr key={rubrica.rubrica}>
                  <td>{rubrica.rubrica}</td>
                  {MESES_FLUXO_CAIXA.map((mes) => (
                    <td key={`${rubrica.rubrica}-${mes.chave}`}>{formatarMoedaFluxo(rubrica[mes.chave])}</td>
                  ))}
                  <td>{formatarMoedaFluxo(rubrica.total)}</td>
                </tr>
              ))}
              <tr className="fluxo-total-row">
                <td>Total saídas classificadas</td>
                {MESES_FLUXO_CAIXA.map((mes) => (
                  <td key={`total-saidas-${mes.chave}`}>{formatarMoedaFluxo(resultado.linhas.find((linha) => linha.mes === mes.numero)?.saidas)}</td>
                ))}
                <td>{formatarMoedaFluxo(diagnosticoRubricas.totalSaidasRubricas)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="fluxo-mobile-list">
          {rubricas.filter((rubrica) => rubrica.total > 0).map((rubrica) => (
            <article key={`rubrica-card-${rubrica.rubrica}`} className="fluxo-month-card">
              <header>
                <strong>{rubrica.rubrica}</strong>
                <span>{rubrica.movimentos} movimento(s)</span>
              </header>
              <div><span>Total anual</span><strong>{formatarMoedaFluxo(rubrica.total)}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="fluxo-caixa-panel">
        <div className="fluxo-caixa-section-title">
          <div>
            <h2>Movimentos considerados</h2>
            <p>Amostra para validação manual mês a mês.</p>
          </div>
        </div>
        <div className="fluxo-movimentos">
          {movimentos.slice(0, 80).map((movimento) => (
            <article key={`${movimento.origem}-${movimento.id}`} className="fluxo-movimento">
              <div>
                <strong>{movimento.descricao}</strong>
                <span>{movimento.filial_nome} - {formatarDataFluxo(movimento.data_pagamento)} - {movimento.origem === 'pagamento_parcial' ? 'Pagamento parcial' : 'Conta paga'}</span>
                {movimento.tipo === 'entrada' ? (
                  <span>FATURAMENTO BRUTO - Origem: {movimento.origem_receita || 'Receita'}</span>
                ) : (
                  <span>{movimento.rubrica} - Centro: {movimento.centro_custo_nome || '-'} - Critério: {movimento.rubrica_criterio} / {movimento.rubrica_confianca}</span>
                )}
              </div>
              <strong>{formatarMoedaFluxo(movimento.valor)}</strong>
            </article>
          ))}
          {movimentos.length > 80 && (
            <p className="fluxo-note">Exibindo 80 de {movimentos.length} movimento(s). A exportação inclui o resumo mensal completo.</p>
          )}
        </div>
      </section>
    </main>
  )
}

const cssFluxoCaixa = `
.fluxo-caixa-page { display: grid; gap: 16px; width: 100%; max-width: 1280px; margin: 0 auto; }
.fluxo-caixa-hero, .fluxo-caixa-panel, .fluxo-caixa-alert, .fluxo-caixa-error { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 16px; }
.fluxo-caixa-hero { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; flex-wrap: wrap; }
.fluxo-caixa-hero span { color: #0f766e; font-weight: 800; font-size: 12px; text-transform: uppercase; }
.fluxo-caixa-hero h1 { margin: 4px 0; color: #0f172a; }
.fluxo-caixa-hero p, .fluxo-caixa-section-title p, .fluxo-note { margin: 0; color: #64748b; }
.fluxo-caixa-actions, .fluxo-caixa-filtros { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
.fluxo-caixa-filtros label { display: grid; gap: 6px; min-width: 180px; color: #334155; font-weight: 700; font-size: 13px; }
.fluxo-caixa-filtros select { min-height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; }
.fluxo-btn { min-height: 40px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 800; cursor: pointer; }
.fluxo-btn:disabled { opacity: .55; cursor: not-allowed; }
.fluxo-btn.primary { background: #0f766e; border-color: #0f766e; color: #fff; }
.fluxo-btn.secondary { background: #f8fafc; color: #0f172a; }
.fluxo-caixa-alert { background: #fefce8; border-color: #fde68a; color: #854d0e; }
.fluxo-caixa-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.fluxo-caixa-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.fluxo-caixa-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #fff; display: grid; gap: 4px; }
.fluxo-caixa-card span, .fluxo-caixa-card small { color: #64748b; }
.fluxo-caixa-card strong { font-size: 20px; color: #0f172a; }
.fluxo-caixa-card.is-highlight strong, .is-negative { color: #b91c1c; }
.fluxo-caixa-section-title { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.fluxo-caixa-section-title h2 { margin: 0 0 4px; color: #0f172a; }
.fluxo-status { color: #0f766e; font-weight: 800; }
.fluxo-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
.fluxo-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.fluxo-rubricas-table { min-width: 1420px; }
.fluxo-table th, .fluxo-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; }
.fluxo-table th:first-child, .fluxo-table td:first-child { text-align: left; }
.fluxo-rubricas-table th:first-child, .fluxo-rubricas-table td:first-child { min-width: 280px; white-space: normal; }
.fluxo-table th { background: #f8fafc; color: #334155; font-size: 12px; text-transform: uppercase; }
.fluxo-total-row td { font-weight: 900; background: #ecfdf5; }
.fluxo-rubrica-diagnostics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
.fluxo-rubrica-diagnostics span { display: grid; gap: 3px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; color: #64748b; font-size: 12px; }
.fluxo-rubrica-diagnostics b { color: #0f172a; font-size: 13px; }
.fluxo-mobile-list { display: none; gap: 10px; }
.fluxo-month-card, .fluxo-movimento, .fluxo-empty { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #fff; }
.fluxo-month-card { display: grid; gap: 8px; }
.fluxo-month-card header, .fluxo-month-card div, .fluxo-movimento { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
.fluxo-month-card span, .fluxo-movimento span { color: #64748b; font-size: 13px; }
.fluxo-movimentos { display: grid; gap: 8px; }
.fluxo-movimento div { display: grid; gap: 3px; }
@media (max-width: 760px) {
  .fluxo-caixa-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fluxo-rubrica-diagnostics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fluxo-caixa-actions, .fluxo-caixa-filtros { width: 100%; }
  .fluxo-btn, .fluxo-caixa-filtros label { width: 100%; }
  .fluxo-table-wrap { display: none; }
  .fluxo-mobile-list { display: grid; }
}
`
