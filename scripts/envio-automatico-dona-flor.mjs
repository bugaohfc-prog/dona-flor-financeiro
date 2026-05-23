import net from 'node:net'
import tls from 'node:tls'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'

const TIME_ZONE = process.env.TZ || 'America/Sao_Paulo'
const SUPABASE_URL = requiredEnv('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
const DRY_RUN = parseDryRun(process.env.DRY_RUN)
const MAIL_TO_FALLBACK = cleanString(process.env.MAIL_TO_FALLBACK)
const ALERTA_TIPO = resolveTipoAlerta(process.env.ALERTA_TIPO, new Date(), TIME_ZONE)
const APP_URL = 'https://dona-flor-financeiro.vercel.app/'
const LIMITE_ALTO_VALOR = 1000
const EMAILS_BLOQUEADOS = new Set(['bugaohfc@gmail.com'])

const supabaseBaseUrl = SUPABASE_URL.replace(/\/+$/, '')
const hoje = dateInTimeZone(new Date(), TIME_ZONE)
const amanha = addDaysIso(hoje, 1)

main().catch((error) => {
  console.error('[envio-automatico] falha_geral', safeError(error))
  process.exitCode = 1
})

async function main() {
  console.log('[envio-automatico] inicio', JSON.stringify({
    dry_run: DRY_RUN,
    timezone: TIME_ZONE,
    data: hoje,
    tipo: ALERTA_TIPO || 'HOJE'
  }))

  const configuracoes = await fetchSupabase('df_configuracoes', {
    select: 'empresa_id,notificacoes_ativas,enviar_email,email_padrao,nome_empresa',
    notificacoes_ativas: 'eq.true',
    enviar_email: 'eq.true'
  })

  const configuracoesValidas = configuracoes.filter((config) => cleanString(config?.empresa_id))

  if (configuracoesValidas.length === 0) {
    console.log('[envio-automatico] nenhuma_empresa_configurada')
    return
  }

  const empresaIds = unique(configuracoesValidas.map((config) => config.empresa_id))
  const [empresasPorId, alertasPorEmpresa] = await Promise.all([
    buscarEmpresasPorId(empresaIds),
    buscarAlertasPorEmpresa(empresaIds)
  ])

  let empresasComAlerta = 0

  for (const config of configuracoesValidas) {
    const resultado = await processarEmpresa(config, empresasPorId.get(config.empresa_id), alertasPorEmpresa.get(config.empresa_id))
    if (resultado?.enviar) empresasComAlerta += 1
  }

  console.log('[envio-automatico] fim', JSON.stringify({
    empresas_avaliadas: configuracoesValidas.length,
    empresas_com_alerta: empresasComAlerta
  }))
}

async function processarEmpresa(config, empresa, alertas) {
  const empresaId = config.empresa_id
  const diasAlertaContas = normalizeInteger(alertas?.dias_alerta_contas, 1)
  const diasAlertaNotas = normalizeInteger(alertas?.dias_alerta_notas, 3)

  const [contas, notas, destinatariosUsuarios] = await Promise.all([
    buscarContasEmpresa(empresaId, addDaysIso(hoje, Math.max(1, diasAlertaContas))),
    buscarNotasEmpresa(empresaId),
    buscarDestinatariosUsuariosEmpresa(empresaId)
  ])

  const destinatarios = destinatariosUsuarios.length > 0
    ? destinatariosUsuarios
    : fallbackDestinatarios(config.email_padrao)

  if (destinatarios.length === 0) {
    console.warn('[envio-automatico] empresa_sem_destinatario', JSON.stringify({
      empresa_id: empresaId,
      empresa_nome: safeName(empresa?.nome || config.nome_empresa),
      status: 'skip_sem_destinatario'
    }))
    return { enviar: false }
  }

  const resumoContas = resumirContas(contas)
  const notasResumo = resumirNotas(notas, addDaysIso(hoje, diasAlertaNotas))
  const mensagem = montarMensagemDryRun({
    tipo: ALERTA_TIPO,
    empresaNome: empresa?.nome || config.nome_empresa || 'Empresa',
    resumoContas,
    notasResumo
  })

  if (!mensagem.enviar) {
    console.log('[envio-automatico] envio_cancelado', JSON.stringify({
      empresa_id: empresaId,
      empresa_nome: safeName(empresa?.nome || config.nome_empresa),
      motivo: mensagem.motivo,
      destinatarios_total: destinatarios.length,
      status: 'dry_run_sem_envio'
    }))
    return { enviar: false }
  }

  let envio
  try {
    envio = await sendEmail({
      to: destinatarios,
      subject: mensagem.subject,
      html: mensagem.html,
      text: mensagem.texto
    })
  } catch (error) {
    console.error('[envio-automatico] erro_smtp', JSON.stringify({
      empresa_id: empresaId,
      empresa_nome: safeName(empresa?.nome || config.nome_empresa),
      erro: safeError(error)
    }))
    throw error
  }

  console.log('[envio-automatico] empresa_processada', JSON.stringify({
    empresa_id: empresaId,
    empresa_nome: safeName(empresa?.nome || config.nome_empresa),
    tipo: mensagem.tipo || 'HOJE',
    subject: mensagem.subject,
    contas_hoje: resumoContas.hoje.length,
    contas_amanha: resumoContas.amanha.length,
    contas_vencidas: resumoContas.vencidas.length,
    contas_alto_valor: resumoContas.altoValor.length,
    notas_urgentes: notasResumo.urgentes.length,
    notas_pendentes: notasResumo.pendentes.length,
    destinatario: maskEmail(destinatarios[0]?.email || destinatarios[0]),
    destinatarios: destinatarios.map((destinatario) => maskEmail(destinatario?.email || destinatario)),
    destinatarios_total: destinatarios.length,
    message_id: envio?.messageId || null,
    status: envio?.dryRun ? 'dry_run_ok' : 'enviado'
  }))

  return { enviar: true }
}

async function buscarEmpresasPorId(empresaIds) {
  if (empresaIds.length === 0) return new Map()

  const empresas = await fetchSupabase('df_empresas', {
    select: 'id,nome',
    id: `in.(${empresaIds.join(',')})`
  })

  return new Map(empresas.map((empresa) => [empresa.id, empresa]))
}

async function buscarAlertasPorEmpresa(empresaIds) {
  if (empresaIds.length === 0) return new Map()

  try {
    const alertas = await fetchSupabase('df_configuracoes_alertas', {
      select: 'empresa_id,dias_alerta_contas,dias_alerta_notas',
      empresa_id: `in.(${empresaIds.join(',')})`
    })

    return new Map(alertas.map((alerta) => [alerta.empresa_id, alerta]))
  } catch (error) {
    console.warn('[envio-automatico] aviso_alertas_indisponiveis', JSON.stringify({ erro: safeError(error) }))
    return new Map()
  }
}

async function buscarDestinatariosUsuariosEmpresa(empresaId) {
  try {
    const usuarios = await fetchSupabase('df_usuarios_empresas', {
      select: 'user_id,email,nome,perfil,empresa_id',
      empresa_id: `eq.${empresaId}`
    })

    return filtrarDestinatariosUsuarios(usuarios)
  } catch (error) {
    console.warn('[envio-automatico] aviso_usuarios_nao_avaliados', JSON.stringify({
      empresa_id: empresaId,
      erro: safeError(error)
    }))
    return []
  }
}

async function buscarContasEmpresa(empresaId, dataLimite) {
  const parametros = {
    empresa_id: `eq.${empresaId}`,
    data_vencimento: `lte.${dataLimite}`,
    or: '(excluido.is.null,excluido.eq.false)'
  }

  try {
    return await fetchSupabase('df_contas', {
      select: 'id,descricao,valor,data_vencimento,vencimento,status,empresa_id,excluido',
      ...parametros
    })
  } catch (error) {
    if (!isSchemaError(error)) throw error

    console.warn('[envio-automatico] aviso_contas_sem_vencimento_legado', JSON.stringify({
      empresa_id: empresaId,
      erro: safeError(error)
    }))

    return fetchSupabase('df_contas', {
      select: 'id,descricao,valor,data_vencimento,status,empresa_id,excluido',
      ...parametros
    })
  }
}

async function buscarNotasEmpresa(empresaId) {
  try {
    return await fetchSupabase('df_notas', {
      select: 'id,empresa_id,data_evento,concluida,excluido,prioridade',
      empresa_id: `eq.${empresaId}`,
      excluido: 'eq.false'
    })
  } catch (error) {
    if (!isSchemaError(error)) throw error

    console.warn('[envio-automatico] aviso_notas_schema_atual_reduzido', JSON.stringify({
      empresa_id: empresaId,
      erro: safeError(error)
    }))
  }

  try {
    return await fetchSupabase('df_notas', {
      select: 'id,empresa_id,data_evento,concluida,excluido',
      empresa_id: `eq.${empresaId}`,
      excluido: 'eq.false'
    })
  } catch (error) {
    console.warn('[envio-automatico] aviso_notas_schema_atual_indisponivel', JSON.stringify({
      empresa_id: empresaId,
      erro: safeError(error)
    }))
  }

  try {
    return await fetchSupabase('df_notas', {
      select: 'id,empresa_id,data_lembrete,deletado,status,prioridade',
      empresa_id: `eq.${empresaId}`,
      deletado: 'eq.false'
    })
  } catch (error) {
    console.warn('[envio-automatico] aviso_notas_nao_avaliadas', JSON.stringify({
      empresa_id: empresaId,
      erro: safeError(error)
    }))
    return []
  }
}

function filtrarDestinatariosUsuarios(usuarios) {
  return usuarios
    .map((usuario) => ({
      email: cleanString(usuario?.email).toLowerCase(),
      nome: cleanString(usuario?.nome),
      perfil: normalizeText(usuario?.perfil)
    }))
    .filter((usuario) => {
      if (!usuario.email) return false
      if (EMAILS_BLOQUEADOS.has(usuario.email)) return false
      if (['master', 'superadmin', 'super_admin'].includes(usuario.perfil)) return false
      return true
    })
}

function fallbackDestinatarios(emailPadrao) {
  const fallback = cleanString(emailPadrao) || (DRY_RUN ? MAIL_TO_FALLBACK : '')
  return fallback ? [{ email: fallback, nome: '' }] : []
}

function resumirContas(contas) {
  const abertas = contas.filter((conta) => {
    if (conta?.excluido === true || statusPago(conta?.status)) return false
    const vencimento = dataConta(conta)
    return isIsoDate(vencimento)
  })

  return {
    hoje: abertas.filter((conta) => dataConta(conta) === hoje),
    amanha: abertas.filter((conta) => dataConta(conta) === amanha),
    vencidas: abertas.filter((conta) => dataConta(conta) < hoje),
    altoValor: abertas.filter((conta) => Number(conta?.valor || 0) >= LIMITE_ALTO_VALOR && dataConta(conta) >= hoje)
  }
}

function resumirNotas(notas, dataLimite) {
  const pendentes = notas.filter((nota) => notaPendente(nota, dataLimite))
  const urgentes = pendentes.filter((nota) => normalizeText(nota?.prioridade) === 'urgente')
  return { pendentes, urgentes }
}

function montarMensagemDryRun({ tipo, empresaNome, resumoContas, notasResumo }) {
  const contasPrincipal = tipo === 'VENCIDAS'
    ? resumoContas.vencidas
    : tipo === 'AMANHA'
      ? resumoContas.amanha
      : resumoContas.hoje

  const tituloPrincipal = tipo === 'VENCIDAS'
    ? 'Contas vencidas'
    : tipo === 'AMANHA'
      ? 'Contas que vencem amanha'
      : 'Contas que vencem hoje'

  const vazioPrincipal = tipo === 'VENCIDAS'
    ? 'Nenhuma conta vencida.'
    : tipo === 'AMANHA'
      ? 'Nenhuma conta vencendo amanha.'
      : 'Nenhuma conta vencendo hoje.'

  const deveEnviar = contasPrincipal.length > 0 || notasResumo.urgentes.length > 0

  if (!deveEnviar) {
    return {
      enviar: false,
      motivo: `${vazioPrincipal} Sem notas urgentes.`,
      tipo
    }
  }

  const subject = tipo === 'VENCIDAS'
    ? 'Contas vencidas - Dona Flor'
    : tipo === 'AMANHA'
      ? 'Contas de amanha - Dona Flor'
      : 'Alerta financeiro - Dona Flor'

  const html = montarHtmlDryRun({
    empresaNome,
    tituloPrincipal,
    contasPrincipal: contasPrincipal.length,
    contasHoje: resumoContas.hoje.length,
    contasAmanha: resumoContas.amanha.length,
    contasVencidas: resumoContas.vencidas.length,
    contasAltoValor: resumoContas.altoValor.length,
    notasUrgentes: notasResumo.urgentes.length,
    vazioPrincipal
  })

  return {
    enviar: true,
    tipo,
    subject,
    html,
    texto: [
      `Dona Flor Gestao Financeira - ${safeName(empresaNome)}`,
      '',
      `Tipo: ${tipo || 'HOJE'}`,
      `Contas hoje: ${resumoContas.hoje.length}`,
      `Contas amanha: ${resumoContas.amanha.length}`,
      `Contas vencidas: ${resumoContas.vencidas.length}`,
      `Contas alto valor: ${resumoContas.altoValor.length}`,
      `Notas urgentes: ${notasResumo.urgentes.length}`,
      '',
      APP_URL
    ].join('\n')
  }
}

function montarHtmlDryRun({
  empresaNome,
  tituloPrincipal,
  contasPrincipal,
  contasHoje,
  contasAmanha,
  contasVencidas,
  contasAltoValor,
  notasUrgentes,
  vazioPrincipal
}) {
  const temSomenteNotaUrgente = contasVencidas === 0 && contasAltoValor === 0 && contasPrincipal === 0 && notasUrgentes > 0
  const temAlerta = contasVencidas > 0 || contasAltoValor > 0 || contasPrincipal > 0 || notasUrgentes > 0
  const blocoAlerta = temSomenteNotaUrgente
    ? `
        <div style="background:#f59e0b; color:#fff; padding:16px; margin-top:18px; border-radius:14px; font-weight:bold;">
          Notas urgentes<br><br>
          Total: ${notasUrgentes}<br>
        </div>
      `
    : temAlerta
      ? `
          <div style="background:#e74c3c; color:#fff; padding:16px; margin-top:18px; border-radius:14px; font-weight:bold;">
            ALERTA CRITICO<br><br>
            ${contasVencidas > 0 ? `Vencidas: ${contasVencidas}<br>` : ''}
            ${contasHoje > 0 ? `Vencem hoje: ${contasHoje}<br>` : ''}
            ${contasAmanha > 0 ? `Vencem amanha: ${contasAmanha}<br>` : ''}
            ${contasAltoValor > 0 ? `Alto valor: ${contasAltoValor}<br>` : ''}
            ${notasUrgentes > 0 ? `Notas urgentes: ${notasUrgentes}<br>` : ''}
          </div>
        `
      : `
          <div style="background:#16a34a; color:#fff; padding:16px; margin-top:18px; border-radius:14px; font-weight:bold;">
            Situacao sob controle
          </div>
        `

  return `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px">
      <div style="background:#0f5c4d; color:#fff; padding:22px; border-radius:14px">
        <h2 style="margin:0; font-size:24px; line-height:1.18;">Dona Flor<br>Gestao Financeira</h2>
        <p style="margin:10px 0 0 0; font-size:15px; line-height:1.35;">Painel financeiro automatico</p>
      </div>

      ${blocoAlerta}

      <p style="font-size:13px; color:#333;">Atualizado em ${escapeHtml(nowSaoPaulo())}</p>

      <h3 style="font-size:22px;">${escapeHtml(tituloPrincipal)}</h3>

      <div style="background:#fff; padding:14px; border-radius:12px; margin-bottom:14px;">
        Quantidade: <b>${contasPrincipal}</b>
      </div>

      ${contasPrincipal === 0 ? `<div style="background:#d4edda; padding:14px; border-radius:12px;">${escapeHtml(vazioPrincipal)}</div>` : ''}

      <h3 style="font-size:22px; margin-top:24px;">Bloco de notas</h3>
      <div style="background:#fff; padding:14px; border-radius:12px;">Notas urgentes: <b>${notasUrgentes}</b></div>

      <br>
      <a href="${APP_URL}" style="background:#0f5c4d; color:#fff; padding:12px 22px; text-decoration:none; border-radius:10px; display:inline-block; font-weight:bold;">
        Acessar sistema
      </a>

      <p style="font-size:12px; color:#999; margin-top:28px;">
        Mensagem automatica enviada pelo sistema Dona Flor Gestao Financeira.
      </p>
      <p style="font-size:12px; color:#999;">Empresa: ${escapeHtml(safeName(empresaNome))}</p>
    </div>
  `
}

function notaPendente(nota, dataLimite) {
  if (nota?.excluido === true || nota?.deletado === true || nota?.concluida === true || statusConcluido(nota?.status)) return false
  const data = cleanString(nota?.data_evento || nota?.data_lembrete)
  return !data || data <= dataLimite
}

async function sendEmail({ to, subject, html, text }) {
  const recipients = normalizeRecipients(to)

  if (recipients.length === 0) {
    throw new Error('Nenhum destinatario valido para envio.')
  }

  if (DRY_RUN) {
    return {
      dryRun: true,
      recipients: recipients.length,
      subject,
      htmlLength: cleanString(html).length,
      textLength: cleanString(text).length
    }
  }

  const smtpConfig = readSmtpConfig()
  return sendSmtpMail({
    ...smtpConfig,
    to: recipients,
    subject,
    html,
    text
  })
}

async function sendSmtpMail({ host, port, user, pass, from, fromEmail, to, subject, html, text }) {
  const messageId = `<${randomUUID()}@dona-flor-financeiro.github-actions>`
  const message = buildMimeMessage({ from, fromEmail, to, subject, html, text, messageId })
  const session = await SmtpSession.connect({ host, port })

  try {
    await session.expect([220])
    await session.command(`EHLO ${smtpClientName()}`, [250])

    if (!session.secure) {
      await session.command('STARTTLS', [220])
      await session.upgradeToTls(host)
      await session.command(`EHLO ${smtpClientName()}`, [250])
    }

    const auth = Buffer.from(`\u0000${user}\u0000${pass}`).toString('base64')
    await session.command(`AUTH PLAIN ${auth}`, [235])
    await session.command(`MAIL FROM:<${fromEmail}>`, [250])

    for (const recipient of to) {
      await session.command(`RCPT TO:<${recipient}>`, [250, 251])
    }

    await session.command('DATA', [354])
    session.write(`${dotStuff(message)}\r\n.\r\n`)
    const dataResponse = await session.expect([250])
    const providerMessageId = extractProviderMessageId(dataResponse.lines) || messageId

    await session.command('QUIT', [221]).catch(() => null)

    return {
      dryRun: false,
      recipients: to.length,
      messageId: providerMessageId
    }
  } finally {
    session.destroy()
  }
}

class SmtpSession {
  static async connect({ host, port }) {
    const secure = Number(port) === 465
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.createConnection({ host, port })

    const session = new SmtpSession(socket, secure)
    await once(socket, secure ? 'secureConnect' : 'connect')
    return session
  }

  constructor(socket, secure = false) {
    this.socket = null
    this.secure = secure
    this.buffer = ''
    this.currentLines = []
    this.responses = []
    this.waiters = []
    this.onData = (chunk) => this.handleData(chunk)
    this.onError = (error) => this.rejectWaiters(error)
    this.onEnd = () => this.rejectWaiters(new Error('Conexao SMTP encerrada.'))
    this.setSocket(socket)
  }

  setSocket(socket) {
    if (this.socket) {
      this.socket.off('data', this.onData)
      this.socket.off('error', this.onError)
      this.socket.off('end', this.onEnd)
    }

    this.socket = socket
    this.socket.on('data', this.onData)
    this.socket.on('error', this.onError)
    this.socket.on('end', this.onEnd)
  }

  async upgradeToTls(host) {
    const secureSocket = tls.connect({ socket: this.socket, servername: host })
    await once(secureSocket, 'secureConnect')
    this.secure = true
    this.buffer = ''
    this.currentLines = []
    this.setSocket(secureSocket)
  }

  write(data) {
    this.socket.write(data)
  }

  async command(command, expectedCodes) {
    this.write(`${command}\r\n`)
    return this.expect(expectedCodes)
  }

  async expect(expectedCodes) {
    const response = await this.nextResponse()
    const expected = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes]
    if (!expected.includes(response.code)) {
      throw new Error(`SMTP retornou codigo inesperado ${response.code}.`)
    }
    return response
  }

  nextResponse() {
    if (this.responses.length > 0) {
      return Promise.resolve(this.responses.shift())
    }

    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject })
    })
  }

  handleData(chunk) {
    this.buffer += chunk.toString('utf8')

    let index = this.buffer.indexOf('\n')
    while (index >= 0) {
      const line = this.buffer.slice(0, index).replace(/\r$/, '')
      this.buffer = this.buffer.slice(index + 1)
      this.handleLine(line)
      index = this.buffer.indexOf('\n')
    }
  }

  handleLine(line) {
    if (!/^\d{3}[ -]/.test(line)) return

    this.currentLines.push(line)

    if (line[3] === ' ') {
      const response = {
        code: Number(line.slice(0, 3)),
        lines: this.currentLines
      }
      this.currentLines = []
      const waiter = this.waiters.shift()
      if (waiter) {
        waiter.resolve(response)
      } else {
        this.responses.push(response)
      }
    }
  }

  rejectWaiters(error) {
    while (this.waiters.length > 0) {
      this.waiters.shift().reject(error)
    }
  }

  destroy() {
    this.socket.destroy()
  }
}

