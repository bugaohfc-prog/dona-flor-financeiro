import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { carregarFluxoCaixaRealizadoV1 } from '../../services/fluxo-caixa/fluxoCaixaService'
import {
  agregarFluxoCaixaMensal,
  agregarSaidasPorRubrica,
  anoAtual,
  calcularDiagnosticoRubricas,
  montarMovimentosFluxoCaixa
} from '../../utils/fluxo-caixa/fluxoCaixaUtils'

export function useFluxoCaixaV1({ empresaId }) {
  const [ano, setAno] = useState(String(anoAtual()))
  const [filialId, setFilialId] = useState('')
  const [dadosOrigem, setDadosOrigem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    if (!empresaId) {
      setDadosOrigem(null)
      setErro('Empresa ativa não selecionada.')
      return
    }

    setLoading(true)
    setErro('')
    const resposta = await carregarFluxoCaixaRealizadoV1(supabase, empresaId, ano)
    if (resposta.error) {
      setErro(resposta.error.message || 'Não foi possível carregar o fluxo de caixa.')
      setDadosOrigem(null)
    } else {
      setDadosOrigem(resposta.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [empresaId, ano])

  const filiais = dadosOrigem?.filiais || []
  const filiaisPorId = useMemo(() => new Map(filiais.map((filial) => [filial.id, filial])), [filiais])

  const movimentos = useMemo(() => {
    if (!dadosOrigem) return []
    return montarMovimentosFluxoCaixa({
      contasPagas: dadosOrigem.contasPagas,
      pagamentosParciais: dadosOrigem.pagamentosParciais,
      contasPorId: dadosOrigem.contasPorId,
      filiaisPorId,
      filialId
    })
  }, [dadosOrigem, filialId, filiaisPorId])

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
