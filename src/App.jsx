import { useState, useEffect } from 'react'
import './styles.css'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [modal, setModal] = useState(null)

  const abrir = (m) => setModal(m)
  const fechar = () => setModal(null)

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <button className="hamburger" onClick={() => abrir('menu')}>☰</button>
        <h1>DF Gestão Financeira</h1>
      </header>

      <main className="page">
        {view === 'dashboard' && (
          <div className="mobile-stack">
            <div className="card">Agenda Financeira</div>
            <div className="card">Notas (com data)</div>
            <div className="card">Contas</div>
          </div>
        )}
      </main>

      <button className="fab" onClick={() => abrir('fab')}>
        +
      </button>

      {modal === 'fab' && (
        <div className="overlay" onClick={fechar}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <button onClick={() => abrir('novaConta')}>Nova Conta</button>
            <button onClick={() => abrir('novaNota')}>Nova Nota</button>
          </div>
        </div>
      )}

      {modal === 'novaConta' && (
        <div className="overlay" onClick={fechar}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Nova Conta</h3>
            <button onClick={fechar}>Cancelar</button>
          </div>
        </div>
      )}

      {modal === 'novaNota' && (
        <div className="overlay" onClick={fechar}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Nova Nota</h3>
            <input type="date" />
            <button onClick={fechar}>Cancelar</button>
          </div>
        </div>
      )}

      {modal === 'menu' && (
        <div className="overlay" onClick={fechar}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <div className="menu-item">
              <strong>Dashboard</strong>
              <span>Resumo financeiro</span>
            </div>
            <div className="menu-item">
              <strong>Agenda</strong>
              <span>Vencimentos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
