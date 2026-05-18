const menuSections = [
  {
    id: 'principal',
    titulo: 'Principal',
    items: [
      { tela: 'dashboard', icon: '🏠', label: 'Painel', desc: 'Resumo financeiro' },
      { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Vencimentos e previsões' },
      { tela: 'notas', icon: '📝', label: 'Notas', desc: 'Pendências e histórico de notas' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: '💳', label: 'Contas', desc: 'Contas a pagar e filtros' }
    ]
  },
  {
    id: 'analise',
    titulo: 'Análise',
    items: [
      { tela: 'relatorios', icon: '📊', label: 'Relatórios', desc: 'Análises e indicadores' }
    ]
  },
  {
    id: 'master',
    titulo: 'Master',
    items: [
      { tela: 'master-empresas', icon: '🏢', label: 'Empresas', desc: 'Administração de empresas', masterOnly: true }
    ]
  },
  {
    id: 'sistema',
    titulo: 'Sistema',
    items: [
      { tela: 'usuarios', icon: '👥', label: 'Usuários', desc: 'Perfis, acessos e senhas' },
      { tela: 'configuracoes', icon: '⚙️', label: 'Configurações', desc: 'Preferências da empresa' },
      { tela: 'filiais', icon: '🏬', label: 'Configurações', desc: 'Unidades da empresa' },
      { tela: 'billing', icon: '💼', label: 'Plano comercial', desc: 'Planos, limites e contratação' },
      { tela: 'onboarding', icon: '🚀', label: 'Configuração inicial', desc: 'Preparação da empresa' },
      { tela: 'importar', icon: '📥', label: 'Importar contas', desc: 'Trazer contas por planilha' },
      { tela: 'lixeira', icon: '🗑️', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' }
    ]
  }
]

export default menuSections
