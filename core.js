(function(){
  window.DonaFlorV26 = window.DonaFlorV26 || {};

  const DF = window.DonaFlorV26;

  DF.escape = function(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  };

  DF.norm = function(v){
    return String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  DF.money = function(v){
    try{ if(typeof moeda === "function") return moeda(v); }catch(e){}
    return Number(v || 0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  };

  DF.dateBR = function(v){
    if(!v) return "-";
    const s = String(v).slice(0,10);
    const p = s.split("-");
    if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  };

  DF.supaURL = function(){
    try{ if(typeof URL !== "undefined" && String(URL).includes("supabase")) return URL; }catch(e){}
    try{ if(typeof SupabaseURL !== "undefined") return SupabaseURL; }catch(e){}
    return "";
  };

  DF.supaKEY = function(){
    try{ if(typeof KEY !== "undefined") return KEY; }catch(e){}
    try{ if(typeof SupabaseKey !== "undefined") return SupabaseKey; }catch(e){}
    return "";
  };

  DF.getNotas = function(){
    try{
      if(typeof visNotas === "function"){
        const arr = visNotas();
        if(Array.isArray(arr)) return arr.filter(n => !n.deletado && !n.data_exclusao);
      }
    }catch(e){}

    try{
      if(typeof getNotasArrayDF === "function"){
        const arr = getNotasArrayDF();
        if(Array.isArray(arr)) return arr.filter(n => !n.deletado && !n.data_exclusao);
      }
    }catch(e){}

    try{
      if(Array.isArray(window.notasDados)) return window.notasDados.filter(n => !n.deletado && !n.data_exclusao);
    }catch(e){}

    return [];
  };

  DF.getContas = function(){
    try{
      if(typeof visContas === "function"){
        const arr = visContas();
        if(Array.isArray(arr)) return arr.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(typeof getContasArrayDF === "function"){
        const arr = getContasArrayDF();
        if(Array.isArray(arr)) return arr.filter(c => !c.deletado);
      }
    }catch(e){}

    try{
      if(Array.isArray(window.contasDados)) return window.contasDados.filter(c => !c.deletado);
    }catch(e){}

    return [];
  };

  DF.fetchContas = async function(){
    const url = DF.supaURL();
    const key = DF.supaKEY();

    try{
      if(url && key){
        const r = await fetch(url + "/rest/v1/df_contas?select=*&order=vencimento.asc", {
          headers:{
            "apikey":key,
            "Authorization":"Bearer " + key,
            "Content-Type":"application/json"
          }
        });
        if(r.ok){
          const data = await r.json();
          if(Array.isArray(data)) return data.filter(c => !c.deletado);
        }
      }
    }catch(e){
      console.warn("V26 relatório usando fallback local:", e);
    }

    return DF.getContas();
  };

  DF.priorityLabel = function(v){
    const p = DF.norm(v);
    if(p === "critico") return "Crítico";
    if(p === "urgente") return "Urgente";
    return "Normal";
  };

  DF.priorityClass = function(v){
    const p = DF.norm(v);
    if(p === "critico") return "critico";
    if(p === "urgente") return "urgente";
    return "normal";
  };

  DF.priorityIcon = function(v){
    const p = DF.norm(v);
    if(p === "critico") return "🔥";
    if(p === "urgente") return "🔴";
    return "🟢";
  };
})();
