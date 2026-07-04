import { Fragment } from 'react'

export default function FolhaLancamentosLista({
  grupos,
  estilos,
  styles,
  podeEditar,
  salvando,
  lancamentoItensAbertoId,
  labelsNatureza,
  labelsCategoria,
  formatarData,
  formatarNumero,
  formatarMoeda,
  renderResumoGrupo,
  renderAcoesLancamento,
  renderItensLancamento,
  onNovoLancamento
}) {
  return (
    <>
      <p className="folha-mobile-note" style={styles.textoNota}>
        No celular, os lançamentos aparecem em cards para facilitar leitura e conferência.
      </p>
      <div className="folha-desktop-list" style={estilos.tableWrap}>
        <table className="folha-table" style={estilos.table}>
          <thead>
            <tr>
              <th style={estilos.th}>Funcionário</th>
              <th style={estilos.th}>Natureza</th>
              <th style={estilos.th}>Categoria</th>
              <th style={estilos.th}>Descrição</th>
              <th style={estilos.th}>Data</th>
              <th style={estilos.th}>Qtd.</th>
              <th style={estilos.th}>%</th>
              <th style={estilos.th}>Valor</th>
              <th style={estilos.th}>Conferido</th>
              <th style={estilos.th}>Status</th>
              <th style={estilos.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <Fragment key={`grupo-${grupo.funcionarioId}`}>
                <tr style={estilos.grupoTableRow}>
                  <td colSpan={11} style={{ ...estilos.td, borderBottom: '1px solid #e2e8f0' }}>
                    <div style={estilos.grupoLancamentosHeader}>
                      <div style={estilos.grupoLancamentosNome}>
                        <strong>{grupo.nome}</strong>
                        <span style={styles.textoNota}>
                          {grupo.resumo.quantidadeLancamentos} lançamento(s) nesta competência.
                        </span>
                      </div>
                      {renderResumoGrupo(grupo.resumo)}
                      <button
                        type="button"
                        style={styles.btnPrimario}
                        onClick={() => onNovoLancamento(grupo.funcionarioId)}
                        disabled={!podeEditar || salvando || grupo.funcionarioId === '__sem_funcionario'}
                      >
                        + lançamento
                      </button>
                    </div>
                  </td>
                </tr>
                {grupo.lancamentos.map((lancamento) => (
                  <Fragment key={lancamento.id}>
                    <tr>
                      <td style={{ ...estilos.td, ...estilos.tdTexto }}>{grupo.nome}</td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>
                        {labelsNatureza[lancamento.natureza] || lancamento.natureza}
                      </td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>
                        {labelsCategoria[lancamento.categoria] || lancamento.categoria}
                      </td>
                      <td style={{ ...estilos.td, ...estilos.tdTexto }}>{lancamento.descricao || '-'}</td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>{formatarData(lancamento.data_referencia)}</td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>{formatarNumero(lancamento.quantidade)}</td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>{formatarNumero(lancamento.percentual)}</td>
                      <td style={{ ...estilos.td, ...estilos.tdValor }}>
                        {lancamento.valor === null ? '-' : formatarMoeda(lancamento.valor)}
                      </td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>{lancamento.conferido ? 'Sim' : 'Não'}</td>
                      <td style={{ ...estilos.td, ...estilos.tdMuted }}>{lancamento.arquivado ? 'Arquivado' : 'Ativo'}</td>
                      <td style={estilos.td}>{renderAcoesLancamento(lancamento)}</td>
                    </tr>
                    {lancamentoItensAbertoId === lancamento.id && (
                      <tr>
                        <td colSpan={11} style={{ ...estilos.td, background: '#f8fafc' }}>
                          {renderItensLancamento(lancamento)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="folha-mobile-list" style={estilos.mobileCards}>
        {grupos.map((grupo) => (
          <div key={`mobile-grupo-${grupo.funcionarioId}`} style={estilos.mobileGroup}>
            <div style={estilos.grupoLancamentosHeader}>
              <div style={estilos.grupoLancamentosNome}>
                <strong>{grupo.nome}</strong>
                <span style={styles.textoNota}>
                  {grupo.resumo.quantidadeLancamentos} lançamento(s) nesta competência.
                </span>
              </div>
              <button
                type="button"
                style={styles.btnPrimario}
                onClick={() => onNovoLancamento(grupo.funcionarioId)}
                disabled={!podeEditar || salvando || grupo.funcionarioId === '__sem_funcionario'}
              >
                + lançamento
              </button>
            </div>
            {renderResumoGrupo(grupo.resumo)}

            {grupo.lancamentos.map((lancamento) => (
              <article key={`mobile-${lancamento.id}`} style={estilos.mobileCard}>
                <div style={estilos.mobileCardHeader}>
                  <div>
                    <strong>{labelsCategoria[lancamento.categoria] || lancamento.categoria}</strong>
                    <p className="folha-card-description">
                      {labelsNatureza[lancamento.natureza] || lancamento.natureza}
                    </p>
                  </div>
                  <span style={estilos.badge}>{lancamento.arquivado ? 'Arquivado' : 'Ativo'}</span>
                </div>

                {lancamento.descricao && (
                  <p className="folha-card-description">{lancamento.descricao}</p>
                )}

                <div className="folha-mobile-meta-grid" style={estilos.mobileMetaGrid}>
                  <div style={estilos.mobileMetaItem}>
                    <span style={estilos.mobileMetaLabel}>Data</span>
                    <strong>{formatarData(lancamento.data_referencia)}</strong>
                  </div>
                  <div style={estilos.mobileMetaItem}>
                    <span style={estilos.mobileMetaLabel}>Valor</span>
                    <strong className="folha-money">{lancamento.valor === null ? '-' : formatarMoeda(lancamento.valor)}</strong>
                  </div>
                  <div style={estilos.mobileMetaItem}>
                    <span style={estilos.mobileMetaLabel}>Qtd. / %</span>
                    <strong>{formatarNumero(lancamento.quantidade)} / {formatarNumero(lancamento.percentual)}</strong>
                  </div>
                  <div style={estilos.mobileMetaItem}>
                    <span style={estilos.mobileMetaLabel}>Conferido</span>
                    <strong>{lancamento.conferido ? 'Sim' : 'Não'}</strong>
                  </div>
                </div>

                {renderAcoesLancamento(lancamento)}
                {lancamentoItensAbertoId === lancamento.id && renderItensLancamento(lancamento)}
              </article>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
