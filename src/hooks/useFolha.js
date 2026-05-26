import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarCompetenciaFolha as arquivarCompetenciaFolhaService,
  arquivarLancamentoFolha as arquivarLancamentoFolhaService,
  atualizarCompetenciaFolha as atualizarCompetenciaFolhaService,
  atualizarLancamentoFolha as atualizarLancamentoFolhaService,
  calcularResumoFolhaCompetencia,
  criarCompetenciaFolha as criarCompetenciaFolhaService,
  criarLancamentoFolha as criarLancamentoFolhaService,
  listarCompetenciasFolha,
  listarLancamentosFolha,
  reativarCompetenciaFolha as reativarCompetenciaFolhaService,
  reativarLancamentoFolha as reativarLancamentoFolhaService
} from '../services/folhaService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function criarErroEmpresaAusente() {
  return new Error('Empresa ativa nao identificada para carregar folha.')
}

function criarErroCompetenciaAusente() {
  return new Error('Competencia de folha nao identificada.')
}

function respostaErro(error) {
  return { data: null, error }
}

export function useFolha(opcoes = {}) {
  const {
    empresaId,
    competenciaId,
    funcionarioId,
    incluirArquivadas = false,
    incluirArquivados = false,
    autoCarregarCompetencias = true,
    autoCarregarLancamentos = false,
    supabase = supabasePadrao
  } = opcoes

  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const competenciaAtual = useMemo(() => normalizarId(competenciaId), [competenciaId])
  const funcionarioAtual = useMemo(() => normalizarId(funcionarioId), [funcionarioId])
  const [competencias, setCompetencias] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [loadingCompetencias, setLoadingCompetencias] = useState(false)
  const [loadingLancamentos, setLoadingLancamentos] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaCompetenciasRef = useRef(0)
  const cargaLancamentosRef = useRef(0)

  const loading = loadingCompetencias || loadingLancamentos
  const resumo = useMemo(() => calcularResumoFolhaCompetencia(lancamentos), [lancamentos])

  const definirErro = useCallback((error) => {
    setErro(error ? mensagemSeguraErro(error) : null)
  }, [])

  const limparLancamentos = useCallback(() => {
    cargaLancamentosRef.current += 1
    setLancamentos([])
    setLoadingLancamentos(false)
  }, [])

  const carregarCompetencias = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const cargaId = cargaCompetenciasRef.current + 1
    cargaCompetenciasRef.current = cargaId

    if (!empresa) {
      setCompetencias([])
      definirErro(null)
      setLoadingCompetencias(false)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!opcoesCarga.silencioso) setLoadingCompetencias(true)
    definirErro(null)

    try {
      const { data, error } = await listarCompetenciasFolha({
        supabase,
        empresaId: empresa,
        incluirArquivadas: opcoesCarga.incluirArquivadas ?? incluirArquivadas
      })

      if (cargaCompetenciasRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setCompetencias([])
        definirErro(error)
        return respostaErro(error)
      }

      setCompetencias(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaCompetenciasRef.current === cargaId) {
        setCompetencias([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaCompetenciasRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoadingCompetencias(false)
      }
    }
  }, [definirErro, empresaAtual, incluirArquivadas, supabase])

  const carregarLancamentos = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const competencia = normalizarId(opcoesCarga.competenciaId || competenciaAtual)
    const funcionario = normalizarId(opcoesCarga.funcionarioId || funcionarioAtual)
    const cargaId = cargaLancamentosRef.current + 1
    cargaLancamentosRef.current = cargaId

    if (!empresa) {
      limparLancamentos()
      definirErro(null)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!competencia) {
      limparLancamentos()
      definirErro(null)
      return respostaErro(criarErroCompetenciaAusente())
    }

    if (!opcoesCarga.silencioso) setLoadingLancamentos(true)
    definirErro(null)

    try {
      const { data, error } = await listarLancamentosFolha({
        supabase,
        empresaId: empresa,
        competenciaId: competencia,
        funcionarioId: funcionario || undefined,
        incluirArquivados: opcoesCarga.incluirArquivados ?? incluirArquivados
      })

      if (cargaLancamentosRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setLancamentos([])
        definirErro(error)
        return respostaErro(error)
      }

      setLancamentos(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaLancamentosRef.current === cargaId) {
        setLancamentos([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaLancamentosRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoadingLancamentos(false)
      }
    }
  }, [
    competenciaAtual,
    definirErro,
    empresaAtual,
    funcionarioAtual,
    incluirArquivados,
    limparLancamentos,
    supabase
  ])

  useEffect(() => {
    cargaCompetenciasRef.current += 1
    setCompetencias([])
    definirErro(null)

    if (!empresaAtual) {
      setLoadingCompetencias(false)
      return
    }

    if (autoCarregarCompetencias) {
      carregarCompetencias({ empresaId: empresaAtual })
    }
  }, [autoCarregarCompetencias, carregarCompetencias, definirErro, empresaAtual])

  useEffect(() => {
    cargaLancamentosRef.current += 1
    setLancamentos([])
    definirErro(null)

    if (!empresaAtual || !competenciaAtual) {
      setLoadingLancamentos(false)
      return
    }

    if (autoCarregarLancamentos) {
      carregarLancamentos({
        empresaId: empresaAtual,
        competenciaId: competenciaAtual,
        funcionarioId: funcionarioAtual || undefined
      })
    }
  }, [
    autoCarregarLancamentos,
    carregarLancamentos,
    competenciaAtual,
    definirErro,
    empresaAtual,
    funcionarioAtual
  ])

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

      if (opcoesExecucao.recarregarCompetencias !== false) {
        await carregarCompetencias({ empresaId: empresaAtual, silencioso: true })
      }

      if (opcoesExecucao.recarregarLancamentos && (opcoesExecucao.competenciaId || competenciaAtual)) {
        await carregarLancamentos({
          empresaId: empresaAtual,
          competenciaId: opcoesExecucao.competenciaId || competenciaAtual,
          funcionarioId: opcoesExecucao.funcionarioId || funcionarioAtual || undefined,
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
  }, [
    carregarCompetencias,
    carregarLancamentos,
    competenciaAtual,
    definirErro,
    empresaAtual,
    funcionarioAtual
  ])

  const criarCompetencia = useCallback(async (dados) => {
    return executarComEmpresaAtiva((empresa) => criarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      dados
    }))
  }, [executarComEmpresaAtiva, supabase])

  const atualizarCompetencia = useCallback(async (id, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id,
      dados
    }))
  }, [executarComEmpresaAtiva, supabase])

  const arquivarCompetencia = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => arquivarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id
    }), { recarregarLancamentos: id === competenciaAtual, competenciaId: id })
  }, [competenciaAtual, executarComEmpresaAtiva, supabase])

  const reativarCompetencia = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => reativarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id
    }), { recarregarLancamentos: id === competenciaAtual, competenciaId: id })
  }, [competenciaAtual, executarComEmpresaAtiva, supabase])

  const criarLancamento = useCallback(async (dados = {}) => {
    const competencia = normalizarId(dados.competenciaId || dados.competencia_id || competenciaAtual)
    const funcionario = normalizarId(dados.funcionarioId || dados.funcionario_id || funcionarioAtual)

    if (!competencia) {
      const error = criarErroCompetenciaAusente()
      definirErro(error)
      return respostaErro(error)
    }

    const payload = {
      ...dados,
      competencia_id: competencia,
      funcionario_id: funcionario || dados.funcionario_id || dados.funcionarioId
    }

    return executarComEmpresaAtiva((empresa) => criarLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      dados: payload
    }), {
      recarregarLancamentos: true,
      competenciaId: competencia,
      funcionarioId: funcionario || undefined
    })
  }, [competenciaAtual, definirErro, executarComEmpresaAtiva, funcionarioAtual, supabase])

  const atualizarLancamento = useCallback(async (id, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      id,
      dados
    }), { recarregarLancamentos: true })
  }, [executarComEmpresaAtiva, supabase])

  const arquivarLancamento = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => arquivarLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      id
    }), { recarregarLancamentos: true })
  }, [executarComEmpresaAtiva, supabase])

  const reativarLancamento = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => reativarLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      id
    }), { recarregarLancamentos: true })
  }, [executarComEmpresaAtiva, supabase])

  const calcularResumo = useCallback((lista = lancamentos) => {
    return calcularResumoFolhaCompetencia(lista)
  }, [lancamentos])

  return {
    competencias,
    lancamentos,
    loading,
    loadingCompetencias,
    loadingLancamentos,
    salvando,
    erro,
    resumo,
    empresaId: empresaAtual,
    competenciaId: competenciaAtual,
    funcionarioId: funcionarioAtual,
    carregarCompetencias,
    criarCompetencia,
    atualizarCompetencia,
    arquivarCompetencia,
    reativarCompetencia,
    carregarLancamentos,
    criarLancamento,
    atualizarLancamento,
    arquivarLancamento,
    reativarLancamento,
    calcularResumo,
    limparErro: () => definirErro(null),
    limparLancamentos
  }
}
