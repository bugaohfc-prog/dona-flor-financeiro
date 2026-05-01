const CACHE_NAME = "dona-flor-v21-5-menu-config";
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

