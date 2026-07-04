import { useReceitasV1 } from '../modules/contas/hooks/receitas/useReceitasV1'

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
      <style>{cssReceitas}</style>

      <header className="receitas-hero">
        <div>
          <span>Financeiro</span>
          <h1>Receitas</h1>
          <p>Entradas de dinheiro da loja. Alimenta o FATURAMENTO BRUTO do Fluxo de Caixa.</p>
          {empresaNome && <small>{empresaNome}</small>}
        </div>
        <div className="receitas-actions">
          <button type="button" className="receitas-btn secondary" onClick={voltar}>Voltar</button>
          <button type="button" className="receitas-btn secondary" onClick={carregar} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      {erro && (
        <section className="receitas-error">
          <strong>Nao foi possivel carregar receitas.</strong>
          <p>{erro}</p>
        </section>
      )}

      <section className="receitas-panel">
        <div className="receitas-filtros">
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
        </div>
      </section>

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

        <div className="receitas-actions">
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

        <div className="receitas-table-wrap">
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
        </div>

        <div className="receitas-mobile-list">
          {receitasFiltradas.map((receita) => (
            <article key={`card-${receita.id}`} className="receitas-mobile-card">
              <header>
                <strong>{receita.df_filiais?.nome || 'Sem filial'}</strong>
                <span>{moeda(receita.valor)}</span>
              </header>
              <p>{dataBr(receita.data_receita)} - {receita.origem}</p>
              <small>{receita.descricao}</small>
              <div className="receitas-row-actions">
                <button type="button" onClick={() => editarReceita(receita)} disabled={!podeEditarFinanceiro}>Editar</button>
                {receita.arquivado ? (
                  <button type="button" onClick={() => restaurar(receita.id)} disabled={!podeEditarFinanceiro}>Restaurar</button>
                ) : (
                  <button type="button" onClick={() => arquivar(receita.id)} disabled={!podeEditarFinanceiro}>Arquivar</button>
                )}
              </div>
            </article>
          ))}
        </div>

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

const cssReceitas = `
.receitas-page { display: grid; gap: 16px; width: 100%; max-width: 1280px; margin: 0 auto; }
.receitas-hero, .receitas-panel, .receitas-error { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 16px; }
.receitas-hero { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: flex-start; }
.receitas-hero span { color: #0f766e; font-size: 12px; font-weight: 900; text-transform: uppercase; }
.receitas-hero h1, .receitas-section-title h2 { margin: 4px 0; color: #0f172a; }
.receitas-hero p, .receitas-section-title p { margin: 0; color: #64748b; }
.receitas-actions, .receitas-filtros, .receitas-form, .receitas-row-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
.receitas-filtros label, .receitas-form label { display: grid; gap: 6px; min-width: 170px; flex: 1; color: #334155; font-weight: 800; font-size: 13px; }
.receitas-form label.wide { min-width: min(100%, 360px); flex: 2; }
.receitas-filtros input, .receitas-filtros select, .receitas-form input, .receitas-form select, .receitas-form textarea { min-height: 40px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; }
.receitas-form textarea { min-height: 72px; resize: vertical; }
.receitas-btn, .receitas-row-actions button { min-height: 38px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 900; cursor: pointer; }
.receitas-btn.primary { background: #0f766e; border-color: #0f766e; color: #fff; }
.receitas-btn.secondary, .receitas-row-actions button { background: #f8fafc; color: #0f172a; }
.receitas-btn:disabled, .receitas-row-actions button:disabled { opacity: .55; cursor: not-allowed; }
.receitas-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.receitas-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #fff; display: grid; gap: 4px; }
.receitas-card span, .receitas-card small { color: #64748b; }
.receitas-card strong { font-size: 20px; color: #0f172a; }
.receitas-section-title { margin-bottom: 12px; }
.receitas-error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.receitas-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
.receitas-table { width: 100%; border-collapse: collapse; min-width: 880px; }
.receitas-table th, .receitas-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.receitas-table th { background: #f8fafc; color: #334155; font-size: 12px; text-transform: uppercase; }
.receitas-table td:nth-child(6) { text-align: right; font-weight: 900; }
.receitas-mobile-list { display: none; gap: 10px; }
.receitas-mobile-card, .receitas-empty { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #fff; }
.receitas-mobile-card { display: grid; gap: 6px; }
.receitas-mobile-card header { display: flex; justify-content: space-between; gap: 10px; }
.receitas-mobile-card p, .receitas-mobile-card small { margin: 0; color: #64748b; }
@media (max-width: 760px) {
  .receitas-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .receitas-actions, .receitas-filtros, .receitas-form { width: 100%; }
  .receitas-btn, .receitas-filtros label, .receitas-form label { width: 100%; min-width: 0; }
  .receitas-table-wrap { display: none; }
  .receitas-mobile-list { display: grid; }
}
`
