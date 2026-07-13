import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarCompetenciaFolha as arquivarCompetenciaFolhaService,
  arquivarItemLancamentoFolha as arquivarItemLancamentoFolhaService,
  arquivarLancamentoFolha as arquivarLancamentoFolhaService,
  atualizarCompetenciaFolha as atualizarCompetenciaFolhaService,
  atualizarItemLancamentoFolha as atualizarItemLancamentoFolhaService,
  atualizarLancamentoFolha as atualizarLancamentoFolhaService,
  calcularResumoFolhaCompetencia,
  criarCompetenciaFolha as criarCompetenciaFolhaService,
  criarItemLancamentoFolha as criarItemLancamentoFolhaService,
  criarLancamentoFolha as criarLancamentoFolhaService,
  listarCompetenciasFolha,
  listarItensLancamentosFolha,
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

function registrarAuditoriaFolha(supabase, payload) {
  if (!payload?.empresa_id || !payload?.entidade_id) return
  supabase.functions.invoke('registrar-auditoria-evento', { body: {
    empresa_id: payload.empresa_id,
    acao: payload.acao,
    entidade_tipo: payload.entidade_tipo,
    entidade_id: payload.entidade_id,
    modulo: 'folha',
    origem: 'app',
    severidade: 'alta',
    status: 'sucesso',
    dados_antes: payload.dados_antes || null,
    dados_depois: payload.dados_depois || null,
    metadados: payload.metadados || {}
  } }).catch((error) => console.warn('Falha ao registrar auditoria da folha.', { message: error?.message }))
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
  const [itensLancamentos, setItensLancamentos] = useState([])
  const [loadingCompetencias, setLoadingCompetencias] = useState(false)
  const [loadingLancamentos, setLoadingLancamentos] = useState(false)
  const [loadingItensLancamentos, setLoadingItensLancamentos] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaCompetenciasRef = useRef(0)
  const cargaLancamentosRef = useRef(0)
  const cargaItensLancamentosRef = useRef(0)

  const loading = loadingCompetencias || loadingLancamentos || loadingItensLancamentos
  const resumo = useMemo(() => calcularResumoFolhaCompetencia(lancamentos), [lancamentos])

  const definirErro = useCallback((error) => {
    setErro(error ? mensagemSeguraErro(error) : null)
  }, [])

  const limparLancamentos = useCallback(() => {
    cargaLancamentosRef.current += 1
    cargaItensLancamentosRef.current += 1
    setLancamentos([])
    setItensLancamentos([])
    setLoadingLancamentos(false)
    setLoadingItensLancamentos(false)
  }, [])

  const limparItensLancamentos = useCallback(() => {
    cargaItensLancamentosRef.current += 1
    setItensLancamentos([])
    setLoadingItensLancamentos(false)
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

  const carregarItensLancamentos = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const competencia = normalizarId(opcoesCarga.competenciaId || competenciaAtual)
    const cargaId = cargaItensLancamentosRef.current + 1
    cargaItensLancamentosRef.current = cargaId

    if (!empresa || !competencia) {
      limparItensLancamentos()
      return respostaErro(!empresa ? criarErroEmpresaAusente() : criarErroCompetenciaAusente())
    }

    if (!opcoesCarga.silencioso) setLoadingItensLancamentos(true)

    try {
      const { data, error } = await listarItensLancamentosFolha({
        supabase,
        empresaId: empresa,
        competenciaId: competencia,
        lancamentoId: opcoesCarga.lancamentoId,
        incluirArquivados: false
      })

      if (cargaItensLancamentosRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setItensLancamentos([])
        definirErro(error)
        return respostaErro(error)
      }

      setItensLancamentos(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaItensLancamentosRef.current === cargaId) {
        setItensLancamentos([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaItensLancamentosRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoadingItensLancamentos(false)
      }
    }
  }, [competenciaAtual, definirErro, empresaAtual, limparItensLancamentos, supabase])

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
      await carregarItensLancamentos({
        empresaId: empresa,
        competenciaId: competencia,
        silencioso: true
      })
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
    carregarItensLancamentos,
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
    cargaItensLancamentosRef.current += 1
    setLancamentos([])
    setItensLancamentos([])
    definirErro(null)

    if (!empresaAtual || !competenciaAtual) {
      setLoadingLancamentos(false)
      setLoadingItensLancamentos(false)
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
    }).then((resultado) => { const id = Array.isArray(resultado?.data) ? resultado.data[0]?.id : resultado?.data?.id; registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.competencia.criada', entidade_tipo: 'df_folha_competencias', entidade_id: id, dados_depois: { competencia: dados?.competencia || null } }); return resultado }))
  }, [executarComEmpresaAtiva, supabase])

  const atualizarCompetencia = useCallback(async (id, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id,
      dados
    }).then((resultado) => { registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.competencia.atualizada', entidade_tipo: 'df_folha_competencias', entidade_id: id, dados_depois: { campos: Object.keys(dados || {}) } }); return resultado }))
  }, [executarComEmpresaAtiva, supabase])

  const arquivarCompetencia = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => arquivarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id
    }).then((resultado) => { registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.competencia.arquivada', entidade_tipo: 'df_folha_competencias', entidade_id: id, dados_depois: { arquivada: true } }); return resultado }), { recarregarLancamentos: id === competenciaAtual, competenciaId: id })
  }, [competenciaAtual, executarComEmpresaAtiva, supabase])

  const reativarCompetencia = useCallback(async (id) => {
    return executarComEmpresaAtiva((empresa) => reativarCompetenciaFolhaService({
      supabase,
      empresaId: empresa,
      id
    }).then((resultado) => { registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.competencia.reativada', entidade_tipo: 'df_folha_competencias', entidade_id: id, dados_depois: { arquivada: false } }); return resultado }), { recarregarLancamentos: id === competenciaAtual, competenciaId: id })
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
    }).then((resultado) => { const id = Array.isArray(resultado?.data) ? resultado.data[0]?.id : resultado?.data?.id; registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.lancamento.criado', entidade_tipo: 'df_folha_lancamentos', entidade_id: id, dados_depois: { categoria: payload.categoria || null, natureza: payload.natureza || null, competencia_id: competencia } }); return resultado }), {
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
    }).then((resultado) => { registrarAuditoriaFolha(supabase, { empresa_id: empresa, acao: 'folha.lancamento.atualizado', entidade_tipo: 'df_folha_lancamentos', entidade_id: id, dados_depois: { campos: Object.keys(dados || {}) } }); return resultado }), { recarregarLancamentos: true })
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

  const criarItemLancamento = useCallback(async (lancamento, dados = {}) => {
    const competencia = normalizarId(dados.competenciaId || dados.competencia_id || lancamento?.competencia_id || competenciaAtual)

    if (!competencia) {
      const error = criarErroCompetenciaAusente()
      definirErro(error)
      return respostaErro(error)
    }

    const payload = {
      ...dados,
      competencia_id: competencia,
      lancamento_id: lancamento?.id || dados.lancamento_id || dados.lancamentoId,
      funcionario_id: lancamento?.funcionario_id || dados.funcionario_id || dados.funcionarioId,
      filial_id: lancamento?.filial_id || dados.filial_id || dados.filialId || null,
      categoria: lancamento?.categoria || dados.categoria
    }

    return executarComEmpresaAtiva((empresa) => criarItemLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      dados: payload
    }), {
      recarregarLancamentos: true,
      competenciaId: competencia
    })
  }, [competenciaAtual, definirErro, executarComEmpresaAtiva, supabase])

  const atualizarItemLancamento = useCallback(async (item, dados = {}) => {
    const competencia = normalizarId(item?.competencia_id || competenciaAtual)

    return executarComEmpresaAtiva((empresa) => atualizarItemLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      id: item?.id,
      dados: {
        ...dados,
        categoria: item?.categoria || dados.categoria
      }
    }), {
      recarregarLancamentos: true,
      competenciaId: competencia
    })
  }, [competenciaAtual, executarComEmpresaAtiva, supabase])

  const arquivarItemLancamento = useCallback(async (item) => {
    const competencia = normalizarId(item?.competencia_id || competenciaAtual)

    return executarComEmpresaAtiva((empresa) => arquivarItemLancamentoFolhaService({
      supabase,
      empresaId: empresa,
      id: item?.id
    }), {
      recarregarLancamentos: true,
      competenciaId: competencia
    })
  }, [competenciaAtual, executarComEmpresaAtiva, supabase])

  const calcularResumo = useCallback((lista = lancamentos) => {
    return calcularResumoFolhaCompetencia(lista)
  }, [lancamentos])

  return {
    competencias,
    lancamentos,
    itensLancamentos,
    loading,
    loadingCompetencias,
    loadingLancamentos,
    loadingItensLancamentos,
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
    carregarItensLancamentos,
    criarLancamento,
    atualizarLancamento,
    arquivarLancamento,
    reativarLancamento,
    criarItemLancamento,
    atualizarItemLancamento,
    arquivarItemLancamento,
    calcularResumo,
    limparErro: () => definirErro(null),
    limparLancamentos,
    limparItensLancamentos
  }
}
