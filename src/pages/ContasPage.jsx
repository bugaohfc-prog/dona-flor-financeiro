import { AccountListSkeleton } from '../components/feedback/Skeletons.jsx'
import { ehContaRecorrente } from '../utils/recorrencia'
import { useEffect, useMemo, useRef, useState } from 'react'
import AccountPaymentModal from '../components/modals/AccountPaymentModal.jsx'
import AccountPartialPaymentModal from '../components/modals/AccountPartialPaymentModal.jsx'
import {
  agruparContasPorAnoMes,
  criarEstadoExpansaoCompleta,
  criarEstadoExpansaoPadrao,
  reconciliarEstadoExpansao
} from '../utils/contasAgrupamento.js'
import { calcularResumoFinanceiroContas, origemPermiteContaForaDoFiltro } from '../utils/contasConsultasOperacionais.js'
import { ExportMenu, FilterCard, PageHeader } from '../components/shared/PagePatterns.jsx'
import './ContasPage.css'

const OPCOES_ORDENACAO_CONTAS = [
  { valor: 'vencimento_asc', label: 'Vencimento mais próximo' },
  { valor: 'vencimento_desc', label: 'Vencimento mais distante' },
  { valor: 'valor_desc', label: 'Maior valor' },
  { valor: 'valor_asc', label: 'Menor valor' },
  { valor: 'nome_asc', label: 'Nome A-Z' },
  { valor: 'status', label: 'Status' }
]

const ABAS_OPERACIONAIS_CONTAS = [
  { valor: 'pendentes', label: 'Em aberto' },
  { valor: 'vencidas', label: 'Vencidas' },
  { valor: 'futuras', label: 'Futuras' }
]

const ABAS_HISTORICO_CONTAS = [
  { valor: 'pagas', label: 'Pagas' },
  { valor: 'ocultas', label: 'Ocultas' },
  { valor: 'excluidas', label: 'Excluídas' }
]

const ABAS_STATUS_BUSCA = [
  { valor: 'todas', label: 'Todos' },
  { valor: 'pagas', label: 'Pagas' },
  { valor: 'vencidas', label: 'Vencidas' },
  { valor: 'pendentes', label: 'Abertas' },
  { valor: 'futuras', label: 'Futuras' }
]

const OPCOES_HORIZONTE_CONTAS = [
  { valor: '30_dias', label: '30 dias' },
  { valor: '90_dias', label: '90 dias' },
  { valor: '6_meses', label: '6 meses' },
  { valor: '12_meses', label: '12 meses' },
  { valor: 'todos', label: 'Todos' }
]

function obterTimestampVencimento(conta, fallback) {
  const valor = String(conta?.data_vencimento || '').trim()
  const partesDataBanco = valor.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const partesDataBrasil = valor.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)

  if (partesDataBanco) {
    const [, ano, mes, dia] = partesDataBanco
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime()
  }

  if (partesDataBrasil) {
    const [, dia, mes, ano] = partesDataBrasil
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime()
  }

  const timestamp = Date.parse(valor)
  return Number.isNaN(timestamp) ? fallback : timestamp
}

function ordenarContasParaListagem(contas, ordenacao, filtroStatus, estaVencida) {
  const compararVencimentoAsc = (a, b) =>
    obterTimestampVencimento(a, Number.MAX_SAFE_INTEGER) - obterTimestampVencimento(b, Number.MAX_SAFE_INTEGER)

  const compararVencimentoDesc = (a, b) =>
    obterTimestampVencimento(b, Number.MIN_SAFE_INTEGER) - obterTimestampVencimento(a, Number.MIN_SAFE_INTEGER)

  const compararId = (a, b) =>
    String(a.id || '').localeCompare(String(b.id || ''))

  const compararAbertasAntesDePagas = (a, b) => {
    if (filtroStatus === 'pagas') return 0

    const aPaga = a.status === 'pago' ? 1 : 0
    const bPaga = b.status === 'pago' ? 1 : 0
    return aPaga - bPaga
  }

  const obterStatusOrdenacao = (conta) => {
    if (estaVencida(conta.data_vencimento, conta.status)) return 0
    if (conta.status !== 'pago') return 1
    return 2
  }

  return [...contas].sort((a, b) => {
    if (ordenacao === 'vencimento_asc') {
      const grupo = compararAbertasAntesDePagas(a, b)
      if (grupo !== 0) return grupo
      const vencimento = compararVencimentoAsc(a, b)
      return vencimento || compararId(a, b)
    }

    if (ordenacao === 'vencimento_desc') {
      const grupo = compararAbertasAntesDePagas(a, b)
      if (grupo !== 0) return grupo
      const vencimento = compararVencimentoDesc(a, b)
      return vencimento || compararId(a, b)
    }

    if (ordenacao === 'valor_desc') {
      return Number(b.valor || 0) - Number(a.valor || 0)
    }

    if (ordenacao === 'valor_asc') {
      return Number(a.valor || 0) - Number(b.valor || 0)
    }

    if (ordenacao === 'nome_asc') {
      return String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt-BR', { sensitivity: 'base' })
    }

    if (ordenacao === 'status') {
      const status = obterStatusOrdenacao(a) - obterStatusOrdenacao(b)
      if (status !== 0) return status
      const vencimento = compararVencimentoAsc(a, b)
      return vencimento || compararId(a, b)
    }

    const vencimento = compararVencimentoAsc(a, b)
    return vencimento || compararId(a, b)
  })
}

