import DashboardPage from '../../pages/DashboardPage.jsx'

export default function DashboardRoute({
  styles,
  nomeUsuario,
  formatarValor,
  total,
  pago,
  pendente,
  vencido,
  contas,
  diferencaDias,
  navegarPara,
  contasAbertasDashboard,
  mostrarContasDashboard,
  setMostrarContasDashboard,
  busca,
  setBusca,
  estaVencida,
  formatarData,
  abrirConfirmacao,
  marcarComoPago,
  podeEditarFinanceiro = true,
  notasPendentes,
  notasCriticas,
  notasUrgentes,
  mostrarNotas,
  setMostrarNotas,
  alternarNotaConcluida,
  abrirEdicaoNota,
  excluirNota,
  loading,
  filiais,
  filtroFilial,
  setFiltroFilial,
  contasOperacionaisFiliais,
  contasCentral,
  notasCentral,
  onAtualizarContasCentral,
  onAtualizarNotasCentral,
  navegarParaOrigemAgenda
}) {
  return (
    <>
      <section className="dashboard-page-context" aria-label="Contexto da página">
        <h1 className="dashboard-greeting-title">Olá, {nomeUsuario}</h1>
      </section>

      <DashboardPage
        styles={styles}
        formatarValor={formatarValor}
        total={total}
        pago={pago}
        pendente={pendente}
        vencido={vencido}
        contas={contas}
        diferencaDias={diferencaDias}
        navegarPara={navegarPara}
        contasAbertasDashboard={contasAbertasDashboard}
        mostrarContasDashboard={mostrarContasDashboard}
        setMostrarContasDashboard={setMostrarContasDashboard}
        busca={busca}
        setBusca={setBusca}
        estaVencida={estaVencida}
        formatarData={formatarData}
        abrirConfirmacao={abrirConfirmacao}
        marcarComoPago={marcarComoPago}
        podeEditarFinanceiro={podeEditarFinanceiro}
        notasPendentes={notasPendentes}
        notasCriticas={notasCriticas}
        notasUrgentes={notasUrgentes}
        mostrarNotas={mostrarNotas}
        setMostrarNotas={setMostrarNotas}
        alternarNotaConcluida={alternarNotaConcluida}
        abrirEdicaoNota={abrirEdicaoNota}
        excluirNota={excluirNota}
        loading={loading}
        nomeUsuario={nomeUsuario}
        filiais={filiais}
        filtroFilial={filtroFilial}
        setFiltroFilial={setFiltroFilial}
        contasOperacionaisFiliais={contasOperacionaisFiliais}
        contasCentral={contasCentral}
        notasCentral={notasCentral}
        onAtualizarContasCentral={onAtualizarContasCentral}
        onAtualizarNotasCentral={onAtualizarNotasCentral}
        navegarParaOrigemAgenda={navegarParaOrigemAgenda}
      />
    </>
  )
}
