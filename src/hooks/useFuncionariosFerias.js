import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarCicloFerias as arquivarCicloFeriasService,
  arquivarPeriodoFerias as arquivarPeriodoFeriasService,
  atualizarCicloFerias as atualizarCicloFeriasService,
  atualizarPeriodoFerias as atualizarPeriodoFeriasService,
  calcularFimFerias,
  calcularRetornoTrabalho,
  calcularSaldoDiasFerias,
  calcularStatusCicloFerias,
  criarCicloFerias as criarCicloFeriasService,
  criarPeriodoFerias as criarPeriodoFeriasService,
  listarCiclosFerias,
  listarPeriodosFerias,
  obterCicloFeriasPorId as obterCicloFeriasPorIdService,
  obterPeriodoFeriasPorId as obterPeriodoFeriasPorIdService,
  reativarCicloFerias as reativarCicloFeriasService,
  reativarPeriodoFerias as reativarPeriodoFeriasService
} from '../services/funcionariosFeriasService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function criarErroEmpresaAusente() {
  return new Error('Empresa ativa nao identificada para carregar ferias.')
}

function criarErroFuncionarioAusente() {
  return new Error('Funcionario nao identificado para carregar ferias.')
}

function criarErroCicloAusente() {
  return new Error('Ciclo de ferias nao identificado.')
}

function respostaErro(error) {
  return { data: null, error }
}

