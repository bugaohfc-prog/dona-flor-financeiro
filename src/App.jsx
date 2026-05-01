import Grafico from "./components/Grafico";
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
  const [usuario, setUsuario] = useState(null);
  const [contas, setContas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState({ centro: "", status: "" });

  // 🔐 AUTENTICAÇÃO REAL
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUsuario({
          id: data.user.id,
          email: data.user.email,
          nome: data.user.email,
          usuario: data.user.email,
          tipo: "admin",
          pode_pagar: true,
        });
      }
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUsuario({
            id: session.user.id,
            email: session.user.email,
            nome: session.user.email,
            usuario: session.user.email,
            tipo: "admin",
            pode_pagar: true,
          });
        } else {
          setUsuario(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = String(usuario?.tipo || "").toLowerCase() === "admin";
  const canPay = isAdmin || usuario?.pode_pagar === true;

  // 🔄 CARREGAR DADOS
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

    if (contasRes.error) setErro(contasRes.error.message);
    if (notasRes.error) setErro(notasRes.error.message);

    setContas((contasRes.data || []).filter((c) => !c.deletado));
    setNotas((notasRes.data || []).filter((n) => !n.deletado));

    setLoading(false);
  }

  useEffect(() => {
    if (usuario) carregar();
  }, [usuario]);

  // 🚪 LOGOUT
  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  // 📊 FILTROS
  const contasVisiveis = useMemo(() => {
    return contas.filter((c) => {
      if (c.user_id !== usuario?.id) return false;
      if (filtros.centro && c.centro !== filtros.centro) return false;
      if (filtros.status && c.status !== filtros.status) return false;
      return true;
    });
  }, [contas, filtros, usuario]);

  const notasVisiveis = useMemo(() => {
    return notas.filter((n) => n.user_id === usuario?.id);
  }, [notas, usuario]);

  // 💾 SALVAR CONTA
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
    if (error) return alert(error.message);
    carregar();
  }

  // 💾 SALVAR NOTA
  async function salvarNota(form) {
    const payload = {
      titulo: form.titulo,
      texto: form.texto,
      data_lembrete: form.data_lembrete,
      prioridade: form.prioridade,
      loja: form.loja,
      user_id: usuario?.id,
    };

    const { error } = await supabase.from("df_notas").insert(payload);
    if (error) return alert(error.message);
    carregar();
  }

  async function excluirConta(conta) {
    const { error } = await supabase
      .from("df_contas")
      .update({ deletado: true })
      .eq("id", conta.id);

    if (error) return alert(error.message);
    carregar();
  }

  async function excluirNota(nota) {
    const { error } = await supabase
      .from("df_notas")
      .update({ deletado: true })
      .eq("id", nota.id);

    if (error) return alert(error.message);
    carregar();
  }

  async function alterarPrioridadeNota(nota, prioridade) {
    const { error } = await supabase
      .from("df_notas")
      .update({ prioridade })
      .eq("id", nota.id);

    if (error) return alert(error.message);
    carregar();
  }

  // 🔐 SE NÃO LOGADO → LOGIN
  if (!usuario) {
    return <Login />;
  }

  // 🎯 APP PRINCIPAL
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Dona Flor Gestão Financeira</strong>
          <span>Olá, {usuario?.email}</span>
        </div>
        <button onClick={sair}>Sair</button>
      </header>

      <main className="container">
        {erro && <div className="alert">{erro}</div>}
        {loading && <div className="muted">Carregando...</div>}

        <Dashboard contas={contasVisiveis} notas={notasVisiveis} />
        <Grafico contas={contasVisiveis} />

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
          onDelete={excluirConta}
        />

        <Relatorios contas={contasVisiveis} />
      </main>
    </div>
  );
}
