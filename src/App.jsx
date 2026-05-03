
// Substitua apenas as partes indicadas no seu App.jsx

// FUNÇÃO DE NAVEGAÇÃO
const irPara = (tela) => {
  setTelaAtual(tela)
  window.history.pushState({}, '', `#${tela}`)
}

// USE EFFECT PARA BOTÃO VOLTAR
useEffect(() => {
  const handlePopState = () => {
    setTelaAtual('painel')
  }

  window.addEventListener('popstate', handlePopState)

  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
}, [])

// FUNÇÃO EXCLUIR DEFINITIVO
const excluirDefinitivo = async (id) => {
  const { error } = await supabase
    .from('df_contas')
    .delete()
    .eq('id', id)

  if (!error) {
    setContas(prev => prev.filter(c => c.id !== id))
  }
}
