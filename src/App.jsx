import { useEffect, useMemo, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Contas from "./components/Contas";
import Notas from "./components/Notas";
import Relatorios from "./components/Relatorios";
import { supabase, hasSupabaseKey } from "./lib/supabase";
import "./styles.css";

const CENTROS = [
  "Loja 01",
  "Loja 02",
  "Loja 03",
  "Loja 04",
  "Loja 05",
];

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("df_user_v27"));
    } catch {
      return null;
    }
  });

  const [contas, setContas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [filtros, setFiltros] = useState({ centro: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    if (!hasSupabaseKey()) {
      setErro("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.");
      return;
    }

    setLoading(true);
    setErro("");

    const [contasResp, notasResp] = await Promise.all([
      supabase.from("df_contas").select("*").order("vencimento", { ascending: true }),
      supabase.from("df_notas").select("*").order("data_lembrete", { ascending: true }),
    ]);

    if (contasResp.error) setErro(contasResp.error.message);
    if (notasResp.error) setErro(notasResp.error.message);

    setContas(contasResp.data || []);
    setNotas(notasResp.data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  function sair() {
    localStorage.removeItem("df_user_v27");
    setUser(null);
  }

  async function salvarConta(form) {
    const payload = {
      ...form,
      valor: Number(String(form.valor).replace(".", "").replace(",", ".")) || 0,
    };

    const { error } = await supabase.from("df_contas").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function alternarPago(conta) {
    const novoStatus = conta.status === "Pago" ? "Aberto" : "Pago";

    const { error } = await supabase
      .from("df_contas")
      .update({ status: novoStatus })
      .eq("id", conta.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function excluirConta(conta) {
    if (!confirm(`Excluir a conta "${conta.descricao}"?`)) return;

    const { error } = await supabase.from("df_contas").delete().eq("id", conta.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function salvarNota(form) {
    const { error } = await supabase.from("df_notas").insert(form);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function alterarPrioridade(nota, prioridade) {
    const { error } = await supabase
      .from("df_notas")
      .update({ prioridade })
      .eq("id", nota.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  async function excluirNota(nota) {
    if (!confirm(`Excluir a nota "${nota.titulo}"?`)) return;

    const { error } = await supabase.from("df_notas").delete().eq("id", nota.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarDados();
  }

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      if (filtros.centro && conta.centro !== filtros.centro) return false;
      if (filtros.status && conta.status !== filtros.status) return false;
      return true;
    });
  }, [contas, filtros]);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <>
      <header className="topbar">
        <div>
          <strong>Rede Dona Flor</strong>
          <span>{user.nome || user.usuario}</span>
          <button onClick={sair}>Sair</button>
        </div>
      </header>

      <main className="container">
        {erro && <div className="alert">{erro}</div>}
        {loading && <p className="muted">Carregando dados...</p>}

        <Dashboard contas={contas} notas={notas} />

        <Contas
          contas={contasFiltradas}
          centros={CENTROS}
          filtros={filtros}
          setFiltros={setFiltros}
          onSave={salvarConta}
          onTogglePaid={alternarPago}
          onDelete={excluirConta}
        />

        <Notas
          notas={notas}
          centros={CENTROS}
          onSave={salvarNota}
          onPriority={alterarPrioridade}
          onDelete={excluirNota}
        />

        <Relatorios contas={contasFiltradas} />
      </main>
    </>
  );
}
