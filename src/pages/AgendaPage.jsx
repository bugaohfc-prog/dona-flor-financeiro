import AgendaOperacional from '../modules/central-do-dia/components/agenda/AgendaOperacional.jsx'

export default function AgendaPage({
  styles,
  empresaId,
  filiais,
  contas,
  notas,
  carregandoFinanceiro,
  podeAcessarPessoas,
  atualizarContas,
  atualizarNotas,
  navegarPara,
  navegarParaOrigemAgenda,
  podeEditarFinanceiro,
  abrirEdicaoConta,
  marcarComoPago,
  formatarValor,
  formatarData,
  limitarDataInput
}) {
  return (
    <AgendaOperacional
      styles={styles}
      empresaId={empresaId}
      filiais={filiais}
      contas={contas}
      notas={notas}
      carregandoFinanceiro={carregandoFinanceiro}
      podeAcessarPessoas={podeAcessarPessoas}
      atualizarContas={atualizarContas}
      atualizarNotas={atualizarNotas}
      navegarPara={navegarPara}
      navegarParaOrigemAgenda={navegarParaOrigemAgenda}
      podeEditarFinanceiro={podeEditarFinanceiro}
      abrirEdicaoConta={abrirEdicaoConta}
      marcarComoPago={marcarComoPago}
      formatarValor={formatarValor}
      formatarData={formatarData}
      limitarDataInput={limitarDataInput}
    />
  )
}
