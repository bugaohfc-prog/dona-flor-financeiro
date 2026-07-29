import { telaNavegacaoPermitida } from './navigation.js'

export const CATEGORIA_ACESSO_POR_TELA = Object.freeze({
  dashboard: 'geral',
  agenda: 'geral',
  notas: 'geral',

  contas: 'financeiro',
  receitas: 'financeiro',
  recorrencias: 'financeiro',
  'controle-impostos': 'financeiro',
  'fluxo-caixa': 'financeiro',
  relatorios: 'financeiro',
  'relatorios-contas': 'financeiro',

  configuracoes: 'configuracoes',

  usuarios: 'administracao-usuarios',
  auditoria: 'administracao-usuarios',
  importar: 'administracao-importacao',
  lixeira: 'administracao-lixeira',
  filiais: 'administracao-filiais',
  onboarding: 'administracao-onboarding',
  billing: 'administracao-billing',

  funcionarios: 'pessoas',
  ferias: 'pessoas',
  'fechamento-folha': 'pessoas',
  'relatorios-gestao-pessoas': 'pessoas',
  'relatorios-pessoas': 'pessoas',
  'relatorios-ferias': 'pessoas',

  'master-empresas': 'master',
})

const RESPOSTA_PERMITIDA = Object.freeze({
  permitido: true,
  codigo: 'ACESSO_PERMITIDO',
  titulo: '',
  mensagem: '',
})

const MENSAGENS_NEGADAS = Object.freeze({
  configuracoes: 'Seu perfil não possui acesso às configurações desta empresa.',
  'administracao-usuarios': 'Seu perfil não possui acesso à administração de usuários e auditoria.',
  'administracao-importacao': 'Seu perfil não possui acesso à importação de dados.',
  'administracao-lixeira': 'Seu perfil não possui acesso à lixeira.',
  'administracao-filiais': 'Seu perfil não possui acesso à administração de filiais.',
  'administracao-onboarding': 'Seu perfil não possui acesso à implantação inicial.',
  'administracao-billing': 'Seu perfil não possui acesso às informações do plano.',
  pessoas: 'Seu perfil não possui acesso à Gestão de Pessoas.',
  master: 'Seu perfil não possui acesso à administração de empresas.',
})

const CAPACIDADES_ACESSO = Object.freeze([
  'canManageCompanies',
  'canManageUsers',
  'canAccessSettings',
  'canImport',
  'canManageTrash',
  'canEditSettings',
  'canAccessPeople',
])

function perfilNormalizado(permissoes = {}) {
  if (permissoes.isMaster === true) return 'master'
  return String(
    permissoes.perfilGlobal
    || permissoes.perfilEmpresa
    || permissoes.perfil
    || 'operador'
  ).trim().toLowerCase()
}

function valorExplicitoOuFallback(permissoes, derivados, nome, fallback) {
  if (Object.prototype.hasOwnProperty.call(permissoes, nome)) {
    return permissoes[nome] === true
  }
  if (Object.prototype.hasOwnProperty.call(derivados, nome)) {
    return derivados[nome] === true
  }
  return fallback
}

export function construirPermissoesAcessoTelas(permissoes = {}, derivados = {}) {
  const entrada = permissoes && typeof permissoes === 'object' ? permissoes : {}
  const fallbacks = derivados && typeof derivados === 'object' ? derivados : {}
  const perfil = String(
    fallbacks.perfil
    || perfilNormalizado(entrada)
    || 'operador'
  ).trim().toLowerCase()
  const isMaster = entrada.isMaster === true || perfil === 'master'
  const isAdmin = perfil === 'admin'
  const isGerente = perfil === 'gerente'
  const capacidadesPadrao = {
    canManageCompanies: isMaster,
    canManageUsers: isMaster || isAdmin,
    canAccessSettings: isMaster || isAdmin || isGerente,
    canImport: isMaster || isAdmin,
    canManageTrash: isMaster || isAdmin,
    canEditSettings: isMaster || isAdmin,
    canAccessPeople: isMaster || isAdmin,
  }

  const resultado = {
    ...entrada,
    perfil,
    isMaster,
  }

  CAPACIDADES_ACESSO.forEach((capacidade) => {
    resultado[capacidade] = valorExplicitoOuFallback(
      entrada,
      fallbacks,
      capacidade,
      capacidadesPadrao[capacidade],
    )
  })

  return resultado
}

function respostaNegada(categoria, codigo = 'ACESSO_NEGADO') {
  return {
    permitido: false,
    codigo,
    titulo: 'Acesso restrito',
    mensagem: MENSAGENS_NEGADAS[categoria] || 'Seu perfil não possui acesso a esta tela.',
  }
}

export function avaliarAcessoTela(tela, permissoes = {}) {
  const telaNormalizada = String(tela || '').trim()
  if (!telaNavegacaoPermitida(telaNormalizada)) {
    return respostaNegada('', 'TELA_INVALIDA')
  }

  const categoria = CATEGORIA_ACESSO_POR_TELA[telaNormalizada]
  if (!categoria) return respostaNegada('', 'POLITICA_NAO_DEFINIDA')

  const acesso = construirPermissoesAcessoTelas(permissoes)
  const perfil = acesso.perfil
  const isAdmin = perfil === 'admin'

  if (categoria === 'geral' || categoria === 'financeiro') return RESPOSTA_PERMITIDA

  if (categoria === 'master') {
    return acesso.canManageCompanies
      ? RESPOSTA_PERMITIDA
      : respostaNegada(categoria)
  }

  let permitido = false
  if (categoria === 'configuracoes') {
    permitido = acesso.canAccessSettings
  } else if (categoria === 'administracao-usuarios') {
    permitido = acesso.canManageUsers
  } else if (categoria === 'administracao-importacao') {
    permitido = acesso.canImport
  } else if (categoria === 'administracao-lixeira') {
    permitido = acesso.canManageTrash
  } else if (categoria === 'administracao-filiais') {
    permitido = acesso.canEditSettings
  } else if (categoria === 'administracao-onboarding') {
    permitido = acesso.canEditSettings
  } else if (categoria === 'administracao-billing') {
    permitido = acesso.isMaster || isAdmin
  } else if (categoria === 'pessoas') {
    permitido = acesso.canAccessPeople
  }

  return permitido ? RESPOSTA_PERMITIDA : respostaNegada(categoria)
}

export function filtrarMenuPorAcesso(secoes = [], permissoes = {}) {
  return (secoes || [])
    .map((secao) => ({
      ...secao,
      items: (secao.items || []).filter(
        (item) => avaliarAcessoTela(item.tela, permissoes).permitido
      ),
    }))
    .filter((secao) => secao.items.length > 0)
}
