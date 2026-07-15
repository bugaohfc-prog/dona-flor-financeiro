import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  arquivarFuncionario as arquivarFuncionarioService,
  atualizarFuncionario as atualizarFuncionarioService,
  criarFuncionario as criarFuncionarioService,
  listarFuncionarios,
  obterFuncionarioPorId as obterFuncionarioPorIdService,
  reativarFuncionario as reativarFuncionarioService
} from '../services/funcionariosService'
import { mensagemSeguraErro } from '../utils/session'
import { registrarEventoAuditoriaSeguro } from '../services/auditoriaService'

async function auditarResultadoFuncionario(supabase, resultado, empresaId, acao, funcionarioId, dados = {}) {
  if (resultado?.error || !empresaId || !funcionarioId) return resultado
  await registrarEventoAuditoriaSeguro(supabase, {
    empresa_id: empresaId,
    acao,
    entidade_tipo: 'df_funcionarios',
    entidade_id: funcionarioId,
    modulo: 'rh',
    origem: 'app',
    severidade: 'alta',
    status: 'sucesso',
    dados_antes: null,
    dados_depois: dados,
    metadados: { funcionario_id: funcionarioId }
  }, 'operação de funcionário')
  return resultado
}

function normalizarId(valor) {
  return String(valor || '').trim()
}

function criarErroEmpresaAusente() {
  return new Error('Empresa ativa nao identificada para carregar funcionarios.')
}

function respostaErro(error) {
  return { data: null, error }
}

export function useFuncionarios(opcoes = {}) {
  const {
    empresaId,
    incluirArquivados = false,
    autoCarregar = true,
    supabase = supabasePadrao
  } = opcoes

  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaAtualRef = useRef(0)

  const definirErro = useCallback((error) => {
    setErro(error ? mensagemSeguraErro(error) : null)
  }, [])

  const carregarFuncionarios = useCallback(async (opcoesCarga = {}) => {
    const empresa = normalizarId(opcoesCarga.empresaId || empresaAtual)
    const cargaId = cargaAtualRef.current + 1
    cargaAtualRef.current = cargaId

    if (!empresa) {
      setFuncionarios([])
      definirErro(null)
      setLoading(false)
      return respostaErro(criarErroEmpresaAusente())
    }

    if (!opcoesCarga.silencioso) setLoading(true)
    definirErro(null)

    try {
      const { data, error } = await listarFuncionarios({
        supabase,
        empresaId: empresa,
        incluirArquivados
      })

      if (cargaAtualRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setFuncionarios([])
        definirErro(error)
        return respostaErro(error)
      }

      setFuncionarios(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaAtualRef.current === cargaId) {
        setFuncionarios([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaAtualRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoading(false)
      }
    }
  }, [definirErro, empresaAtual, incluirArquivados, supabase])

  useEffect(() => {
    cargaAtualRef.current += 1
    setFuncionarios([])
    definirErro(null)

    if (!empresaAtual) {
      setLoading(false)
      return
    }

    if (autoCarregar) {
      carregarFuncionarios({ empresaId: empresaAtual })
    }
  }, [autoCarregar, carregarFuncionarios, definirErro, empresaAtual])

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

      if (opcoesExecucao.recarregar !== false) {
        await carregarFuncionarios({ empresaId: empresaAtual, silencioso: true })
      }

      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvando(false)
    }
  }, [carregarFuncionarios, definirErro, empresaAtual])

  const obterFuncionarioPorId = useCallback(async (funcionarioId) => {
    return executarComEmpresaAtiva((empresa) => obterFuncionarioPorIdService({
      supabase,
      empresaId: empresa,
      funcionarioId
    }), { recarregar: false })
  }, [executarComEmpresaAtiva, supabase])

  const criarFuncionario = useCallback(async (dados) => {
    return executarComEmpresaAtiva((empresa) => criarFuncionarioService({
      supabase,
      empresaId: empresa,
      dados
    }).then((resultado) => { const id = Array.isArray(resultado?.data) ? resultado.data[0]?.id : resultado?.data?.id; return auditarResultadoFuncionario(supabase, resultado, empresa, 'rh.funcionario.criado', id, { campos: Object.keys(dados || {}) }) }))
  }, [executarComEmpresaAtiva, supabase])

  const atualizarFuncionario = useCallback(async (funcionarioId, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarFuncionarioService({
      supabase,
      empresaId: empresa,
      funcionarioId,
      dados
    }).then((resultado) => auditarResultadoFuncionario(supabase, resultado, empresa, 'rh.funcionario.atualizado', funcionarioId, { campos: Object.keys(dados || {}) })))
  }, [executarComEmpresaAtiva, supabase])

  const arquivarFuncionario = useCallback(async (funcionarioId) => {
    return executarComEmpresaAtiva((empresa) => arquivarFuncionarioService({
      supabase,
      empresaId: empresa,
      funcionarioId
    }).then((resultado) => auditarResultadoFuncionario(supabase, resultado, empresa, 'rh.funcionario.arquivado', funcionarioId, { arquivado: true })))
  }, [executarComEmpresaAtiva, supabase])

  const reativarFuncionario = useCallback(async (funcionarioId) => {
    return executarComEmpresaAtiva((empresa) => reativarFuncionarioService({
      supabase,
      empresaId: empresa,
      funcionarioId
    }).then((resultado) => auditarResultadoFuncionario(supabase, resultado, empresa, 'rh.funcionario.reativado', funcionarioId, { arquivado: false })))
  }, [executarComEmpresaAtiva, supabase])

  return {
    funcionarios,
    setFuncionarios,
    loading,
    salvando,
    erro,
    empresaId: empresaAtual,
    carregarFuncionarios,
    obterFuncionarioPorId,
    criarFuncionario,
    atualizarFuncionario,
    arquivarFuncionario,
    reativarFuncionario,
    limparErro: () => definirErro(null)
  }
}
