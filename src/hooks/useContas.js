import { useState } from 'react'

function dataLocal(data) {
  if (!data) return null
  const partes = String(data).slice(0, 10).split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null
  return new Date(partes[0], partes[1] - 1, partes[2])
}

function montarDataRecorrente(ano, mes, dia) {
  const ultimoDiaMes = new Date(ano, mes, 0).getDate()
  const diaSeguro = Math.min(Number(dia || 1), ultimoDiaMes)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(diaSeguro).padStart(2, '0')}`
}

function deveGerarRecorrenciaNoMes(recorrencia, ano, mes) {
  if (!recorrencia?.ativo) return false
  if ((recorrencia.frequencia || recorrencia.tipo_recorrencia || 'mensal') !== 'mensal') return false

  const inicio = recorrencia.data_inicio ? dataLocal(recorrencia.data_inicio) : null
  if (!inicio) return true

  const primeiroDiaMes = new Date(ano, mes - 1, 1)
  const ultimoDiaMes = new Date(ano, mes, 0)

  return inicio <= ultimoDiaMes && primeiroDiaMes >= new Date(inicio.getFullYear(), inicio.getMonth(), 1)
}

export function useContas() {
  const [contas, setContas] = useState([])
  const [contasLixeira, setContasLixeira] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalConta, setModalConta] = useState(false)
  const [editandoContaId, setEditandoContaId] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')
  const [observacaoConta, setObservacaoConta] = useState('')
  const [contaWhatsapp, setContaWhatsapp] = useState(false)
  const [contaEmail, setContaEmail] = useState(false)
  const [contaPush, setContaPush] = useState(false)
  const [contaDiasAviso, setContaDiasAviso] = useState('1')
  const [contaRecorrente, setContaRecorrente] = useState(false)
  const [tipoRecorrencia, setTipoRecorrencia] = useState('mensal')
  const [diaVencimentoRecorrencia, setDiaVencimentoRecorrencia] = useState('')
  const [recorrenciaContaId, setRecorrenciaContaId] = useState(null)

  function resetarFormularioConta() {
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setObservacaoConta('')
    setContaWhatsapp(false)
    setContaEmail(false)
    setContaPush(false)
    setContaDiasAviso('1')
    setContaRecorrente(false)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia('')
    setRecorrenciaContaId(null)
  }

  async function garantirContasRecorrentesDoMes({
    supabase,
    empresaAtual,
    contasAtuais,
    configWhatsapp,
    configEmail,
    configPush,
    diasAlertaContas,
    diasAvisoPadrao
  }) {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth() + 1

    const { data: recorrentes, error } = await supabase
      .from('df_contas_recorrentes')
      .select('*')
      .eq('empresa_id', empresaAtual)
      .eq('ativo', true)

    if (error) {
      console.warn('Não foi possível carregar contas recorrentes:', error.message)
      return contasAtuais
    }

    const novasContas = []

    ;(recorrentes || []).forEach((recorrencia) => {
      if (!deveGerarRecorrenciaNoMes(recorrencia, ano, mes)) return

      const dataGerada = montarDataRecorrente(ano, mes, recorrencia.dia_vencimento)

      const jaExiste = contasAtuais.some((conta) =>
        String(conta.descricao || '').trim().toLowerCase() === String(recorrencia.descricao || '').trim().toLowerCase()
        && conta.data_vencimento === dataGerada
      )

      if (jaExiste) return

      novasContas.push({
        empresa_id: empresaAtual,
        descricao: recorrencia.descricao,
        valor: Number(recorrencia.valor || 0),
        data_vencimento: dataGerada,
        vencimento: dataGerada,
        centro_custo_id: recorrencia.centro_custo_id || null,
        observacao: recorrencia.observacao || null,
        recorrencia_id: recorrencia.id,
        status: 'pendente',
        excluido: false,
        enviar_whatsapp: configWhatsapp,
        enviar_email: configEmail,
        enviar_push: configPush,
        dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1)
      })
    })

    if (novasContas.length === 0) return contasAtuais

    const { data: contasCriadas, error: erroInsert } = await supabase
      .from('df_contas')
      .insert(novasContas)
      .select('*, df_centros_custo(nome)')

    if (erroInsert) {
      console.warn('Não foi possível gerar contas recorrentes:', erroInsert.message)
      return contasAtuais
    }

    return [...contasAtuais, ...(contasCriadas || [])].sort((a, b) =>
      String(a.data_vencimento || '').localeCompare(String(b.data_vencimento || ''))
    )
  }

  async function buscarContas(contexto) {
    const {
      supabase,
      empresaAtual,
      avisarErro,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao
    } = contexto

    if (!empresaAtual) return

    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('empresa_id', empresaAtual)
      .eq('excluido', false)
      .order('data_vencimento')

    if (error) {
      avisarErro(error)
      return
    }

    const contasAtuais = data || []
    const contasComRecorrencias = await garantirContasRecorrentesDoMes({
      supabase,
      empresaAtual,
      contasAtuais,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao
    })
    setContas(contasComRecorrencias)
  }

  function abrirNovaConta(contexto) {
    const { setMenuAberto, setMenuNavegacaoAberto, configWhatsapp, configEmail, configPush, diasAvisoPadrao } = contexto
    setMenuAberto(false)
    setMenuNavegacaoAberto(false)
    resetarFormularioConta()
    setContaWhatsapp(configWhatsapp)
    setContaEmail(configEmail)
    setContaPush(configPush)
    setContaDiasAviso(String(diasAvisoPadrao || 1))
    setModalConta(true)
  }

  async function abrirEdicaoConta(contexto) {
    const { conta, supabase, empresaId, diasAvisoPadrao, formatarDataParaBanco } = contexto
    const dataBanco = formatarDataParaBanco(conta.data_vencimento || '')
    const diaPadrao = dataBanco ? String(Number(String(dataBanco).slice(8, 10))) : ''

    setEditandoContaId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setDataVencimento(conta.data_vencimento || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setObservacaoConta(conta.observacao || '')
    setContaWhatsapp(conta.enviar_whatsapp ?? false)
    setContaEmail(conta.enviar_email ?? false)
    setContaPush(conta.enviar_push ?? false)
    setContaDiasAviso(String(conta.dias_aviso ?? diasAvisoPadrao ?? 1))
    setContaRecorrente(Boolean(conta.recorrencia_id))
    setRecorrenciaContaId(conta.recorrencia_id || null)
    setTipoRecorrencia('mensal')
    setDiaVencimentoRecorrencia(diaPadrao)
    setModalConta(true)

    if (conta.recorrencia_id) {
      const { data, error } = await supabase
        .from('df_contas_recorrentes')
        .select('*')
        .eq('id', conta.recorrencia_id)
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (!error && data) {
        setTipoRecorrencia(data.frequencia || data.tipo_recorrencia || 'mensal')
        setDiaVencimentoRecorrencia(String(data.dia_vencimento || diaPadrao || ''))
      }
    }
  }

  function fecharConta() {
    setModalConta(false)
    resetarFormularioConta()
  }

  async function salvarConta(contexto) {
    const {
      supabase,
      empresaId,
      mostrarAviso,
      configWhatsapp,
      configEmail,
      configPush,
      diasAlertaContas,
      diasAvisoPadrao,
      primeiraLetraMaiuscula,
      converterValor,
      formatarDataParaBanco,
      erroEhSessaoExpirada,
      limparEstadoAutenticacao,
      setUsuarioLogado,
      buscarContas,
      fecharConta
    } = contexto

    if (!empresaId) {
      mostrarAviso('Usuário sem empresa vinculada.', 'erro')
      return
    }

    if (!descricao || !valor || !dataVencimento) {
      mostrarAviso('Preencha descrição, valor e vencimento.', 'erro')
      return
    }

    const dataBanco = formatarDataParaBanco(dataVencimento)
    const descricaoFormatada = primeiraLetraMaiuscula(descricao.trim())
    const valorConvertido = converterValor(valor)

    const payloadBaseConta = {
      descricao: descricaoFormatada,
      valor: valorConvertido,
      data_vencimento: dataBanco,
      vencimento: dataBanco,
      centro_custo_id: centroCustoId || null,
      observacao: observacaoConta.trim() || null,
      enviar_whatsapp: configWhatsapp,
      enviar_email: configEmail,
      enviar_push: configPush,
      dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1),
      empresa_id: empresaId
    }

    const criarIdRecorrencia = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
      }
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }

    const montarPayloadRecorrencia = () => {
      const diaRecorrencia = Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10))

      if (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31) {
        mostrarAviso('Informe um dia válido para a recorrência.', 'erro')
        return null
      }

      return {
        empresa_id: empresaId,
        descricao: descricaoFormatada,
        valor: valorConvertido,
        centro_custo_id: centroCustoId || null,
        observacao: observacaoConta.trim() || null,
        frequencia: tipoRecorrencia || 'mensal',
        dia_vencimento: diaRecorrencia,
        data_inicio: dataBanco,
        ativo: true
      }
    }

    try {
      let error = null

      if (editandoContaId) {
        const payloadConta = { ...payloadBaseConta }

        if (contaRecorrente) {
          const payloadRecorrencia = montarPayloadRecorrencia()
          if (!payloadRecorrencia) return

          if (recorrenciaContaId) {
            const { error: erroRecorrencia } = await supabase
              .from('df_contas_recorrentes')
              .update(payloadRecorrencia)
              .eq('id', recorrenciaContaId)
              .eq('empresa_id', empresaId)

            if (erroRecorrencia) {
              mostrarAviso('A conta não foi salva porque a recorrência não pôde ser atualizada: ' + erroRecorrencia.message, 'erro')
              return
            }

            payloadConta.recorrencia_id = recorrenciaContaId
          } else {
            const novaRecorrenciaId = criarIdRecorrencia()
            const { error: erroRecorrencia } = await supabase
              .from('df_contas_recorrentes')
              .insert([{ ...payloadRecorrencia, id: novaRecorrenciaId }])

            if (erroRecorrencia) {
              mostrarAviso('A conta não foi salva porque a recorrência não pôde ser criada: ' + erroRecorrencia.message, 'erro')
              return
            }

            payloadConta.recorrencia_id = novaRecorrenciaId
          }
        } else {
          payloadConta.recorrencia_id = null

          if (recorrenciaContaId) {
            const { error: erroDesativarRecorrencia } = await supabase
              .from('df_contas_recorrentes')
              .update({ ativo: false })
              .eq('id', recorrenciaContaId)
              .eq('empresa_id', empresaId)

            if (erroDesativarRecorrencia) {
              mostrarAviso('A conta não foi salva porque a recorrência não pôde ser desativada: ' + erroDesativarRecorrencia.message, 'erro')
              return
            }
          }
        }

        const resposta = await supabase
          .from('df_contas')
          .update(payloadConta)
          .eq('id', editandoContaId)
          .eq('empresa_id', empresaId)

        error = resposta.error
      } else {
        const payloadConta = { ...payloadBaseConta, status: 'pendente', excluido: false }

        if (contaRecorrente) {
          const payloadRecorrencia = montarPayloadRecorrencia()
          if (!payloadRecorrencia) return

          const novaRecorrenciaId = criarIdRecorrencia()
          const { error: erroRecorrencia } = await supabase
            .from('df_contas_recorrentes')
            .insert([{ ...payloadRecorrencia, id: novaRecorrenciaId }])

          if (erroRecorrencia) {
            mostrarAviso('A conta não foi salva porque a recorrência não pôde ser criada: ' + erroRecorrencia.message, 'erro')
            return
          }

          payloadConta.recorrencia_id = novaRecorrenciaId
        }

        const resposta = await supabase
          .from('df_contas')
          .insert([payloadConta])

        error = resposta.error
      }

      if (error) {
        if (erroEhSessaoExpirada(error)) {
          await supabase.auth.signOut()
          limparEstadoAutenticacao()
          setUsuarioLogado(null)
          mostrarAviso('Sua sessão expirou. Faça login novamente.', 'erro')
        } else {
          mostrarAviso(error.message, 'erro')
        }
        return
      }

      fecharConta()
      buscarContas()
    } catch (erro) {
      mostrarAviso(erro?.message || 'Não foi possível salvar a conta.', 'erro')
    }
  }

  async function marcarComoPago(contexto) {
    const { supabase, id, empresaId, buscarContas } = contexto
    await supabase.from('df_contas').update({ status: 'pago' }).eq('id', id).eq('empresa_id', empresaId)
    buscarContas()
  }

  async function voltarParaPendente(contexto) {
    const { supabase, id, empresaId, buscarContas } = contexto
    await supabase.from('df_contas').update({ status: 'pendente' }).eq('id', id).eq('empresa_id', empresaId)
    buscarContas()
  }

  async function excluirConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, buscarLixeira } = contexto
    const { error } = await supabase
      .from('df_contas')
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

    buscarContas()
    buscarLixeira()
  }

  return {
    contas,
    setContas,
    contasLixeira,
    setContasLixeira,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroCentro,
    setFiltroCentro,
    filtroMes,
    setFiltroMes,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    loading,
    setLoading,
    modalConta,
    setModalConta,
    editandoContaId,
    setEditandoContaId,
    descricao,
    setDescricao,
    valor,
    setValor,
    dataVencimento,
    setDataVencimento,
    centroCustoId,
    setCentroCustoId,
    observacaoConta,
    setObservacaoConta,
    contaWhatsapp,
    setContaWhatsapp,
    contaEmail,
    setContaEmail,
    contaPush,
    setContaPush,
    contaDiasAviso,
    setContaDiasAviso,
    contaRecorrente,
    setContaRecorrente,
    tipoRecorrencia,
    setTipoRecorrencia,
    diaVencimentoRecorrencia,
    setDiaVencimentoRecorrencia,
    recorrenciaContaId,
    setRecorrenciaContaId,
    buscarContas,
    abrirNovaConta,
    abrirEdicaoConta,
    fecharConta,
    salvarConta,
    marcarComoPago,
    voltarParaPendente,
    excluirConta
  }
}
