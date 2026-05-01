(function(){
  const DF = window.DonaFlorV26;

  async function changePriority(id, prioridade){
    const nova = DF.priorityLabel(prioridade);

    try{
      if(Array.isArray(window.notasDados)){
        const n = window.notasDados.find(x => String(x.id) === String(id));
        if(n) n.prioridade = nova;
      }
    }catch(e){}

    try{
      if(typeof atualizarNotaSupabaseDF === "function"){
        await atualizarNotaSupabaseDF(id, {prioridade:nova});
        if(typeof carregar === "function") await carregar();
        else renderNotas();
        return;
      }
    }catch(e){}

    try{
      const url = DF.supaURL();
      const key = DF.supaKEY();

      if(url && key){
        await fetch(url + "/rest/v1/df_notas?id=eq." + encodeURIComponent(id), {
          method:"PATCH",
          headers:{
            "apikey":key,
            "Authorization":"Bearer " + key,
            "Content-Type":"application/json",
            "Prefer":"return=representation"
          },
          body:JSON.stringify({prioridade:nova})
        });

        if(typeof carregar === "function") await carregar();
        else renderNotas();
        return;
      }
    }catch(e){
      alert("Não foi possível alterar a prioridade agora.");
    }

    renderNotas();
  }

  function renderNotas(){
    const lista = document.getElementById("notasLista");
    if(!lista) return;

    const notas = DF.getNotas().slice(0,20);

    if(!notas.length){
      lista.innerHTML = `<p class="empty">Nenhum lembrete.</p>`;
      return;
    }

    lista.innerHTML = notas.map(n => {
      const p = DF.priorityLabel(n.prioridade || "Normal");
      const pc = DF.priorityClass(p);
      const id = DF.escape(n.id);

      return `
        <div class="df26-note-card" data-nota-id="${id}">
          <div class="df26-note-top">
            <div>
              <div class="df26-note-title">${DF.escape(n.titulo || "Sem título")}</div>
              <div class="df26-note-text">${DF.escape(n.texto || n.recado || "")}</div>
              <div class="df26-note-meta">${DF.escape(n.data_lembrete || n.data || "Sem data")}${n.loja ? " • " + DF.escape(n.loja) : ""}</div>
            </div>
            <span class="df26-badge ${pc}">${DF.priorityIcon(p)} ${p}</span>
          </div>

          <div class="df26-note-actions no-print">
            <button type="button" class="df26-btn df26-btn-edit" data-df26-edit-nota="${id}">✏️ Editar</button>

            <div class="df26-prio-box">
              <button type="button" class="df26-btn df26-prio-btn ${pc}">
                <span>${DF.priorityIcon(p)} Prioridade</span>
                <strong>${p}</strong>
              </button>
              <div class="df26-prio-menu">
                <button type="button" class="df26-prio-option" data-id="${id}" data-p="Normal">🟢 Normal</button>
                <button type="button" class="df26-prio-option" data-id="${id}" data-p="Urgente">🔴 Urgente</button>
                <button type="button" class="df26-prio-option" data-id="${id}" data-p="Crítico">🔥 Crítico</button>
              </div>
            </div>

            <button type="button" class="df26-btn df26-btn-del" data-df26-del-nota="${id}">🗑️ Excluir</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function bind(){
    if(document.body.dataset.df26NotasBound) return;
    document.body.dataset.df26NotasBound = "1";

    document.addEventListener("click", async function(e){
      const edit = e.target.closest("[data-df26-edit-nota]");
      if(edit){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if(typeof editarNotaDF === "function") editarNotaDF(edit.dataset.df26EditNota);
        return;
      }

      const del = e.target.closest("[data-df26-del-nota]");
      if(del){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if(typeof moverNotaLixeiraDF === "function") moverNotaLixeiraDF(del.dataset.df26DelNota);
        return;
      }

      const prioBtn = e.target.closest(".df26-prio-btn");
      if(prioBtn){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const box = prioBtn.closest(".df26-prio-box");
        document.querySelectorAll(".df26-prio-box.open").forEach(b => {
          if(b !== box) b.classList.remove("open");
        });
        box.classList.toggle("open");
        return;
      }

      const op = e.target.closest(".df26-prio-option");
      if(op){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const box = op.closest(".df26-prio-box");
        if(box) box.classList.remove("open");

        await changePriority(op.dataset.id, op.dataset.p);
        setTimeout(renderNotas, 300);
        return;
      }

      if(!e.target.closest(".df26-prio-box")){
        document.querySelectorAll(".df26-prio-box.open").forEach(b => b.classList.remove("open"));
      }
    }, true);
  }

  function install(){
    window.renderNotas = renderNotas;
    window.renderNotasMelhoradoDF = renderNotas;
    bind();
    renderNotas();
  }

  DF.installNotas = install;
})();
