const menuSections = [
  {
    id: 'dashboard',
    titulo: 'Área de trabalho',
    items: [
      { tela: 'dashboard', icon: 'AT', label: 'Área de trabalho', desc: 'Visão principal da empresa' },
      { tela: 'agenda', icon: 'AG', label: 'Agenda', desc: 'Compromissos e prazos' },
      { tela: 'notas', icon: 'NT', label: 'Notas', desc: 'Pendências e lembretes' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: 'CT', label: 'Contas', desc: 'Contas a pagar e filtros' },
      { tela: 'receitas', icon: 'RE', label: 'Receitas', desc: 'Entradas de loja' },
      { tela: 'recorrencias', icon: 'RC', label: 'Recorrências', desc: 'Séries financeiras recorrentes' },
      { tela: 'controle-impostos', icon: 'IM', label: 'Controle de impostos', desc: 'Simples, FGTS e INSS' },
      { tela: 'fluxo-caixa', icon: 'FC', label: 'Fluxo de Caixa', desc: 'Realizado por ano e filial' },
      { tela: 'relatorios', icon: 'RF', label: 'Relatórios financeiros', desc: 'Análise e indicadores' },
      { tela: 'relatorios-contas', icon: 'RC', label: 'Relatórios de contas', desc: 'Impressão e exportação' },
      { tela: 'importar', icon: 'IM', label: 'Importação', desc: 'Importar contas por CSV' }
    ]
  },
  {
    id: 'pessoas',
    titulo: 'Gestão de Pessoas',
    items: [
      { tela: 'relatorios-gestao-pessoas', icon: 'RG', label: 'Central de Relatórios', desc: 'Pessoas, férias e folha', peopleOnly: true },
      { tela: 'funcionarios', icon: 'FN', label: 'Funcionários', desc: 'Cadastro de colaboradores', peopleOnly: true },
      { tela: 'ferias', icon: 'FE', label: 'Férias', desc: 'Períodos aquisitivos e gozos', peopleOnly: true },
      { tela: 'fechamento-folha', icon: 'FF', label: 'Folha / Fechamento', desc: 'Competências e lançamentos', peopleOnly: true }
    ]
  },
  {
    id: 'administracao',
    titulo: 'Administração',
    items: [
      { tela: 'usuarios', icon: 'US', label: 'Usuários e empresa', desc: 'Perfis, acessos e empresa' },
      { tela: 'master-empresas', icon: 'EM', label: 'Empresas', desc: 'Administração de empresas', masterOnly: true },
      { tela: 'configuracoes', icon: 'CF', label: 'Configurações', desc: 'Preferências da empresa' },
      { tela: 'billing', icon: 'PL', label: 'Planos', desc: 'Plano atual e limites' },
      { tela: 'onboarding', icon: 'AI', label: 'Assistente inicial', desc: 'Configuração da empresa' },
      { tela: 'lixeira', icon: 'LX', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' },
      { tela: 'auditoria', icon: 'LG', label: 'Auditoria e logs', desc: 'Eventos administrativos e operacionais' }
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
  auditoria: MODULOS_TOPBAR.administracao,

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
