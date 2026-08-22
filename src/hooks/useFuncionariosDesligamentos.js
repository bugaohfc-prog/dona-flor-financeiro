import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  abrirDesligamentoFuncionario as abrirService,
  atualizarDesligamentoFuncionario as atualizarService,
  cancelarDesligamentoFuncionario as cancelarService,
  concluirDesligamentoFuncionario as concluirService,
  listarDesligamentosFuncionario
} from '../services/funcionariosDesligamentosService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

export function useFuncionariosDesligamentos({ empresaId, autoCarregar = true, supabase = supabasePadrao } = {}) {
  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const [desligamentos, setDesligamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaRef = useRef(0)

  const carregar = useCallback(async () => {
    const carga = ++cargaRef.current
    if (!empresaAtual) {
      setDesligamentos([])
      setErro(null)
      return { data: [], error: null }
    }

    setLoading(true)
    setErro(null)
    try {
      const { data, error } = await listarDesligamentosFuncionario({ supabase, empresaId: empresaAtual })
      if (carga !== cargaRef.current) return { data: null, error: null, ignorado: true }
      if (error) {
        setDesligamentos([])
        setErro(mensagemSeguraErro(error))
        return { data: null, error }
      }
      setDesligamentos(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (carga === cargaRef.current) {
        setDesligamentos([])
        setErro(mensagemSeguraErro(error))
      }
      return { data: null, error }
    } finally {
      if (carga === cargaRef.current) setLoading(false)
    }
  }, [empresaAtual, supabase])

  useEffect(() => {
    cargaRef.current += 1
    setDesligamentos([])
    setErro(null)
    if (autoCarregar && empresaAtual) carregar()
  }, [autoCarregar, carregar, empresaAtual])

  const executar = useCallback(async (operacao) => {
    if (!empresaAtual) return { data: null, error: new Error('Empresa ativa não identificada.') }
    setSalvando(true)
    setErro(null)
    try {
      const resposta = await operacao()
      if (resposta?.error) {
        setErro(mensagemSeguraErro(resposta.error))
        return resposta
      }
      await carregar()
      return { data: resposta?.data || null, error: null }
    } catch (error) {
      setErro(mensagemSeguraErro(error))
      return { data: null, error }
    } finally {
      setSalvando(false)
    }
  }, [carregar, empresaAtual])

  const abrir = useCallback((funcionarioId, dados) => executar(() => abrirService({
    supabase, empresaId: empresaAtual, funcionarioId, dados
  })), [empresaAtual, executar, supabase])

  const atualizar = useCallback((desligamentoId, dados) => executar(() => atualizarService({
    supabase, empresaId: empresaAtual, desligamentoId, dados
  })), [empresaAtual, executar, supabase])

  const cancelar = useCallback((desligamentoId, motivoCancelamento) => executar(() => cancelarService({
    supabase, empresaId: empresaAtual, desligamentoId, motivoCancelamento
  })), [empresaAtual, executar, supabase])

  const concluir = useCallback((desligamentoId) => executar(() => concluirService({
    supabase, empresaId: empresaAtual, desligamentoId
  })), [empresaAtual, executar, supabase])

  return {
    desligamentos,
    loading,
    salvando,
    erro,
    carregar,
    abrir,
    atualizar,
    cancelar,
    concluir
  }
}
