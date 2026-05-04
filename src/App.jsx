
import React, { useEffect, useState } from 'react'

function App() {
  const [view, setView] = useState('dashboard')
  const [modal, setModal] = useState(null)

  const abrir = (m) => setModal(m)
  const fechar = () => setModal(null)

  // ESC to close modals
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
            <section className="agenda">Agenda Financeira</section>
            <section className="notas">Notas (com data)</section>
            <section className="contas">Contas</section>
          </div>
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => abrir('fabMenu')}>+</button>

      {/* FAB MENU */}
      {modal === 'fabMenu' && (
        <div className="overlay" onClick={fechar}>
          <div className="fab-menu" onClick={(e)=>e.stopPropagation()}>
            <button onClick={() => setModal('novaConta')}>Nova conta</button>
            <button onClick={() => setModal('novaNota')}>Nova nota</button>
            <button onClick={fechar}>Fechar</button>
          </div>
        </div>
      )}

      {/* MODALS */}
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

      {/* MOBILE MENU */}
      {modal === 'menu' && (
        <div className="overlay" onClick={fechar}>
          <nav className="menu-mobile" onClick={(e)=>e.stopPropagation()}>
            <div className="menu-item">
              <strong>Dashboard</strong>
              <span>Resumo financeiro</span>
            </div>
            <div className="menu-item">
              <strong>Agenda</strong>
              <span>Vencimentos</span>
            </div>
            <div className="menu-item">
              <strong>Relatórios</strong>
              <span>Análises</span>
            </div>
            <button onClick={fechar}>Fechar</button>
          </nav>
        </div>
      )}
    </div>
  )
}

export default App
