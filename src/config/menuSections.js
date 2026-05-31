const menuSections = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    items: [
      { tela: 'dashboard', icon: '🏠', label: 'Painel', desc: 'Área de trabalho da empresa' },
      { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Compromissos e prazos' },
      { tela: 'notas', icon: '📝', label: 'Notas', desc: 'Pendências e histórico' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: '💳', label: 'Contas', desc: 'Contas a pagar e filtros' },
      { tela: 'relatorios', icon: '📊', label: 'Análise Financeira', desc: 'Indicadores e comparativos' },
      { tela: 'importar', icon: '📥', label: 'Importar contas', desc: 'Trazer contas por planilha' }
    ]
  },
  {
    id: 'pessoas',
    titulo: 'Gestão de Pessoas',
    items: [
      { tela: 'funcionarios', icon: '👥', label: 'Funcionários', desc: 'Cadastro de colaboradores', peopleOnly: true },
      { tela: 'relatorios-pessoas', icon: '📋', label: 'Relatórios', desc: 'Indicadores internos de pessoas', peopleOnly: true },
      { tela: 'ferias', icon: '🌴', label: 'Férias', desc: 'Ciclos e parcelas de férias', peopleOnly: true },
      { tela: 'relatorios-ferias', icon: '📆', label: 'Relatórios de Férias', desc: 'Vencimentos, saldos e retornos', peopleOnly: true },
      { tela: 'fechamento-folha', icon: '🧾', label: 'Fechamento de Folha', desc: 'Competências e lançamentos mensais', peopleOnly: true }
    ]
  },
  {
    id: 'administracao',
    titulo: 'Administração',
    items: [
      { tela: 'usuarios', icon: '👥', label: 'Usuários', desc: 'Perfis, acessos e senhas' },
      { tela: 'master-empresas', icon: '🏢', label: 'Empresas', desc: 'Administração de empresas', masterOnly: true },
      { tela: 'configuracoes', icon: '⚙️', label: 'Configurações', desc: 'Preferências da empresa' },
      { tela: 'billing', icon: '💼', label: 'Plano comercial', desc: 'Planos, limites e contratação' },
      { tela: 'onboarding', icon: '🚀', label: 'Configuração inicial', desc: 'Preparação da empresa' },
      { tela: 'lixeira', icon: '🗑️', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' }
    ]
  }
]

export const MODULOS_TOPBAR = {
  geral: 'Área de trabalho',
  financeiro: 'Gestão Financeira',
  administracao: 'Administração',
  conta: 'Conta',
  pessoas: 'Gestão de Pessoas'
}

const CONTEXTO_MODULO_POR_TELA = {
  dashboard: MODULOS_TOPBAR.geral,
  agenda: MODULOS_TOPBAR.geral,
  notas: MODULOS_TOPBAR.geral,

  contas: MODULOS_TOPBAR.financeiro,
  relatorios: MODULOS_TOPBAR.financeiro,
  importar: MODULOS_TOPBAR.financeiro,

  usuarios: MODULOS_TOPBAR.administracao,
  'master-empresas': MODULOS_TOPBAR.administracao,
  configuracoes: MODULOS_TOPBAR.administracao,
  billing: MODULOS_TOPBAR.administracao,
  onboarding: MODULOS_TOPBAR.administracao,
  filiais: MODULOS_TOPBAR.administracao,
  lixeira: MODULOS_TOPBAR.administracao,

  perfil: MODULOS_TOPBAR.conta,
  'meu-perfil': MODULOS_TOPBAR.conta,

  funcionarios: MODULOS_TOPBAR.pessoas,
  ferias: MODULOS_TOPBAR.pessoas,
  'fechamento-mensal': MODULOS_TOPBAR.pessoas,
  'fechamento-folha': MODULOS_TOPBAR.pessoas,
  'relatorios-pessoas': MODULOS_TOPBAR.pessoas,
  'relatorios-ferias': MODULOS_TOPBAR.pessoas
}

export function resolverContextoModulo(tela) {
  const chaveTela = String(tela || '').trim()
  return CONTEXTO_MODULO_POR_TELA[chaveTela] || MODULOS_TOPBAR.financeiro
}

export default menuSections
