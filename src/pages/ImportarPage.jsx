import { useState } from 'react'

const COLUNAS_ESPERADAS = [
  'Descrição',
  'Valor',
  'Vencimento',
  'Status',
  'Centro de custo',
  'Filial'
]

function BlocoImportacao({ etapa, titulo, descricao, aberto, onToggle, children }) {
  return (
    <section className="importacao-card">
      <header className="importacao-section-header">
        <div>
          <span>{etapa}</span>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {typeof onToggle === 'function' && (
          <button type="button" className="importacao-toggle" onClick={onToggle} aria-expanded={aberto}>
            {aberto ? '−' : '+'}
          </button>
        )}
      </header>
      {aberto !== false && children}
    </section>
  )
}

export default function ImportarPage({
  styles,
  podeImportarContas = false,
  navegarPara,
  lerArquivoExcel,
  importarExcelParaContas,
  arquivoImportacao,
  linhasImportacao = [],
  statusImportacao,
  formatarData,
  formatarValor
}) {
  const [colunasAbertas, setColunasAbertas] = useState(true)
  const [previewAberto, setPreviewAberto] = useState(true)
  const linhasValidas = linhasImportacao.filter((linha) => linha.valida).length
  const linhasInvalidas = linhasImportacao.length - linhasValidas
  const statusClasse = statusImportacao
    ? statusImportacao.toLowerCase().includes('erro') || statusImportacao.toLowerCase().includes('corrija')
      ? 'is-error'
      : statusImportacao.toLowerCase().includes('sucesso') || statusImportacao.toLowerCase().includes('conclu')
        ? 'is-success'
        : 'is-info'
    : ''

  if (!podeImportarContas) {
    return (
      <main className="importacao-page">
        <header className="importacao-hero">
          <div className="importacao-hero-copy">
            <span>Financeiro</span>
            <h1>Importar contas</h1>
            <p>Seu perfil atual não permite importar contas por planilha.</p>
          </div>
          <button type="button" className="importacao-btn importacao-btn-secondary" onClick={() => navegarPara('dashboard')}>
            ← Voltar
          </button>
        </header>

        <section className="importacao-card importacao-restricted">
          <strong>Acesso restrito</strong>
          <p>A importação de contas está disponível apenas para perfis autorizados.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="importacao-page">
      <header className="importacao-hero">
        <div className="importacao-hero-copy">
          <span>Financeiro</span>
          <h1>Importar contas</h1>
          <p>Envie um arquivo CSV para revisar e importar contas sem alterar o fluxo financeiro atual.</p>
        </div>
        <button type="button" className="importacao-btn importacao-btn-secondary" onClick={() => navegarPara('dashboard')}>
          ← Voltar
        </button>
      </header>

      <div className="importacao-flow">
        <span className="is-active">1. Arquivo</span>
        <span className={linhasImportacao.length > 0 ? 'is-active' : ''}>2. Validação</span>
        <span className={linhasImportacao.length > 0 ? 'is-active' : ''}>3. Revisão</span>
        <span>4. Importação</span>
      </div>

      <BlocoImportacao
        etapa="Etapa 1"
        titulo="Enviar arquivo"
        descricao="Use CSV UTF-8 exportado do Excel ou da sua planilha financeira."
        aberto
      >
        <div className="importacao-upload-grid">
          <label className="importacao-upload">
            <input type="file" accept=".csv" onChange={lerArquivoExcel} />
            <strong>Selecionar CSV</strong>
            <small>No Excel: Arquivo &gt; Salvar como &gt; CSV UTF-8.</small>
          </label>

          <aside className="importacao-file-state">
            <span>Arquivo atual</span>
            {arquivoImportacao ? (
              <strong>{arquivoImportacao.name}</strong>
            ) : (
              <p>Nenhum arquivo selecionado. Escolha um CSV para liberar a revisão das linhas.</p>
            )}
          </aside>
        </div>

        {statusImportacao && (
          <div className={`importacao-alert ${statusClasse}`}>
            {statusImportacao}
          </div>
        )}
      </BlocoImportacao>

      <BlocoImportacao
        etapa="Etapa 2"
        titulo="Colunas esperadas"
        descricao="A planilha pode usar nomes equivalentes, como Conta, Data, Categoria e Situação."
        aberto={colunasAbertas}
        onToggle={() => setColunasAbertas((valor) => !valor)}
      >
        <div className="importacao-columns">
          {COLUNAS_ESPERADAS.map((coluna) => (
            <span key={coluna}>{coluna}</span>
          ))}
        </div>
      </BlocoImportacao>

      <BlocoImportacao
        etapa="Etapa 3"
        titulo="Revisão dos dados"
        descricao={linhasImportacao.length > 0 ? 'Confira a prévia antes de importar as contas.' : 'A prévia aparecerá aqui depois que um CSV válido for selecionado.'}
        aberto={previewAberto}
        onToggle={() => setPreviewAberto((valor) => !valor)}
      >
        {linhasImportacao.length > 0 ? (
          <>
            <div className="importacao-summary">
              <span><strong>{linhasImportacao.length}</strong> linha(s)</span>
              <span><strong>{linhasValidas}</strong> válida(s)</span>
              <span className={linhasInvalidas > 0 ? 'has-error' : ''}><strong>{linhasInvalidas}</strong> com erro</span>
            </div>

            <div className="importacao-preview">
              {linhasImportacao.slice(0, 8).map((linha) => (
                <article key={linha.linha} className={`importacao-preview-row ${linha.valida ? 'is-valid' : 'is-invalid'}`}>
                  <div className="importacao-preview-title">
                    <strong>{linha.descricao || `Linha ${linha.linha}`}</strong>
                    <span>{linha.valida ? 'Válida' : 'Revisar'}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Vencimento</dt>
                      <dd>{formatarData(linha.data_vencimento)}</dd>
                    </div>
                    <div>
                      <dt>Valor</dt>
                      <dd>{formatarValor(linha.valor)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{linha.status || 'Sem status'}</dd>
                    </div>
                    <div>
                      <dt>Centro</dt>
                      <dd>{linha.centro || 'Sem centro'}</dd>
                    </div>
                    <div>
                      <dt>Filial</dt>
                      <dd>{linha.filial || 'Sem filial'}</dd>
                    </div>
                  </dl>
                  {linha.erro && <p>{linha.erro}</p>}
                </article>
              ))}
            </div>

            {linhasImportacao.length > 8 && (
              <small className="importacao-note">Mostrando 8 de {linhasImportacao.length} linhas.</small>
            )}

            <div className="importacao-actions">
              <button type="button" className="importacao-btn importacao-btn-primary" onClick={importarExcelParaContas}>
                Importar {linhasImportacao.length} conta(s)
              </button>
            </div>
          </>
        ) : (
          <div className="importacao-empty">
            <strong>Nenhuma linha para revisar</strong>
            <p>Selecione um arquivo CSV para visualizar as contas antes da importação.</p>
          </div>
        )}
      </BlocoImportacao>
    </main>
  )
}
