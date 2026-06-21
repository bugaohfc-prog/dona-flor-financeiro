import { useState } from 'react'
import {
  atualizarConta,
  atualizarRecorrencia,
  atualizarStatusConta,
  baixarContaComoPaga,
  buscarRecorrenciaPorId,
  corrigirPagamentoConta,
  criarConta,
  criarContasEmLote,
  estornarBaixaConta,
  listarRecorrencias,
  criarRecorrencia,
  desativarRecorrencia,
  enviarContaParaLixeira,
  listarContasAtivas,
  listarContasDoMesParaRecorrencia,
  listarRecorrenciasAtivas,
  listarRecorrenciasPorDia,
  ocultarConta as ocultarContaService,
  reativarRecorrencia,
  reexibirConta as reexibirContaService,
  validarCentroCustoDaEmpresa,
  validarFilialDaEmpresa,
  vincularRecorrenciaNaConta
} from '../services/contasService'
import { deveGerarRecorrenciaNoMes, montarDataRecorrente } from '../utils/recorrencia'
import { mensagemSeguraErro } from '../utils/session'

const CENTRO_CUSTO_INVALIDO_MENSAGEM = 'Centro de custo indisponível. Atualize a página ou selecione outro centro de custo.'

function normalizarTextoRecorrencia(valor) {
  return String(valor || '').trim().toLowerCase()
}

function normalizarValorRecorrencia(valor) {
  return Number(valor || 0).toFixed(2)
}

function recorrenciaTemContaGerada(contasReferencia, recorrencia, dataGerada) {
  return (contasReferencia || []).some((conta) => {
    if (conta.data_vencimento !== dataGerada) return false
    if (recorrencia.id && conta.recorrencia_id === recorrencia.id) return true
    if (recorrencia.id) return false

    return (
      normalizarTextoRecorrencia(conta.descricao) === normalizarTextoRecorrencia(recorrencia.descricao) &&
      normalizarValorRecorrencia(conta.valor) === normalizarValorRecorrencia(recorrencia.valor) &&
      String(conta.centro_custo_id || '') === String(recorrencia.centro_custo_id || '') &&
      String(conta.filial_id || '') === String(recorrencia.filial_id || '')
    )
  })
}

