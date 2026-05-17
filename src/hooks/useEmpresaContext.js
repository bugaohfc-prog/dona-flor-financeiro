import { useState } from 'react'
import { criarPermissoesUsuario } from '../services/permissoesService'

export function useEmpresaContext() {
  const [empresaId, setEmpresaId] = useState(null)
  const [trocandoEmpresa, setTrocandoEmpresa] = useState(false)
  const [perfilUsuario, setPerfilUsuario] = useState('')
  const [permissoesUsuario, setPermissoesUsuario] = useState(() => criarPermissoesUsuario())
  const [erroEmpresa, setErroEmpresa] = useState('')

  return {
    empresaId,
    setEmpresaId,
    trocandoEmpresa,
    setTrocandoEmpresa,
    perfilUsuario,
    setPerfilUsuario,
    permissoesUsuario,
    setPermissoesUsuario,
    erroEmpresa,
    setErroEmpresa
  }
}
