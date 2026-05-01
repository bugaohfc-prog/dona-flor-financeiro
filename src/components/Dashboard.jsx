import { money, todayISO } from "../utils/format";

export default function Dashboard({ contas, notas }) {
  const hoje = todayISO();

  const abertas = contas.filter((c) => c.status !== "Pago");
  const pagas = contas.filter((c) => c.status === "Pago");
  const vencidas = abertas.filter((c) => String(c.vencimento).slice(0, 10) < hoje);
  const venceHoje = abertas.filter((c) => String(c.vencimento).slice(0, 10) === hoje);
  const lembretesHoje = notas.filter((n) => String(n.data_lembrete).slice(0, 10) === hoje);

  const soma = (arr) => arr.reduce((s, c) => s + Number(c.valor || 0), 0);

  return (
    <>
      <section className="alertCard">
        <strong>⚠️ Atenção financeira</strong>
        <div className="miniGrid">
          <span>Vencidas: {vencidas.length}</span>
          <span>Hoje: {venceHoje.length}</span>
          <span>Lembretes: {lembretesHoje.length}</span>
        </div>
      </section>

      <section className="metrics">
        <div><span>Total aberto</span><strong>{money(soma(abertas))}</strong></div>
        <div><span>Pago</span><strong>{money(soma(pagas))}</strong></div>
        <div><span>Vencidas</span><strong>{money(soma(vencidas))}</strong></div>
        <div><span>Vence hoje</span><strong>{money(soma(venceHoje))}</strong></div>
        <div><span>Lembretes hoje</span><strong>{lembretesHoje.length}</strong></div>
        <div><span>Quantidade</span><strong>{contas.length}</strong></div>
      </section>
    </>
  );
}
