(function(){
  function start(){
    const DF = window.DonaFlorV26;
    if(!DF) return;

    if(typeof DF.installMenu === "function") DF.installMenu();
    if(typeof DF.installNotas === "function") DF.installNotas();
    if(typeof DF.installRelatorios === "function") DF.installRelatorios();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", start, {once:true});
  }else{
    start();
  }

  // Roda depois dos scripts antigos, vencendo timeouts legados.
  setTimeout(start, 700);
  setTimeout(start, 1600);
  setTimeout(start, 3200);
  setTimeout(start, 5600);
})();
