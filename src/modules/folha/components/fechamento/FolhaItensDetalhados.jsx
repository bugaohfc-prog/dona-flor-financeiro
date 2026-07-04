function FolhaFormularioItem({
  lancamento,
  categoria,
  estilos,
  styles,
  podeEditar,
  salvando,
  formItem,
  setFormItem,
  itemEditandoId,
  valorItemPremiacaoCalculado,
  categoriaHorasItem,
  categoriaFaltaItem,
  categoriaPremiacaoItem,
  categoriaCompraItem,
  formatarMoeda,
  onSalvar,
  onCancelar
}) {
  const mostrarDataItem = !categoriaPremiacaoItem
  const mostrarQuantidadeItem = categoriaHorasItem || categoriaFaltaItem
  const mostrarPercentualItem = categoriaPremiacaoItem
  const mostrarValorItem = categoriaCompraItem
  const textoCategoriaItem = categoriaCompraItem
    ? 'Use para compras internas, vales ou descontos combinados com o colaborador.'
    : categoriaFaltaItem
      ? 'Informe quantidade/dias. O calculo trabalhista final deve ser conferido pela contabilidade.'
      : categoriaHorasItem
        ? 'Informe a quantidade de horas para conferencia. Nao substitui calculo trabalhista.'
        : categoriaPremiacaoItem
          ? 'Calculo gerencial de apoio. Conferir regras internas antes do fechamento.'
          : 'Use para detalhar o lancamento com contexto administrativo.'

  return (
    <form id={`folha-form-item-${lancamento.id}`} onSubmit={(event) => onSalvar(event, lancamento)} style={estilos.itemFormularioCompacto}>
      <div style={estilos.itemFormularioHeader}>
        <div>
          <h4 style={estilos.formSectionTitle}>
            {itemEditandoId ? 'Editar item detalhado' : 'Adicionar item detalhado'}
          </h4>
          <p style={estilos.helperText}>
            Formulario do item. O total do lancamento e recalculado pelo banco apos salvar.
          </p>
          <p style={estilos.helperText}>{textoCategoriaItem}</p>
        </div>
        <button type="button" style={styles.btnCinza} onClick={() => onCancelar(lancamento)}>
          Fechar formulario
        </button>
      </div>

      <div style={estilos.formGrid}>
        {mostrarDataItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>{categoriaFaltaItem ? 'Data da falta' : 'Data'}</span>
            <input
              type="date"
              value={formItem.data_referencia}
              onChange={(event) => setFormItem((atual) => ({ ...atual, data_referencia: event.target.value }))}
              style={estilos.input}
              disabled={!podeEditar || salvando}
              required={categoriaFaltaItem}
            />
          </label>
        )}

        {categoriaPremiacaoItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>Valor base</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formItem.valor_base}
              onChange={(event) => setFormItem((atual) => ({ ...atual, valor_base: event.target.value }))}
              style={estilos.input}
              disabled={!podeEditar || salvando}
              required
            />
          </label>
        )}

        {mostrarQuantidadeItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>{categoriaHorasItem ? 'Quantidade de horas' : 'Quantidade/dias'}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formItem.quantidade}
              onChange={(event) => setFormItem((atual) => ({ ...atual, quantidade: event.target.value }))}
              style={estilos.input}
              disabled={!podeEditar || salvando}
              required
            />
          </label>
        )}

        {mostrarPercentualItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>Percentual</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formItem.percentual}
              onChange={(event) => setFormItem((atual) => ({ ...atual, percentual: event.target.value }))}
              style={estilos.input}
              disabled={!podeEditar || salvando}
              required
            />
          </label>
        )}

        {mostrarValorItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>Valor</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formItem.valor}
              onChange={(event) => setFormItem((atual) => ({ ...atual, valor: event.target.value }))}
              style={estilos.input}
              disabled={!podeEditar || salvando}
              required
            />
          </label>
        )}

        {categoriaPremiacaoItem && (
          <label style={estilos.formField}>
            <span style={estilos.label}>Valor calculado</span>
            <input
              value={valorItemPremiacaoCalculado ? formatarMoeda(valorItemPremiacaoCalculado) : 'Preencha valor base e percentual'}
              style={estilos.inputReadOnly}
              disabled
              readOnly
            />
          </label>
        )}
      </div>

      {categoriaPremiacaoItem && (
        <small style={estilos.helperText}>
          Calculo simples: valor base x percentual / 100
          {valorItemPremiacaoCalculado ? ` = ${formatarMoeda(valorItemPremiacaoCalculado)}.` : '.'}
        </small>
      )}
      {categoriaHorasItem && (
        <small style={estilos.helperText}>
          O valor 0 e registrado automaticamente. A contabilidade confere o calculo trabalhista.
        </small>
      )}
      {categoriaFaltaItem && (
        <small style={estilos.helperText}>
          O valor 0 e registrado automaticamente. A data ajuda a contabilidade a avaliar DSR.
        </small>
      )}

      <label style={estilos.formField}>
        <span style={estilos.label}>Descricao curta</span>
        <input
          value={formItem.descricao}
          onChange={(event) => setFormItem((atual) => ({ ...atual, descricao: event.target.value }))}
          style={estilos.input}
          disabled={!podeEditar || salvando}
          placeholder="Resumo administrativo curto do item."
        />
      </label>

      <label style={estilos.formField}>
        <span style={estilos.label}>Observacao administrativa</span>
        <textarea
          value={formItem.observacao_administrativa}
          onChange={(event) => setFormItem((atual) => ({ ...atual, observacao_administrativa: event.target.value }))}
          style={estilos.textarea}
          disabled={!podeEditar || salvando}
          placeholder="Nao registre dados medicos, documentos, diagnosticos ou informacoes sensiveis neste campo."
        />
        <small style={estilos.helperText}>
          Nao registre dados medicos, documentos, diagnosticos ou informacoes sensiveis neste campo.
        </small>
      </label>

      <div style={estilos.formActions}>
        <button type="submit" style={styles.btnPrimario} disabled={!podeEditar || salvando}>
          {salvando ? 'Salvando...' : (itemEditandoId ? 'Salvar item' : 'Adicionar item')}
        </button>
        <button type="button" style={styles.btnCinza} onClick={() => onCancelar(lancamento)} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function FolhaItensDetalhados({
  lancamento,
  itens,
  podeDetalhar,
  formularioAberto,
  estilos,
  styles,
  podeEditar,
  salvando,
  loading,
  formItem,
  setFormItem,
  itemEditandoId,
  valorItemPremiacaoCalculado,
  labelsCategoria,
  categoriasHorasExtras,
  formatarData,
  formatarNumero,
  formatarMoeda,
  onNovoItem,
  onSalvarItem,
  onCancelarItem,
  onEditarItem,
  onArquivarItem
}) {
  const categoria = lancamento?.categoria
  const totalItens = itens.reduce((total, item) => total + (Number(item?.valor) || 0), 0)
  const categoriaCompraVale = categoria === 'compras_vales'
  const categoriaHorasItem = categoriasHorasExtras.has(categoria)
  const categoriaFaltaItem = categoria === 'falta_injustificada'
  const categoriaPremiacaoItem = categoria === 'premiacao'

  if (!podeDetalhar) {
    return (
      <p style={estilos.helperText}>
        Esta categoria permanece como lancamento consolidado, sem itens detalhados neste ciclo.
      </p>
    )
  }

  return (
    <div data-folha-itens-lancamento-id={lancamento.id} style={estilos.itensPanel}>
      <div style={estilos.itensPanelHeader}>
        <div style={estilos.itensPanelIntro}>
          <strong>Itens do lancamento</strong>
          <p style={estilos.helperText}>
            {loading
              ? 'Carregando itens...'
              : `${itens.length} item(ns) ativo(s). Total dos itens: ${formatarMoeda(totalItens)}.`}
          </p>
          {categoriaCompraVale && (
            <p style={estilos.helperText}>
              Vales/compras ficam detalhados por item para facilitar conferencia e relancamento.
            </p>
          )}
        </div>
        <button
          type="button"
          style={styles.btnPrimario}
          onClick={() => onNovoItem(lancamento)}
          disabled={!podeEditar || salvando || lancamento.arquivado}
        >
          + item
        </button>
      </div>

      {itens.length === 0 && !formularioAberto && (
        <p style={estilos.itemVazio}>
          Nenhum item ativo. Use + item para detalhar este lancamento.
        </p>
      )}

      {formularioAberto && (
        <FolhaFormularioItem
          lancamento={lancamento}
          categoria={categoria}
          estilos={estilos}
          styles={styles}
          podeEditar={podeEditar}
          salvando={salvando}
          formItem={formItem}
          setFormItem={setFormItem}
          itemEditandoId={itemEditandoId}
          valorItemPremiacaoCalculado={valorItemPremiacaoCalculado}
          categoriaHorasItem={categoriaHorasItem}
          categoriaFaltaItem={categoriaFaltaItem}
          categoriaPremiacaoItem={categoriaPremiacaoItem}
          categoriaCompraItem={categoriaCompraVale}
          formatarMoeda={formatarMoeda}
          onSalvar={onSalvarItem}
          onCancelar={onCancelarItem}
        />
      )}

      {itens.length > 0 && (
        <div style={estilos.itensLista}>
          {itens.map((item) => (
            <article key={item.id} style={estilos.itemDetalhado}>
              <div style={estilos.itemDetalhadoHeader}>
                <div>
                  <strong>{item.descricao || labelsCategoria[item.categoria] || item.categoria}</strong>
                  <p style={estilos.helperText}>
                    {formatarData(item.data_referencia)} | Qtd. {formatarNumero(item.quantidade)} | {formatarNumero(item.percentual)}%
                  </p>
                </div>
                <strong className="folha-money">{formatarMoeda(item.valor)}</strong>
              </div>
              {item.observacao_administrativa && (
                <p className="folha-card-description">{item.observacao_administrativa}</p>
              )}
              <div style={estilos.acoesTabela}>
                <button
                  type="button"
                  style={styles.btnCinza}
                  onClick={() => onEditarItem(lancamento, item)}
                  disabled={!podeEditar || salvando || lancamento.arquivado}
                >
                  Editar item
                </button>
                <button
                  type="button"
                  style={styles.btnCinza}
                  onClick={() => onArquivarItem(item)}
                  disabled={!podeEditar || salvando || lancamento.arquivado}
                >
                  Arquivar item
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