export function useContas() {
  const [contas, setContas] = useState([])
  const [contasLixeira, setContasLixeira] = useState([])
  const [seriesRecorrentes, setSeriesRecorrentes] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
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
  const [filialId, setFilialId] = useState('')
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
    setFilialId('')
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


  async function resolverCentroCustoSeguro(supabase, empresaId, centroCustoId, opcoes = {}) {
    if (!centroCustoId) return null

    const centroValidado = await validarCentroCustoDaEmpresa(supabase, centroCustoId, empresaId)
    if (!centroValidado && opcoes.bloquearInvalido) {
      throw new Error(CENTRO_CUSTO_INVALIDO_MENSAGEM)
    }

    return centroValidado
  }

  async function resolverFilialSegura(supabase, empresaId, filialId) {
    if (!filialId) return null
    return validarFilialDaEmpresa(supabase, filialId, empresaId)
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

    const { data: recorrentes, error } = await listarRecorrenciasAtivas(supabase, empresaAtual)

    if (error) {
      console.warn('Não foi possível carregar contas recorrentes:', error.message)
      return contasAtuais
    }

    const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fimMes = `${ano}-${String(mes).padStart(2, '0')}-${String(new Date(ano, mes, 0).getDate()).padStart(2, '0')}`
    const { data: contasDoMes, error: erroContasDoMes } = await listarContasDoMesParaRecorrencia(supabase, empresaAtual, inicioMes, fimMes)

    if (erroContasDoMes) {
      console.warn('Não foi possível validar contas recorrentes existentes:', erroContasDoMes.message)
    }

    const contasReferencia = Array.isArray(contasDoMes) ? contasDoMes : contasAtuais
    const novasContas = []

    for (const recorrencia of (recorrentes || [])) {
      if (!deveGerarRecorrenciaNoMes(recorrencia, ano, mes)) continue

      const dataGerada = montarDataRecorrente(ano, mes, recorrencia.dia_vencimento)

      const jaExiste = recorrenciaTemContaGerada(contasReferencia, recorrencia, dataGerada)

      if (jaExiste) continue

      const centroCustoSeguro = await resolverCentroCustoSeguro(supabase, empresaAtual, recorrencia.centro_custo_id)
      const filialSegura = await resolverFilialSegura(supabase, empresaAtual, recorrencia.filial_id)

      novasContas.push({
        empresa_id: empresaAtual,
        descricao: recorrencia.descricao,
        valor: Number(recorrencia.valor || 0),
        data_vencimento: dataGerada,
        vencimento: dataGerada,
        centro_custo_id: centroCustoSeguro,
        filial_id: filialSegura,
        observacao: recorrencia.observacao || null,
        recorrencia_id: recorrencia.id,
        status: 'pendente',
        excluido: false,
        enviar_whatsapp: configWhatsapp,
        enviar_email: configEmail,
        enviar_push: configPush,
        dias_aviso: Number(diasAlertaContas || diasAvisoPadrao || 1)
      })
    }

    if (novasContas.length === 0) return contasAtuais

    const { data: contasCriadas, error: erroInsert } = await criarContasEmLote(supabase, novasContas)

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
      diasAvisoPadrao,
      silencioso = false,
      permitirGerarRecorrencias = false
    } = contexto

    if (!empresaAtual) return

    try {
      const [{ data, error }, respostaRecorrencias] = await Promise.all([
        listarContasAtivas(supabase, empresaAtual),
        listarRecorrencias(supabase, empresaAtual)
      ])

      if (error) {
        avisarErro(error)
        return
      }

      if (respostaRecorrencias.error) {
        console.warn('Não foi possível carregar séries recorrentes:', respostaRecorrencias.error.message)
        setSeriesRecorrentes([])
      } else {
        setSeriesRecorrentes(respostaRecorrencias.data || [])
      }

      const contasAtuais = data || []

      if (!permitirGerarRecorrencias) {
        setContas(contasAtuais)
        return
      }

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
    } finally {
      if (!silencioso) setLoading(false)
    }
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
      const { data, error } = await buscarRecorrenciaPorId(supabase, conta.recorrencia_id, empresaId)

      if (!error && data) return data
    }

    const diaReferencia = Number(String(dataBanco || conta.data_vencimento || '').slice(8, 10))
    if (!diaReferencia) return null

    const { data, error } = await listarRecorrenciasPorDia(supabase, empresaId, diaReferencia)

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
    setFilialId(conta.filial_id || '')
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

    let centroCustoSeguro = null

    try {
      centroCustoSeguro = await resolverCentroCustoSeguro(supabase, empresaId, centroCustoId, { bloquearInvalido: true })
    } catch (error) {
      mostrarAviso(error?.message || CENTRO_CUSTO_INVALIDO_MENSAGEM, 'erro')
      return
    }

    const filialSegura = await resolverFilialSegura(supabase, empresaId, filialId)
    const dataBanco = formatarDataParaBanco(dataVencimento)
    const diaRecorrencia = contaRecorrente ? Number(diaVencimentoRecorrencia || String(dataBanco).slice(8, 10)) : null

    if (contaRecorrente && (!diaRecorrencia || diaRecorrencia < 1 || diaRecorrencia > 31)) {
      mostrarAviso('Informe um dia válido para a recorrência.', 'erro')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: dataBanco,
      vencimento: dataBanco,
      centro_custo_id: centroCustoSeguro,
      filial_id: filialSegura,
      observacao: observacaoConta.trim() || null,
      enviar_whatsapp: contaWhatsapp,
      enviar_email: contaEmail,
      enviar_push: contaPush,
      dias_aviso: Number(contaDiasAviso || diasAlertaContas || diasAvisoPadrao || 1),
      empresa_id: empresaId
    }

    const payloadRecorrencia = contaRecorrente ? {
      empresa_id: empresaId,
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      centro_custo_id: centroCustoSeguro,
      filial_id: filialSegura,
      tipo_recorrencia: tipoRecorrencia || 'mensal',
      dia_vencimento: diaRecorrencia,
      data_inicio: dataBanco,
      ativo: true
    } : null

    let error

    if (editandoContaId) {
      const payloadConta = { ...payload }

      if (contaRecorrente && recorrenciaContaId) {
        payloadConta.recorrencia_id = recorrenciaContaId
      } else if (!contaRecorrente && recorrenciaContaId) {
        payloadConta.recorrencia_id = null
      }

      const resposta = await atualizarConta(supabase, editandoContaId, empresaId, payloadConta)
      error = resposta.error

      if (!error) {
        if (contaRecorrente) {
          if (recorrenciaContaId) {
            const { error: erroRecorrencia } = await atualizarRecorrencia(supabase, recorrenciaContaId, empresaId, payloadRecorrencia)

            if (erroRecorrencia) {
              console.warn('Falha ao atualizar recorrência da conta:', erroRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi atualizada, mas a recorrência não foi salva.'), 'erro')
              return
            }
          } else {
            const { data: dataRecorrencia, error: erroRecorrencia } = await criarRecorrencia(supabase, payloadRecorrencia)

            if (erroRecorrencia) {
              console.warn('Falha ao criar recorrência da conta atualizada:', erroRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi atualizada, mas a recorrência não foi salva.'), 'erro')
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

            const { error: erroVinculoRecorrencia } = await vincularRecorrenciaNaConta(supabase, editandoContaId, empresaId, recorrenciaIdCriada)

            if (erroVinculoRecorrencia) {
              console.warn('Falha ao vincular recorrência criada:', erroVinculoRecorrencia)
              mostrarAviso(mensagemSeguraErro(erroVinculoRecorrencia, 'A recorrência foi criada, mas não foi vinculada à conta.'), 'erro')
              return
            }

            setRecorrenciaContaId(recorrenciaIdCriada)
            setContas((listaAtual) => listaAtual.map((conta) =>
              conta.id === editandoContaId ? { ...conta, recorrencia_id: recorrenciaIdCriada } : conta
            ))
          }
        } else if (recorrenciaContaId) {
          const { error: erroDesativarRecorrencia } = await desativarRecorrencia(supabase, recorrenciaContaId, empresaId)

          if (erroDesativarRecorrencia) {
            console.warn('Falha ao desativar recorrência da conta:', erroDesativarRecorrencia)
            mostrarAviso(mensagemSeguraErro(erroDesativarRecorrencia, 'A conta foi atualizada, mas a recorrência não foi desativada.'), 'erro')
            return
          }
        }
      }
    } else {
      const resposta = await criarConta(supabase, { ...payload, status: 'pendente', excluido: false })
      error = resposta.error

      if (!error && contaRecorrente) {
        const { data: dataRecorrencia, error: erroRecorrencia } = await criarRecorrencia(supabase, payloadRecorrencia)

        if (erroRecorrencia) {
          console.warn('Falha ao criar recorrência da nova conta:', erroRecorrencia)
          mostrarAviso(mensagemSeguraErro(erroRecorrencia, 'A conta foi criada, mas a recorrência não foi salva.'), 'erro')
          return
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

          if (!recorrenciaIdCriada) {
            mostrarAviso('A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.', 'erro')
            return
          }

          if (!contaCriada?.id) {
            mostrarAviso('A conta foi criada, mas o sistema não conseguiu localizar o vínculo da recorrência.', 'erro')
            return
          }

          const { error: erroVinculoRecorrencia } = await vincularRecorrenciaNaConta(supabase, contaCriada.id, empresaId, recorrenciaIdCriada)

          if (erroVinculoRecorrencia) {
            console.warn('Falha ao vincular recorrência da nova conta:', erroVinculoRecorrencia)
            mostrarAviso(mensagemSeguraErro(erroVinculoRecorrencia, 'A recorrência foi criada, mas não foi vinculada à conta.'), 'erro')
            return
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
        console.warn('Falha ao salvar conta:', error)
        mostrarAviso(mensagemSeguraErro(error), 'erro')
      }
      return
    }

    fecharConta()
    await buscarContas()
    mostrarAviso(editandoContaId ? 'Conta atualizada com sucesso.' : 'Conta criada com sucesso.', 'sucesso')
  }

  async function marcarComoPago(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso, pagamento } = contexto
    const resposta = pagamento
      ? await baixarContaComoPaga(supabase, id, empresaId, pagamento)
      : await atualizarStatusConta(supabase, id, empresaId, 'pago')
    const { error } = resposta

    if (error) {
      console.warn('Falha ao marcar conta como paga:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível marcar a conta como paga.'), 'erro')
      return false
    }

    await buscarContas()
    mostrarAviso?.('Conta marcada como paga.', 'sucesso')
    return true
  }

  async function corrigirPagamento(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso, pagamento } = contexto
    const { error } = await corrigirPagamentoConta(supabase, id, empresaId, pagamento)

    if (error) {
      console.warn('Falha ao corrigir pagamento da conta:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível corrigir o pagamento da conta.'), 'erro')
      return false
    }

    await buscarContas()
    mostrarAviso?.('Pagamento corrigido com sucesso.', 'sucesso')
    return true
  }

  async function voltarParaPendente(contexto) {
    const { supabase, id, empresaId, buscarContas, mostrarAviso } = contexto
    const { error } = await estornarBaixaConta(supabase, id, empresaId)

    if (error) {
      console.warn('Falha ao estornar baixa da conta:', error)
      mostrarAviso?.(mensagemSeguraErro(error, 'Não foi possível estornar a baixa da conta.'), 'erro')
      return
    }

    await buscarContas()
    mostrarAviso?.('Baixa estornada. A conta voltou para aberta.', 'sucesso')
  }

  async function excluirConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, buscarLixeira, mostrarAviso } = contexto
    const { error } = await enviarContaParaLixeira(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await Promise.all([buscarContas(), buscarLixeira()])
    mostrarAviso?.('Conta enviada para a lixeira.', 'sucesso')
  }

  async function ocultarConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await ocultarContaService(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarContas()
    mostrarAviso?.('Conta oculta da visão principal.', 'sucesso')
  }

  async function reexibirConta(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await reexibirContaService(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return
    }

    await buscarContas()
    mostrarAviso?.('Conta reexibida na visão principal.', 'sucesso')
  }

  async function desativarSerieRecorrente(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await desativarRecorrencia(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return false
    }

    await buscarContas()
    mostrarAviso?.('Série recorrente desativada.', 'sucesso')
    return true
  }

  async function reativarSerieRecorrente(contexto) {
    const { supabase, id, empresaId, avisarErro, buscarContas, mostrarAviso } = contexto
    const { error } = await reativarRecorrencia(supabase, id, empresaId)

    if (error) {
      avisarErro(error)
      return false
    }

    await buscarContas()
    mostrarAviso?.('Série recorrente reativada.', 'sucesso')
    return true
  }

  return {
    contas,
    setContas,
    contasLixeira,
    setContasLixeira,
    seriesRecorrentes,
    setSeriesRecorrentes,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroCentro,
    setFiltroCentro,
    filtroFilial,
    setFiltroFilial,
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
    filialId,
    setFilialId,
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
    corrigirPagamento,
    voltarParaPendente,
    excluirConta,
    ocultarConta,
    reexibirConta,
    desativarSerieRecorrente,
    reativarSerieRecorrente
  }
}
