const menuSections = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    items: [
      { tela: 'dashboard', icon: '🏠', label: 'Painel', desc: 'Resumo financeiro' },
      { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Vencimentos e previsões' }
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    items: [
      { tela: 'contas', icon: '💳', label: 'Contas', desc: 'Contas a pagar e filtros' },
      { tela: 'notas', icon: '📝', label: 'Notas', desc: 'Pendências e histórico de notas' },
      { tela: 'relatorios', icon: '📊', label: 'Relatórios', desc: 'Análises e indicadores' },
      { tela: 'importar', icon: '📥', label: 'Importar contas', desc: 'Trazer contas por planilha' }
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

export default menuSections
