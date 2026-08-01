import { useMemo } from 'react'
import { createFluxoCaixaXlsxBlob, downloadBlob, exportCsv } from '../services/export/reportExportService'
import { DataTableRegion, ExportMenu, FilterCard, FilterGrid, KpiCard, KpiGrid, PageHeader } from '../components/shared/PagePatterns.jsx'
import { useFluxoCaixaV1 } from '../modules/contas/hooks/fluxo-caixa/useFluxoCaixaV1'
import {
  agregarMovimentosPorFilial,
  formatarDataFluxo,
  formatarMoedaFluxo,
  MESES_FLUXO_CAIXA,
  montarAbaModeloFluxoCaixa,
  prepararLinhasCsvFluxoCaixa
} from '../modules/contas/utils/fluxo-caixa/fluxoCaixaUtils'
import './FluxoCaixaPage.css'

const OBSERVACAO_ENTRADAS = 'FATURAMENTO BRUTO usa receitas ativas em df_receitas por data_receita. Critério histórico: até 05/2026, contas pagas sem data de pagamento usam vencimento como referência. A partir de 06/2026, somente pagamentos baixados com data de pagamento entram no realizado.'

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

function formatarCnpj(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 14)
  if (!digitos) return ''
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatarLocalidadeFilial(filial) {
  return [filial?.cidade, filial?.uf].filter(Boolean).join('/')
}

function formatarEnderecoFilial(filial) {
  return [
    [filial?.endereco, filial?.numero].filter(Boolean).join(', '),
    filial?.bairro,
    filial?.complemento,
    filial?.cep ? `CEP ${filial.cep}` : ''
  ].filter(Boolean).join(' - ')
}

function montarIdentificacaoFiscalFilial(filial) {
  if (!filial) return []

  return [
    ['Nome operacional', filial.nome],
    ['Razão social', filial.razao_social],
    ['Nome fantasia', filial.nome_fantasia],
    ['CNPJ', formatarCnpj(filial.cnpj)],
    ['Cidade/UF', formatarLocalidadeFilial(filial)],
    ['Endereço', formatarEnderecoFilial(filial)]
  ].filter((linha) => linha[1])
}

function montarIdentificacaoModeloFilial(filial, empresaNome) {
  if (!filial) {
    return {
      empresa: empresaNome || 'Empresa ativa',
      cnpj: '',
      endereco: ''
    }
  }

  return {
    empresa: filial.razao_social || filial.nome_fantasia || filial.nome || empresaNome || '',
    cnpj: formatarCnpj(filial.cnpj),
    endereco: [formatarEnderecoFilial(filial), formatarLocalidadeFilial(filial)].filter(Boolean).join(' - ')
  }
}

function montarIdentificacaoConsolidada({ empresaNome, totalFiliais }) {
  return [
    ['Empresa/grupo', empresaNome || 'Empresa ativa'],
    ['Tipo de relatório', 'Consolidado geral'],
    ['Abrangência', totalFiliais > 0 ? `Múltiplas filiais (${totalFiliais})` : 'Todas as filiais'],
    ['CNPJ consolidado', 'Não aplicável']
  ]
}

