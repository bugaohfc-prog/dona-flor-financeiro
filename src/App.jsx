import { useEffect, useMemo, useState } from "react";
import { supabase, hasSupabaseKey } from "./lib/supabase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Grafico from "./components/Grafico";
import Notas from "./components/Notas";
import Contas from "./components/Contas";
import Relatorios from "./components/Relatorios";
import { money, todayISO } from "./utils/format";

const CENTROS = [
  "Dona Flor Andradina",
  "Dona Flor Paranaíba",
  "Dona Flor Três Lagoas",
  "Brilho Dourado",
  "Pessoal",
];

const USER_STORAGE_KEY = "df_user_v27";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [contas, setContas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ centro: "", status: "" });
  const [periodo, setPeriodo] = useState({ inicio: "", fim: "" });

  useEffect(() => {
    const userSalvo = localStorage.getItem(USER_STORAGE_KEY);

    if (userSalvo) {
      try {
        setUsuario(JSON.parse(userSalvo));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUsuario(null);
      }
    }
  }, []);

  const isAdmin = String(usuario?.tipo || "").toLowerCase() === "admin";
  const canPay = isAdmin || usuario?.pode_pagar === true;

  async function carregar() {
    if (!hasSupabaseKey()) {
      setErro("Configure VITE_SUPABASE_ANON_KEY no Vercel.");
      return;
    }

    setLoading(true);
    setErro("");

    const [contasRes, notasRes] = await Promise.all([
      supabase.from("df_contas").select("*").order("vencimento"),
      supabase.from("df_notas").select("*").order("data_lembrete"),
    ]);

    if (contasRes.error) {
      setErro(contasRes.error.message);
    }

    if (notasRes.error) {
      setErro(notasRes.error.message);
    }

    setContas((contasRes.data || []).filter((c) => c.deletado !== true));
    setNotas((notasRes.data || []).filter((n) => n.deletado !== true));

    setLoading(false);
  }

  useEffect(() => {
    if (usuario) {
      carregar();
    }
  }, [usuario]);

  function entrar(user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setUsuario(user);
  }

  async function sair() {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUsuario(null);
  }

  const contasVisiveis = useMemo(() => {
    return contas.filter((c) => {
      if (c.user_id !== usuario?.id) return false;
      if (filtros.centro && c.centro !== filtros.centro) return false;
      if (filtros.status && c.status !== filtros.status) return false;
      if (periodo.inicio && c.vencimento < periodo.inicio) return false;
      if (periodo.fim && c.vencimento > periodo.fim) return false;

      return true;
    });
  }, [contas, filtros, periodo, usuario]);

  const notasVisiveis = useMemo(() => {
    return notas.filter((n) => n.user_id === usuario?.id);
  }, [notas, usuario]);

  const totalPagoPeriodo = contasVisiveis
    .filter((c) => c.status === "Pago")
    .reduce((s, c) => s + Number(c.valor || 0), 0);

  const totalAbertoPeriodo = contasVisiveis
    .filter((c) => c.status !== "Pago")
    .reduce((s, c) => s + Number(c.valor || 0), 0);

  async function salvarConta(form) {
    const payload = {
      descricao: form.descricao,
      valor: Number(String(form.valor).replace(",", ".")),
      vencimento: form.vencimento || todayISO(),
      centro: form.centro,
      status: form.status,
      observacao: form.observacao,
      user_id: usuario?.id,
    };

    const { error } = await supabase.from("df_contas").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  async function alternarPago(conta) {
    if (!canPay) {
      alert("Usuário sem permissão para marcar pagamento.");
      return;
    }

    const novoStatus = conta.status === "Pago" ? "Aberto" : "Pago";

    const { error } = await supabase
      .from("df_contas")
      .update({ status: novoStatus })
      .eq("id", conta.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  async function excluirConta(conta) {
    if (!confirm("Mover esta conta para a lixeira?")) return;

    const { error } = await supabase
      .from("df_contas")
      .update({
        deletado: true,
        data_exclusao: new Date().toISOString(),
      })
      .eq("id", conta.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  async function salvarNota(form) {
    const payload = {
      titulo: form.titulo || "Sem título",
      texto: form.texto || "",
      data_lembrete: form.data_lembrete || null,
      prioridade: form.prioridade || "Normal",
      loja: form.loja || null,
      user_id: usuario?.id,
    };

    const { error } = await supabase.from("df_notas").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  async function excluirNota(nota) {
    if (!confirm("Mover esta nota para a lixeira?")) return;

    const { error } = await supabase
      .from("df_notas")
      .update({
        deletado: true,
        data_exclusao: new Date().toISOString(),
      })
      .eq("id", nota.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  async function alterarPrioridadeNota(nota, prioridade) {
    const { error } = await supabase
      .from("df_notas")
      .update({ prioridade })
      .eq("id", nota.id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  if (!usuario) {
    return <Login onLogin={entrar} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Dona Flor Gestão Financeira</strong>
          <span>Olá, {usuario?.nome || usuario?.usuario || usuario?.email}</span>
        </div>

        <button onClick={sair}>Sair</button>
      </header>

      <main className="container">
        {erro && <div className="alert">{erro}</div>}
        {loading && <div className="muted">Carregando...</div>}

        <section className="card">
          <h2>Filtro por período</h2>

          <input
            type="date"
            value={periodo.inicio}
            onChange={(e) =>
              setPeriodo({ ...periodo, inicio: e.target.value })
            }
          />

          <input
            type="date"
            value={periodo.fim}
            onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
          />

          <button onClick={() => setPeriodo({ inicio: "", fim: "" })}>
            Limpar período
          </button>
        </section>

        <Dashboard contas={contasVisiveis} notas={notasVisiveis} />

        <Grafico contas={contasVisiveis} />

        <section className="card">
          <h2>Resumo do período</h2>
          <p>💰 Pago: {money(totalPagoPeriodo)}</p>
          <p>📉 Aberto: {money(totalAbertoPeriodo)}</p>
        </section>

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
