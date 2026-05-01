// app.js
import { useEffect, useState } from "react";

function useAutoSync(callback) {
  useEffect(() => {
    callback();
    const interval = setInterval(callback, 30000);
    return () => clearInterval(interval);
  }, []);
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={styles.card}>
      <div style={styles.header} onClick={() => setOpen(!open)}>
        <strong>{title}</strong>
        <span>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setOpen(!open)}>☰ Menu</button>

      {open && (
        <div style={styles.menu}>
          <p><strong>Painel</strong></p>
          <p>• Contas a pagar</p>
          <p>• Lançamento de contas</p>
          <p>• Bloco de notas</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [contas, setContas] = useState([]);
  const [notas, setNotas] = useState([]);

  async function loadContas() {
    const res = await fetch("/api/contas");
    const data = await res.json();
    setContas(data || []);
  }

  async function loadNotas() {
    const res = await fetch("/api/notas");
    const data = await res.json();
    setNotas(data || []);
  }

  useAutoSync(() => {
    loadContas();
    loadNotas();
  });

  const hoje = new Date().toISOString().slice(0, 10);

  const contasHoje = contas.filter(
    (c) => c.vencimento === hoje && c.status === "Aberto"
  );

  return (
    <div style={styles.container}>
      <Menu />
      <h2>Olá, Hindeburg</h2>

      <Section title="📅 Contas de hoje">
        {contasHoje.map((c) => (
          <div key={c.id} style={styles.item}>
            <strong>{c.descricao || "Sem nome"}</strong>
            <p>{c.centro_custo || "-"}</p>
            <p>{c.vencimento}</p>
            <p>R$ {c.valor}</p>
          </div>
        ))}
      </Section>

      <Section title="📝 Bloco de notas">
        {notas.map((n) => (
          <div key={n.id} style={styles.item}>
            <strong>{n.titulo}</strong>
            <p>{n.texto}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}

const styles = {
  container: { padding: 15, fontFamily: "Arial" },
  card: { background: "#f4f4f4", padding: 12, borderRadius: 12, marginBottom: 10 },
  header: { display: "flex", justifyContent: "space-between", cursor: "pointer" },
  item: { background: "#fff", padding: 10, marginTop: 8, borderRadius: 8 },
  menu: { background: "#fff", padding: 10, borderRadius: 10, marginTop: 5 },
};
