import DashboardPage from '../../pages/DashboardPage.jsx'

export default function DashboardRoute({
  nomeUsuario,
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  navegarPara,
  loading,
  filiais,
  centros,
  contasCentral,
  notasCentral,
  onAtualizarContasCentral,
  onAtualizarNotasCentral,
  navegarParaOrigemAgenda,
  onAbrirContasPlanejamento
}) {
  return (
    <>
      <section className="dashboard-page-context" aria-label="Contexto da página">
        <h1 className="dashboard-greeting-title">Olá, {nomeUsuario}</h1>
      </section>

      <DashboardPage
        formatarValor={formatarValor}
        total={total}
        pago={pago}
        pendente={pendente}
        vencido={vencido}
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
      />
    </>
  )
}
