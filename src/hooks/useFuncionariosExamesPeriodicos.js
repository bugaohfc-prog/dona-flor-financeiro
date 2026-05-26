import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarExamePeriodico as arquivarExamePeriodicoService,
  atualizarExamePeriodico as atualizarExamePeriodicoService,
  calcularProximoPeriodico,
  criarExamePeriodico as criarExamePeriodicoService,
  listarExamesPeriodicos,
  obterUltimoExamePeriodico as obterUltimoExamePeriodicoService,
  reativarExamePeriodico as reativarExamePeriodicoService
} from '../services/funcionariosExamesPeriodicosService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function criarErroEmpresaAusente() {
  return new Error('Empresa ativa nao identificada para carregar exames periodicos.')
}

function criarErroFuncionarioAusente() {
  return new Error('Funcionario nao identificado para carregar exames periodicos.')
}

function respostaErro(error) {
  return { data: null, error }
}

export function useFuncionariosExamesPeriodicos(opcoes = {}) {
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

  const limparExamesPeriodicos = useCallback(() => {
    cargaAtualRef.current += 1
    setExames([])
    setLoading(false)
    definirErro(null)
  }, [definirErro])

  const carregarExamesPeriodicos = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const funcionario = normalizarId(opcoesCarga.funcionarioId || funcionarioAtual)
    const cargaId = cargaAtualRef.current + 1
    cargaAtualRef.current = cargaId

    if (!empresa) {
      setExames([])
      definirErro(null)
      setLoading(false)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!funcionario) {
      setExames([])
      definirErro(null)
      setLoading(false)
      return respostaErro(criarErroFuncionarioAusente())
    }

    if (!opcoesCarga.silencioso) setLoading(true)
    definirErro(null)

    try {
      const { data, error } = await listarExamesPeriodicos({
        supabase,
        empresaId: empresa,
        funcionarioId: funcionario,
        incluirArquivados
      })

      if (cargaAtualRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

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
      if (cargaAtualRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoading(false)
      }
    }
  }, [definirErro, empresaAtual, funcionarioAtual, incluirArquivados, supabase])

  useEffect(() => {
    cargaAtualRef.current += 1
    setExames([])
    definirErro(null)

    if (!empresaAtual || !funcionarioAtual) {
      setLoading(false)
      return
    }

    if (autoCarregar) {
      carregarExamesPeriodicos({
        empresaId: empresaAtual,
        funcionarioId: funcionarioAtual
      })
    }
  }, [autoCarregar, carregarExamesPeriodicos, definirErro, empresaAtual, funcionarioAtual])

  const executarComEmpresaAtiva = useCallback(async (operacao, opcoesExecucao = {}) => {
    if (!empresaAtual) {
      const error = criarErroEmpresaAusente()
      definirErro(error)
      return respostaErro(error)
    }

    setSalvando(true)
    definirErro(null)

    try {
      const resposta = await operacao(empresaAtual)

      if (resposta?.error) {
        definirErro(resposta.error)
        return respostaErro(resposta.error)
      }

      if (opcoesExecucao.recarregar !== false && funcionarioAtual) {
        await carregarExamesPeriodicos({
          empresaId: empresaAtual,
          funcionarioId: funcionarioAtual,
          silencioso: true
        })
      }

      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvando(false)
    }
  }, [carregarExamesPeriodicos, definirErro, empresaAtual, funcionarioAtual])

  const criarExamePeriodico = useCallback(async (dataExame, opcoesCriacao = {}) => {
    const funcionario = normalizarId(opcoesCriacao.funcionarioId || funcionarioAtual)

    if (!funcionario) {
      const error = criarErroFuncionarioAusente()
      definirErro(error)
      return respostaErro(error)
    }

    return executarComEmpresaAtiva((empresa) => criarExamePeriodicoService({
      supabase,
      empresaId: empresa,
      funcionarioId: funcionario,
      dataExame
    }))
  }, [definirErro, executarComEmpresaAtiva, funcionarioAtual, supabase])

  const atualizarExamePeriodico = useCallback(async (exameId, dataExame) => {
    return executarComEmpresaAtiva((empresa) => atualizarExamePeriodicoService({
      supabase,
      empresaId: empresa,
      exameId,
      dataExame
    }))
  }, [executarComEmpresaAtiva, supabase])

  const arquivarExamePeriodico = useCallback(async (exameId) => {
    return executarComEmpresaAtiva((empresa) => arquivarExamePeriodicoService({
      supabase,
      empresaId: empresa,
      exameId
    }))
  }, [executarComEmpresaAtiva, supabase])

  const reativarExamePeriodico = useCallback(async (exameId) => {
    return executarComEmpresaAtiva((empresa) => reativarExamePeriodicoService({
      supabase,
      empresaId: empresa,
      exameId
    }))
  }, [executarComEmpresaAtiva, supabase])

  const obterUltimoExamePeriodico = useCallback(async (opcoesConsulta = {}) => {
    const empresa = normalizarId(opcoesConsulta.empresaId || empresaAtual)
    const funcionario = normalizarId(opcoesConsulta.funcionarioId || funcionarioAtual)

    if (!empresa) {
      const error = criarErroEmpresaAusente()
      definirErro(error)
      return respostaErro(error)
    }

    if (!funcionario) {
      const error = criarErroFuncionarioAusente()
      definirErro(error)
      return respostaErro(error)
    }

    try {
      const resposta = await obterUltimoExamePeriodicoService({
        supabase,
        empresaId: empresa,
        funcionarioId: funcionario
      })

      if (resposta?.error) {
        definirErro(resposta.error)
        return respostaErro(resposta.error)
      }

      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    }
  }, [definirErro, empresaAtual, funcionarioAtual, supabase])

  return {
    exames,
    setExames,
    loading,
    salvando,
    erro,
    empresaId: empresaAtual,
    funcionarioId: funcionarioAtual,
    carregarExamesPeriodicos,
    criarExamePeriodico,
    atualizarExamePeriodico,
    arquivarExamePeriodico,
    reativarExamePeriodico,
    obterUltimoExamePeriodico,
    calcularProximoPeriodico,
    limparExamesPeriodicos,
    limparErro: () => definirErro(null)
  }
}
