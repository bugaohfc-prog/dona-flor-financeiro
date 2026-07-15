import AgendaOperacional from '../modules/central-do-dia/components/agenda/AgendaOperacional.jsx'

export default function AgendaPage({
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
  formatarValor,
  formatarData
}) {
  return (
    <AgendaOperacional
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
      formatarValor={formatarValor}
      formatarData={formatarData}
    />
  )
}
