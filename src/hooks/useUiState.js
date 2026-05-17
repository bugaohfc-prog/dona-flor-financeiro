import { useState } from 'react'

const confirmacaoInicial = {
  aberto: false,
  titulo: '',
  mensagem: '',
  textoConfirmar: 'Confirmar',
  tipo: 'padrao',
  acao: null
}

export function useUiState() {
  const [modalPerfilUsuario, setModalPerfilUsuario] = useState(false)
  const [nomePerfilEditando, setNomePerfilEditando] = useState('')
  const [salvandoPerfilUsuario, setSalvandoPerfilUsuario] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarContas, setMostrarContas] = useState(true)
  const [mostrarContasDashboard, setMostrarContasDashboard] = useState(true)
  const [mostrarNotas, setMostrarNotas] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 980))
  const [mostrarConfigNegocio, setMostrarConfigNegocio] = useState(true)
  const [mostrarConfigNotificacoes, setMostrarConfigNotificacoes] = useState(true)
  const [mostrarConfigCentros, setMostrarConfigCentros] = useState(true)
  const [mostrarConfigRecorrencias, setMostrarConfigRecorrencias] = useState(true)
  const [confirmacao, setConfirmacao] = useState(confirmacaoInicial)
  const [arquivoImportacao, setArquivoImportacao] = useState(null)
  const [linhasImportacao, setLinhasImportacao] = useState([])
  const [statusImportacao, setStatusImportacao] = useState('')

  return {
    modalPerfilUsuario,
    setModalPerfilUsuario,
    nomePerfilEditando,
    setNomePerfilEditando,
    salvandoPerfilUsuario,
    setSalvandoPerfilUsuario,
    mostrarFiltros,
    setMostrarFiltros,
    mostrarContas,
    setMostrarContas,
    mostrarContasDashboard,
    setMostrarContasDashboard,
    mostrarNotas,
    setMostrarNotas,
    mostrarConfigNegocio,
    setMostrarConfigNegocio,
    mostrarConfigNotificacoes,
    setMostrarConfigNotificacoes,
    mostrarConfigCentros,
    setMostrarConfigCentros,
    mostrarConfigRecorrencias,
    setMostrarConfigRecorrencias,
    confirmacao,
    setConfirmacao,
    arquivoImportacao,
    setArquivoImportacao,
    linhasImportacao,
    setLinhasImportacao,
    statusImportacao,
    setStatusImportacao
  }
}
