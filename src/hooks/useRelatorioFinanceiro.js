import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { consultarRelatorioFinanceiro } from '../services/relatoriosFinanceirosService.js'
import { criarControleConsultaRelatorio } from '../utils/relatoriosFinanceiros.js'

export function useRelatorioFinanceiro({ empresaId, criterios, atrasoBusca = 300, automatico = true }) {
  const controleRef = useRef(criarControleConsultaRelatorio())
  const montadoRef = useRef(true)
  const [estado, setEstado] = useState({ dados: null, carregando: false, erro: null, carregado: false })
  const chaveCriterios = useMemo(() => JSON.stringify({ ...criterios, empresaId }), [criterios, empresaId])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      controleRef.current.invalidar()
    }
  }, [])

  const consultar = useCallback(async () => {
    const token = controleRef.current.iniciar()
    if (!empresaId) {
      if (montadoRef.current && controleRef.current.estaAtual(token)) {
        setEstado({ dados: null, carregando: false, erro: new Error('Empresa ativa nao selecionada.'), carregado: false })
      }
      return { data: null, error: new Error('Empresa ativa nao selecionada.') }
    }

    setEstado((atual) => ({ ...atual, carregando: true, erro: null }))
    const resposta = await consultarRelatorioFinanceiro(supabase, { ...criterios, empresaId })
    if (!montadoRef.current || !controleRef.current.estaAtual(token)) return { ...resposta, obsoleta: true }
    if (resposta.error) {
      setEstado({ dados: null, carregando: false, erro: resposta.error, carregado: false })
    } else {
      setEstado({ dados: resposta.data, carregando: false, erro: null, carregado: true })
    }
    return resposta
  }, [chaveCriterios, empresaId])

  useEffect(() => {
    if (!automatico) return undefined
    const timer = setTimeout(() => consultar(), String(criterios?.busca || '').trim() ? atrasoBusca : 0)
    return () => {
      clearTimeout(timer)
      controleRef.current.invalidar()
    }
  }, [automatico, atrasoBusca, chaveCriterios, consultar])

  return {
    ...estado,
    registros: estado.dados?.registros || [],
    resumo: estado.dados?.resumo || null,
    consultar,
    invalidar: () => controleRef.current.invalidar()
  }
}
