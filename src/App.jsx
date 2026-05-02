import { useState } from "react";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <div>Logado como {user.nome}</div>;
}

export default App;
