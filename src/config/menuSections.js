const menuSections = [
  {
    id: 'dashboard',
    titulo: 'Ãrea de trabalho',
    items: [
      { tela: 'dashboard', icon: 'ðŸ ', label: 'Ãrea de trabalho', desc: 'VisÃ£o principal da empresa' },
      { tela: 'agenda', icon: 'ðŸ“…', label: 'Agenda', desc: 'Compromissos e prazos' },
      { tela: 'notas', icon: 'ðŸ“', label: 'Notas', desc: 'PendÃªncias e lembretes' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: 'ðŸ’³', label: 'Contas', desc: 'Contas a pagar e filtros' },
      { tela: 'receitas', icon: 'RE', label: 'Receitas', desc: 'Entradas de loja' },
      { tela: 'recorrencias', icon: 'â†»', label: 'RecorrÃªncias', desc: 'SÃ©ries financeiras recorrentes' },
      { tela: 'controle-impostos', icon: 'TX', label: 'Controle de impostos', desc: 'Simples, FGTS e INSS' },
      { tela: 'fluxo-caixa', icon: 'FC', label: 'Fluxo de Caixa', desc: 'Realizado por ano e filial' },
      { tela: 'relatorios', icon: 'ðŸ“Š', label: 'RelatÃ³rios financeiros', desc: 'AnÃ¡lise e indicadores' },
      { tela: 'relatorios-contas', icon: 'RC', label: 'RelatÃ³rios de contas', desc: 'ImpressÃ£o e exportaÃ§Ã£o' },
      { tela: 'importar', icon: 'ðŸ“¥', label: 'ImportaÃ§Ã£o', desc: 'Importar contas por CSV' }
    ]
  },
  {
    id: 'pessoas',
    titulo: 'GestÃ£o de Pessoas',
    items: [
      { tela: 'relatorios-gestao-pessoas', icon: 'RG', label: 'Central de RelatÃ³rios', desc: 'Pessoas, fÃ©rias e folha', peopleOnly: true },
      { tela: 'funcionarios', icon: 'ðŸ‘¥', label: 'FuncionÃ¡rios', desc: 'Cadastro de colaboradores', peopleOnly: true },
      { tela: 'ferias', icon: 'ðŸŒ´', label: 'FÃ©rias', desc: 'PerÃ­odos aquisitivos e gozos', peopleOnly: true },
      { tela: 'fechamento-folha', icon: 'ðŸ§¾', label: 'Folha / Fechamento', desc: 'CompetÃªncias e lanÃ§amentos', peopleOnly: true }
    ]
  },
  {
    id: 'administracao',
    titulo: 'AdministraÃ§Ã£o',
    items: [
      { tela: 'usuarios', icon: 'ðŸ‘¥', label: 'UsuÃ¡rios e empresa', desc: 'Perfis, acessos e empresa' },
      { tela: 'master-empresas', icon: 'ðŸ¢', label: 'Empresas', desc: 'AdministraÃ§Ã£o de empresas', masterOnly: true },
      { tela: 'configuracoes', icon: 'âš™ï¸', label: 'ConfiguraÃ§Ãµes', desc: 'PreferÃªncias da empresa' },
      { tela: 'billing', icon: 'ðŸ’¼', label: 'Planos', desc: 'Plano atual e limites' },
      { tela: 'onboarding', icon: 'ðŸš€', label: 'Assistente inicial', desc: 'ConfiguraÃ§Ã£o da empresa' },
      { tela: 'lixeira', icon: 'ðŸ—‘ï¸', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' }
    ]
  }
]

export const MODULOS_TOPBAR = {
  geral: 'Ãrea de trabalho',
  financeiro: 'GestÃ£o Financeira',
  administracao: 'AdministraÃ§Ã£o',
  conta: 'Conta',
  pessoas: 'GestÃ£o de Pessoas'
}

const CONTEXTO_MODULO_POR_TELA = {
  dashboard: MODULOS_TOPBAR.geral,
  agenda: MODULOS_TOPBAR.geral,
  notas: MODULOS_TOPBAR.geral,

  contas: MODULOS_TOPBAR.financeiro,
  receitas: MODULOS_TOPBAR.financeiro,
  recorrencias: MODULOS_TOPBAR.financeiro,
  'controle-impostos': MODULOS_TOPBAR.financeiro,
  'fluxo-caixa': MODULOS_TOPBAR.financeiro,
  relatorios: MODULOS_TOPBAR.financeiro,
  'relatorios-contas': MODULOS_TOPBAR.financeiro,
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
  'relatorios-gestao-pessoas': MODULOS_TOPBAR.pessoas,
  'relatorios-pessoas': MODULOS_TOPBAR.pessoas,
  'relatorios-ferias': MODULOS_TOPBAR.pessoas
}

export function resolverContextoModulo(tela) {
  const chaveTela = String(tela || '').trim()
  return CONTEXTO_MODULO_POR_TELA[chaveTela] || MODULOS_TOPBAR.geral
}

export default menuSections
