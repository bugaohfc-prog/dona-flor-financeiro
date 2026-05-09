import { useState } from 'react'

function primeiraLetraMaiuscula(texto) {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1)
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

  function resetarFormularioNota() {
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setPrioridadeNota('normal')
    setDataEventoNota('')
  }

  async function buscarNotas({ supabase, empresaAtual, avisarErro }) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_notas')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', false)
      .order('created_at', { ascending: false })

    if (error) {
      avisarErro(error)
      return
    }

    setNotas(data || [])
  }


  async function buscarNotasLixeira({ supabase, empresaAtual, avisarErro }) {
    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_notas')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

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
      const resposta = await supabase
        .from('df_notas')
        .update(payload)
        .eq('id', editandoNotaId)
        .eq('empresa_id', empresaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_notas').insert([payload])
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
    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function alternarNotaConcluida({ supabase, nota, empresaId, avisarErro, buscarNotas }) {
    const { error } = await supabase
      .from('df_notas')
      .update({ concluida: !nota.concluida })
      .eq('id', nota.id)
      .eq('empresa_id', empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
  }

  async function restaurarNota({ supabase, id, empresaId, avisarErro, buscarNotas, buscarLixeira }) {
    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: false,
        excluido_em: null
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function excluirNotaDefinitivo({ supabase, nota, empresaId, avisarErro, buscarLixeira }) {
    const { error } = await supabase
      .from('df_notas')
      .delete()
      .eq('id', nota.id)
      .eq('empresa_id', empresaId)

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
