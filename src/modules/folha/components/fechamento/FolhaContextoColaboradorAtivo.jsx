export default function FolhaContextoColaboradorAtivo({
  ativo,
  resumo,
  nome,
  cargo,
  filialNome,
  competencia,
  colaboradorId,
  estilos,
  styles,
  podeEditar,
  salvando,
  onNovoLancamento,
  onVoltar,
  formatarMoeda,
  formatarNumero
}) {
  if (!ativo) return null

  const resumoAtivo = resumo || {
    creditos: 0,
    descontos: 0,
    totalAtual: 0,
    totalComprasVales: 0,
    horasExtras: 0,
    faltas: 0,
    itensDetalhados: 0,
    lancamentosSemItens: 0,
    pendentes: 0
  }

  return (
    <div style={estilos.contextoColaboradorPanel}>
      <div style={estilos.contextoColaboradorHeader}>
        <div style={estilos.contextoColaboradorTitulo}>
          <span style={estilos.badge}>Edição do colaborador</span>
          <h3 style={estilos.contextoColaboradorNome}>{nome}</h3>
          <p style={estilos.contextoColaboradorMeta}>
            {cargo || 'Cargo não informado'} | {filialNome || 'Filial não informada'} | {competencia || 'Competência não selecionada'}
          </p>
        </div>
        <div style={estilos.contextoColaboradorAcoes}>
          <button
            type="button"
            style={styles.btnPrimario}
            onClick={() => onNovoLancamento(colaboradorId)}
            disabled={!podeEditar || salvando}
          >
            + lançamento para este colaborador
          </button>
          <button type="button" style={styles.btnCinza} onClick={onVoltar}>
            Voltar para todos
          </button>
        </div>
      </div>

      <div style={estilos.contextoResumoGrid}>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Total atual</span>
          <strong style={estilos.contextoResumoValor}>{formatarMoeda(resumoAtivo.totalAtual)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Créditos</span>
          <strong style={estilos.contextoResumoValor}>{formatarMoeda(resumoAtivo.creditos)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Descontos</span>
          <strong style={estilos.contextoResumoValor}>{formatarMoeda(resumoAtivo.descontos)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Vales/compras</span>
          <strong style={estilos.contextoResumoValor}>{formatarMoeda(resumoAtivo.totalComprasVales)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Horas extras</span>
          <strong style={estilos.contextoResumoValor}>{formatarNumero(resumoAtivo.horasExtras)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Faltas</span>
          <strong style={estilos.contextoResumoValor}>{formatarNumero(resumoAtivo.faltas)}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Itens</span>
          <strong style={estilos.contextoResumoValor}>{resumoAtivo.itensDetalhados}</strong>
        </div>
        <div style={estilos.contextoResumoCard}>
          <span style={estilos.contextoResumoLabel}>Pendentes</span>
          <strong style={estilos.contextoResumoValor}>{resumoAtivo.pendentes}</strong>
        </div>
      </div>

      {resumoAtivo.lancamentosSemItens > 0 && (
        <div style={estilos.warning}>
          {resumoAtivo.lancamentosSemItens} lançamento(s) detalhável(is) ainda sem item ativo. Confira vales, compras, faltas, horas extras e premiações antes de fechar.
        </div>
      )}
    </div>
  )
}
