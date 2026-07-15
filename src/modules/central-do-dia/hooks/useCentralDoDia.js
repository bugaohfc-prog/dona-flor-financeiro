import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import { mensagemSeguraErro } from '../../../utils/session.js'
import { montarCentralDoDia } from '../domain/centralDoDiaSelectors.js'
import { listarAtividadeRecenteCentral } from '../services/centralDoDiaService.js'

export function useCentralDoDia({
  empresaId,
  filialId,
  contas,
  notas,
  alertasPessoas,
  erroPessoas,
  podeAcessarPessoas,
  podeAcessarAuditoria,
  onAtualizarContas,
  onAtualizarNotas
} = {}) {
  const [atividade, setAtividade] = useState([])
  const [carregandoAtividade, setCarregandoAtividade] = useState(false)
  const [erroAtividade, setErroAtividade] = useState(null)
  const [atualizando, setAtualizando] = useState(false)
  const requisicaoAtividadeRef = useRef(0)

  const carregarAtividade = useCallback(async ({ silencioso = false } = {}) => {
    requisicaoAtividadeRef.current += 1
    const requisicaoId = requisicaoAtividadeRef.current

    if (!empresaId || !podeAcessarAuditoria) {
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
  }, [empresaId, podeAcessarAuditoria])

  useEffect(() => {
    carregarAtividade()
    return () => {
      requisicaoAtividadeRef.current += 1
    }
  }, [carregarAtividade])

  const atualizar = useCallback(async () => {
    if (atualizando || !empresaId) return
    setAtualizando(true)

    try {
      const tarefas = []
      if (typeof onAtualizarContas === 'function') tarefas.push(Promise.resolve().then(onAtualizarContas))
      if (typeof onAtualizarNotas === 'function') tarefas.push(Promise.resolve().then(onAtualizarNotas))
      if (podeAcessarAuditoria) tarefas.push(carregarAtividade({ silencioso: true }))
      await Promise.allSettled(tarefas)
    } finally {
      setAtualizando(false)
    }
  }, [atualizando, empresaId, onAtualizarContas, onAtualizarNotas, podeAcessarAuditoria, carregarAtividade])

  const central = useMemo(() => montarCentralDoDia({
    contas,
    notas,
    alertasPessoas,
    atividade,
    filialId,
    podeAcessarPessoas,
    podeAcessarAuditoria
  }), [contas, notas, alertasPessoas, atividade, filialId, podeAcessarPessoas, podeAcessarAuditoria])

  return {
    ...central,
    carregandoAtividade,
    erroAtividade,
    erroPessoas: erroPessoas || null,
    atualizando,
    atualizar
  }
}
