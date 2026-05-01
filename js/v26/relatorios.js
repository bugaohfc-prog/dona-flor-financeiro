(function(){
  const DF = window.DonaFlorV26;
  let contasCache = [];

  function centers(){
    return Array.from(new Set(contasCache.map(c => c.centro || c.centro_custo || c.loja).filter(Boolean))).sort();
  }

  function readFilters(){
    return {
      centro: document.getElementById("df26Centro")?.value || "",
      status: document.getElementById("df26Status")?.value || "",
      inicio: document.getElementById("df26Inicio")?.value || "",
      fim: document.getElementById("df26Fim")?.value || "",
      resumo: document.getElementById("df26Resumo")?.checked !== false,
      centros: document.getElementById("df26Centros")?.checked !== false,
      detalhes: document.getElementById("df26Detalhes")?.checked !== false,
      aberto: document.getElementById("df26Aberto")?.checked || false
    };
  }

  function filterContas(f){
    return contasCache.filter(c => {
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(f.centro && centro !== f.centro) return false;
      if(f.status && status !== f.status) return false;
      if(f.aberto && String(status).toLowerCase() === "pago") return false;
      if(f.inicio && data && data < f.inicio) return false;
      if(f.fim && data && data > f.fim) return false;
      return true;
    });
  }

  function summary(contas){
    const hoje = new Date().toISOString().slice(0,10);
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);

    return {
      qtd: contas.length,
      totalAberto: abertas.reduce((s,c)=>s+Number(c.valor||0),0),
      totalPago: pagas.reduce((s,c)=>s+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((s,c)=>s+Number(c.valor||0),0)
    };
  }

  function byCenter(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd++;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function buildReport(f){
    const contas = filterContas(f);
    const r = summary(contas);
    const centros = byCenter(contas);

    const filterText = [
      f.centro ? "Centro: " + f.centro : "Todos os centros",
      f.status ? "Status: " + f.status : "Todos os status",
      f.inicio ? "De " + DF.dateBR(f.inicio) : "",
      f.fim ? "Até " + DF.dateBR(f.fim) : "",
      f.aberto ? "Somente em aberto" : ""
    ].filter(Boolean).join(" • ");

    const cards = f.resumo ? `
      <div class="cards">
        <div class="card-mini"><div class="label">Quantidade</div><div class="num">${r.qtd}</div></div>
        <div class="card-mini"><div class="label">Total aberto</div><div class="num">${DF.money(r.totalAberto)}</div></div>
        <div class="card-mini"><div class="label">Pago</div><div class="num">${DF.money(r.totalPago)}</div></div>
        <div class="card-mini"><div class="label">Vencidas</div><div class="num">${DF.money(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centersHTML = f.centros ? `
      <h2>Resumo por centro</h2>
      <div class="centros">
        ${centros.length ? centros.map(([centro, info]) => `
          <div class="centro">
            <div><strong>${DF.escape(centro)}</strong><small>${info.qtd} conta(s)</small></div>
            <b>${DF.money(info.total)}</b>
          </div>
        `).join("") : `<div>Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const rows = contas.map(c => {
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${DF.escape(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${DF.escape(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${DF.dateBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="status ${pago ? "pago" : "aberto"}">${DF.escape(status)}</span></td>
          <td class="valor">${DF.money(c.valor)}</td>
          <td>${DF.escape(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const details = f.detalhes ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <table>
          <thead><tr><th>Conta</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      ` : `<div>Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    return `
      <div class="df26-report">
        <h1>Dona Flor Gestão Financeira</h1>
        <div class="sub">Relatório financeiro • ${DF.escape(new Date().toLocaleString("pt-BR"))}</div>
        <div class="sub">${DF.escape(filterText)}</div>
        ${cards}
        ${centersHTML}
        ${details}
      </div>
    `;
  }

  async function openFilters(){
    contasCache = await DF.fetchContas();

    let bg = document.getElementById("df26-filter-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df26-filter-bg";
      bg.className = "df26-modal-bg";
      document.body.appendChild(bg);
      bg.addEventListener("click", function(e){
        if(e.target === bg) bg.classList.remove("open");
      });
    }

    const opts = centers().map(c => `<option value="${DF.escape(c)}">${DF.escape(c)}</option>`).join("");

    bg.innerHTML = `
      <div class="df26-modal-box">
        <div class="df26-actions">
          <button type="button" class="light" id="df26CloseFilter">Fechar</button>
        </div>

        <h1 style="margin:0 0 4px;color:#0f766e">Filtros do relatório</h1>
        <p style="margin:0 0 14px;color:#64748b">Base carregada: ${contasCache.length} conta(s).</p>

        <div class="df26-grid">
          <div class="df26-field"><label>Centro</label><select id="df26Centro"><option value="">Todos</option>${opts}</select></div>
          <div class="df26-field"><label>Status</label><select id="df26Status"><option value="">Todos</option><option>Aberto</option><option>Pago</option></select></div>
          <div class="df26-field"><label>Data inicial</label><input id="df26Inicio" type="date"></div>
          <div class="df26-field"><label>Data final</label><input id="df26Fim" type="date"></div>
        </div>

        <div class="df26-checks">
          <label class="df26-check"><input id="df26Resumo" type="checkbox" checked> Mostrar resumo</label>
          <label class="df26-check"><input id="df26Centros" type="checkbox" checked> Mostrar centros</label>
          <label class="df26-check"><input id="df26Detalhes" type="checkbox" checked> Mostrar detalhes</label>
          <label class="df26-check"><input id="df26Aberto" type="checkbox"> Somente em aberto</label>
        </div>

        <div class="df26-actions" style="justify-content:flex-start!important;margin-top:16px">
          <button type="button" id="df26PDFBtn">Visualizar relatório</button>
          <button type="button" id="df26CSVBtn">Exportar CSV</button>
        </div>
      </div>
    `;

    bg.querySelector("#df26CloseFilter").addEventListener("click", () => bg.classList.remove("open"));
    bg.querySelector("#df26PDFBtn").addEventListener("click", openReport, true);
    bg.querySelector("#df26CSVBtn").addEventListener("click", exportCSV, true);

    bg.classList.add("open");
  }

  function openReport(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    const f = readFilters();

    const filter = document.getElementById("df26-filter-bg");
    if(filter) filter.classList.remove("open");

    let bg = document.getElementById("df26-report-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df26-report-bg";
      bg.className = "df26-modal-bg";
      bg.innerHTML = `
        <div class="df26-modal-box">
          <div class="df26-actions no-print">
            <button type="button" id="df26PrintBtn">Salvar em PDF</button>
            <button type="button" class="light" id="df26CloseReportBtn">Fechar</button>
          </div>
          <div id="df26-report-content"></div>
        </div>
      `;
      document.body.appendChild(bg);

      bg.addEventListener("click", evt => {
        if(evt.target === bg) bg.classList.remove("open");
      });

      bg.querySelector("#df26PrintBtn").addEventListener("click", function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        setTimeout(() => window.print(), 150);
      }, true);

      bg.querySelector("#df26CloseReportBtn").addEventListener("click", () => bg.classList.remove("open"));
    }

    bg.querySelector("#df26-report-content").innerHTML = buildReport(f);
    bg.classList.add("open");
  }

  async function exportCSV(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    const f = readFilters();
    const contas = filterContas(f);

    if(!contas.length){
      alert("Nenhum dado para exportar com esses filtros.");
      return;
    }

    const lines = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        DF.dateBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = lines.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const file = new File([blob], "relatorio-dona-flor.csv", {type:"text/csv"});

    try{
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:"Relatório Dona Flor"});
        return;
      }
    }catch(err){}

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    a.target = "_blank";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try{ a.remove(); }catch(e){}
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 1000);
  }

  function install(){
    document.querySelectorAll(".df-v221-report-actions").forEach(el => el.remove());

    const sel = document.getElementById("acaoRelatorio");
    if(sel){
      sel.onchange = null;
      sel.removeAttribute("onchange");

      if(!sel.dataset.df26Bound){
        sel.dataset.df26Bound = "1";
        sel.addEventListener("change", function(e){
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if(sel.value === "pdf" || sel.value === "csv"){
            openFilters();
          }

          sel.value = "";
        }, true);
      }
    }

    window.gerarRelatorioFinanceiroDF = openFilters;
    window.executarRelatorio = function(){
      const select = document.getElementById("acaoRelatorio");
      if(select && (select.value === "pdf" || select.value === "csv")){
        openFilters();
        select.value = "";
      }
    };

    window.df26OpenReportFilters = openFilters;
    window.df26OpenReport = openReport;
    window.df26ExportCSV = exportCSV;

    // Blindagem contra versões antigas
    window.df226GerarPDF = openReport;
    window.df224GerarPDF = openReport;
    window.df222GerarPDF = openReport;
    window.df23GerarPDF = openReport;
    window.df24GerarPdf = openReport;
    window.df25PDF = openReport;
  }

  DF.installRelatorios = install;
})();