export function useFuncionariosFerias(opcoes = {}) {
  const {
    empresaId,
    funcionarioId,
    cicloId,
    incluirArquivados = false,
    autoCarregarCiclos = true,
    autoCarregarPeriodos = false,
    supabase = supabasePadrao
  } = opcoes

  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const funcionarioAtual = useMemo(() => normalizarId(funcionarioId), [funcionarioId])
  const cicloAtual = useMemo(() => normalizarId(cicloId), [cicloId])
  const [ciclos, setCiclos] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [loadingCiclos, setLoadingCiclos] = useState(false)
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaCiclosRef = useRef(0)
  const cargaPeriodosRef = useRef(0)

  const loading = loadingCiclos || loadingPeriodos

  const definirErro = useCallback((error) => {
    setErro(error ? mensagemSeguraErro(error) : null)
  }, [])

  const limparFerias = useCallback(() => {
    cargaCiclosRef.current += 1
    cargaPeriodosRef.current += 1
    setCiclos([])
    setPeriodos([])
    setLoadingCiclos(false)
    setLoadingPeriodos(false)
    definirErro(null)
  }, [definirErro])

  const carregarCiclosFerias = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const funcionario = normalizarId(opcoesCarga.funcionarioId || funcionarioAtual)
    const cargaId = cargaCiclosRef.current + 1
    cargaCiclosRef.current = cargaId

    if (!empresa) {
      setCiclos([])
      definirErro(null)
      setLoadingCiclos(false)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!funcionario) {
      setCiclos([])
      definirErro(null)
      setLoadingCiclos(false)
      return respostaErro(criarErroFuncionarioAusente())
    }

    if (!opcoesCarga.silencioso) setLoadingCiclos(true)
    definirErro(null)

    try {
      const { data, error } = await listarCiclosFerias({
        supabase,
        empresaId: empresa,
        funcionarioId: funcionario,
        incluirArquivados
      })

      if (cargaCiclosRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setCiclos([])
        definirErro(error)
        return respostaErro(error)
      }

      setCiclos(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaCiclosRef.current === cargaId) {
        setCiclos([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaCiclosRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoadingCiclos(false)
      }
    }
  }, [definirErro, empresaAtual, funcionarioAtual, incluirArquivados, supabase])

  const carregarPeriodosFerias = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const funcionario = normalizarId(opcoesCarga.funcionarioId || funcionarioAtual)
    const ciclo = normalizarId(opcoesCarga.cicloId || cicloAtual)
    const cargaId = cargaPeriodosRef.current + 1
    cargaPeriodosRef.current = cargaId

    if (!empresa) {
      setPeriodos([])
      definirErro(null)
      setLoadingPeriodos(false)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!funcionario) {
      setPeriodos([])
      definirErro(null)
      setLoadingPeriodos(false)
      return respostaErro(criarErroFuncionarioAusente())
    }

    if (!ciclo) {
      setPeriodos([])
      definirErro(null)
      setLoadingPeriodos(false)
      return respostaErro(criarErroCicloAusente())
    }

    if (!opcoesCarga.silencioso) setLoadingPeriodos(true)
    definirErro(null)

    try {
      const { data, error } = await listarPeriodosFerias({
        supabase,
        empresaId: empresa,
        cicloId: ciclo,
        funcionarioId: funcionario,
        incluirArquivados
      })

      if (cargaPeriodosRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setPeriodos([])
        definirErro(error)
        return respostaErro(error)
      }

      setPeriodos(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaPeriodosRef.current === cargaId) {
        setPeriodos([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaPeriodosRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoadingPeriodos(false)
      }
    }
  }, [cicloAtual, definirErro, empresaAtual, funcionarioAtual, incluirArquivados, supabase])

  useEffect(() => {
    cargaCiclosRef.current += 1
    setCiclos([])
    definirErro(null)

    if (!empresaAtual || !funcionarioAtual) {
      setLoadingCiclos(false)
      return
    }

    if (autoCarregarCiclos) {
      carregarCiclosFerias({
        empresaId: empresaAtual,
        funcionarioId: funcionarioAtual
      })
    }
  }, [autoCarregarCiclos, carregarCiclosFerias, definirErro, empresaAtual, funcionarioAtual])

  useEffect(() => {
    cargaPeriodosRef.current += 1
    setPeriodos([])
    definirErro(null)

    if (!empresaAtual || !funcionarioAtual || !cicloAtual) {
      setLoadingPeriodos(false)
      return
    }

    if (autoCarregarPeriodos) {
      carregarPeriodosFerias({
        empresaId: empresaAtual,
        funcionarioId: funcionarioAtual,
        cicloId: cicloAtual
      })
    }
  }, [autoCarregarPeriodos, carregarPeriodosFerias, cicloAtual, definirErro, empresaAtual, funcionarioAtual])

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

      if (opcoesExecucao.recarregarCiclos !== false && funcionarioAtual) {
        await carregarCiclosFerias({
          empresaId: empresaAtual,
          funcionarioId: funcionarioAtual,
          silencioso: true
        })
      }

      if (opcoesExecucao.recarregarPeriodos && funcionarioAtual && (opcoesExecucao.cicloId || cicloAtual)) {
        await carregarPeriodosFerias({
          empresaId: empresaAtual,
          funcionarioId: funcionarioAtual,
          cicloId: opcoesExecucao.cicloId || cicloAtual,
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
  }, [carregarCiclosFerias, carregarPeriodosFerias, cicloAtual, definirErro, empresaAtual, funcionarioAtual])

  const obterCicloFeriasPorId = useCallback(async (cicloIdConsulta) => {
    return executarComEmpresaAtiva((empresa) => obterCicloFeriasPorIdService({
      supabase,
      empresaId: empresa,
      cicloId: cicloIdConsulta
    }), { recarregarCiclos: false })
  }, [executarComEmpresaAtiva, supabase])

  const criarCicloFerias = useCallback(async (dados, opcoesCriacao = {}) => {
    const funcionario = normalizarId(opcoesCriacao.funcionarioId || funcionarioAtual)

    if (!funcionario) {
      const error = criarErroFuncionarioAusente()
      definirErro(error)
      return respostaErro(error)
    }

    return executarComEmpresaAtiva((empresa) => criarCicloFeriasService({
      supabase,
      empresaId: empresa,
      funcionarioId: funcionario,
      dados
    }))
  }, [definirErro, executarComEmpresaAtiva, funcionarioAtual, supabase])

  const atualizarCicloFerias = useCallback(async (cicloIdAtualizacao, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarCicloFeriasService({
      supabase,
      empresaId: empresa,
      cicloId: cicloIdAtualizacao,
      dados
    }))
  }, [executarComEmpresaAtiva, supabase])

  const arquivarCicloFerias = useCallback(async (cicloIdArquivamento) => {
    return executarComEmpresaAtiva((empresa) => arquivarCicloFeriasService({
      supabase,
      empresaId: empresa,
      cicloId: cicloIdArquivamento
    }), { recarregarPeriodos: cicloIdArquivamento === cicloAtual, cicloId: cicloIdArquivamento })
  }, [cicloAtual, executarComEmpresaAtiva, supabase])

  const reativarCicloFerias = useCallback(async (cicloIdReativacao) => {
    return executarComEmpresaAtiva((empresa) => reativarCicloFeriasService({
      supabase,
      empresaId: empresa,
      cicloId: cicloIdReativacao
    }), { recarregarPeriodos: cicloIdReativacao === cicloAtual, cicloId: cicloIdReativacao })
  }, [cicloAtual, executarComEmpresaAtiva, supabase])

  const obterPeriodoFeriasPorId = useCallback(async (periodoIdConsulta) => {
    return executarComEmpresaAtiva((empresa) => obterPeriodoFeriasPorIdService({
      supabase,
      empresaId: empresa,
      periodoId: periodoIdConsulta
    }), { recarregarCiclos: false })
  }, [executarComEmpresaAtiva, supabase])

  const criarPeriodoFerias = useCallback(async (dados = {}) => {
    const ciclo = normalizarId(dados.cicloId || dados.ciclo_ferias_id || cicloAtual)
    const funcionario = normalizarId(dados.funcionarioId || dados.funcionario_id || funcionarioAtual)

    if (!funcionario) {
      const error = criarErroFuncionarioAusente()
      definirErro(error)
      return respostaErro(error)
    }

    if (!ciclo) {
      const error = criarErroCicloAusente()
      definirErro(error)
      return respostaErro(error)
    }

    return executarComEmpresaAtiva((empresa) => criarPeriodoFeriasService({
      supabase,
      empresaId: empresa,
      cicloId: ciclo,
      funcionarioId: funcionario,
      dataInicio: dados.dataInicio ?? dados.data_inicio,
      quantidadeDias: dados.quantidadeDias ?? dados.quantidade_dias,
      numeroParcela: dados.numeroParcela ?? dados.numero_parcela,
      status: dados.status
    }), { recarregarPeriodos: true, cicloId: ciclo })
  }, [cicloAtual, definirErro, executarComEmpresaAtiva, funcionarioAtual, supabase])

  const atualizarPeriodoFerias = useCallback(async (periodoIdAtualizacao, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarPeriodoFeriasService({
      supabase,
      empresaId: empresa,
      periodoId: periodoIdAtualizacao,
      dados
    }), { recarregarPeriodos: true })
  }, [executarComEmpresaAtiva, supabase])

  const arquivarPeriodoFerias = useCallback(async (periodoIdArquivamento) => {
    return executarComEmpresaAtiva((empresa) => arquivarPeriodoFeriasService({
      supabase,
      empresaId: empresa,
      periodoId: periodoIdArquivamento
    }), { recarregarPeriodos: true })
  }, [executarComEmpresaAtiva, supabase])

  const reativarPeriodoFerias = useCallback(async (periodoIdReativacao) => {
    return executarComEmpresaAtiva((empresa) => reativarPeriodoFeriasService({
      supabase,
      empresaId: empresa,
      periodoId: periodoIdReativacao
    }), { recarregarPeriodos: true })
  }, [executarComEmpresaAtiva, supabase])

  return {
    ciclos,
    periodos,
    loading,
    loadingCiclos,
    loadingPeriodos,
    salvando,
    erro,
    empresaId: empresaAtual,
    funcionarioId: funcionarioAtual,
    cicloId: cicloAtual,
    carregarCiclosFerias,
    obterCicloFeriasPorId,
    criarCicloFerias,
    atualizarCicloFerias,
    arquivarCicloFerias,
    reativarCicloFerias,
    carregarPeriodosFerias,
    obterPeriodoFeriasPorId,
    criarPeriodoFerias,
    atualizarPeriodoFerias,
    arquivarPeriodoFerias,
    reativarPeriodoFerias,
    calcularFimFerias,
    calcularRetornoTrabalho,
    calcularSaldoDiasFerias,
    calcularStatusCicloFerias,
    limparFerias,
    limparErro: () => definirErro(null)
  }
}
