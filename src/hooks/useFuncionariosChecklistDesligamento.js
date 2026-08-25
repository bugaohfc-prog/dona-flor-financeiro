import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  alterarEstadoItemChecklistDesligamento,
  atualizarItemChecklistDesligamento,
  criarItemChecklistDesligamento,
  listarCatalogoChecklistDesligamento,
  listarItensChecklistDesligamento
} from '../services/funcionariosChecklistDesligamentoService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

export function useFuncionariosChecklistDesligamento({
  empresaId,
  desligamentoId,
  autoCarregar = true,
  supabase = supabasePadrao
} = {}) {
  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const desligamentoAtual = useMemo(() => normalizarId(desligamentoId), [desligamentoId])
  const [catalogo, setCatalogo] = useState([])
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaRef = useRef(0)

  const carregar = useCallback(async () => {
    const carga = ++cargaRef.current
    if (!empresaAtual || !desligamentoAtual) {
      setCatalogo([])
      setItens([])
      setErro(null)
      setLoading(false)
      return { data: { catalogo: [], itens: [] }, error: null }
    }

    setLoading(true)
    setErro(null)
    try {
      const [respostaCatalogo, respostaItens] = await Promise.all([
        listarCatalogoChecklistDesligamento({ supabase, empresaId: empresaAtual }),
        listarItensChecklistDesligamento({ supabase, empresaId: empresaAtual, desligamentoId: desligamentoAtual })
      ])
      const erroCarga = respostaCatalogo.error || respostaItens.error
      if (carga !== cargaRef.current) return { data: null, error: null, ignorado: true }
      if (erroCarga) {
        setCatalogo([])
        setItens([])
        setErro(mensagemSeguraErro(erroCarga, 'Não foi possível carregar o checklist administrativo.'))
        return { data: null, error: erroCarga }
      }
      const dados = { catalogo: respostaCatalogo.data || [], itens: respostaItens.data || [] }
      setCatalogo(dados.catalogo)
      setItens(dados.itens)
      return { data: dados, error: null }
    } catch (error) {
      if (carga === cargaRef.current) {
        setCatalogo([])
        setItens([])
        setErro(mensagemSeguraErro(error, 'Não foi possível carregar o checklist administrativo.'))
      }
      return { data: null, error }
    } finally {
      if (carga === cargaRef.current) setLoading(false)
    }
  }, [desligamentoAtual, empresaAtual, supabase])

  useEffect(() => {
    cargaRef.current += 1
    setCatalogo([])
    setItens([])
    setErro(null)
    if (autoCarregar && empresaAtual && desligamentoAtual) carregar()
  }, [autoCarregar, carregar, desligamentoAtual, empresaAtual])

  const executar = useCallback(async (operacao) => {
    if (!empresaAtual || !desligamentoAtual) {
      return { data: null, error: new Error('Processo de desligamento não identificado.') }
    }
    setSalvando(true)
    setErro(null)
    try {
      const resposta = await operacao()
      if (resposta?.error) {
        setErro(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o checklist administrativo.'))
        return resposta
      }
      await carregar()
      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      setErro(mensagemSeguraErro(error, 'Não foi possível salvar o checklist administrativo.'))
      return { data: null, error }
    } finally {
      setSalvando(false)
    }
  }, [carregar, desligamentoAtual, empresaAtual])

  const criar = useCallback((dados) => executar(() => criarItemChecklistDesligamento({
    supabase, empresaId: empresaAtual, desligamentoId: desligamentoAtual, dados
  })), [desligamentoAtual, empresaAtual, executar, supabase])

  const atualizar = useCallback((itemId, dados) => executar(() => atualizarItemChecklistDesligamento({
    supabase, empresaId: empresaAtual, itemId, dados
  })), [empresaAtual, executar, supabase])

  const alterarEstado = useCallback((itemId, estado) => executar(() => alterarEstadoItemChecklistDesligamento({
    supabase, empresaId: empresaAtual, itemId, estado
  })), [empresaAtual, executar, supabase])

  return {
    catalogo,
    itens,
    loading,
    salvando,
    erro,
    carregar,
    criar,
    atualizar,
    alterarEstado
  }
}
