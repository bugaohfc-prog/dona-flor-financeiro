import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarExameOcupacionalControlado,
  atualizarExameOcupacionalControlado,
  listarExamesOcupacionaisFuncionario,
  registrarExameOcupacionalControlado
} from '../services/funcionariosExamesOcupacionaisService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function respostaErro(error) {
  return { data: null, error }
}

export function useFuncionariosExamesOcupacionais(opcoes = {}) {
  const {
    empresaId,
    funcionarioId,
    incluirArquivados = false,
    autoCarregar = true,
    supabase = supabasePadrao
  } = opcoes

  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const funcionarioAtual = useMemo(() => normalizarId(funcionarioId), [funcionarioId])
  const [exames, setExames] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaAtualRef = useRef(0)

  const definirErro = useCallback((error) => {
    setErro(error ? mensagemSeguraErro(error) : null)
  }, [])

  const limpar = useCallback(() => {
    cargaAtualRef.current += 1
    setExames([])
    setLoading(false)
    definirErro(null)
  }, [definirErro])

  const carregar = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const funcionario = normalizarId(opcoesCarga.funcionarioId || funcionarioAtual)
    const cargaId = cargaAtualRef.current + 1
    cargaAtualRef.current = cargaId

    if (!empresa || !funcionario) {
      limpar()
      const error = new Error(!empresa
        ? 'Empresa ativa não identificada para carregar exames ocupacionais.'
        : 'Funcionário não identificado para carregar exames ocupacionais.')
      return respostaErro(error)
    }

    if (!opcoesCarga.silencioso) setLoading(true)
    definirErro(null)

    try {
      const { data, error } = await listarExamesOcupacionaisFuncionario({
        supabase,
        empresaId: empresa,
        funcionarioId: funcionario,
        incluirArquivados
      })
      if (cargaAtualRef.current !== cargaId) return { data: null, error: null, ignorado: true }
      if (error) {
        setExames([])
        definirErro(error)
        return respostaErro(error)
      }
      setExames(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaAtualRef.current === cargaId) {
        setExames([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaAtualRef.current === cargaId && !opcoesCarga.silencioso) setLoading(false)
    }
  }, [definirErro, empresaAtual, funcionarioAtual, incluirArquivados, limpar, supabase])

  useEffect(() => {
    cargaAtualRef.current += 1
    setExames([])
    definirErro(null)
    if (!empresaAtual || !funcionarioAtual) {
      setLoading(false)
      return
    }
    if (autoCarregar) carregar({ empresaId: empresaAtual, funcionarioId: funcionarioAtual })
  }, [autoCarregar, carregar, definirErro, empresaAtual, funcionarioAtual])

  const executar = useCallback(async (operacao) => {
    if (!empresaAtual) return respostaErro(new Error('Empresa ativa não identificada.'))
    setSalvando(true)
    definirErro(null)
    try {
      const resposta = await operacao(empresaAtual)
      if (resposta?.error) {
        definirErro(resposta.error)
        return respostaErro(resposta.error)
      }
      if (funcionarioAtual) await carregar({ silencioso: true })
      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvando(false)
    }
  }, [carregar, definirErro, empresaAtual, funcionarioAtual])

  const registrar = useCallback((dados = {}) => {
    const funcionario = normalizarId(dados.funcionarioId || funcionarioAtual)
    if (!funcionario) return Promise.resolve(respostaErro(new Error('Funcionário não identificado.')))
    return executar((empresa) => registrarExameOcupacionalControlado({
      supabase,
      empresaId: empresa,
      funcionarioId: funcionario,
      ...dados
    }))
  }, [executar, funcionarioAtual, supabase])

  const atualizar = useCallback((exameId, dados = {}) => executar((empresa) => (
    atualizarExameOcupacionalControlado({
      supabase,
      empresaId: empresa,
      exameId,
      ...dados
    })
  )), [executar, supabase])

  const arquivar = useCallback((exameId) => executar((empresa) => (
    arquivarExameOcupacionalControlado({ supabase, empresaId: empresa, exameId })
  )), [executar, supabase])

  return {
    exames,
    loading,
    salvando,
    erro,
    carregar,
    registrar,
    atualizar,
    arquivar,
    limpar,
    limparErro: () => definirErro(null)
  }
}
