import { useState } from 'react'
import { primeiraLetraMaiuscula } from '../utils/format'
import {
  alternarNotaConcluidaService,
  atualizarNota,
  criarNota,
  enviarNotaParaLixeira,
  excluirNotaPermanentemente,
  listarNotas,
  listarNotasLixeira,
  restaurarNotaDaLixeira
} from '../services/notasService'


export function useNotas() {
  const [notas, setNotas] = useState([])
  const [notasLixeira, setNotasLixeira] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')
  const [prioridadeNota, setPrioridadeNota] = useState('normal')
  const [dataEventoNota, setDataEventoNota] = useState('')

  function resetarFormularioNota() {
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setPrioridadeNota('normal')
    setDataEventoNota('')
  }

  async function buscarNotas({ supabase, empresaAtual, avisarErro }) {
    if (!empresaAtual) return

    const { data, error } = await listarNotas(supabase, empresaAtual)

    if (error) {
      avisarErro(error)
      return
    }

    setNotas(data || [])
  }


  async function buscarNotasLixeira({ supabase, empresaAtual, avisarErro }) {
    if (!empresaAtual) return

    const { data, error } = await listarNotasLixeira(supabase, empresaAtual)

    if (error) {
      avisarErro(error)
      return
    }

    setNotasLixeira(data || [])
  }

  function abrirNovaNota({ setMenuAberto, setMenuNavegacaoAberto }) {
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    resetarFormularioNota()
    setModalNota(true)
  }

  function abrirEdicaoNota(nota) {
    setEditandoNotaId(nota.id)
    setTituloNota(nota.titulo || '')
    setConteudoNota(nota.conteudo || '')
    setPrioridadeNota(nota.prioridade || 'normal')
    setDataEventoNota(nota.data_evento || '')
    setModalNota(true)
  }

  function fecharNota() {
    setModalNota(false)
    resetarFormularioNota()
  }

  async function salvarNota({ supabase, empresaId, mostrarAviso, avisarErro, buscarNotas }) {
    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    if (!tituloNota.trim()) {
      mostrarAviso('Digite o título da nota.', 'erro')
      return
    }

    const payload = {
      titulo: primeiraLetraMaiuscula(tituloNota.trim()),
      conteudo: conteudoNota.trim(),
      prioridade: prioridadeNota || 'normal',
      data_evento: dataEventoNota || null,
      concluida: false,
      empresa_id: empresaId
    }

    let error

    if (editandoNotaId) {
      const resposta = await atualizarNota(supabase, editandoNotaId, empresaId, payload)
      error = resposta.error
    } else {
      const resposta = await criarNota(supabase, payload)
      error = resposta.error
    }

    if (error) {
      avisarErro(error)
      return
    }

    fecharNota()
    buscarNotas()
  }

  async function excluirNota({ supabase, id, empresaId, avisarErro, buscarNotas, buscarLixeira }) {
    const { error } = await enviarNotaParaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function alternarNotaConcluida({ supabase, nota, empresaId, avisarErro, buscarNotas }) {
    const { error } = await alternarNotaConcluidaService(supabase, nota, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
  }

  async function restaurarNota({ supabase, id, empresaId, avisarErro, buscarNotas, buscarLixeira }) {
    const { error } = await restaurarNotaDaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function excluirNotaDefinitivo({ supabase, nota, empresaId, avisarErro, buscarLixeira }) {
    const { error } = await excluirNotaPermanentemente(supabase, nota.id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarLixeira()
  }

  return {
    notas,
    setNotas,
    notasLixeira,
    setNotasLixeira,
    buscaNota,
    setBuscaNota,
    modalNota,
    setModalNota,
    editandoNotaId,
    setEditandoNotaId,
    tituloNota,
    setTituloNota,
    conteudoNota,
    setConteudoNota,
    prioridadeNota,
    setPrioridadeNota,
    dataEventoNota,
    setDataEventoNota,
    buscarNotas,
    buscarNotasLixeira,
    abrirNovaNota,
    abrirEdicaoNota,
    fecharNota,
    salvarNota,
    excluirNota,
    alternarNotaConcluida,
    restaurarNota,
    excluirNotaDefinitivo
  }
}
