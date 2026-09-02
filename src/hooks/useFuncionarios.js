import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  alterarAdmissaoFuncionarioControlada as alterarAdmissaoFuncionarioControladaService,
  arquivarFuncionario as arquivarFuncionarioService,
  atualizarFuncionario as atualizarFuncionarioService,
  criarFuncionario as criarFuncionarioService,
  listarFuncionarios,
  listarTransferenciasFiliais,
  obterFuncionarioPorId as obterFuncionarioPorIdService,
  readmitirPessoaControlada as readmitirPessoaControladaService,
  reativarFuncionario as reativarFuncionarioService,
  transferirFuncionarioFilialControlada as transferirFuncionarioFilialControladaService
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
  const [transferenciasFiliais, setTransferenciasFiliais] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaAtualRef = useRef(0)
  const montadoRef = useRef(true)

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
      const [resultadoFuncionarios, resultadoTransferencias] = await Promise.all([
        listarFuncionarios({ supabase, empresaId: empresa, incluirArquivados }),
        listarTransferenciasFiliais({ supabase, empresaId: empresa })
      ])
      const { data, error } = resultadoFuncionarios
      if (resultadoTransferencias.error) throw resultadoTransferencias.error

      if (!montadoRef.current || cargaAtualRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      if (error) {
        setFuncionarios([])
        definirErro(error)
        return respostaErro(error)
      }

      setFuncionarios(data || [])
      setTransferenciasFiliais(resultadoTransferencias.data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (montadoRef.current && cargaAtualRef.current === cargaId) {
        setFuncionarios([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (montadoRef.current && cargaAtualRef.current === cargaId && !opcoesCarga.silencioso) {
        setLoading(false)
      }
    }
  }, [definirErro, empresaAtual, incluirArquivados, supabase])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      cargaAtualRef.current += 1
    }
  }, [])

  useEffect(() => {
    cargaAtualRef.current += 1
    setFuncionarios([])
    setTransferenciasFiliais([])
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

      return { ...resposta, data: resposta?.data ?? null, error: null }
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
    return executarComEmpresaAtiva(async (empresa) => {
      const resultado = await criarFuncionarioService({
        supabase,
        empresaId: empresa,
        dados
      })
      return resultado
    })
  }, [executarComEmpresaAtiva, supabase])

  const atualizarFuncionario = useCallback(async (funcionarioId, dados) => {
    return executarComEmpresaAtiva((empresa) => atualizarFuncionarioService({
      supabase,
      empresaId: empresa,
      funcionarioId,
      dados
    }))
  }, [executarComEmpresaAtiva, supabase])

  const alterarAdmissaoFuncionario = useCallback(async (funcionarioId, dados = {}) => {
    return executarComEmpresaAtiva((empresa) => alterarAdmissaoFuncionarioControladaService({
      supabase,
      empresaId: empresa,
      funcionarioId,
      novaDataAdmissao: dados.novaDataAdmissao,
      somentePreflight: dados.somentePreflight,
      confirmarCiclosPreservados: dados.confirmarCiclosPreservados,
      motivo: dados.motivo,
      correlationId: dados.correlationId
    }), { recarregar: !dados.somentePreflight })
  }, [executarComEmpresaAtiva, supabase])

  const readmitirPessoa = useCallback(async (funcionarioId, dados = {}) => {
    return executarComEmpresaAtiva((empresa) => readmitirPessoaControladaService({
      supabase,
      empresaId: empresa,
      vinculoAnteriorId: funcionarioId,
      requestKey: dados.requestKey,
      novaDataAdmissao: dados.novaDataAdmissao,
      filialId: dados.filialId,
      cargo: dados.cargo,
      dataExameAdmissional: dados.dataExameAdmissional,
      correlationId: dados.correlationId
    }))
  }, [executarComEmpresaAtiva, supabase])

  const transferirFuncionarioFilial = useCallback(async (funcionarioId, dados = {}) => {
    return executarComEmpresaAtiva((empresa) => transferirFuncionarioFilialControladaService({
      supabase,
      empresaId: empresa,
      funcionarioId,
      filialDestinoId: dados.filialDestinoId,
      dataTransferencia: dados.dataTransferencia,
      motivo: dados.motivo,
      observacoes: dados.observacoes,
      correlationId: dados.correlationId
    }))
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
    transferenciasFiliais,
    setFuncionarios,
    loading,
    salvando,
    erro,
    empresaId: empresaAtual,
    carregarFuncionarios,
    obterFuncionarioPorId,
    criarFuncionario,
    atualizarFuncionario,
    alterarAdmissaoFuncionario,
    readmitirPessoa,
    transferirFuncionarioFilial,
    arquivarFuncionario,
    reativarFuncionario,
    limparErro: () => definirErro(null)
  }
}
