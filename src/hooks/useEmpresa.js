import { useState } from 'react'

/**
 * Hook-base preparado para a próxima etapa de desacoplamento.
 * Mantém os estados de empresa centralizados sem alterar o fluxo validado.
 */
export function useEmpresaState() {
  const [empresaId, setEmpresaId] = useState(null)
  const [perfilUsuario, setPerfilUsuario] = useState('')
  const [nomeUsuarioPerfil, setNomeUsuarioPerfil] = useState('')
  const [erroEmpresa, setErroEmpresa] = useState('')

  return {
    empresaId,
    setEmpresaId,
    perfilUsuario,
    setPerfilUsuario,
    nomeUsuarioPerfil,
    setNomeUsuarioPerfil,
    erroEmpresa,
    setErroEmpresa
  }
}
