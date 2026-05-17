import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { normalizarPerfilUsuario } from '../services/usuariosService'
import {
  buscarNomePerfilUsuario,
  buscarVinculoEmpresaDoUsuario,
  sincronizarUsuarioLogadoComEmpresa,
  TENANT_ERRORS
} from '../services/tenantService'
import {
  buscarPermissoesUsuario,
  criarPermissoesUsuario,
  listarEmpresasDisponiveisParaUsuario
} from '../services/permissoesService'
import { erroEhSessaoExpirada } from '../utils/session'

export function useBootstrapData({
  usuarioLogado,
  empresaId,
  setEmpresaId,
  empresaAtiva,
  setEmpresaAtiva,
  limparEmpresaAtiva,
  empresasDisponiveis,
  setEmpresasDisponiveis,
  perfilUsuario,
  setPerfilUsuario,
  permissoesUsuario,
  setPermissoesUsuario,
  setNomeUsuarioPerfil,
  setErroEmpresa,
  setLoading,
  buscarContas,
  buscarNotas,
  buscarCentros,
  buscarFiliais,
  buscarLixeira,
  buscarConfiguracoes,
  limparDadosTenant,
  limparEstadoAutenticacao,
  setUsuarioLogado,
  setTelaAtualState,
  mostrarAviso,
  avisarErro
}) {
  const sincronizacaoTenantRef = useRef(null)
  const [trocandoEmpresa, setTrocandoEmpresa] = useState(false)

  function normalizarPerfil(perfil) {
    return normalizarPerfilUsuario(perfil)
  }

  async function carregarTudo(empresaAtual = empresaId) {
    if (!empresaAtual) return

    await Promise.all([
      buscarContas(empresaAtual),
      buscarNotas(empresaAtual),
      buscarCentros(empresaAtual),
      buscarFiliais(empresaAtual),
      buscarLixeira(empresaAtual),
      buscarConfiguracoes(empresaAtual)
    ])
  }

  async function carregarEmpresaDoUsuario(userId) {
    setLoading(true)
    setErroEmpresa('')

    try {
      await sincronizarUsuarioLogadoComEmpresa()
      const vinculo = await buscarVinculoEmpresaDoUsuario(userId)
      const nomePerfil = await buscarNomePerfilUsuario(userId)

      const permissoesBase = await buscarPermissoesUsuario({
        userId,
        email: usuarioLogado?.email,
        perfilEmpresa: vinculo?.perfil || 'operador'
      })

      const empresasSessao = await listarEmpresasDisponiveisParaUsuario({
        userId,
        email: usuarioLogado?.email,
        isMaster: permissoesBase.isMaster
      })

      if (!vinculo?.empresaId && !permissoesBase.isMaster) {
        setEmpresaId(null)
        limparEmpresaAtiva()
        setPerfilUsuario('')
        setPermissoesUsuario(criarPermissoesUsuario())
        setNomeUsuarioPerfil('')
        setErroEmpresa(TENANT_ERRORS.semEmpresa)
        return
      }

      if (permissoesBase.isMaster && empresasSessao.length === 0) {
        setEmpresaId(null)
        limparEmpresaAtiva()
        setPerfilUsuario('master')
        setPermissoesUsuario({ ...permissoesBase, canSwitchCompany: true, canManageCompanies: true })
        setNomeUsuarioPerfil(nomePerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || '')
        setErroEmpresa('Nenhuma empresa cadastrada em df_empresas para o usuário master.')
        return
      }

      const empresaSalvaValida = empresasSessao.find((empresa) => empresa.id === empresaAtiva?.id)
      const empresaSelecionada = empresaSalvaValida || empresasSessao.find((empresa) => empresa.id === vinculo?.empresaId) || empresasSessao[0] || {
        id: vinculo?.empresaId,
        nome: vinculo?.nomeEmpresa || 'Dona Flor',
        perfil: vinculo?.perfil || 'operador'
      }

      const perfilSelecionado = empresaSelecionada.perfil || vinculo?.perfil || (permissoesBase.isMaster ? 'master' : 'operador')
      const permissoes = permissoesBase.isMaster
        ? { ...permissoesBase, perfilEmpresa: normalizarPerfil(perfilSelecionado), canSwitchCompany: true, canManageCompanies: true }
        : await buscarPermissoesUsuario({
            userId,
            email: usuarioLogado?.email,
            perfilEmpresa: perfilSelecionado
          })

      setEmpresasDisponiveis(empresasSessao.length > 0 ? empresasSessao : [empresaSelecionada])
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || vinculo?.nomeEmpresa || 'Dona Flor',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoes)
      setNomeUsuarioPerfil(nomePerfil || usuarioLogado?.user_metadata?.name || usuarioLogado?.user_metadata?.full_name || '')
      await carregarTudo(empresaSelecionada.id)
    } catch (error) {
      if (erroEhSessaoExpirada(error)) {
        await supabase.auth.signOut()
        limparEstadoAutenticacao()
        setUsuarioLogado(null)
        mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
      } else {
        mostrarAviso(error.message, 'erro')
      }
    } finally {
      setLoading(false)
    }
  }

  async function recarregarEmpresasDisponiveis() {
    if (!usuarioLogado) return

    try {
      const empresasAtualizadas = await listarEmpresasDisponiveisParaUsuario({
        userId: usuarioLogado.id,
        email: usuarioLogado.email,
        isMaster: permissoesUsuario?.isMaster
      })

      setEmpresasDisponiveis(empresasAtualizadas)
    } catch (error) {
      console.warn('Não foi possível atualizar a lista de empresas:', error.message)
    }
  }

  async function trocarEmpresaAtiva(empresaSelecionadaId) {
    if (!empresaSelecionadaId || trocandoEmpresa) return

    const empresaSelecionada = empresasDisponiveis.find((empresa) => empresa.id === empresaSelecionadaId)

    if (!empresaSelecionada) {
      mostrarAviso('Empresa selecionada não encontrada para este usuário.', 'erro')
      return
    }

    if (empresaSelecionada.id === empresaId) return

    setTrocandoEmpresa(true)
    setLoading(true)

    try {
      const perfilSelecionado = empresaSelecionada.perfil || (permissoesUsuario?.isMaster ? 'master' : 'operador')
      const permissoesAtualizadas = permissoesUsuario?.isMaster
        ? {
            ...permissoesUsuario,
            perfilEmpresa: normalizarPerfil(perfilSelecionado),
            canSwitchCompany: true,
            canManageCompanies: true,
            canManageUsers: true,
            canAccessSettings: true
          }
        : await buscarPermissoesUsuario({
            userId: usuarioLogado?.id,
            email: usuarioLogado?.email,
            perfilEmpresa: perfilSelecionado
          })

      limparDadosTenant()
      setEmpresaId(empresaSelecionada.id)
      setEmpresaAtiva({
        id: empresaSelecionada.id,
        nome: empresaSelecionada.nome || 'Empresa',
        perfil: perfilSelecionado
      })
      setPerfilUsuario(perfilSelecionado)
      setPermissoesUsuario(permissoesAtualizadas)
      setTelaAtualState('dashboard')
      await carregarTudo(empresaSelecionada.id)
      mostrarAviso(`Empresa ativa: ${empresaSelecionada.nome || 'Empresa'}`, 'sucesso')
    } catch (error) {
      avisarErro(error, 'Não foi possível trocar a empresa ativa.')
    } finally {
      setTrocandoEmpresa(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!usuarioLogado) {
      setLoading(false)
      return
    }

    carregarEmpresaDoUsuario(usuarioLogado.id)
  }, [usuarioLogado])

  useEffect(() => {
    if (!usuarioLogado?.id || !empresaId) return

    let cancelado = false

    async function sincronizarTenantAtual() {
      if (cancelado) return

      try {
        await Promise.allSettled([
          buscarContas(empresaId),
          buscarCentros(empresaId),
          buscarFiliais(empresaId),
          buscarLixeira(empresaId)
        ])
      } catch (error) {
        console.warn('Falha ao sincronizar dados do tenant:', error?.message || error)
      }
    }

    function agendarSincronizacaoTenant() {
      window.clearTimeout(sincronizacaoTenantRef.current)
      sincronizacaoTenantRef.current = window.setTimeout(sincronizarTenantAtual, 350)
    }

    function sincronizarAoVoltarParaAba() {
      if (document.visibilityState === 'visible') agendarSincronizacaoTenant()
    }

    window.addEventListener('focus', agendarSincronizacaoTenant)
    document.addEventListener('visibilitychange', sincronizarAoVoltarParaAba)

    const canal = supabase
      .channel(`tenant-sync-${empresaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_centros_custo', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_filiais', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_contas', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'df_contas_recorrentes', filter: `empresa_id=eq.${empresaId}` }, agendarSincronizacaoTenant)
      .subscribe()

    return () => {
      cancelado = true
      window.clearTimeout(sincronizacaoTenantRef.current)
      window.removeEventListener('focus', agendarSincronizacaoTenant)
      document.removeEventListener('visibilitychange', sincronizarAoVoltarParaAba)
      supabase.removeChannel(canal)
    }
  }, [usuarioLogado?.id, empresaId])

  return {
    carregarTudo,
    recarregarEmpresasDisponiveis,
    trocarEmpresaAtiva,
    trocandoEmpresa
  }
}
