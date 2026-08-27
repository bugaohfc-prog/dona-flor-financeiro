import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase as supabasePadrao } from '../lib/supabase'
import {
  alterarAtividadeItemCatalogoChecklistDesligamento,
  criarItemCatalogoChecklistDesligamento,
  editarItemCatalogoChecklistDesligamento,
  listarCatalogoChecklistDesligamento
} from '../services/funcionariosChecklistDesligamentoService'
import { mensagemSeguraErro } from '../utils/session'

export function useFuncionariosChecklistCatalogo({ empresaId, habilitado = false, supabase = supabasePadrao } = {}) {
  const empresaAtual = useMemo(() => String(empresaId || '').trim(), [empresaId])
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const cargaRef = useRef(0)

  const carregar = useCallback(async () => {
    const carga = ++cargaRef.current
    if (!habilitado || !empresaAtual) {
      setItens([])
      setErro(null)
      setLoading(false)
      return { data: [], error: null }
    }
    setLoading(true)
    setErro(null)
    try {
      const resposta = await listarCatalogoChecklistDesligamento({
        supabase, empresaId: empresaAtual, somenteAtivos: false
      })
      if (carga !== cargaRef.current) return { data: null, error: null, ignorado: true }
      if (resposta.error) {
        setItens([])
        setErro(mensagemSeguraErro(resposta.error, 'Não foi possível carregar os itens do checklist.'))
        return resposta
      }
      const dados = resposta.data || []
      setItens(dados)
      return { data: dados, error: null }
    } catch (error) {
      if (carga === cargaRef.current) {
        setItens([])
        setErro(mensagemSeguraErro(error, 'Não foi possível carregar os itens do checklist.'))
      }
      return { data: null, error }
    } finally {
      if (carga === cargaRef.current) setLoading(false)
    }
  }, [empresaAtual, habilitado, supabase])

  useEffect(() => {
    carregar()
  }, [carregar])

  const executar = useCallback(async (operacao) => {
    if (!habilitado || !empresaAtual) return { data: null, error: new Error('Sem permissão para administrar o catálogo.') }
    setSalvando(true)
    setErro(null)
    try {
      const resposta = await operacao()
      if (resposta?.error) {
        setErro(mensagemSeguraErro(resposta.error, 'Não foi possível salvar o item do checklist.'))
        return resposta
      }
      await carregar()
      return { data: resposta?.data ?? null, error: null }
    } catch (error) {
      setErro(mensagemSeguraErro(error, 'Não foi possível salvar o item do checklist.'))
      return { data: null, error }
    } finally {
      setSalvando(false)
    }
  }, [carregar, empresaAtual, habilitado])

  return {
    itens,
    loading,
    salvando,
    erro,
    carregar,
    criar: ({ titulo, descricaoOperacional }) => executar(() => criarItemCatalogoChecklistDesligamento({ supabase, empresaId: empresaAtual, titulo, descricaoOperacional })),
    editar: (catalogoItemId, { titulo, descricaoOperacional }) => executar(() => editarItemCatalogoChecklistDesligamento({ supabase, empresaId: empresaAtual, catalogoItemId, titulo, descricaoOperacional })),
    alterarAtividade: (catalogoItemId, ativo) => executar(() => alterarAtividadeItemCatalogoChecklistDesligamento({ supabase, empresaId: empresaAtual, catalogoItemId, ativo }))
  }
}
