import { dateBR } from "./format";

export function exportAccountsCSV(contas) {
  const rows = [
    ["Descrição", "Valor", "Vencimento", "Centro", "Status", "Observação"],
    ...contas.map((c) => [
      c.descricao || "",
      Number(c.valor || 0).toFixed(2).replace(".", ","),
      dateBR(c.vencimento),
      c.centro || "",
      c.status || "",
      c.observacao || "",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio-dona-flor.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
