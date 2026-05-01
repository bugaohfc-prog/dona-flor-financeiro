import { useState } from "react";
import { dateBR, money, todayISO } from "../utils/format";

export default function Contas({ contas, centros, filtros, setFiltros, onSave, onTogglePaid, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    vencimento: todayISO(),
    centro: centros[0],
    status: "Aberto",
    observacao: "",
  });

  function salvar() {
    if (!form.descricao || !form.valor) {
      alert("Preencha descrição e valor.");
      return;
    }

    onSave(form);
    setForm({ descricao: "", valor: "", vencimento: todayISO(), centro: centros[0], status: "Aberto", observacao: "" });
    setOpen(false);
  }

  return (
    <section className="card">
      <div className="sectionHeader">
        <h2>Contas a pagar</h2>
        <button className="plus" onClick={() => setOpen(true)}>+</button>
      </div>

      <div className="filters">
        <select value={filtros.centro} onChange={(e) => setFiltros({ ...filtros, centro: e.target.value })}>
          <option value="">Todos os centros</option>
          {centros.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
          <option value="">Todos os status</option>
          <option>Aberto</option>
          <option>Pago</option>
        </select>
      </div>

      {open && (
        <div className="modalOverlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setOpen(false)}>×</button>
            <h2>Lançamento de contas</h2>
            <input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <input placeholder="Valor - Ex: 150,90" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            <input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
            <select value={form.centro} onChange={(e) => setForm({ ...form, centro: e.target.value })}>
              {centros.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Aberto</option>
              <option>Pago</option>
            </select>
            <textarea placeholder="Observação" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            <button onClick={salvar}>Salvar conta</button>
          </div>
        </div>
      )}

      {contas.length === 0 && <p className="muted">Nenhuma conta cadastrada.</p>}

      {contas.map((conta) => (
        <article className="accountCard" key={conta.id}>
          <div>
            <strong>{conta.descricao}</strong>
            <p>{conta.centro}</p>
            <small>Vencimento: {dateBR(conta.vencimento)}</small>
          </div>
          <b>{money(conta.valor)}</b>
          <span className={`status ${conta.status === "Pago" ? "pago" : "aberto"}`}>{conta.status}</span>
          <button onClick={() => onTogglePaid(conta)}>Pago/Aberto</button>
          <button className="danger" onClick={() => onDelete(conta)}>Excluir</button>
        </article>
      ))}
    </section>
  );
}
