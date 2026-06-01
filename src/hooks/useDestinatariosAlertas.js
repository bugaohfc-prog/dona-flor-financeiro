import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  alterarStatusDestinatarioAlerta,
  atualizarDestinatarioAlerta,
  criarDestinatarioAlerta,
  listarDestinatariosAlertas
} from '../services/destinatariosAlertasService'
import { mensagemSeguraErro } from '../utils/session'

function normalizarId(valor) {
  return String(valor || '').trim()
}

function respostaErro(error) {
  return { data: null, error }
}

export function useDestinatariosAlertas({
  empresaId,
  incluirInativos = false,
  autoCarregar = true
} = {}) {
  const empresaAtual = useMemo(() => normalizarId(empresaId), [empresaId])
  const [destinatarios, setDestinatarios] = useState([])
  const [loadingDestinatarios, setLoadingDestinatarios] = useState(false)
  const [salvandoDestinatario, setSalvandoDestinatario] = useState(false)
  const [erroDestinatarios, setErroDestinatarios] = useState('')
  const cargaRef = useRef(0)

  const definirErro = useCallback((error) => {
    setErroDestinatarios(error ? mensagemSeguraErro(error) : '')
  }, [])

  const limparDestinatarios = useCallback(() => {
    cargaRef.current += 1
    setDestinatarios([])
    setLoadingDestinatarios(false)
    definirErro(null)
  }, [definirErro])

  const carregarDestinatarios = useCallback(async (opcoes = {}) => {
    const empresa = normalizarId(opcoes.empresaId || empresaAtual)
    const cargaId = cargaRef.current + 1
    cargaRef.current = cargaId

    if (!empresa) {
      setDestinatarios([])
      setLoadingDestinatarios(false)
      definirErro(null)
      return respostaErro(new Error('Empresa ativa nao identificada para listar destinatarios.'))
    }

    if (!opcoes.silencioso) setLoadingDestinatarios(true)
    definirErro(null)

    try {
      const data = await listarDestinatariosAlertas({
        empresaId: empresa,
        incluirInativos
      })

      if (cargaRef.current !== cargaId) {
        return { data: null, error: null, ignorado: true }
      }

      setDestinatarios(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      if (cargaRef.current === cargaId) {
        setDestinatarios([])
        definirErro(error)
      }
      return respostaErro(error)
    } finally {
      if (cargaRef.current === cargaId && !opcoes.silencioso) {
        setLoadingDestinatarios(false)
      }
    }
  }, [definirErro, empresaAtual, incluirInativos])

  const criarDestinatario = useCallback(async (destinatario) => {
    if (!empresaAtual) {
      const error = new Error('Empresa ativa nao identificada para criar destinatario.')
      definirErro(error)
      return respostaErro(error)
    }

    setSalvandoDestinatario(true)
    definirErro(null)

    try {
      const data = await criarDestinatarioAlerta({ empresaId: empresaAtual, destinatario })
      await carregarDestinatarios({ empresaId: empresaAtual, silencioso: true })
      return { data, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvandoDestinatario(false)
    }
  }, [carregarDestinatarios, definirErro, empresaAtual])

  const atualizarDestinatario = useCallback(async (destinatarioId, destinatario) => {
    if (!empresaAtual) {
      const error = new Error('Empresa ativa nao identificada para editar destinatario.')
      definirErro(error)
      return respostaErro(error)
    }

    setSalvandoDestinatario(true)
    definirErro(null)

    try {
      const data = await atualizarDestinatarioAlerta({
        empresaId: empresaAtual,
        destinatarioId,
        destinatario
      })
      await carregarDestinatarios({ empresaId: empresaAtual, silencioso: true })
      return { data, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvandoDestinatario(false)
    }
  }, [carregarDestinatarios, definirErro, empresaAtual])

  const alterarStatusDestinatario = useCallback(async (destinatarioId, ativo) => {
    if (!empresaAtual) {
      const error = new Error('Empresa ativa nao identificada para alterar destinatario.')
      definirErro(error)
      return respostaErro(error)
    }

    setSalvandoDestinatario(true)
    definirErro(null)

    try {
      const data = await alterarStatusDestinatarioAlerta({
        empresaId: empresaAtual,
        destinatarioId,
        ativo
      })
      await carregarDestinatarios({ empresaId: empresaAtual, silencioso: true })
      return { data, error: null }
    } catch (error) {
      definirErro(error)
      return respostaErro(error)
    } finally {
      setSalvandoDestinatario(false)
    }
  }, [carregarDestinatarios, definirErro, empresaAtual])

  useEffect(() => {
    limparDestinatarios()

    if (!autoCarregar || !empresaAtual) return

    carregarDestinatarios({ empresaId: empresaAtual })
  }, [autoCarregar, carregarDestinatarios, empresaAtual, limparDestinatarios])

  return {
    destinatarios,
    loadingDestinatarios,
    salvandoDestinatario,
    erroDestinatarios,
    carregarDestinatarios,
    criarDestinatario,
    atualizarDestinatario,
    alterarStatusDestinatario,
    limparDestinatarios
  }
}
