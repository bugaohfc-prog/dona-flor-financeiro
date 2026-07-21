import { useEffect, useMemo, useState } from 'react'
import { useCallback, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { carregarFluxoCaixaRealizadoV1 } from '../../services/fluxo-caixa/fluxoCaixaService.js'
import {
  agregarFluxoCaixaMensal,
  agregarSaidasPorRubrica,
  anoAtual,
  calcularDiagnosticoRubricas,
  montarMovimentosFluxoCaixa
} from '../../utils/fluxo-caixa/fluxoCaixaUtils.js'

export function useFluxoCaixaV1({ empresaId }) {
  const [ano, setAno] = useState(String(anoAtual()))
  const [filialId, setFilialId] = useState('')
  const [dadosOrigem, setDadosOrigem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const consultaRef = useRef(0)
  const montadoRef = useRef(true)

  const carregar = useCallback(async () => {
    const token = ++consultaRef.current
    if (!empresaId) {
      setDadosOrigem(null)
      setErro('Empresa ativa n\u00e3o selecionada.')
      return { data: null, error: new Error('Empresa ativa nao selecionada.') }
    }

    setLoading(true)
    setErro('')
    const resposta = await carregarFluxoCaixaRealizadoV1(supabase, empresaId, ano)
    if (!montadoRef.current || token !== consultaRef.current) return { ...resposta, obsoleta: true }
    if (resposta.error) {
      setErro(resposta.error.message || 'N\u00e3o foi poss\u00edvel carregar o fluxo de caixa.')
      setDadosOrigem(null)
    } else {
      setDadosOrigem(resposta.data)
    }
    setLoading(false)
    return resposta
  }, [ano, empresaId])

  useEffect(() => {
    carregar()
    return () => { consultaRef.current += 1 }
  }, [carregar])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      consultaRef.current += 1
    }
  }, [])

  const filiais = dadosOrigem?.filiais || []
  const filiaisPorId = useMemo(() => new Map(filiais.map((filial) => [filial.id, filial])), [filiais])

  const movimentos = useMemo(() => {
    if (!dadosOrigem) return []
    return montarMovimentosFluxoCaixa({
      contasPagas: dadosOrigem.contasPagas,
      pagamentosParciais: dadosOrigem.pagamentosParciais,
      receitas: dadosOrigem.receitas,
      contasPorId: dadosOrigem.contasPorId,
      filiaisPorId,
      filialId,
      ano
    })
  }, [ano, dadosOrigem, filialId, filiaisPorId])

  const resultado = useMemo(() => agregarFluxoCaixaMensal(movimentos), [movimentos])
  const rubricas = useMemo(() => agregarSaidasPorRubrica(movimentos), [movimentos])
  const diagnosticoRubricas = useMemo(
    () => calcularDiagnosticoRubricas(movimentos, rubricas),
    [movimentos, rubricas]
  )

  return {
    ano,
    setAno,
    filialId,
    setFilialId,
    filiais,
    loading,
    erro,
    recarregar: carregar,
    movimentos,
    resultado,
    rubricas,
    diagnosticoRubricas
  }
}
