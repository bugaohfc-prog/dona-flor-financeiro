import React, { useEffect, useState } from 'react'

function App() {
  const [telaAtual, setTelaAtual] = useState('painel')

  const irPara = (tela) => {
    setTelaAtual(tela)
    window.history.pushState({}, '', `#${tela}`)
  }

  useEffect(() => {
    const handlePopState = () => {
      setTelaAtual('painel')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div>
      <h1>Dona Flor Financeiro</h1>
      <p>Tela atual: {telaAtual}</p>
      <button onClick={() => irPara('painel')}>Painel</button>
      <button onClick={() => irPara('lixeira')}>Lixeira</button>
    </div>
  )
}

export default App
