(function(){
  const DF = window.DonaFlorV26;

  function toggleSubmenu(id, btn){
    const submenu = document.getElementById(id);
    if(!submenu) return;

    document.querySelectorAll(".side-submenu").forEach(el => {
      if(el !== submenu) el.classList.remove("open");
    });

    submenu.classList.toggle("open");

    if(btn){
      const arrow = btn.querySelector(".side-arrow");
      if(arrow) arrow.textContent = submenu.classList.contains("open") ? "▴" : "▾";
    }
  }

  function install(){
    window.toggleSubmenuDF = toggleSubmenu;

    const toggle = document.getElementById("toggleSidebarBtn") || document.querySelector("button[title='Recolher menu']");
    if(toggle && !toggle.dataset.df26Bound){
      toggle.dataset.df26Bound = "1";
      toggle.innerHTML = `<span class="side-icon">☰</span><span class="side-text">Menu</span>`;
      toggle.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.toggle("df-sidebar-collapsed");
      }, true);
    }

    const painel = document.getElementById("painelSubmenu");
    if(painel && !document.querySelector(".side-submenu.open")){
      painel.classList.add("open");
    }
  }

  DF.installMenu = install;
})();