function FiscalInfoBlock({ filial, empresaNome, totalFiliais }) {
  const linhas = filial
    ? montarIdentificacaoFiscalFilial(filial)
    : montarIdentificacaoConsolidada({ empresaNome, totalFiliais })

  return (
    <section className="fluxo-caixa-identificacao">
      <div>
        <span>{filial ? 'Filial selecionada' : 'Relatório consolidado'}</span>
        <strong>{filial?.nome || empresaNome || 'Empresa ativa'}</strong>
      </div>
      <dl>
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt>{rotulo}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
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
  const dadosDisponiveis = !loading && !erro
  const identificacaoRelatorio = filialSelecionada
    ? montarIdentificacaoFiscalFilial(filialSelecionada)
    : montarIdentificacaoConsolidada({ empresaNome, totalFiliais: filiais.length })

  function nomeArquivo(extensao) {
    const empresa = slug(empresaNome) || 'dona-flor'
    const filial = slug(filialNome) || 'todas-filiais'
    return `fluxo-caixa-${empresa}-${filial}-${ano}.${extensao}`
  }

  function exportarCsvFluxo() {
    if (!dadosDisponiveis) {
      mostrarAviso?.('Aguarde os dados do fluxo de caixa ficarem disponiveis.', 'aviso')
      return
    }
    if (!podeExportarDados) {
      mostrarAviso?.('Seu perfil atual não permite exportar relatórios.', 'erro')
      return
    }

    const headers = ['Rubrica', ...MESES_FLUXO_CAIXA.map((mes) => mes.nome), 'Total anual']
    const rows = [
      ['Fluxo de Caixa', empresaNome || 'Empresa ativa', filialNome, `Ano ${ano}`, new Date().toLocaleString('pt-BR')],
      ...identificacaoRelatorio,
      ['Observação', OBSERVACAO_ENTRADAS],
      [],
      headers,
      ...prepararLinhasCsvFluxoCaixa(resultado, rubricas),
      [],
      ['Movimentos considerados', resultado.totais.movimentos],
      ['Movimentos em rubricas', diagnosticoRubricas.totalMovimentosRubricas],
      ['Por data de pagamento', diagnosticoRubricas.movimentosPorPagamento],
      ['Por vencimento histórico', diagnosticoRubricas.movimentosPorVencimento],
      ['Valor incluído por vencimento histórico', diagnosticoRubricas.valorPorVencimento],
      ['Com valor pago', diagnosticoRubricas.movimentosComValorPago],
      ['Com valor original', diagnosticoRubricas.movimentosComValorOriginal],
      ['Sem centro de custo', diagnosticoRubricas.movimentosSemCentroCusto],
      ['Sem rubrica', diagnosticoRubricas.movimentosSemRubrica],
      ['Fallback operacional', diagnosticoRubricas.classificadosFallback],
      ['Movimentos perdidos', diagnosticoRubricas.movimentosPerdidos]
    ]

    exportCsv({ filename: nomeArquivo('csv'), headers: ['Fluxo de Caixa realizado'], rows })
    mostrarAviso?.('CSV do Fluxo de Caixa gerado.', 'sucesso')
  }

  function exportarExcelFluxo() {
    if (!dadosDisponiveis) {
      mostrarAviso?.('Aguarde os dados do fluxo de caixa ficarem disponiveis.', 'aviso')
      return
    }
    if (!podeExportarDados) {
      mostrarAviso?.('Seu perfil atual não permite exportar relatórios.', 'erro')
      return
    }

    const sheets = [
      {
        name: 'Consolidado Geral',
        model: montarAbaModeloFluxoCaixa({
          ...montarIdentificacaoModeloFilial(null, empresaNome),
          resultado,
          rubricas
        })
      },
      ...gruposFiliais.map((grupo) => ({
        name: grupo.filialNome,
        model: montarAbaModeloFluxoCaixa({
          ...montarIdentificacaoModeloFilial(grupo.filial, empresaNome),
          resultado: grupo.resultado,
          rubricas: grupo.rubricas
        })
      }))
    ]

    downloadBlob(nomeArquivo('xlsx'), createFluxoCaixaXlsxBlob(sheets))
    mostrarAviso?.('Excel do Fluxo de Caixa gerado.', 'sucesso')
  }

  return (
    <main className="fluxo-caixa-page">
      <PageHeader
        kicker="Contas / Relatórios"
        title="Fluxo de Caixa"
        description="Realizado por data de pagamento. Usa pagamentos e baixas reais já registrados no sistema."
        className="fluxo-caixa-hero"
        actionsClassName="fluxo-caixa-actions"
        actions={(
          <>
          <button type="button" className="fluxo-btn secondary" onClick={voltar}>Voltar</button>
          <ExportMenu disabled={!dadosDisponiveis || !possuiMovimentos} options={[
            { id: 'csv', label: 'CSV', onSelect: exportarCsvFluxo },
            { id: 'excel', label: 'Excel', onSelect: exportarExcelFluxo },
          ]} />
          </>
        )}
      />

      <FilterCard className="fluxo-caixa-panel" description="Selecione o exercício e a unidade para recalcular a visualização.">
        <FilterGrid className="fluxo-caixa-filtros">
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
        </FilterGrid>
      </FilterCard>

      <FiscalInfoBlock filial={filialSelecionada} empresaNome={empresaNome} totalFiliais={filiais.length} />

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

      {dadosDisponiveis && (
        <KpiGrid className="fluxo-caixa-summary" aria-label="Resumo do fluxo de caixa">
          <KpiCard label="Entradas" value={formatarMoedaFluxo(resultado.totais.entradas)} detail="Receitas ativas" tone="success" />
          <KpiCard label="Saídas" value={formatarMoedaFluxo(resultado.totais.saidas)} detail="Pagamentos realizados" />
          <KpiCard label="Saldo" value={formatarMoedaFluxo(resultado.totais.saldo)} detail="Entradas - saídas" tone={resultado.totais.saldo < 0 ? 'danger' : 'success'} />
          <KpiCard label="Movimentos" value={resultado.totais.movimentos} detail="Pagamentos considerados" />
        </KpiGrid>
      )}

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

        <DataTableRegion label="Resumo mensal do fluxo de caixa" className="fluxo-table-wrap">
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
        </DataTableRegion>
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
          <span><b>Data pagamento</b>{diagnosticoRubricas.movimentosPorPagamento}</span>
          <span><b>Vencimento histórico</b>{diagnosticoRubricas.movimentosPorVencimento}</span>
          <span><b>Valor histórico</b>{formatarMoedaFluxo(diagnosticoRubricas.valorPorVencimento)}</span>
          <span><b>Valor pago</b>{diagnosticoRubricas.movimentosComValorPago}</span>
          <span><b>Valor original</b>{diagnosticoRubricas.movimentosComValorOriginal}</span>
          <span><b>Fallback</b>{diagnosticoRubricas.classificadosFallback}</span>
          <span><b>Sem centro</b>{diagnosticoRubricas.movimentosSemCentroCusto}</span>
          <span><b>Sem rubrica</b>{diagnosticoRubricas.movimentosSemRubrica}</span>
          <span><b>Outras operacionais</b>{diagnosticoRubricas.movimentosOperacionais}</span>
          <span><b>Não operacionais</b>{diagnosticoRubricas.movimentosNaoOperacionais}</span>
          <span><b>Perdidos</b>{diagnosticoRubricas.movimentosPerdidos}</span>
        </div>

        <DataTableRegion label="Saídas por rubrica" className="fluxo-table-wrap fluxo-rubricas-wrap">
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
        </DataTableRegion>
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
                <span>{movimento.filial_nome} - {formatarDataFluxo(movimento.data_considerada || movimento.data_pagamento)} - {movimento.origem === 'pagamento_parcial' ? 'Pagamento parcial' : 'Conta paga'} - Data: {movimento.origem_data || '-'}</span>
                {movimento.tipo === 'entrada' ? (
                  <span>FATURAMENTO BRUTO - Origem: {movimento.origem_receita || 'Receita'}</span>
                ) : (
                  <span>{movimento.rubrica} - Centro: {movimento.centro_custo_nome || '-'} - Valor: {movimento.origem_valor || '-'} - Critério: {movimento.rubrica_criterio} / {movimento.rubrica_confianca}</span>
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
