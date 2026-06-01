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

  const [contas, notas, destinatariosAlertas] = await Promise.all([
    buscarContasEmpresa(empresaId, addDaysIso(hoje, Math.max(1, diasAlertaContas))),
    buscarNotasEmpresa(empresaId),
    buscarDestinatariosAlertasEmpresa(empresaId)
  ])

  const resumoContas = resumirContas(contas)
  const notasResumo = resumirNotas(notas, addDaysIso(hoje, diasAlertaNotas))
  const destinatariosPorTipo = resolverDestinatariosPorTipo({
    destinatariosAlertas,
    emailPadrao: config.email_padrao,
    resumoContas,
    notasResumo
  })
  const destinatarios = destinatariosPorTipo.todos

  logDestinatariosDryRun({
    empresaId,
    empresaNome: empresa?.nome || config.nome_empresa,
    destinatariosPorTipo
  })

  if (destinatarios.length === 0) {
    console.warn('[envio-automatico] empresa_sem_destinatario', JSON.stringify({
      empresa_id: empresaId,
      empresa_nome: safeName(empresa?.nome || config.nome_empresa),
      status: 'skip_sem_destinatario'
    }))
    return { enviar: false }
  }

  const mensagem = montarMensagemDryRun({
    tipo: ALERTA_TIPO,
    empresaNome: empresa?.nome || config.nome_empresa || 'Empresa',
    resumoContas,
    notasResumo,
    notas
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
    destinatarios_origem: destinatariosPorTipo.origemResumo,
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

async function buscarDestinatariosAlertasEmpresa(empresaId) {
  try {
    const destinatarios = await fetchSupabase('df_destinatarios_alertas', {
      select: 'empresa_id,nome,email,ativo,recebe_contas,recebe_notas,recebe_resumo',
      empresa_id: `eq.${empresaId}`,
      ativo: 'eq.true'
    })

    return filtrarDestinatariosAlertas(destinatarios)
  } catch (error) {
    console.warn('[envio-automatico] aviso_destinatarios_alertas_nao_avaliados', JSON.stringify({
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

function filtrarDestinatariosAlertas(destinatarios) {
  return destinatarios
    .map((destinatario) => ({
      email: cleanString(destinatario?.email).toLowerCase(),
      nome: cleanString(destinatario?.nome),
      ativo: destinatario?.ativo !== false,
      recebe_contas: destinatario?.recebe_contas !== false,
      recebe_notas: destinatario?.recebe_notas !== false,
      recebe_resumo: destinatario?.recebe_resumo !== false
    }))
    .filter((destinatario) => {
      if (!destinatario.ativo) return false
      if (!destinatario.email) return false
      if (!extractEmail(destinatario.email)) return false
      if (EMAILS_BLOQUEADOS.has(destinatario.email)) return false
      return true
    })
}

function resolverDestinatariosPorTipo({ destinatariosAlertas, emailPadrao, resumoContas, notasResumo }) {
  const tipos = {
    contas: filtrarDestinatariosPorPreferencia(destinatariosAlertas, 'recebe_contas'),
    notas: filtrarDestinatariosPorPreferencia(destinatariosAlertas, 'recebe_notas'),
    resumo: filtrarDestinatariosPorPreferencia(destinatariosAlertas, 'recebe_resumo')
  }

  const fontes = {
    contas: tipos.contas.length > 0 ? 'df_destinatarios_alertas' : 'fallback',
    notas: tipos.notas.length > 0 ? 'df_destinatarios_alertas' : 'fallback',
    resumo: tipos.resumo.length > 0 ? 'df_destinatarios_alertas' : 'fallback'
  }

  if (tipos.contas.length === 0) tipos.contas = fallbackDestinatarios(emailPadrao)
  if (tipos.notas.length === 0) tipos.notas = fallbackDestinatarios(emailPadrao)
  if (tipos.resumo.length === 0) tipos.resumo = fallbackDestinatarios(emailPadrao)

  const precisaContas = resumoContas.hoje.length > 0 || resumoContas.amanha.length > 0 || resumoContas.vencidas.length > 0 || resumoContas.altoValor.length > 0
  const precisaNotas = notasResumo.urgentes.length > 0 || notasResumo.pendentes.length > 0
  const todos = deduplicarDestinatarios([
    ...(precisaContas ? tipos.contas : []),
    ...(precisaNotas ? tipos.notas : []),
    ...tipos.resumo
  ])

  return {
    contas: deduplicarDestinatarios(tipos.contas),
    notas: deduplicarDestinatarios(tipos.notas),
    resumo: deduplicarDestinatarios(tipos.resumo),
    todos,
    fontes,
    origemResumo: {
      contas: fontes.contas,
      notas: fontes.notas,
      resumo: fontes.resumo
    }
  }
}

function filtrarDestinatariosPorPreferencia(destinatarios, preferencia) {
  return (destinatarios || []).filter((destinatario) => destinatario?.[preferencia] !== false)
}

function deduplicarDestinatarios(destinatarios) {
  const mapa = new Map()

  for (const destinatario of destinatarios || []) {
    const email = extractEmail(destinatario?.email || destinatario)
    if (!email || mapa.has(email)) continue
    mapa.set(email, {
      email,
      nome: cleanString(destinatario?.nome)
    })
  }

  return Array.from(mapa.values())
}

function logDestinatariosDryRun({ empresaId, empresaNome, destinatariosPorTipo }) {
  if (!DRY_RUN) return

  for (const tipo of ['contas', 'notas', 'resumo']) {
    const destinatarios = destinatariosPorTipo[tipo] || []
    console.log('[envio-automatico] dry_run_destinatarios', JSON.stringify({
      empresa_id: empresaId,
      empresa_nome: safeName(empresaNome),
      tipo_alerta: tipo,
      origem: destinatariosPorTipo.fontes?.[tipo] || 'fallback',
      destinatarios_total: destinatarios.length,
      destinatarios: destinatarios.map((destinatario) => maskEmail(destinatario.email))
    }))
  }
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

function montarMensagemDryRun({ tipo, empresaNome, resumoContas, notasResumo, notas }) {
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

  const empresaAssunto = safeName(empresaNome) || 'Empresa'
  const subject = tipo === 'VENCIDAS'
    ? `Contas vencidas - ${empresaAssunto}`
    : tipo === 'AMANHA'
      ? `Contas de amanhã - ${empresaAssunto}`
      : `Alerta financeiro - ${empresaAssunto}`

  const totais = calcularTotaisContas(resumoContas)

  const html = montarHtmlDryRun({
    empresaNome,
    tituloPrincipal,
    tipo,
    contasPrincipal,
    resumoContas,
    notas,
    notasResumo,
    totais,
    vazioPrincipal
  })

  const texto = montarTextoResumo({
    tipo,
    tituloPrincipal,
    contasPrincipal,
    resumoContas,
    notas,
    notasResumo,
    totais,
    vazioPrincipal
  })

  return {
    enviar: true,
    tipo,
    subject,
    html,
    texto
  }
}

function montarHtmlDryRun({
  empresaNome,
  tituloPrincipal,
  tipo,
  contasPrincipal,
  resumoContas,
  notas,
  notasResumo,
  totais,
  vazioPrincipal
}) {
  const temSomenteNotaUrgente = resumoContas.vencidas.length === 0 && resumoContas.altoValor.length === 0 && contasPrincipal.length === 0 && notasResumo.urgentes.length > 0
  const temAlerta = resumoContas.vencidas.length > 0 || resumoContas.altoValor.length > 0 || contasPrincipal.length > 0 || notasResumo.urgentes.length > 0
  const totalPrincipal = totalContas(contasPrincipal)
  const blocoAlerta = temSomenteNotaUrgente
    ? `
        <div style="background:#f59e0b; color:#fff; padding:18px; margin-top:18px; border-radius:14px; font-weight:bold; line-height:1.65;">
          Notas urgentes<br>
          Total: ${notasResumo.urgentes.length}
        </div>
      `
    : temAlerta
      ? `
          <div style="background:#e74c3c; color:#fff; padding:18px; margin-top:18px; border-radius:14px; font-weight:bold; line-height:1.7;">
            <div style="font-size:17px; margin-bottom:8px;">ALERTA CRITICO</div>
            ${resumoContas.vencidas.length > 0 ? `<div>Vencidas: ${resumoContas.vencidas.length} — ${moeda(totais.vencidas)}</div>` : ''}
            ${resumoContas.hoje.length > 0 ? `<div>Vencem hoje: ${resumoContas.hoje.length} — ${moeda(totais.hoje)}</div>` : ''}
            ${resumoContas.amanha.length > 0 ? `<div>Vencem amanha: ${resumoContas.amanha.length} — ${moeda(totais.amanha)}</div>` : ''}
            ${resumoContas.altoValor.length > 0 ? `<div>Alto valor: ${resumoContas.altoValor.length}</div>` : ''}
            ${notasResumo.urgentes.length > 0 ? `<div>Notas urgentes: ${notasResumo.urgentes.length}</div>` : ''}
          </div>
        `
      : `
          <div style="background:#16a34a; color:#fff; padding:16px; margin-top:18px; border-radius:14px; font-weight:bold; line-height:1.6;">
            Situacao sob controle<br>
            Total: ${moeda(totalPrincipal)}
          </div>
        `

  const blocoPrincipal = contasPrincipal.length === 0
    ? `<p style="font-size:13px; color:#666; margin:18px 0 6px 0;">${escapeHtml(vazioPrincipal)}</p>`
    : `
        <h3 style="font-size:22px;">${escapeHtml(tituloPrincipal)}</h3>
        <div style="background:#fff; padding:14px; border-radius:12px; margin-bottom:14px;">
          Quantidade: <b>${contasPrincipal.length}</b><br>
          Total: <b>${moeda(totalPrincipal)}</b>
        </div>
        ${contasPrincipal.slice(0, 15).map(cardConta).join('')}
      `

  const contasVencidasExibidas = resumoContas.vencidas.slice(0, 6)
  const contasVencidasOcultas = Math.max(resumoContas.vencidas.length - contasVencidasExibidas.length, 0)

  const blocoVencidas = tipo !== 'VENCIDAS' && resumoContas.vencidas.length > 0
    ? `
        <h3 style="font-size:22px; margin-top:24px;">Contas vencidas</h3>
        <div style="background:#fff; padding:14px; border-radius:12px; margin-bottom:14px;">
          Quantidade: <b>${resumoContas.vencidas.length}</b><br>
          Total: <b>${moeda(totais.vencidas)}</b>
        </div>
        ${contasVencidasExibidas.map(cardConta).join('')}
        ${contasVencidasOcultas > 0
          ? `<p style="font-size:13px; color:#666; margin:12px 0 0 0;">+ ${contasVencidasOcultas} conta(s) vencida(s) nao exibida(s) neste resumo.</p>`
          : ''}
      `
    : ''

  const blocoNotas = (notas || []).length === 0
    ? '<div style="background:#fff; padding:14px; border-radius:12px;">Nenhuma nota ativa cadastrada.</div>'
    : notas.slice(0, 10).map(cardNota).join('')

  return `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px">
      <div style="background:#0f5c4d; color:#fff; padding:22px; border-radius:14px">
        <h2 style="margin:0; font-size:24px; line-height:1.18;">DNA Gestão</h2>
        <p style="margin:10px 0 0 0; font-size:15px; line-height:1.35;">Alertas financeiros automáticos</p>
      </div>

      ${blocoAlerta}

      <p style="font-size:13px; color:#333;">Atualizado em ${escapeHtml(nowSaoPaulo())}</p>

      ${blocoPrincipal}

      ${blocoVencidas}

      <h3 style="font-size:22px; margin-top:24px;">Bloco de notas</h3>
      ${blocoNotas}

      <br>
      <a href="${APP_URL}" style="background:#0f5c4d; color:#fff; padding:15px 26px; text-decoration:none; border-radius:10px; display:inline-block; font-weight:bold; font-size:16px; line-height:1.2;">
        Acessar sistema
      </a>

      <p style="font-size:12px; color:#999; margin-top:28px;">
        Mensagem automática enviada pelo DNA Gestão.
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

function cardConta(conta) {
  const descricao = escapeHtml(getField(conta, ['descricao', 'nome', 'conta', 'titulo']))
  const filial = getOptionalField(conta, ['filial_nome', 'filial', 'loja', 'unidade'])
  const centro = getOptionalField(conta, ['centro_custo_nome', 'centro_custo', 'centro', 'categoria'])
  const vencimento = formatarData(dataConta(conta))
  const status = escapeHtml(getField(conta, ['status'], 'Pendente'))
  const valor = moeda(conta?.valor)

  return `
    <div style="background:#fff; margin-top:12px; padding:15px; border-radius:12px; line-height:1.55;">
      <div style="font-size:16px; font-weight:bold; color:#111; margin-bottom:8px;">${descricao}</div>
      ${filial ? `<div style="font-size:14px; color:#444;">Filial: ${escapeHtml(filial)}</div>` : ''}
      ${centro ? `<div style="font-size:14px; color:#444;">Centro: ${escapeHtml(centro)}</div>` : ''}
      <div style="font-size:14px; color:#444;">Vencimento: ${vencimento}</div>
      <div style="font-size:14px; color:#444;">Status: ${status}</div>
      <div style="font-size:15px; color:#111; font-weight:bold; margin-top:6px;">Valor: ${valor}</div>
    </div>
  `
}

function cardNota(nota) {
  const titulo = escapeHtml(tituloNota(nota))
  const prioridade = escapeHtml(getField(nota, ['prioridade'], 'Normal'))
  const textoNota = limitarTexto(getOptionalField(nota, ['texto', 'conteudo', 'observacao', 'mensagem', 'recado', 'descricao']), 140)
  const data = formatarData(getField(nota, ['data_evento', 'data_lembrete', 'data', 'created_at'], ''))

  return `
    <div style="background:#fff; padding:14px; border-radius:12px; margin-top:12px; line-height:1.55;">
      <div style="font-weight:bold; color:#111; margin-bottom:6px;">${titulo}</div>
      <div style="font-size:14px; color:#444;">Prioridade: ${prioridade}</div>
      ${textoNota ? `<div style="font-size:14px; color:#444;">Resumo: ${escapeHtml(textoNota)}</div>` : ''}
      <div style="font-size:14px; color:#444;">Data: ${data}</div>
    </div>
  `
}

function montarTextoResumo({ tipo, tituloPrincipal, contasPrincipal, resumoContas, notas, notasResumo, totais, vazioPrincipal }) {
  const linhas = []
  const labelPrincipal = tipo === 'VENCIDAS'
    ? 'Contas vencidas'
    : tipo === 'AMANHA'
      ? 'Contas amanha'
      : 'Contas hoje'
  const labelTotalPrincipal = tipo === 'VENCIDAS'
    ? 'Total vencido'
    : tipo === 'AMANHA'
      ? 'Total amanha'
      : 'Total hoje'

  linhas.push('DNA Gestão')
  linhas.push('')
  linhas.push(resumoContas.vencidas.length > 0 || resumoContas.altoValor.length > 0 || contasPrincipal.length > 0 ? 'ALERTA CRITICO' : 'Situacao sob controle')
  linhas.push('')
  linhas.push(`${labelPrincipal}: ${contasPrincipal.length}`)
  linhas.push(`${labelTotalPrincipal}: ${moeda(totalContas(contasPrincipal))}`)
  linhas.push(`Vencidas: ${resumoContas.vencidas.length}`)
  linhas.push(`Total vencido: ${moeda(totais.vencidas)}`)
  linhas.push('')

  if (notasResumo.urgentes.length > 0) {
    linhas.push(`Notas urgentes: ${notasResumo.urgentes.length}`)
    linhas.push('')
  }

  if (contasPrincipal.length === 0) {
    linhas.push(vazioPrincipal)
  } else {
    linhas.push(`${tituloPrincipal.replace(/[📅📆🔴]/g, '').trim()}:`)
    for (const conta of contasPrincipal.slice(0, 10)) {
      linhas.push(`- ${getField(conta, ['descricao', 'nome', 'conta', 'titulo'])} | ${moeda(conta?.valor)} | ${formatarData(dataConta(conta))}`)
    }
  }

  if (tipo !== 'VENCIDAS' && resumoContas.vencidas.length > 0) {
    linhas.push('')
    linhas.push('Contas vencidas:')
    const vencidasExibidas = resumoContas.vencidas.slice(0, 6)
    const vencidasOcultas = Math.max(resumoContas.vencidas.length - vencidasExibidas.length, 0)

    for (const conta of vencidasExibidas) {
      linhas.push(`- ${getField(conta, ['descricao', 'nome', 'conta', 'titulo'])} | ${moeda(conta?.valor)} | ${formatarData(dataConta(conta))}`)
    }

    if (vencidasOcultas > 0) {
      linhas.push(`+ ${vencidasOcultas} conta(s) vencida(s) nao exibida(s) neste resumo.`)
    }
  }

  if ((notas || []).length > 0) {
    linhas.push('')
    linhas.push('Bloco de notas:')
    for (const nota of notas.slice(0, 10)) {
      const textoNota = limitarTexto(getOptionalField(nota, ['texto', 'conteudo', 'observacao', 'mensagem', 'recado', 'descricao']), 120)
      const detalhe = textoNota ? ` | ${textoNota}` : ''
      linhas.push(`- ${tituloNota(nota)} | ${getField(nota, ['prioridade'], 'Normal')} | ${formatarData(getField(nota, ['data_evento', 'data_lembrete', 'data', 'created_at'], ''))}${detalhe}`)
    }
  }

  linhas.push('')
  linhas.push('Acessar sistema:')
  linhas.push(APP_URL)
  linhas.push('')
  linhas.push(`Atualizado em ${nowSaoPaulo()}`)

  return linhas.join('\n')
}

function calcularTotaisContas(resumoContas) {
  return {
    hoje: totalContas(resumoContas.hoje),
    amanha: totalContas(resumoContas.amanha),
    vencidas: totalContas(resumoContas.vencidas)
  }
}

function totalContas(contas) {
  return (contas || []).reduce((total, conta) => total + Number(conta?.valor || 0), 0)
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function formatarData(data) {
  const dataLimpa = cleanString(data).split('T')[0]
  if (!dataLimpa) return '-'

  const [ano, mes, dia] = dataLimpa.split('-')
  if (!ano || !mes || !dia) return dataLimpa

  return `${dia}/${mes}/${ano}`
}

function getField(obj, fields, fallback = '-') {
  for (const field of fields) {
    const value = obj?.[field]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

function getOptionalField(obj, fields) {
  const value = getField(obj, fields, '')
  return value === '-' ? '' : cleanString(value)
}

function limitarTexto(value, maxLength) {
  const text = cleanString(value).replace(/\s+/g, ' ').trim()
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

function tituloNota(nota) {
  const titulo = getOptionalField(nota, ['titulo', 'title', 'descricao', 'texto', 'conteudo', 'observacao', 'mensagem', 'nome', 'assunto'])
  if (titulo) return titulo

  const prioridade = normalizeText(nota?.prioridade)
  return prioridade === 'urgente' ? 'Nota urgente' : 'Nota pendente'
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
  const safeSubject = encodeMimeHeader(subject || 'Alerta financeiro - Empresa')
  const safeText = cleanString(text) || 'Resumo automático DNA Gestão.'
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
