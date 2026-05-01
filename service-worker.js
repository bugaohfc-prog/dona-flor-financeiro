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

