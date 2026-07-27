import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { consultarCoberturaRecorrencias } from '../services/recorrenciaCoberturaService.js'
import { calcularCoberturaRecorrencias } from '../utils/recorrenciaCobertura.js'
import {
  concluirAtualizacaoCobertura,
  criarEstadoCobertura,
  falharAtualizacaoCobertura,
  iniciarAtualizacaoCobertura
} from '../utils/recorrenciaCoberturaEstado.js'
import { criarControleConsultaRelatorio } from '../utils/relatoriosFinanceiros.js'

export function useRecorrenciaCobertura({ empresaId, horizonte }) {
  const controleRef = useRef(criarControleConsultaRelatorio())
  const montadoRef = useRef(true)
  const emAndamentoRef = useRef(null)
  const [estado, setEstado] = useState(criarEstadoCobertura)
  const chave = useMemo(() => JSON.stringify({ empresaId, inicio: horizonte?.inicio, fim: horizonte?.fim }), [empresaId, horizonte?.fim, horizonte?.inicio])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      controleRef.current.invalidar()
    }
  }, [])

  const consultar = useCallback(async () => {
    if (!empresaId || !horizonte?.inicio || !horizonte?.fim) {
      const error = new Error('Informe empresa e horizonte válidos.')
      if (montadoRef.current) setEstado({ ...criarEstadoCobertura(), erro: error })
      return { data: null, error }
    }
    if (emAndamentoRef.current?.chave === chave) return emAndamentoRef.current.promessa
    const token = controleRef.current.iniciar()
    setEstado((atual) => iniciarAtualizacaoCobertura(atual, empresaId))
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
    if (resposta.error) {
      setEstado((atual) => falharAtualizacaoCobertura(atual, empresaId, resposta.error))
    } else {
      const resultado = {
        ...calcularCoberturaRecorrencias({ ...resposta.data, horizonte }),
        series: resposta.data.series || [],
        horizonte: { ...horizonte }
      }
      setEstado(concluirAtualizacaoCobertura(empresaId, resultado))
    }
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
