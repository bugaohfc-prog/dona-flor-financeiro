const CACHE_NAME = "dona-flor-v20-ux";
const ASSETS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(resp => resp || caches.match("/index.html")))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(clientList => {
    for (const client of clientList) {
      if ("focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow("/");
  }));
});



/* =========================
   V20.1 FINAL - Dona Flor UX
   Correções:
   - remove duplicação dos botões das notas
   - prioridade aparece uma vez no topo da nota
   - ações: Editar, Excluir, Prioridade
   - remove setInterval do patch anterior
   ========================= */
(function(){
  if (window.__DF_V201_FINAL_RUNNING__) return;
  window.__DF_V201_FINAL_RUNNING__ = true;

  const DF = {
    norm(v){
      const s = String(v || "Normal").toLowerCase().trim();
      if (s.includes("urgent") || s.includes("alta")) return "Urgente";
      if (s.includes("média") || s.includes("media") || s.includes("importante")) return "Média";
      return "Normal";
    },
    label(v){
      const p = this.norm(v);
      if (p === "Urgente") return "🔴 Urgente";
      if (p === "Média") return "🟡 Média";
      return "🟢 Normal";
    },
    cls(v){
      const p = this.norm(v);
      if (p === "Urgente") return "df-prio-urgente";
      if (p === "Média") return "df-prio-media";
      return "df-prio-normal";
    }
  };

  window.DFV201 = DF;

  function injectCss(){
    const old = document.getElementById("df-v20-ux-css");
    if (old) old.remove();

    if (document.getElementById("df-v201-final-css")) return;

    const style = document.createElement("style");
    style.id = "df-v201-final-css";
    style.textContent = `
      .df-note-card-v20,
      .df-note-card-v201{
        border:1px solid #e2e8f0 !important;
        border-left:6px solid #0f766e !important;
        border-radius:16px !important;
        padding:14px !important;
        background:#fff !important;
        margin:12px 0 !important;
        box-shadow:0 8px 18px rgba(15,23,42,.05) !important;
      }
      .df-note-card-v201.df-prio-media{border-left-color:#f59e0b !important;}
      .df-note-card-v201.df-prio-urgente{border-left-color:#dc2626 !important;}

      .df-prio-badge-v20{display:none !important;}

      .df-prio-badge-v201{
        display:inline-flex !important;
        align-items:center !important;
        gap:6px !important;
        padding:6px 12px !important;
        border-radius:999px !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        margin-bottom:8px !important;
        width:auto !important;
      }
      .df-prio-normal{background:#0f766e !important;}
      .df-prio-media{background:#f59e0b !important;}
      .df-prio-urgente{background:#dc2626 !important;}

      .df-note-actions-v20{display:none !important;}
      .df-note-actions-v201{
        display:grid !important;
        grid-template-columns:1fr !important;
        gap:8px !important;
        margin-top:12px !important;
      }
      .df-note-actions-v201 button,
      .df-note-actions-v201 select{
        width:100% !important;
        min-height:44px !important;
        padding:10px 12px !important;
        border-radius:12px !important;
        font-size:14px !important;
        font-weight:800 !important;
        margin:0 !important;
        box-sizing:border-box !important;
      }
      .df-note-actions-v201 .df-edit-btn{
        background:#2563eb !important;
        color:#fff !important;
        border:0 !important;
      }
      .df-note-actions-v201 .df-delete-btn{
        background:#b91c1c !important;
        color:#fff !important;
        border:0 !important;
      }
      .df-note-actions-v201 .df-priority-select{
        background:#fff !important;
        color:#111827 !important;
        border:1px solid #cbd5e1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function renameLabels(){
    document.querySelectorAll("h1,h2,h3,h4,button,span,a,label,div").forEach(el => {
      if(!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = (el.textContent || "").trim();
      if(txt === "Lançamento de notas" || txt === "Lançamento de notas"){
        el.textContent = "Lançamento de notas";
      }
      if(txt === "Lembretes"){
        el.textContent = "Notas";
      }
    });
  }

  function dedupeActions(card){
    const oldActions = Array.from(card.querySelectorAll(".df-note-actions-v20,.df-note-actions-v201"));
    oldActions.forEach((el, idx) => {
      if(idx > 0 || el.classList.contains("df-note-actions-v20")) el.remove();
    });

    // remove badges extras; deixa somente v201
    Array.from(card.querySelectorAll(".df-prio-badge-v201")).forEach((el, idx) => {
      if(idx > 0) el.remove();
    });
  }

  function melhorarNotas(){
    const cards = Array.from(document.querySelectorAll(".nota-card,.note-card,.lembrete-card,[data-nota-id],.card"))
      .filter(card => /editar|excluir|prioridade|normal|urgente|média|media|recisão|vamos fazer/i.test(card.innerText || ""));

    cards.forEach(card => {
      const text = card.innerText || "";
      const prioridade =
        /urgente|alta/i.test(text) ? "Urgente" :
        /m[eé]dia|importante/i.test(text) ? "Média" :
        /normal/i.test(text) ? "Normal" : "Normal";

      card.classList.remove("df-note-card-v20", "df-prio-normal", "df-prio-media", "df-prio-urgente");
      card.classList.add("df-note-card-v201", DF.cls(prioridade));

      // limpa ações/badges do patch anterior
      dedupeActions(card);

      // remove badge Normal duplicada que estiver solta dentro do card, preserva somente badge v201
      Array.from(card.querySelectorAll("span,div")).forEach(el => {
        if(el.classList.contains("df-prio-badge-v201")) return;
        const t = (el.textContent || "").trim();
        const onlyPriority = /^(🟢|🟡|🔴)?\s*(Normal|Média|Media|Urgente)$/i.test(t);
        if(onlyPriority && (el.className || "").toString().match(/badge|prio|priority/i)){
          el.remove();
        }
      });

      let badge = card.querySelector(".df-prio-badge-v201");
      if(!badge){
        badge = document.createElement("span");
        badge.className = "df-prio-badge-v201 " + DF.cls(prioridade);
        badge.textContent = DF.label(prioridade);
        card.insertBefore(badge, card.firstChild);
      } else {
        badge.className = "df-prio-badge-v201 " + DF.cls(prioridade);
        badge.textContent = DF.label(prioridade);
      }

      const buttons = Array.from(card.querySelectorAll("button"));
      const selects = Array.from(card.querySelectorAll("select"));

      const editar = buttons.find(b => /editar|alterar|✏️/i.test(b.innerText || b.title || b.ariaLabel || ""));
      const excluir = buttons.find(b => /excluir|lixeira|🗑️/i.test(b.innerText || b.title || b.ariaLabel || ""));
      const prioridadeSelect = selects.find(s => /prioridade|normal|urgente|m[eé]dia|media|importante/i.test((s.outerHTML || "") + " " + (s.value || "")));

      if(editar || excluir || prioridadeSelect){
        let actions = card.querySelector(".df-note-actions-v201");
        if(!actions){
          actions = document.createElement("div");
          actions.className = "df-note-actions-v201";
        } else {
          actions.innerHTML = "";
        }

        if(editar){
          editar.classList.add("df-edit-btn");
          editar.textContent = "✏️ Editar";
          actions.appendChild(editar);
        }

        if(excluir){
          excluir.classList.add("df-delete-btn");
          excluir.textContent = "🗑️ Excluir";
          actions.appendChild(excluir);
        }

        if(prioridadeSelect){
          prioridadeSelect.classList.add("df-priority-select");
          prioridadeSelect.innerHTML = `
            <option value="Normal">🚦 Prioridade: 🟢 Normal</option>
            <option value="Média">🚦 Prioridade: 🟡 Média</option>
            <option value="Urgente">🚦 Prioridade: 🔴 Urgente</option>
          `;
          prioridadeSelect.value = DF.norm(prioridade);
          actions.appendChild(prioridadeSelect);
        }

        card.appendChild(actions);
      }
    });
  }

  function aplicar(){
    injectCss();
    renameLabels();
    melhorarNotas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  // roda uma segunda vez após React renderizar, mas sem loop infinito e sem duplicar
  setTimeout(aplicar, 800);
})();




/* =========================
   V20.2 - Correção visual padrão branco
   Corrige Bloco de notas e Lançamento de notas para o mesmo padrão dos outros cards
   ========================= */
(function(){
  if (window.__DF_V202_PADRAO_BRANCO__) return;
  window.__DF_V202_PADRAO_BRANCO__ = true;

  function injectCss(){
    document.getElementById("df-v20-ux-css")?.remove();
    document.getElementById("df-v201-final-css")?.remove();
    document.getElementById("df-v21-ux-css")?.remove();

    if (document.getElementById("df-v202-padrao-branco-css")) return;

    const style = document.createElement("style");
    style.id = "df-v202-padrao-branco-css";
    style.textContent = `
      /* força cards principais para padrão branco */
      .card,
      section,
      .nota-card,
      .note-card,
      .lembrete-card,
      [data-nota-id]{
        background:#ffffff !important;
      }

      /* remove fundos vermelhos aplicados nos blocos de notas */
      .df-note-card-v20,
      .df-note-card-v201,
      .df-note-card-v21{
        background:#ffffff !important;
        background-image:none !important;
        border:1px solid #e5e7eb !important;
        border-radius:16px !important;
        box-shadow:0 8px 22px rgba(15,23,42,.06) !important;
      }

      /* botões e select das notas mais leves */
      .df-note-actions-v20,
      .df-note-actions-v201,
      .df-note-actions-v21{
        display:grid !important;
        grid-template-columns:1fr 1fr !important;
        gap:8px !important;
        margin-top:10px !important;
      }

      .df-note-actions-v20 select,
      .df-note-actions-v201 select,
      .df-note-actions-v21 select{
        grid-column:1 / -1 !important;
        width:100% !important;
        height:42px !important;
        border-radius:12px !important;
        border:1px solid #d1d5db !important;
        background:#ffffff !important;
        color:#111827 !important;
        font-weight:700 !important;
      }

      .df-note-actions-v20 button,
      .df-note-actions-v201 button,
      .df-note-actions-v21 button{
        width:100% !important;
        height:42px !important;
        border-radius:12px !important;
        border:0 !important;
        font-weight:800 !important;
        margin:0 !important;
      }

      /* visual padrão para prioridade */
      .df-prio-badge-v20,
      .df-prio-badge-v201,
      .df-note-v21-prio{
        display:inline-flex !important;
        width:auto !important;
        padding:5px 10px !important;
        border-radius:999px !important;
        font-size:12px !important;
        font-weight:900 !important;
      }

      /* correção específica: qualquer seção que tenha Bloco/Lançamento de notas fica branca */
      .df-force-white-card{
        background:#ffffff !important;
        background-image:none !important;
        border:1px solid #e5e7eb !important;
        border-radius:18px !important;
        box-shadow:0 10px 28px rgba(15,23,42,.06) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function normalizarSelectPrioridade(){
    document.querySelectorAll("select").forEach(sel => {
      const html = (sel.innerHTML || "").toLowerCase();
      if (html.includes("urgente") || html.includes("normal") || html.includes("prioridade")) {
        sel.innerHTML = `
          <option value="Normal">Prioridade: Normal</option>
          <option value="Alto">Prioridade: Alto</option>
          <option value="Urgente">Prioridade: Urgente</option>
        `;
      }
    });
  }

  function corrigirCardsNotas(){
    document.querySelectorAll("div, section, article").forEach(el => {
      const txt = (el.innerText || "").toLowerCase();
      const ehBlocoNotas =
        txt.includes("bloco de notas") ||
        txt.includes("lançamento de notas") ||
        txt.includes("lancamento de notas");

      if (ehBlocoNotas && txt.length < 2500) {
        el.classList.add("df-force-white-card");
        el.style.background = "#ffffff";
        el.style.backgroundImage = "none";
      }
    });
  }

  function renomear(){
    document.querySelectorAll("h1,h2,h3,h4,button,span,a,label,div").forEach(el => {
      if(!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = (el.textContent || "").trim();
      if(txt === "Adicionar lembrete" || txt === "Novo lembrete"){
        el.textContent = "Lançamento de notas";
      }
    });
  }

  function aplicar(){
    injectCss();
    renomear();
    normalizarSelectPrioridade();
    corrigirCardsNotas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
})();

