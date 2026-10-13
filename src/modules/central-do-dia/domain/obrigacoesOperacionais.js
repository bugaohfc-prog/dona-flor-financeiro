const ESTADOS_ATIVOS = new Set(['ABERTA', 'AGUARDANDO_TERCEIRO'])
const PERFIS_ELEGIVEIS = new Set(['admin', 'master', 'owner', 'superadmin', 'super_admin'])

function texto(valor) {
  return String(valor || '').trim()
}

function dataLocalISO(agora = new Date()) {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
}

export function usuarioElegivelObrigacao(usuario = {}) {
  const perfil = texto(usuario.perfil_original || usuario.perfil).toLowerCase()
  const status = texto(usuario.status || 'ativo').toLowerCase()
  return Boolean(usuario.id) && PERFIS_ELEGIVEIS.has(perfil) && status !== 'inativo'
}

export function normalizarObrigacaoOperacional(obrigacao = {}) {
  const desligamento = Array.isArray(obrigacao.desligamento) ? obrigacao.desligamento[0] : obrigacao.desligamento
  const funcionario = Array.isArray(desligamento?.funcionario) ? desligamento.funcionario[0] : desligamento?.funcionario
  const responsavel = Array.isArray(obrigacao.responsavel) ? obrigacao.responsavel[0] : obrigacao.responsavel
  return {
    ...obrigacao,
    desligamento: desligamento || null,
    funcionario: funcionario || null,
    responsavel: responsavel || null
  }
}

export function obrigacaoSemResponsavel(obrigacao, usuariosElegiveis = []) {
  if (!obrigacao?.responsavel_usuario_empresa_id) return true
  return !usuariosElegiveis.some((usuario) => usuarioElegivelObrigacao(usuario) && usuario.id === obrigacao.responsavel_usuario_empresa_id)
}

export function obrigacaoPrecisaAcao(obrigacao, agora = new Date()) {
  if (!ESTADOS_ATIVOS.has(obrigacao?.estado)) return false
  if (obrigacao.snooze_ate && new Date(obrigacao.snooze_ate).getTime() > agora.getTime()) return false
  if (obrigacao.estado === 'AGUARDANDO_TERCEIRO') {
    return Boolean(obrigacao.proxima_revisao_em && obrigacao.proxima_revisao_em <= dataLocalISO(agora))
  }
  return true
}

export function filtrarObrigacoesOperacionais({ obrigacoes = [], filtro = 'acao', meuVinculoId = null, usuariosElegiveis = [] }) {
  return obrigacoes.map(normalizarObrigacaoOperacional).filter((obrigacao) => {
    if (filtro === 'espera') return obrigacao.estado === 'AGUARDANDO_TERCEIRO'
    if (filtro === 'minhas') return ESTADOS_ATIVOS.has(obrigacao.estado) && obrigacao.responsavel_usuario_empresa_id === meuVinculoId
    if (filtro === 'sem_responsavel') return ESTADOS_ATIVOS.has(obrigacao.estado) && obrigacaoSemResponsavel(obrigacao, usuariosElegiveis)
    if (filtro === 'resolvidas') return obrigacao.estado === 'RESOLVIDA'
    return obrigacaoPrecisaAcao(obrigacao)
  })
}

export function resumirObrigacoesOperacionais({ obrigacoes = [], meuVinculoId = null, usuariosElegiveis = [] }) {
  const normalizadas = obrigacoes.map(normalizarObrigacaoOperacional)
  return {
    minhas: normalizadas.filter((item) => ESTADOS_ATIVOS.has(item.estado) && item.responsavel_usuario_empresa_id === meuVinculoId).length,
    aguardando: normalizadas.filter((item) => item.estado === 'AGUARDANDO_TERCEIRO').length,
    semResponsavel: normalizadas.filter((item) => ESTADOS_ATIVOS.has(item.estado) && obrigacaoSemResponsavel(item, usuariosElegiveis)).length
  }
}
