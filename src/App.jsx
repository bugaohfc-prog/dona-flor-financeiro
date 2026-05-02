import { useEffect, useMemo, useState } from "react";
import { supabase, hasSupabaseKey } from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Contas from "./components/Contas";
import Notas from "./components/Notas";
import Relatorios from "./components/Relatorios";
import Grafico from "./components/Grafico";

const CENTROS_PADRAO = ["Loja 1", "Loja 2", "Loja 3", "Loja 4", "Loja 5"];

function parseValor(valor) {
  if (typeof valor === "number") return valor;
  return Number(String(valor || "0").replace(/\./g, "").replace(",", "."));
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("df_user_v27") || "null");
    } catch {
      return null;
    }
  });
  const [contas, setContas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ centro: "", status: "" });

  const centros = useMemo(() => {
    const doBanco = contas.map((c) => c.centro).filter(Boolean);
    return Array.from(new Set([...CENTROS_PADRAO, ...doBanco]));
  }, [contas]);

  async function carregarDados() {
    if (!hasSupabaseKey()) return;
    setLoading(true);
    setErro("");

    const [contasRes, notasRes] = await Promise.all([
      supabase.from("df_contas").select("*").order("vencimento", { ascending: true }),
      supabase.from("df_notas").select("*").order("data_lembrete", { ascending: true }),
    ]);

    if (contasRes.error) setErro(contasRes.error.message);
    else setContas(contasRes.data || []);

    if (notasRes.error) setErro(notasRes.error.message);
    else setNotas(notasRes.data || []);

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
      valor: parseValor(form.valor),
      status: form.status || "Aberto",
    };

    const { error } = await supabase.from("df_contas").insert(payload);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function alternarPago(conta) {
    const novoStatus = conta.status === "Pago" ? "Aberto" : "Pago";
    const { error } = await supabase.from("df_contas").update({ status: novoStatus }).eq("id", conta.id);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function excluirConta(conta) {
    if (!confirm(`Excluir a conta "${conta.descricao}"?`)) return;
    const { error } = await supabase.from("df_contas").delete().eq("id", conta.id);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function salvarNota(form) {
    const { error } = await supabase.from("df_notas").insert(form);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function atualizarPrioridade(nota, prioridade) {
    const { error } = await supabase.from("df_notas").update({ prioridade }).eq("id", nota.id);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function excluirNota(nota) {
    if (!confirm(`Excluir a nota "${nota.titulo}"?`)) return;
    const { error } = await supabase.from("df_notas").delete().eq("id", nota.id);
    if (error) return alert(error.message);
    carregarDados();
  }

  if (!user) return <Login onLogin={setUser} />;

  const contasFiltradas = contas.filter((c) => {
    const centroOk = filtros.centro ? c.centro === filtros.centro : true;
    const statusOk = filtros.status ? c.status === filtros.status : true;
    return centroOk && statusOk;
  });

  return (
    <>
      <header className="topbar">
        <div>
          <div>
            <strong>Rede Dona Flor</strong>
            <span>Gestão Financeira</span>
          </div>
          <button onClick={sair}>Sair</button>
        </div>
      </header>

      <main className="container">
        {erro && <div className="alert">{erro}</div>}
        {loading && <p className="muted">Carregando dados...</p>}

        <Dashboard contas={contas} notas={notas} />

        <section className="card">
          <h2>Resumo visual</h2>
          <Grafico contas={contas} />
        </section>

        <Contas
          contas={contasFiltradas}
          centros={centros}
          filtros={filtros}
          setFiltros={setFiltros}
          onSave={salvarConta}
          onTogglePaid={alternarPago}
          onDelete={excluirConta}
        />

        <Notas
          notas={notas}
          centros={centros}
          onSave={salvarNota}
          onPriority={atualizarPrioridade}
          onDelete={excluirNota}
        />

        <Relatorios contas={contas} />
      </main>
    </>
  );
}
