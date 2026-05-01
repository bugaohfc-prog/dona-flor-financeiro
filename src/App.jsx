import { useEffect, useMemo, useState } from "react";
import { supabase, hasSupabaseKey } from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Notas from "./components/Notas";
import Contas from "./components/Contas";
import Relatorios from "./components/Relatorios";
import { todayISO } from "./utils/format";

const CENTROS = [
  "Dona Flor Andradina",
  "Dona Flor Paranaíba",
  "Dona Flor Três Lagoas",
  "Brilho Dourado",
  "Pessoal",
];

export default function App() {
  const [usuario, setUsuario] = useState(() => {
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

  const isAdmin = String(usuario?.tipo || "").toLowerCase() === "admin";
  const canPay = isAdmin || usuario?.pode_pagar === true;

  async function carregar() {
    if (!hasSupabaseKey()) {
      setErro("Configure VITE_SUPABASE_ANON_KEY no Vercel para conectar ao Supabase.");
      return;
    }

    setLoading(true);
    setErro("");

    const [contasRes, notasRes] = await Promise.all([
      supabase.from("df_contas").select("*").order("vencimento", { ascending: true }),
      supabase.from("df_notas").select("*").order("data_lembrete", { ascending: true }),
    ]);

    if (contasRes.error) setErro(contasRes.error.message);
    if (notasRes.error) setErro(notasRes.error.message);

    setContas((contasRes.data || []).filter((c) => !c.deletado));
    setNotas((notasRes.data || []).filter((n) => !n.deletado));
    setLoading(false);
  }

  useEffect(() => {
    if (usuario) carregar();
  }, [usuario]);

  function sair() {
    localStorage.removeItem("df_user_v27");
    setUsuario(null);
  }

  const contasVisiveis = useMemo(() => {
    const base = isAdmin ? contas : contas.filter((c) => c.centro === usuario?.loja);
    return base.filter((c) => {
      if (filtros.centro && c.centro !== filtros.centro) return false;
      if (filtros.status && c.status !== filtros.status) return false;
      return true;
    });
  }, [contas, filtros, isAdmin, usuario]);

  const notasVisiveis = useMemo(() => {
    return isAdmin ? notas : notas.filter((n) => !n.loja || n.loja === usuario?.loja);
  }, [notas, isAdmin, usuario]);

  async function salvarConta(form) {
    const payload = {
      descricao: form.descricao,
      valor: Number(String(form.valor).replace(",", ".")),
      vencimento: form.vencimento || todayISO(),
      centro: form.centro,
      status: form.status,
      observacao: form.observacao,
      criado_por: usuario?.usuario,
    };

    const { error } = await supabase.from("df_contas").insert(payload);
    if (error) return alert(error.message);
    carregar();
  }

  async function alternarPago(conta) {
    if (!canPay) return alert("Usuário sem permissão para marcar pagamento.");
    const novoStatus = conta.status === "Pago" ? "Aberto" : "Pago";
    const { error } = await supabase.from("df_contas").update({ status: novoStatus }).eq("id", conta.id);
    if (error) return alert(error.message);
    carregar();
  }

  async function excluirConta(conta) {
    if (!isAdmin) return alert("Apenas administrador pode excluir.");
    if (!confirm("Mover esta conta para a lixeira?")) return;
    const { error } = await supabase
      .from("df_contas")
      .update({ deletado: true, data_exclusao: new Date().toISOString() })
      .eq("id", conta.id);
    if (error) return alert(error.message);
    carregar();
  }

  async function salvarNota(form) {
    const payload = {
      titulo: form.titulo || "Sem título",
      texto: form.texto || "",
      data_lembrete: form.data_lembrete || null,
      prioridade: form.prioridade || "Normal",
      loja: form.loja || null,
      criado_por: usuario?.usuario,
    };

    const { error } = await supabase.from("df_notas").insert(payload);
    if (error) return alert(error.message);
    carregar();
  }

  async function alterarPrioridadeNota(nota, prioridade) {
    const { error } = await supabase.from("df_notas").update({ prioridade }).eq("id", nota.id);
    if (error) return alert(error.message);
    carregar();
  }

  async function excluirNota(nota) {
    if (!confirm("Mover esta nota para a lixeira?")) return;
    const { error } = await supabase
      .from("df_notas")
      .update({ deletado: true, data_exclusao: new Date().toISOString() })
      .eq("id", nota.id);
    if (error) return alert(error.message);
    carregar();
  }

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Dona Flor Gestão Financeira</strong>
          <span>Olá, {usuario?.nome || usuario?.usuario}</span>
        </div>
        <button onClick={sair}>Sair</button>
      </header>

      <main className="container">
        {erro && <div className="alert">{erro}</div>}
        {loading && <div className="muted">Carregando...</div>}

        <Dashboard contas={contasVisiveis} notas={notasVisiveis} />

        <Notas
          notas={notasVisiveis}
          centros={CENTROS}
          onSave={salvarNota}
          onPriority={alterarPrioridadeNota}
          onDelete={excluirNota}
        />

        <Contas
          contas={contasVisiveis}
          centros={CENTROS}
          filtros={filtros}
          setFiltros={setFiltros}
          onSave={salvarConta}
          onTogglePaid={alternarPago}
          onDelete={excluirConta}
        />

        <Relatorios contas={contasVisiveis} />
      </main>
    </div>
  );
}