function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
export default function ContasPage({
  busca, setBusca, mostrarFiltros, setMostrarFiltros, limparFiltros, imprimirPDF, exportarCSV, exportarExcel,
  filtroStatus, setFiltroStatus, filtroHorizonte, setFiltroHorizonte, centros, filtroCentro, setFiltroCentro, filiais, filtroFilial, setFiltroFilial, filtroMes, setFiltroMes,
  dataInicial, setDataInicial, dataFinal, setDataFinal, limitarDataInput, contas = [], contasFiltradas, contaFocusTarget, onContaFocusHandled, onContaForaDoFiltro, total, formatarValor,
  loading, mostrarContas, setMostrarContas, estaVencida, formatarData, formatarTipoRecorrencia,
  obterTipoRecorrenciaConta, abrirConfirmacao, marcarComoPago, corrigirPagamento, voltarParaPendente, abrirEdicaoConta, excluirConta, ocultarConta, reexibirConta,
  registrarPagamentoParcial,
  listarPagamentosParciaisConta,
  estornarPagamentoParcial,
  baixarContaQuitadaPorParciais,
  navegarPara, telaRetorno = '', onVoltarOrigem, podeEditarFinanceiro = true, podeExportarDados = true, abrirNovaConta,
  periodoPagas, setPeriodoPagas, anoPagas, setAnoPagas, dataInicialPagas, setDataInicialPagas, dataFinalPagas, setDataFinalPagas, loadingConsultaContas = false, haMaisContasConsulta = false, carregarMaisContas, modoBuscaGlobal = false
}) {
  const [ordenacaoContas, setOrdenacaoContas] = useState('vencimento_asc')
  const [contaEmBaixa, setContaEmBaixa] = useState(null)
  const [contaEmPagamentoParcial, setContaEmPagamentoParcial] = useState(null)
  const [modoPagamento, setModoPagamento] = useState('baixa')
  const [contaDestacadaId, setContaDestacadaId] = useState('')
  const [expansaoContas, setExpansaoContas] = useState({ anos: {}, meses: {} })
  const contaDestacadaRef = useRef(null)
  const avisoContaForaDoFiltroRef = useRef(null)
  const empresaVisualRef = useRef('')
  const expansaoInicializadaRef = useRef(false)
  const contaAlvoId = contaFocusTarget?.tipo === 'conta' ? contaFocusTarget.id : ''
  const contaAlvo = useMemo(() => {
    if (!contaAlvoId) return null
    return contas.find((conta) => String(conta.id) === String(contaAlvoId))
      || contasFiltradas.find((conta) => String(conta.id) === String(contaAlvoId))
      || (String(contaFocusTarget?.conta?.id) === String(contaAlvoId) ? contaFocusTarget.conta : null)
      || null
  }, [contaAlvoId, contaFocusTarget?.conta, contas, contasFiltradas])
  const contaAlvoEstaFiltrada = useMemo(
    () => Boolean(contaAlvoId) && contasFiltradas.some((conta) => String(conta.id) === String(contaAlvoId)),
    [contaAlvoId, contasFiltradas]
  )
  const contasParaListagem = useMemo(() => {
    if (!contaAlvo) return contasFiltradas
    if (contaAlvo.oculto === true && filtroStatus !== 'ocultas') return contasFiltradas
    const jaEstaFiltrada = contasFiltradas.some((conta) => String(conta.id) === String(contaAlvo.id))
    const podeIncluirForaDoFiltro = origemPermiteContaForaDoFiltro(contaFocusTarget?.origem)
    return jaEstaFiltrada || !podeIncluirForaDoFiltro ? contasFiltradas : [contaAlvo, ...contasFiltradas]
  }, [contaAlvo, contaFocusTarget?.origem, contasFiltradas, filtroStatus])
  const contasOrdenadas = useMemo(
    () => ordenarContasParaListagem(contasParaListagem, ordenacaoContas, filtroStatus, estaVencida),
    [contasParaListagem, ordenacaoContas, filtroStatus, estaVencida]
  )
  const gruposAnoMes = useMemo(
    () => agruparContasPorAnoMes(contasOrdenadas, { dataReferencia: new Date(), estaVencida }),
    [contasOrdenadas, estaVencida]
  )
  const empresaVisual = useMemo(() => String(
    contas.find((conta) => conta?.empresa_id)?.empresa_id
      || contasFiltradas.find((conta) => conta?.empresa_id)?.empresa_id
      || ''
  ), [contas, contasFiltradas])
  const localizacaoContaAlvo = useMemo(() => {
    if (!contaAlvoId) return null
    for (const grupoAno of gruposAnoMes) {
      const grupoMes = grupoAno.meses.find((mes) => mes.contas.some(
        (conta) => String(conta.id) === String(contaAlvoId)
      ))
      if (grupoMes) return { ano: grupoAno.chave, mes: grupoMes.chave }
    }
    return null
  }, [contaAlvoId, gruposAnoMes])
  const abasStatusAtuais = modoBuscaGlobal
    ? ABAS_STATUS_BUSCA
    : [...ABAS_OPERACIONAIS_CONTAS, ...ABAS_HISTORICO_CONTAS]
  const statusAtualLabel = abasStatusAtuais.find((aba) => aba.valor === filtroStatus)?.label || filtroStatus
  const modoResumoFinanceiro = filtroStatus === 'ocultas'
    ? 'ocultas'
    : (filtroStatus === 'excluidas' ? 'excluidas' : 'operacional')
  const resumoResultadoFiltrado = useMemo(
    () => calcularResumoFinanceiroContas(contasFiltradas, undefined, { modo: modoResumoFinanceiro }),
    [contasFiltradas, modoResumoFinanceiro]
  )
  const mostrarEncargosResultado = resumoResultadoFiltrado.encargos > 0
  const mostrarDescontosResultado = resumoResultadoFiltrado.descontos > 0

  async function confirmarBaixaConta(payload) {
    if (!contaEmBaixa?.id) return false
    if (modoPagamento === 'corrigir') return corrigirPagamento(contaEmBaixa.id, payload)
    return marcarComoPago(contaEmBaixa.id, payload)
  }

  function abrirBaixaConta(conta) {
    setModoPagamento('baixa')
    setContaEmBaixa(conta)
  }

  function abrirCorrecaoPagamento(conta) {
    setModoPagamento('corrigir')
    setContaEmBaixa(conta)
  }

  function fecharModalPagamento() {
    setContaEmBaixa(null)
    setModoPagamento('baixa')
  }

  async function confirmarPagamentoParcial(payload) {
    if (!contaEmPagamentoParcial?.id) return false
    return registrarPagamentoParcial(contaEmPagamentoParcial.id, payload)
  }

  function alternarGrupoAno(chave) {
    setExpansaoContas((atual) => ({
      ...atual,
      anos: { ...atual.anos, [chave]: atual.anos[chave] !== true }
    }))
  }

  function alternarGrupoMes(chave) {
    setExpansaoContas((atual) => ({
      ...atual,
      meses: { ...atual.meses, [chave]: atual.meses[chave] !== true }
    }))
  }

  useEffect(() => {
    if (!contaAlvoId || !contaAlvo) return undefined

    const salvamentoForaDoFiltro = contaFocusTarget?.origem === 'salvamento' && !contaAlvoEstaFiltrada
    if (salvamentoForaDoFiltro) {
      const chaveAviso = contaFocusTarget?.nonce ?? (String(contaFocusTarget?.origem) + ':' + String(contaAlvoId))
      if (avisoContaForaDoFiltroRef.current !== chaveAviso) {
        avisoContaForaDoFiltroRef.current = chaveAviso
        onContaForaDoFiltro?.()
      }
      setContaDestacadaId('')
      onContaFocusHandled?.()
      return undefined
    }

    setMostrarContas(true)
    setContaDestacadaId(String(contaAlvoId))
    if (localizacaoContaAlvo) {
      setExpansaoContas((atual) => ({
        anos: { ...atual.anos, [localizacaoContaAlvo.ano]: true },
        meses: { ...atual.meses, [localizacaoContaAlvo.mes]: true }
      }))
    }

    const scrollTimer = window.setTimeout(() => {
      contaDestacadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)

    const clearTimer = window.setTimeout(() => {
      setContaDestacadaId('')
      onContaFocusHandled?.()
    }, 4500)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
  }, [
    contaAlvoId,
    contaAlvo,
    contaAlvoEstaFiltrada,
    contaFocusTarget?.nonce,
    contaFocusTarget?.origem,
    localizacaoContaAlvo,
    setMostrarContas,
    onContaFocusHandled,
    onContaForaDoFiltro
  ])

  useEffect(() => {
    const termoBusca = String(busca || '').trim()
    if (!termoBusca || gruposAnoMes.length === 0) return

    setMostrarContas(true)
    setExpansaoContas((atual) => {
      const expansaoBusca = criarEstadoExpansaoCompleta(gruposAnoMes)
      return {
        anos: { ...atual.anos, ...expansaoBusca.anos },
        meses: { ...atual.meses, ...expansaoBusca.meses }
      }
    })
  }, [busca, gruposAnoMes, setMostrarContas])

  useEffect(() => {
    if (!empresaVisual) return

    if (empresaVisualRef.current !== empresaVisual) {
      empresaVisualRef.current = empresaVisual
      expansaoInicializadaRef.current = gruposAnoMes.length > 0
      setExpansaoContas(gruposAnoMes.length > 0
        ? criarEstadoExpansaoPadrao(gruposAnoMes)
        : { anos: {}, meses: {} })
      return
    }

    if (!expansaoInicializadaRef.current && gruposAnoMes.length > 0) {
      expansaoInicializadaRef.current = true
      setExpansaoContas(criarEstadoExpansaoPadrao(gruposAnoMes))
      return
    }

    setExpansaoContas((atual) => reconciliarEstadoExpansao(atual, gruposAnoMes))
  }, [empresaVisual, gruposAnoMes])

  function renderContaCard(conta) {
    const destacadaPorFoco = String(conta.id) === String(contaDestacadaId)
    const vencida = estaVencida(conta.data_vencimento, conta.status)
    const recorrente = ehContaRecorrente(conta)
    const tipoRecorrencia = recorrente ? formatarTipoRecorrencia(obterTipoRecorrenciaConta(conta)) : ''
    const valorVariavel = recorrente && conta.df_contas_recorrentes?.valor_variavel === true
    const parcelada = Boolean(conta.grupo_parcelamento_id && conta.parcela_numero && conta.parcelas_total)
    const observacao = String(conta.observacao || '').trim()
    const valorPrevisto = Number(conta.valor || 0)
    const valorPago = Number(conta.valor_pago || 0)
    const jurosMulta = Number(conta.juros_multa || 0)
    const desconto = Number(conta.desconto || 0)
    const exibirBaixaReal = conta.status === 'pago' && conta.valor_pago !== null && conta.valor_pago !== undefined
    const valorPrincipal = exibirBaixaReal ? valorPago : valorPrevisto
    const oculta = conta.oculto === true
    const excluida = conta.excluido === true
    const pagamentosParciaisTotal = Number(conta.pagamentosParciaisTotal || 0)
    const saldoPendenteParcial = Number(conta.saldoPendenteParcial || 0)
    const quantidadePagamentosParciais = Number(conta.quantidadePagamentosParciais || 0)
    const possuiPagamentosParciais = quantidadePagamentosParciais > 0 || pagamentosParciaisTotal > 0
    const pagamentoParcialQuitado = conta.status === 'pago' && saldoPendenteParcial <= 0
    const exibirPagamentoParcial = possuiPagamentosParciais && !pagamentoParcialQuitado
    const saldoDisponivelParcial = possuiPagamentosParciais ? saldoPendenteParcial : valorPrevisto
    const contaDisponivelParaParciais = (
      !oculta
      && conta.excluido !== true
      && conta.deletado !== true
    )
    const podeRegistrarPagamentoParcial = (
      contaDisponivelParaParciais
      && conta.status !== 'pago'
      && saldoDisponivelParcial > 0
    )
    const podeGerenciarPagamentosParciais = contaDisponivelParaParciais && possuiPagamentosParciais

    return (
      <div
        ref={destacadaPorFoco ? contaDestacadaRef : null}
        className={`print-card account-card-desktop ${destacadaPorFoco ? 'account-card-agenda-focus' : ''} ${exibirBaixaReal ? 'account-card-payment-real' : ''} ${oculta ? 'account-card-hidden' : ''} ${vencida ? 'account-card-vencida' : conta.status === 'pago' ? 'account-card-paga' : 'account-card-pendente'}`}
        key={conta.id}
      >
        <div className="account-card-head">
          <div className="account-title-wrap">
            <strong>{conta.descricao}</strong>
            {recorrente && (
              <span className="account-recurring-badge account-recurring-title-badge" title={`Conta recorrente ${tipoRecorrencia}`}>
                ↻ Recorrente
              </span>
            )}
          </div>
          {!exibirBaixaReal && (
            <span className="account-card-value">{formatarValor(valorPrevisto)}</span>
          )}
        </div>

        {exibirBaixaReal && (
          <div className="account-payment-real-panel">
            <strong className="account-payment-paid-value">{formatarValor(valorPrincipal)}</strong>
            <span className="account-payment-expected-value">Previsto: {formatarValor(valorPrevisto)}</span>
            {jurosMulta > 0 && (
              <span className="account-payment-adjustment account-payment-fee">
                Encargos: {formatarValor(jurosMulta)}
              </span>
            )}
            {desconto > 0 && (
              <span className="account-payment-adjustment account-payment-discount">
                Desconto: {formatarValor(desconto)}
              </span>
            )}
            {jurosMulta <= 0 && desconto <= 0 && (
              <span className="account-payment-adjustment account-payment-neutral">
                Pago sem ajuste
              </span>
            )}
          </div>
        )}

        <div className="account-meta-line">
          <div className="account-meta-main">
            <span className="account-date-badge">📅 {formatarData(conta.data_vencimento)}</span>
            <span>{conta.df_filiais?.nome || 'Sem filial'}</span>
            <span>{conta.df_centros_custo?.nome || '-'}</span>
          </div>
          <div className="account-meta-badges">
            {recorrente && (
              <span className="account-recurring-badge">↻ {tipoRecorrencia}</span>
            )}
            {valorVariavel && (
              <span className="status-pill account-variable-value-badge">Valor variável</span>
            )}
            {parcelada && (
              <>
                <span className="status-pill account-installment-badge">Parcelado</span>
                <span className="status-pill account-installment-step-badge">
                  Parcela {conta.parcela_numero}/{conta.parcelas_total}
                </span>
              </>
            )}
            <span className={`status-pill ${vencida ? 'status-vencido' : conta.status === 'pago' ? 'status-pago' : 'status-pendente'}`}>
              {vencida ? 'Vencido' : conta.status === 'pago' ? 'Pago' : 'Pendente'}
            </span>
            {oculta && <span className="status-pill status-oculto">Oculta</span>}
            {excluida && <span className="status-pill status-oculto">Excluída</span>}
          </div>
        </div>

        {exibirPagamentoParcial && (
          <div className="account-partial-payment-panel">
            <span className="status-pill account-partial-payment-badge">Pagamento parcial</span>
            <dl className="account-partial-payment-details">
              <div>
                <dt>Pago</dt>
                <dd>{formatarValor(pagamentosParciaisTotal)}</dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd>{formatarValor(saldoPendenteParcial)}</dd>
              </div>
              <div>
                <dt>Pagamentos</dt>
                <dd>{quantidadePagamentosParciais}</dd>
              </div>
              {conta.ultimoPagamentoParcialEm && (
                <div>
                  <dt>Último</dt>
                  <dd>{formatarData(conta.ultimoPagamentoParcialEm)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {observacao && (
          <div className="account-observation-preview" title={observacao}>
            <span className="account-observation-text">
              <span aria-hidden="true">📝</span> {observacao}
            </span>
          </div>
        )}

        {podeEditarFinanceiro && !excluida && (
          <div className={`account-actions ${conta.status === 'pago' ? 'account-actions-paid' : ''} ${(podeRegistrarPagamentoParcial || podeGerenciarPagamentosParciais) ? 'account-actions-with-partial' : ''}`}>
          {conta.status !== 'pago' ? (
            <button type="button" className="account-action-button account-action-primary" onClick={() => abrirBaixaConta(conta)}>
              Baixar
            </button>
          ) : (
            <>
              <button type="button" className="account-action-button account-action-secondary" onClick={() => abrirConfirmacao({ titulo: 'Estornar baixa desta conta?', mensagem: `A conta ${conta.descricao} deixará de constar como paga e os dados do pagamento serão removidos. A conta não será excluída e continuará com descrição, vencimento, valor, filial, centro e recorrência intactos.`, textoConfirmar: 'Estornar baixa', tipo: 'aviso', acao: () => voltarParaPendente(conta.id) })}>
                Estornar
              </button>
              <button type="button" className="account-action-button account-action-secondary" onClick={() => abrirCorrecaoPagamento(conta)}>
                Corrigir
              </button>
            </>
          )}

          {(podeRegistrarPagamentoParcial || podeGerenciarPagamentosParciais) && (
            <button
              className="account-action-button account-action-partial"
              onClick={() => setContaEmPagamentoParcial(conta)}
              title={podeGerenciarPagamentosParciais ? 'Ver pagamentos parciais' : 'Registrar pagamento parcial'}
            >
              {podeGerenciarPagamentosParciais ? 'Parciais' : 'Parcial'}
            </button>
          )}

          <button type="button" className="account-action-button account-action-secondary" onClick={() => abrirEdicaoConta(conta)}>
            Editar
          </button>

          {oculta ? (
            <button type="button" className="account-action-button account-action-restore" onClick={() => abrirConfirmacao({ titulo: 'Reexibir conta', mensagem: `Deseja reexibir a conta ${conta.descricao} na visão principal?`, textoConfirmar: 'Reexibir', tipo: 'aviso', acao: () => reexibirConta(conta.id) })}>
              Reexibir
            </button>
          ) : (
            <button type="button" className="account-action-button account-action-hide" onClick={() => abrirConfirmacao({ titulo: 'Ocultar conta', mensagem: `Ocultar esta conta da visão principal? A conta ${conta.descricao} não será excluída e poderá ser reexibida depois.`, textoConfirmar: 'Ocultar', tipo: 'aviso', acao: () => ocultarConta(conta.id) })}>
              Ocultar
            </button>
          )}

          <button type="button" className="account-action-button account-action-danger" onClick={() => abrirConfirmacao({ titulo: 'Mover para lixeira', mensagem: `Deseja mover a conta ${conta.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`, textoConfirmar: 'Mover', tipo: 'perigo', acao: () => excluirConta(conta.id) })}>
            Excluir
          </button>
          </div>
        )}
      </div>
    )
  }

  function renderListaContasConteudo() {
    return (
      <>
      <FilterCard className="no-print filters-desktop accounts-control-panel" description="Busque no histórico ou refine a visão operacional sem alterar os dados.">
        {modoBuscaGlobal ? (
          <div className="accounts-status-tabs" role="tablist" aria-label="Filtro dos resultados em todo o histórico">
            {ABAS_STATUS_BUSCA.map((aba) => (
              <button
                key={aba.valor}
                type="button"
                role="tab"
                aria-selected={filtroStatus === aba.valor}
                className={`accounts-status-tab ${filtroStatus === aba.valor ? 'is-active' : ''}`}
                onClick={() => setFiltroStatus(aba.valor)}
              >
                {aba.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="accounts-tabs-groups">
            <div className="accounts-tab-group">
              <span className="accounts-tab-group-label">Planejamento</span>
              <div className="accounts-status-tabs" role="tablist" aria-label="Contas operacionais">
                {ABAS_OPERACIONAIS_CONTAS.map((aba) => (
                  <button
                    key={aba.valor}
                    type="button"
                    role="tab"
                    aria-selected={filtroStatus === aba.valor}
                    className={`accounts-status-tab ${filtroStatus === aba.valor ? 'is-active' : ''}`}
                    onClick={() => setFiltroStatus(aba.valor)}
                  >
                    {aba.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="accounts-tab-group">
              <span className="accounts-tab-group-label">Histórico</span>
              <div className="accounts-status-tabs" role="tablist" aria-label="Histórico de contas">
                {ABAS_HISTORICO_CONTAS.map((aba) => (
                  <button
                    key={aba.valor}
                    type="button"
                    role="tab"
                    aria-selected={filtroStatus === aba.valor}
                    className={`accounts-status-tab ${filtroStatus === aba.valor ? 'is-active' : ''}`}
                    onClick={() => setFiltroStatus(aba.valor)}
                  >
                    {aba.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {modoBuscaGlobal && <div className="accounts-history-search-indicator">Resultados em todo o histórico</div>}

        {!modoBuscaGlobal && ['pendentes', 'vencidas', 'futuras'].includes(filtroStatus) && (
          <label className="accounts-horizon-control">
            <span>Horizonte</span>
            <select value={filtroHorizonte} onChange={(event) => setFiltroHorizonte(event.target.value)}>
              {OPCOES_HORIZONTE_CONTAS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
              ))}
            </select>
          </label>
        )}

        {!modoBuscaGlobal && filtroStatus === 'pagas' && (
          <div className="accounts-paid-period-controls">
            <label>
              <span>Período das contas pagas</span>
              <select value={periodoPagas} onChange={(event) => setPeriodoPagas(event.target.value)}>
                <option value="mes_atual">Mês atual</option>
                <option value="mes_anterior">Mês anterior</option>
                <option value="ano_atual">Ano atual</option>
                <option value="ano">Selecionar ano</option>
                <option value="intervalo">Intervalo personalizado</option>
              </select>
            </label>
            {periodoPagas === 'ano' && (
              <label><span>Ano</span><input type="number" min="2000" max="2100" value={anoPagas} onChange={(event) => setAnoPagas(event.target.value)} /></label>
            )}
            {periodoPagas === 'intervalo' && (
              <>
                <label><span>De</span><input type="date" value={dataInicialPagas} onChange={(event) => setDataInicialPagas(limitarDataInput(event.target.value))} /></label>
                <label><span>Até</span><input type="date" value={dataFinalPagas} onChange={(event) => setDataFinalPagas(limitarDataInput(event.target.value))} /></label>
              </>
            )}
          </div>
        )}

        <div className="accounts-search-row">
          <input
            className="accounts-search-input"
            placeholder="Buscar por conta, valor, data, centro, observação ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="accounts-filter-controls">
          <div className="accounts-filter-actions">
            <button type="button" className="filter-toggle-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
              {mostrarFiltros ? 'Ocultar filtros' : 'Mais filtros'}
            </button>
            <button type="button" className="accounts-clear-button" onClick={limparFiltros}>Limpar</button>
          </div>

          <label className="accounts-sort-control accounts-sort-control-main">
            <span>Ordenar por</span>
            <select value={ordenacaoContas} onChange={(e) => setOrdenacaoContas(e.target.value)}>
              {OPCOES_ORDENACAO_CONTAS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
              ))}
            </select>
          </label>
        </div>

        {mostrarFiltros && (
          <div className="advanced-filters">
            <select aria-label="Filial" value={filtroFilial} onChange={(e) => setFiltroFilial(e.target.value)}>
              <option value="">Todas as filiais</option>
              {(filiais || []).map((filial) => (<option key={filial.id} value={filial.id}>{filial.nome}</option>))}
            </select>

            <select aria-label="Centro de custo" value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
              <option value="">Todos os centros</option>
              {centros.map((centro) => (<option key={centro.id} value={centro.id}>{centro.nome}</option>))}
            </select>

            <input aria-label="Mês" type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />

            <input aria-label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(limitarDataInput(e.target.value))} />
            <input aria-label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(limitarDataInput(e.target.value))} />
          </div>
        )}
      </FilterCard>

      <section className="result-summary accounts-result-summary">
        <div className="accounts-result-heading">
          <strong>Resultado filtrado</strong>
          <small>{contasFiltradas.length} conta(s)</small>
        </div>
        <div className="accounts-result-metrics">
          <span><b>Previsto</b>{formatarValor(resumoResultadoFiltrado.total)}</span>
          <span><b>Realizado</b>{formatarValor(resumoResultadoFiltrado.pago)}</span>
          <span><b>Saldo em aberto</b>{formatarValor(resumoResultadoFiltrado.pendente)}</span>
          <span><b>Vencido</b>{formatarValor(resumoResultadoFiltrado.vencido)}</span>
          {mostrarEncargosResultado && <span><b>Encargos</b>{formatarValor(resumoResultadoFiltrado.encargos)}</span>}
          {mostrarDescontosResultado && <span><b>Descontos</b>{formatarValor(resumoResultadoFiltrado.descontos)}</span>}
        </div>
        <small className="accounts-result-context">
          Filial: {filtroFilial ? (filiais || []).find((filial) => filial.id === filtroFilial)?.nome || 'Selecionada' : 'Todas'} •
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {statusAtualLabel} •
          Mês: {filtroMes || 'Todos'}
        </small>
      </section>

      <section className="content-block accounts-list-section">
        {loading && <AccountListSkeleton items={3} />}

        <div className="accounts-list-header">
          <div className="accounts-list-title">
            <span className="accounts-kicker">Lista financeira</span>
            <strong>Contas</strong>
            <small>{contasOrdenadas.length} conta(s) na visualização atual</small>
          </div>
          <button
            type="button"
            className="accounts-collapse-button"
            onClick={() => setMostrarContas(!mostrarContas)}
            aria-expanded={mostrarContas}
            aria-label={mostrarContas ? 'Recolher seção de contas' : 'Expandir seção de contas'}
            title={mostrarContas ? 'Recolher' : 'Expandir'}
          >
            {mostrarContas ? '\u2212' : '+'}
          </button>
        </div>
        {!loading && mostrarContas && contasOrdenadas.length === 0 && (
          <EmptyState
            icon="💳"
            title={filtroStatus === 'ocultas'
              ? 'Nenhuma conta oculta'
              : filtroStatus === 'excluidas'
                ? 'Nenhuma conta excluída'
                : 'Nenhuma conta encontrada'}
            description={filtroStatus === 'ocultas'
              ? 'As contas ocultas aparecerão aqui quando forem retiradas da visão principal.'
              : filtroStatus === 'excluidas'
                ? 'As contas enviadas para a lixeira aparecerão neste histórico enquanto estiverem disponíveis.'
                : 'Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa.'}
          />
        )}

        {!loading && mostrarContas && (
          <div className="contas-hierarchy">
            {gruposAnoMes.map((grupoAno) => {
              const anoAberto = expansaoContas.anos[grupoAno.chave] === true
              const anoConteudoId = `contas-ano-${grupoAno.chave}`

              return (
                <section
                  className={`contas-hierarchy-year${grupoAno.periodo === 'atual' ? ' is-current' : ''}`}
                  key={grupoAno.chave}
                >
                  <button
                    type="button"
                    className="contas-hierarchy-year-toggle"
                    onClick={() => alternarGrupoAno(grupoAno.chave)}
                    aria-expanded={anoAberto}
                    aria-controls={anoConteudoId}
                    aria-label={`${anoAberto ? 'Recolher' : 'Expandir'} ${grupoAno.rotulo}`}
                  >
                    <span className="contas-hierarchy-heading-copy">
                      <span className="contas-hierarchy-title-line">
                        <strong>{grupoAno.rotulo}</strong>
                        {grupoAno.periodo === 'atual' && (
                          <span className="contas-hierarchy-current-label">Ano atual</span>
                        )}
                      </span>
                      <span className="contas-hierarchy-primary-summary">
                        <span>{grupoAno.totalContas} conta(s)</span>
                        <span>{formatarValor(grupoAno.valorTotal)}</span>
                      </span>
                      <span className="contas-hierarchy-secondary-summary">
                        <span>{grupoAno.abertas} aberta(s)</span>
                        <span>{grupoAno.vencidas} vencida(s)</span>
                      </span>
                    </span>
                    <span className="contas-hierarchy-expand-control" aria-hidden="true">
                      {anoAberto ? '−' : '+'}
                    </span>
                  </button>

                  {anoAberto && (
                    <div className="contas-hierarchy-year-content" id={anoConteudoId}>
                      {grupoAno.meses.map((grupoMes) => {
                        const mesAberto = expansaoContas.meses[grupoMes.chave] === true
                        const mesConteudoId = `contas-mes-${grupoMes.chave}`

                        return (
                          <section
                            className={`contas-hierarchy-month${grupoMes.periodo === 'atual' ? ' is-current' : ''}`}
                            key={grupoMes.chave}
                          >
                            <button
                              type="button"
                              className="contas-hierarchy-month-toggle"
                              onClick={() => alternarGrupoMes(grupoMes.chave)}
                              aria-expanded={mesAberto}
                              aria-controls={mesConteudoId}
                              aria-label={`${mesAberto ? 'Recolher' : 'Expandir'} ${grupoMes.rotulo}`}
                            >
                              <span className="contas-hierarchy-heading-copy">
                                <span className="contas-hierarchy-title-line">
                                  <strong>{grupoMes.rotulo}</strong>
                                  {grupoMes.periodo === 'atual' && (
                                    <span className="contas-hierarchy-current-label">Mês atual</span>
                                  )}
                                </span>
                                <span className="contas-hierarchy-primary-summary">
                                  <span>{grupoMes.totalContas} conta(s)</span>
                                  <span>{formatarValor(grupoMes.valorTotal)}</span>
                                </span>
                                <span className="contas-hierarchy-secondary-summary">
                                  <span>{grupoMes.abertas} aberta(s)</span>
                                  <span>{grupoMes.vencidas} vencida(s)</span>
                                  <span>{grupoMes.pagas} paga(s)</span>
                                </span>
                              </span>
                              <span className="contas-hierarchy-expand-control" aria-hidden="true">
                                {mesAberto ? '−' : '+'}
                              </span>
                            </button>

                            {mesAberto && (
                              <div className="contas-hierarchy-month-content" id={mesConteudoId}>
                                {grupoMes.contas.map((conta) => renderContaCard(conta))}
                              </div>
                            )}
                          </section>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
        {loadingConsultaContas && <div className="accounts-query-loading">Carregando resultados...</div>}
        {!loadingConsultaContas && haMaisContasConsulta && (filtroStatus === 'pagas' || filtroStatus === 'ocultas' || filtroStatus === 'excluidas' || modoBuscaGlobal) && (
          <button type="button" className="accounts-load-more" onClick={carregarMaisContas}>Carregar mais</button>
        )}
      </section>

      </>
    )
  }

  return (
    <>
      <PageHeader
        kicker="Financeiro"
        title="Contas"
        description="Controle vencimentos, baixas e contas por filial, centro de custo e período."
        className="page-title-actions accounts-page-header"
        actionsClassName="page-actions-row"
        actions={(
          <>
          {telaRetorno === 'controle-impostos' && (
            <button type="button" className="accounts-header-action" onClick={onVoltarOrigem}>Voltar ao Controle de Impostos</button>
          )}
          <button type="button" className="accounts-header-action" onClick={() => navegarPara('dashboard')}>Voltar ao Painel</button>
          {podeEditarFinanceiro && abrirNovaConta ? (
            <button type="button" className="accounts-header-action is-primary" onClick={abrirNovaConta}>Nova conta</button>
          ) : null}
          {podeExportarDados ? <ExportMenu
            disabled={loading || loadingConsultaContas || contasFiltradas.length === 0}
            options={[
              { id: 'pdf', label: 'PDF', onSelect: imprimirPDF },
              { id: 'excel', label: 'Excel', onSelect: exportarExcel },
              { id: 'csv', label: 'CSV', onSelect: exportarCSV },
            ]}
          /> : null}
          </>
        )}
      />
      {renderListaContasConteudo()}
      {contaEmBaixa && (
        <AccountPaymentModal
          conta={contaEmBaixa}
          formatarValor={formatarValor}
          formatarData={formatarData}
          limitarDataInput={limitarDataInput}
          modo={modoPagamento}
          onClose={fecharModalPagamento}
          onConfirm={confirmarBaixaConta}
        />
      )}
      {contaEmPagamentoParcial && (
        <AccountPartialPaymentModal
          conta={contaEmPagamentoParcial}
          formatarValor={formatarValor}
          limitarDataInput={limitarDataInput}
          listarPagamentos={listarPagamentosParciaisConta}
          estornarPagamento={estornarPagamentoParcial}
          baixarContaQuitada={baixarContaQuitadaPorParciais}
          onClose={() => setContaEmPagamentoParcial(null)}
          onConfirm={confirmarPagamentoParcial}
        />
      )}
    </>
  )
}
