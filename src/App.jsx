import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vyhjjtzdvofoqoericak.supabase.co",
  "sb_publishable_lC1mtt21iCdk-e6Kdf-3nw_5pdCPIcw"
);

export default function App() {
  const [contas, setContas] = useState([]);
  const [centros, setCentros] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data_vencimento: "",
    centro_custo_id: ""
  });

  useEffect(() => {
    carregarContas();
    carregarCentros();
  }, []);

  async function carregarCentros() {
    const { data } = await supabase
      .from("df_centros_custo")
      .select("*")
      .order("nome");
    setCentros(data || []);
  }

  async function carregarContas() {
    const { data } = await supabase
      .from("df_contas")
      .select("*, df_centros_custo(nome)")
      .order("data_vencimento", { ascending: true });

    setContas(data || []);
  }

  function abrirModal(conta = null) {
    if (conta) {
      setEditando(conta);
      setForm({
        descricao: conta.descricao,
        valor: conta.valor,
        data_vencimento: conta.data_vencimento,
        centro_custo_id: conta.centro_custo_id || ""
      });
    } else {
      setEditando(null);
      setForm({
        descricao: "",
        valor: "",
        data_vencimento: "",
        centro_custo_id: ""
      });
    }

    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
  }

  async function salvarConta() {
    if (!form.descricao || !form.valor) return;

    const payload = {
      ...form,
      descricao:
        form.descricao.charAt(0).toLowerCase() + form.descricao.slice(1)
    };

    if (editando) {
      await supabase.from("df_contas").update(payload).eq("id", editando.id);
    } else {
      await supabase.from("df_contas").insert(payload);
    }

    fecharModal();
    carregarContas();
  }

  async function marcarPago(conta) {
    await supabase
      .from("df_contas")
      .update({ status: "pago" })
      .eq("id", conta.id);

    carregarContas();
  }

  async function voltarPendente(conta) {
    await supabase
      .from("df_contas")
      .update({ status: "pendente" })
      .eq("id", conta.id);

    carregarContas();
  }

  async function excluirConta(id) {
    await supabase.from("df_contas").delete().eq("id", id);
    carregarContas();
  }

  function isVencido(conta) {
    if (conta.status === "pago") return false;
    if (!conta.data_vencimento) return false;
    return new Date(conta.data_vencimento) < new Date();
  }

  const contasFiltradas = contas.filter((c) => {
    const matchBusca = c.descricao
      .toLowerCase()
      .includes(busca.toLowerCase());

    if (!matchBusca) return false;

    if (filtro === "pendentes") return c.status !== "pago" && !isVencido(c);
    if (filtro === "pagas") return c.status === "pago";
    if (filtro === "vencidas") return isVencido(c);

    return true;
  });

  function formatar(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  const total = contas.reduce((acc, c) => acc + Number(c.valor), 0);
  const pago = contas
    .filter((c) => c.status === "pago")
    .reduce((acc, c) => acc + Number(c.valor), 0);
  const pendente = total - pago;
  const vencido = contas
    .filter((c) => isVencido(c))
    .reduce((acc, c) => acc + Number(c.valor), 0);

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Contas a Pagar</h1>

      {/* RESUMO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>Total: {formatar(total)}</div>
        <div>Pago: {formatar(pago)}</div>
        <div>Pendente: {formatar(pendente)}</div>
        <div>Vencido: {formatar(vencido)}</div>
      </div>

      {/* BUSCA */}
      <input
        placeholder="Buscar..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: "100%", marginTop: 10 }}
      />

      {/* FILTROS */}
      <div style={{ marginTop: 10 }}>
        {["todas", "pendentes", "pagas", "vencidas"].map((f) => (
          <button key={f} onClick={() => setFiltro(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {contasFiltradas.map((c) => (
        <div
          key={c.id}
          style={{
            background:
              c.status === "pago"
                ? "#c8e6c9"
                : isVencido(c)
                ? "#ff5252"
                : "#ffcdd2",
            padding: 15,
            marginTop: 10,
            borderRadius: 10
          }}
        >
          <h3>
            {c.descricao} — {formatar(c.valor)}
          </h3>

          <p>Vencimento: {c.data_vencimento || "-"}</p>
          <p>Status: {isVencido(c) ? "vencido" : c.status}</p>
          <p>Centro: {c.df_centros_custo?.nome || "-"}</p>

          {c.status !== "pago" && (
            <button onClick={() => marcarPago(c)}>
              Marcar como pago
            </button>
          )}

          {c.status === "pago" && (
            <button onClick={() => voltarPendente(c)}>
              Voltar para pendente
            </button>
          )}

          <button onClick={() => abrirModal(c)}>Editar</button>
          <button onClick={() => excluirConta(c.id)}>Excluir</button>
        </div>
      ))}

      {/* BOTÃO + */}
      <button
        onClick={() => abrirModal()}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          fontSize: 30
        }}
      >
        +
      </button>

      {/* MODAL */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#00000088"
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              margin: "100px auto",
              width: "90%",
              borderRadius: 10
            }}
          >
            <h2>{editando ? "Editar Conta" : "Nova Conta"}</h2>

            <input
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) =>
                setForm({ ...form, descricao: e.target.value })
              }
            />

            <input
              placeholder="Valor"
              value={form.valor}
              onChange={(e) =>
                setForm({ ...form, valor: e.target.value })
              }
            />

            <input
              type="date"
              value={form.data_vencimento}
              onChange={(e) =>
                setForm({
                  ...form,
                  data_vencimento: e.target.value
                })
              }
            />

            <select
              value={form.centro_custo_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  centro_custo_id: e.target.value
                })
              }
            >
              <option value="">Centro de custo</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <button onClick={salvarConta}>
              {editando ? "Salvar Alteração" : "Salvar"}
            </button>

            <button onClick={fecharModal}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
