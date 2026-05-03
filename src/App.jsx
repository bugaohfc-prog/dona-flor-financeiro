import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Relatorios from './pages/Relatorios'

export default function App() {
  // =========================
  // BLOCO 0 — UTILITÁRIOS
  // =========================
  function primeiraLetraMaiuscula(texto) {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) return '-'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function converterValor(valorDigitado) {
    return Number(String(valorDigitado).replace(',', '.'))
  }


  function formatarDataParaBanco(valor) {
    if (!valor) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const [dia, mes, ano] = valor.split('/')
      return `${ano}-${mes}-${dia}`
    }

    return valor
  }



  function estaVencida(data, status) {
    if (!data || status === 'pago') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(data + 'T00:00:00')
    vencimento.setHours(0, 0, 0, 0)
    return vencimento < hoje
  }

  function pegarMes(data) {
    if (!data) return ''
    return String(data).slice(0, 7)
  }

  function diasNaLixeira(dataExclusao) {
    if (!dataExclusao) return 0

    const excluidoEm = new Date(dataExclusao)
    const hoje = new Date()
    const diff = hoje - excluidoEm

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  function podeExcluirDefinitivo(dataExclusao) {
    return diasNaLixeira(dataExclusao) >= 60
  }

  function dataLocal(data) {
    if (!data) return null
    const valor = String(data).slice(0, 10)
    return new Date(valor + 'T00:00:00')
  }

  function diferencaDias(data) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const alvo = dataLocal(data)
    if (!alvo) return 999999

    const diff = alvo - hoje
    return Math.round(diff / (1000 * 60 * 60 * 24))
  }

  function mesmoMesAtual(data) {
    const alvo = dataLocal(data)
    if (!alvo) return false

    const hoje = new Date()
    return alvo.getMonth() === hoje.getMonth() && alvo.getFullYear() === hoje.getFullYear()
  }

  // =========================
  // BLOCO 1 — STATES CONTAS
  // =========================
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

  // =========================
  // BLOCO 2 — STATES NOTAS
  // =========================
  const [notas, setNotas] = useState([])
  const [notasLixeira, setNotasLixeira] = useState([])
  const [buscaNota, setBuscaNota] = useState('')
  const [modalNota, setModalNota] = useState(false)
  const [editandoNotaId, setEditandoNotaId] = useState(null)
  const [tituloNota, setTituloNota] = useState('')
  const [conteudoNota, setConteudoNota] = useState('')

  // =========================
  // BLOCO 3 — STATES CENTROS
  // =========================
  const [centros, setCentros] = useState([])
  const [modalCentro, setModalCentro] = useState(false)
  const [novoCentro, setNovoCentro] = useState('')

  // =========================
  // BLOCO 4 — MENU
  // =========================
  const [menuAberto, setMenuAberto] = useState(false)
  const [telaAtual, setTelaAtual] = useState('contas')
  const [configuracoes, setConfiguracoes] = useState(null)
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [configWhatsapp, setConfigWhatsapp] = useState(true)
  const [configEmail, setConfigEmail] = useState(true)
  const [configPush, setConfigPush] = useState(false)
  const [diasAvisoPadrao, setDiasAvisoPadrao] = useState('1')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [whatsappPadrao, setWhatsappPadrao] = useState('')
  const [emailPadrao, setEmailPadrao] = useState('')

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    await Promise.all([buscarContas(), buscarNotas(), buscarCentros(), buscarLixeira(), buscarConfiguracoes()])
    setLoading(false)
  }

  // =========================
  // BLOCO 5 — BUSCAS SUPABASE
  // =========================
  async function buscarContas() {
    const { data, error } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('excluido', false)
      .order('data_vencimento')

    if (error) {
      alert(error.message)
      return
    }

    setContas(data || [])
  }

  async function buscarNotas() {
    const { data, error } = await supabase
      .from('df_notas')
      .select('*')
      .eq('excluido', false)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setNotas(data || [])
  }



  async function buscarConfiguracoes() {
    const { data, error } = await supabase
      .from('df_configuracoes')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      alert(error.message)
      return
    }

    if (data) {
      setConfiguracoes(data)
      setNotificacoesAtivas(data.notificacoes_ativas ?? true)
      setConfigWhatsapp(data.enviar_whatsapp ?? true)
      setConfigEmail(data.enviar_email ?? true)
      setConfigPush(data.enviar_push ?? false)
      setDiasAvisoPadrao(String(data.dias_aviso_padrao ?? 1))
      setNomeEmpresa(data.nome_empresa || '')
      setWhatsappPadrao(data.whatsapp_padrao || '')
      setEmailPadrao(data.email_padrao || '')
      return
    }

    const { data: novaConfig, error: erroInsert } = await supabase
      .from('df_configuracoes')
      .insert([{
        notificacoes_ativas: true,
        enviar_whatsapp: true,
        enviar_email: true,
        enviar_push: false,
        dias_aviso_padrao: 1,
        nome_empresa: 'Dona Flor Financeiro'
      }])
      .select()
      .single()

    if (erroInsert) {
      alert(erroInsert.message)
      return
    }

    setConfiguracoes(novaConfig)
    setNotificacoesAtivas(novaConfig.notificacoes_ativas ?? true)
    setConfigWhatsapp(novaConfig.enviar_whatsapp ?? true)
    setConfigEmail(novaConfig.enviar_email ?? true)
    setConfigPush(novaConfig.enviar_push ?? false)
    setDiasAvisoPadrao(String(novaConfig.dias_aviso_padrao ?? 1))
    setNomeEmpresa(novaConfig.nome_empresa || '')
    setWhatsappPadrao(novaConfig.whatsapp_padrao || '')
    setEmailPadrao(novaConfig.email_padrao || '')
  }

  async function buscarLixeira() {
    const { data: contasExcluidas, error: erroContas } = await supabase
      .from('df_contas')
      .select('*, df_centros_custo(nome)')
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    const { data: notasExcluidas, error: erroNotas } = await supabase
      .from('df_notas')
      .select('*')
      .eq('excluido', true)
      .order('excluido_em', { ascending: false })

    if (erroContas) {
      alert(erroContas.message)
    }

    if (erroNotas) {
      alert(erroNotas.message)
    }

    setContasLixeira(contasExcluidas || [])
    setNotasLixeira(notasExcluidas || [])
  }

  async function buscarCentros() {
    const { data, error } = await supabase
      .from('df_centros_custo')
      .select('*')
      .order('nome')

    if (error) {
      alert(error.message)
      return
    }

    setCentros(data || [])
  }

  // =========================
  // BLOCO 6 — FILTROS / RESUMOS
  // =========================
  const contasFiltradas = contas
    .filter((conta) => {
      if (filtroStatus === 'pendentes') return conta.status !== 'pago'
      if (filtroStatus === 'pagas') return conta.status === 'pago'
      if (filtroStatus === 'vencidas') return estaVencida((conta.vencimento || conta.data_vencimento), conta.status)
      return true
    })
    .filter((conta) => !filtroCentro || conta.centro_custo_id === filtroCentro)
    .filter((conta) => !filtroMes || pegarMes((conta.vencimento || conta.data_vencimento)) === filtroMes)
    .filter((conta) => {
      if (dataInicial && (conta.vencimento || conta.data_vencimento) < dataInicial) return false
      if (dataFinal && (conta.vencimento || conta.data_vencimento) > dataFinal) return false
      return true
    })
    .filter((conta) =>
      String(conta.descricao || '').toLowerCase().includes(busca.toLowerCase())
    )

  const total = contasFiltradas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pago = contasFiltradas
    .filter((conta) => conta.status === 'pago')
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const vencido = contasFiltradas
    .filter((conta) => estaVencida((conta.vencimento || conta.data_vencimento), conta.status))
    .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

  const pendente = total - pago

  const resumoPorCentro = centros
    .map((centro) => {
      const lista = contasFiltradas.filter((conta) => conta.centro_custo_id === centro.id)
      const totalCentro = lista.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const pagoCentro = lista
        .filter((conta) => conta.status === 'pago')
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
      const vencidoCentro = lista
        .filter((conta) => estaVencida((conta.vencimento || conta.data_vencimento), conta.status))
        .reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

      return {
        id: centro.id,
        nome: centro.nome,
        total: totalCentro,
        pago: pagoCentro,
        pendente: totalCentro - pagoCentro,
        vencido: vencidoCentro
      }
    })
    .filter((centro) => centro.total > 0 || centro.pago > 0 || centro.pendente > 0 || centro.vencido > 0)

  const notasFiltradas = notas.filter((nota) =>
    `${nota.titulo || ''} ${nota.conteudo || ''}`
      .toLowerCase()
      .includes(buscaNota.toLowerCase())
  )

  // =========================
  // BLOCO 7 — AÇÕES CONTAS
  // =========================
  function abrirNovaConta() {
    setMenuAberto(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
    setModalConta(true)
  }

  function abrirEdicaoConta(conta) {
    setEditandoContaId(conta.id)
    setDescricao(conta.descricao || '')
    setValor(conta.valor || '')
    setDataVencimento((conta.vencimento || conta.data_vencimento) || '')
    setCentroCustoId(conta.centro_custo_id || '')
    setModalConta(true)
  }

  function fecharConta() {
    setModalConta(false)
    setEditandoContaId(null)
    setDescricao('')
    setValor('')
    setDataVencimento('')
    setCentroCustoId('')
  }

  async function salvarConta() {
    if (!descricao || !valor || !dataVencimento) {
      alert('Preencha descrição, valor e vencimento')
      return
    }

    const payload = {
      descricao: primeiraLetraMaiuscula(descricao.trim()),
      valor: converterValor(valor),
      data_vencimento: formatarDataParaBanco(dataVencimento),
      centro_custo_id: centroCustoId || null
    }

    let error

    if (editandoContaId) {
      const resposta = await supabase.from('df_contas').update(payload).eq('id', editandoContaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_contas').insert([{ ...payload, status: 'pendente' }])
      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharConta()
    buscarContas()
  }

  async function marcarComoPago(id) {
    await supabase.from('df_contas').update({ status: 'pago' }).eq('id', id)
    buscarContas()
  }

  async function voltarParaPendente(id) {
    await supabase.from('df_contas').update({ status: 'pendente' }).eq('id', id)
    buscarContas()
  }

  async function excluirConta(id) {
    if (!confirm('Mover conta para a lixeira? Ela ficará em quarentena por 60 dias.')) return

    const { error } = await supabase
      .from('df_contas')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    buscarContas()
    buscarLixeira()
  }

  // =========================
  // BLOCO 8 — AÇÕES NOTAS
  // =========================
  function abrirNovaNota() {
    setMenuAberto(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
    setModalNota(true)
  }

  function abrirEdicaoNota(nota) {
    setEditandoNotaId(nota.id)
    setTituloNota(nota.titulo || '')
    setConteudoNota(nota.conteudo || '')
    setModalNota(true)
  }

  function fecharNota() {
    setModalNota(false)
    setEditandoNotaId(null)
    setTituloNota('')
    setConteudoNota('')
  }

  async function salvarNota() {
    if (!tituloNota.trim()) {
      alert('Digite o título da nota')
      return
    }

    const payload = {
      titulo: primeiraLetraMaiuscula(tituloNota.trim()),
      conteudo: conteudoNota.trim()
    }

    let error

    if (editandoNotaId) {
      const resposta = await supabase.from('df_notas').update(payload).eq('id', editandoNotaId)
      error = resposta.error
    } else {
      const resposta = await supabase.from('df_notas').insert([payload])
      error = resposta.error
    }

    if (error) {
      alert(error.message)
      return
    }

    fecharNota()
    buscarNotas()
  }

  async function excluirNota(id) {
    if (!confirm('Mover nota para a lixeira? Ela ficará em quarentena por 60 dias.')) return

    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: true,
        excluido_em: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
    buscarLixeira()
  }



  // =========================
  // BLOCO — AÇÕES CONFIGURAÇÕES
  // =========================
  async function salvarConfiguracoes() {
    const dias = Number(diasAvisoPadrao)

    if (isNaN(dias) || dias < 0) {
      alert('Informe uma quantidade válida de dias de aviso.')
      return
    }

    const payload = {
      notificacoes_ativas: notificacoesAtivas,
      enviar_whatsapp: configWhatsapp,
      enviar_email: configEmail,
      enviar_push: configPush,
      dias_aviso_padrao: dias,
      nome_empresa: nomeEmpresa.trim() || null,
      whatsapp_padrao: whatsappPadrao.trim() || null,
      email_padrao: emailPadrao.trim() || null
    }

    let resposta

    if (configuracoes?.id) {
      resposta = await supabase
        .from('df_configuracoes')
        .update(payload)
        .eq('id', configuracoes.id)
        .select()
        .single()
    } else {
      resposta = await supabase
        .from('df_configuracoes')
        .insert([payload])
        .select()
        .single()
    }

    if (resposta.error) {
      alert(resposta.error.message)
      return
    }

    setConfiguracoes(resposta.data)
    alert('Configurações salvas com sucesso!')
  }

  // =========================
  // BLOCO 9 — AÇÕES LIXEIRA
  // =========================
  async function restaurarConta(id) {
    const { error } = await supabase
      .from('df_contas')
      .update({
        excluido: false,
        excluido_em: null
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    buscarContas()
    buscarLixeira()
  }

  async function restaurarNota(id) {
    const { error } = await supabase
      .from('df_notas')
      .update({
        excluido: false,
        excluido_em: null
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    buscarNotas()
    buscarLixeira()
  }

  async function excluirContaDefinitivo(conta) {
    if (!podeExcluirDefinitivo(conta.excluido_em)) {
      alert('Essa conta ainda está em quarentena. Só pode excluir definitivamente após 60 dias.')
      return
    }

    if (!confirm('Excluir conta definitivamente? Essa ação não poderá ser desfeita.')) return

    const { error } = await supabase
      .from('df_contas')
      .delete()
      .eq('id', conta.id)

    if (error) {
      alert(error.message)
      return
    }

    buscarLixeira()
  }

  async function excluirNotaDefinitivo(nota) {
    if (!podeExcluirDefinitivo(nota.excluido_em)) {
      alert('Essa nota ainda está em quarentena. Só pode excluir definitivamente após 60 dias.')
      return
    }

    if (!confirm('Excluir nota definitivamente? Essa ação não poderá ser desfeita.')) return

    const { error } = await supabase
      .from('df_notas')
      .delete()
      .eq('id', nota.id)

    if (error) {
      alert(error.message)
      return
    }

    buscarLixeira()
  }

  // =========================
  // BLOCO 10 — AÇÕES CENTROS
  // =========================
  async function salvarCentro() {
    if (!novoCentro.trim()) {
      alert('Digite o centro de custo')
      return
    }

    const { error } = await supabase
      .from('df_centros_custo')
      .insert([{ nome: primeiraLetraMaiuscula(novoCentro.trim()) }])

    if (error) {
      alert(error.message)
      return
    }

    setNovoCentro('')
    buscarCentros()
  }

  async function excluirCentro(id) {
    if (!confirm('Excluir centro?')) return

    const { error } = await supabase
      .from('df_centros_custo')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Não foi possível excluir. Verifique se existem contas usando este centro.')
      return
    }

    buscarCentros()
    buscarContas()
  }

  // =========================
  // BLOCO 10 — EXPORTAÇÕES
  // =========================
  function exportarCSV() {
    const cabecalho = ['Descricao', 'Valor', 'Vencimento', 'Status', 'Centro']
    const linhas = contasFiltradas.map((conta) => [
      conta.descricao || '',
      Number(conta.valor || 0).toFixed(2).replace('.', ','),
      formatarData((conta.vencimento || conta.data_vencimento)),
      estaVencida((conta.vencimento || conta.data_vencimento), conta.status) ? 'vencido' : conta.status,
      conta.df_centros_custo?.nome || ''
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio-contas.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  function imprimirPDF() {
    window.print()
  }

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('todas')
    setFiltroCentro('')
    setFiltroMes('')
    setDataInicial('')
    setDataFinal('')
  }

  if (telaAtual === 'relatorios') {
    return (
      <Relatorios voltar={() => setTelaAtual('contas')} />
    )
  }




  if (telaAtual === 'configuracoes') {
    return (
      <div style={styles.page}>
        <h1 style={styles.titulo}>⚙️ Configurações</h1>

        <button style={styles.btnCinza} onClick={() => setTelaAtual('contas')}>
          ← Voltar
        </button>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>🔔 Notificações</h2>

          <label style={styles.switchLinha}>
            <div>
              <strong>Notificações ativas</strong>
              <small>Controle geral dos disparos automáticos.</small>
            </div>

            <input
              type="checkbox"
              checked={notificacoesAtivas}
              onChange={(e) => setNotificacoesAtivas(e.target.checked)}
            />
          </label>

          <label style={styles.switchLinha}>
            <div>
              <strong>WhatsApp</strong>
              <small>Permitir disparos por WhatsApp.</small>
            </div>

            <input
              type="checkbox"
              checked={configWhatsapp}
              onChange={(e) => setConfigWhatsapp(e.target.checked)}
            />
          </label>

          <label style={styles.switchLinha}>
            <div>
              <strong>E-mail</strong>
              <small>Permitir disparos por e-mail.</small>
            </div>

            <input
              type="checkbox"
              checked={configEmail}
              onChange={(e) => setConfigEmail(e.target.checked)}
            />
          </label>

          <label style={styles.switchLinha}>
            <div>
              <strong>Push mobile</strong>
              <small>Preparado para notificação web/PWA.</small>
            </div>

            <input
              type="checkbox"
              checked={configPush}
              onChange={(e) => setConfigPush(e.target.checked)}
            />
          </label>

          <input
            style={styles.input}
            type="number"
            min="0"
            placeholder="Dias padrão de aviso"
            value={diasAvisoPadrao}
            onChange={(e) => setDiasAvisoPadrao(e.target.value)}
          />
        </section>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>🏢 Dados do negócio</h2>

          <input
            style={styles.input}
            placeholder="Nome da empresa"
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="WhatsApp padrão. Ex: 5511999999999"
            value={whatsappPadrao}
            onChange={(e) => setWhatsappPadrao(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="E-mail padrão"
            value={emailPadrao}
            onChange={(e) => setEmailPadrao(e.target.value)}
          />
        </section>

        <section style={styles.cardConfiguracao}>
          <h2 style={styles.subtitulo}>🧠 Como o sistema vai usar</h2>

          <p style={styles.textoNota}>
            O envio automático só acontecerá quando a configuração global estiver ativa
            e a conta também estiver marcada para receber aviso.
          </p>

          <div style={styles.configResumo}>
            <span>Geral: {notificacoesAtivas ? 'Ligado' : 'Desligado'}</span>
            <span>WhatsApp: {configWhatsapp ? 'Ligado' : 'Desligado'}</span>
            <span>E-mail: {configEmail ? 'Ligado' : 'Desligado'}</span>
            <span>Push: {configPush ? 'Ligado' : 'Desligado'}</span>
          </div>
        </section>

        <button style={styles.btnSalvar} onClick={salvarConfiguracoes}>
          Salvar configurações
        </button>
      </div>
    )
  }

  if (telaAtual === 'agenda') {
    const contasAgenda = [...contas]
      .filter((conta) => conta.status !== 'pago')
      .sort((a, b) => dataLocal(a.data_vencimento) - dataLocal(b.data_vencimento))

    const contasVencidas = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) < 0)
    const contasHoje = contasAgenda.filter((conta) => diferencaDias(conta.data_vencimento) === 0)
    const contasSemana = contasAgenda.filter((conta) => {
      const dias = diferencaDias(conta.data_vencimento)
      return dias > 0 && dias <= 7
    })
    const contasMes = contasAgenda.filter((conta) => {
      const dias = diferencaDias(conta.data_vencimento)
      return dias > 7 && mesmoMesAtual(conta.data_vencimento)
    })

    const totalVencidasAgenda = contasVencidas.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalHojeAgenda = contasHoje.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalSemanaAgenda = contasSemana.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)
    const totalMesAgenda = contasMes.reduce((acc, conta) => acc + Number(conta.valor || 0), 0)

    function CardAgenda({ titulo, total, lista, cor }) {
      return (
        <section style={styles.cardAgenda}>
          <div style={styles.cardTopo}>
            <strong>{titulo}</strong>
            <span>{formatarValor(total)}</span>
          </div>

          {lista.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma conta nesta agenda.</p>
          )}

          {lista.map((conta) => {
            const dias = diferencaDias(conta.data_vencimento)

            return (
              <div key={conta.id} style={{ ...styles.itemAgenda, borderLeft: `5px solid ${cor}` }}>
                <div>
                  <strong>{conta.descricao}</strong>
                  <div style={styles.cardInfo}>
                    {formatarData(conta.data_vencimento)} • {conta.df_centros_custo?.nome || 'Sem centro'}
                  </div>

                  <small style={dias < 0 ? styles.textoVencidoAgenda : styles.textoAgenda}>
                    {dias < 0
                      ? `Vencida há ${Math.abs(dias)} dia(s)`
                      : dias === 0
                        ? 'Vence hoje'
                        : `Vence em ${dias} dia(s)`}
                  </small>
                </div>

                <div style={styles.agendaDireita}>
                  <strong>{formatarValor(conta.valor)}</strong>

                  <button style={styles.btnPago} onClick={() => marcarComoPago(conta.id)}>
                    Pago
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )
    }

    return (
      <div style={styles.page}>
        <h1 style={styles.titulo}>📅 Agenda Financeira</h1>

        <button style={styles.btnCinza} onClick={() => setTelaAtual('contas')}>
          ← Voltar
        </button>

        <section style={styles.resumo}>
          <div style={styles.boxVencido}>
            <span>Vencidas</span>
            <strong>{formatarValor(totalVencidasAgenda)}</strong>
          </div>

          <div style={styles.boxPendente}>
            <span>Hoje</span>
            <strong>{formatarValor(totalHojeAgenda)}</strong>
          </div>

          <div style={styles.boxTotal}>
            <span>7 dias</span>
            <strong>{formatarValor(totalSemanaAgenda)}</strong>
          </div>

          <div style={styles.boxPago}>
            <span>Mês</span>
            <strong>{formatarValor(totalMesAgenda)}</strong>
          </div>
        </section>

        <CardAgenda
          titulo="🚨 Vencidas"
          total={totalVencidasAgenda}
          lista={contasVencidas}
          cor="#dc3545"
        />

        <CardAgenda
          titulo="📌 Vencem hoje"
          total={totalHojeAgenda}
          lista={contasHoje}
          cor="#ffc107"
        />

        <CardAgenda
          titulo="🗓️ Próximos 7 dias"
          total={totalSemanaAgenda}
          lista={contasSemana}
          cor="#0d6efd"
        />

        <CardAgenda
          titulo="📆 Restante do mês"
          total={totalMesAgenda}
          lista={contasMes}
          cor="#198754"
        />
      </div>
    )
  }

  if (telaAtual === 'lixeira') {
    return (
      <div style={styles.page}>
        <h1 style={styles.titulo}>🗑️ Lixeira</h1>

        <button style={styles.btnCinza} onClick={() => setTelaAtual('contas')}>
          ← Voltar
        </button>

        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>💰 Contas excluídas</h2>

          {contasLixeira.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma conta na lixeira.</p>
          )}

          {contasLixeira.map((conta) => {
            const dias = diasNaLixeira(conta.excluido_em)
            const liberada = podeExcluirDefinitivo(conta.excluido_em)

            return (
              <div key={conta.id} style={styles.cardLixeira}>
                <div style={styles.cardTopo}>
                  <strong>{conta.descricao}</strong>
                  <span>{formatarValor(conta.valor)}</span>
                </div>

                <div style={styles.cardInfo}>
                  Venc.: {formatarData(conta.data_vencimento)} •
                  Centro: {conta.df_centros_custo?.nome || 'Sem centro'} •
                  Lixeira há {dias} dia(s)
                </div>

                <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  {liberada
                    ? 'Liberada para exclusão definitiva'
                    : `Quarentena: faltam ${60 - dias} dia(s)`}
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => restaurarConta(conta.id)}>
                    Restaurar
                  </button>

                  <button style={styles.btnExcluir} onClick={() => excluirContaDefinitivo(conta)}>
                    Excluir definitivo
                  </button>
                </div>
              </div>
            )
          })}
        </section>

        <section style={styles.bloco}>
          <h2 style={styles.subtitulo}>📝 Notas excluídas</h2>

          {notasLixeira.length === 0 && (
            <p style={styles.mensagemVazia}>Nenhuma nota na lixeira.</p>
          )}

          {notasLixeira.map((nota) => {
            const dias = diasNaLixeira(nota.excluido_em)
            const liberada = podeExcluirDefinitivo(nota.excluido_em)

            return (
              <div key={nota.id} style={styles.cardLixeira}>
                <strong>{nota.titulo}</strong>

                {nota.conteudo && (
                  <p style={styles.textoNota}>{nota.conteudo}</p>
                )}

                <small style={liberada ? styles.textoLiberado : styles.textoQuarentena}>
                  {liberada
                    ? 'Liberada para exclusão definitiva'
                    : `Quarentena: faltam ${60 - dias} dia(s)`}
                </small>

                <div style={styles.acoes}>
                  <button style={styles.btnPago} onClick={() => restaurarNota(nota.id)}>
                    Restaurar
                  </button>

                  <button style={styles.btnExcluir} onClick={() => excluirNotaDefinitivo(nota)}>
                    Excluir definitivo
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  // =========================
  // BLOCO 11 — UI
  // =========================
  return (
    <div className="app-page" style={styles.page}>
      <style>
        {`
          .print-header,
          .print-footer {
            display: none;
          }

          @media print {
            html,
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }

            .app-page {
              min-height: auto !important;
              padding-bottom: 0 !important;
              background: #ffffff !important;
            }

            button,
            .no-print {
              display: none !important;
            }

            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 14px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }

            .print-header h1 {
              font-size: 20px;
              margin: 0 0 4px 0;
            }

            .print-header p {
              font-size: 11px;
              margin: 0;
              color: #555;
            }

            .print-footer {
              display: block !important;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 6px;
              background: #fff;
            }

            .print-card {
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              border: 1px solid #ddd;
            }

            @page {
              size: A4;
              margin: 12mm 12mm 18mm 12mm;
            }
          }
        `}
      </style>

      <div className="print-header">
        <h1>Relatório Financeiro</h1>
        <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="print-footer">
        Relatório gerado pelo Sistema Dona Flor Financeiro
      </div>

      <section>
        <h1 style={styles.titulo}>📊 Contas a Pagar</h1>

        <div style={styles.resumo}>
          <div style={styles.boxTotal}>
            <span>Total</span>
            <strong>{formatarValor(total)}</strong>
          </div>

          <div style={styles.boxPago}>
            <span>Pago</span>
            <strong>{formatarValor(pago)}</strong>
          </div>

          <div style={styles.boxPendente}>
            <span>Pendente</span>
            <strong>{formatarValor(pendente)}</strong>
          </div>

          <div style={styles.boxVencido}>
            <span>Vencido</span>
            <strong>{formatarValor(vencido)}</strong>
          </div>
        </div>
      </section>

      <section className="no-print" style={styles.filtrosBox}>
        <input
          style={styles.input}
          placeholder="Buscar conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div style={styles.filtros}>
          <button style={filtroStatus === 'todas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('todas')}>Todas</button>
          <button style={filtroStatus === 'pendentes' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pendentes')}>Pendentes</button>
          <button style={filtroStatus === 'pagas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('pagas')}>Pagas</button>
          <button style={filtroStatus === 'vencidas' ? styles.filtroAtivo : styles.filtro} onClick={() => setFiltroStatus('vencidas')}>Vencidas</button>
        </div>

        <select
          style={styles.input}
          value={filtroCentro}
          onChange={(e) => setFiltroCentro(e.target.value)}
        >
          <option value="">Todos os centros</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nome}
            </option>
          ))}
        </select>

        <input
          style={styles.input}
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />

        <div style={styles.datas}>
          <input
            style={styles.input}
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />

          <input
            style={styles.input}
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>

        <div style={styles.acoes}>
          <button style={styles.btnCinza} onClick={limparFiltros}>Limpar</button>
          <button style={styles.btnRoxo} onClick={imprimirPDF}>PDF</button>
          <button style={styles.btnVerde} onClick={exportarCSV}>CSV/Editável</button>
        </div>
      </section>

      <section style={styles.resumoFiltro}>
        <strong>Resultado filtrado</strong>
        <span>{contasFiltradas.length} conta(s) • Total {formatarValor(total)}</span>
        <small>
          Centro: {filtroCentro ? centros.find((centro) => centro.id === filtroCentro)?.nome || 'Selecionado' : 'Todos'} •
          Status: {filtroStatus} •
          Mês: {filtroMes || 'Todos'}
        </small>
      </section>

      <section style={styles.bloco}>
        {loading && <p>Carregando...</p>}

        {contasFiltradas.map((conta) => {
          const vencida = estaVencida((conta.vencimento || conta.data_vencimento), conta.status)

          return (
            <div
              className="print-card"
              key={conta.id}
              style={{
                ...styles.cardConta,
                background:
                  conta.status === 'pago'
                    ? '#d4edda'
                    : vencida
                      ? '#ffb3b3'
                      : '#fff3cd'
              }}
            >
              <div style={styles.cardTopo}>
                <strong>{conta.descricao}</strong>
                <span>{formatarValor(conta.valor)}</span>
              </div>

              <div style={styles.cardInfo}>
                {formatarData((conta.vencimento || conta.data_vencimento))} • {conta.df_centros_custo?.nome || '-'} • {vencida ? 'VENCIDO' : conta.status}
              </div>

              <div style={styles.acoes}>
                {conta.status !== 'pago' ? (
                  <button style={styles.btnPago} onClick={() => marcarComoPago(conta.id)}>
                    Pago
                  </button>
                ) : (
                  <button style={styles.btnVoltar} onClick={() => voltarParaPendente(conta.id)}>
                    Voltar
                  </button>
                )}

                <button style={styles.btnEditar} onClick={() => abrirEdicaoConta(conta)}>
                  Editar
                </button>

                <button style={styles.btnExcluir} onClick={() => excluirConta(conta.id)}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </section>

      <section className="no-print" style={styles.bloco}>
        <h2 style={styles.subtitulo}>📝 Bloco de Notas</h2>

        <input
          style={styles.input}
          placeholder="Buscar nota..."
          value={buscaNota}
          onChange={(e) => setBuscaNota(e.target.value)}
        />

        {notasFiltradas.length === 0 && (
          <p style={styles.mensagemVazia}>Nenhuma nota encontrada.</p>
        )}

        {notasFiltradas.map((nota) => (
          <div key={nota.id} style={styles.cardNota}>
            <strong>{nota.titulo}</strong>

            {nota.conteudo && (
              <p style={styles.textoNota}>{nota.conteudo}</p>
            )}

            <div style={styles.acoes}>
              <button style={styles.btnEditar} onClick={() => abrirEdicaoNota(nota)}>
                Editar
              </button>

              <button style={styles.btnExcluir} onClick={() => excluirNota(nota.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>

      {menuAberto && (
        <div style={styles.menuFab}>
          <button style={styles.menuItem} onClick={abrirNovaConta}>💰 Nova conta</button>
          <button style={styles.menuItem} onClick={abrirNovaNota}>📝 Nova nota</button>
          <button
            style={styles.menuItem}
            onClick={() => {
              setMenuAberto(false)
              setTelaAtual('relatorios')
            }}
          >
            📊 Relatórios
          </button>

          <button
            style={styles.menuItem}
            onClick={() => {
              setMenuAberto(false)
              setTelaAtual('agenda')
            }}
          >
            📅 Agenda
          </button>

          <button
            style={styles.menuItem}
            onClick={() => {
              setMenuAberto(false)
              setTelaAtual('lixeira')
            }}
          >
            🗑️ Lixeira
          </button>

          <button
            style={styles.menuItem}
            onClick={() => {
              setMenuAberto(false)
              setModalCentro(true)
            }}
          >
            🏷 Centro
          </button>
        </div>
      )}

      <button style={styles.fab} onClick={() => setMenuAberto(!menuAberto)}>
        {menuAberto ? '×' : '+'}
      </button>

      {modalConta && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoContaId ? 'Editar Conta' : 'Nova Conta'}</h3>

            <input style={styles.inputModal} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(primeiraLetraMaiuscula(e.target.value))} />
            <input style={styles.inputModal} placeholder="Valor. Ex: 150,90" value={valor} onChange={(e) => setValor(e.target.value)} />
            <input style={styles.inputModal} type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />

            <select style={styles.inputModal} value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)}>
              <option value="">Centro de custo</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>{centro.nome}</option>
              ))}
            </select>

            <button style={styles.btnSalvar} onClick={salvarConta}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharConta}>Cancelar</button>
          </div>
        </div>
      )}

      {modalNota && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{editandoNotaId ? 'Editar Nota' : 'Nova Nota'}</h3>

            <input style={styles.inputModal} placeholder="Título" value={tituloNota} onChange={(e) => setTituloNota(primeiraLetraMaiuscula(e.target.value))} />
            <textarea style={styles.textareaModal} placeholder="Conteúdo..." value={conteudoNota} onChange={(e) => setConteudoNota(e.target.value)} />

            <button style={styles.btnSalvar} onClick={salvarNota}>Salvar</button>
            <button style={styles.btnCancelar} onClick={fecharNota}>Cancelar</button>
          </div>
        </div>
      )}

      {modalCentro && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Centros de Custo</h3>

            <input style={styles.inputModal} placeholder="Novo centro" value={novoCentro} onChange={(e) => setNovoCentro(primeiraLetraMaiuscula(e.target.value))} />
            <button style={styles.btnSalvar} onClick={salvarCentro}>Salvar Centro</button>

            {centros.map((centro) => (
              <div key={centro.id} style={styles.itemCentro}>
                <span>{centro.nome}</span>
                <button style={styles.btnMiniExcluir} onClick={() => excluirCentro(centro.id)}>excluir</button>
              </div>
            ))}

            <button style={styles.btnCancelar} onClick={() => setModalCentro(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// =========================
// BLOCO 12 — STYLES
// =========================
const styles = {
  page: {
    padding: 16,
    maxWidth: 700,
    margin: 'auto',
    fontFamily: 'Arial',
    background: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: 100
  },
  titulo: { fontSize: 28, marginBottom: 12 },
  subtitulo: { fontSize: 22, marginBottom: 12 },
  bloco: { marginTop: 24 },
  resumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 12
  },
  boxTotal: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  boxPago: {
    background: '#d4edda',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxPendente: {
    background: '#fff3cd',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  boxVencido: {
    background: '#f8d7da',
    padding: 12,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  filtrosBox: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginBottom: 8,
    boxSizing: 'border-box'
  },
  datas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8
  },
  filtros: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8
  },
  filtro: {
    border: '1px solid #ccc',
    background: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },
  filtroAtivo: {
    border: 'none',
    background: '#0d6efd',
    color: '#fff',
    padding: '7px 11px',
    borderRadius: 8
  },
  resumoFiltro: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 14
  },
  cardConta: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 18,
    marginBottom: 4
  },
  cardInfo: {
    fontSize: 13,
    opacity: 0.75
  },
  cardDashboard: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 6,
    fontSize: 13
  },
  cardConfiguracao: {
    background: '#fff',
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  switchLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  configResumo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontSize: 13,
    background: '#f8f9fa',
    padding: 10,
    borderRadius: 10
  },
  cardAgenda: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  itemAgenda: {
    background: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  agendaDireita: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6
  },
  textoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#444',
    fontWeight: 'bold'
  },
  textoVencidoAgenda: {
    display: 'block',
    marginTop: 5,
    color: '#dc3545',
    fontWeight: 'bold'
  },
  cardLixeira: {
    background: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    border: '1px solid #ddd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  textoQuarentena: {
    display: 'block',
    marginTop: 8,
    color: '#856404',
    fontWeight: 'bold'
  },
  textoLiberado: {
    display: 'block',
    marginTop: 8,
    color: '#198754',
    fontWeight: 'bold'
  },
  cardNota: {
    background: '#eef2ff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  textoNota: {
    fontSize: 14,
    whiteSpace: 'pre-wrap'
  },
  acoes: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8
  },
  mensagemVazia: {
    fontSize: 13,
    opacity: 0.7
  },
  btnPago: {
    background: '#0d6efd',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnVoltar: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnEditar: {
    background: '#ffc107',
    color: '#111',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 8
  },
  btnCinza: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnRoxo: {
    background: '#6f42c1',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  btnVerde: {
    background: '#198754',
    color: '#fff',
    border: 'none',
    padding: '7px 10px',
    borderRadius: 8
  },
  fab: {
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: '#198754',
    color: '#fff',
    border: 'none',
    fontSize: 30,
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
    zIndex: 20
  },
  menuFab: {
    position: 'fixed',
    right: 20,
    bottom: 86,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 19
  },
  menuItem: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    textAlign: 'left'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999
  },
  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 14,
    width: '100%',
    maxWidth: 360
  },
  inputModal: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  textareaModal: {
    width: '100%',
    minHeight: 110,
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontFamily: 'Arial'
  },
  btnSalvar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#198754',
    color: '#fff',
    marginBottom: 8
  },
  btnCancelar: {
    width: '100%',
    padding: 10,
    border: 'none',
    borderRadius: 8,
    background: '#6c757d',
    color: '#fff'
  },
  itemCentro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f1f1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    fontSize: 13
  },
  btnMiniExcluir: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 7px',
    fontSize: 11
  }
}
