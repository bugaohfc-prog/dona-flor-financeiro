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




/* =========================
   V20.5 - Segurança + UX Mobile
   - Soft delete: contas/notas vão para lixeira
   - Modal fecha ao clicar fora
   - Tipografia moderna
   - Cards com mais respiro
   - Botões com touch target melhor no celular
   ========================= */
(function(){
  if (window.__DF_V205_SEG_UX__) return;
  window.__DF_V205_SEG_UX__ = true;

  function injectCss(){
    if (document.getElementById("df-v205-seg-ux-css")) return;

    const style = document.createElement("style");
    style.id = "df-v205-seg-ux-css";
    style.textContent = `
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
        background-color: #F1F5F9 !important;
        color: #1F2937 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .df-force-white-card,
      .card,
      section {
        background-color: #FFFFFF !important;
        border: 1px solid #E2E8F0 !important;
        border-radius: 12px !important;
        padding: 20px !important;
        margin-bottom: 15px !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.10) !important;
      }

      .df-btn-small-prioridade,
      button[onclick*="excluir"],
      button[onclick*="injetarForm"],
      button[onclick*="editar"],
      button[onclick*="alterar"],
      select,
      .df-note-actions-v20 button,
      .df-note-actions-v201 button,
      .df-note-actions-v21 button,
      .df-note-actions-v20 select,
      .df-note-actions-v201 select,
      .df-note-actions-v21 select {
        min-height: 40px !important;
        padding: 8px 12px !important;
        margin: 4px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
      }

      input, textarea, select {
        font-family: inherit !important;
        font-size: 15px !important;
      }

      button {
        font-family: inherit !important;
        touch-action: manipulation !important;
      }

      @media (max-width: 760px) {
        .df-force-white-card,
        .card,
        section {
          padding: 16px !important;
          margin-bottom: 12px !important;
        }

        button,
        select {
          min-height: 42px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function softDeleteContaFallback(id){
    if (typeof SupabaseURL === "undefined" || typeof SupabaseKey === "undefined") return null;

    return fetch(SupabaseURL + "/rest/v1/df_contas?id=eq." + id, {
      method: "PATCH",
      headers: {
        "apikey": SupabaseKey,
        "Authorization": "Bearer " + SupabaseKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        deletado: true,
        data_exclusao: new Date().toISOString()
      })
    });
  }

  function softDeleteNotaFallback(id){
    if (typeof SupabaseURL === "undefined" || typeof SupabaseKey === "undefined") return null;

    return fetch(SupabaseURL + "/rest/v1/df_notas?id=eq." + id, {
      method: "PATCH",
      headers: {
        "apikey": SupabaseKey,
        "Authorization": "Bearer " + SupabaseKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        deletado: true,
        data_exclusao: new Date().toISOString()
      })
    });
  }

  // Sobrescreve funções globais antigas se existirem
  window.excluirConta = async function(id){
    if (typeof isAdmin === "function" && !isAdmin()) {
      return alert("Operação restrita a administradores.");
    }

    if (confirm("Deseja mover esta conta para a Lixeira?")) {
      if (typeof render_loading === "function") render_loading(true);

      await softDeleteContaFallback(id);

      if (typeof carregar === "function") carregar();
    }
  };

  window.excluirNota = async function(id){
    if (typeof isAdmin === "function" && !isAdmin()) {
      return alert("Operação restrita a administradores.");
    }

    if (confirm("Deseja mover esta nota para a Lixeira?")) {
      if (typeof render_loading === "function") render_loading(true);

      await softDeleteNotaFallback(id);

      if (typeof carregar === "function") carregar();
    }
  };

  function fecharModalGenerico(modal){
    if (!modal) return;
    modal.classList.remove("open");
    modal.style.display = "none";
  }

  document.addEventListener("click", function(event){
    const modalNotas = document.getElementById("df-modal-notas-v203");
    const modalConta = document.getElementById("df-modal-conta-v204");

    if (modalNotas && event.target === modalNotas) {
      fecharModalGenerico(modalNotas);
      if (typeof fecharModal === "function") {
        try { fecharModal(); } catch(e){}
      }
      if (typeof fecharModalNotas === "function") {
        try { fecharModalNotas(); } catch(e){}
      }
    }

    if (modalConta && event.target === modalConta) {
      fecharModalGenerico(modalConta);
      if (typeof fecharModalConta === "function") {
        try { fecharModalConta(); } catch(e){}
      }
    }
  });

  injectCss();
})();




/* =========================
   V20.6 - Correção dos botões +
   - Corrige modal vazio
   - Botão + do Bloco de notas abre formulário de nota
   - Botão + das Contas a pagar abre formulário de conta
   - Remove classe hidden ao colocar formulário no modal
   ========================= */
(function(){
  if (window.__DF_V206_PLUS_FIX__) return;
  window.__DF_V206_PLUS_FIX__ = true;

  let notaForm = null;
  let contaForm = null;

  function txt(el){
    return (el?.innerText || el?.textContent || "").trim();
  }

  function injectCss(){
    if(document.getElementById("df-v206-plus-fix-css")) return;

    const style = document.createElement("style");
    style.id = "df-v206-plus-fix-css";
    style.textContent = `
      .df-v206-hidden{display:none !important;}

      .df-v206-add-btn{
        width:42px !important;
        height:42px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#0f766e !important;
        color:#ffffff !important;
        font-size:24px !important;
        font-weight:900 !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        box-shadow:0 8px 22px rgba(15,118,110,.25) !important;
        cursor:pointer !important;
      }

      .df-v206-header{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
      }

      .df-v206-modal{
        position:fixed !important;
        inset:0 !important;
        background:rgba(15,23,42,.55) !important;
        z-index:999999 !important;
        display:none !important;
        align-items:flex-end !important;
        justify-content:center !important;
      }

      .df-v206-modal.open{
        display:flex !important;
      }

      .df-v206-sheet{
        width:100% !important;
        max-width:660px !important;
        background:#ffffff !important;
        border-radius:24px 24px 0 0 !important;
        padding:18px !important;
        max-height:88vh !important;
        overflow:auto !important;
        box-shadow:0 -12px 40px rgba(15,23,42,.25) !important;
      }

      .df-v206-sheet-head{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        margin-bottom:14px !important;
      }

      .df-v206-sheet-title{
        font-size:22px !important;
        font-weight:900 !important;
        color:#0f172a !important;
      }

      .df-v206-close{
        width:40px !important;
        height:40px !important;
        border-radius:999px !important;
        border:0 !important;
        background:#f1f5f9 !important;
        color:#0f172a !important;
        font-size:24px !important;
        font-weight:900 !important;
      }

      .df-v206-sheet .df-force-white-card,
      .df-v206-sheet section,
      .df-v206-sheet .card{
        background:#ffffff !important;
        box-shadow:none !important;
        border:0 !important;
        padding:0 !important;
        margin:0 !important;
      }

      .df-v206-sheet h1,
      .df-v206-sheet h2,
      .df-v206-sheet h3{
        display:none !important;
      }

      .df-v206-sheet input,
      .df-v206-sheet textarea,
      .df-v206-sheet select{
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removeHiddenDeep(el){
    if(!el) return;

    const all = [el, ...Array.from(el.querySelectorAll("*"))];

    all.forEach(node => {
      node.classList?.forEach(cls => {
        if(/^df-hidden|^df-v206-hidden|hidden/i.test(cls)){
          node.classList.remove(cls);
        }
      });

      if(node.style){
        if(node.style.display === "none") node.style.display = "";
        node.style.visibility = "";
        node.style.opacity = "";
      }
    });
  }

  function hideEl(el){
    if(!el) return;
    el.classList.add("df-v206-hidden");
  }

  function closestUsefulCard(el){
    let cur = el;
    while(cur && cur !== document.body){
      const t = txt(cur).toLowerCase();

      const hasInputs =
        cur.querySelectorAll &&
        cur.querySelectorAll("input,textarea,select").length >= 2;

      const compactEnough = t.length < 2500;

      if(hasInputs && compactEnough) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function findFormBySaveText(saveRegex){
    const buttons = Array.from(document.querySelectorAll("button,input[type='button'],input[type='submit']"));
    const btn = buttons.find(b => saveRegex.test(txt(b) || b.value || ""));
    if(btn) return closestUsefulCard(btn);

    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"))
      .filter(el => {
        const t = txt(el).toLowerCase();
        return saveRegex.test(t) && el.querySelectorAll("input,textarea,select").length >= 2;
      })
      .sort((a,b) => txt(a).length - txt(b).length);

    return candidates[0] || null;
  }

  function captureNotaForm(){
    if(notaForm) return notaForm;

    notaForm = findFormBySaveText(/salvar nota/i);

    if(notaForm){
      hideEl(notaForm);
    }

    return notaForm;
  }

  function captureContaForm(){
    if(contaForm) return contaForm;

    contaForm = findFormBySaveText(/salvar conta/i);

    if(contaForm){
      hideEl(contaForm);
    }

    return contaForm;
  }

  function createModal(id, title){
    let modal = document.getElementById(id);
    if(modal) return modal;

    modal = document.createElement("div");
    modal.id = id;
    modal.className = "df-v206-modal";
    modal.innerHTML = `
      <div class="df-v206-sheet">
        <div class="df-v206-sheet-head">
          <div class="df-v206-sheet-title">${title}</div>
          <button type="button" class="df-v206-close">×</button>
        </div>
        <div class="df-v206-body"></div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".df-v206-close").addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => {
      if(e.target === modal) closeModal(modal);
    });

    return modal;
  }

  function openNotaModal(){
    injectCss();

    const modal = createModal("df-v206-modal-nota", "Lançamento de notas");
    const body = modal.querySelector(".df-v206-body");

    const form = captureNotaForm();

    body.innerHTML = "";

    if(form){
      body.appendChild(form);
      removeHiddenDeep(form);
    } else {
      body.innerHTML = `<div style="padding:14px;color:#b91c1c;font-weight:800;">Não encontrei o formulário de nota nesta versão.</div>`;
    }

    modal.classList.add("open");
  }

  function openContaModal(){
    injectCss();

    const modal = createModal("df-v206-modal-conta", "Lançamento de contas");
    const body = modal.querySelector(".df-v206-body");

    const form = captureContaForm();

    body.innerHTML = "";

    if(form){
      body.appendChild(form);
      removeHiddenDeep(form);
    } else {
      body.innerHTML = `<div style="padding:14px;color:#b91c1c;font-weight:800;">Não encontrei o formulário de conta nesta versão.</div>`;
    }

    modal.classList.add("open");
  }

  function closeModal(modal){
    if(!modal) return;
    modal.classList.remove("open");

    const form = modal.querySelector(".df-v206-body > *");
    if(form){
      hideEl(form);
    }
  }

  function findSectionByTitle(titleRegex){
    const candidates = Array.from(document.querySelectorAll("section,article,.card,div"));
    return candidates
      .filter(el => titleRegex.test(txt(el)))
      .sort((a,b) => txt(a).length - txt(b).length)[0] || null;
  }

  function addPlusToSection(titleRegex, btnClass, handler){
    const sec = findSectionByTitle(titleRegex);
    if(!sec) return;

    if(sec.querySelector("." + btnClass)) return;

    const title = Array.from(sec.querySelectorAll("h1,h2,h3,h4,strong,div"))
      .find(el => titleRegex.test(txt(el)) && txt(el).length < 80);

    if(!title) return;

    let wrapper = title.closest(".df-v206-header");
    if(!wrapper){
      wrapper = document.createElement("div");
      wrapper.className = "df-v206-header";
      title.parentNode.insertBefore(wrapper, title);
      wrapper.appendChild(title);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "df-v206-add-btn " + btnClass;
    btn.textContent = "+";
    btn.title = titleRegex.test("Bloco de notas") ? "Adicionar nota" : "Adicionar conta";
    btn.addEventListener("click", handler);

    wrapper.appendChild(btn);
  }

  function hideFixedForms(){
    const nf = captureNotaForm();
    const cf = captureContaForm();

    if(nf && !document.getElementById("df-v206-modal-nota")?.contains(nf)) hideEl(nf);
    if(cf && !document.getElementById("df-v206-modal-conta")?.contains(cf)) hideEl(cf);
  }

  function cleanOldEmptyModals(){
    // se modais antigos abriram vazios, fecha para não confundir
    ["df-modal-notas-v203", "df-modal-conta-v204"].forEach(id => {
      const modal = document.getElementById(id);
      if(modal && (modal.classList.contains("open") || modal.style.display === "flex")){
        modal.classList.remove("open");
        modal.style.display = "none";
      }
    });
  }

  function aplicar(){
    injectCss();
    captureNotaForm();
    captureContaForm();
    addPlusToSection(/bloco de notas/i, "df-v206-add-nota", openNotaModal);
    addPlusToSection(/contas a pagar/i, "df-v206-add-conta", openContaModal);
    hideFixedForms();
    cleanOldEmptyModals();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  setTimeout(aplicar, 700);
  setTimeout(aplicar, 1600);
  setTimeout(aplicar, 3000);
})();

