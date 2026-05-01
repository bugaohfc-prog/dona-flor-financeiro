const CACHE_NAME = "dona-flor-v22-6-pdf-corrigido";
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
      if(txt === "Lançamento de notas" || txt === "Lançamento de notas"){
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




/* =========================
   V20.3 - Notas em modal + tela limpa
   - Remove badge "Urgente" solto do lançamento de notas
   - Remove "Lançamento de notas" do submenu
   - Esconde a seção fixa "Lançamento de notas"
   - Adiciona botão + Nota no Bloco de notas
   - Abre o formulário de notas em janela/modal
   ========================= */
(function(){
  if (window.__DF_V203_NOTAS_MODAL__) return;
  window.__DF_V203_NOTAS_MODAL__ = true;

  let formNotasOriginal = null;
  let formNotasParentOriginal = null;
  let formNotasNextSibling = null;

  function injectCss(){
    if (document.getElementById("df-v203-notas-modal-css")) return;

    const style = document.createElement("style");
    style.id = "df-v203-notas-modal-css";
    style.textContent = `
      .df-hidden-v203{display:none !important;}

      .df-add-nota-btn-v203{
        width:44px !important;
        height:44px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#0f766e !important;
        color:white !important;
        font-size:22px !important;
        font-weight:900 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-shadow:0 8px 22px rgba(15,118,110,.25) !important;
        cursor:pointer !important;
        margin-left:auto !important;
      }

      .df-bloco-header-v203{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
      }

      .df-modal-backdrop-v203{
        position:fixed !important;
        inset:0 !important;
        background:rgba(15,23,42,.55) !important;
        z-index:999999 !important;
        display:none;
        align-items:flex-end !important;
        justify-content:center !important;
      }

      .df-modal-backdrop-v203.open{display:flex !important;}

      .df-modal-v203{
        width:100% !important;
        max-width:640px !important;
        background:#ffffff !important;
        border-radius:24px 24px 0 0 !important;
        padding:18px !important;
        max-height:86vh !important;
        overflow:auto !important;
        box-shadow:0 -12px 40px rgba(15,23,42,.25) !important;
        animation:dfV203Up .22s ease-out !important;
      }

      @keyframes dfV203Up{
        from{transform:translateY(24px);opacity:.4}
        to{transform:translateY(0);opacity:1}
      }

      .df-modal-head-v203{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        margin-bottom:12px !important;
      }

      .df-modal-title-v203{
        font-size:22px !important;
        font-weight:900 !important;
        color:#0f172a !important;
      }

      .df-modal-close-v203{
        width:38px !important;
        height:38px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#f1f5f9 !important;
        color:#0f172a !important;
        font-size:22px !important;
        font-weight:900 !important;
      }

      .df-modal-v203 .df-force-white-card,
      .df-modal-v203 section,
      .df-modal-v203 .card{
        box-shadow:none !important;
        border:0 !important;
        padding:0 !important;
        margin:0 !important;
        background:#fff !important;
      }

      .df-modal-v203 h1,
      .df-modal-v203 h2,
      .df-modal-v203 h3{
        display:none !important;
      }

      .df-modal-v203 input,
      .df-modal-v203 textarea,
      .df-modal-v203 select{
        background:#fff !important;
      }

      /* tira badges soltos como Urgente acima do formulário */
      .df-remove-badge-v203{
        display:none !important;
      }

      /* ações das notas cadastradas: ícones menores */
      .nota-card button,
      .note-card button,
      .lembrete-card button,
      [data-nota-id] button{
        min-height:36px !important;
        font-size:13px !important;
        border-radius:10px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function texto(el){ return (el?.innerText || el?.textContent || "").trim(); }

  function findCardByTitle(titleRegex){
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"));
    return candidates
      .filter(el => titleRegex.test(texto(el)))
      .sort((a,b) => texto(a).length - texto(b).length)[0] || null;
  }

  function esconderSubmenuLancamentoNotas(){
    document.querySelectorAll("a,button,li,p,span,div").forEach(el => {
      const t = texto(el);
      if (/^(\+|•|\s)*lançamento de notas$/i.test(t) || /^(\+|•|\s)*lancamento de notas$/i.test(t)) {
        el.classList.add("df-hidden-v203");
      }
    });
  }

  function removerBadgeUrgenteSolto(){
    document.querySelectorAll("span,div,p").forEach(el => {
      const t = texto(el);
      const isBadge = /^(🔴|●)?\s*Urgente$/i.test(t);
      if (!isBadge) return;

      const nearForm = el.closest("section,.card,div");
      const txt = texto(nearForm);
      if (/lançamento de notas|lancamento de notas|título|recado|salvar nota/i.test(txt)) {
        el.classList.add("df-remove-badge-v203");
      }
    });
  }

  function criarModal(){
    if (document.getElementById("df-modal-notas-v203")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "df-modal-notas-v203";
    backdrop.className = "df-modal-backdrop-v203";
    backdrop.innerHTML = `
      <div class="df-modal-v203">
        <div class="df-modal-head-v203">
          <div class="df-modal-title-v203">Lançamento de notas</div>
          <button type="button" class="df-modal-close-v203">×</button>
        </div>
        <div id="df-modal-notas-body-v203"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector(".df-modal-close-v203").addEventListener("click", fecharModal);
    backdrop.addEventListener("click", (e) => {
      if(e.target === backdrop) fecharModal();
    });
  }

  function abrirModal(){
    criarModal();
    const modal = document.getElementById("df-modal-notas-v203");
    const body = document.getElementById("df-modal-notas-body-v203");

    if (!formNotasOriginal) {
      capturarFormNotas();
    }

    if (formNotasOriginal && body && !body.contains(formNotasOriginal)) {
      body.appendChild(formNotasOriginal);
      formNotasOriginal.classList.remove("df-hidden-v203");
      formNotasOriginal.style.display = "";
    }

    modal.classList.add("open");
  }

  function fecharModal(){
    const modal = document.getElementById("df-modal-notas-v203");
    if(modal) modal.classList.remove("open");

    // mantém o form dentro do modal escondido para não voltar a ocupar tela
    if(formNotasOriginal){
      formNotasOriginal.classList.add("df-hidden-v203");
    }
  }

  function capturarFormNotas(){
    const formCard = findCardByTitle(/lançamento de notas|lancamento de notas|salvar nota/i);
    if (!formCard) return;

    const txt = texto(formCard);
    if (!/título|recado|salvar nota/i.test(txt)) return;

    formNotasOriginal = formCard;
    formNotasParentOriginal = formCard.parentNode;
    formNotasNextSibling = formCard.nextSibling;
    formNotasOriginal.classList.add("df-hidden-v203");
  }

  function adicionarBotaoNoBlocoNotas(){
    const bloco = findCardByTitle(/bloco de notas/i);
    if (!bloco) return;

    if (bloco.querySelector(".df-add-nota-btn-v203")) return;

    const title = Array.from(bloco.querySelectorAll("h1,h2,h3,h4,strong,div"))
      .find(el => /^(\s*📝\s*)?Bloco de notas$/i.test(texto(el)));

    if (!title) return;

    const wrapper = document.createElement("div");
    wrapper.className = "df-bloco-header-v203";

    title.parentNode.insertBefore(wrapper, title);
    wrapper.appendChild(title);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-add-nota-btn-v203";
    btn.title = "Adicionar nota";
    btn.textContent = "+";
    btn.addEventListener("click", abrirModal);

    wrapper.appendChild(btn);
  }

  function aplicar(){
    injectCss();
    esconderSubmenuLancamentoNotas();
    removerBadgeUrgenteSolto();
    capturarFormNotas();
    criarModal();
    adicionarBotaoNoBlocoNotas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
})();




/* =========================
   V20.4 FINAL - UX limpa
   - Recolher/expandir só com triângulo, sem bolinha
   - Contas a pagar com botão + para lançar conta
   - Esconde formulário fixo "Lançamento de contas"
   - Remove lançamento de contas do submenu
   - Mantém notas em modal da V20.3
   ========================= */
(function(){
  if (window.__DF_V204_FINAL__) return;
  window.__DF_V204_FINAL__ = true;

  let formContaOriginal = null;

  function injectCss(){
    if (document.getElementById("df-v204-final-css")) return;

    const style = document.createElement("style");
    style.id = "df-v204-final-css";
    style.textContent = `
      /* Expandir/recolher discreto: só triângulo */
      button, .toggle-btn, .collapse-btn, .expand-btn {
        transition: all .15s ease;
      }

      /* alvo principal: botões redondos com apenas ▲/▼ */
      button:has-text("▲"),
      button:has-text("▼") {
        background: transparent !important;
      }

      .df-toggle-clean-v204{
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        width: auto !important;
        height: auto !important;
        min-width: 24px !important;
        min-height: 24px !important;
        padding: 4px !important;
        border-radius: 0 !important;
        color: #0f766e !important;
        font-size: 14px !important;
        font-weight: 900 !important;
      }

      .df-hidden-v204{display:none !important;}

      .df-section-head-v204{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
      }

      .df-add-btn-v204{
        width:40px !important;
        height:40px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#0f766e !important;
        color:#fff !important;
        font-size:22px !important;
        font-weight:900 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-shadow:0 8px 22px rgba(15,118,110,.22) !important;
        cursor:pointer !important;
        margin-left:auto !important;
      }

      .df-modal-backdrop-v204{
        position:fixed !important;
        inset:0 !important;
        background:rgba(15,23,42,.55) !important;
        z-index:999999 !important;
        display:none;
        align-items:flex-end !important;
        justify-content:center !important;
      }

      .df-modal-backdrop-v204.open{
        display:flex !important;
      }

      .df-modal-v204{
        width:100% !important;
        max-width:650px !important;
        background:#ffffff !important;
        border-radius:24px 24px 0 0 !important;
        padding:18px !important;
        max-height:88vh !important;
        overflow:auto !important;
        box-shadow:0 -12px 40px rgba(15,23,42,.25) !important;
        animation:dfV204Up .22s ease-out !important;
      }

      @keyframes dfV204Up{
        from{transform:translateY(24px);opacity:.4}
        to{transform:translateY(0);opacity:1}
      }

      .df-modal-head-v204{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        margin-bottom:12px !important;
      }

      .df-modal-title-v204{
        font-size:22px !important;
        font-weight:900 !important;
        color:#0f172a !important;
      }

      .df-modal-close-v204{
        width:38px !important;
        height:38px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#f1f5f9 !important;
        color:#0f172a !important;
        font-size:22px !important;
        font-weight:900 !important;
      }

      .df-modal-v204 .df-force-white-card,
      .df-modal-v204 section,
      .df-modal-v204 .card{
        box-shadow:none !important;
        border:0 !important;
        padding:0 !important;
        margin:0 !important;
        background:#fff !important;
      }

      .df-modal-v204 h1,
      .df-modal-v204 h2,
      .df-modal-v204 h3{
        display:none !important;
      }

      .df-modal-v204 input,
      .df-modal-v204 textarea,
      .df-modal-v204 select{
        background:#fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function findCardByTitle(regex){
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"));
    return candidates
      .filter(el => regex.test(txt(el)))
      .sort((a,b) => txt(a).length - txt(b).length)[0] || null;
  }

  function limparToggle(){
    document.querySelectorAll("button,span,div").forEach(el => {
      const t = txt(el);
      if (t === "▲" || t === "▼" || t === "▴" || t === "▾") {
        el.classList.add("df-toggle-clean-v204");
        el.style.background = "transparent";
        el.style.boxShadow = "none";
        el.style.border = "none";
      }
    });
  }

  function esconderSubmenus(){
    document.querySelectorAll("a,button,li,p,span,div").forEach(el => {
      const t = txt(el).toLowerCase();
      if (
        t === "lançamento de contas" ||
        t === "lancamento de contas" ||
        t === "lançamento de notas" ||
        t === "lancamento de notas"
      ) {
        el.classList.add("df-hidden-v204");
      }
    });
  }

  function criarModalConta(){
    if (document.getElementById("df-modal-conta-v204")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "df-modal-conta-v204";
    backdrop.className = "df-modal-backdrop-v204";
    backdrop.innerHTML = `
      <div class="df-modal-v204">
        <div class="df-modal-head-v204">
          <div class="df-modal-title-v204">Lançamento de contas</div>
          <button type="button" class="df-modal-close-v204">×</button>
        </div>
        <div id="df-modal-conta-body-v204"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector(".df-modal-close-v204").addEventListener("click", fecharModalConta);
    backdrop.addEventListener("click", (e) => {
      if(e.target === backdrop) fecharModalConta();
    });
  }

  function abrirModalConta(){
    criarModalConta();
    if(!formContaOriginal) capturarFormConta();

    const body = document.getElementById("df-modal-conta-body-v204");
    const modal = document.getElementById("df-modal-conta-v204");

    if(formContaOriginal && body && !body.contains(formContaOriginal)){
      body.appendChild(formContaOriginal);
      formContaOriginal.classList.remove("df-hidden-v204");
      formContaOriginal.style.display = "";
    }

    modal.classList.add("open");
  }

  function fecharModalConta(){
    const modal = document.getElementById("df-modal-conta-v204");
    if(modal) modal.classList.remove("open");
    if(formContaOriginal) formContaOriginal.classList.add("df-hidden-v204");
  }

  function capturarFormConta(){
    const formCard = findCardByTitle(/lançamento de contas|lancamento de contas|salvar conta/i);
    if(!formCard) return;

    const t = txt(formCard);
    if(!/descrição|descricao|valor|salvar conta/i.test(t)) return;

    formContaOriginal = formCard;
    formContaOriginal.classList.add("df-hidden-v204");
  }

  function adicionarBotaoConta(){
    const contasCard = findCardByTitle(/contas a pagar/i);
    if(!contasCard) return;

    if(contasCard.querySelector(".df-add-conta-btn-v204")) return;

    const title = Array.from(contasCard.querySelectorAll("h1,h2,h3,h4,strong,div"))
      .find(el => /^(\s*📄\s*)?Contas a pagar$/i.test(txt(el)));

    if(!title) return;

    const wrapper = document.createElement("div");
    wrapper.className = "df-section-head-v204";

    title.parentNode.insertBefore(wrapper, title);
    wrapper.appendChild(title);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-add-btn-v204 df-add-conta-btn-v204";
    btn.title = "Adicionar conta";
    btn.textContent = "+";
    btn.addEventListener("click", abrirModalConta);

    wrapper.appendChild(btn);
  }

  function melhorarBotaoNota(){
    const bloco = findCardByTitle(/bloco de notas/i);
    if(!bloco) return;

    const btn = bloco.querySelector(".df-add-nota-btn-v203");
    if(btn){
      btn.classList.add("df-add-btn-v204");
      btn.textContent = "+";
      btn.title = "Adicionar nota";
    }
  }

  function aplicar(){
    injectCss();
    limparToggle();
    esconderSubmenus();
    capturarFormConta();
    criarModalConta();
    adicionarBotaoConta();
    melhorarBotaoNota();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
})();




/* ==========================================================
   DONA FLOR - V21 FINAL REBUILD LIMPO
   Objetivo:
   - 1 único botão + no Bloco de notas
   - 1 único botão + em Contas a pagar
   - Pop-up limpo para lançamento de notas e contas
   - Remove scripts/visuais antigos que duplicavam +
   - Submenus preservados
   - Soft delete preservado
   ========================================================== */
(function () {
  if (window.__DONA_FLOR_V21_FINAL__) return;
  window.__DONA_FLOR_V21_FINAL__ = true;

  const V21 = {
    notaForm: null,
    contaForm: null,
    initialized: false
  };

  function txt(el) {
    return (el?.innerText || el?.textContent || "").trim();
  }

  function injectCss() {
    if (document.getElementById("df-v21-final-css")) return;

    const css = document.createElement("style");
    css.id = "df-v21-final-css";
    css.textContent = `
      html, body, #root, #app, main, .container {
        background-color:#F1F5F9 !important;
        background-image:none !important;
      }

      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
        color:#111827 !important;
      }

      .df-force-white-card,
      .card,
      section {
        background:#FFFFFF !important;
        background-image:none !important;
        border:1px solid #E2E8F0 !important;
        border-radius:12px !important;
        box-shadow:
          0 10px 15px -3px rgba(0,0,0,.10),
          0 4px 6px -4px rgba(0,0,0,.05) !important;
      }

      .df-v21-hidden { display:none !important; }

      .df-v21-section-head {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
        width:100% !important;
      }

      .df-v21-plus {
        width:42px !important;
        height:42px !important;
        min-width:42px !important;
        min-height:42px !important;
        border-radius:999px !important;
        border:2px solid #000 !important;
        background:#0F766E !important;
        color:#FFF !important;
        font-size:24px !important;
        font-weight:900 !important;
        box-shadow:4px 4px 0 #000 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        line-height:1 !important;
        padding:0 !important;
        margin:0 !important;
        cursor:pointer !important;
        touch-action:manipulation !important;
      }

      .df-v21-plus:active {
        transform: translate(2px, 2px) !important;
        box-shadow:2px 2px 0 #000 !important;
      }

      .df-v21-modal {
        position:fixed !important;
        inset:0 !important;
        z-index:999999 !important;
        display:none !important;
        align-items:center !important;
        justify-content:center !important;
        padding:18px !important;
        box-sizing:border-box !important;
        background:rgba(15,23,42,.62) !important;
      }

      .df-v21-modal.open {
        display:flex !important;
      }

      .df-v21-box {
        width:100% !important;
        max-width:540px !important;
        max-height:88vh !important;
        overflow:auto !important;
        background:#FFFFFF !important;
        border:2px solid #000 !important;
        border-radius:18px !important;
        box-shadow:6px 6px 0 #000 !important;
        padding:18px !important;
        box-sizing:border-box !important;
      }

      .df-v21-modal-head {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        margin-bottom:14px !important;
      }

      .df-v21-title {
        font-size:22px !important;
        font-weight:900 !important;
        color:#0F172A !important;
      }

      .df-v21-close {
        width:40px !important;
        height:40px !important;
        border-radius:999px !important;
        border:2px solid #000 !important;
        background:#FFF !important;
        color:#000 !important;
        font-size:22px !important;
        font-weight:900 !important;
        box-shadow:3px 3px 0 #000 !important;
        cursor:pointer !important;
        padding:0 !important;
      }

      .df-v21-body .card,
      .df-v21-body section,
      .df-v21-body .df-force-white-card {
        background:#fff !important;
        background-image:none !important;
        border:0 !important;
        box-shadow:none !important;
        padding:0 !important;
        margin:0 !important;
      }

      .df-v21-body h1,
      .df-v21-body h2,
      .df-v21-body h3,
      .df-v21-body h4 {
        display:none !important;
      }

      .df-v21-body input,
      .df-v21-body textarea,
      .df-v21-body select {
        width:100% !important;
        box-sizing:border-box !important;
        background:#fff !important;
        min-height:44px !important;
        font-family:inherit !important;
        font-size:15px !important;
      }

      .df-v21-body textarea {
        min-height:110px !important;
      }

      .df-v21-toggle-clean,
      .df-toggle-clean-v204 {
        background:transparent !important;
        box-shadow:none !important;
        border:none !important;
        min-width:24px !important;
        min-height:24px !important;
        width:auto !important;
        height:auto !important;
        padding:4px !important;
        color:#0F766E !important;
      }

      /* mata os botões + e modais antigos que causavam duplicação */
      .df-v2041-plus-btn,
      .df-v2042-plus-btn,
      .df-v2044-plus,
      .df-add-nota-btn-v203,
      .df-add-conta-btn-v204,
      .df-add-btn-v204,
      .df-v206-add-btn,
      .df-v208-add-btn {
        display:none !important;
      }

      #df-v2042-popup-nota,
      #df-v2044-modal-nota,
      #df-v2044-modal-conta,
      #df-modal-notas-v203,
      #df-modal-conta-v204,
      #df-v206-modal-nota,
      #df-v206-modal-conta {
        display:none !important;
      }

      button, select {
        min-height:40px !important;
        touch-action:manipulation !important;
      }
    `;
    document.head.appendChild(css);
  }

  function createModal(id, title) {
    let modal = document.getElementById(id);
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = id;
    modal.className = "df-v21-modal";
    modal.innerHTML = `
      <div class="df-v21-box">
        <div class="df-v21-modal-head">
          <div class="df-v21-title">${title}</div>
          <button type="button" class="df-v21-close" aria-label="Fechar">×</button>
        </div>
        <div class="df-v21-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".df-v21-close").addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });

    return modal;
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");

    const child = modal.querySelector(".df-v21-body > *");
    if (child) child.classList.add("df-v21-hidden");
  }

  function findFormByButton(labelRegex) {
    const btns = Array.from(document.querySelectorAll("button,input[type='button'],input[type='submit']"));
    const btn = btns.find(b => labelRegex.test(txt(b) || b.value || ""));
    if (btn) {
      let cur = btn;
      while (cur && cur !== document.body) {
        if (cur.querySelectorAll && cur.querySelectorAll("input,textarea,select").length >= 2) return cur;
        cur = cur.parentElement;
      }
    }

    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"))
      .filter(el => labelRegex.test(txt(el)) && el.querySelectorAll("input,textarea,select").length >= 2)
      .sort((a, b) => txt(a).length - txt(b).length);

    return candidates[0] || null;
  }

  function captureForms() {
    if (!V21.notaForm) {
      V21.notaForm = findFormByButton(/salvar nota/i);
      if (V21.notaForm) V21.notaForm.classList.add("df-v21-hidden");
    }

    if (!V21.contaForm) {
      V21.contaForm = findFormByButton(/salvar conta/i);
      if (V21.contaForm) V21.contaForm.classList.add("df-v21-hidden");
    }
  }

  function findSection(titleRegex) {
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"));
    return candidates
      .filter(el => titleRegex.test(txt(el)))
      .sort((a, b) => txt(a).length - txt(b).length)[0] || null;
  }

  function getTitle(section, titleRegex) {
    return Array.from(section.querySelectorAll("h1,h2,h3,h4,strong,div"))
      .find(el => titleRegex.test(txt(el)) && txt(el).length < 90);
  }

  function removeOldPlus(section) {
    const old = Array.from(section.querySelectorAll("button"))
      .filter(b => {
        const cls = String(b.className || "");
        const t = txt(b);
        return t === "+" || /plus|add-nota|add-conta|add-btn/i.test(cls);
      });
    old.forEach(b => b.remove());
  }

  function ensureHead(section, titleRegex) {
    const title = getTitle(section, titleRegex);
    if (!title) return null;

    let head = title.closest(".df-v21-section-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "df-v21-section-head";
      title.parentNode.insertBefore(head, title);
      head.appendChild(title);
    }
    return head;
  }

  function addPlus(sectionRegex, titleRegex, type) {
    const section = findSection(sectionRegex);
    if (!section) return;

    removeOldPlus(section);

    const head = ensureHead(section, titleRegex);
    if (!head) return;

    if (head.querySelector(".df-v21-plus")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-v21-plus";
    btn.textContent = "+";
    btn.title = type === "nota" ? "Adicionar nota" : "Adicionar conta";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openForm(type);
    });

    head.appendChild(btn);
  }

  function openForm(type) {
    captureForms();

    const isNota = type === "nota";
    const form = isNota ? V21.notaForm : V21.contaForm;
    const modal = createModal(
      isNota ? "df-v21-modal-nota" : "df-v21-modal-conta",
      isNota ? "Lançamento de notas" : "Lançamento de contas"
    );
    const body = modal.querySelector(".df-v21-body");

    body.innerHTML = "";

    if (!form) {
      body.innerHTML = `<div style="padding:12px;color:#B91C1C;font-weight:900;">Formulário não encontrado.</div>`;
      modal.classList.add("open");
      return;
    }

    body.appendChild(form);
    form.classList.remove("df-v21-hidden");
    form.style.display = "";
    modal.classList.add("open");

    setTimeout(() => {
      const first = form.querySelector("input,textarea,select");
      if (first) first.focus();
    }, 120);
  }

  function hideFormsOutsideModal() {
    captureForms();

    if (V21.notaForm && !document.getElementById("df-v21-modal-nota")?.contains(V21.notaForm)) {
      V21.notaForm.classList.add("df-v21-hidden");
    }
    if (V21.contaForm && !document.getElementById("df-v21-modal-conta")?.contains(V21.contaForm)) {
      V21.contaForm.classList.add("df-v21-hidden");
    }
  }

  function cleanToggles() {
    document.querySelectorAll("button,span,div").forEach(el => {
      const t = txt(el);
      if (t === "▲" || t === "▼" || t === "▴" || t === "▾") {
        el.classList.add("df-v21-toggle-clean");
        if (el.style) {
          el.style.background = "transparent";
          el.style.boxShadow = "none";
          el.style.border = "none";
        }
      }
    });
  }

  function closeOldModals() {
    [
      "df-v2042-popup-nota",
      "df-v2044-modal-nota",
      "df-v2044-modal-conta",
      "df-modal-notas-v203",
      "df-modal-conta-v204",
      "df-v206-modal-nota",
      "df-v206-modal-conta"
    ].forEach(id => {
      const m = document.getElementById(id);
      if (m) {
        m.classList.remove("open");
        m.style.display = "none";
      }
    });
  }

  function softDeleteGuards() {
    if (typeof SupabaseURL === "undefined" || typeof SupabaseKey === "undefined") return;

    window.excluirConta = async function(id) {
      if (typeof isAdmin === "function" && !isAdmin()) return alert("Operação restrita a administradores.");
      if (!confirm("Deseja mover esta conta para a Lixeira?")) return;
      if (typeof render_loading === "function") render_loading(true);

      await fetch(SupabaseURL + "/rest/v1/df_contas?id=eq." + id, {
        method: "PATCH",
        headers: {
          "apikey": SupabaseKey,
          "Authorization": "Bearer " + SupabaseKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ deletado: true, data_exclusao: new Date().toISOString() })
      });

      if (typeof carregar === "function") carregar();
    };

    window.excluirNota = async function(id) {
      if (typeof isAdmin === "function" && !isAdmin()) return alert("Operação restrita a administradores.");
      if (!confirm("Deseja mover esta nota para a Lixeira?")) return;
      if (typeof render_loading === "function") render_loading(true);

      await fetch(SupabaseURL + "/rest/v1/df_notas?id=eq." + id, {
        method: "PATCH",
        headers: {
          "apikey": SupabaseKey,
          "Authorization": "Bearer " + SupabaseKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ deletado: true, data_exclusao: new Date().toISOString() })
      });

      if (typeof carregar === "function") carregar();
    };
  }

  function aplicar() {
    injectCss();
    closeOldModals();
    captureForms();
    hideFormsOutsideModal();
    addPlus(/bloco de notas/i, /bloco de notas/i, "nota");
    addPlus(/contas a pagar/i, /contas a pagar/i, "conta");
    cleanToggles();
    softDeleteGuards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicar, { once: true });
  } else {
    aplicar();
  }

  // poucas reaplicações para esperar o app renderizar, sem loop permanente
  setTimeout(aplicar, 600);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.1 RELATÓRIOS CORRIGIDOS
   - Não imprime mais a tela inteira do app
   - Gera uma página limpa de relatório
   - PDF/Impressão com resumo + contas filtradas
   - CSV melhorado
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V211_RELATORIOS__) return;
  window.__DONA_FLOR_V211_RELATORIOS__ = true;

  function money(v){
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function escapeHTML(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function contasRelatorio(){
    try{
      if (typeof filtroContas === "function") {
        return filtroContas() || [];
      }
    }catch(e){}

    try{
      if (Array.isArray(window.contas)) return window.contas.filter(c => !c.deletado);
      if (Array.isArray(window.contasDados)) return window.contasDados.filter(c => !c.deletado);
    }catch(e){}

    return [];
  }

  function resumo(contas){
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const total = contas.reduce((a,c)=>a + Number(c.valor || 0), 0);
    const totalAberto = abertas.reduce((a,c)=>a + Number(c.valor || 0), 0);
    const totalPago = pagas.reduce((a,c)=>a + Number(c.valor || 0), 0);

    return { total, totalAberto, totalPago, qtd: contas.length, abertas: abertas.length, pagas: pagas.length };
  }

  function agrupadoPorCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = { qtd:0, total:0 };
      map[centro].qtd += 1;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  window.gerarRelatorioFinanceiroDF = function(){
    const contas = contasRelatorio();
    const r = resumo(contas);
    const porCentro = agrupadoPorCentro(contas);
    const agora = new Date().toLocaleString("pt-BR");

    const linhas = contas.map(c => `
      <tr>
        <td><strong>${escapeHTML(c.descricao || c.conta || "Sem descrição")}</strong></td>
        <td>${escapeHTML(c.centro || c.centro_custo || c.loja || "-")}</td>
        <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
        <td><span class="status ${String(c.status||"").toLowerCase()==="pago" ? "pago" : "aberto"}">${escapeHTML(c.status || "Aberto")}</span></td>
        <td class="valor">${money(c.valor)}</td>
        <td>${escapeHTML(c.observacao || "")}</td>
      </tr>
    `).join("");

    const centros = porCentro.map(([centro, info]) => `
      <div class="centro">
        <div>
          <strong>${escapeHTML(centro)}</strong>
          <small>${info.qtd} conta(s)</small>
        </div>
        <b>${money(info.total)}</b>
      </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório Dona Flor</title>
<style>
  *{box-sizing:border-box}
  body{
    margin:0;
    padding:24px;
    background:#F1F5F9;
    color:#0F172A;
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  }
  .page{
    max-width:980px;
    margin:0 auto;
    background:white;
    border:1px solid #E2E8F0;
    border-radius:18px;
    padding:24px;
    box-shadow:0 10px 25px rgba(15,23,42,.08);
  }
  .top{
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
    border-bottom:1px solid #E2E8F0;
    padding-bottom:16px;
    margin-bottom:18px;
  }
  h1{margin:0;font-size:28px;line-height:1.1;color:#0F766E}
  .sub{color:#64748B;margin-top:6px}
  .actions{display:flex;gap:8px;flex-wrap:wrap}
  button{
    border:0;
    border-radius:10px;
    padding:10px 14px;
    font-weight:800;
    cursor:pointer;
    background:#0F766E;
    color:white;
  }
  .btn-light{background:#E2E8F0;color:#0F172A}
  .cards{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:12px;
    margin:18px 0;
  }
  .card{
    border:1px solid #E2E8F0;
    border-radius:14px;
    padding:14px;
    background:#FAFAF9;
  }
  .label{font-size:12px;color:#64748B;font-weight:900;text-transform:uppercase}
  .num{font-size:22px;font-weight:950;margin-top:4px}
  .centros{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:10px;
    margin:18px 0;
  }
  .centro{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    border:1px solid #E2E8F0;
    border-radius:12px;
    padding:10px 12px;
    background:#fff;
  }
  .centro small{display:block;color:#64748B;margin-top:2px}
  table{
    width:100%;
    border-collapse:collapse;
    margin-top:16px;
    font-size:13px;
  }
  th{
    background:#0F766E;
    color:white;
    text-align:left;
    padding:10px;
  }
  td{
    border-bottom:1px solid #E2E8F0;
    padding:10px;
    vertical-align:top;
  }
  .valor{font-weight:900;white-space:nowrap}
  .status{
    display:inline-block;
    border-radius:999px;
    padding:4px 8px;
    font-weight:900;
    font-size:12px;
  }
  .status.pago{background:#DCFCE7;color:#15803D}
  .status.aberto{background:#FEF3C7;color:#92400E}
  .empty{
    padding:18px;
    border:1px dashed #CBD5E1;
    border-radius:12px;
    color:#64748B;
    text-align:center;
    margin-top:16px;
  }
  @media(max-width:760px){
    body{padding:12px}
    .page{padding:16px;border-radius:14px}
    .top{display:block}
    .actions{margin-top:12px}
    .cards{grid-template-columns:1fr 1fr}
    .centros{grid-template-columns:1fr}
    table{font-size:12px}
    th,td{padding:8px}
  }
  @media print{
    body{background:white;padding:0}
    .page{box-shadow:none;border:0;border-radius:0;max-width:none}
    .actions{display:none}
    @page{margin:12mm}
  }
</style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div>
        <h1>Dona Flor Gestão Financeira</h1>
        <div class="sub">Relatório de contas a pagar • Gerado em ${escapeHTML(agora)}</div>
      </div>
      <div class="actions">
        <button onclick="window.print()">Imprimir / PDF</button>
        <button class="btn-light" onclick="window.close()">Fechar</button>
      </div>
    </div>

    <div class="cards">
      <div class="card"><div class="label">Quantidade</div><div class="num">${r.qtd}</div></div>
      <div class="card"><div class="label">Total</div><div class="num">${money(r.total)}</div></div>
      <div class="card"><div class="label">Em aberto</div><div class="num">${money(r.totalAberto)}</div></div>
      <div class="card"><div class="label">Pago</div><div class="num">${money(r.totalPago)}</div></div>
    </div>

    <h2>Resumo por centro</h2>
    ${centros ? `<div class="centros">${centros}</div>` : `<div class="empty">Nenhum centro encontrado.</div>`}

    <h2>Detalhamento</h2>
    ${contas.length ? `
      <table>
        <thead>
          <tr>
            <th>Conta</th>
            <th>Centro</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Obs.</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    ` : `<div class="empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
  </div>

  <script>
    setTimeout(function(){ window.print(); }, 450);
  </script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if(!w){
      alert("O navegador bloqueou o pop-up. Permita pop-ups para gerar o PDF.");
      return;
    }

    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  window.exportarCSV = function(){
    const contas = contasRelatorio();
    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio") || window.acaoRelatorio;
    const acao = sel ? sel.value : "";
    if (acao === "csv") window.exportarCSV();
    if (acao === "pdf") window.gerarRelatorioFinanceiroDF();
    if (sel) sel.value = "";
  };
})();




/* ==========================================================
   DONA FLOR - V21.3 CORREÇÃO FORMULÁRIOS + POP-UP
   - Mantém os formulários no código: atalhoLancamento e atalhoLembrete
   - Não exclui lançamento de contas/notas
   - Esconde os formulários fixos da tela principal
   - Botão + abre pop-up correto
   - Editar abre pop-up correto
   - Ao fechar, devolve o formulário para um "estacionamento" oculto
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V213_FORMS_POPUP_FIX__) return;
  window.__DONA_FLOR_V213_FORMS_POPUP_FIX__ = true;

  let formConta = null;
  let formNota = null;
  let estacionamento = null;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function injectCss(){
    if(document.getElementById("df-v213-css")) return;

    const style = document.createElement("style");
    style.id = "df-v213-css";
    style.textContent = `
      #df-v213-parking {
        display:none !important;
      }

      .df-v213-hidden {
        display:none !important;
      }

      /* Os formulários existem, mas não aparecem fixos na tela principal */
      body > #atalhoLancamento,
      body > #atalhoLembrete,
      #df-v213-parking > #atalhoLancamento,
      #df-v213-parking > #atalhoLembrete {
        display:none !important;
      }

      .df-v213-modal {
        position: fixed !important;
        inset: 0 !important;
        z-index: 1000000 !important;
        background: rgba(15, 23, 42, .62) !important;
        display: none !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 18px !important;
        box-sizing: border-box !important;
      }

      .df-v213-modal.open {
        display: flex !important;
      }

      .df-v213-box {
        width: 100% !important;
        max-width: 540px !important;
        max-height: 88vh !important;
        overflow: auto !important;
        background: #fff !important;
        border: 2px solid #000 !important;
        border-radius: 18px !important;
        box-shadow: 6px 6px 0 #000 !important;
        padding: 18px !important;
        box-sizing: border-box !important;
      }

      .df-v213-head {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
        margin-bottom:14px !important;
      }

      .df-v213-title {
        font-size:22px !important;
        font-weight:900 !important;
        color:#0f172a !important;
      }

      .df-v213-close {
        width:40px !important;
        height:40px !important;
        border-radius:999px !important;
        border:2px solid #000 !important;
        background:#fff !important;
        color:#000 !important;
        font-size:22px !important;
        font-weight:900 !important;
        box-shadow:3px 3px 0 #000 !important;
        cursor:pointer !important;
      }

      .df-v213-body #atalhoLancamento,
      .df-v213-body #atalhoLembrete {
        display:block !important;
        background:#fff !important;
        border:0 !important;
        box-shadow:none !important;
        padding:0 !important;
        margin:0 !important;
      }

      .df-v213-body #atalhoLancamento h2,
      .df-v213-body #atalhoLembrete h2 {
        display:none !important;
      }

      .df-v213-body input,
      .df-v213-body textarea,
      .df-v213-body select {
        width:100% !important;
        box-sizing:border-box !important;
        background:#fff !important;
        min-height:44px !important;
        font-family:inherit !important;
        font-size:15px !important;
      }

      .df-v213-body textarea {
        min-height:110px !important;
      }

      .df-v213-section-head {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
        width:100% !important;
      }

      .df-v213-plus {
        width:42px !important;
        height:42px !important;
        min-width:42px !important;
        min-height:42px !important;
        border-radius:999px !important;
        border:2px solid #000 !important;
        background:#0f766e !important;
        color:#fff !important;
        font-size:24px !important;
        font-weight:900 !important;
        box-shadow:4px 4px 0 #000 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        line-height:1 !important;
        padding:0 !important;
        margin:0 !important;
        cursor:pointer !important;
      }

      .df-v213-plus:active {
        transform: translate(2px, 2px) !important;
        box-shadow:2px 2px 0 #000 !important;
      }

      /* Esconde botões + antigos para não duplicar */
      .df-v21-plus,
      .df-v212-plus,
      .df-v2044-plus,
      .df-v2042-plus-btn,
      .df-v2041-plus-btn,
      .df-add-nota-btn-v203,
      .df-add-conta-btn-v204,
      .df-add-btn-v204,
      .df-v206-add-btn {
        display:none !important;
      }

      /* Fecha modais antigos conflitantes */
      #df-v21-modal-nota,
      #df-v21-modal-conta,
      #df-v212-modal,
      #df-v2042-popup-nota,
      #df-v2044-modal-nota,
      #df-v2044-modal-conta,
      #df-modal-notas-v203,
      #df-modal-conta-v204,
      #df-v206-modal-nota,
      #df-v206-modal-conta {
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function criarEstacionamento(){
    estacionamento = document.getElementById("df-v213-parking");
    if(!estacionamento){
      estacionamento = document.createElement("div");
      estacionamento.id = "df-v213-parking";
      document.body.appendChild(estacionamento);
    }
    return estacionamento;
  }

  function capturarForms(){
    criarEstacionamento();

    formConta = document.getElementById("atalhoLancamento") || formConta;
    formNota = document.getElementById("atalhoLembrete") || formNota;

    // Se estiverem na tela principal, estaciona oculto.
    if(formConta && !formConta.closest(".df-v213-body")){
      estacionamento.appendChild(formConta);
    }

    if(formNota && !formNota.closest(".df-v213-body")){
      estacionamento.appendChild(formNota);
    }
  }

  function criarModal(){
    let modal = document.getElementById("df-v213-modal");
    if(modal) return modal;

    modal = document.createElement("div");
    modal.id = "df-v213-modal";
    modal.className = "df-v213-modal";
    modal.innerHTML = `
      <div class="df-v213-box">
        <div class="df-v213-head">
          <div class="df-v213-title"></div>
          <button type="button" class="df-v213-close">×</button>
        </div>
        <div class="df-v213-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".df-v213-close").addEventListener("click", fecharModal);
    modal.addEventListener("click", function(e){
      if(e.target === modal) fecharModal();
    });

    return modal;
  }

  function fecharModal(){
    const modal = document.getElementById("df-v213-modal");
    if(!modal) return;

    modal.classList.remove("open");

    const body = modal.querySelector(".df-v213-body");
    const child = body?.firstElementChild;

    if(child){
      criarEstacionamento().appendChild(child);
    }
  }

  function abrirForm(tipo, titulo){
    injectCss();
    capturarForms();

    const form = tipo === "nota" ? formNota : formConta;
    const modal = criarModal();
    const title = modal.querySelector(".df-v213-title");
    const body = modal.querySelector(".df-v213-body");

    if(!form){
      alert(tipo === "nota" ? "Formulário de nota não encontrado." : "Formulário de conta não encontrado.");
      return;
    }

    body.innerHTML = "";
    title.textContent = titulo;
    body.appendChild(form);
    form.style.display = "block";

    modal.classList.add("open");

    setTimeout(function(){
      const first = form.querySelector("input,textarea,select");
      if(first) first.focus();
    }, 150);
  }

  function limparNovaNota(){
    try{
      if(typeof limparCamposNotaDF === "function"){
        limparCamposNotaDF();
      }else{
        const campos = {
          titulo: document.getElementById("ntitulo"),
          texto: document.getElementById("ntexto"),
          data: document.getElementById("ndata"),
          prioridade: document.getElementById("nprio"),
          loja: document.getElementById("nloja")
        };
        if(campos.titulo) campos.titulo.value = "";
        if(campos.texto) campos.texto.value = "";
        if(campos.data) campos.data.value = "";
        if(campos.prioridade) campos.prioridade.value = "Normal";
        if(campos.loja) campos.loja.value = "";
      }
      const btn = document.getElementById("btnSalvarNotaDF");
      if(btn) btn.textContent = "Salvar nota";
    }catch(e){}
  }

  function limparNovaConta(){
    try{
      if(typeof cancelarEdicaoContaDF === "function"){
        cancelarEdicaoContaDF();
      }else{
        ["desc","valor","venc","obs"].forEach(id=>{
          const el = document.getElementById(id);
          if(el) el.value = "";
        });
        const status = document.getElementById("status");
        if(status) status.value = "Aberto";
      }
      const btn = [...document.querySelectorAll("#atalhoLancamento button")].find(b=>txt(b).toLowerCase().includes("salvar"));
      if(btn) btn.textContent = "Salvar conta";
    }catch(e){}
  }

  function findSection(regex){
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"))
      .filter(el => regex.test(txt(el)));
    return candidates.sort((a,b)=>txt(a).length - txt(b).length)[0] || null;
  }

  function findTitle(section, regex){
    if(!section) return null;
    return Array.from(section.querySelectorAll("h1,h2,h3,h4,strong,div"))
      .find(el => regex.test(txt(el)) && txt(el).length < 90);
  }

  function removeOldPlus(section){
    if(!section) return;
    const old = Array.from(section.querySelectorAll("button"))
      .filter(b => txt(b) === "+" || /plus|add-nota|add-conta|add-btn/i.test(String(b.className || "")));
    old.forEach(b => b.remove());
  }

  function addPlus(sectionRegex, titleRegex, tipo){
    const section = findSection(sectionRegex);
    if(!section) return;

    removeOldPlus(section);

    const title = findTitle(section, titleRegex);
    if(!title) return;

    let head = title.closest(".df-v213-section-head");
    if(!head){
      head = document.createElement("div");
      head.className = "df-v213-section-head";
      title.parentNode.insertBefore(head, title);
      head.appendChild(title);
    }

    if(head.querySelector(".df-v213-plus")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-v213-plus";
    btn.textContent = "+";
    btn.title = tipo === "nota" ? "Adicionar nota" : "Adicionar conta";
    btn.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();

      if(tipo === "nota"){
        limparNovaNota();
        abrirForm("nota", "Lançamento de notas");
      }else{
        limparNovaConta();
        abrirForm("conta", "Lançamento de contas");
      }
    };

    head.appendChild(btn);
  }

  function fecharModaisAntigos(){
    [
      "df-v21-modal-nota",
      "df-v21-modal-conta",
      "df-v212-modal",
      "df-v2042-popup-nota",
      "df-v2044-modal-nota",
      "df-v2044-modal-conta",
      "df-modal-notas-v203",
      "df-modal-conta-v204",
      "df-v206-modal-nota",
      "df-v206-modal-conta"
    ].forEach(id=>{
      const m = document.getElementById(id);
      if(m){
        m.classList.remove("open");
        m.style.display = "none";
      }
    });
  }

  function overrideEdicao(){
    if(window.__DF_V213_EDIT_OVERRIDE__) return;
    window.__DF_V213_EDIT_OVERRIDE__ = true;

    const oldEditarConta = window.editarContaDF;
    window.editarContaDF = function(id){
      capturarForms();

      // chama a função antiga para preencher e marcar contaEditandoDF
      try{
        if(typeof oldEditarConta === "function") oldEditarConta(id);
      }catch(e){}

      // corrige efeito colateral: se a função antiga mostrou na tela, estaciona e abre popup
      setTimeout(function(){
        capturarForms();
        abrirForm("conta", "Editar conta");
      }, 80);
    };

    const oldEditarNota = window.editarNotaDF;
    window.editarNotaDF = function(id){
      capturarForms();

      // chama a função antiga para preencher e marcar notaEditandoDF
      try{
        if(typeof oldEditarNota === "function") oldEditarNota(id);
      }catch(e){}

      setTimeout(function(){
        capturarForms();
        abrirForm("nota", "Editar nota");
      }, 80);
    };
  }

  function fecharDepoisSalvar(){
    if(window.__DF_V213_CLOSE_AFTER_SAVE__) return;
    window.__DF_V213_CLOSE_AFTER_SAVE__ = true;

    document.addEventListener("click", function(e){
      const btn = e.target.closest("button");
      if(!btn) return;

      const t = txt(btn).toLowerCase();
      if(!btn.closest(".df-v213-modal")) return;

      if(t.includes("salvar conta") || t.includes("salvar nota") || t.includes("salvar alteração")){
        setTimeout(fecharModal, 700);
      }
    }, true);
  }

  function aplicar(){
    injectCss();
    criarEstacionamento();
    fecharModaisAntigos();
    capturarForms();
    addPlus(/bloco de notas/i, /bloco de notas/i, "nota");
    addPlus(/contas a pagar/i, /contas a pagar/i, "conta");
    overrideEdicao();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  }else{
    aplicar();
  }

  fecharDepoisSalvar();

  setTimeout(aplicar, 600);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.4 POP-UP COM FORMULÁRIO VISÍVEL
   Correção do bug:
   - Pop-up abria, mas só aparecia o título/triângulo
   - Agora força o corpo do formulário a aparecer dentro do pop-up
   - Remove estado recolhido/collapsed quando abre
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V214_POPUP_BODY_FIX__) return;
  window.__DONA_FLOR_V214_POPUP_BODY_FIX__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function css(){
    if(document.getElementById("df-v214-popup-body-css")) return;
    const style = document.createElement("style");
    style.id = "df-v214-popup-body-css";
    style.textContent = `
      /* Dentro do pop-up, o formulário NUNCA pode ficar recolhido */
      .df-v213-body #atalhoLembrete,
      .df-v213-body #atalhoLancamento,
      .df-v212-body #atalhoLembrete,
      .df-v212-body #atalhoLancamento,
      .df-v21-body #atalhoLembrete,
      .df-v21-body #atalhoLancamento {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        background:#fff !important;
        border:0 !important;
        box-shadow:none !important;
        padding:0 !important;
        margin:0 !important;
      }

      .df-v213-body #atalhoLembrete .collapsible-body,
      .df-v213-body #atalhoLancamento .collapsible-body,
      .df-v212-body #atalhoLembrete .collapsible-body,
      .df-v212-body #atalhoLancamento .collapsible-body,
      .df-v21-body #atalhoLembrete .collapsible-body,
      .df-v21-body #atalhoLancamento .collapsible-body {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
      }

      .df-v213-body #atalhoLembrete h2,
      .df-v213-body #atalhoLancamento h2,
      .df-v213-body #atalhoLembrete .section-title-row,
      .df-v213-body #atalhoLancamento .section-title-row,
      .df-v212-body #atalhoLembrete h2,
      .df-v212-body #atalhoLancamento h2,
      .df-v21-body #atalhoLembrete h2,
      .df-v21-body #atalhoLancamento h2 {
        display:none !important;
      }

      .df-v213-body input,
      .df-v213-body textarea,
      .df-v213-body select,
      .df-v21-body input,
      .df-v21-body textarea,
      .df-v21-body select {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        width:100% !important;
        min-height:44px !important;
        box-sizing:border-box !important;
        margin-bottom:10px !important;
      }

      .df-v213-body button,
      .df-v21-body button {
        display:flex !important;
        visibility:visible !important;
        opacity:1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removerOcultos(el){
    if(!el) return;
    const all = [el, ...Array.from(el.querySelectorAll("*"))];

    all.forEach(node => {
      if(node.classList){
        [
          "df-v21-hidden",
          "df-v212-hidden",
          "df-v213-hidden",
          "df-v2041-hidden",
          "df-v2042-hidden",
          "df-v2044-hidden",
          "df-hidden-v203",
          "df-hidden-v204",
          "df-v206-hidden",
          "df-v208-hidden",
          "is-collapsed"
        ].forEach(c => node.classList.remove(c));
      }

      if(node.style){
        if(node.style.display === "none") node.style.display = "";
        node.style.visibility = "";
        node.style.opacity = "";
      }
    });

    el.querySelectorAll(".collapsible-body").forEach(body => {
      body.style.display = "block";
      body.style.visibility = "visible";
      body.style.opacity = "1";
    });
  }

  function corrigirFormDentroPopup(){
    css();

    ["atalhoLembrete", "atalhoLancamento"].forEach(id => {
      const form = document.getElementById(id);
      if(!form) return;

      const dentroPopup = form.closest(".df-v213-body,.df-v212-body,.df-v21-body");
      if(dentroPopup){
        removerOcultos(form);
        form.classList.remove("is-collapsed");
        form.style.display = "block";

        const body = form.querySelector(".collapsible-body");
        if(body) body.style.display = "block";
      }
    });
  }

  // Sobrescreve/acompanha abertura de modal sem depender da versão anterior
  function abrirFormSeguro(tipo, titulo){
    css();

    const form = document.getElementById(tipo === "nota" ? "atalhoLembrete" : "atalhoLancamento");
    if(!form){
      alert(tipo === "nota" ? "Formulário de nota não encontrado." : "Formulário de conta não encontrado.");
      return;
    }

    let modal = document.getElementById("df-v214-modal");
    if(!modal){
      modal = document.createElement("div");
      modal.id = "df-v214-modal";
      modal.className = "df-v213-modal";
      modal.innerHTML = `
        <div class="df-v213-box">
          <div class="df-v213-head">
            <div class="df-v213-title"></div>
            <button type="button" class="df-v213-close">×</button>
          </div>
          <div class="df-v213-body"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".df-v213-close").onclick = () => fecharV214();
      modal.onclick = (e) => { if(e.target === modal) fecharV214(); };
    }

    modal.querySelector(".df-v213-title").textContent = titulo;
    const body = modal.querySelector(".df-v213-body");
    body.innerHTML = "";
    body.appendChild(form);

    removerOcultos(form);
    form.style.display = "block";
    modal.classList.add("open");

    setTimeout(() => {
      corrigirFormDentroPopup();
      const first = form.querySelector("input,textarea,select");
      if(first) first.focus();
    }, 120);
  }

  function fecharV214(){
    const modal = document.getElementById("df-v214-modal");
    if(modal) modal.classList.remove("open");

    let parking = document.getElementById("df-v213-parking");
    if(!parking){
      parking = document.createElement("div");
      parking.id = "df-v213-parking";
      parking.style.display = "none";
      document.body.appendChild(parking);
    }

    ["atalhoLembrete","atalhoLancamento"].forEach(id => {
      const form = document.getElementById(id);
      if(form && form.closest("#df-v214-modal")){
        parking.appendChild(form);
      }
    });
  }

  function interceptarBotoesPlus(){
    document.addEventListener("click", function(e){
      const btn = e.target.closest("button");
      if(!btn) return;

      const isPlus = txt(btn) === "+";
      if(!isPlus) return;

      const blocoNotas = btn.closest(".card,section,article,div")?.innerText?.toLowerCase().includes("bloco de notas");
      const contasPagar = btn.closest(".card,section,article,div")?.innerText?.toLowerCase().includes("contas a pagar");

      if(blocoNotas || btn.title?.toLowerCase().includes("nota")){
        e.preventDefault();
        e.stopPropagation();
        if(typeof limparCamposNotaDF === "function") {
          try { limparCamposNotaDF(); } catch(err){}
        }
        abrirFormSeguro("nota", "Lançamento de notas");
      } else if(contasPagar || btn.title?.toLowerCase().includes("conta")){
        e.preventDefault();
        e.stopPropagation();
        if(typeof cancelarEdicaoContaDF === "function") {
          try { cancelarEdicaoContaDF(); } catch(err){}
        }
        abrirFormSeguro("conta", "Lançamento de contas");
      }
    }, true);
  }

  function interceptarEditar(){
    const oldConta = window.editarContaDF;
    window.editarContaDF = function(id){
      try { if(typeof oldConta === "function") oldConta(id); } catch(e){}
      setTimeout(() => abrirFormSeguro("conta", "Editar conta"), 100);
    };

    const oldNota = window.editarNotaDF;
    window.editarNotaDF = function(id){
      try { if(typeof oldNota === "function") oldNota(id); } catch(e){}
      setTimeout(() => abrirFormSeguro("nota", "Editar nota"), 100);
    };
  }

  function aplicar(){
    css();
    corrigirFormDentroPopup();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, {once:true});
  }else{
    aplicar();
  }

  interceptarBotoesPlus();
  interceptarEditar();

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.5 MENU + CONFIGURAÇÕES + SUBMENUS
   Correções:
   - Ao abrir Configurações, fecha o menu lateral no mobile
   - Restaura submenus do menu lateral
   - Mantém pop-up visível da V21.4
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V215_MENU_CONFIG__) return;
  window.__DONA_FLOR_V215_MENU_CONFIG__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function injectCss(){
    if(document.getElementById("df-v215-menu-css")) return;

    const style = document.createElement("style");
    style.id = "df-v215-menu-css";
    style.textContent = `
      /* Restaura submenus escondidos por versões anteriores */
      nav .df-hidden-v203,
      nav .df-hidden-v204,
      nav .df-v208-hidden,
      nav .df-v206-hidden,
      nav .df-v2041-hidden,
      nav .df-v2042-hidden,
      nav .df-v2044-hidden,
      nav .df-v21-hidden,
      nav .df-v212-hidden,
      nav .df-v213-hidden,
      nav .df-v214-hidden,
      aside .df-hidden-v203,
      aside .df-hidden-v204,
      aside .df-v208-hidden,
      aside .df-v206-hidden,
      aside .df-v2041-hidden,
      aside .df-v2042-hidden,
      aside .df-v2044-hidden,
      aside .df-v21-hidden,
      aside .df-v212-hidden,
      aside .df-v213-hidden,
      aside .df-v214-hidden,
      .sidebar .df-hidden-v203,
      .sidebar .df-hidden-v204,
      .sidebar .df-v208-hidden,
      .sidebar .df-v206-hidden,
      .sidebar .df-v2041-hidden,
      .sidebar .df-v2042-hidden,
      .sidebar .df-v2044-hidden,
      .sidebar .df-v21-hidden,
      .sidebar .df-v212-hidden,
      .sidebar .df-v213-hidden,
      .sidebar .df-v214-hidden,
      .menu .df-hidden-v203,
      .menu .df-hidden-v204,
      .menu .df-v208-hidden,
      .menu .df-v206-hidden,
      .menu .df-v2041-hidden,
      .menu .df-v2042-hidden,
      .menu .df-v2044-hidden,
      .menu .df-v21-hidden,
      .menu .df-v212-hidden,
      .menu .df-v213-hidden,
      .menu .df-v214-hidden,
      [class*="side"] .df-hidden-v203,
      [class*="side"] .df-hidden-v204,
      [class*="side"] .df-v208-hidden,
      [class*="side"] .df-v206-hidden,
      [class*="side"] .df-v2041-hidden,
      [class*="side"] .df-v2042-hidden,
      [class*="side"] .df-v2044-hidden,
      [class*="side"] .df-v21-hidden,
      [class*="side"] .df-v212-hidden,
      [class*="side"] .df-v213-hidden,
      [class*="side"] .df-v214-hidden {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Mantém os formulários estacionados escondidos */
      #df-v213-parking,
      #df-v213-parking #atalhoLancamento,
      #df-v213-parking #atalhoLembrete {
        display: none !important;
      }

      /* Configurações acima de tudo */
      #configModal,
      .config-modal-bg,
      .config-modal {
        z-index: 1000001 !important;
      }

      /* Quando configurações abrir, evita menu cobrindo a tela */
      body.df-config-open .sidebar,
      body.df-config-open aside,
      body.df-config-open nav.mobile-menu,
      body.df-config-open .mobile-menu {
        transform: translateX(-110%) !important;
      }

      body.df-config-open .sidebar.open,
      body.df-config-open .sidebar.active,
      body.df-config-open aside.open,
      body.df-config-open aside.active {
        transform: translateX(-110%) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function restaurarSubmenus(){
    const nomes = [
      "contas a pagar",
      "lançamento",
      "lancamento",
      "lançamento de contas",
      "lancamento de contas",
      "lançamento de notas",
      "lancamento de notas",
      "lembretes",
      "notas",
      "gestão de usuários",
      "gestao de usuarios",
      "usuários cadastrados",
      "usuarios cadastrados",
      "permissões por loja",
      "permissoes por loja",
      "lixeira",
      "contas excluídas",
      "contas excluidas",
      "notas excluídas",
      "notas excluidas",
      "configurações",
      "configuracoes",
      "notificações",
      "notificacoes",
      "configuração de e-mail",
      "configuracao de e-mail",
      "geral"
    ];

    document.querySelectorAll("nav *, aside *, .sidebar *, .menu *, [class*='side'] *").forEach(el => {
      const t = txt(el).toLowerCase();
      if(nomes.includes(t)){
        [
          "df-hidden-v203","df-hidden-v204","df-v208-hidden","df-v206-hidden",
          "df-v2041-hidden","df-v2042-hidden","df-v2044-hidden",
          "df-v21-hidden","df-v212-hidden","df-v213-hidden","df-v214-hidden"
        ].forEach(c => el.classList.remove(c));

        if(el.style){
          if(el.style.display === "none") el.style.display = "";
          el.style.visibility = "";
          el.style.opacity = "";
        }
      }
    });
  }

  function fecharMenuMobile(){
    try{
      if(typeof fecharMenuMobileDF === "function"){
        fecharMenuMobileDF();
      }
    }catch(e){}

    document.querySelectorAll(".sidebar, aside, nav.mobile-menu, .mobile-menu, .drawer, .side-menu").forEach(el => {
      el.classList.remove("open","active","show","is-open");
      if(el.style){
        // só mexe se estiver em modo mobile / overlay
        if(window.innerWidth <= 900){
          el.style.transform = "";
        }
      }
    });

    document.querySelectorAll(".overlay,.menu-overlay,.backdrop").forEach(el => {
      el.classList.remove("open","active","show");
      if(window.innerWidth <= 900 && el.style.display === "block") el.style.display = "none";
    });
  }

  function marcarConfigAberta(){
    const modal = document.getElementById("configModal") || document.querySelector(".config-modal-bg");
    if(!modal) return;
    const aberto = modal.style.display === "flex" || modal.classList.contains("open") || modal.classList.contains("show") || getComputedStyle(modal).display !== "none";
    document.body.classList.toggle("df-config-open", aberto);
  }

  function interceptarConfiguracoes(){
    const oldAbrir = window.abrirConfiguracoes;
    window.abrirConfiguracoes = function(){
      fecharMenuMobile();
      document.body.classList.add("df-config-open");
      if(typeof oldAbrir === "function"){
        return oldAbrir.apply(this, arguments);
      }
      const modal = document.getElementById("configModal") || document.querySelector(".config-modal-bg");
      if(modal) modal.style.display = "flex";
    };

    const oldFechar = window.fecharConfiguracoes;
    window.fecharConfiguracoes = function(){
      document.body.classList.remove("df-config-open");
      if(typeof oldFechar === "function"){
        return oldFechar.apply(this, arguments);
      }
      const modal = document.getElementById("configModal") || document.querySelector(".config-modal-bg");
      if(modal) modal.style.display = "none";
    };

    document.addEventListener("click", function(e){
      const alvo = e.target.closest("button,a,div,span,li");
      if(!alvo) return;
      const t = txt(alvo).toLowerCase();

      if(t === "configurações" || t === "configuracoes" || t.includes("configurações") || t.includes("configuracoes")){
        setTimeout(function(){
          fecharMenuMobile();
          document.body.classList.add("df-config-open");
          marcarConfigAberta();
        }, 50);
      }
    }, true);
  }

  function aplicar(){
    injectCss();
    restaurarSubmenus();
    marcarConfigAberta();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, {once:true});
  }else{
    aplicar();
  }

  interceptarConfiguracoes();

  setTimeout(aplicar, 600);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.6 BOTÃO SAIR RESTAURADO
   Correções:
   - Restaura botão Sair no menu lateral
   - Garante que submenus continuam visíveis
   - Botão Sair não fica escondido por classes hidden
   - Configurações continua fechando o menu no mobile
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V216_BOTAO_SAIR__) return;
  window.__DONA_FLOR_V216_BOTAO_SAIR__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function injectCss(){
    if(document.getElementById("df-v216-sair-css")) return;

    const style = document.createElement("style");
    style.id = "df-v216-sair-css";
    style.textContent = `
      /* Sair sempre visível no menu */
      .df-v216-sair,
      nav .df-v216-sair,
      aside .df-v216-sair,
      .sidebar .df-v216-sair,
      .menu .df-v216-sair {
        display:flex !important;
        visibility:visible !important;
        opacity:1 !important;
        align-items:center !important;
        gap:12px !important;
        width:100% !important;
        min-height:44px !important;
        padding:12px 16px !important;
        background:transparent !important;
        color:#111827 !important;
        border:0 !important;
        box-shadow:none !important;
        font-weight:800 !important;
        text-align:left !important;
        cursor:pointer !important;
      }

      .df-v216-sair-ico {
        width:26px !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        font-size:20px !important;
      }

      /* Restaura itens escondidos do menu lateral */
      nav .df-hidden-v203,
      nav .df-hidden-v204,
      nav .df-v208-hidden,
      nav .df-v206-hidden,
      nav .df-v2041-hidden,
      nav .df-v2042-hidden,
      nav .df-v2044-hidden,
      nav .df-v21-hidden,
      nav .df-v212-hidden,
      nav .df-v213-hidden,
      aside .df-hidden-v203,
      aside .df-hidden-v204,
      aside .df-v208-hidden,
      aside .df-v206-hidden,
      aside .df-v2041-hidden,
      aside .df-v2042-hidden,
      aside .df-v2044-hidden,
      aside .df-v21-hidden,
      aside .df-v212-hidden,
      aside .df-v213-hidden,
      .sidebar .df-hidden-v203,
      .sidebar .df-hidden-v204,
      .sidebar .df-v208-hidden,
      .sidebar .df-v206-hidden,
      .sidebar .df-v2041-hidden,
      .sidebar .df-v2042-hidden,
      .sidebar .df-v2044-hidden,
      .sidebar .df-v21-hidden,
      .sidebar .df-v212-hidden,
      .sidebar .df-v213-hidden {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
      }

      /* Mas mantém formulários estacionados escondidos */
      #df-v213-parking,
      #df-v213-parking #atalhoLancamento,
      #df-v213-parking #atalhoLembrete {
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function chamarSair(){
    try{
      if(typeof sair === "function") return sair();
      if(typeof logout === "function") return logout();
      if(typeof deslogar === "function") return deslogar();
      if(typeof sairDF === "function") return sairDF();
      if(typeof logoutDF === "function") return logoutDF();
    }catch(e){}

    try{
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("df_usuario_logado");
      sessionStorage.clear();
    }catch(e){}

    const login = document.getElementById("login");
    const app = document.getElementById("app");
    if(app) app.style.display = "none";
    if(login) login.style.display = "flex";
    location.reload();
  }

  function encontrarMenu(){
    return document.querySelector(".sidebar") ||
           document.querySelector("aside") ||
           document.querySelector("nav") ||
           document.querySelector(".menu") ||
           document.querySelector("[class*='side']");
  }

  function restaurarSair(){
    injectCss();

    const menu = encontrarMenu();
    if(!menu) return;

    // se já existir item sair, só restaura visibilidade
    const existente = Array.from(menu.querySelectorAll("button,a,div,li,span"))
      .find(el => /^↩?\s*Sair$/i.test(txt(el)) || /^sair$/i.test(txt(el)));

    if(existente){
      existente.classList.add("df-v216-sair");
      existente.classList.remove(
        "df-hidden-v203","df-hidden-v204","df-v208-hidden","df-v206-hidden",
        "df-v2041-hidden","df-v2042-hidden","df-v2044-hidden",
        "df-v21-hidden","df-v212-hidden","df-v213-hidden"
      );
      if(existente.style){
        existente.style.display = "";
        existente.style.visibility = "";
        existente.style.opacity = "";
      }
      if(!existente.dataset.dfSairOk){
        existente.dataset.dfSairOk = "1";
        existente.addEventListener("click", function(e){
          e.preventDefault();
          e.stopPropagation();
          chamarSair();
        }, true);
      }
      return;
    }

    // cria botão sair no fim do menu
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-v216-sair";
    btn.innerHTML = `<span class="df-v216-sair-ico">↩</span><span>Sair</span>`;
    btn.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      chamarSair();
    }, true);

    menu.appendChild(btn);
  }

  function restaurarSubmenus(){
    const nomes = [
      "contas a pagar","lançamento","lancamento","lembretes",
      "gestão de usuários","gestao de usuarios","lixeira",
      "configurações","configuracoes","notificações","notificacoes",
      "configuração de e-mail","configuracao de e-mail","sair"
    ];

    document.querySelectorAll("nav *, aside *, .sidebar *, .menu *, [class*='side'] *").forEach(el => {
      const t = txt(el).toLowerCase();
      if(nomes.includes(t)){
        el.classList.remove(
          "df-hidden-v203","df-hidden-v204","df-v208-hidden","df-v206-hidden",
          "df-v2041-hidden","df-v2042-hidden","df-v2044-hidden",
          "df-v21-hidden","df-v212-hidden","df-v213-hidden"
        );
        if(el.style){
          if(el.style.display === "none") el.style.display = "";
          el.style.visibility = "";
          el.style.opacity = "";
        }
      }
    });
  }

  function aplicar(){
    injectCss();
    restaurarSubmenus();
    restaurarSair();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, {once:true});
  }else{
    aplicar();
  }

  setTimeout(aplicar, 600);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.7 RELATÓRIO FINAL CORRIGIDO
   Correções:
   - Não usa mais pop-up/nova aba para relatório
   - Relatório abre em tela/modal dentro do app
   - Botão Imprimir/PDF funciona no celular
   - CSV funciona separado
   - Evita tela em branco e bloqueio de pop-up
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V217_RELATORIO_FINAL__) return;
  window.__DONA_FLOR_V217_RELATORIO_FINAL__ = true;

  function moeda(v){
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function getContasRelatorioDF(){
    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof filtroContas === "function"){
        const r = filtroContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    const nomes = ["contas", "contasDados", "df_contas", "contasDF"];
    for(const n of nomes){
      try{
        if(Array.isArray(window[n])) return window[n].filter(c => !c.deletado);
      }catch(e){}
    }

    return [];
  }

  function resumo(contas){
    const hoje = new Date().toISOString().slice(0,10);
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);
    const venceHoje = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) === hoje);

    return {
      qtd: contas.length,
      abertas: abertas.length,
      pagas: pagas.length,
      vencidas: vencidas.length,
      venceHoje: venceHoje.length,
      total: contas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalHoje: venceHoje.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd += 1;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function css(){
    if(document.getElementById("df-v217-relatorio-css")) return;
    const style = document.createElement("style");
    style.id = "df-v217-relatorio-css";
    style.textContent = `
      .df-v217-report-bg{
        position:fixed!important;
        inset:0!important;
        z-index:1000002!important;
        background:rgba(15,23,42,.65)!important;
        display:none!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        box-sizing:border-box!important;
      }

      .df-v217-report-bg.open{display:flex!important;}

      .df-v217-report{
        width:100%!important;
        max-width:980px!important;
        max-height:92vh!important;
        overflow:auto!important;
        background:#fff!important;
        border:2px solid #000!important;
        border-radius:18px!important;
        box-shadow:6px 6px 0 #000!important;
        padding:18px!important;
        box-sizing:border-box!important;
        color:#0f172a!important;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }

      .df-v217-report-top{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:12px!important;
        border-bottom:1px solid #e2e8f0!important;
        padding-bottom:12px!important;
        margin-bottom:14px!important;
      }

      .df-v217-report h1{
        margin:0!important;
        font-size:24px!important;
        line-height:1.1!important;
        font-weight:950!important;
        color:#0f766e!important;
      }

      .df-v217-sub{color:#64748b!important;margin-top:4px!important;font-size:13px!important;}

      .df-v217-actions{
        display:flex!important;
        flex-wrap:wrap!important;
        gap:8px!important;
        justify-content:flex-end!important;
      }

      .df-v217-actions button{
        min-height:38px!important;
        border-radius:10px!important;
        border:2px solid #000!important;
        box-shadow:3px 3px 0 #000!important;
        background:#0f766e!important;
        color:#fff!important;
        font-weight:900!important;
        padding:8px 12px!important;
        cursor:pointer!important;
      }

      .df-v217-actions .light{
        background:#fff!important;
        color:#000!important;
      }

      .df-v217-cards{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:10px!important;
        margin:14px 0!important;
      }

      .df-v217-card{
        background:#fafaf9!important;
        border:1px solid #e2e8f0!important;
        border-radius:14px!important;
        padding:12px!important;
      }

      .df-v217-label{
        font-size:11px!important;
        text-transform:uppercase!important;
        color:#64748b!important;
        font-weight:950!important;
      }

      .df-v217-num{
        font-size:19px!important;
        font-weight:950!important;
        margin-top:3px!important;
      }

      .df-v217-centros{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin:10px 0 16px!important;
      }

      .df-v217-centro{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fff!important;
      }

      .df-v217-centro small{display:block!important;color:#64748b!important;margin-top:2px!important;}

      .df-v217-table-wrap{overflow:auto!important;border-radius:12px!important;border:1px solid #e2e8f0!important;}
      .df-v217-table{width:100%!important;border-collapse:collapse!important;font-size:13px!important;}
      .df-v217-table th{
        background:#0f766e!important;
        color:#fff!important;
        text-align:left!important;
        padding:9px!important;
        white-space:nowrap!important;
      }
      .df-v217-table td{
        border-bottom:1px solid #e2e8f0!important;
        padding:9px!important;
        vertical-align:top!important;
      }
      .df-v217-value{font-weight:950!important;white-space:nowrap!important;}
      .df-v217-status{
        display:inline-block!important;
        border-radius:999px!important;
        padding:4px 8px!important;
        font-weight:900!important;
        font-size:12px!important;
      }
      .df-v217-status.pago{background:#dcfce7!important;color:#15803d!important;}
      .df-v217-status.aberto{background:#fef3c7!important;color:#92400e!important;}
      .df-v217-empty{
        padding:18px!important;
        border:1px dashed #cbd5e1!important;
        border-radius:12px!important;
        color:#64748b!important;
        text-align:center!important;
      }

      @media(max-width:760px){
        .df-v217-report{padding:14px!important;border-radius:16px!important;}
        .df-v217-report-top{display:block!important;}
        .df-v217-actions{justify-content:flex-start!important;margin-top:10px!important;}
        .df-v217-cards{grid-template-columns:1fr 1fr!important;}
        .df-v217-centros{grid-template-columns:1fr!important;}
        .df-v217-table{font-size:12px!important;}
      }

      @media print{
        body *{visibility:hidden!important;}
        #df-v217-report-bg,
        #df-v217-report-bg *{visibility:visible!important;}
        #df-v217-report-bg{
          position:absolute!important;
          inset:0!important;
          display:block!important;
          background:#fff!important;
          padding:0!important;
        }
        .df-v217-report{
          max-height:none!important;
          overflow:visible!important;
          box-shadow:none!important;
          border:0!important;
          border-radius:0!important;
          max-width:none!important;
          padding:0!important;
        }
        .df-v217-actions{display:none!important;}
        @page{margin:12mm;}
      }
    `;
    document.head.appendChild(style);
  }

  function montarRelatorioHTML(){
    const contas = getContasRelatorioDF();
    const r = resumo(contas);
    const centros = porCentro(contas);
    const agora = new Date().toLocaleString("pt-BR");

    const centroHTML = centros.length ? centros.map(([centro, info]) => `
      <div class="df-v217-centro">
        <div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div>
        <b>${moeda(info.total)}</b>
      </div>
    `).join("") : `<div class="df-v217-empty">Nenhum centro encontrado.</div>`;

    const linhas = contas.map(c => {
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="df-v217-status ${pago ? "pago" : "aberto"}">${esc(status)}</span></td>
          <td class="df-v217-value">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="df-v217-report-top">
        <div>
          <h1>Dona Flor Gestão Financeira</h1>
          <div class="df-v217-sub">Relatório financeiro • Gerado em ${esc(agora)}</div>
        </div>
        <div class="df-v217-actions">
          <button type="button" onclick="window.print()">Imprimir/PDF</button>
          <button type="button" onclick="window.exportarCSVDF217()">CSV</button>
          <button type="button" class="light" onclick="window.fecharRelatorioDF217()">Fechar</button>
        </div>
      </div>

      <div class="df-v217-cards">
        <div class="df-v217-card"><div class="df-v217-label">Quantidade</div><div class="df-v217-num">${r.qtd}</div></div>
        <div class="df-v217-card"><div class="df-v217-label">Total aberto</div><div class="df-v217-num">${moeda(r.totalAberto)}</div></div>
        <div class="df-v217-card"><div class="df-v217-label">Pago</div><div class="df-v217-num">${moeda(r.totalPago)}</div></div>
        <div class="df-v217-card"><div class="df-v217-label">Vencidas</div><div class="df-v217-num">${moeda(r.totalVencido)}</div></div>
      </div>

      <h2>Resumo por centro</h2>
      <div class="df-v217-centros">${centroHTML}</div>

      <h2>Detalhamento</h2>
      ${contas.length ? `
        <div class="df-v217-table-wrap">
          <table class="df-v217-table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Centro</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      ` : `<div class="df-v217-empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    `;
  }

  function abrirRelatorioDF217(){
    css();
    let bg = document.getElementById("df-v217-report-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v217-report-bg";
      bg.className = "df-v217-report-bg";
      bg.innerHTML = `<div class="df-v217-report" id="df-v217-report"></div>`;
      document.body.appendChild(bg);

      bg.addEventListener("click", function(e){
        if(e.target === bg) window.fecharRelatorioDF217();
      });
    }

    const box = document.getElementById("df-v217-report");
    box.innerHTML = montarRelatorioHTML();
    bg.classList.add("open");
  }

  window.fecharRelatorioDF217 = function(){
    const bg = document.getElementById("df-v217-report-bg");
    if(bg) bg.classList.remove("open");
  };

  window.exportarCSVDF217 = function(){
    const contas = getContasRelatorioDF();
    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  window.gerarRelatorioFinanceiroDF = abrirRelatorioDF217;

  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio");
    const acao = sel ? sel.value : "";

    if(acao === "pdf"){
      abrirRelatorioDF217();
    }else if(acao === "csv"){
      window.exportarCSVDF217();
    }

    if(sel) sel.value = "";
  };

  function bindSelect(){
    const sel = document.getElementById("acaoRelatorio");
    if(!sel || sel.dataset.df217Bound) return;

    sel.dataset.df217Bound = "1";
    sel.addEventListener("change", function(e){
      e.preventDefault();
      e.stopPropagation();
      window.executarRelatorio();
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindSelect, {once:true});
  }else{
    bindSelect();
  }

  setTimeout(bindSelect, 700);
  setTimeout(bindSelect, 1600);
  setTimeout(bindSelect, 3200);
})();




/* ==========================================================
   DONA FLOR - V21.8 FECHAMENTO DE POP-UP CORRIGIDO
   Correções:
   - Fecha pop-up ao salvar conta/nota/alteração
   - Fecha ao clicar fora da caixa branca
   - Remove tela escura presa na frente
   - Devolve formulários para estacionamento oculto
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V218_POPUP_CLOSE_FIX__) return;
  window.__DONA_FLOR_V218_POPUP_CLOSE_FIX__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function parking(){
    let p = document.getElementById("df-v213-parking");
    if(!p){
      p = document.createElement("div");
      p.id = "df-v213-parking";
      p.style.display = "none";
      document.body.appendChild(p);
    }
    return p;
  }

  function devolverForms(){
    const p = parking();

    ["atalhoLancamento", "atalhoLembrete"].forEach(id => {
      const form = document.getElementById(id);
      if(form && (
        form.closest(".df-v213-modal") ||
        form.closest(".df-v214-modal") ||
        form.closest(".df-v212-modal") ||
        form.closest(".df-v21-modal") ||
        form.closest("#df-v214-modal") ||
        form.closest("#df-v213-modal") ||
        form.closest("#df-v212-modal")
      )){
        p.appendChild(form);
      }
    });
  }

  function fecharPopupsFormulario(){
    devolverForms();

    [
      "df-v213-modal",
      "df-v214-modal",
      "df-v212-modal",
      "df-v21-modal-nota",
      "df-v21-modal-conta",
      "df-v2044-modal-nota",
      "df-v2044-modal-conta",
      "df-v2042-popup-nota",
      "df-modal-notas-v203",
      "df-modal-conta-v204"
    ].forEach(id => {
      const modal = document.getElementById(id);
      if(modal){
        modal.classList.remove("open", "show", "active");
        modal.style.display = "none";
      }
    });

    document.querySelectorAll(".df-v213-modal,.df-v214-modal,.df-v212-modal,.df-v21-modal,.df-v2044-modal,.df-v2042-overlay").forEach(modal => {
      modal.classList.remove("open", "show", "active");
      modal.style.display = "none";
    });

    document.body.classList.remove("modal-open", "df-modal-open");
  }

  window.fecharPopupDonaFlor = fecharPopupsFormulario;

  function bindCliqueFora(){
    document.addEventListener("click", function(e){
      const modal = e.target.closest(".df-v213-modal,.df-v214-modal,.df-v212-modal,.df-v21-modal,#df-v213-modal,#df-v214-modal,#df-v212-modal");

      // Clique exatamente no fundo escuro
      if(modal && e.target === modal){
        e.preventDefault();
        e.stopPropagation();
        fecharPopupsFormulario();
        return;
      }

      // Clique em X de qualquer modal
      const closeBtn = e.target.closest(".df-v213-close,.df-v214-close,.df-v212-close,.df-v21-close");
      if(closeBtn){
        e.preventDefault();
        e.stopPropagation();
        fecharPopupsFormulario();
        return;
      }
    }, true);
  }

  function bindSalvarFecha(){
    document.addEventListener("click", function(e){
      const btn = e.target.closest("button,input[type='button'],input[type='submit']");
      if(!btn) return;

      const texto = (txt(btn) || btn.value || "").toLowerCase();

      const dentroPopup = btn.closest(".df-v213-modal,.df-v214-modal,.df-v212-modal,.df-v21-modal,#df-v213-modal,#df-v214-modal,#df-v212-modal");

      if(!dentroPopup) return;

      const ehSalvar =
        texto.includes("salvar conta") ||
        texto.includes("salvar nota") ||
        texto.includes("salvar alteração") ||
        texto.includes("salvar alteracao") ||
        texto === "salvar";

      if(ehSalvar){
        setTimeout(function(){
          fecharPopupsFormulario();
        }, 1200);
      }
    }, true);
  }

  function fecharTelaEscuraOrfa(){
    const aberto = document.querySelector(".df-v213-modal.open,.df-v214-modal.open,.df-v212-modal.open,.df-v21-modal.open,#df-v213-modal.open,#df-v214-modal.open,#df-v212-modal.open");
    if(!aberto) return;

    const box = aberto.querySelector(".df-v213-box,.df-v214-box,.df-v212-box,.df-v21-box");
    const body = aberto.querySelector(".df-v213-body,.df-v214-body,.df-v212-body,.df-v21-body");

    // se o overlay ficou sem corpo/formulário, fecha automaticamente
    if(body && body.children.length === 0){
      fecharPopupsFormulario();
      return;
    }

    // se não tiver caixa branca válida, fecha
    if(!box){
      fecharPopupsFormulario();
    }
  }

  function css(){
    if(document.getElementById("df-v218-popup-close-css")) return;

    const style = document.createElement("style");
    style.id = "df-v218-popup-close-css";
    style.textContent = `
      #df-v213-parking,
      #df-v213-parking #atalhoLancamento,
      #df-v213-parking #atalhoLembrete {
        display:none !important;
      }

      .df-v213-modal:not(.open),
      .df-v214-modal:not(.open),
      .df-v212-modal:not(.open),
      .df-v21-modal:not(.open) {
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  css();
  /* V22: bindCliqueFora removido para não fechar ao abrir teclado */
  bindSalvarFecha();

  /* V22: fechamento órfão removido para não fechar com teclado */
})();




/* ==========================================================
   DONA FLOR - V21.9 RELATÓRIO COM FILTROS + CSV
   Correções:
   - CSV funcionando
   - Antes de imprimir/PDF, abre tela com filtros do relatório
   - Filtros: centro, status, período, tipo de data e opções de conteúdo
   - Gera relatório filtrado dentro do app
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V219_RELATORIO_FILTROS__) return;
  window.__DONA_FLOR_V219_RELATORIO_FILTROS__ = true;

  let filtrosAtuais = null;

  function moeda(v){
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function hojeISO(){
    return new Date().toISOString().slice(0,10);
  }

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function getContasBase(){
    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    const nomes = ["contas", "contasDados", "df_contas", "contasDF"];
    for(const n of nomes){
      try{
        if(Array.isArray(window[n])) return window[n].filter(c => !c.deletado);
      }catch(e){}
    }

    return [];
  }

  function centrosDisponiveis(){
    const set = new Set();
    getContasBase().forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja;
      if(centro) set.add(centro);
    });
    return Array.from(set).sort();
  }

  function filtrarContas(filtros){
    const f = filtros || {};
    return getContasBase().filter(c => {
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(f.centro && centro !== f.centro) return false;
      if(f.status && status !== f.status) return false;
      if(f.dataInicio && data && data < f.dataInicio) return false;
      if(f.dataFim && data && data > f.dataFim) return false;

      return true;
    });
  }

  function resumo(contas){
    const hoje = hojeISO();
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);
    const venceHoje = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) === hoje);

    return {
      qtd: contas.length,
      abertas: abertas.length,
      pagas: pagas.length,
      vencidas: vencidas.length,
      venceHoje: venceHoje.length,
      total: contas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalHoje: venceHoje.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd += 1;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function css(){
    if(document.getElementById("df-v219-relatorio-css")) return;
    const style = document.createElement("style");
    style.id = "df-v219-relatorio-css";
    style.textContent = `
      .df-v219-bg{
        position:fixed!important;
        inset:0!important;
        z-index:1000003!important;
        background:rgba(15,23,42,.65)!important;
        display:none!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        box-sizing:border-box!important;
      }
      .df-v219-bg.open{display:flex!important;}
      .df-v219-box{
        width:100%!important;
        max-width:980px!important;
        max-height:92vh!important;
        overflow:auto!important;
        background:#fff!important;
        border:2px solid #000!important;
        border-radius:18px!important;
        box-shadow:6px 6px 0 #000!important;
        padding:18px!important;
        box-sizing:border-box!important;
        color:#0f172a!important;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }
      .df-v219-top{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:12px!important;
        border-bottom:1px solid #e2e8f0!important;
        padding-bottom:12px!important;
        margin-bottom:14px!important;
      }
      .df-v219-title{
        margin:0!important;
        font-size:24px!important;
        line-height:1.1!important;
        font-weight:950!important;
        color:#0f766e!important;
      }
      .df-v219-sub{color:#64748b!important;margin-top:4px!important;font-size:13px!important;}
      .df-v219-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;justify-content:flex-end!important;}
      .df-v219-actions button,
      .df-v219-btn{
        min-height:40px!important;
        border-radius:10px!important;
        border:2px solid #000!important;
        box-shadow:3px 3px 0 #000!important;
        background:#0f766e!important;
        color:#fff!important;
        font-weight:900!important;
        padding:8px 12px!important;
        cursor:pointer!important;
      }
      .df-v219-actions .light,.df-v219-btn.light{background:#fff!important;color:#000!important;}
      .df-v219-actions .red,.df-v219-btn.red{background:#fee2e2!important;color:#991b1b!important;}
      .df-v219-grid{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:10px!important;
      }
      .df-v219-field label{
        display:block!important;
        font-size:12px!important;
        font-weight:900!important;
        color:#64748b!important;
        margin:0 0 4px!important;
        text-transform:uppercase!important;
      }
      .df-v219-field input,
      .df-v219-field select{
        width:100%!important;
        min-height:44px!important;
        border:1px solid #cbd5e1!important;
        border-radius:12px!important;
        padding:10px!important;
        box-sizing:border-box!important;
        font-size:15px!important;
        background:#fff!important;
      }
      .df-v219-checks{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin-top:12px!important;
      }
      .df-v219-check{
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fafaf9!important;
        font-weight:800!important;
      }
      .df-v219-check input{margin-right:8px!important;}
      .df-v219-cards{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:10px!important;
        margin:14px 0!important;
      }
      .df-v219-card{
        background:#fafaf9!important;
        border:1px solid #e2e8f0!important;
        border-radius:14px!important;
        padding:12px!important;
      }
      .df-v219-label{font-size:11px!important;text-transform:uppercase!important;color:#64748b!important;font-weight:950!important;}
      .df-v219-num{font-size:19px!important;font-weight:950!important;margin-top:3px!important;}
      .df-v219-centros{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin:10px 0 16px!important;
      }
      .df-v219-centro{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fff!important;
      }
      .df-v219-centro small{display:block!important;color:#64748b!important;margin-top:2px!important;}
      .df-v219-table-wrap{overflow:auto!important;border-radius:12px!important;border:1px solid #e2e8f0!important;}
      .df-v219-table{width:100%!important;border-collapse:collapse!important;font-size:13px!important;}
      .df-v219-table th{background:#0f766e!important;color:#fff!important;text-align:left!important;padding:9px!important;white-space:nowrap!important;}
      .df-v219-table td{border-bottom:1px solid #e2e8f0!important;padding:9px!important;vertical-align:top!important;}
      .df-v219-value{font-weight:950!important;white-space:nowrap!important;}
      .df-v219-status{display:inline-block!important;border-radius:999px!important;padding:4px 8px!important;font-weight:900!important;font-size:12px!important;}
      .df-v219-status.pago{background:#dcfce7!important;color:#15803d!important;}
      .df-v219-status.aberto{background:#fef3c7!important;color:#92400e!important;}
      .df-v219-empty{padding:18px!important;border:1px dashed #cbd5e1!important;border-radius:12px!important;color:#64748b!important;text-align:center!important;}
      @media(max-width:760px){
        .df-v219-box{padding:14px!important;border-radius:16px!important;}
        .df-v219-top{display:block!important;}
        .df-v219-actions{justify-content:flex-start!important;margin-top:10px!important;}
        .df-v219-grid,.df-v219-checks,.df-v219-centros{grid-template-columns:1fr!important;}
        .df-v219-cards{grid-template-columns:1fr 1fr!important;}
        .df-v219-table{font-size:12px!important;}
      }
      @media print{
        body *{visibility:hidden!important;}
        #df-v219-report-bg,#df-v219-report-bg *{visibility:visible!important;}
        #df-v219-report-bg{
          position:absolute!important;
          inset:0!important;
          display:block!important;
          background:#fff!important;
          padding:0!important;
        }
        #df-v219-report-bg .df-v219-box{
          max-height:none!important;
          overflow:visible!important;
          box-shadow:none!important;
          border:0!important;
          border-radius:0!important;
          max-width:none!important;
          padding:0!important;
        }
        .df-v219-actions{display:none!important;}
        @page{margin:12mm;}
      }
    `;
    document.head.appendChild(style);
  }

  function valoresFiltros(){
    return {
      centro: document.getElementById("df219Centro")?.value || "",
      status: document.getElementById("df219Status")?.value || "",
      dataInicio: document.getElementById("df219Inicio")?.value || "",
      dataFim: document.getElementById("df219Fim")?.value || "",
      mostrarResumo: document.getElementById("df219Resumo")?.checked !== false,
      mostrarCentro: document.getElementById("df219CentroResumo")?.checked !== false,
      mostrarDetalhe: document.getElementById("df219Detalhe")?.checked !== false,
      somenteAberto: document.getElementById("df219SomenteAberto")?.checked || false
    };
  }

  function contasComFiltros(f){
    let contas = filtrarContas(f);
    if(f?.somenteAberto){
      contas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    }
    return contas;
  }

  function abrirFiltrosRelatorio(){
    css();
    let bg = document.getElementById("df-v219-filter-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v219-filter-bg";
      bg.className = "df-v219-bg";
      document.body.appendChild(bg);
      bg.addEventListener("click", function(e){
        if(e.target === bg) fecharFiltros();
      });
    }

    const centros = centrosDisponiveis().map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    bg.innerHTML = `
      <div class="df-v219-box">
        <div class="df-v219-top">
          <div>
            <h1 class="df-v219-title">Filtros do relatório</h1>
            <div class="df-v219-sub">Escolha exatamente o que deseja imprimir/exportar.</div>
          </div>
          <div class="df-v219-actions">
            <button type="button" class="light" onclick="window.fecharFiltrosRelatorioDF219()">Fechar</button>
          </div>
        </div>

        <div class="df-v219-grid">
          <div class="df-v219-field">
            <label>Centro</label>
            <select id="df219Centro">
              <option value="">Todos os centros</option>
              ${centros}
            </select>
          </div>

          <div class="df-v219-field">
            <label>Status</label>
            <select id="df219Status">
              <option value="">Todos os status</option>
              <option value="Aberto">Aberto</option>
              <option value="Pago">Pago</option>
            </select>
          </div>

          <div class="df-v219-field">
            <label>Data inicial</label>
            <input id="df219Inicio" type="date">
          </div>

          <div class="df-v219-field">
            <label>Data final</label>
            <input id="df219Fim" type="date">
          </div>
        </div>

        <div class="df-v219-checks">
          <label class="df-v219-check"><input id="df219Resumo" type="checkbox" checked> Mostrar resumo financeiro</label>
          <label class="df-v219-check"><input id="df219CentroResumo" type="checkbox" checked> Mostrar resumo por centro</label>
          <label class="df-v219-check"><input id="df219Detalhe" type="checkbox" checked> Mostrar detalhamento</label>
          <label class="df-v219-check"><input id="df219SomenteAberto" type="checkbox"> Somente contas em aberto</label>
        </div>

        <div class="df-v219-actions" style="margin-top:16px;justify-content:flex-start!important">
          <button type="button" onclick="window.visualizarRelatorioDF219()">Visualizar / PDF</button>
          <button type="button" onclick="window.exportarCSVDF219()">Exportar CSV</button>
          <button type="button" class="light" onclick="window.limparFiltrosRelatorioDF219()">Limpar filtros</button>
        </div>
      </div>
    `;

    bg.classList.add("open");
  }

  function fecharFiltros(){
    const bg = document.getElementById("df-v219-filter-bg");
    if(bg) bg.classList.remove("open");
  }

  window.fecharFiltrosRelatorioDF219 = fecharFiltros;

  window.limparFiltrosRelatorioDF219 = function(){
    ["df219Centro","df219Status","df219Inicio","df219Fim"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = "";
    });
    ["df219Resumo","df219CentroResumo","df219Detalhe"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.checked = true;
    });
    const aberto = document.getElementById("df219SomenteAberto");
    if(aberto) aberto.checked = false;
  };

  function montarRelatorioHTML(filtros){
    const contas = contasComFiltros(filtros);
    const r = resumo(contas);
    const centros = porCentro(contas);
    const agora = new Date().toLocaleString("pt-BR");

    const resumoHTML = filtros.mostrarResumo ? `
      <div class="df-v219-cards">
        <div class="df-v219-card"><div class="df-v219-label">Quantidade</div><div class="df-v219-num">${r.qtd}</div></div>
        <div class="df-v219-card"><div class="df-v219-label">Total aberto</div><div class="df-v219-num">${moeda(r.totalAberto)}</div></div>
        <div class="df-v219-card"><div class="df-v219-label">Pago</div><div class="df-v219-num">${moeda(r.totalPago)}</div></div>
        <div class="df-v219-card"><div class="df-v219-label">Vencidas</div><div class="df-v219-num">${moeda(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centroHTML = filtros.mostrarCentro ? `
      <h2>Resumo por centro</h2>
      <div class="df-v219-centros">
        ${centros.length ? centros.map(([centro, info]) => `
          <div class="df-v219-centro">
            <div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div>
            <b>${moeda(info.total)}</b>
          </div>
        `).join("") : `<div class="df-v219-empty">Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const linhas = contas.map(c => {
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="df-v219-status ${pago ? "pago" : "aberto"}">${esc(status)}</span></td>
          <td class="df-v219-value">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const detalheHTML = filtros.mostrarDetalhe ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <div class="df-v219-table-wrap">
          <table class="df-v219-table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Centro</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      ` : `<div class="df-v219-empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    const filtroDesc = [
      filtros.centro ? `Centro: ${filtros.centro}` : "Todos os centros",
      filtros.status ? `Status: ${filtros.status}` : "Todos os status",
      filtros.dataInicio ? `De ${dataBR(filtros.dataInicio)}` : "",
      filtros.dataFim ? `Até ${dataBR(filtros.dataFim)}` : "",
      filtros.somenteAberto ? "Somente em aberto" : ""
    ].filter(Boolean).join(" • ");

    return `
      <div class="df-v219-top">
        <div>
          <h1 class="df-v219-title">Dona Flor Gestão Financeira</h1>
          <div class="df-v219-sub">Relatório financeiro • Gerado em ${esc(agora)}</div>
          <div class="df-v219-sub">${esc(filtroDesc)}</div>
        </div>
        <div class="df-v219-actions">
          <button type="button" onclick="window.print()">Imprimir/PDF</button>
          <button type="button" onclick="window.exportarCSVDF219(true)">CSV</button>
          <button type="button" class="light" onclick="window.voltarFiltrosRelatorioDF219()">Filtros</button>
          <button type="button" class="light" onclick="window.fecharRelatorioDF219()">Fechar</button>
        </div>
      </div>
      ${resumoHTML}
      ${centroHTML}
      ${detalheHTML}
    `;
  }

  window.visualizarRelatorioDF219 = function(){
    filtrosAtuais = valoresFiltros();
    fecharFiltros();

    let bg = document.getElementById("df-v219-report-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v219-report-bg";
      bg.className = "df-v219-bg";
      bg.innerHTML = `<div class="df-v219-box" id="df-v219-report"></div>`;
      document.body.appendChild(bg);
      bg.addEventListener("click", function(e){
        if(e.target === bg) window.fecharRelatorioDF219();
      });
    }

    document.getElementById("df-v219-report").innerHTML = montarRelatorioHTML(filtrosAtuais);
    bg.classList.add("open");
  };

  window.fecharRelatorioDF219 = function(){
    const bg = document.getElementById("df-v219-report-bg");
    if(bg) bg.classList.remove("open");
  };

  window.voltarFiltrosRelatorioDF219 = function(){
    window.fecharRelatorioDF219();
    abrirFiltrosRelatorio();
  };

  window.exportarCSVDF219 = function(usarAtuais){
    const filtros = usarAtuais === true ? (filtrosAtuais || {}) : valoresFiltros();
    const contas = contasComFiltros(filtros);

    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
  };

  // sobrescreve as funções antigas de relatório
  window.gerarRelatorioFinanceiroDF = abrirFiltrosRelatorio;
  window.exportarCSV = function(){ abrirFiltrosRelatorio(); };

  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio");
    const acao = sel ? sel.value : "";
    if(acao === "pdf" || acao === "csv"){
      abrirFiltrosRelatorio();
    }
    if(sel) sel.value = "";
  };

  function bindSelect(){
    const sel = document.getElementById("acaoRelatorio");
    if(!sel || sel.dataset.df219Bound) return;
    sel.dataset.df219Bound = "1";
    sel.addEventListener("change", function(e){
      e.preventDefault();
      e.stopPropagation();
      window.executarRelatorio();
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindSelect, {once:true});
  }else{
    bindSelect();
  }

  css();
  setTimeout(bindSelect, 700);
  setTimeout(bindSelect, 1600);
  setTimeout(bindSelect, 3200);
})();




/* ==========================================================
   DONA FLOR - V22 TECLADO + POP-UP CORRIGIDO
   Correção:
   - Teclado do celular não fecha mais o pop-up de edição
   - Pop-up só fecha no X, botão salvar ou clique real fora
   - Remove fechamento automático agressivo de versões anteriores
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V22_TECLADO_POPUP__) return;
  window.__DONA_FLOR_V22_TECLADO_POPUP__ = true;

  let focoEmCampo = false;
  let ultimoFocoCampo = 0;
  let abriuEm = Date.now();

  function isCampo(el){
    return !!(el && el.closest && el.closest("input, textarea, select"));
  }

  function isModalFormulario(el){
    return !!(el && el.closest && el.closest(
      ".df-v213-modal,.df-v214-modal,.df-v212-modal,.df-v21-modal,#df-v213-modal,#df-v214-modal,#df-v212-modal,#df-v22-modal"
    ));
  }

  function modalAberto(){
    return document.querySelector(
      ".df-v213-modal.open,.df-v214-modal.open,.df-v212-modal.open,.df-v21-modal.open,#df-v213-modal.open,#df-v214-modal.open,#df-v212-modal.open,#df-v22-modal.open"
    );
  }

  document.addEventListener("focusin", function(e){
    if(isCampo(e.target) && isModalFormulario(e.target)){
      focoEmCampo = true;
      ultimoFocoCampo = Date.now();
      document.body.classList.add("df-keyboard-open");
    }
  }, true);

  document.addEventListener("focusout", function(e){
    if(isCampo(e.target) && isModalFormulario(e.target)){
      ultimoFocoCampo = Date.now();
      setTimeout(function(){
        const ativo = document.activeElement;
        focoEmCampo = isCampo(ativo) && isModalFormulario(ativo);
        if(!focoEmCampo){
          document.body.classList.remove("df-keyboard-open");
        }
      }, 650);
    }
  }, true);

  // Bloqueia fechamento por clique gerado pelo teclado/resize no celular
  document.addEventListener("click", function(e){
    const modal = modalAberto();
    if(!modal) return;

    const dentroCaixa = e.target.closest && e.target.closest(".df-v213-box,.df-v214-box,.df-v212-box,.df-v21-box,.df-v22-box");
    const clicouFundo = e.target === modal;

    const tecladoProvavel =
      focoEmCampo ||
      (Date.now() - ultimoFocoCampo < 1200) ||
      document.body.classList.contains("df-keyboard-open");

    // Se foi um clique no fundo enquanto o teclado está abrindo/fechando, não fecha.
    if(clicouFundo && tecladoProvavel){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Enquanto está digitando, qualquer clique fora acidental é ignorado.
    if(!dentroCaixa && tecladoProvavel){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  function css(){
    if(document.getElementById("df-v22-teclado-css")) return;
    const style = document.createElement("style");
    style.id = "df-v22-teclado-css";
    style.textContent = `
      body.df-keyboard-open .df-v213-modal.open,
      body.df-keyboard-open .df-v214-modal.open,
      body.df-keyboard-open .df-v212-modal.open,
      body.df-keyboard-open .df-v21-modal.open {
        align-items:flex-start !important;
        overflow:auto !important;
        padding-top:18px !important;
      }

      body.df-keyboard-open .df-v213-box,
      body.df-keyboard-open .df-v214-box,
      body.df-keyboard-open .df-v212-box,
      body.df-keyboard-open .df-v21-box {
        max-height:78vh !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Reforça abertura sem marcar como clique fora logo depois.
  const oldAdd = DOMTokenList.prototype.add;
  DOMTokenList.prototype.add = function(...tokens){
    if(tokens.includes("open")){
      abriuEm = Date.now();
    }
    return oldAdd.apply(this, tokens);
  };

  css();
})();




/* ==========================================================
   DONA FLOR - V22.1 RELATÓRIO ATIVO
   Correção:
   - Select Exportar deixa de ficar inerte
   - Adiciona botões diretos PDF e CSV ao lado do select
   - Usa click/change/input em captura para funcionar no celular
   - Garante abertura da tela de filtros
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V221_RELATORIO_ATIVO__) return;
  window.__DONA_FLOR_V221_RELATORIO_ATIVO__ = true;

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function moeda(v){
    return Number(v || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function getContasBase(){
    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    for(const nome of ["contas","contasDados","df_contas","contasDF"]){
      try{
        if(Array.isArray(window[nome])) return window[nome].filter(c => !c.deletado);
      }catch(e){}
    }
    return [];
  }

  function centrosDisponiveis(){
    return Array.from(new Set(getContasBase().map(c => c.centro || c.centro_custo || c.loja).filter(Boolean))).sort();
  }

  function filtrosValores(){
    return {
      centro: document.getElementById("df221Centro")?.value || "",
      status: document.getElementById("df221Status")?.value || "",
      dataInicio: document.getElementById("df221Inicio")?.value || "",
      dataFim: document.getElementById("df221Fim")?.value || "",
      resumo: document.getElementById("df221Resumo")?.checked !== false,
      centroResumo: document.getElementById("df221CentroResumo")?.checked !== false,
      detalhe: document.getElementById("df221Detalhe")?.checked !== false,
      aberto: document.getElementById("df221Aberto")?.checked || false
    };
  }

  function filtrar(f){
    return getContasBase().filter(c => {
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(f.centro && centro !== f.centro) return false;
      if(f.status && status !== f.status) return false;
      if(f.aberto && String(status).toLowerCase() === "pago") return false;
      if(f.dataInicio && data && data < f.dataInicio) return false;
      if(f.dataFim && data && data > f.dataFim) return false;
      return true;
    });
  }

  function resumo(contas){
    const hoje = new Date().toISOString().slice(0,10);
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);
    return {
      qtd: contas.length,
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd++;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function css(){
    if(document.getElementById("df-v221-relatorio-css")) return;
    const style = document.createElement("style");
    style.id = "df-v221-relatorio-css";
    style.textContent = `
      .df-v221-report-actions{
        display:flex!important;
        gap:8px!important;
        flex-wrap:wrap!important;
        margin-top:8px!important;
      }
      .df-v221-mini-btn{
        min-height:40px!important;
        border-radius:10px!important;
        border:2px solid #000!important;
        box-shadow:3px 3px 0 #000!important;
        background:#0f766e!important;
        color:#fff!important;
        font-weight:900!important;
        padding:8px 12px!important;
        cursor:pointer!important;
      }
      .df-v221-mini-btn.light{background:#fff!important;color:#000!important;}

      .df-v221-bg{
        position:fixed!important;
        inset:0!important;
        z-index:1000005!important;
        background:rgba(15,23,42,.65)!important;
        display:none!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        box-sizing:border-box!important;
      }
      .df-v221-bg.open{display:flex!important;}
      .df-v221-box{
        width:100%!important;
        max-width:980px!important;
        max-height:92vh!important;
        overflow:auto!important;
        background:#fff!important;
        border:2px solid #000!important;
        border-radius:18px!important;
        box-shadow:6px 6px 0 #000!important;
        padding:18px!important;
        box-sizing:border-box!important;
        color:#0f172a!important;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }
      .df-v221-top{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;border-bottom:1px solid #e2e8f0!important;padding-bottom:12px!important;margin-bottom:14px!important;}
      .df-v221-title{margin:0!important;font-size:24px!important;line-height:1.1!important;font-weight:950!important;color:#0f766e!important;}
      .df-v221-sub{color:#64748b!important;margin-top:4px!important;font-size:13px!important;}
      .df-v221-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;justify-content:flex-end!important;}
      .df-v221-actions button,.df-v221-btn{min-height:40px!important;border-radius:10px!important;border:2px solid #000!important;box-shadow:3px 3px 0 #000!important;background:#0f766e!important;color:#fff!important;font-weight:900!important;padding:8px 12px!important;cursor:pointer!important;}
      .df-v221-actions .light,.df-v221-btn.light{background:#fff!important;color:#000!important;}
      .df-v221-grid{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
      .df-v221-field label{display:block!important;font-size:12px!important;font-weight:900!important;color:#64748b!important;margin:0 0 4px!important;text-transform:uppercase!important;}
      .df-v221-field input,.df-v221-field select{width:100%!important;min-height:44px!important;border:1px solid #cbd5e1!important;border-radius:12px!important;padding:10px!important;box-sizing:border-box!important;font-size:15px!important;background:#fff!important;}
      .df-v221-checks{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-top:12px!important;}
      .df-v221-check{border:1px solid #e2e8f0!important;border-radius:12px!important;padding:10px!important;background:#fafaf9!important;font-weight:800!important;}
      .df-v221-check input{margin-right:8px!important;}
      .df-v221-cards{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:10px!important;margin:14px 0!important;}
      .df-v221-card{background:#fafaf9!important;border:1px solid #e2e8f0!important;border-radius:14px!important;padding:12px!important;}
      .df-v221-label{font-size:11px!important;text-transform:uppercase!important;color:#64748b!important;font-weight:950!important;}
      .df-v221-num{font-size:19px!important;font-weight:950!important;margin-top:3px!important;}
      .df-v221-centros{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin:10px 0 16px!important;}
      .df-v221-centro{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;border:1px solid #e2e8f0!important;border-radius:12px!important;padding:10px!important;background:#fff!important;}
      .df-v221-centro small{display:block!important;color:#64748b!important;margin-top:2px!important;}
      .df-v221-table-wrap{overflow:auto!important;border-radius:12px!important;border:1px solid #e2e8f0!important;}
      .df-v221-table{width:100%!important;border-collapse:collapse!important;font-size:13px!important;}
      .df-v221-table th{background:#0f766e!important;color:#fff!important;text-align:left!important;padding:9px!important;white-space:nowrap!important;}
      .df-v221-table td{border-bottom:1px solid #e2e8f0!important;padding:9px!important;vertical-align:top!important;}
      .df-v221-value{font-weight:950!important;white-space:nowrap!important;}
      .df-v221-status{display:inline-block!important;border-radius:999px!important;padding:4px 8px!important;font-weight:900!important;font-size:12px!important;}
      .df-v221-status.pago{background:#dcfce7!important;color:#15803d!important;}
      .df-v221-status.aberto{background:#fef3c7!important;color:#92400e!important;}
      .df-v221-empty{padding:18px!important;border:1px dashed #cbd5e1!important;border-radius:12px!important;color:#64748b!important;text-align:center!important;}
      @media(max-width:760px){
        .df-v221-box{padding:14px!important;border-radius:16px!important;}
        .df-v221-top{display:block!important;}
        .df-v221-actions{justify-content:flex-start!important;margin-top:10px!important;}
        .df-v221-grid,.df-v221-checks,.df-v221-centros{grid-template-columns:1fr!important;}
        .df-v221-cards{grid-template-columns:1fr 1fr!important;}
        .df-v221-table{font-size:12px!important;}
      }
      @media print{
        body *{visibility:hidden!important;}
        #df-v221-report-bg,#df-v221-report-bg *{visibility:visible!important;}
        #df-v221-report-bg{position:absolute!important;inset:0!important;display:block!important;background:#fff!important;padding:0!important;}
        #df-v221-report-bg .df-v221-box{max-height:none!important;overflow:visible!important;box-shadow:none!important;border:0!important;border-radius:0!important;max-width:none!important;padding:0!important;}
        .df-v221-actions{display:none!important;}
        @page{margin:12mm;}
      }
    `;
    document.head.appendChild(style);
  }

  function abrirFiltros(){
    css();
    let bg = document.getElementById("df-v221-filter-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v221-filter-bg";
      bg.className = "df-v221-bg";
      document.body.appendChild(bg);
      bg.addEventListener("click", e => { if(e.target === bg) bg.classList.remove("open"); });
    }

    const centros = centrosDisponiveis().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");

    bg.innerHTML = `
      <div class="df-v221-box">
        <div class="df-v221-top">
          <div>
            <h1 class="df-v221-title">Filtros do relatório</h1>
            <div class="df-v221-sub">Escolha o que deseja imprimir ou exportar.</div>
          </div>
          <div class="df-v221-actions"><button type="button" class="light" onclick="document.getElementById('df-v221-filter-bg').classList.remove('open')">Fechar</button></div>
        </div>

        <div class="df-v221-grid">
          <div class="df-v221-field"><label>Centro</label><select id="df221Centro"><option value="">Todos</option>${centros}</select></div>
          <div class="df-v221-field"><label>Status</label><select id="df221Status"><option value="">Todos</option><option>Aberto</option><option>Pago</option></select></div>
          <div class="df-v221-field"><label>Data inicial</label><input id="df221Inicio" type="date"></div>
          <div class="df-v221-field"><label>Data final</label><input id="df221Fim" type="date"></div>
        </div>

        <div class="df-v221-checks">
          <label class="df-v221-check"><input id="df221Resumo" type="checkbox" checked> Mostrar resumo</label>
          <label class="df-v221-check"><input id="df221CentroResumo" type="checkbox" checked> Mostrar centros</label>
          <label class="df-v221-check"><input id="df221Detalhe" type="checkbox" checked> Mostrar detalhes</label>
          <label class="df-v221-check"><input id="df221Aberto" type="checkbox"> Somente em aberto</label>
        </div>

        <div class="df-v221-actions" style="margin-top:16px;justify-content:flex-start!important">
          <button type="button" onclick="window.df221Visualizar()">Visualizar / PDF</button>
          <button type="button" onclick="window.df221CSV()">Exportar CSV</button>
        </div>
      </div>
    `;
    bg.classList.add("open");
  }

  function filtros(){
    return {
      centro: document.getElementById("df221Centro")?.value || "",
      status: document.getElementById("df221Status")?.value || "",
      dataInicio: document.getElementById("df221Inicio")?.value || "",
      dataFim: document.getElementById("df221Fim")?.value || "",
      resumo: document.getElementById("df221Resumo")?.checked !== false,
      centroResumo: document.getElementById("df221CentroResumo")?.checked !== false,
      detalhe: document.getElementById("df221Detalhe")?.checked !== false,
      aberto: document.getElementById("df221Aberto")?.checked || false
    };
  }

  function contasFiltradas(f){
    return getContasBase().filter(c=>{
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);
      if(f.centro && centro !== f.centro) return false;
      if(f.status && status !== f.status) return false;
      if(f.aberto && String(status).toLowerCase() === "pago") return false;
      if(f.dataInicio && data && data < f.dataInicio) return false;
      if(f.dataFim && data && data > f.dataFim) return false;
      return true;
    });
  }

  function montarHTML(f){
    const contas = contasFiltradas(f);
    const r = resumo(contas);
    const centros = porCentro(contas);

    const resumoHTML = f.resumo ? `
      <div class="df-v221-cards">
        <div class="df-v221-card"><div class="df-v221-label">Quantidade</div><div class="df-v221-num">${r.qtd}</div></div>
        <div class="df-v221-card"><div class="df-v221-label">Total aberto</div><div class="df-v221-num">${moeda(r.totalAberto)}</div></div>
        <div class="df-v221-card"><div class="df-v221-label">Pago</div><div class="df-v221-num">${moeda(r.totalPago)}</div></div>
        <div class="df-v221-card"><div class="df-v221-label">Vencidas</div><div class="df-v221-num">${moeda(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centroHTML = f.centroResumo ? `
      <h2>Resumo por centro</h2>
      <div class="df-v221-centros">
        ${centros.length ? centros.map(([centro,info])=>`
          <div class="df-v221-centro"><div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div><b>${moeda(info.total)}</b></div>
        `).join("") : `<div class="df-v221-empty">Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const linhas = contas.map(c=>{
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="df-v221-status ${pago?"pago":"aberto"}">${esc(status)}</span></td>
          <td class="df-v221-value">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const detalheHTML = f.detalhe ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <div class="df-v221-table-wrap">
          <table class="df-v221-table">
            <thead><tr><th>Conta</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      ` : `<div class="df-v221-empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    return `
      <div class="df-v221-top">
        <div>
          <h1 class="df-v221-title">Dona Flor Gestão Financeira</h1>
          <div class="df-v221-sub">Relatório financeiro • ${esc(new Date().toLocaleString("pt-BR"))}</div>
        </div>
        <div class="df-v221-actions">
          <button type="button" onclick="window.print()">Imprimir/PDF</button>
          <button type="button" onclick="window.df221CSV(true)">CSV</button>
          <button type="button" class="light" onclick="document.getElementById('df-v221-report-bg').classList.remove('open');window.df221AbrirFiltros()">Filtros</button>
          <button type="button" class="light" onclick="document.getElementById('df-v221-report-bg').classList.remove('open')">Fechar</button>
        </div>
      </div>
      ${resumoHTML}
      ${centroHTML}
      ${detalheHTML}
    `;
  }

  let filtrosAtuais = {};

  window.df221Visualizar = function(){
    filtrosAtuais = filtros();
    const filterBg = document.getElementById("df-v221-filter-bg");
    if(filterBg) filterBg.classList.remove("open");

    let bg = document.getElementById("df-v221-report-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v221-report-bg";
      bg.className = "df-v221-bg";
      bg.innerHTML = `<div class="df-v221-box" id="df-v221-report"></div>`;
      document.body.appendChild(bg);
      bg.addEventListener("click", e => { if(e.target === bg) bg.classList.remove("open"); });
    }

    document.getElementById("df-v221-report").innerHTML = montarHTML(filtrosAtuais);
    bg.classList.add("open");
  };

  window.df221CSV = function(usarAtuais){
    const f = usarAtuais === true ? (filtrosAtuais || {}) : filtros();
    const contas = contasFiltradas(f);

    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 150);
  };

  window.df221AbrirFiltros = abrirFiltros;
  window.gerarRelatorioFinanceiroDF = abrirFiltros;
  window.exportarCSV = abrirFiltros;
  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio");
    const acao = sel ? sel.value : "";
    if(acao === "pdf" || acao === "csv") abrirFiltros();
    if(sel) sel.value = "";
  };

  function colocarBotoes(){
    css();
    const sel = document.getElementById("acaoRelatorio");
    if(!sel) return;

    // Garante que o select não fica inerte
    sel.onchange = window.executarRelatorio;
    sel.addEventListener("change", function(e){
      if(sel.value){
        e.preventDefault();
        e.stopPropagation();
        window.executarRelatorio();
      }
    }, true);

    const parent = sel.parentElement;
    if(!parent || parent.querySelector(".df-v221-report-actions")) return;

    const div = document.createElement("div");
    div.className = "df-v221-report-actions";
    div.innerHTML = `
      <button type="button" class="df-v221-mini-btn" onclick="window.df221AbrirFiltros()">PDF / Relatório</button>
      <button type="button" class="df-v221-mini-btn light" onclick="window.df221AbrirFiltros()">CSV</button>
    `;

    /* V22.2: botões extras removidos; fica só o select Exportar */
  }

  document.addEventListener("click", function(e){
    const sel = e.target.closest && e.target.closest("#acaoRelatorio");
    if(sel && sel.value){
      setTimeout(window.executarRelatorio, 50);
    }
  }, true);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", colocarBotoes, {once:true});
  }else{
    colocarBotoes();
  }

  setTimeout(colocarBotoes, 700);
  setTimeout(colocarBotoes, 1600);
  setTimeout(colocarBotoes, 3200);
})();




/* ==========================================================
   DONA FLOR - V22.2 RELATÓRIO SELECT + PDF/CSV CORRIGIDOS
   Decisão de UX:
   - Fica somente o select "Exportar"
   - Remove botões extras PDF/Relatório e CSV da tela principal
   - Select abre filtros
   - Dentro dos filtros escolhe: Gerar PDF ou Exportar CSV
   Correções:
   - CSV baixa arquivo corretamente
   - PDF não imprime página branca nem página com código
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V222_RELATORIO_SELECT__) return;
  window.__DONA_FLOR_V222_RELATORIO_SELECT__ = true;

  let filtrosAtuais = {};

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function moeda(v){
    return Number(v || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function getContasBase(){
    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof filtroContas === "function"){
        const r = filtroContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    for(const nome of ["contas","contasDados","df_contas","contasDF"]){
      try{
        if(Array.isArray(window[nome])) return window[nome].filter(c => !c.deletado);
      }catch(e){}
    }
    return [];
  }

  function centrosDisponiveis(){
    return Array.from(new Set(getContasBase().map(c => c.centro || c.centro_custo || c.loja).filter(Boolean))).sort();
  }

  function filtros(){
    return {
      centro: document.getElementById("df222Centro")?.value || "",
      status: document.getElementById("df222Status")?.value || "",
      dataInicio: document.getElementById("df222Inicio")?.value || "",
      dataFim: document.getElementById("df222Fim")?.value || "",
      resumo: document.getElementById("df222Resumo")?.checked !== false,
      centroResumo: document.getElementById("df222CentroResumo")?.checked !== false,
      detalhe: document.getElementById("df222Detalhe")?.checked !== false,
      aberto: document.getElementById("df222Aberto")?.checked || false
    };
  }

  function contasFiltradas(f){
    const ff = f || {};
    return getContasBase().filter(c=>{
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(ff.centro && centro !== ff.centro) return false;
      if(ff.status && status !== ff.status) return false;
      if(ff.aberto && String(status).toLowerCase() === "pago") return false;
      if(ff.dataInicio && data && data < ff.dataInicio) return false;
      if(ff.dataFim && data && data > ff.dataFim) return false;
      return true;
    });
  }

  function resumo(contas){
    const hoje = new Date().toISOString().slice(0,10);
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);
    return {
      qtd: contas.length,
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd++;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function css(){
    if(document.getElementById("df-v222-relatorio-css")) return;
    const style = document.createElement("style");
    style.id = "df-v222-relatorio-css";
    style.textContent = `
      /* Remove os botões extras criados na V22.1 */
      .df-v221-report-actions {
        display:none !important;
      }

      .df-v222-bg{
        position:fixed!important;
        inset:0!important;
        z-index:1000006!important;
        background:rgba(15,23,42,.65)!important;
        display:none!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        box-sizing:border-box!important;
      }
      .df-v222-bg.open{display:flex!important;}

      .df-v222-box{
        width:100%!important;
        max-width:980px!important;
        max-height:92vh!important;
        overflow:auto!important;
        background:#fff!important;
        border:2px solid #000!important;
        border-radius:18px!important;
        box-shadow:6px 6px 0 #000!important;
        padding:18px!important;
        box-sizing:border-box!important;
        color:#0f172a!important;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }

      .df-v222-top{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:12px!important;
        border-bottom:1px solid #e2e8f0!important;
        padding-bottom:12px!important;
        margin-bottom:14px!important;
      }

      .df-v222-title{
        margin:0!important;
        font-size:24px!important;
        line-height:1.1!important;
        font-weight:950!important;
        color:#0f766e!important;
      }

      .df-v222-sub{color:#64748b!important;margin-top:4px!important;font-size:13px!important;}

      .df-v222-actions{
        display:flex!important;
        flex-wrap:wrap!important;
        gap:8px!important;
        justify-content:flex-end!important;
      }

      .df-v222-actions button,
      .df-v222-btn{
        min-height:40px!important;
        border-radius:10px!important;
        border:2px solid #000!important;
        box-shadow:3px 3px 0 #000!important;
        background:#0f766e!important;
        color:#fff!important;
        font-weight:900!important;
        padding:8px 12px!important;
        cursor:pointer!important;
      }

      .df-v222-actions .light,
      .df-v222-btn.light{
        background:#fff!important;
        color:#000!important;
      }

      .df-v222-grid{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:10px!important;
      }

      .df-v222-field label{
        display:block!important;
        font-size:12px!important;
        font-weight:900!important;
        color:#64748b!important;
        margin:0 0 4px!important;
        text-transform:uppercase!important;
      }

      .df-v222-field input,
      .df-v222-field select{
        width:100%!important;
        min-height:44px!important;
        border:1px solid #cbd5e1!important;
        border-radius:12px!important;
        padding:10px!important;
        box-sizing:border-box!important;
        font-size:15px!important;
        background:#fff!important;
      }

      .df-v222-checks{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin-top:12px!important;
      }

      .df-v222-check{
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fafaf9!important;
        font-weight:800!important;
      }

      .df-v222-check input{margin-right:8px!important;}

      .df-v222-cards{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:10px!important;
        margin:14px 0!important;
      }

      .df-v222-card{
        background:#fafaf9!important;
        border:1px solid #e2e8f0!important;
        border-radius:14px!important;
        padding:12px!important;
      }

      .df-v222-label{font-size:11px!important;text-transform:uppercase!important;color:#64748b!important;font-weight:950!important;}
      .df-v222-num{font-size:19px!important;font-weight:950!important;margin-top:3px!important;}

      .df-v222-centros{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin:10px 0 16px!important;
      }

      .df-v222-centro{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fff!important;
      }

      .df-v222-centro small{display:block!important;color:#64748b!important;margin-top:2px!important;}

      .df-v222-table-wrap{overflow:auto!important;border-radius:12px!important;border:1px solid #e2e8f0!important;}
      .df-v222-table{width:100%!important;border-collapse:collapse!important;font-size:13px!important;}
      .df-v222-table th{background:#0f766e!important;color:#fff!important;text-align:left!important;padding:9px!important;white-space:nowrap!important;}
      .df-v222-table td{border-bottom:1px solid #e2e8f0!important;padding:9px!important;vertical-align:top!important;}
      .df-v222-value{font-weight:950!important;white-space:nowrap!important;}
      .df-v222-status{display:inline-block!important;border-radius:999px!important;padding:4px 8px!important;font-weight:900!important;font-size:12px!important;}
      .df-v222-status.pago{background:#dcfce7!important;color:#15803d!important;}
      .df-v222-status.aberto{background:#fef3c7!important;color:#92400e!important;}
      .df-v222-empty{padding:18px!important;border:1px dashed #cbd5e1!important;border-radius:12px!important;color:#64748b!important;text-align:center!important;}

      @media(max-width:760px){
        .df-v222-box{padding:14px!important;border-radius:16px!important;}
        .df-v222-top{display:block!important;}
        .df-v222-actions{justify-content:flex-start!important;margin-top:10px!important;}
        .df-v222-grid,.df-v222-checks,.df-v222-centros{grid-template-columns:1fr!important;}
        .df-v222-cards{grid-template-columns:1fr 1fr!important;}
        .df-v222-table{font-size:12px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function abrirFiltros(){
    css();
    let bg = document.getElementById("df-v222-filter-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v222-filter-bg";
      bg.className = "df-v222-bg";
      document.body.appendChild(bg);
      bg.addEventListener("click", e => { if(e.target === bg) bg.classList.remove("open"); });
    }

    const centros = centrosDisponiveis().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");

    bg.innerHTML = `
      <div class="df-v222-box">
        <div class="df-v222-top">
          <div>
            <h1 class="df-v222-title">Filtros do relatório</h1>
            <div class="df-v222-sub">Escolha o que deseja imprimir ou exportar.</div>
          </div>
          <div class="df-v222-actions">
            <button type="button" class="light" onclick="document.getElementById('df-v222-filter-bg').classList.remove('open')">Fechar</button>
          </div>
        </div>

        <div class="df-v222-grid">
          <div class="df-v222-field"><label>Centro</label><select id="df222Centro"><option value="">Todos</option>${centros}</select></div>
          <div class="df-v222-field"><label>Status</label><select id="df222Status"><option value="">Todos</option><option>Aberto</option><option>Pago</option></select></div>
          <div class="df-v222-field"><label>Data inicial</label><input id="df222Inicio" type="date"></div>
          <div class="df-v222-field"><label>Data final</label><input id="df222Fim" type="date"></div>
        </div>

        <div class="df-v222-checks">
          <label class="df-v222-check"><input id="df222Resumo" type="checkbox" checked> Mostrar resumo</label>
          <label class="df-v222-check"><input id="df222CentroResumo" type="checkbox" checked> Mostrar centros</label>
          <label class="df-v222-check"><input id="df222Detalhe" type="checkbox" checked> Mostrar detalhes</label>
          <label class="df-v222-check"><input id="df222Aberto" type="checkbox"> Somente em aberto</label>
        </div>

        <div class="df-v222-actions" style="margin-top:16px;justify-content:flex-start!important">
          <button type="button" onclick="window.df222GerarPDF()">Gerar PDF</button>
          <button type="button" onclick="window.df222CSV()">Exportar CSV</button>
        </div>
      </div>
    `;

    bg.classList.add("open");
  }

  function montarRelatorioHTML(f){
    const contas = contasFiltradas(f);
    const r = resumo(contas);
    const centros = porCentro(contas);

    const resumoHTML = f.resumo ? `
      <div class="df-v222-cards">
        <div class="df-v222-card"><div class="df-v222-label">Quantidade</div><div class="df-v222-num">${r.qtd}</div></div>
        <div class="df-v222-card"><div class="df-v222-label">Total aberto</div><div class="df-v222-num">${moeda(r.totalAberto)}</div></div>
        <div class="df-v222-card"><div class="df-v222-label">Pago</div><div class="df-v222-num">${moeda(r.totalPago)}</div></div>
        <div class="df-v222-card"><div class="df-v222-label">Vencidas</div><div class="df-v222-num">${moeda(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centroHTML = f.centroResumo ? `
      <h2>Resumo por centro</h2>
      <div class="df-v222-centros">
        ${centros.length ? centros.map(([centro,info])=>`
          <div class="df-v222-centro"><div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div><b>${moeda(info.total)}</b></div>
        `).join("") : `<div class="df-v222-empty">Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const linhas = contas.map(c=>{
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="df-v222-status ${pago?"pago":"aberto"}">${esc(status)}</span></td>
          <td class="df-v222-value">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const detalheHTML = f.detalhe ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <div class="df-v222-table-wrap">
          <table class="df-v222-table">
            <thead><tr><th>Conta</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      ` : `<div class="df-v222-empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    return `
      <div class="df-v222-top">
        <div>
          <h1 class="df-v222-title">Dona Flor Gestão Financeira</h1>
          <div class="df-v222-sub">Relatório financeiro • ${esc(new Date().toLocaleString("pt-BR"))}</div>
        </div>
      </div>
      ${resumoHTML}
      ${centroHTML}
      ${detalheHTML}
    `;
  }

  function htmlPrintCompleto(f){
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório Dona Flor</title>
<style>
  body{font-family:Arial,sans-serif;color:#0f172a;margin:0;padding:18px;background:#fff}
  h1{color:#0f766e;margin:0 0 4px;font-size:24px}
  h2{font-size:18px;margin:18px 0 8px}
  .sub{color:#64748b;font-size:12px;margin-bottom:12px}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
  .card{border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fafaf9}
  .label{font-size:10px;text-transform:uppercase;color:#64748b;font-weight:bold}
  .num{font-size:17px;font-weight:bold;margin-top:3px}
  .centros{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:8px 0 14px}
  .centro{display:flex;justify-content:space-between;border:1px solid #e2e8f0;border-radius:10px;padding:8px}
  .centro small{display:block;color:#64748b}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#0f766e;color:white;text-align:left;padding:7px}
  td{border-bottom:1px solid #e2e8f0;padding:7px;vertical-align:top}
  .valor{font-weight:bold;white-space:nowrap}
  .status{border-radius:999px;padding:3px 7px;font-weight:bold;font-size:11px}
  .pago{background:#dcfce7;color:#15803d}
  .aberto{background:#fef3c7;color:#92400e}
  @page{margin:12mm}
</style>
</head>
<body>
${montarRelatorioHTML(f)
  .replaceAll("df-v222-title","")
  .replaceAll("df-v222-sub","sub")
  .replaceAll("df-v222-cards","cards")
  .replaceAll("df-v222-card","card")
  .replaceAll("df-v222-label","label")
  .replaceAll("df-v222-num","num")
  .replaceAll("df-v222-centros","centros")
  .replaceAll("df-v222-centro","centro")
  .replaceAll("df-v222-table-wrap","")
  .replaceAll("df-v222-table","")
  .replaceAll("df-v222-value","valor")
  .replaceAll("df-v222-status","status")
}
</body>
</html>`;
  }

  window.df222GerarPDF = function(){
    const f = filtros();
    filtrosAtuais = f;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlPrintCompleto(f));
    doc.close();

    setTimeout(function(){
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(()=>iframe.remove(), 1500);
    }, 500);
  };

  window.df222CSV = function(){
    const f = filtros();
    const contas = contasFiltradas(f);

    if(!contas.length){
      alert("Nenhum dado para exportar.");
      return;
    }

    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(function(){
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  window.df222AbrirFiltros = abrirFiltros;
  window.gerarRelatorioFinanceiroDF = abrirFiltros;
  window.exportarCSV = abrirFiltros;
  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio");
    const acao = sel ? sel.value : "";
    if(acao === "pdf" || acao === "csv"){
      abrirFiltros();
    }
    if(sel) sel.value = "";
  };

  function configurarSelect(){
    css();

    // remove botões extras antigos
    document.querySelectorAll(".df-v221-report-actions").forEach(el => el.remove());

    const sel = document.getElementById("acaoRelatorio");
    if(!sel) return;

    sel.onchange = null;
    sel.removeAttribute("onchange");

    if(!sel.dataset.df222Bound){
      sel.dataset.df222Bound = "1";
      sel.addEventListener("change", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(sel.value) window.executarRelatorio();
      }, true);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", configurarSelect, {once:true});
  }else{
    configurarSelect();
  }

  setTimeout(configurarSelect, 700);
  setTimeout(configurarSelect, 1600);
  setTimeout(configurarSelect, 3200);
})();




/* ==========================================================
   DONA FLOR - V22.3 PRIORIDADE EM BOTÃO
   Correções:
   - Remove o select fixo de prioridade dos cards de notas
   - Cria botão "Prioridade"
   - Ao clicar, abre menu com Normal, Urgente e Crítico
   - Atualiza prioridade usando a função existente quando disponível
   - Remove botões extras antigos de relatório da tela principal
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V223_PRIORIDADE_BOTAO__) return;
  window.__DONA_FLOR_V223_PRIORIDADE_BOTAO__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function normalizar(v){
    return String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function labelPrioridade(v){
    const p = normalizar(v);
    if(p === "critico" || p === "crítico") return "Crítico";
    if(p === "urgente") return "Urgente";
    return "Normal";
  }

  function corClass(v){
    const p = normalizar(v);
    if(p === "critico" || p === "crítico") return "critico";
    if(p === "urgente") return "urgente";
    return "normal";
  }

  function emoji(v){
    const p = normalizar(v);
    if(p === "critico" || p === "crítico") return "🔥";
    if(p === "urgente") return "🔴";
    return "🟢";
  }

  function css(){
    if(document.getElementById("df-v223-prioridade-css")) return;

    const style = document.createElement("style");
    style.id = "df-v223-prioridade-css";
    style.textContent = `
      /* Remove os botões extras de relatório que estavam sobrando */
      .df-v221-report-actions,
      .df-v221-mini-btn,
      button[onclick*="df221AbrirFiltros"] {
        display:none !important;
      }

      .df-prioridade-box-v223{
        position:relative !important;
        width:100% !important;
        margin:10px 0 !important;
        z-index:30 !important;
      }

      .df-btn-prioridade-v223{
        width:100% !important;
        min-height:44px !important;
        border-radius:12px !important;
        border:1px solid #CBD5E1 !important;
        background:#F8FAFC !important;
        color:#0F172A !important;
        font-weight:900 !important;
        font-size:15px !important;
        padding:10px 12px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:10px !important;
        cursor:pointer !important;
        box-shadow:none !important;
      }

      .df-btn-prioridade-v223.normal{
        background:#ECFDF5 !important;
        color:#047857 !important;
        border-color:#A7F3D0 !important;
      }

      .df-btn-prioridade-v223.urgente{
        background:#FEE2E2 !important;
        color:#B91C1C !important;
        border-color:#FECACA !important;
      }

      .df-btn-prioridade-v223.critico{
        background:#7F1D1D !important;
        color:#FFFFFF !important;
        border-color:#450A0A !important;
      }

      .df-prioridade-menu-v223{
        display:none !important;
        position:absolute !important;
        left:0 !important;
        right:0 !important;
        top:50px !important;
        background:#FFFFFF !important;
        border:2px solid #000 !important;
        border-radius:14px !important;
        box-shadow:4px 4px 0 #000 !important;
        overflow:hidden !important;
        z-index:99999 !important;
      }

      .df-prioridade-box-v223.open .df-prioridade-menu-v223{
        display:block !important;
      }

      .df-prioridade-opcao-v223{
        width:100% !important;
        min-height:44px !important;
        border:0 !important;
        border-bottom:1px solid #E2E8F0 !important;
        background:#FFFFFF !important;
        color:#0F172A !important;
        font-weight:900 !important;
        padding:12px !important;
        text-align:left !important;
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
        cursor:pointer !important;
        box-shadow:none !important;
        border-radius:0 !important;
      }

      .df-prioridade-opcao-v223:last-child{
        border-bottom:0 !important;
      }

      .df-prioridade-opcao-v223:hover{
        background:#F1F5F9 !important;
      }

      .df-prioridade-opcao-v223.normal{color:#047857 !important;}
      .df-prioridade-opcao-v223.urgente{color:#B91C1C !important;}
      .df-prioridade-opcao-v223.critico{color:#7F1D1D !important;}

      select.df-prioridade-select-original-v223{
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function acharNotaId(card, select){
    const attrNames = ["data-id","data-nota-id","data-lembrete-id","data-key"];
    for(const a of attrNames){
      const v = card?.getAttribute?.(a) || select?.getAttribute?.(a);
      if(v) return v;
    }

    const onclicks = Array.from(card.querySelectorAll("[onclick]"))
      .map(el => el.getAttribute("onclick") || "")
      .join(" ");

    let m = onclicks.match(/(?:alterarPrioridade|editarNotaDF|excluirNota|excluirNotaDF)\s*\(\s*['"]?([^,'")]+)['"]?/i);
    if(m) return m[1];

    return select?.dataset?.id || select?.id || "";
  }

  async function aplicarPrioridade(select, id, valor){
    const label = labelPrioridade(valor);

    if(select){
      select.value = label;
      select.dispatchEvent(new Event("change", { bubbles:true }));
    }

    try{
      if(typeof window.alterarPrioridade === "function"){
        try { return window.alterarPrioridade(select, id, label); } catch(e){}
        try { return window.alterarPrioridade(id, label); } catch(e){}
        try { return window.alterarPrioridade(label, id); } catch(e){}
      }
    }catch(e){}

    try{
      if(typeof window.alterarPrioridadeNotaDF === "function"){
        try { return window.alterarPrioridadeNotaDF(id, label); } catch(e){}
      }
    }catch(e){}

    // fallback direto Supabase, se existir estrutura padrão
    try{
      if(id && typeof SupabaseURL !== "undefined" && typeof SupabaseKey !== "undefined"){
        await fetch(SupabaseURL + "/rest/v1/df_notas?id=eq." + encodeURIComponent(id), {
          method: "PATCH",
          headers: {
            "apikey": SupabaseKey,
            "Authorization": "Bearer " + SupabaseKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({ prioridade: label })
        });
        if(typeof carregar === "function") carregar();
        else if(typeof render === "function") render();
      }
    }catch(e){}
  }

  function criarBotaoPrioridade(select){
    if(!select || select.dataset.df223Ok) return;

    const valorAtual = labelPrioridade(select.value || select.options?.[select.selectedIndex]?.text || "Normal");

    const card = select.closest(".card,section,article,div");
    const id = acharNotaId(card, select);

    select.dataset.df223Ok = "1";
    select.classList.add("df-prioridade-select-original-v223");

    const box = document.createElement("div");
    box.className = "df-prioridade-box-v223";
    box.dataset.id = id;

    box.innerHTML = `
      <button type="button" class="df-btn-prioridade-v223 ${corClass(valorAtual)}">
        <span>${emoji(valorAtual)} Prioridade</span>
        <strong>${valorAtual}</strong>
      </button>
      <div class="df-prioridade-menu-v223">
        <button type="button" class="df-prioridade-opcao-v223 normal" data-prioridade="Normal">🟢 Normal</button>
        <button type="button" class="df-prioridade-opcao-v223 urgente" data-prioridade="Urgente">🔴 Urgente</button>
        <button type="button" class="df-prioridade-opcao-v223 critico" data-prioridade="Crítico">🔥 Crítico</button>
      </div>
    `;

    select.parentNode.insertBefore(box, select.nextSibling);

    const btn = box.querySelector(".df-btn-prioridade-v223");
    const strong = btn.querySelector("strong");

    btn.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".df-prioridade-box-v223.open").forEach(b => {
        if(b !== box) b.classList.remove("open");
      });

      box.classList.toggle("open");
    });

    box.querySelectorAll(".df-prioridade-opcao-v223").forEach(op => {
      op.addEventListener("click", async function(e){
        e.preventDefault();
        e.stopPropagation();

        const novo = op.dataset.prioridade;
        btn.classList.remove("normal","urgente","critico");
        btn.classList.add(corClass(novo));
        btn.querySelector("span").textContent = `${emoji(novo)} Prioridade`;
        strong.textContent = labelPrioridade(novo);
        box.classList.remove("open");

        await aplicarPrioridade(select, id, novo);
      });
    });
  }

  function aplicar(){
    css();

    // Remove botões extras de relatório que ainda estiverem no DOM.
    document.querySelectorAll(".df-v221-report-actions").forEach(el => el.remove());

    const selects = Array.from(document.querySelectorAll("select")).filter(sel => {
      const t = (sel.textContent || "").toLowerCase();
      const id = (sel.id || "").toLowerCase();
      const cls = String(sel.className || "").toLowerCase();

      const contemPrioridades =
        t.includes("normal") &&
        t.includes("urgente") &&
        !id.includes("status") &&
        !id.includes("centro") &&
        !id.includes("acao");

      return contemPrioridades || id.includes("prior") || cls.includes("prior");
    });

    selects.forEach(criarBotaoPrioridade);
  }

  document.addEventListener("click", function(e){
    if(!e.target.closest(".df-prioridade-box-v223")){
      document.querySelectorAll(".df-prioridade-box-v223.open").forEach(b => b.classList.remove("open"));
    }
  }, true);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, {once:true});
  }else{
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V22.4 RELATÓRIO INTEGRADO CSV/PDF
   Análise aplicada:
   - O CSV estava dependendo dos arrays da tela/renderização.
   - Agora o relatório busca direto no Supabase quando disponível.
   - Mantém fallback para arrays locais.
   - CSV usa Web Share API no celular e download como fallback.
   - PDF imprime um container limpo, sem iframe e sem página com código.
   - Fica somente o select Exportar na tela principal.
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V224_RELATORIO_INTEGRADO__) return;
  window.__DONA_FLOR_V224_RELATORIO_INTEGRADO__ = true;

  let contasRelatorioCache = [];
  let filtrosAtuais = {};

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function moeda(v){
    return Number(v || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function hojeISO(){
    return new Date().toISOString().slice(0,10);
  }

  function getURL(){
    try{ if(typeof URL !== "undefined" && String(URL).includes("supabase")) return URL; }catch(e){}
    try{ if(typeof SupabaseURL !== "undefined") return SupabaseURL; }catch(e){}
    return "";
  }

  function getKEY(){
    try{ if(typeof KEY !== "undefined") return KEY; }catch(e){}
    try{ if(typeof SupabaseKey !== "undefined") return SupabaseKey; }catch(e){}
    return "";
  }

  async function buscarContasSupabase(){
    const url = getURL();
    const key = getKEY();

    if(!url || !key || !String(url).includes("supabase")) return null;

    const resp = await fetch(url + "/rest/v1/df_contas?select=*&order=vencimento.asc", {
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      }
    });

    if(!resp.ok) throw new Error("Falha ao buscar contas para relatório.");

    const data = await resp.json();
    return Array.isArray(data) ? data.filter(c => !c.deletado) : [];
  }

  function contasDoApp(){
    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r) && r.length) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r) && r.length) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof filtroContas === "function"){
        const r = filtroContas();
        if(Array.isArray(r) && r.length) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    for(const nome of ["contas", "contasDados", "df_contas", "contasDF"]){
      try{
        if(Array.isArray(window[nome]) && window[nome].length) return window[nome].filter(c => !c.deletado);
      }catch(e){}
    }

    return [];
  }

  async function carregarContasRelatorio(){
    try{
      const remoto = await buscarContasSupabase();
      if(Array.isArray(remoto)){
        contasRelatorioCache = remoto;
        return remoto;
      }
    }catch(e){
      console.warn("Relatório usando fallback local:", e);
    }

    const local = contasDoApp();
    contasRelatorioCache = local;
    return local;
  }

  function centrosDisponiveis(contas){
    return Array.from(new Set((contas || []).map(c => c.centro || c.centro_custo || c.loja).filter(Boolean))).sort();
  }

  function filtros(){
    return {
      centro: document.getElementById("df224Centro")?.value || "",
      status: document.getElementById("df224Status")?.value || "",
      dataInicio: document.getElementById("df224Inicio")?.value || "",
      dataFim: document.getElementById("df224Fim")?.value || "",
      resumo: document.getElementById("df224Resumo")?.checked !== false,
      centroResumo: document.getElementById("df224CentroResumo")?.checked !== false,
      detalhe: document.getElementById("df224Detalhe")?.checked !== false,
      aberto: document.getElementById("df224Aberto")?.checked || false
    };
  }

  function contasFiltradas(f){
    const ff = f || {};
    return (contasRelatorioCache || []).filter(c=>{
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(ff.centro && centro !== ff.centro) return false;
      if(ff.status && status !== ff.status) return false;
      if(ff.aberto && String(status).toLowerCase() === "pago") return false;
      if(ff.dataInicio && data && data < ff.dataInicio) return false;
      if(ff.dataFim && data && data > ff.dataFim) return false;
      return true;
    });
  }

  function resumo(contas){
    const hoje = hojeISO();
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);
    return {
      qtd: contas.length,
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd++;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function css(){
    if(document.getElementById("df-v224-relatorio-css")) return;
    const style = document.createElement("style");
    style.id = "df-v224-relatorio-css";
    style.textContent = `
      .df-v221-report-actions,
      .df-v221-mini-btn,
      button[onclick*="df221AbrirFiltros"]{
        display:none !important;
      }

      .df-v224-bg{
        position:fixed!important;
        inset:0!important;
        z-index:1000007!important;
        background:rgba(15,23,42,.65)!important;
        display:none!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        box-sizing:border-box!important;
      }
      .df-v224-bg.open{display:flex!important;}

      .df-v224-box{
        width:100%!important;
        max-width:980px!important;
        max-height:92vh!important;
        overflow:auto!important;
        background:#fff!important;
        border:2px solid #000!important;
        border-radius:18px!important;
        box-shadow:6px 6px 0 #000!important;
        padding:18px!important;
        box-sizing:border-box!important;
        color:#0f172a!important;
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }

      .df-v224-top{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        gap:12px!important;
        border-bottom:1px solid #e2e8f0!important;
        padding-bottom:12px!important;
        margin-bottom:14px!important;
      }

      .df-v224-title{
        margin:0!important;
        font-size:24px!important;
        line-height:1.1!important;
        font-weight:950!important;
        color:#0f766e!important;
      }

      .df-v224-sub{color:#64748b!important;margin-top:4px!important;font-size:13px!important;}

      .df-v224-actions{
        display:flex!important;
        flex-wrap:wrap!important;
        gap:8px!important;
        justify-content:flex-end!important;
      }

      .df-v224-actions button,
      .df-v224-btn{
        min-height:40px!important;
        border-radius:10px!important;
        border:2px solid #000!important;
        box-shadow:3px 3px 0 #000!important;
        background:#0f766e!important;
        color:#fff!important;
        font-weight:900!important;
        padding:8px 12px!important;
        cursor:pointer!important;
      }

      .df-v224-actions .light,
      .df-v224-btn.light{
        background:#fff!important;
        color:#000!important;
      }

      .df-v224-grid{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:10px!important;
      }

      .df-v224-field label{
        display:block!important;
        font-size:12px!important;
        font-weight:900!important;
        color:#64748b!important;
        margin:0 0 4px!important;
        text-transform:uppercase!important;
      }

      .df-v224-field input,
      .df-v224-field select{
        width:100%!important;
        min-height:44px!important;
        border:1px solid #cbd5e1!important;
        border-radius:12px!important;
        padding:10px!important;
        box-sizing:border-box!important;
        font-size:15px!important;
        background:#fff!important;
      }

      .df-v224-checks{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin-top:12px!important;
      }

      .df-v224-check{
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fafaf9!important;
        font-weight:800!important;
      }

      .df-v224-check input{margin-right:8px!important;}

      .df-v224-cards{
        display:grid!important;
        grid-template-columns:repeat(4,1fr)!important;
        gap:10px!important;
        margin:14px 0!important;
      }

      .df-v224-card{
        background:#fafaf9!important;
        border:1px solid #e2e8f0!important;
        border-radius:14px!important;
        padding:12px!important;
      }

      .df-v224-label{font-size:11px!important;text-transform:uppercase!important;color:#64748b!important;font-weight:950!important;}
      .df-v224-num{font-size:19px!important;font-weight:950!important;margin-top:3px!important;}

      .df-v224-centros{
        display:grid!important;
        grid-template-columns:repeat(2,1fr)!important;
        gap:8px!important;
        margin:10px 0 16px!important;
      }

      .df-v224-centro{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        border:1px solid #e2e8f0!important;
        border-radius:12px!important;
        padding:10px!important;
        background:#fff!important;
      }

      .df-v224-centro small{display:block!important;color:#64748b!important;margin-top:2px!important;}

      .df-v224-table-wrap{overflow:auto!important;border-radius:12px!important;border:1px solid #e2e8f0!important;}
      .df-v224-table{width:100%!important;border-collapse:collapse!important;font-size:13px!important;}
      .df-v224-table th{background:#0f766e!important;color:#fff!important;text-align:left!important;padding:9px!important;white-space:nowrap!important;}
      .df-v224-table td{border-bottom:1px solid #e2e8f0!important;padding:9px!important;vertical-align:top!important;}
      .df-v224-value{font-weight:950!important;white-space:nowrap!important;}
      .df-v224-status{display:inline-block!important;border-radius:999px!important;padding:4px 8px!important;font-weight:900!important;font-size:12px!important;}
      .df-v224-status.pago{background:#dcfce7!important;color:#15803d!important;}
      .df-v224-status.aberto{background:#fef3c7!important;color:#92400e!important;}
      .df-v224-empty{padding:18px!important;border:1px dashed #cbd5e1!important;border-radius:12px!important;color:#64748b!important;text-align:center!important;}

      .df-v224-print{
        display:none;
      }

      @media(max-width:760px){
        .df-v224-box{padding:14px!important;border-radius:16px!important;}
        .df-v224-top{display:block!important;}
        .df-v224-actions{justify-content:flex-start!important;margin-top:10px!important;}
        .df-v224-grid,.df-v224-checks,.df-v224-centros{grid-template-columns:1fr!important;}
        .df-v224-cards{grid-template-columns:1fr 1fr!important;}
        .df-v224-table{font-size:12px!important;}
      }

      @media print{
        body > *:not(.df-v224-print){
          display:none !important;
        }
        .df-v224-print{
          display:block !important;
          position:static !important;
          inset:auto !important;
          background:#fff !important;
          color:#0f172a !important;
          font-family:Arial,sans-serif !important;
          padding:0 !important;
          margin:0 !important;
        }
        .df-v224-print *{
          visibility:visible !important;
        }
        .df-v224-print h1{
          color:#0f766e !important;
          margin:0 0 4px !important;
          font-size:24px !important;
        }
        .df-v224-print h2{font-size:18px !important;margin:18px 0 8px !important;}
        .df-v224-print .sub{color:#64748b !important;font-size:12px !important;margin-bottom:12px !important;}
        .df-v224-print .cards{display:grid !important;grid-template-columns:repeat(4,1fr) !important;gap:8px !important;margin:12px 0 !important;}
        .df-v224-print .card{border:1px solid #e2e8f0 !important;border-radius:10px !important;padding:10px !important;background:#fafaf9 !important;}
        .df-v224-print .label{font-size:10px !important;text-transform:uppercase !important;color:#64748b !important;font-weight:bold !important;}
        .df-v224-print .num{font-size:17px !important;font-weight:bold !important;margin-top:3px !important;}
        .df-v224-print .centros{display:grid !important;grid-template-columns:repeat(2,1fr) !important;gap:8px !important;margin:8px 0 14px !important;}
        .df-v224-print .centro{display:flex !important;justify-content:space-between !important;border:1px solid #e2e8f0 !important;border-radius:10px !important;padding:8px !important;}
        .df-v224-print .centro small{display:block !important;color:#64748b !important;}
        .df-v224-print table{width:100% !important;border-collapse:collapse !important;font-size:12px !important;}
        .df-v224-print th{background:#0f766e !important;color:white !important;text-align:left !important;padding:7px !important;}
        .df-v224-print td{border-bottom:1px solid #e2e8f0 !important;padding:7px !important;vertical-align:top !important;}
        .df-v224-print .valor{font-weight:bold !important;white-space:nowrap !important;}
        .df-v224-print .status{border-radius:999px !important;padding:3px 7px !important;font-weight:bold !important;font-size:11px !important;}
        .df-v224-print .pago{background:#dcfce7 !important;color:#15803d !important;}
        .df-v224-print .aberto{background:#fef3c7 !important;color:#92400e !important;}
        @page{margin:12mm;}
      }
    `;
    document.head.appendChild(style);
  }

  function montarRelatorioHTML(f, printMode=false){
    const contas = contasFiltradas(f);
    const r = resumo(contas);
    const centros = porCentro(contas);

    const cls = printMode ? {
      top:"", title:"", sub:"sub", cards:"cards", card:"card", label:"label", num:"num",
      centros:"centros", centro:"centro", table:"", value:"valor", status:"status"
    } : {
      top:"df-v224-top", title:"df-v224-title", sub:"df-v224-sub", cards:"df-v224-cards",
      card:"df-v224-card", label:"df-v224-label", num:"df-v224-num",
      centros:"df-v224-centros", centro:"df-v224-centro", table:"df-v224-table", value:"df-v224-value", status:"df-v224-status"
    };

    const resumoHTML = f.resumo ? `
      <div class="${cls.cards}">
        <div class="${cls.card}"><div class="${cls.label}">Quantidade</div><div class="${cls.num}">${r.qtd}</div></div>
        <div class="${cls.card}"><div class="${cls.label}">Total aberto</div><div class="${cls.num}">${moeda(r.totalAberto)}</div></div>
        <div class="${cls.card}"><div class="${cls.label}">Pago</div><div class="${cls.num}">${moeda(r.totalPago)}</div></div>
        <div class="${cls.card}"><div class="${cls.label}">Vencidas</div><div class="${cls.num}">${moeda(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centroHTML = f.centroResumo ? `
      <h2>Resumo por centro</h2>
      <div class="${cls.centros}">
        ${centros.length ? centros.map(([centro,info])=>`
          <div class="${cls.centro}"><div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div><b>${moeda(info.total)}</b></div>
        `).join("") : `<div class="df-v224-empty">Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const linhas = contas.map(c=>{
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="${cls.status} ${pago?"pago":"aberto"}">${esc(status)}</span></td>
          <td class="${cls.value}">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const detalheHTML = f.detalhe ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <div class="df-v224-table-wrap">
          <table class="${cls.table}">
            <thead><tr><th>Conta</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      ` : `<div class="df-v224-empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    return `
      <div class="${cls.top}">
        <div>
          <h1 class="${cls.title}">Dona Flor Gestão Financeira</h1>
          <div class="${cls.sub}">Relatório financeiro • ${esc(new Date().toLocaleString("pt-BR"))}</div>
        </div>
      </div>
      ${resumoHTML}
      ${centroHTML}
      ${detalheHTML}
    `;
  }

  async function abrirFiltros(){
    css();

    const contas = await carregarContasRelatorio();

    let bg = document.getElementById("df-v224-filter-bg");
    if(!bg){
      bg = document.createElement("div");
      bg.id = "df-v224-filter-bg";
      bg.className = "df-v224-bg";
      document.body.appendChild(bg);
      bg.addEventListener("click", e => { if(e.target === bg) bg.classList.remove("open"); });
    }

    const centros = centrosDisponiveis(contas).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");

    bg.innerHTML = `
      <div class="df-v224-box">
        <div class="df-v224-top">
          <div>
            <h1 class="df-v224-title">Filtros do relatório</h1>
            <div class="df-v224-sub">Escolha o que deseja imprimir ou exportar. Base carregada: ${contas.length} conta(s).</div>
          </div>
          <div class="df-v224-actions">
            <button type="button" class="light" onclick="document.getElementById('df-v224-filter-bg').classList.remove('open')">Fechar</button>
          </div>
        </div>

        <div class="df-v224-grid">
          <div class="df-v224-field"><label>Centro</label><select id="df224Centro"><option value="">Todos</option>${centros}</select></div>
          <div class="df-v224-field"><label>Status</label><select id="df224Status"><option value="">Todos</option><option>Aberto</option><option>Pago</option></select></div>
          <div class="df-v224-field"><label>Data inicial</label><input id="df224Inicio" type="date"></div>
          <div class="df-v224-field"><label>Data final</label><input id="df224Fim" type="date"></div>
        </div>

        <div class="df-v224-checks">
          <label class="df-v224-check"><input id="df224Resumo" type="checkbox" checked> Mostrar resumo</label>
          <label class="df-v224-check"><input id="df224CentroResumo" type="checkbox" checked> Mostrar centros</label>
          <label class="df-v224-check"><input id="df224Detalhe" type="checkbox" checked> Mostrar detalhes</label>
          <label class="df-v224-check"><input id="df224Aberto" type="checkbox"> Somente em aberto</label>
        </div>

        <div class="df-v224-actions" style="margin-top:16px;justify-content:flex-start!important">
          <button type="button" onclick="window.df224GerarPDF()">Gerar PDF</button>
          <button type="button" onclick="window.df224CSV()">Exportar CSV</button>
        </div>
      </div>
    `;

    bg.classList.add("open");
  }

  window.df224GerarPDF = function(){
    filtrosAtuais = filtros();

    const antigo = document.getElementById("df-v224-print-area");
    if(antigo) antigo.remove();

    const print = document.createElement("div");
    print.id = "df-v224-print-area";
    print.className = "df-v224-print";
    print.innerHTML = montarRelatorioHTML(filtrosAtuais, true);
    document.body.appendChild(print);

    setTimeout(function(){
      window.print();
      setTimeout(function(){
        const p = document.getElementById("df-v224-print-area");
        if(p) p.remove();
      }, 1500);
    }, 300);
  };

  window.df224CSV = async function(){
    filtrosAtuais = filtros();
    const contas = contasFiltradas(filtrosAtuais);

    if(!contas.length){
      alert("Nenhum dado para exportar com esses filtros.");
      return;
    }

    const linhas = [
      ["Descrição","Valor","Vencimento","Centro","Status","Observação"],
      ...contas.map(c => [
        c.descricao || c.conta || "",
        Number(c.valor || 0).toFixed(2).replace(".", ","),
        dataBR(c.vencimento || c.data_vencimento),
        c.centro || c.centro_custo || c.loja || "",
        c.status || "Aberto",
        c.observacao || ""
      ])
    ];

    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
    const file = new File([blob], "relatorio-dona-flor.csv", {type:"text/csv"});

    try{
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:"Relatório Dona Flor"});
        return;
      }
    }catch(e){}

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-dona-flor.csv";
    a.target = "_blank";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    const box = document.querySelector("#df-v224-filter-bg .df-v224-box");
    if(box && !document.getElementById("df224DownloadFallback")){
      const aviso = document.createElement("div");
      aviso.id = "df224DownloadFallback";
      aviso.style.marginTop = "12px";
      aviso.style.padding = "12px";
      aviso.style.border = "1px solid #e2e8f0";
      aviso.style.borderRadius = "12px";
      aviso.style.background = "#f8fafc";
      aviso.innerHTML = `<b>CSV gerado.</b><br><a href="${url}" download="relatorio-dona-flor.csv" target="_blank">Toque aqui se o download não iniciar automaticamente.</a>`;
      box.appendChild(aviso);
    }

    setTimeout(function(){
      try{ a.remove(); }catch(e){}
      // Não revoga imediatamente para manter o link fallback funcionando no Android.
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
    }, 1000);
  };

  window.df224AbrirFiltros = abrirFiltros;
  window.gerarRelatorioFinanceiroDF = abrirFiltros;
  window.exportarCSV = abrirFiltros;

  window.executarRelatorio = function(){
    const sel = document.getElementById("acaoRelatorio");
    const acao = sel ? sel.value : "";
    if(acao === "pdf" || acao === "csv"){
      abrirFiltros();
    }
    if(sel) sel.value = "";
  };

  function configurarSelect(){
    css();

    document.querySelectorAll(".df-v221-report-actions").forEach(el => el.remove());

    const sel = document.getElementById("acaoRelatorio");
    if(!sel) return;

    sel.onchange = null;
    sel.removeAttribute("onchange");

    if(!sel.dataset.df224Bound){
      sel.dataset.df224Bound = "1";
      sel.addEventListener("change", function(e){
        e.preventDefault();
        e.stopPropagation();
        if(sel.value) window.executarRelatorio();
      }, true);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", configurarSelect, {once:true});
  }else{
    configurarSelect();
  }

  setTimeout(configurarSelect, 700);
  setTimeout(configurarSelect, 1600);
  setTimeout(configurarSelect, 3200);
})();




/* ==========================================================
   DONA FLOR - V22.5 CORREÇÃO BLOCO DE NOTAS
   Correções:
   - Corrige bug visual causado pela V22.3 no Bloco de notas
   - Remove botões Editar/Excluir duplicados fora dos cards
   - Remove rótulos soltos "Urgente/Normal" no cabeçalho da seção
   - Prioridade vira botão apenas dentro de cada card de nota
   - Mantém select original escondido para não quebrar a lógica
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V225_BLOCO_NOTAS_FIX__) return;
  window.__DONA_FLOR_V225_BLOCO_NOTAS_FIX__ = true;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function norm(v){
    return String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function label(v){
    const p = norm(v);
    if(p === "critico") return "Crítico";
    if(p === "urgente") return "Urgente";
    return "Normal";
  }

  function cls(v){
    const p = norm(v);
    if(p === "critico") return "critico";
    if(p === "urgente") return "urgente";
    return "normal";
  }

  function ico(v){
    const p = norm(v);
    if(p === "critico") return "🔥";
    if(p === "urgente") return "🔴";
    return "🟢";
  }

  function css(){
    if(document.getElementById("df-v225-bloco-css")) return;

    const style = document.createElement("style");
    style.id = "df-v225-bloco-css";
    style.textContent = `
      .df-prioridade-select-original-v223,
      .df-prioridade-select-original-v225{
        display:none !important;
      }

      .df-prioridade-box-v225{
        position:relative !important;
        width:100% !important;
        margin:10px 0 !important;
        z-index:20 !important;
      }

      .df-btn-prioridade-v225{
        width:100% !important;
        min-height:44px !important;
        border-radius:12px !important;
        border:1px solid #CBD5E1 !important;
        background:#F8FAFC !important;
        color:#0F172A !important;
        font-weight:900 !important;
        font-size:15px !important;
        padding:10px 12px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:10px !important;
        cursor:pointer !important;
        box-shadow:none !important;
      }

      .df-btn-prioridade-v225.normal{
        background:#ECFDF5 !important;
        color:#047857 !important;
        border-color:#A7F3D0 !important;
      }

      .df-btn-prioridade-v225.urgente{
        background:#FEE2E2 !important;
        color:#B91C1C !important;
        border-color:#FECACA !important;
      }

      .df-btn-prioridade-v225.critico{
        background:#7F1D1D !important;
        color:#FFFFFF !important;
        border-color:#450A0A !important;
      }

      .df-prioridade-menu-v225{
        display:none !important;
        position:absolute !important;
        left:0 !important;
        right:0 !important;
        top:50px !important;
        background:#FFFFFF !important;
        border:2px solid #000 !important;
        border-radius:14px !important;
        box-shadow:4px 4px 0 #000 !important;
        overflow:hidden !important;
        z-index:99999 !important;
      }

      .df-prioridade-box-v225.open .df-prioridade-menu-v225{
        display:block !important;
      }

      .df-prioridade-opcao-v225{
        width:100% !important;
        min-height:44px !important;
        border:0 !important;
        border-bottom:1px solid #E2E8F0 !important;
        background:#FFFFFF !important;
        color:#0F172A !important;
        font-weight:900 !important;
        padding:12px !important;
        text-align:left !important;
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
        cursor:pointer !important;
        box-shadow:none !important;
        border-radius:0 !important;
      }

      .df-prioridade-opcao-v225:last-child{ border-bottom:0 !important; }
      .df-prioridade-opcao-v225.normal{color:#047857 !important;}
      .df-prioridade-opcao-v225.urgente{color:#B91C1C !important;}
      .df-prioridade-opcao-v225.critico{color:#7F1D1D !important;}

      /* evita que prioridade vire rótulo solto acima do título */
      .df-v225-prioridade-solta{
        display:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function blocoNotas(){
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"))
      .filter(el => /bloco de notas/i.test(txt(el)));
    return candidates.sort((a,b) => txt(b).length - txt(a).length)[0] || null;
  }

  function isBotaoAcao(el){
    const t = txt(el).toLowerCase();
    return t === "editar" || t === "📝 editar" || t === "excluir" || t === "🗑️ excluir" || t.includes("editar") || t.includes("excluir");
  }

  function limparDuplicadosSoltos(){
    const bloco = blocoNotas();
    if(!bloco) return;

    const cards = Array.from(bloco.children).filter(ch => {
      const t = txt(ch).toLowerCase();
      return t.includes("editar") && t.includes("excluir") && !/bloco de notas/i.test(t);
    });

    // Remove botões de ação diretos que ficaram soltos no final da seção, fora de card de nota.
    Array.from(bloco.children).forEach(ch => {
      const t = txt(ch).toLowerCase().trim();
      const isSolto = (
        (t === "editar" || t === "📝 editar" || t === "excluir" || t === "🗑️ excluir") ||
        (t.includes("editar") && t.includes("excluir") && !t.includes("vamos") && !t.includes("recisao") && !t.includes("enviar"))
      );

      const ehCardNota = t.includes("editar") && t.includes("excluir") && (
        t.includes("normal") || t.includes("urgente") || t.includes("critico") || t.includes("crítico")
      ) && (t.includes("2026") || t.includes("recis") || t.includes("vamos") || t.includes("enviar"));

      if(isSolto && !ehCardNota){
        ch.remove();
      }
    });

    // Remove labels de prioridade soltos no cabeçalho do bloco.
    Array.from(bloco.querySelectorAll("span,b,strong,div")).forEach(el => {
      const t = txt(el).toLowerCase().trim();
      if((t === "🔴 urgente" || t === "urgente" || t === "🟢 normal" || t === "normal") && el.parentElement === bloco){
        el.classList.add("df-v225-prioridade-solta");
      }
    });
  }

  async function salvarPrioridade(select, id, valor){
    const novo = label(valor);

    if(select){
      select.value = novo;
      select.dispatchEvent(new Event("change", { bubbles:true }));
    }

    try{
      if(typeof window.alterarPrioridade === "function"){
        try { return window.alterarPrioridade(select, id, novo); } catch(e){}
        try { return window.alterarPrioridade(id, novo); } catch(e){}
        try { return window.alterarPrioridade(novo, id); } catch(e){}
      }
    }catch(e){}

    try{
      if(typeof window.alterarPrioridadeNotaDF === "function"){
        return window.alterarPrioridadeNotaDF(id, novo);
      }
    }catch(e){}

    try{
      if(id && typeof SupabaseURL !== "undefined" && typeof SupabaseKey !== "undefined"){
        await fetch(SupabaseURL + "/rest/v1/df_notas?id=eq." + encodeURIComponent(id), {
          method:"PATCH",
          headers:{
            "apikey": SupabaseKey,
            "Authorization":"Bearer " + SupabaseKey,
            "Content-Type":"application/json",
            "Prefer":"return=representation"
          },
          body:JSON.stringify({ prioridade: novo })
        });
        if(typeof carregar === "function") carregar();
      }
    }catch(e){}
  }

  function idNota(card){
    const onclicks = Array.from(card.querySelectorAll("[onclick]")).map(el => el.getAttribute("onclick") || "").join(" ");
    const m = onclicks.match(/(?:editarNotaDF|excluirNota|excluirNotaDF|alterarPrioridade)\s*\(\s*['"]?([^,'")]+)['"]?/i);
    if(m) return m[1];
    return card.getAttribute("data-id") || card.getAttribute("data-nota-id") || "";
  }

  function transformarSelect(select){
    if(!select || select.dataset.df225Ok) return;

    const card = select.closest(".card,section,article,div");
    if(!card) return;

    const textoCard = txt(card).toLowerCase();

    // Só aplica em card de nota, não em filtros, status, centros ou exportar.
    const ehNota = textoCard.includes("editar") && textoCard.includes("excluir") && 
                   (textoCard.includes("normal") || textoCard.includes("urgente") || textoCard.includes("critico") || textoCard.includes("crítico"));

    if(!ehNota) return;

    select.dataset.df225Ok = "1";
    select.classList.add("df-prioridade-select-original-v225");

    // Remove botão antigo da V22.3 se existir ao lado.
    const next = select.nextElementSibling;
    if(next && next.classList && next.classList.contains("df-prioridade-box-v223")){
      next.remove();
    }

    const atual = label(select.value || select.options?.[select.selectedIndex]?.text || "Normal");
    const id = idNota(card);

    const box = document.createElement("div");
    box.className = "df-prioridade-box-v225";
    box.innerHTML = `
      <button type="button" class="df-btn-prioridade-v225 ${cls(atual)}">
        <span>${ico(atual)} Prioridade</span>
        <strong>${atual}</strong>
      </button>
      <div class="df-prioridade-menu-v225">
        <button type="button" class="df-prioridade-opcao-v225 normal" data-p="Normal">🟢 Normal</button>
        <button type="button" class="df-prioridade-opcao-v225 urgente" data-p="Urgente">🔴 Urgente</button>
        <button type="button" class="df-prioridade-opcao-v225 critico" data-p="Crítico">🔥 Crítico</button>
      </div>
    `;

    select.parentNode.insertBefore(box, select.nextSibling);

    const btn = box.querySelector(".df-btn-prioridade-v225");
    const strong = btn.querySelector("strong");

    btn.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".df-prioridade-box-v225.open").forEach(b => {
        if(b !== box) b.classList.remove("open");
      });

      box.classList.toggle("open");
    });

    box.querySelectorAll(".df-prioridade-opcao-v225").forEach(op => {
      op.addEventListener("click", async function(e){
        e.preventDefault();
        e.stopPropagation();

        const novo = op.dataset.p;
        btn.classList.remove("normal","urgente","critico");
        btn.classList.add(cls(novo));
        btn.querySelector("span").textContent = `${ico(novo)} Prioridade`;
        strong.textContent = label(novo);
        box.classList.remove("open");

        await salvarPrioridade(select, id, novo);
      });
    });
  }

  function aplicar(){
    css();
    limparDuplicadosSoltos();

    const bloco = blocoNotas();
    if(!bloco) return;

    const selects = Array.from(bloco.querySelectorAll("select")).filter(sel => {
      const t = (sel.textContent || "").toLowerCase();
      const id = (sel.id || "").toLowerCase();
      return t.includes("normal") && t.includes("urgente") && !id.includes("status") && !id.includes("acao") && !id.includes("centro");
    });

    selects.forEach(transformarSelect);
  }

  document.addEventListener("click", function(e){
    if(!e.target.closest(".df-prioridade-box-v225")){
      document.querySelectorAll(".df-prioridade-box-v225.open").forEach(b => b.classList.remove("open"));
    }
  }, true);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, {once:true});
  }else{
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3200);
})();




/* ==========================================================
   DONA FLOR - V22.6 PDF CORRIGIDO
   Correção:
   - PDF não usa mais iframe nem document.write direto
   - Gera página HTML limpa via Blob URL
   - Abre relatório em nova aba renderizado corretamente
   - Botão Imprimir/PDF dentro da página limpa
   - Mantém CSV funcionando da V22.4/V22.5
   ========================================================== */
(function(){
  if (window.__DONA_FLOR_V226_PDF_CORRIGIDO__) return;
  window.__DONA_FLOR_V226_PDF_CORRIGIDO__ = true;

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function moeda(v){
    return Number(v || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  }

  function dataBR(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  }

  function hojeISO(){
    return new Date().toISOString().slice(0,10);
  }

  function getContasBase(){
    try{
      if(Array.isArray(window.contasRelatorioCache) && window.contasRelatorioCache.length) return window.contasRelatorioCache;
    }catch(e){}

    try{
      if(typeof visContas === "function"){
        const r = visContas();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof getContasArrayDF === "function"){
        const r = getContasArrayDF();
        if(Array.isArray(r)) return r.filter(c => !c.deletado);
      }
    }catch(e){}

    for(const nome of ["contasDados","contas","df_contas","contasDF"]){
      try{
        if(Array.isArray(window[nome])) return window[nome].filter(c => !c.deletado);
      }catch(e){}
    }

    return [];
  }

  function lerFiltrosPDF(){
    return {
      centro: document.getElementById("df224Centro")?.value || document.getElementById("df222Centro")?.value || "",
      status: document.getElementById("df224Status")?.value || document.getElementById("df222Status")?.value || "",
      dataInicio: document.getElementById("df224Inicio")?.value || document.getElementById("df222Inicio")?.value || "",
      dataFim: document.getElementById("df224Fim")?.value || document.getElementById("df222Fim")?.value || "",
      resumo: (document.getElementById("df224Resumo")?.checked ?? document.getElementById("df222Resumo")?.checked) !== false,
      centroResumo: (document.getElementById("df224CentroResumo")?.checked ?? document.getElementById("df222CentroResumo")?.checked) !== false,
      detalhe: (document.getElementById("df224Detalhe")?.checked ?? document.getElementById("df222Detalhe")?.checked) !== false,
      aberto: document.getElementById("df224Aberto")?.checked || document.getElementById("df222Aberto")?.checked || false
    };
  }

  function filtrarContas(f){
    return getContasBase().filter(c=>{
      const centro = c.centro || c.centro_custo || c.loja || "";
      const status = c.status || "Aberto";
      const data = String(c.vencimento || c.data_vencimento || "").slice(0,10);

      if(f.centro && centro !== f.centro) return false;
      if(f.status && status !== f.status) return false;
      if(f.aberto && String(status).toLowerCase() === "pago") return false;
      if(f.dataInicio && data && data < f.dataInicio) return false;
      if(f.dataFim && data && data > f.dataFim) return false;
      return true;
    });
  }

  function resumo(contas){
    const hoje = hojeISO();
    const abertas = contas.filter(c => String(c.status || "").toLowerCase() !== "pago");
    const pagas = contas.filter(c => String(c.status || "").toLowerCase() === "pago");
    const vencidas = abertas.filter(c => String(c.vencimento || c.data_vencimento || "").slice(0,10) < hoje);

    return {
      qtd: contas.length,
      totalAberto: abertas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalPago: pagas.reduce((a,c)=>a+Number(c.valor||0),0),
      totalVencido: vencidas.reduce((a,c)=>a+Number(c.valor||0),0)
    };
  }

  function porCentro(contas){
    const map = {};
    contas.forEach(c => {
      const centro = c.centro || c.centro_custo || c.loja || "Sem centro";
      if(!map[centro]) map[centro] = {qtd:0,total:0};
      map[centro].qtd++;
      map[centro].total += Number(c.valor || 0);
    });
    return Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  }

  function montarHTMLRelatorio(f){
    const contas = filtrarContas(f);
    const r = resumo(contas);
    const centros = porCentro(contas);

    const filtroDesc = [
      f.centro ? "Centro: " + f.centro : "Todos os centros",
      f.status ? "Status: " + f.status : "Todos os status",
      f.dataInicio ? "De " + dataBR(f.dataInicio) : "",
      f.dataFim ? "Até " + dataBR(f.dataFim) : "",
      f.aberto ? "Somente em aberto" : ""
    ].filter(Boolean).join(" • ");

    const cards = f.resumo ? `
      <div class="cards">
        <div class="card"><div class="label">Quantidade</div><div class="num">${r.qtd}</div></div>
        <div class="card"><div class="label">Total aberto</div><div class="num">${moeda(r.totalAberto)}</div></div>
        <div class="card"><div class="label">Pago</div><div class="num">${moeda(r.totalPago)}</div></div>
        <div class="card"><div class="label">Vencidas</div><div class="num">${moeda(r.totalVencido)}</div></div>
      </div>
    ` : "";

    const centrosHTML = f.centroResumo ? `
      <h2>Resumo por centro</h2>
      <div class="centros">
        ${centros.length ? centros.map(([centro, info]) => `
          <div class="centro">
            <div><strong>${esc(centro)}</strong><small>${info.qtd} conta(s)</small></div>
            <b>${moeda(info.total)}</b>
          </div>
        `).join("") : `<div class="empty">Nenhum centro encontrado.</div>`}
      </div>
    ` : "";

    const linhas = contas.map(c => {
      const status = c.status || "Aberto";
      const pago = String(status).toLowerCase() === "pago";
      return `
        <tr>
          <td><strong>${esc(c.descricao || c.conta || "Sem descrição")}</strong></td>
          <td>${esc(c.centro || c.centro_custo || c.loja || "-")}</td>
          <td>${dataBR(c.vencimento || c.data_vencimento)}</td>
          <td><span class="status ${pago ? "pago" : "aberto"}">${esc(status)}</span></td>
          <td class="valor">${moeda(c.valor)}</td>
          <td>${esc(c.observacao || "")}</td>
        </tr>
      `;
    }).join("");

    const detalhes = f.detalhe ? `
      <h2>Detalhamento</h2>
      ${contas.length ? `
        <table>
          <thead>
            <tr>
              <th>Conta</th>
              <th>Centro</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      ` : `<div class="empty">Nenhuma conta encontrada para os filtros selecionados.</div>`}
    ` : "";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Relatório Dona Flor</title>
<style>
  *{box-sizing:border-box}
  body{
    margin:0;
    padding:18px;
    background:#ffffff;
    color:#0f172a;
    font-family:Arial, Helvetica, sans-serif;
  }
  .page{
    max-width:980px;
    margin:0 auto;
    background:#fff;
  }
  .top{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:12px;
    border-bottom:1px solid #e2e8f0;
    padding-bottom:12px;
    margin-bottom:14px;
  }
  h1{
    color:#0f766e;
    margin:0;
    font-size:24px;
    line-height:1.1;
  }
  h2{
    font-size:18px;
    margin:18px 0 8px;
  }
  .sub{
    color:#64748b;
    font-size:12px;
    margin-top:4px;
  }
  .actions{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
  }
  button{
    min-height:40px;
    border-radius:10px;
    border:2px solid #000;
    box-shadow:3px 3px 0 #000;
    background:#0f766e;
    color:#fff;
    font-weight:900;
    padding:8px 12px;
    cursor:pointer;
  }
  .cards{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:8px;
    margin:12px 0;
  }
  .card{
    border:1px solid #e2e8f0;
    border-radius:10px;
    padding:10px;
    background:#fafaf9;
  }
  .label{
    font-size:10px;
    text-transform:uppercase;
    color:#64748b;
    font-weight:bold;
  }
  .num{
    font-size:17px;
    font-weight:bold;
    margin-top:3px;
  }
  .centros{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:8px;
    margin:8px 0 14px;
  }
  .centro{
    display:flex;
    justify-content:space-between;
    gap:8px;
    border:1px solid #e2e8f0;
    border-radius:10px;
    padding:8px;
  }
  .centro small{
    display:block;
    color:#64748b;
    margin-top:2px;
  }
  table{
    width:100%;
    border-collapse:collapse;
    font-size:12px;
  }
  th{
    background:#0f766e;
    color:white;
    text-align:left;
    padding:7px;
  }
  td{
    border-bottom:1px solid #e2e8f0;
    padding:7px;
    vertical-align:top;
  }
  .valor{
    font-weight:bold;
    white-space:nowrap;
  }
  .status{
    border-radius:999px;
    padding:3px 7px;
    font-weight:bold;
    font-size:11px;
    display:inline-block;
  }
  .pago{background:#dcfce7;color:#15803d}
  .aberto{background:#fef3c7;color:#92400e}
  .empty{
    padding:14px;
    border:1px dashed #cbd5e1;
    border-radius:10px;
    color:#64748b;
    text-align:center;
  }
  @media(max-width:760px){
    body{padding:12px}
    .top{display:block}
    .actions{margin-top:10px}
    .cards{grid-template-columns:1fr 1fr}
    .centros{grid-template-columns:1fr}
    table{font-size:11px}
  }
  @media print{
    body{padding:0}
    .actions{display:none}
    @page{margin:12mm}
  }
</style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div>
        <h1>Dona Flor Gestão Financeira</h1>
        <div class="sub">Relatório financeiro • ${esc(new Date().toLocaleString("pt-BR"))}</div>
        <div class="sub">${esc(filtroDesc)}</div>
      </div>
      <div class="actions">
        <button onclick="window.print()">Imprimir / Salvar PDF</button>
      </div>
    </div>
    ${cards}
    ${centrosHTML}
    ${detalhes}
  </div>
</body>
</html>`;
  }

  window.df226GerarPDF = function(){
    const f = lerFiltrosPDF();
    const html = montarHTMLRelatorio(f);
    const blob = new Blob([html], {type:"text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    const win = window.open(url, "_blank");

    if(!win){
      alert("O navegador bloqueou a abertura do relatório. Toque novamente ou permita pop-ups.");
      return;
    }

    setTimeout(function(){
      try{ URL.revokeObjectURL(url); }catch(e){}
    }, 60000);
  };

  // Sobrescreve botões antigos de PDF mantendo CSV intacto.
  window.df224GerarPDF = window.df226GerarPDF;
  window.df222GerarPDF = window.df226GerarPDF;

  function corrigirBotoesPDF(){
    document.querySelectorAll("button").forEach(btn => {
      const t = (btn.innerText || btn.textContent || "").trim().toLowerCase();
      const old = btn.getAttribute("onclick") || "";

      if(t.includes("gerar pdf") || t.includes("imprimir") || old.includes("df224GerarPDF") || old.includes("df222GerarPDF")){
        btn.setAttribute("onclick", "window.df226GerarPDF()");
      }
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", corrigirBotoesPDF, {once:true});
  }else{
    corrigirBotoesPDF();
  }

  setTimeout(corrigirBotoesPDF, 700);
  setTimeout(corrigirBotoesPDF, 1600);
  setTimeout(corrigirBotoesPDF, 3200);
})();

