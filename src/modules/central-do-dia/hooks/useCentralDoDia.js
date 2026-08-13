import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import { mensagemSeguraErro } from '../../../utils/session.js'
import { montarBaseOperacional } from '../domain/centralDoDiaRules.js'
import { deveCarregarAtividadeCentral, selecionarCentralLegada, selecionarResumoDashboard } from '../domain/centralDoDiaSelectors.js'
import { listarAtividadeRecenteCentral } from '../services/centralDoDiaService.js'
import { executarAtualizacaoCentral } from '../services/centralDoDiaRefresh.js'
export function useCentralDoDia({
  empresaId,
  filialId,
  contas,
  notas,
  itensPessoasDetalhados,
  erroPessoas,
  podeAcessarPessoas,
  podeAcessarAuditoria,
  modoCompacto = false,
  onAtualizarContas,
  onAtualizarNotas,
  onAtualizarPessoas
} = {}) {
  const [atividade, setAtividade] = useState([])
  const [carregandoAtividade, setCarregandoAtividade] = useState(false)
  const [erroAtividade, setErroAtividade] = useState(null)
  const [atualizando, setAtualizando] = useState(false)
  const requisicaoAtividadeRef = useRef(0)
  const atualizandoRef = useRef(false)
  const montadoRef = useRef(true)

  const carregarAtividade = useCallback(async ({ silencioso = false } = {}) => {
    requisicaoAtividadeRef.current += 1
    const requisicaoId = requisicaoAtividadeRef.current

    if (!deveCarregarAtividadeCentral({ empresaId, podeAcessarAuditoria, modoCompacto })) {
      setAtividade([])
      setErroAtividade(null)
      setCarregandoAtividade(false)
      return { data: [], error: null }
    }

    if (!silencioso) setCarregandoAtividade(true)
    setErroAtividade(null)

    let resposta
    try {
      resposta = await listarAtividadeRecenteCentral({ supabase, empresaId })
    } catch (error) {
      resposta = { data: [], error }
    }
    if (requisicaoAtividadeRef.current !== requisicaoId) return resposta

    if (resposta.error) {
      setErroAtividade(mensagemSeguraErro(resposta.error, 'A atividade recente está temporariamente indisponível.'))
      setAtividade([])
    } else {
      setAtividade(resposta.data || [])
    }

    setCarregandoAtividade(false)
    return resposta
  }, [empresaId, podeAcessarAuditoria, modoCompacto])

  useEffect(() => {
    if (!deveCarregarAtividadeCentral({ empresaId, podeAcessarAuditoria, modoCompacto })) {
      requisicaoAtividadeRef.current += 1
      setAtividade([])
      setErroAtividade(null)
      setCarregandoAtividade(false)
      return undefined
    }

    carregarAtividade()
    return () => {
      requisicaoAtividadeRef.current += 1
    }
  }, [carregarAtividade, empresaId, podeAcessarAuditoria, modoCompacto])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
      atualizandoRef.current = false
    }
  }, [])

  const atualizar = useCallback(async () => {
    if (atualizandoRef.current || !empresaId) return
    atualizandoRef.current = true
    setAtualizando(true)

    try {
      const tarefas = [onAtualizarContas, onAtualizarNotas, onAtualizarPessoas]
      if (deveCarregarAtividadeCentral({ empresaId, podeAcessarAuditoria, modoCompacto })) {
        tarefas.push(() => carregarAtividade({ silencioso: true }))
      }
      await executarAtualizacaoCentral(tarefas)
    } finally {
      atualizandoRef.current = false
      if (montadoRef.current) setAtualizando(false)
    }
  }, [empresaId, onAtualizarContas, onAtualizarNotas, onAtualizarPessoas, podeAcessarAuditoria, modoCompacto, carregarAtividade])

  const base = useMemo(() => montarBaseOperacional({
    contas,
    notas,
    itensPessoasDetalhados,
    atividade: modoCompacto ? [] : atividade,
    filialId,
    podeAcessarPessoas,
    podeAcessarAuditoria: podeAcessarAuditoria && !modoCompacto
  }), [contas, notas, itensPessoasDetalhados, atividade, filialId, podeAcessarPessoas, podeAcessarAuditoria, modoCompacto])

  const central = useMemo(() => selecionarCentralLegada(base), [base])
  const resumoDashboard = useMemo(() => selecionarResumoDashboard(base), [base])

  return {
    ...central,
    resumoDashboard,
    carregandoAtividade,
    erroAtividade,
    erroPessoas: erroPessoas || null,
    atualizando,
    atualizar
  }
}
