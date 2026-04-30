// MENU
function toggleMenu(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("open");
}

// USUÁRIOS
const usuarios = null;
const listaUsuarios = usuarios || [];

const usuariosDiv = document.getElementById("usuarios");
if (usuariosDiv) {
  if (listaUsuarios.length === 0) {
    usuariosDiv.innerHTML = "<p>Nenhum usuário carregado</p>";
  }
}

// NOTAS
const data = {};
const notas = data?.notas || [];

const notasDiv = document.getElementById("notas");
if (notasDiv) {
  if (notas.length === 0) {
    notasDiv.innerHTML = "<p>Sem notas</p>";
  }
}

// PIPE DREAM
function salvarUrl(url) {
  localStorage.setItem("pipedream_url", url);
}

function enviarResumo(resumo) {
  const url = localStorage.getItem("pipedream_url");
  if (!url) return alert("URL não configurada");

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumo })
  })
  .then(() => alert("Enviado com sucesso"))
  .catch(() => alert("Erro ao enviar"));
}
