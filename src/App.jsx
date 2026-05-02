import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://SEU_PROJECT_URL.supabase.co",
  "SUA_PUBLIC_ANON_KEY"
);

export default function App() {
  const [contas, setContas] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [editingConta, setEditingConta] = useState(null);

  useEffect(() => {
    fetchContas();
  }, []);

  async function fetchContas() {
    const { data } = await supabase
      .from("df_contas")
      .select("*")
      .order("data_vencimento", { ascending: true });

    setContas(data || []);
  }

  function limparFormulario() {
    setDescricao("");
    setValor("");
    setDataVencimento("");
    setEditingConta(null);
  }

  async function salvarConta(e) {
    e.preventDefault();

    if (!descricao || !valor || !dataVencimento) return;

    if (editingConta) {
      await supabase
        .from("df_contas")
        .update({
          descricao,
          valor: parseFloat(valor),
          data_vencimento: dataVencimento,
        })
        .eq("id", editingConta.id);
    } else {
      await supabase.from("df_contas").insert([
        {
          descricao,
          valor: parseFloat(valor),
          data_vencimento: dataVencimento,
          status: "pendente",
        },
      ]);
    }

    limparFormulario();
    fetchContas();
  }

  function editarConta(conta) {
    setEditingConta(conta);
    setDescricao(conta.descricao || "");
    setValor(String(conta.valor || ""));
    setDataVencimento(conta.data_vencimento || "");
  }

  async function excluirConta(id) {
    await supabase.from("df_contas").delete().eq("id", id);
    fetchContas();
  }

  async function marcarComoPago(conta) {
    await supabase
      .from("df_contas")
      .update({
        status: conta.status === "pago" ? "pendente" : "pago",
      })
      .eq("id", conta.id);

    fetchContas();
  }

  function filtrarContas() {
    let lista = [...contas];
    const hoje = new Date();

    lista = lista.map((c) => ({
      ...c,
      vencida:
        c.status === "pendente" &&
        new Date(c.data_vencimento) < hoje,
    }));

    if (filtro === "pendentes") {
      lista = lista.filter((c) => c.status === "pendente" && !c.vencida);
    }

    if (filtro === "pagas") {
      lista = lista.filter((c) => c.status === "pago");
    }

    if (filtro === "vencidas") {
      lista = lista.filter((c) => c.vencida);
    }

    if (busca) {
      lista = lista.filter((c) =>
        c.descricao.toLowerCase().includes(busca.toLowerCase())
      );
    }

    lista.sort((a, b) => {
      if (a.vencida && !b.vencida) return -1;
      if (!a.vencida && b.vencida) return 1;
      if (a.status === "pendente" && b.status === "pago") return -1;
      if (a.status === "pago" && b.status === "pendente") return 1;
      return new Date(a.data_vencimento) - new Date(b.data_vencimento);
    });

    return lista;
  }

  function resumo() {
    let total = 0,
      pago = 0,
      pendente = 0,
      vencido = 0;

    const hoje = new Date();

    contas.forEach((c) => {
      const v = Number(c.valor);
      total += v;

      if (c.status === "pago") {
        pago += v;
      } else {
        if (new Date(c.data_vencimento) < hoje) {
          vencido += v;
        } else {
          pendente += v;
        }
      }
    });

    return { total, pago, pendente, vencido };
  }

  const dados = filtrarContas();
  const r = resumo();

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>Contas a Pagar</h2>

      <form onSubmit={salvarConta} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <input
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
        />

        <button type="submit">
          {editingConta ? "Salvar alteração" : "Adicionar"}
        </button>

        {editingConta && (
          <button type="button" onClick={limparFormulario}>
            Cancelar edição
          </button>
        )}
      </form>

      <hr />

      <input
        placeholder="Buscar..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setFiltro("todas")}>Todas</button>
        <button onClick={() => setFiltro("pendentes")}>Pendentes</button>
        <button onClick={() => setFiltro("pagas")}>Pagas</button>
        <button onClick={() => setFiltro("vencidas")}>Vencidas</button>
      </div>

      <h3>Resumo</h3>
      <p>Total: {r.total.toFixed(2)}</p>
      <p>Pago: {r.pago.toFixed(2)}</p>
      <p>Pendente: {r.pendente.toFixed(2)}</p>
      <p>Vencido: {r.vencido.toFixed(2)}</p>

      <hr />

      {dados.map((c) => (
        <div
          key={c.id}
          style={{
            marginBottom: 10,
            padding: 10,
            border: "1px solid #ccc",
            background:
              c.status === "pago"
                ? "#d4edda"
                : c.vencida
                ? "#f8d7da"
                : "#fff3cd",
          }}
        >
          <p>{c.descricao}</p>
          <p>R$ {Number(c.valor).toFixed(2)}</p>
          <p>{c.data_vencimento}</p>
          <p>{c.status}</p>

          <button onClick={() => marcarComoPago(c)}>
            {c.status === "pago" ? "Desmarcar" : "Pagar"}
          </button>

          <button onClick={() => editarConta(c)}>
            Editar
          </button>

          <button onClick={() => excluirConta(c.id)}>
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}
