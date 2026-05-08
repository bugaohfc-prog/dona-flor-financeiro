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


  async function localizarRecorrenciaDaConta({ supabase, empresaId, conta, dataBanco, descricaoConta }) {
    if (!supabase || !empresaId || !conta) return null

    if (conta.recorrencia_id) {
      const { data, error } = await supabase
        .from('df_contas_recorrentes')
        .select('*')
        .eq('id', conta.recorrencia_id)
        .eq('empresa_id', empresaId)
        .maybeSingle()

      if (!error && data) return data
    }

    const diaReferencia = Number(String(dataBanco || conta.data_vencimento || '').slice(8, 10))
    if (!diaReferencia) return null

    const { data, error } = await supabase
      .from('df_contas_recorrentes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .eq('dia_vencimento', diaReferencia)
      .order('created_at', { ascending: false })

    if (error || !Array.isArray(data)) return null

    const descricaoNormalizada = String(descricaoConta || conta.descricao || '').trim().toLowerCase()
    const valorConta = Number(conta.valor || 0)

    return data.find((recorrencia) => {
      const mesmaDescricao = String(recorrencia.descricao || '').trim().toLowerCase() === descricaoNormalizada
      const mesmoValor = Number(recorrencia.valor || 0) === valorConta
      return mesmaDescricao && mesmoValor
    }) || null
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

    const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
      supabase,
      empresaId,
      conta,
      dataBanco,
      descricaoConta: conta.descricao
    })

    if (recorrenciaEncontrada) {
      setContaRecorrente(true)
      setRecorrenciaContaId(recorrenciaEncontrada.id)
      setTipoRecorrencia(recorrenciaEncontrada.frequencia || recorrenciaEncontrada.tipo_recorrencia || 'mensal')
      setDiaVencimentoRecorrencia(String(recorrenciaEncontrada.dia_vencimento || diaPadrao || ''))

      if (!conta.recorrencia_id && recorrenciaEncontrada.id) {
        await supabase
          .from('df_contas')
          .update({ recorrencia_id: recorrenciaEncontrada.id })
          .eq('id', conta.id)
          .eq('empresa_id', empresaId)
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

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: formatarDataParaBanco(dataVencimento),
      vencimento: formatarDataParaBanco(dataVencimento),
      centro_custo_id: centroCustoId || null,
      observacao: observacaoConta.trim() || null,
      enviar_whatsapp: configWhatsapp,
      enviar_email: configEmail,
      enviar_push: configPush,
      dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1),
      empresa_id: empresaId
    }

    let error

    if (editandoContaId) {
      const resposta = await supabase.from('df_contas').update(payload).eq('id', editandoContaId).eq('empresa_id', empresaId)
      error = resposta.error

      if (!error) {
        const dataBanco = formatarDataParaBanco(dataVencimento)
        const diaRecorrencia = Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10))

        if (contaRecorrente) {
          if (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31) {
            mostrarAviso('Informe um dia válido para a recorrência.', 'erro')
            return
          }

          const payloadRecorrencia = {
            empresa_id: empresaId,
            descricao: primeiraLetraMaiuscula(descricao.trim()),
            valor: converterValor(valor),
            centro_custo_id: centroCustoId || null,
            observacao: observacaoConta.trim() || null,
            frequencia: tipoRecorrencia,
            dia_vencimento: diaRecorrencia,
            data_inicio: dataBanco,
            ativo: true
          }

          if (recorrenciaContaId) {
            const { error: erroRecorrencia } = await supabase
              .from('df_contas_recorrentes')
              .update(payloadRecorrencia)
              .eq('id', recorrenciaContaId)
              .eq('empresa_id', empresaId)

            if (erroRecorrencia) {
              mostrarAviso('A conta foi atualizada, mas a recorrência não foi salva: ' + erroRecorrencia.message, 'erro')
              return
            }
          } else {
            const { data: dataRecorrencia, error: erroRecorrencia } = await supabase
              .from('df_contas_recorrentes')
              .insert([payloadRecorrencia])
              .select()

            if (erroRecorrencia) {
              mostrarAviso('A conta foi atualizada, mas a recorrência não foi salva: ' + erroRecorrencia.message, 'erro')
              return
            }

            const recorrenciaCriada = Array.isArray(dataRecorrencia) ? dataRecorrencia[0] : dataRecorrencia
            let recorrenciaIdCriada = recorrenciaCriada?.id

            if (!recorrenciaIdCriada) {
              const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
                supabase,
                empresaId,
                conta: {
                  id: editandoContaId,
                  descricao: primeiraLetraMaiuscula(descricao.trim()),
                  valor: converterValor(valor),
                  data_vencimento: dataBanco
                },
                dataBanco,
                descricaoConta: primeiraLetraMaiuscula(descricao.trim())
              })
              recorrenciaIdCriada = recorrenciaEncontrada?.id
            }

            if (!recorrenciaIdCriada) {
              mostrarAviso('A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.', 'erro')
              return
            }

            const { error: erroVinculoRecorrencia } = await supabase
              .from('df_contas')
              .update({ recorrencia_id: recorrenciaIdCriada })
              .eq('id', editandoContaId)
              .eq('empresa_id', empresaId)

            if (erroVinculoRecorrencia) {
              mostrarAviso('A recorrência foi criada, mas não foi vinculada à conta: ' + erroVinculoRecorrencia.message, 'erro')
              return
            }

            setRecorrenciaContaId(recorrenciaIdCriada)
            setContas((listaAtual) => listaAtual.map((conta) =>
              conta.id === editandoContaId ? { ...conta, recorrencia_id: recorrenciaIdCriada } : conta
            ))
          }
        } else if (recorrenciaContaId) {
          await supabase.from('df_contas_recorrentes').update({ ativo: false }).eq('id', recorrenciaContaId).eq('empresa_id', empresaId)
          await supabase.from('df_contas').update({ recorrencia_id: null }).eq('id', editandoContaId).eq('empresa_id', empresaId)
        }
      }
    } else {
      const resposta = await supabase.from('df_contas').insert([{ ...payload, status: 'pendente', excluido: false }]).select()
      error = resposta.error

      if (!error && contaRecorrente) {
        const dataBanco = formatarDataParaBanco(dataVencimento)
        const diaRecorrencia = Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10))

        if (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31) {
          mostrarAviso('Informe um dia válido para a recorrência.', 'erro')
          return
        }

        const { data: dataRecorrencia, error: erroRecorrencia } = await supabase
          .from('df_contas_recorrentes')
          .insert([{
            empresa_id: empresaId,
            descricao: primeiraLetraMaiuscula(descricao.trim()),
            valor: converterValor(valor),
            centro_custo_id: centroCustoId || null,
            observacao: observacaoConta.trim() || null,
            frequencia: tipoRecorrencia,
            dia_vencimento: diaRecorrencia,
            data_inicio: dataBanco,
            ativo: true
          }])
          .select()

        if (erroRecorrencia) {
          mostrarAviso('A conta foi criada, mas a recorrência não foi salva: ' + erroRecorrencia.message, 'erro')
        } else {
          const recorrenciaCriada = Array.isArray(dataRecorrencia) ? dataRecorrencia[0] : dataRecorrencia
          const contaCriada = Array.isArray(resposta.data) ? resposta.data[0] : resposta.data
          let recorrenciaIdCriada = recorrenciaCriada?.id

          if (!recorrenciaIdCriada && contaCriada?.id) {
            const recorrenciaEncontrada = await localizarRecorrenciaDaConta({
              supabase,
              empresaId,
              conta: contaCriada,
              dataBanco,
              descricaoConta: primeiraLetraMaiuscula(descricao.trim())
            })
            recorrenciaIdCriada = recorrenciaEncontrada?.id
          }

          if (recorrenciaIdCriada && contaCriada?.id) {
            const { error: erroVinculoRecorrencia } = await supabase
              .from('df_contas')
              .update({ recorrencia_id: recorrenciaIdCriada })
              .eq('id', contaCriada.id)
              .eq('empresa_id', empresaId)

            if (erroVinculoRecorrencia) {
              mostrarAviso('A recorrência foi criada, mas não foi vinculada à conta: ' + erroVinculoRecorrencia.message, 'erro')
              return
            }
          }
        }
      }
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
