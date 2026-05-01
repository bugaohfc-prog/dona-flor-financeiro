import { useState } from "react";
import { supabase, hasSupabaseKey } from "../lib/supabase";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function entrar() {
    setErro("");

    if (!hasSupabaseKey()) {
      setErro("Configure a chave pública do Supabase no Vercel.");
      return;
    }

    const { data, error } = await supabase.rpc("login_usuario", {
      p_usuario: usuario.trim().toLowerCase(),
      p_senha: senha.trim(),
    });

    if (error) {
      setErro(error.message);
      return;
    }

    const user = Array.isArray(data) ? data[0] : data;
    if (!user) {
      setErro("Credenciais inválidas.");
      return;
    }

    localStorage.setItem("df_user_v27", JSON.stringify(user));
    onLogin(user);
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <img src="/icon-512.png" alt="Dona Flor" />
        <h1>Dona Flor</h1>
        <p>Gestão Financeira</p>

        <input placeholder="Usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />

        {erro && <div className="alert">{erro}</div>}

        <button onClick={entrar}>Acessar sistema</button>
      </div>
    </div>
  );
}
