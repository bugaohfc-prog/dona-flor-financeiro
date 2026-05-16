import { useState } from 'react'
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
import { primeiraLetraMaiuscula } from '../utils/format'

function assinaturaListaNotas(itens = []) {
  return itens
    .map((item) => `${item.id || ''}:${item.excluido_em || ''}:${item.updated_at || ''}:${item.titulo || ''}`)
    .join('|')
}

function manterListaSeNaoMudou(setLista, novaLista = []) {
  setLista((listaAtual = []) => (
    assinaturaListaNotas(listaAtual) === assinaturaListaNotas(novaLista)
      ? listaAtual
      : novaLista
  ))
}

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
  const [filialNotaId, setFilialNotaId] = useState('')

  function resetarFormularioNota() {
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setPrioridadeNota('normal')
    setDataEventoNota('')
    setFilialNotaId('')
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

    manterListaSeNaoMudou(setNotasLixeira, data || [])
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
    setFilialNotaId(nota.filial_id || '')
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
      empresa_id: empresaId,
      filial_id: filialNotaId || null
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
    await buscarNotas()
    mostrarAviso(editandoNotaId ? 'Nota atualizada com sucesso.' : 'Nota criada com sucesso.', 'sucesso')
  }

  async function excluirNota({ supabase, id, empresaId, avisarErro, buscarNotas, buscarLixeira, mostrarAviso }) {
    const { error } = await enviarNotaParaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await Promise.all([buscarNotas(), buscarLixeira()])
    mostrarAviso?.('Nota enviada para a lixeira.', 'sucesso')
  }

  async function alternarNotaConcluida({ supabase, nota, empresaId, avisarErro, buscarNotas, mostrarAviso }) {
    const { error } = await alternarNotaConcluidaService(supabase, nota, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarNotas()
    mostrarAviso?.(nota.concluida ? 'Nota reaberta.' : 'Nota concluída.', 'sucesso')
  }

  async function restaurarNota({ supabase, id, empresaId, avisarErro, buscarNotas, buscarLixeira, mostrarAviso }) {
    const { error } = await restaurarNotaDaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await Promise.all([buscarNotas(), buscarLixeira()])
    mostrarAviso?.('Nota restaurada com sucesso.', 'sucesso')
  }

  async function excluirNotaDefinitivo({ supabase, nota, empresaId, avisarErro, buscarLixeira, mostrarAviso }) {
    const { error } = await excluirNotaPermanentemente(supabase, nota.id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarLixeira()
    mostrarAviso?.('Nota excluída definitivamente.', 'sucesso')
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
    filialNotaId,
    setFilialNotaId,
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
