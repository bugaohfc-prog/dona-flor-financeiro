import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import { listarUsuariosEmpresa } from '../../../services/usuariosService.js'
import {
  atualizarAcompanhamentoObrigacao,
  listarAuditoriaObrigacao,
  listarObrigacoesOperacionais,
  reatribuirObrigacaoOperacional,
  resolverObrigacaoOperacional
} from '../../../services/obrigacoesOperacionaisService.js'
import { mensagemSeguraErro } from '../../../utils/session.js'
import {
  filtrarObrigacoesOperacionais,
  resumirObrigacoesOperacionais,
  usuarioElegivelObrigacao
} from '../domain/obrigacoesOperacionais.js'

export function useObrigacoesOperacionais({ empresaId, filtro = 'acao', carregarUsuarios = true } = {}) {
  const [obrigacoes, setObrigacoes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [usuarioAtual, setUsuarioAtual] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [salvandoId, setSalvandoId] = useState(null)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!empresaId) {
      setObrigacoes([])
      setUsuarios([])
      setUsuarioAtual(null)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const [{ data: auth }, lista, listaUsuarios] = await Promise.all([
        supabase.auth.getUser(),
        listarObrigacoesOperacionais({ empresaId }),
        carregarUsuarios ? listarUsuariosEmpresa(empresaId) : Promise.resolve([])
      ])
      setObrigacoes(lista)
      setUsuarios(listaUsuarios)
      setUsuarioAtual(auth?.user || null)
    } catch (error) {
      setErro(mensagemSeguraErro(error, 'Não foi possível carregar as obrigações operacionais.'))
      setObrigacoes([])
    } finally {
      setCarregando(false)
    }
  }, [empresaId, carregarUsuarios])

  useEffect(() => { carregar() }, [carregar])

  const usuariosElegiveis = useMemo(
    () => usuarios.filter(usuarioElegivelObrigacao),
    [usuarios]
  )
  const meuVinculo = useMemo(() => usuariosElegiveis.find((usuario) => (
    usuario.user_id === usuarioAtual?.id
    || usuario.usuario_id === usuarioAtual?.id
    || String(usuario.email || '').toLowerCase() === String(usuarioAtual?.email || '').toLowerCase()
  )) || null, [usuariosElegiveis, usuarioAtual])

  const filtradas = useMemo(() => filtrarObrigacoesOperacionais({
    obrigacoes,
    filtro,
    meuVinculoId: meuVinculo?.id || null,
    usuariosElegiveis
  }), [obrigacoes, filtro, meuVinculo, usuariosElegiveis])

  const resumo = useMemo(() => resumirObrigacoesOperacionais({
    obrigacoes,
    meuVinculoId: meuVinculo?.id || null,
    usuariosElegiveis
  }), [obrigacoes, meuVinculo, usuariosElegiveis])

  const executar = useCallback(async (id, operacao) => {
    setSalvandoId(id)
    setErro(null)
    try {
      await operacao()
      await carregar()
      return true
    } catch (error) {
      setErro(mensagemSeguraErro(error, 'Não foi possível atualizar a obrigação.'))
      return false
    } finally {
      setSalvandoId(null)
    }
  }, [carregar])

  return {
    obrigacoes,
    filtradas,
    resumo,
    usuariosElegiveis,
    meuVinculo,
    carregando,
    salvandoId,
    erro,
    carregar,
    reatribuir: (id, responsavelId) => executar(id, () => reatribuirObrigacaoOperacional({ empresaId, obrigacaoId: id, responsavelId })),
    acompanhar: (id, dados) => executar(id, () => atualizarAcompanhamentoObrigacao({ empresaId, obrigacaoId: id, ...dados })),
    resolver: (id, dados) => executar(id, () => resolverObrigacaoOperacional({ empresaId, obrigacaoId: id, ...dados })),
    listarHistorico: (id) => listarAuditoriaObrigacao({ empresaId, obrigacaoId: id })
  }
}
