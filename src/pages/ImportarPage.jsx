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
  if (!podeImportarContas) {
    return (
      <>
        <h1 style={styles.titulo}>Importar planilha</h1>
        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>Acesso restrito</h2>
          <p style={styles.textoNota}>Seu perfil atual não permite importar contas.</p>
          <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>← Voltar</button>
        </section>
      </>
    )
  }

  return (
    <>
      <h1 style={styles.titulo}>📥 Importar planilha</h1>

      <button style={styles.btnCinza} onClick={() => navegarPara('dashboard')}>
        ← Voltar
      </button>

      <section style={styles.cardConfiguracao} className="import-section import-upload-section">
        <h2 style={styles.subtitulo}>1. Enviar arquivo</h2>
        <p style={styles.textoNota}>
          Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app.
        </p>

        <label style={styles.uploadExcelBox}>
          <strong>📊 Selecionar arquivo CSV</strong>
          <small>No Excel: Arquivo &gt; Salvar como &gt; CSV UTF-8</small>
          <input type="file" accept=".csv" onChange={lerArquivoExcel} style={{ display: 'none' }} />
        </label>

        {arquivoImportacao && <p style={styles.textoNota}>Arquivo: <strong>{arquivoImportacao.name}</strong></p>}
        {statusImportacao && <p style={styles.alertaSucesso}>{statusImportacao}</p>}
      </section>

      <section style={styles.cardConfiguracao} className="import-section import-columns-section">
        <h2 style={styles.subtitulo}>2. Colunas esperadas</h2>
        <div style={styles.importDicasGrid} className="import-columns-grid">
          <span>Descrição</span>
          <span>Valor</span>
          <span>Vencimento</span>
          <span>Status</span>
          <span>Centro de custo</span>
        </div>
        <p style={styles.textoAjuda}>
          O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação.
        </p>
      </section>

      {linhasImportacao.length > 0 && (
        <section style={styles.cardConfiguracao} className="import-section import-preview-section">
          <h2 style={styles.subtitulo}>3. Revisar dados</h2>
          <div style={styles.previewImportacao}>
            {linhasImportacao.slice(0, 8).map((linha) => (
              <div key={linha.linha} style={styles.previewLinha} className="import-preview-row">
                <strong>{linha.descricao || `Linha ${linha.linha}`}</strong>
                <small>{formatarData(linha.data_vencimento)} • {formatarValor(linha.valor)} • {linha.status} • {linha.centro || 'Sem centro'}</small>
              </div>
            ))}
          </div>
          {linhasImportacao.length > 8 && <small style={styles.textoAjuda}>Mostrando 8 de {linhasImportacao.length} linhas.</small>}

          <button style={styles.btnSalvar} onClick={importarExcelParaContas}>
            Importar {linhasImportacao.length} conta(s)
          </button>
        </section>
      )}
    </>
  )
}