function readSmtpConfig() {
  const host = requiredEnv('SMTP_HOST')
  const port = normalizePort(requiredEnv('SMTP_PORT'))
  const user = requiredEnv('SMTP_USER')
  const pass = requiredEnv('SMTP_PASS')
  const from = requiredEnv('MAIL_FROM')
  const fromEmail = extractEmail(from)

  if (!fromEmail) {
    throw new Error('MAIL_FROM precisa conter um e-mail valido.')
  }

  return {
    host,
    port,
    user,
    pass,
    from: safeHeader(from),
    fromEmail
  }
}

function normalizePort(value) {
  const port = Number.parseInt(String(value || ''), 10)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT invalido.')
  }
  return port
}

function normalizeRecipients(to) {
  const list = Array.isArray(to) ? to : [to]
  return unique(
    list
      .map((recipient) => extractEmail(typeof recipient === 'string' ? recipient : recipient?.email))
      .filter(Boolean)
  )
}

function extractEmail(value) {
  const text = cleanString(value)
  const match = text.match(/<([^>]+)>/)
  const email = cleanString(match ? match[1] : text).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

function buildMimeMessage({ from, fromEmail, to, subject, html, text, messageId }) {
  const boundary = `dona-flor-${randomUUID()}`
  const safeSubject = encodeMimeHeader(subject || 'Alerta financeiro - Dona Flor')
  const safeText = cleanString(text) || 'Resumo automatico Dona Flor.'
  const safeHtml = cleanString(html) || `<p>${escapeHtml(safeText)}</p>`

  return [
    `From: ${from}`,
    `To: ${to.map((email) => `<${email}>`).join(', ')}`,
    `Subject: ${safeSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Reply-To: <${fromEmail}>`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizeBody(safeText),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizeBody(safeHtml),
    '',
    `--${boundary}--`,
    ''
  ].join('\r\n')
}

function encodeMimeHeader(value) {
  const header = safeHeader(value)
  return /^[\x00-\x7F]*$/.test(header)
    ? header
    : `=?UTF-8?B?${Buffer.from(header, 'utf8').toString('base64')}?=`
}

function safeHeader(value) {
  return cleanString(value).replace(/[\r\n]+/g, ' ')
}

function normalizeBody(value) {
  return String(value || '').replace(/\r?\n/g, '\r\n')
}

function dotStuff(message) {
  return normalizeBody(message).replace(/^\./gm, '..')
}

function smtpClientName() {
  return 'github-actions.dona-flor-financeiro.local'
}

function extractProviderMessageId(lines) {
  const joined = (lines || []).join(' ')
  const match = joined.match(/<[^>]+>/)
  return match ? match[0] : ''
}

async function fetchSupabase(table, params) {
  const url = new URL(`${supabaseBaseUrl}/rest/v1/${table}`)

  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    const body = await response.text()
    const error = new Error(`Supabase REST ${table} retornou HTTP ${response.status}`)
    error.status = response.status
    error.body = body.slice(0, 500)
    throw error
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

function requiredEnv(name) {
  const value = cleanString(process.env[name])
  if (!value) throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`)
  return value
}

function parseDryRun(value) {
  const normalized = normalizeText(value)
  return normalized !== 'false'
}

function resolveTipoAlerta(value, date, timeZone) {
  const normalized = normalizeText(value)
  if (['vencidas', 'vencida'].includes(normalized)) return 'VENCIDAS'
  if (['amanha', 'amanhã'].includes(normalized)) return 'AMANHA'
  if (['hoje', ''].includes(normalized)) return ''

  const hour = hourInTimeZone(date, timeZone)
  if (hour === 20) return 'VENCIDAS'
  if (hour === 9) return 'AMANHA'
  return ''
}

function normalizeInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(parsed, 365)
}

function statusPago(status) {
  return ['pago', 'paga', 'quitado', 'quitada', 'recebido', 'recebida'].includes(normalizeText(status))
}

function statusConcluido(status) {
  return ['concluido', 'concluida', 'finalizado', 'finalizada', 'feito', 'feita'].includes(normalizeText(status))
}

function normalizeText(value) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function cleanString(value) {
  return String(value || '').trim()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function dataConta(conta) {
  return cleanString(conta?.data_vencimento || conta?.vencimento).split('T')[0]
}

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

function hourInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false
  }).formatToParts(date)

  return Number(parts.find((part) => part.type === 'hour')?.value || 0)
}

function nowSaoPaulo() {
  return new Date().toLocaleString('pt-BR', { timeZone: TIME_ZONE })
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(cleanString(value))
}

function maskEmail(email) {
  const value = cleanString(email)
  const [user, domain] = value.split('@')
  if (!user || !domain) return '***'
  return `${user.slice(0, 1)}***@${domain}`
}

function safeName(value) {
  const text = cleanString(value)
  if (!text) return ''
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
}

function isSchemaError(error) {
  const text = `${error?.message || ''} ${error?.body || ''}`.toLowerCase()
  return text.includes('column') || text.includes('schema cache') || text.includes('pgrst')
}

function safeError(error) {
  return {
    message: cleanString(error?.message || 'erro desconhecido'),
    status: error?.status || null
  }
}
