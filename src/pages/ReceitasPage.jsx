import { useReceitasV1 } from '../modules/contas/hooks/receitas/useReceitasV1'
import { DataTableRegion, FilterCard, FilterGrid, PageHeader } from '../components/shared/PagePatterns.jsx'
import './ReceitasPage.css'

const MESES = [
  { valor: '', label: 'Todos os meses' },
  { valor: '01', label: 'Janeiro' },
  { valor: '02', label: 'Fevereiro' },
  { valor: '03', label: 'Marco' },
  { valor: '04', label: 'Abril' },
  { valor: '05', label: 'Maio' },
  { valor: '06', label: 'Junho' },
  { valor: '07', label: 'Julho' },
  { valor: '08', label: 'Agosto' },
  { valor: '09', label: 'Setembro' },
  { valor: '10', label: 'Outubro' },
  { valor: '11', label: 'Novembro' },
  { valor: '12', label: 'Dezembro' }
]

function anosDisponiveis() {
  const atual = new Date().getFullYear()
  return Array.from({ length: 8 }, (_, index) => atual - index)
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataBr(data) {
  if (!data) return '-'
  return new Date(`${String(data).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
}

function ReceitaMetricCard({ titulo, valor, detalhe }) {
  return (
    <article className="receitas-card">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </article>
  )
}

export default function ReceitasPage({
  empresaId,
  empresaNome,
  filiais = [],
  voltar,
  mostrarAviso,
  podeEditarFinanceiro = true
}) {
  const {
    receitasFiltradas,
    resumo,
    origens,
    loading,
    salvando,
    erro,
    form,
    filtros,
    setFiltros,
    atualizarForm,
    limparForm,
    editarReceita,
    salvar,
    arquivar,
    restaurar,
    carregar
  } = useReceitasV1({ empresaId, mostrarAviso })

  function atualizarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
  }

  return (
    <main className="receitas-page">
      <PageHeader
        kicker="Financeiro"
        title="Receitas"
        description="Entradas de dinheiro da loja. Alimenta o FATURAMENTO BRUTO do Fluxo de Caixa."
        meta={empresaNome || ''}
        className="receitas-hero"
        actions={(
          <>
          <button type="button" className="receitas-btn secondary" onClick={voltar}>Voltar</button>
          <button type="button" className="receitas-btn secondary" onClick={carregar} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          </>
        )}
      />

      {erro && (
        <section className="receitas-error">
          <strong>Nao foi possivel carregar receitas.</strong>
          <p>{erro}</p>
        </section>
      )}

      <FilterCard className="receitas-panel" description="Refine as entradas por exercício, unidade e origem.">
        <FilterGrid className="receitas-filtros">
          <label>
            <span>Ano</span>
            <select value={filtros.ano} onChange={(event) => atualizarFiltro('ano', event.target.value)}>
              {anosDisponiveis().map((ano) => <option key={ano} value={ano}>{ano}</option>)}
            </select>
          </label>
          <label>
            <span>Mes</span>
            <select value={filtros.mes} onChange={(event) => atualizarFiltro('mes', event.target.value)}>
              {MESES.map((mes) => <option key={mes.valor || 'todos'} value={mes.valor}>{mes.label}</option>)}
            </select>
          </label>
          <label>
            <span>Filial</span>
            <select value={filtros.filialId} onChange={(event) => atualizarFiltro('filialId', event.target.value)}>
              <option value="">Todas as filiais</option>
              {filiais.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Origem</span>
            <select value={filtros.origem} onChange={(event) => atualizarFiltro('origem', event.target.value)}>
              <option value="">Todas as origens</option>
              {origens.map((origem) => <option key={origem} value={origem}>{origem}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filtros.status} onChange={(event) => atualizarFiltro('status', event.target.value)}>
              <option value="ativos">Ativos</option>
              <option value="arquivados">Arquivados</option>
              <option value="todos">Todos</option>
            </select>
          </label>
        </FilterGrid>
      </FilterCard>

      <section className="receitas-summary">
        <ReceitaMetricCard titulo="Receitas" valor={moeda(resumo.total)} detalhe="Total no filtro" />
        <ReceitaMetricCard titulo="Lancamentos" valor={resumo.quantidade} detalhe="Registros encontrados" />
        <ReceitaMetricCard titulo="Media" valor={moeda(resumo.media)} detalhe="Media por lancamento" />
        <ReceitaMetricCard titulo="Filiais" valor={resumo.porFilial.length} detalhe="Com movimento" />
      </section>

      <section className="receitas-panel">
        <div className="receitas-section-title">
          <div>
            <h2>{form.id ? 'Editar receita' : 'Nova receita'}</h2>
            <p>Cadastre entradas reais. Receitas arquivadas ficam fora do Fluxo de Caixa.</p>
          </div>
        </div>

        <div className="receitas-form">
          <label>
            <span>Data da receita</span>
            <input type="date" value={form.data_receita} onChange={(event) => atualizarForm('data_receita', event.target.value)} />
          </label>
          <label>
            <span>Filial</span>
            <select value={form.filial_id} onChange={(event) => atualizarForm('filial_id', event.target.value)}>
              <option value="">Selecione a filial</option>
              {filiais.map((filial) => <option key={filial.id} value={filial.id}>{filial.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Valor</span>
            <input value={form.valor} placeholder="Ex: 125.000,00" onChange={(event) => atualizarForm('valor', event.target.value)} />
          </label>
          <label>
            <span>Origem</span>
            <input value={form.origem} onChange={(event) => atualizarForm('origem', event.target.value)} />
          </label>
          <label className="wide">
            <span>Descricao</span>
            <input value={form.descricao} onChange={(event) => atualizarForm('descricao', event.target.value)} />
          </label>
          <label className="wide">
            <span>Observacao</span>
            <textarea value={form.observacao} onChange={(event) => atualizarForm('observacao', event.target.value)} />
          </label>
        </div>

        <div className="receitas-form-actions">
          <button type="button" className="receitas-btn primary" onClick={salvar} disabled={!podeEditarFinanceiro || salvando}>
            {salvando ? 'Salvando...' : form.id ? 'Salvar alteracao' : 'Cadastrar receita'}
          </button>
          <button type="button" className="receitas-btn secondary" onClick={limparForm}>Limpar</button>
        </div>
      </section>

      <section className="receitas-panel">
        <div className="receitas-section-title">
          <div>
            <h2>Receitas cadastradas</h2>
            <p>{receitasFiltradas.length} registro(s). O ano 2025 ja inclui a carga do PDF de vendas.</p>
          </div>
        </div>

        <DataTableRegion label="Receitas cadastradas" className="receitas-table-region">
          <table className="receitas-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Filial</th>
                <th>Origem</th>
                <th>Descricao</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {receitasFiltradas.map((receita) => (
                <tr key={receita.id}>
                  <td>{dataBr(receita.data_receita)}</td>
                  <td>{receita.df_filiais?.nome || 'Sem filial'}</td>
                  <td>{receita.origem}</td>
                  <td>{receita.descricao}</td>
                  <td>{receita.arquivado ? 'Arquivada' : receita.status}</td>
                  <td>{moeda(receita.valor)}</td>
                  <td>
                    <div className="receitas-row-actions">
                      <button type="button" onClick={() => editarReceita(receita)} disabled={!podeEditarFinanceiro}>Editar</button>
                      {receita.arquivado ? (
                        <button type="button" onClick={() => restaurar(receita.id)} disabled={!podeEditarFinanceiro}>Restaurar</button>
                      ) : (
                        <button type="button" onClick={() => arquivar(receita.id)} disabled={!podeEditarFinanceiro}>Arquivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableRegion>

        {!loading && receitasFiltradas.length === 0 && (
          <div className="receitas-empty">
            <strong>Nenhuma receita encontrada.</strong>
            <p>Ajuste os filtros ou cadastre uma entrada manualmente.</p>
          </div>
        )}
      </section>
    </main>
  )
}
