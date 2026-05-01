import { useState } from "react";
import { exportAccountsCSV } from "../utils/csv";
import { dateBR, money } from "../utils/format";

export default function Relatorios({ contas }) {
  const [open, setOpen] = useState(false);

  const abertas = contas.filter((c) => c.status !== "Pago");
  const pagas = contas.filter((c) => c.status === "Pago");

  const totalAberto = abertas.reduce((s, c) => s + Number(c.valor || 0), 0);
  const totalPago = pagas.reduce((s, c) => s + Number(c.valor || 0), 0);

  function imprimir() {
    setTimeout(() => window.print(), 120);
  }

  return (
    <section className="card">
      <h2>Relatórios</h2>
      <div className="filters">
        <button onClick={() => setOpen(true)}>PDF / Relatório</button>
        <button className="outline" onClick={() => exportAccountsCSV(contas)}>CSV</button>
      </div>

      {open && (
        <div id="printArea" className="modalOverlay printOnlyOverlay" onClick={() => setOpen(false)}>
          <div className="modal reportModal" onClick={(e) => e.stopPropagation()}>
            <div className="printActions">
              <button onClick={imprimir}>Salvar PDF</button>
              <button className="outline" onClick={() => setOpen(false)}>Fechar</button>
            </div>

            <div className="reportContent">
              <h1>Dona Flor Gestão Financeira</h1>
              <p>Relatório financeiro</p>

              <div className="metrics reportMetrics">
                <div><span>Quantidade</span><strong>{contas.length}</strong></div>
                <div><span>Total aberto</span><strong>{money(totalAberto)}</strong></div>
                <div><span>Total pago</span><strong>{money(totalPago)}</strong></div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Conta</th>
                    <th>Centro</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.descricao}</td>
                      <td>{c.centro}</td>
                      <td>{dateBR(c.vencimento)}</td>
                      <td>{c.status}</td>
                      <td>{money(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
