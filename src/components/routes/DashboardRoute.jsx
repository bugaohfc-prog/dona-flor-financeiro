import DashboardPage from '../../pages/DashboardPage.jsx'

export default function DashboardRoute({
  nomeUsuario,
  formatarValor,
  navegarPara,
  loading,
  filiais,
  centros,
  contasCentral,
  notasCentral,
  onAtualizarContasCentral,
  onAtualizarNotasCentral,
  navegarParaOrigemAgenda,
  onAbrirContasPlanejamento,
  podeAcessarPessoas
}) {
  return (
    <>
      <section className="dashboard-page-context" aria-label="Contexto da página">
        <h1 className="dashboard-greeting-title">Olá, {nomeUsuario}</h1>
      </section>

      <DashboardPage
        formatarValor={formatarValor}
        navegarPara={navegarPara}
        loading={loading}
        nomeUsuario={nomeUsuario}
        filiais={filiais}
        centros={centros}
        contasCentral={contasCentral}
        notasCentral={notasCentral}
        onAtualizarContasCentral={onAtualizarContasCentral}
        onAtualizarNotasCentral={onAtualizarNotasCentral}
        navegarParaOrigemAgenda={navegarParaOrigemAgenda}
        onAbrirContasPlanejamento={onAbrirContasPlanejamento}
        podeAcessarPessoas={podeAcessarPessoas}
      />
    </>
  )
}
