import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Grafico({ contas }) {
  const totalPago = contas
    .filter(c => c.status === "Pago")
    .reduce((s, c) => s + Number(c.valor || 0), 0);

  const totalAberto = contas
    .filter(c => c.status !== "Pago")
    .reduce((s, c) => s + Number(c.valor || 0), 0);

  const data = [
    { name: "Pago", value: totalPago },
    { name: "Aberto", value: totalAberto },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <PieChart width={300} height={250}>
      <Pie data={data} dataKey="value">
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
