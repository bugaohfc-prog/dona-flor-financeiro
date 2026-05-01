import { useState } from "react";
import { normalize } from "../utils/format";

function prioridadeClass(p) {
  const n = normalize(p);
  if (n === "critico") return "critico";
  if (n === "urgente") return "urgente";
  return "normal";
}

export default function Notas({ notas, centros, onSave, onPriority, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", texto: "", data_lembrete: "", prioridade: "Normal", loja: "" });

  function salvar() {
    onSave(form);
    setForm({ titulo: "", texto: "", data_lembrete: "", prioridade: "Normal", loja: "" });
    setOpen(false);
  }

  return (
    <section className="card">
      <div className="sectionHeader">
        <h2>Bloco de notas</h2>
        <button className="plus" onClick={() => setOpen(true)}>+</button>
      </div>

      {open && (
        <div className="modalOverlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setOpen(false)}>×</button>
            <h2>Lançamento de notas</h2>
            <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <textarea placeholder="Recado" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} />
            <input type="date" value={form.data_lembrete} onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })} />
            <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
              <option>Normal</option>
              <option>Urgente</option>
              <option>Crítico</option>
            </select>
            <select value={form.loja} onChange={(e) => setForm({ ...form, loja: e.target.value })}>
              <option value="">Todas as lojas</option>
              {centros.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={salvar}>Salvar nota</button>
          </div>
        </div>
      )}

      {notas.length === 0 && <p className="muted">Nenhum lembrete.</p>}

      {notas.map((nota) => (
        <article className="noteCard" key={nota.id}>
          <div className="noteTop">
            <div>
              <strong>{nota.titulo}</strong>
              <p>{nota.texto}</p>
              <small>{nota.data_lembrete || "Sem data"}</small>
            </div>
            <span className={`badge ${prioridadeClass(nota.prioridade)}`}>{nota.prioridade || "Normal"}</span>
          </div>

          <select className="prioritySelect" value={nota.prioridade || "Normal"} onChange={(e) => onPriority(nota, e.target.value)}>
            <option>Normal</option>
            <option>Urgente</option>
            <option>Crítico</option>
          </select>

          <button className="danger" onClick={() => onDelete(nota)}>Excluir</button>
        </article>
      ))}
    </section>
  );
}
