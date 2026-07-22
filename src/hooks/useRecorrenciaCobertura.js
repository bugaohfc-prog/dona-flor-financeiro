import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { consultarCoberturaRecorrencias } from '../services/recorrenciaCoberturaService.js'
import { calcularCoberturaRecorrencias } from '../utils/recorrenciaCobertura.js'
import { criarControleConsultaRelatorio } from '../utils/relatoriosFinanceiros.js'

export function useRecorrenciaCobertura({ empresaId, horizonte }) {
  const controleRef = useRef(criarControleConsultaRelatorio())
  const montadoRef = useRef(true)
  const emAndamentoRef = useRef(null)
  const [estado, setEstado] = useState({ resultado: null, carregando: false, erro: null, carregado: false })
  const chave = useMemo(() => JSON.stringify({ empresaId, inicio: horizonte?.inicio, fim: horizonte?.fim }), [empresaId, horizonte?.fim, horizonte?.inicio])

  useEffect(() => () => {
    montadoRef.current = false
    controleRef.current.invalidar()
  }, [])

  const consultar = useCallback(async () => {
    if (!empresaId || !horizonte?.inicio || !horizonte?.fim) {
      const error = new Error('Informe empresa e horizonte válidos.')
      if (montadoRef.current) setEstado({ resultado: null, carregando: false, erro: error, carregado: false })
      return { data: null, error }
    }
    if (emAndamentoRef.current?.chave === chave) return emAndamentoRef.current.promessa
    const token = controleRef.current.iniciar()
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }))
    const promessa = consultarCoberturaRecorrencias(supabase, { empresaId, inicio: horizonte.inicio, fim: horizonte.fim })
    emAndamentoRef.current = { chave, promessa }
    let resposta
    try {
      resposta = await promessa
    } catch (error) {
      resposta = { data: null, error }
    }
    if (emAndamentoRef.current?.promessa === promessa) emAndamentoRef.current = null
    if (!montadoRef.current || !controleRef.current.estaAtual(token)) return { ...resposta, obsoleta: true }
    if (resposta.error) setEstado({ resultado: null, carregando: false, erro: resposta.error, carregado: false })
    else setEstado({ resultado: calcularCoberturaRecorrencias({ ...resposta.data, horizonte }), carregando: false, erro: null, carregado: true })
    return resposta
  }, [chave, empresaId, horizonte])

  useEffect(() => {
    const timer = setTimeout(consultar, 0)
    return () => {
      clearTimeout(timer)
      controleRef.current.invalidar()
    }
  }, [consultar])

  return { ...estado, consultar }
}
