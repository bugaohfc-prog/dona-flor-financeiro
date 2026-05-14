const menuSections = [
  {
    id: 'principal',
    titulo: 'Principal',
    items: [
      { tela: 'dashboard', icon: '🏠', label: 'Dashboard', desc: 'Resumo financeiro' },
      { tela: 'agenda', icon: '📅', label: 'Agenda', desc: 'Vencimentos e previsões' },
      { tela: 'notas', icon: '📝', label: 'Bloco de Notas', desc: 'Pendências e histórico de notas' }
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
      { tela: 'master-empresas', icon: '🏢', label: 'Painel Master', desc: 'Empresas e tenants SaaS', masterOnly: true }
    ]
  },
  {
    id: 'sistema',
    titulo: 'Sistema',
    items: [
      { tela: 'usuarios', icon: '👥', label: 'Usuários', desc: 'Perfis, acessos e senhas' },
      { tela: 'configuracoes', icon: '⚙️', label: 'Configurações', desc: 'Preferências da empresa' },
      { tela: 'filiais', icon: '🏬', label: 'Filiais', desc: 'Unidades da empresa' },
      { tela: 'billing', icon: '💼', label: 'Billing', desc: 'Planos, limites e assinatura' },
      { tela: 'onboarding', icon: '🚀', label: 'Onboarding', desc: 'Implantação inicial SaaS' },
      { tela: 'importar', icon: '📥', label: 'Importar CSV', desc: 'Trazer histórico do Excel' },
      { tela: 'lixeira', icon: '🗑️', label: 'Lixeira', desc: 'Restaurar ou excluir definitivo' }
    ]
  }
]

export default menuSections
