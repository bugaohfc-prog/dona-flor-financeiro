import { useState } from "react";
import supabase from "../lib/supabase";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = async () => {
    const { data } = await supabase
      .from("df_usuarios")
      .select("*")
      .eq("usuario", usuario)
      .eq("senha", senha)
      .single();

    if (data) {
      onLogin(data);
    } else {
      alert("Usuário ou senha inválidos");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Usuário" onChange={(e) => setUsuario(e.target.value)} />
      <input type="password" placeholder="Senha" onChange={(e) => setSenha(e.target.value)} />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
