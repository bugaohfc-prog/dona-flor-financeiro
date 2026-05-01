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
   V21 UX App Pago - Dona Flor
   Bloco de notas clean, animação, cores inteligentes,
   edição inline, botões leves: Editar / Excluir / Prioridade
   ========================= */
(function(){
  if (window.__DF_V21_UX_PAGO__) return;
  window.__DF_V21_UX_PAGO__ = true;

  const DF21 = {
    norm(v){
      const s = String(v || "Normal").toLowerCase().trim();
      if (s.includes("urgente") || s.includes("alta") || s.includes("alto")) return "Urgente";
      if (s.includes("média") || s.includes("media") || s.includes("importante")) return "Alto";
      return "Normal";
    },
    color(v){
      const p = this.norm(v);
      if (p === "Urgente") return "#dc2626";
      if (p === "Alto") return "#f59e0b";
      return "#0f766e";
    },
    soft(v){
      const p = this.norm(v);
      if (p === "Urgente") return "#fef2f2";
      if (p === "Alto") return "#fffbeb";
      return "#ecfdf5";
    },
    label(v){
      const p = this.norm(v);
      if (p === "Urgente") return "Urgente";
      if (p === "Alto") return "Alto";
      return "Normal";
    }
  };

  function injectCss(){
    const removeIds = ["df-v20-ux-css", "df-v201-final-css", "df-v21-ux-css"];
    removeIds.forEach(id => document.getElementById(id)?.remove());

    const style = document.createElement("style");
    style.id = "df-v21-ux-css";
    style.textContent = `
      @keyframes dfFadeUp {
        from { opacity:0; transform: translateY(8px); }
        to { opacity:1; transform: translateY(0); }
      }

      .df-note-card-v20,
      .df-note-card-v201,
      .df-note-card-v21{
        background:#ffffff !important;
        border:1px solid #e5e7eb !important;
        border-left:5px solid #0f766e !important;
        border-radius:18px !important;
        padding:14px !important;
        margin:12px 0 !important;
        box-shadow:0 8px 24px rgba(15,23,42,.06) !important;
        animation:dfFadeUp .22s ease-out !important;
      }

      .df-note-card-v21[data-prioridade="Urgente"]{border-left-color:#dc2626 !important;background:linear-gradient(90deg,#fef2f2 0,#ffffff 18%) !important;}
      .df-note-card-v21[data-prioridade="Alto"]{border-left-color:#f59e0b !important;background:linear-gradient(90deg,#fffbeb 0,#ffffff 18%) !important;}
      .df-note-card-v21[data-prioridade="Normal"]{border-left-color:#0f766e !important;background:linear-gradient(90deg,#ecfdf5 0,#ffffff 18%) !important;}

      .df-note-actions-v20,
      .df-note-actions-v201,
      .df-prio-badge-v20,
      .df-prio-badge-v201{
        display:none !important;
      }

      .df-note-v21-top{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:10px !important;
        margin-bottom:8px !important;
      }

      .df-note-v21-prio{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        min-width:76px !important;
        padding:5px 10px !important;
        border-radius:999px !important;
        color:#fff !important;
        font-size:12px !important;
        font-weight:900 !important;
        letter-spacing:.2px !important;
        white-space:nowrap !important;
      }

      .df-note-v21-title-input,
      .df-note-v21-textarea{
        width:100% !important;
        box-sizing:border-box !important;
        background:transparent !important;
        border:1px solid transparent !important;
        color:#0f172a !important;
        outline:none !important;
      }

      .df-note-v21-title-input{
        font-size:16px !important;
        font-weight:900 !important;
        padding:4px 0 !important;
      }

      .df-note-v21-textarea{
        min-height:42px !important;
        resize:vertical !important;
        font-size:14px !important;
        line-height:1.45 !important;
        padding:6px 0 !important;
      }

      .df-note-v21-title-input:not(:disabled),
      .df-note-v21-textarea:not(:disabled){
        background:#f8fafc !important;
        border:1px solid #cbd5e1 !important;
        border-radius:10px !important;
        padding:8px !important;
      }

      .df-note-v21-date{
        color:#64748b !important;
        font-size:12px !important;
        font-weight:700 !important;
        margin-top:6px !important;
      }

      .df-note-actions-v21{
        display:grid !important;
        grid-template-columns:42px 42px 1fr !important;
        gap:8px !important;
        align-items:center !important;
        margin-top:12px !important;
      }

      .df-note-actions-v21 button{
        width:42px !important;
        height:38px !important;
        border:0 !important;
        border-radius:12px !important;
        font-size:15px !important;
        font-weight:900 !important;
        cursor:pointer !important;
        margin:0 !important;
        padding:0 !important;
        transition:transform .12s ease, opacity .12s ease !important;
      }

      .df-note-actions-v21 button:active{
        transform:scale(.96) !important;
      }

      .df-note-actions-v21 .df-v21-edit{
        background:#e0f2fe !important;
        color:#0369a1 !important;
      }

      .df-note-actions-v21 .df-v21-delete{
        background:#fee2e2 !important;
        color:#b91c1c !important;
      }

      .df-note-actions-v21 select{
        height:38px !important;
        border:1px solid #d1d5db !important;
        border-radius:12px !important;
        background:#fff !important;
        color:#111827 !important;
        padding:0 10px !important;
        font-size:13px !important;
        font-weight:800 !important;
        width:100% !important;
        margin:0 !important;
      }

      @media(max-width:760px){
        .df-note-actions-v21{
          grid-template-columns:40px 40px 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renameTexts(){
    document.querySelectorAll("h1,h2,h3,h4,button,span,a,label,div").forEach(el => {
      if(!el || !el.childNodes || el.childNodes.length !== 1) return;
      const txt = (el.textContent || "").trim();
      if(txt === "Adicionar lembrete" || txt === "Novo lembrete"){
        el.textContent = "Lançamento de notas";
      }
    });
  }

  function guessPriority(card){
    const txt = card.innerText || "";
    if (/urgente|alta|alto/i.test(txt)) return "Urgente";
    if (/m[eé]dia|importante/i.test(txt)) return "Alto";
    return "Normal";
  }

  function getNoteTextElements(card){
    const titleCandidates = Array.from(card.querySelectorAll("h1,h2,h3,h4,strong,b,.titulo,.nota-titulo,input"))
      .filter(el => !/editar|excluir|prioridade|normal|urgente|alto/i.test(el.textContent || el.value || ""));
    const titleEl = titleCandidates[0];

    const textCandidates = Array.from(card.querySelectorAll("p,textarea,.texto,.nota-texto,div"))
      .filter(el => {
        const t = (el.textContent || el.value || "").trim();
        return t && !/editar|excluir|prioridade|normal|urgente|alto|lançamento|bloco/i.test(t) && t.length < 400;
      });
    const textEl = textCandidates.find(el => el !== titleEl) || null;

    return { titleEl, textEl };
  }

  function melhorarNotas(){
    const cards = Array.from(document.querySelectorAll(".nota-card,.note-card,.lembrete-card,[data-nota-id],.card"))
      .filter(card => /editar|excluir|prioridade|normal|urgente|alto|média|media/i.test(card.innerText || ""));

    cards.forEach(card => {
      if (card.dataset.dfV21Applied === "1") return;
      card.dataset.dfV21Applied = "1";

      const prioridade = guessPriority(card);
      card.classList.remove("df-note-card-v20", "df-note-card-v201", "df-prio-normal", "df-prio-media", "df-prio-urgente");
      card.classList.add("df-note-card-v21");
      card.setAttribute("data-prioridade", prioridade);

      // Remove blocos duplicados antigos
      card.querySelectorAll(".df-note-actions-v20,.df-note-actions-v201,.df-note-actions-v21,.df-prio-badge-v20,.df-prio-badge-v201,.df-note-v21-top").forEach(el => el.remove());

      // Cria topo com prioridade única
      const top = document.createElement("div");
      top.className = "df-note-v21-top";

      const badge = document.createElement("span");
      badge.className = "df-note-v21-prio";
      badge.textContent = prioridade;
      badge.style.background = DF21.color(prioridade);

      top.appendChild(badge);
      card.insertBefore(top, card.firstChild);

      const { titleEl, textEl } = getNoteTextElements(card);

      let titleInput = card.querySelector(".df-note-v21-title-input");
      if (!titleInput) {
        titleInput = document.createElement("input");
        titleInput.className = "df-note-v21-title-input";
        titleInput.disabled = true;
        titleInput.value = (titleEl?.textContent || titleEl?.value || "Sem título").trim();
        if (titleEl && titleEl.parentNode === card) {
          titleEl.replaceWith(titleInput);
        } else {
          top.insertBefore(titleInput, badge);
        }
      }

      let textarea = card.querySelector(".df-note-v21-textarea");
      if (!textarea) {
        textarea = document.createElement("textarea");
        textarea.className = "df-note-v21-textarea";
        textarea.disabled = true;
        textarea.value = (textEl?.textContent || textEl?.value || "").trim();
        if(textEl && textEl.parentNode === card && !textEl.classList.contains("df-note-v21-title-input")){
          textEl.replaceWith(textarea);
        } else {
          card.insertBefore(textarea, top.nextSibling);
        }
      }

      const buttons = Array.from(card.querySelectorAll("button"));
      const selects = Array.from(card.querySelectorAll("select"));

      const oldEdit = buttons.find(b => /editar|alterar|✏/i.test(b.innerText || b.title || b.ariaLabel || ""));
      const oldDelete = buttons.find(b => /excluir|lixeira|🗑/i.test(b.innerText || b.title || b.ariaLabel || ""));
      const oldSelect = selects.find(s => /prioridade|normal|urgente|alto|m[eé]dia/i.test((s.outerHTML || "") + " " + (s.value || "")));

      const actions = document.createElement("div");
      actions.className = "df-note-actions-v21";

      const editBtn = oldEdit || document.createElement("button");
      editBtn.className = "df-v21-edit";
      editBtn.type = "button";
      editBtn.title = "Editar";
      editBtn.textContent = "✎";

      const deleteBtn = oldDelete || document.createElement("button");
      deleteBtn.className = "df-v21-delete";
      deleteBtn.type = "button";
      deleteBtn.title = "Excluir";
      deleteBtn.textContent = "×";

      const select = oldSelect || document.createElement("select");
      select.innerHTML = `
        <option value="Normal">Prioridade: Normal</option>
        <option value="Alto">Prioridade: Alto</option>
        <option value="Urgente">Prioridade: Urgente</option>
      `;
      select.value = prioridade;

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      actions.appendChild(select);
      card.appendChild(actions);

      // edição inline
      let editando = false;
      editBtn.addEventListener("click", function(ev){
        // preserva clique original se houver, mas melhora visual inline
        editando = !editando;
        titleInput.disabled = !editando;
        textarea.disabled = !editando;
        editBtn.textContent = editando ? "✓" : "✎";
        editBtn.title = editando ? "Salvar" : "Editar";

        if(!editando){
          // dispara change/input para app capturar se tiver listeners
          titleInput.dispatchEvent(new Event("change", { bubbles:true }));
          textarea.dispatchEvent(new Event("change", { bubbles:true }));
        }
      });

      select.addEventListener("change", function(){
        const p = DF21.norm(select.value);
        card.setAttribute("data-prioridade", p);
        badge.textContent = p;
        badge.style.background = DF21.color(p);
        card.style.borderLeftColor = DF21.color(p);
        select.dispatchEvent(new Event("input", { bubbles:true }));
      });
    });
  }

  function aplicar(){
    injectCss();
    renameTexts();
    melhorarNotas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicar, { once:true });
  } else {
    aplicar();
  }

  // roda poucas vezes para esperar render do app, sem loop infinito
  setTimeout(aplicar, 500);
  setTimeout(aplicar, 1500);
})();

